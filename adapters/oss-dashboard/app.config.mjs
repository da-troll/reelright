import {
  defineAppConfig,
  resolveAppConfig,
} from "../../adapter-runtime/config.mjs";

export const appConfig = defineAppConfig({
  id: "oss-dashboard",
  title: "Flatlogic React Dashboard",
  sourceRoot: "input/oss-dashboard",
  sourceCommands: {
    build: ["npm", "run", "build"],
    install: ["npm", "ci"],
  },
  upstream: {
    repository: "https://github.com/flatlogic/react-dashboard.git",
    commit: "c96bf57e88c7b674fda6a34b2bf52654e9c96fa6",
    license: "MIT",
  },
  designSize: {
    width: 1440,
    height: 1000,
  },
  rendering: {
    // Fractionally transformed edges produced two repeatable one-channel
    // raster variants when Chrome selected its backend implicitly.
    chromiumOpenGlRenderer: "swangle",
  },
  css: {
    entries: ["node_modules/bootstrap/dist/css/bootstrap.min.css"],
  },
  remotion: {
    entryPoint: "remotion-entry.tsx",
    configFile: "remotion.config.ts",
    tsconfig: "tsconfig.json",
  },
  bundler: {
    aliases: {
      reactstrap$: "adapters/oss-dashboard/shims/reactstrap.tsx",
    },
  },
  verification: {
    nativeParity: {
      status: "unavailable",
      reason:
        "Upstream has no isolated dashboard story or harness; the full native route includes its application shell.",
    },
    surfaces: {
      "OssDashboard-Main": {
        pixelTolerance: {
          bundler: { threshold: 0, maxChangedPixels: 0 },
          determinism: { threshold: 0, maxChangedPixels: 0 },
        },
      },
      "OssDashboard-Demo": {
        pixelTolerance: {
          bundler: { threshold: 0, maxChangedPixels: 0 },
          determinism: { threshold: 0, maxChangedPixels: 0 },
        },
      },
    },
  },
  moduleOwnership: [
    { package: "react", owner: "host" },
    { package: "react-dom", owner: "host" },
    { package: "@reduxjs/toolkit", owner: "app" },
    { package: "react-redux", owner: "app" },
    { package: "react-router", owner: "app" },
    { package: "react-router-dom", owner: "app" },
  ],
});

export const ossDashboardConfig = resolveAppConfig(appConfig);

export default appConfig;
