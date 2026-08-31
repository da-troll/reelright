import { spawnSync } from "node:child_process";
import { viteProofConfig } from "../adapters/vite-proof/app.config.mjs";

const result = spawnSync(
  process.execPath,
  ["scripts/prepare-vite-proof.mjs", "--css-entry=src/index.css"],
  {
    cwd: viteProofConfig.repositoryRoot,
    encoding: "utf8",
  },
);
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

if (result.status === 0) {
  throw new Error(
    "Root font mutation guard failed: src/index.css was unexpectedly admitted",
  );
}

if (!output.includes("Scoped CSS cannot contain document-root font:")) {
  throw new Error(
    `Root font mutation guard failed for the wrong reason:\n${output.trim()}`,
  );
}

console.log("Root font mutation guard passed: src/index.css was rejected");
