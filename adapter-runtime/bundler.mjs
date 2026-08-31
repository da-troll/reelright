import process from "node:process";
import { getOwnedModuleAliases } from "./module-ownership.mjs";

export const createPortableBundlerOverride = (config) => {
  const ownedAliases = getOwnedModuleAliases(config);

  return (currentConfiguration) => {
    const currentAliases = currentConfiguration.resolve?.alias ?? {};

    if (Array.isArray(currentAliases)) {
      throw new Error(
        `Adapter ${config.id} requires object-form bundler aliases`,
      );
    }

    return {
      ...currentConfiguration,
      resolve: {
        ...currentConfiguration.resolve,
        alias: {
          ...currentAliases,
          ...ownedAliases,
          ...(config.bundler?.aliases ?? {}),
        },
        symlinks: true,
      },
    };
  };
};

const identityOverride = (configuration) => configuration;

export const applyAdapterBundlerConfig = ({
  Config,
  config,
  portable = [],
  rspackOverride,
  webpackOverride,
}) => {
  for (const override of portable) {
    Config.overrideBundlerConfig(override);
  }

  Config.overrideBundlerConfig(createPortableBundlerOverride(config));

  // Keep the two bundler hooks explicit even while an adapter needs no
  // specialized behavior. A future Webpack-only plugin cannot leak into Rspack.
  if (process.argv.includes("--rspack")) {
    Config.overrideRspackConfig(rspackOverride ?? identityOverride);
  } else {
    Config.overrideWebpackConfig(webpackOverride ?? identityOverride);
  }
};
