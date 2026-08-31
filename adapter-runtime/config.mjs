import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const APP_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CHROMIUM_OPENGL_RENDERERS = new Set([
  "angle",
  "angle-egl",
  "egl",
  "swangle",
  "swiftshader",
  "vulkan",
]);

const requiredString = (value, label) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value;
};

export const defineAppConfig = (config) => {
  requiredString(config?.id, "Adapter id");
  requiredString(config?.title, "Adapter title");

  if (!APP_ID_PATTERN.test(config.id)) {
    throw new Error(`Adapter id must be kebab-case: ${config.id}`);
  }

  if (
    !Number.isInteger(config.designSize?.width) ||
    !Number.isInteger(config.designSize?.height) ||
    config.designSize.width <= 0 ||
    config.designSize.height <= 0
  ) {
    throw new Error(`Adapter ${config.id} has an invalid designSize`);
  }

  if (
    !Array.isArray(config.moduleOwnership) ||
    config.moduleOwnership.length === 0
  ) {
    throw new Error(`Adapter ${config.id} must declare moduleOwnership`);
  }

  if (
    config.rendering !== undefined &&
    (config.rendering === null ||
      typeof config.rendering !== "object" ||
      Array.isArray(config.rendering))
  ) {
    throw new Error(`Adapter ${config.id} has an invalid rendering config`);
  }

  const openGlRenderer = config.rendering?.chromiumOpenGlRenderer;
  if (
    openGlRenderer !== undefined &&
    !CHROMIUM_OPENGL_RENDERERS.has(openGlRenderer)
  ) {
    throw new Error(
      `Adapter ${config.id} has an invalid Chromium OpenGL renderer: ${openGlRenderer}`,
    );
  }

  return Object.freeze(config);
};

export const resolveAppConfig = (config, repositoryRoot = undefined) => {
  const root = path.resolve(
    repositoryRoot ?? process.env.REMOTION_PROJECT_ROOT ?? process.cwd(),
  );
  const adapterRoot = path.resolve(
    root,
    config.adapterRoot ?? `adapters/${config.id}`,
  );

  return Object.freeze({
    ...config,
    adapterRoot,
    repositoryRoot: root,
    sourceRoot: path.resolve(root, config.sourceRoot ?? `input/${config.id}`),
    generatedRoot: path.resolve(root, `.remotion-app/${config.id}`),
    scopeSelector: `[data-native-app="${config.id}"]`,
    remotion: {
      entryPoint: path.resolve(adapterRoot, config.remotion.entryPoint),
      configFile: path.resolve(adapterRoot, config.remotion.configFile),
      tsconfig: path.resolve(adapterRoot, config.remotion.tsconfig),
    },
    bundler: {
      ...config.bundler,
      aliases: Object.fromEntries(
        Object.entries(config.bundler?.aliases ?? {}).map(
          ([specifier, target]) => [specifier, path.resolve(root, target)],
        ),
      ),
    },
  });
};

export const loadAppConfig = async (appId, repositoryRoot = process.cwd()) => {
  if (!APP_ID_PATTERN.test(appId)) {
    throw new Error(`Invalid app id: ${appId}`);
  }

  const configPath = path.resolve(
    repositoryRoot,
    `adapters/${appId}/app.config.mjs`,
  );

  try {
    await access(configPath);
  } catch {
    throw new Error(`No adapter config exists for ${appId}: ${configPath}`);
  }

  const module = await import(pathToFileURL(configPath).href);
  const config = module.appConfig ?? module.default;

  if (!config) {
    throw new Error(`${configPath} must export appConfig or a default config`);
  }

  return resolveAppConfig(defineAppConfig(config), repositoryRoot);
};
