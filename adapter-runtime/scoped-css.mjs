import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

const isInsideKeyframes = (node) => {
  let parent = node.parent;

  while (parent) {
    if (parent.type === "atrule" && parent.name.endsWith("keyframes")) {
      return true;
    }

    parent = parent.parent;
  }

  return false;
};

const scopeAttribute = (appId) =>
  selectorParser.attribute({
    attribute: "data-native-app",
    operator: "=",
    quoteMark: '"',
    value: appId,
  });

const isDocumentRootNode = (node) =>
  (node.type === "pseudo" && node.value === ":root") ||
  (node.type === "tag" && (node.value === "html" || node.value === "body"));

const isRemRootNode = (node) =>
  (node.type === "pseudo" && node.value === ":root") ||
  (node.type === "tag" && node.value === "html");

const hasRemRootSelector = (selector) => {
  let found = false;

  selectorParser((root) => {
    root.walk((node) => {
      if (isRemRootNode(node)) {
        found = true;
      }
    });
  }).processSync(selector);

  return found;
};

const scopedSelector = (selector, appId) => {
  return selectorParser((root) => {
    root.each((childSelector) => {
      const documentRoots = [];

      childSelector.walk((node) => {
        if (isDocumentRootNode(node)) {
          documentRoots.push(node);
        }
      });

      if (documentRoots.length === 0) {
        childSelector.prepend(selectorParser.combinator({ value: " " }));
        childSelector.prepend(scopeAttribute(appId));
        return;
      }

      documentRoots[0].replaceWith(scopeAttribute(appId));

      for (const duplicateRoot of documentRoots.slice(1)) {
        const previous = duplicateRoot.prev();

        if (previous?.type === "combinator") {
          previous.remove();
        }

        duplicateRoot.remove();
      }
    });
  }).processSync(selector);
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// One canonical string per @property body so identical registrations (for
// example Tailwind v4's --tw-* internals emitted by several adapters) compare
// as compatible while genuinely different definitions still collide.
const serializePropertyDefinition = (atRule) => {
  const declarations = [];

  atRule.walkDecls((declaration) => {
    declarations.push(`${declaration.prop}:${declaration.value.trim()}`);
  });

  return declarations.sort().join(";");
};

const readRegisteredProperties = async (config) => {
  const generatedRoot = path.resolve(config.repositoryRoot, ".remotion-app");
  const properties = new Map();

  try {
    const entries = await readdir(generatedRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === config.id) {
        continue;
      }

      try {
        const manifest = JSON.parse(
          await readFile(
            path.join(generatedRoot, entry.name, "style-manifest.json"),
            "utf8",
          ),
        );
        const registered = manifest.registeredProperties ?? [];
        const asEntries = Array.isArray(registered)
          ? registered.map((property) => [property, undefined])
          : Object.entries(registered);

        for (const [property, definition] of asEntries) {
          properties.set(property, { definition, owner: entry.name });
        }
      } catch {
        // An adapter without a style manifest has no registered properties.
      }
    }
  } catch {
    // The generated root does not exist on a clean checkout.
  }

  return properties;
};

const preprocessCss = async (config, file, source) => {
  const processor = config.css.processor ?? "plain";

  if (processor === "plain") {
    return source;
  }

  if (processor === "tailwind-v4") {
    const appRequire = createRequire(
      path.join(config.sourceRoot, "package.json"),
    );
    const pluginPath = appRequire.resolve("@tailwindcss/postcss");
    const tailwindModule = await import(pathToFileURL(pluginPath).href);
    const explicitSources = (config.css.sources ?? [])
      .map((sourceRoot) => {
        const absoluteSource = path.resolve(config.repositoryRoot, sourceRoot);
        const relativeSource = path
          .relative(path.dirname(file), absoluteSource)
          .split(path.sep)
          .join("/");

        return `@source "${relativeSource.startsWith(".") ? relativeSource : `./${relativeSource}`}";`;
      })
      .join("\n");
    const result = await postcss([
      tailwindModule.default({ base: config.sourceRoot }),
    ]).process(`${source}\n${explicitSources}`, { from: file });

    return result.css;
  }

  throw new Error(`Unsupported CSS processor for ${config.id}: ${processor}`);
};

export const compileScopedCss = async (config, options = {}) => {
  const cssEntries = options.cssEntries ?? config.css.entries;
  const sourceFiles = cssEntries.map((entry) =>
    path.resolve(config.sourceRoot, entry),
  );
  const sourceCss = await Promise.all(
    sourceFiles.map(async (file) => {
      const source = await readFile(file, "utf8");
      const processed = await preprocessCss(config, file, source);

      return `/* source: ${path.relative(config.repositoryRoot, file)} */\n${processed}`;
    }),
  );
  const root = postcss.parse(sourceCss.join("\n"));
  const registeredProperties = new Map();
  const externalProperties = await readRegisteredProperties(config);
  const namespacedKeyframes = new Map();
  const documentAtRules = [];

  root.walkAtRules((atRule) => {
    if (atRule.name === "property") {
      const propertyName = atRule.params.trim();
      const definition = serializePropertyDefinition(atRule);
      const external = externalProperties.get(propertyName);

      if (registeredProperties.has(propertyName)) {
        if (registeredProperties.get(propertyName) !== definition) {
          throw new Error(
            `Duplicate registered CSS property with conflicting definitions: ${propertyName}`,
          );
        }

        atRule.remove();
        return;
      }
      if (propertyName.startsWith("--remotion-")) {
        throw new Error(
          `Registered CSS property collides with engine scope: ${propertyName}`,
        );
      }
      if (external && external.definition !== definition) {
        throw new Error(
          `Registered CSS property ${propertyName} collides with adapter ` +
            `${external.owner} under a different definition`,
        );
      }

      registeredProperties.set(propertyName, definition);
    }

    if (
      (atRule.name === "property" || atRule.name === "font-face") &&
      atRule.parent !== root
    ) {
      documentAtRules.push(atRule);
    }

    if (atRule.name.endsWith("keyframes")) {
      const originalName = atRule.params.trim();
      const namespacedName = `${config.id}__${originalName}`;
      namespacedKeyframes.set(originalName, namespacedName);
      atRule.params = namespacedName;
    }
  });

  for (const atRule of documentAtRules.reverse()) {
    atRule.remove();
    root.prepend(atRule);
  }

  root.walkRules((rule) => {
    if (isInsideKeyframes(rule)) {
      return;
    }

    if (hasRemRootSelector(rule.selector)) {
      for (const node of rule.nodes ?? []) {
        if (
          node.type === "decl" &&
          (node.prop === "font-size" || node.prop === "font")
        ) {
          throw new Error(
            `Scoped CSS cannot contain document-root ${node.prop}: ${node.toString()}`,
          );
        }
      }
    }

    rule.selector = scopedSelector(rule.selector, config.id);
  });

  root.walkDecls((declaration) => {
    if (
      ![
        "-webkit-animation",
        "-webkit-animation-name",
        "animation",
        "animation-name",
      ].includes(declaration.prop)
    ) {
      return;
    }

    for (const [originalName, namespacedName] of namespacedKeyframes) {
      declaration.value = declaration.value.replace(
        new RegExp(`\\b${escapeRegExp(originalName)}\\b`, "g"),
        namespacedName,
      );
    }
  });

  root.append(
    postcss.parse(`
${config.scopeSelector},
${config.scopeSelector} *,
${config.scopeSelector} *::before,
${config.scopeSelector} *::after {
  animation: none !important;
  caret-color: transparent !important;
  transition: none !important;
}

/* Overlay scrollbars flash and fade on browser timers, outside CSS animation
 * control; their fade tail is a nondeterministic screenshot hazard. Make the
 * thumb/track transparent instead of removing the scrollbar box (\`display:
 * none\` / \`scrollbar-width: none\`): Remotion's headless Chromium renders
 * classic, space-reserving scrollbars, so removing the box changes a
 * scrollable container's content width and can race with any native
 * component that measures its own size (ResizeObserver, chart libraries),
 * producing render-to-render nondeterminism instead of fixing it. Keeping
 * the box and only hiding its paint changes nothing about layout.
 */
${config.scopeSelector} *::-webkit-scrollbar-thumb,
${config.scopeSelector} *::-webkit-scrollbar-track {
  background: transparent !important;
}
`),
  );

  const outputCss = `/* Generated by the native app adapter runtime. */\n${root.toString()}`;
  const outputPath = path.join(config.generatedRoot, "app.css");
  const manifestPath = path.join(config.generatedRoot, "style-manifest.json");
  const manifest = {
    appId: config.id,
    processor: config.css.processor ?? "plain",
    keyframes: Object.fromEntries(namespacedKeyframes),
    registeredProperties: Object.fromEntries(registeredProperties),
    scopeSelector: config.scopeSelector,
    sourceHash: createHash("sha256").update(sourceCss.join("\n")).digest("hex"),
    sources: sourceFiles.map((file) =>
      path.relative(config.repositoryRoot, file),
    ),
  };

  await mkdir(config.generatedRoot, { recursive: true });
  await writeFile(outputPath, outputCss);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { manifest, manifestPath, outputPath };
};
