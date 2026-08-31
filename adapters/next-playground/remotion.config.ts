import { Config } from "@remotion/cli/config";
import { applyAdapterBundlerConfig } from "../../adapter-runtime/bundler.mjs";
import { nextPlaygroundConfig } from "./app.config.mjs";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
applyAdapterBundlerConfig({ Config, config: nextPlaygroundConfig });
