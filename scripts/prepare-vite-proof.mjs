import path from "node:path";
import { compileScopedCss } from "../adapter-runtime/scoped-css.mjs";
import { viteProofConfig } from "../adapters/vite-proof/app.config.mjs";

const requestedCssEntries = process.argv
  .slice(2)
  .filter((argument) => argument.startsWith("--css-entry="))
  .map((argument) => argument.slice("--css-entry=".length));
const { outputPath } = await compileScopedCss(viteProofConfig, {
  cssEntries: requestedCssEntries.length > 0 ? requestedCssEntries : undefined,
});

console.log(
  `Prepared scoped CSS at ${path.relative(viteProofConfig.repositoryRoot, outputPath)}`,
);
