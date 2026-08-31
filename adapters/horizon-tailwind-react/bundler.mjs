import path from "node:path";

// horizon-tailwind-react resolves its own internal imports (`layouts/admin`,
// `components/navbar`, `routes.js`, ...) as bare specifiers rooted at its
// `src/` directory -- Create React App implements this via the app's
// jsconfig.json `baseUrl: "src"`. The generic adapter bundler config only
// supports per-specifier aliases (adapter-runtime/config.mjs `bundler.
// aliases`), which would require one entry per bare import across the whole
// app. Adding the app's `src/` directory to `resolve.modules` reproduces
// baseUrl-style resolution generically, the same way Node/webpack already
// search `node_modules` -- this stays adapter-local (quarantined here rather
// than in the shared adapter-runtime) and is applied identically for both
// bundlers to keep Webpack/Rspack behavior portable.
export const addBaseUrlModuleResolution = (config) => (currentConfiguration) => ({
  ...currentConfiguration,
  resolve: {
    ...currentConfiguration.resolve,
    modules: [
      ...(currentConfiguration.resolve?.modules ?? ["node_modules"]),
      path.join(config.sourceRoot, "src"),
    ],
  },
});
