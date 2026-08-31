import {
  defineAppConfig,
  resolveAppConfig,
} from "../../adapter-runtime/config.mjs";

const strictPixelTolerance = {
  bundler: { threshold: 0, maxChangedPixels: 0 },
  determinism: { threshold: 0, maxChangedPixels: 0 },
};

export const appConfig = defineAppConfig({
  id: "next-playground",
  title: "Vercel Next.js App Router Playground",
  sourceRoot: "input/next-playground",
  sourceCommands: {
    build: ["corepack", "pnpm", "build"],
    install: ["corepack", "pnpm", "install", "--frozen-lockfile"],
  },
  capture: {
    server: {
      baseUrl: "http://127.0.0.1:3317",
      command: ["corepack", "pnpm", "exec", "next", "start", "-p", "3317"],
      readyPath: "/layouts",
      timeoutMs: 120_000,
    },
    flows: [
      {
        id: "layouts-navigation",
        output: "frames",
        route: "/layouts",
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
        fps: 4,
        frameCount: 8,
        locale: "en-US",
        timezoneId: "UTC",
        colorScheme: "dark",
        reducedMotion: "reduce",
        disableAnimations: true,
        steps: [
          {
            atFrame: 0,
            action: "waitFor",
            selector: 'button:has-text("0 Clicks")',
            label: "Persistent layout counter",
          },
          {
            atFrame: 1,
            action: "hover",
            selector: 'button:has-text("0 Clicks")',
            label: "Counter target",
          },
          {
            atFrame: 2,
            action: "click",
            selector: 'button:has-text("0 Clicks")',
            label: "Increment client state",
          },
          {
            atFrame: 2,
            action: "waitFor",
            selector: 'button:has-text("1 Clicks")',
            record: false,
          },
          {
            atFrame: 4,
            action: "click",
            selector: 'a[href="/layouts/clothing"]',
            label: "Navigate shared layout",
          },
          {
            atFrame: 4,
            action: "waitFor",
            selector: 'a[href="/layouts/clothing/tops"]',
            record: false,
          },
          {
            atFrame: 6,
            action: "click",
            selector: 'a[href="/layouts/clothing/tops"]',
            label: "Navigate nested category",
          },
          {
            atFrame: 6,
            action: "waitFor",
            selector:
              'a[href="/layouts/clothing/tops"] span[class~="bg-blue-600"]',
            record: false,
          },
        ],
      },
      {
        id: "layouts-video",
        output: "video",
        route: "/layouts",
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
        fps: 8,
        frameCount: 16,
        locale: "en-US",
        timezoneId: "UTC",
        colorScheme: "dark",
        reducedMotion: "reduce",
        disableAnimations: true,
        steps: [
          {
            atFrame: 0,
            action: "waitFor",
            selector: 'button:has-text("0 Clicks")',
            label: "Persistent layout counter",
          },
          {
            atFrame: 2,
            action: "click",
            selector: 'button:has-text("0 Clicks")',
            label: "Increment client state",
          },
          {
            atFrame: 2,
            action: "waitFor",
            selector: 'button:has-text("1 Clicks")',
            record: false,
          },
          {
            atFrame: 6,
            action: "click",
            selector: 'a[href="/layouts/clothing"]',
            label: "Navigate shared layout",
          },
          {
            atFrame: 6,
            action: "waitFor",
            selector: 'a[href="/layouts/clothing/tops"]',
            record: false,
          },
          {
            atFrame: 11,
            action: "click",
            selector: 'a[href="/layouts/clothing/tops"]',
            label: "Navigate nested category",
          },
          {
            atFrame: 11,
            action: "waitFor",
            selector:
              'a[href="/layouts/clothing/tops"] span[class~="bg-blue-600"]',
            record: false,
          },
        ],
      },
    ],
  },
  upstream: {
    repository: "https://github.com/vercel/next-app-router-playground.git",
    commit: "cd0363f3aefd4f4b50ee1b7655feefcc04695f4c",
    license: "MIT",
  },
  designSize: {
    width: 1440,
    height: 900,
  },
  css: {
    entries: ["styles/globals.css"],
    processor: "tailwind-v4",
    sources: ["adapters/next-playground"],
  },
  remotion: {
    entryPoint: "remotion-entry.tsx",
    configFile: "remotion.config.ts",
    tsconfig: "tsconfig.json",
  },
  bundler: {
    aliases: {
      "#/lib/db$": "adapters/next-playground/shims/db.ts",
      "#": "input/next-playground",
      "next/font/google$": "adapters/next-playground/shims/next-font-google.ts",
      "next/font/local$": "adapters/next-playground/shims/next-font-local.ts",
      "next/image$": "adapters/next-playground/shims/next-image.tsx",
      "next/link$": "adapters/next-playground/shims/next-link.tsx",
      "next/navigation$": "adapters/next-playground/shims/next-navigation.tsx",
    },
  },
  verification: {
    nativeParity: {
      status: "unavailable",
      reason:
        "The adapter combines native playground components with deterministic fixtures and has no matching upstream route or Storybook story.",
    },
    surfaces: {
      "NextPlayground-Main": {
        pixelTolerance: strictPixelTolerance,
      },
      "NextPlayground-ChatWidget": {
        pixelTolerance: strictPixelTolerance,
      },
      "NextPlayground-Demo": {
        pixelTolerance: strictPixelTolerance,
      },
      "NextPlayground-Capture": {
        captureFlow: "layouts-navigation",
        pixelTolerance: strictPixelTolerance,
      },
      "NextPlayground-CaptureVideo": {
        captureFlow: "layouts-video",
        pixelTolerance: strictPixelTolerance,
      },
    },
  },
  preflight: {
    watchPackages: ["styled-components"],
  },
  moduleOwnership: ["react", "react-dom"].map((packageName) => ({
    package: packageName,
    owner: "app",
  })),
});

export const nextPlaygroundConfig = resolveAppConfig(appConfig);

export default appConfig;
