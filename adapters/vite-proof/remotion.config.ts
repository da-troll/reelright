import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";
import { applyAdapterBundlerConfig } from "../../adapter-runtime/bundler.mjs";
import { viteProofConfig } from "./app.config.mjs";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
applyAdapterBundlerConfig({
  Config,
  config: viteProofConfig,
  portable: [enableTailwind],
});
