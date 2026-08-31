import process from "node:process";
import { getOwnedModuleAliases } from "./module-ownership.mjs";

export const DEFAULT_ADAPTER_OPENGL_RENDERER = "swangle";

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
  // Chrome's implicit/direct SwiftShader path can produce ±1-channel
  // antialiasing variants for fractionally transformed DOM edges across
  // otherwise identical browser processes. Pin ANGLE over SwiftShader so a
  // cloned workspace gets the same deterministic raster path in Studio,
  // still renders, and verification under both bundlers.
  Config.setChromiumOpenGlRenderer(DEFAULT_ADAPTER_OPENGL_RENDERER);

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
