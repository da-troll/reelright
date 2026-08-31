import { createRequire } from "node:module";
import path from "node:path";

const createHostRequire = (config) =>
  createRequire(path.join(config.repositoryRoot, "package.json"));

const appendSassRule = (configuration, config) => {
  const hostRequire = createHostRequire(config);
  const rules = configuration.module?.rules ?? [];

  return {
    ...configuration,
    module: {
      ...configuration.module,
      rules: [
        ...rules,
        {
          include: config.sourceRoot,
          test: /\.s[ac]ss$/i,
          use: [
            hostRequire.resolve("style-loader"),
            {
              loader: hostRequire.resolve("css-loader"),
              options: {
                importLoaders: 1,
                modules: {
                  auto: /\.module\.s[ac]ss$/i,
                  localIdentName: `${config.id}__[name]__[local]__[hash:base64:5]`,
                  namedExport: false,
                },
              },
            },
            {
              loader: hostRequire.resolve("sass-loader"),
              options: {
                implementation: hostRequire("sass"),
                sassOptions: { quietDeps: true },
              },
            },
          ],
        },
      ],
    },
  };
};

export const createWebpackSassOverride = (config) => (configuration) =>
  appendSassRule(configuration, config);

export const createRspackSassOverride = (config) => (configuration) =>
  appendSassRule(configuration, config);
