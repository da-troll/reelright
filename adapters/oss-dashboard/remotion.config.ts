import { Config } from "@remotion/cli/config";
import { applyAdapterBundlerConfig } from "../../adapter-runtime/bundler.mjs";
import {
  createRspackSassOverride,
  createWebpackSassOverride,
} from "../../adapter-runtime/bundlers/sass.mjs";
import { ossDashboardConfig } from "./app.config.mjs";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
applyAdapterBundlerConfig({
  Config,
  config: ossDashboardConfig,
  rspackOverride: createRspackSassOverride(ossDashboardConfig),
  webpackOverride: createWebpackSassOverride(ossDashboardConfig),
});
