import {
  defineAppConfig,
  resolveAppConfig,
} from "../../adapter-runtime/config.mjs";

export const appConfig = defineAppConfig({
  id: "horizon-tailwind-react",
  title: "Horizon UI Tailwind React",
  sourceRoot: "input/horizon-tailwind-react",
  sourceCommands: {
    // Wraps `npm run build` and copies the output CSS to a stable filename
    // -- see adapters/horizon-tailwind-react/scripts/build-and-copy-css.mjs.
    build: [
      "node",
      "../../adapters/horizon-tailwind-react/scripts/build-and-copy-css.mjs",
    ],
    // `npm ci` (the default) fails here: the pinned commit's own
    // package-lock.json is internally inconsistent (a transitive peer
    // dependency range on `typescript` the lockfile's resolved version does
    // not satisfy) -- a pre-existing issue in the upstream repository at
    // that commit, not something introduced by this adapter, and input/ is
    // read-only so the lockfile itself cannot be fixed here. `npm install`
    // heals a mismatched lockfile instead of failing strictly on it.
    install: ["npm", "install"],
  },
  upstream: {
    repository: "https://github.com/horizon-ui/horizon-tailwind-react.git",
    commit: "8f17779f2b45419112f32541bb555817dabc5b7c",
    license: "MIT",
  },
  designSize: {
    width: 1512,
    height: 982,
  },
  css: {
    // horizon-tailwind-react uses Tailwind v3 (`@tailwind base/components/
    // utilities` directives), which this repo's scoped CSS compiler cannot
    // expand directly -- only "plain" passthrough and "tailwind-v4" (the
    // @tailwindcss/postcss plugin) are supported processors. Tailwind v3 has
    // no equivalent single-file "all utilities" build, so instead we let the
    // app's own `npm run build` fully expand and purge its Tailwind v3 CSS
    // (via its own tailwind.config.js + postcss.config.js), then feed that
    // already-compiled bundle through the "plain" processor for selector
    // scoping only -- the same approach this repo uses for oss-dashboard's
    // prebuilt Bootstrap CSS.
    //
    // NOTE: CRA content-hashes `build/static/css/main.<hash>.css`, so
    // `sourceCommands.build` (above) is wrapped by a script that copies it
    // to this stable `app.css` name after every build.
    entries: ["build/static/css/app.css"],
  },
  remotion: {
    entryPoint: "remotion-entry.tsx",
    configFile: "remotion.config.ts",
    tsconfig: "tsconfig.json",
  },
  bundler: {
    aliases: {
      // MiniCalendar and Footer both seed themselves from wall-clock `new
      // Date()` calls with no prop to override, which would make the
      // rendered pixels depend on the day/year the render happens to run.
      // These shims mock the environment around the native component
      // (a fixed reference date) rather than recreating its UI -- they
      // still render the real `react-calendar` / card / footer markup.
      "components/calendar/MiniCalendar$":
        "adapters/horizon-tailwind-react/shims/MiniCalendar.tsx",
      "components/footer/Footer$":
        "adapters/horizon-tailwind-react/shims/Footer.tsx",
      // ApexCharts animates its initial draw-in over real elapsed time,
      // which the delayed double-render determinism gate caught as a
      // pixel-level nondeterminism (same frame, different capture instant).
      // This wraps the real react-apexcharts component and only disables
      // that one animation.
      "react-apexcharts$":
        "adapters/horizon-tailwind-react/shims/react-apexcharts.tsx",
    },
  },
  verification: {
    nativeParity: {
      status: "unavailable",
      reason:
        "Upstream has no isolated dashboard story or harness outside the full app shell/router.",
    },
    surfaces: {
      "HorizonTailwindReact-Main": {
        pixelTolerance: {
          bundler: { threshold: 0, maxChangedPixels: 0 },
          determinism: { threshold: 0, maxChangedPixels: 0 },
        },
      },
      "HorizonTailwindReact-Demo": {
        pixelTolerance: {
          bundler: { threshold: 0, maxChangedPixels: 0 },
          determinism: { threshold: 0, maxChangedPixels: 0 },
        },
      },
    },
  },
  // react/react-dom are "app"-owned rather than "host"-owned: the app pins
  // an exact "19.0.0" (no semver range) while the host repo is pinned to
  // 19.2.8, so a host-owned constraint check fails on that exact-version
  // pin even though both are React 19 with no breaking API changes between
  // them. Remotion's own peerDependencies range (">=16.8.0") comfortably
  // covers 19.0.0, and next-playground already uses this same "app"
  // ownership direction for the same reason.
  moduleOwnership: [
    { package: "react", owner: "app" },
    { package: "react-dom", owner: "app" },
    { package: "react-router-dom", owner: "app" },
    {
      package: "react-icons",
      owner: "app",
      // react-icons has no package.json "exports" map, so each icon-family
      // subpath needs to be declared explicitly for the owned-module alias
      // (and preflight's reachability check) to cover it.
      includeSubpaths: [
        "ai",
        "bs",
        "di",
        "fa",
        "fc",
        "fi",
        "hi",
        "io",
        "io5",
        "md",
        "ri",
        "ti",
      ],
      requiredSubpaths: [
        "./ai",
        "./bs",
        "./di",
        "./fa",
        "./fc",
        "./fi",
        "./hi",
        "./io",
        "./io5",
        "./md",
        "./ri",
        "./ti",
      ],
    },
    {
      package: "react-apexcharts",
      owner: "app",
      // The animation-disabling shim (see bundler.aliases below) imports the
      // package's minified CJS entry directly.
      includeSubpaths: ["dist/react-apexcharts.min.js"],
      requiredSubpaths: ["./dist/react-apexcharts.min.js"],
    },
    { package: "apexcharts", owner: "app" },
    {
      package: "react-calendar",
      owner: "app",
      includeSubpaths: ["dist/Calendar.css"],
      requiredSubpaths: ["./dist/Calendar.css"],
    },
    { package: "@tanstack/react-table", owner: "app" },
  ],
});

export const horizonTailwindReactConfig = resolveAppConfig(appConfig);

export default appConfig;
