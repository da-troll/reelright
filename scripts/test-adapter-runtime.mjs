import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import { applyAdapterBundlerConfig } from "../adapter-runtime/bundler.mjs";
import { defineAppConfig } from "../adapter-runtime/config.mjs";
import { getOwnedModuleAliases } from "../adapter-runtime/module-ownership.mjs";
import {
  hasAsyncExportedComponent,
  validateOwnedPackageCompatibility,
} from "../adapter-runtime/preflight.mjs";
import { compileScopedCss } from "../adapter-runtime/scoped-css.mjs";
import {
  getRepresentativeFrames,
  parseCompositionListing,
} from "../adapter-runtime/verify.mjs";
import { viteProofConfig } from "../adapters/vite-proof/app.config.mjs";

const aliases = getOwnedModuleAliases(viteProofConfig);

const applyConfigWithHarness = (config) => {
  const state = { openGlRenderer: null, overrides: [] };
  const Config = {
    overrideBundlerConfig: (override) => state.overrides.push(override),
    overrideRspackConfig: () => {
      throw new Error("Webpack test path must not configure Rspack");
    },
    overrideWebpackConfig: (override) => state.overrides.push(override),
    setChromiumOpenGlRenderer: (renderer) => {
      state.openGlRenderer = renderer;
    },
  };

  applyAdapterBundlerConfig({ Config, config });
  return state;
};

const defaultRendererState = applyConfigWithHarness(viteProofConfig);
assert.equal(defaultRendererState.openGlRenderer, null);
assert.equal(defaultRendererState.overrides.length, 2);

const pinnedRendererConfig = defineAppConfig({
  ...viteProofConfig,
  rendering: { chromiumOpenGlRenderer: "swangle" },
});
const pinnedRendererState = applyConfigWithHarness(pinnedRendererConfig);
assert.equal(pinnedRendererState.openGlRenderer, "swangle");
assert.equal(pinnedRendererState.overrides.length, 2);

assert.throws(
  () =>
    defineAppConfig({
      ...viteProofConfig,
      rendering: { chromiumOpenGlRenderer: "not-a-renderer" },
    }),
  /invalid Chromium OpenGL renderer/,
);

for (const requiredSpecifier of [
  "react$",
  "react/jsx-runtime$",
  "react-dom/client$",
  "react-dom/server$",
  "zod/v4/core$",
]) {
  assert.ok(
    path.isAbsolute(aliases[requiredSpecifier]),
    `${requiredSpecifier} must resolve to an absolute owner path`,
  );
}

assert.equal(
  Object.keys(aliases).some((specifier) => specifier.includes("*")),
  false,
  "Wildcard exports must not become ambiguous bundler aliases",
);

const { outputPath } = await compileScopedCss(viteProofConfig);
const generatedCss = postcss.parse(await readFile(outputPath, "utf8"));

generatedCss.walkAtRules(/^(?:font-face|property)$/, (atRule) => {
  assert.equal(
    atRule.parent,
    generatedCss,
    `@${atRule.name} must be hoisted to document scope`,
  );
});

const listedRenderables = parseCompositionListing(`
Native-Still            1920x1080      Still
Native-Demo    30      1920x1080      120 (4.00 sec)
`);

assert.deepEqual(
  listedRenderables.map(({ id, kind }) => ({ id, kind })),
  [
    { id: "Native-Still", kind: "still" },
    { id: "Native-Demo", kind: "composition" },
  ],
);
assert.deepEqual(getRepresentativeFrames(listedRenderables[0]), [0]);
assert.deepEqual(getRepresentativeFrames(listedRenderables[1]), [0, 59, 119]);
assert.throws(
  () => getRepresentativeFrames(listedRenderables[1], [120]),
  /Invalid verification frame/,
);

assert.equal(
  hasAsyncExportedComponent("export const Page = async () => null;"),
  true,
);
assert.equal(
  hasAsyncExportedComponent("export const loadData = async () => null;"),
  false,
);

assert.throws(
  () =>
    validateOwnedPackageCompatibility({
      appPackageJson: { dependencies: { react: "15.7.0" } },
      hostPackageJson: { dependencies: { react: "19.2.8" } },
      ownership: {
        packages: {
          react: { owner: "app", version: "15.7.0" },
        },
      },
      remotionPackageJson: { peerDependencies: { react: ">=16.8.0" } },
    }),
  /App-owned react@15\.7\.0 does not satisfy remotion peerDependencies range >=16\.8\.0/,
);

console.log(
  `Adapter runtime ownership test passed with ${Object.keys(aliases).length} aliases`,
);
