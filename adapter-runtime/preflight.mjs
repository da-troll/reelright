import { existsSync, statSync } from "node:fs";
import { readFile, readdir, stat, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import semver from "semver";
import { createModuleOwnershipReport } from "./module-ownership.mjs";

const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
]);
const serverOnlySpecifiers = new Set([
  "next/cache",
  "next/headers",
  "next/server",
  "server-only",
]);

const walkSourceFiles = async (root) => {
  const output = [];

  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      output.push(...(await walkSourceFiles(entryPath)));
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      output.push(entryPath);
    }
  }

  return output;
};

const resolveSourceFile = (candidate) => {
  const candidates = [
    candidate,
    ...[...sourceExtensions].map((extension) => `${candidate}${extension}`),
    ...[...sourceExtensions].map((extension) =>
      path.join(candidate, `index${extension}`),
    ),
  ];

  for (const file of candidates) {
    try {
      if (existsSync(file) && statSync(file).isFile()) {
        return path.resolve(file);
      }
    } catch {
      // Continue trying extension and index variants.
    }
  }

  return null;
};

const resolveManualAlias = (specifier, aliases) => {
  const entries = Object.entries(aliases).sort(
    ([left], [right]) => right.length - left.length,
  );

  for (const [rawKey, target] of entries) {
    const exact = rawKey.endsWith("$");
    const key = exact ? rawKey.slice(0, -1) : rawKey;

    if (specifier === key) {
      return target;
    }
    if (!exact && specifier.startsWith(`${key}/`)) {
      return path.join(target, specifier.slice(key.length + 1));
    }
  }

  return null;
};

const resolveImportedSource = ({ config, fromFile, specifier }) => {
  const aliased = resolveManualAlias(specifier, config.bundler?.aliases ?? {});
  const candidate = aliased
    ? aliased
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(fromFile), specifier)
      : null;

  if (!candidate) {
    return null;
  }

  const resolved = resolveSourceFile(candidate);

  if (!resolved) {
    return null;
  }

  const relative = path.relative(config.sourceRoot, resolved);

  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
    ? resolved
    : null;
};

const importedSpecifiers = (source) => {
  const imports = new Set();
  const patterns = [
    /\b(?:import|export)\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["']/g,
    /\brequire\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      imports.add(match[1]);
    }
  }

  return imports;
};

const declaredRange = (packageJson, packageName) =>
  packageJson.dependencies?.[packageName] ??
  packageJson.devDependencies?.[packageName] ??
  packageJson.peerDependencies?.[packageName];

const defaultInspectedPackages = ["react", "react-dom", "zod"];

export const hasAsyncExportedComponent = (source) =>
  /\bexport\s+(?:default\s+)?async\s+function\s+[A-Z]/.test(source) ||
  /\bexport\s+const\s+[A-Z][\w$]*\s*=\s*async\b/.test(source) ||
  /\bexport\s+default\s+async\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(
    source,
  );

const appOwnedConstraint = ({
  hostPackageJson,
  packageName,
  remotionPackageJson,
}) => {
  if (packageName === "react" || packageName === "react-dom") {
    return {
      range: remotionPackageJson.peerDependencies?.[packageName] ?? null,
      source: "remotion peerDependencies",
    };
  }

  return {
    range: declaredRange(hostPackageJson, packageName) ?? null,
    source: "host package.json",
  };
};

export const validateOwnedPackageCompatibility = ({
  appPackageJson,
  hostPackageJson,
  ownership,
  remotionPackageJson,
}) => {
  const constraints = {};

  for (const [packageName, packageReport] of Object.entries(
    ownership.packages,
  )) {
    const constraint =
      packageReport.owner === "host"
        ? {
            range: declaredRange(appPackageJson, packageName) ?? null,
            source: "app package.json",
          }
        : appOwnedConstraint({
            hostPackageJson,
            packageName,
            remotionPackageJson,
          });

    constraints[packageName] = constraint;

    if (
      constraint.range &&
      semver.validRange(constraint.range) &&
      !semver.satisfies(packageReport.version, constraint.range)
    ) {
      throw new Error(
        `${packageReport.owner === "host" ? "Host" : "App"}-owned ` +
          `${packageName}@${packageReport.version} does not satisfy ` +
          `${constraint.source} range ${constraint.range}`,
      );
    }
  }

  return constraints;
};

export const runPreflight = async (config) => {
  const packagePath = path.join(config.sourceRoot, "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  const repositoryPackageJson = JSON.parse(
    await readFile(path.join(config.repositoryRoot, "package.json"), "utf8"),
  );
  const remotionPackageJson = JSON.parse(
    await readFile(
      path.join(config.repositoryRoot, "node_modules/remotion/package.json"),
      "utf8",
    ),
  );
  const ownership = createModuleOwnershipReport(config);
  const aliases = new Set(Object.keys(ownership.aliases));
  const sourceFiles = await walkSourceFiles(config.sourceRoot);
  const adapterFiles = await walkSourceFiles(config.adapterRoot);
  const allImports = new Set();
  const asyncComponentFiles = [];
  const clientBoundaryFiles = [];
  const fileImports = new Map();
  const frameworkImports = new Set();
  const serverOnlyFiles = [];

  for (const file of [...sourceFiles, ...adapterFiles]) {
    const source = await readFile(file, "utf8");
    const imports = importedSpecifiers(source);

    fileImports.set(file, imports);

    for (const specifier of imports) {
      allImports.add(specifier);

      if (specifier === "next" || specifier.startsWith("next/")) {
        frameworkImports.add(specifier);
      }
    }

    if (
      /^["']use server["'];?/m.test(source) ||
      [...imports].some((specifier) => serverOnlySpecifiers.has(specifier))
    ) {
      serverOnlyFiles.push(path.relative(config.repositoryRoot, file));
    }

    if (/^["']use client["'];?/m.test(source)) {
      clientBoundaryFiles.push(path.relative(config.repositoryRoot, file));
    }

    if (hasAsyncExportedComponent(source)) {
      asyncComponentFiles.push(path.relative(config.repositoryRoot, file));
    }
  }

  const reachableSourceFiles = new Set();
  const queue = [];

  for (const adapterFile of adapterFiles) {
    for (const specifier of fileImports.get(adapterFile) ?? []) {
      const resolved = resolveImportedSource({
        config,
        fromFile: adapterFile,
        specifier,
      });

      if (resolved) {
        queue.push(resolved);
      }
    }
  }

  while (queue.length > 0) {
    const file = queue.shift();

    if (reachableSourceFiles.has(file)) {
      continue;
    }

    reachableSourceFiles.add(file);

    for (const specifier of fileImports.get(file) ?? []) {
      const resolved = resolveImportedSource({
        config,
        fromFile: file,
        specifier,
      });

      if (resolved && !reachableSourceFiles.has(resolved)) {
        queue.push(resolved);
      }
    }
  }

  const reachableRelativeFiles = [...reachableSourceFiles].map((file) =>
    path.relative(config.repositoryRoot, file),
  );
  const reachableServerOnlyFiles = serverOnlyFiles.filter((file) =>
    reachableRelativeFiles.includes(file),
  );
  const reachableAsyncComponentFiles = asyncComponentFiles.filter((file) =>
    reachableRelativeFiles.includes(file),
  );

  if (reachableServerOnlyFiles.length > 0) {
    throw new Error(
      `Adapter ${config.id} reaches server-only modules:\n${reachableServerOnlyFiles.join("\n")}`,
    );
  }

  if (reachableAsyncComponentFiles.length > 0) {
    throw new Error(
      `Adapter ${config.id} reaches async server components:\n${reachableAsyncComponentFiles.join("\n")}`,
    );
  }

  const ownershipCompatibility = validateOwnedPackageCompatibility({
    appPackageJson: packageJson,
    hostPackageJson: repositoryPackageJson,
    ownership,
    remotionPackageJson,
  });

  for (const packageName of Object.keys(ownership.packages)) {
    for (const specifier of allImports) {
      if (
        (specifier === packageName ||
          specifier.startsWith(`${packageName}/`)) &&
        !aliases.has(specifier)
      ) {
        throw new Error(
          `Owned module import ${specifier} is not covered by an absolute alias`,
        );
      }
    }
  }

  for (const cssEntry of config.css.entries) {
    const cssPath = path.resolve(config.sourceRoot, cssEntry);
    const cssStat = await stat(cssPath);

    if (!cssStat.isFile()) {
      throw new Error(`CSS entry is not a file: ${cssPath}`);
    }
  }

  const report = {
    appId: config.id,
    asyncComponentFiles,
    clientBoundaryFiles,
    framework: packageJson.dependencies?.next
      ? "next"
      : packageJson.devDependencies?.vite
        ? "vite"
        : "unknown",
    frameworkImports: [...frameworkImports].sort(),
    importedOwnedSpecifiers: [...allImports]
      .filter((specifier) => aliases.has(specifier))
      .sort(),
    moduleOwnership: ownership,
    ownershipCompatibility,
    inspectedPackageRanges: Object.fromEntries(
      [
        ...new Set([
          ...defaultInspectedPackages,
          ...(config.preflight?.watchPackages ?? []),
        ]),
      ].map((packageName) => [
        packageName,
        {
          app: declaredRange(packageJson, packageName) ?? null,
          host: declaredRange(repositoryPackageJson, packageName) ?? null,
          owner: ownership.packages[packageName]?.owner ?? null,
        },
      ]),
    ),
    packageManager:
      packageJson.packageManager ??
      ((await readdir(config.sourceRoot)).includes("pnpm-lock.yaml")
        ? "pnpm"
        : (await readdir(config.sourceRoot)).includes("package-lock.json")
          ? "npm"
          : "unknown"),
    reachableSourceFiles: reachableRelativeFiles.sort(),
    serverOnlyFiles,
    sourceFileCount: sourceFiles.length,
    upstream: config.upstream ?? null,
  };
  const reportPath = path.join(config.generatedRoot, "preflight.json");

  await mkdir(config.generatedRoot, { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  return { report, reportPath };
};
