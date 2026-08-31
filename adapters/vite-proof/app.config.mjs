import {
  defineAppConfig,
  resolveAppConfig,
} from "../../adapter-runtime/config.mjs";

export const appConfig = defineAppConfig({
  id: "vite-proof",
  title: "Vite native import proof",
  sourceRoot: "input/vite-proof",
  sourceCommands: {
    build: ["npm", "run", "build"],
    install: ["npm", "ci"],
  },
  designSize: {
    width: 1440,
    height: 900,
  },
  css: {
    entries: ["src/demo/demo.css"],
  },
  remotion: {
    entryPoint: "remotion-entry.tsx",
    configFile: "remotion.config.ts",
    tsconfig: "tsconfig.json",
  },
  verification: {
    surfaces: {
      "ViteProof-Dashboard": {
        pixelTolerance: {
          bundler: { threshold: 0, maxChangedPixels: 0 },
          determinism: { threshold: 0, maxChangedPixels: 0 },
          native: { threshold: 0, maxChangedPixels: 0 },
        },
      },
      "ViteProof-Demo": {
        pixelTolerance: {
          bundler: { threshold: 0, maxChangedPixels: 0 },
          determinism: { threshold: 0, maxChangedPixels: 0 },
        },
      },
    },
  },
  moduleOwnership: ["react", "react-dom", "zod"].map((packageName) => ({
    package: packageName,
    owner: "host",
  })),
});

export const viteProofConfig = resolveAppConfig(appConfig);

export default appConfig;
