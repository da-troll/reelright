import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runPreflight } from "../adapter-runtime/preflight.mjs";
import { compileScopedCss } from "../adapter-runtime/scoped-css.mjs";
import { nextPlaygroundConfig } from "../adapters/next-playground/app.config.mjs";

const { report } = await runPreflight(nextPlaygroundConfig);

assert.equal(report.framework, "next");
assert.ok(report.clientBoundaryFiles.length > 0);
assert.ok(report.serverOnlyFiles.some((file) => file.endsWith("/lib/db.ts")));
assert.equal(
  report.reachableSourceFiles.some((file) => file.endsWith("/lib/db.ts")),
  false,
);
assert.deepEqual(report.ownershipCompatibility.react, {
  range: ">=16.8.0",
  source: "remotion peerDependencies",
});

const { outputPath } = await compileScopedCss(nextPlaygroundConfig);
const scopedCss = await readFile(outputPath, "utf8");

assert.match(scopedCss, /data-native-app=next-playground/);
assert.match(scopedCss, /\.lg\\:grid-cols-3/);

const aliasesWithoutDatabaseShim = Object.fromEntries(
  Object.entries(nextPlaygroundConfig.bundler.aliases).filter(
    ([specifier]) => specifier !== "#/lib/db$",
  ),
);

await assert.rejects(
  runPreflight({
    ...nextPlaygroundConfig,
    bundler: {
      ...nextPlaygroundConfig.bundler,
      aliases: aliasesWithoutDatabaseShim,
    },
  }),
  /reaches server-only modules:[\s\S]*input\/next-playground\/lib\/db\.ts/,
);

console.log("Next.js reachable server-only guard passed");
