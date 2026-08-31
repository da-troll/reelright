import { Config } from "@remotion/cli/config";
import { applyAdapterBundlerConfig } from "../../adapter-runtime/bundler.mjs";
import { addBaseUrlModuleResolution } from "./bundler.mjs";
import { horizonTailwindReactConfig } from "./app.config.mjs";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

applyAdapterBundlerConfig({
  Config,
  config: horizonTailwindReactConfig,
  rspackOverride: addBaseUrlModuleResolution(horizonTailwindReactConfig),
  webpackOverride: addBaseUrlModuleResolution(horizonTailwindReactConfig),
});
