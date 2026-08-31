import path from "node:path";
import { runPreflight } from "../adapter-runtime/preflight.mjs";
import { viteProofConfig } from "../adapters/vite-proof/app.config.mjs";

const { report, reportPath } = await runPreflight(viteProofConfig);

console.log(
  `Preflight passed for ${viteProofConfig.id}: ` +
    `${Object.keys(report.moduleOwnership.aliases).length} absolute aliases; ` +
    path.relative(viteProofConfig.repositoryRoot, reportPath),
);
