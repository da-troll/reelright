import { createPortableBundlerOverride } from "../../adapter-runtime/bundler.mjs";
import { getOwnedModuleAliases as getGenericOwnedModuleAliases } from "../../adapter-runtime/module-ownership.mjs";
import { viteProofConfig } from "./app.config.mjs";

export const getOwnedModuleAliases = () =>
  getGenericOwnedModuleAliases(viteProofConfig);

export const viteProofBundlerOverride =
  createPortableBundlerOverride(viteProofConfig);
