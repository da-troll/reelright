import { spawn, spawnSync } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { openBrowser } from "@remotion/renderer";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { setTimeout as delay } from "node:timers/promises";
import { viteProofConfig } from "../adapters/vite-proof/app.config.mjs";

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: viteProofConfig.repositoryRoot,
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with ${result.status}`,
    );
  }
};

const comparePngs = async (leftPath, rightPath, diffPath, label, tolerance) => {
  const left = PNG.sync.read(await readFile(leftPath));
  const right = PNG.sync.read(await readFile(rightPath));

  if (left.width !== right.width || left.height !== right.height) {
    throw new Error(`${label} dimensions differ`);
  }

  const diff = new PNG({ width: left.width, height: left.height });
  const changedPixels = pixelmatch(
    left.data,
    right.data,
    diff.data,
    left.width,
    left.height,
    { threshold: tolerance.threshold },
  );

  if (changedPixels > tolerance.maxChangedPixels) {
    await writeFile(diffPath, PNG.sync.write(diff));
    throw new Error(
      `${label} failed: ${changedPixels} pixels differ; ` +
        `${tolerance.maxChangedPixels} allowed at threshold ${tolerance.threshold}`,
    );
  }

  console.log(
    `${label} passed: ${changedPixels} pixels differ; ` +
      `${tolerance.maxChangedPixels} allowed at threshold ${tolerance.threshold}`,
  );
};

const captureNativeApp = async (outputPath) => {
  const server = spawn(
    "npm",
    [
      "run",
      "dev",
      "--",
      "--host",
      "127.0.0.1",
      "--port",
      "4173",
      "--strictPort",
    ],
    {
      cwd: viteProofConfig.sourceRoot,
      stdio: "ignore",
    },
  );

  try {
    let ready = false;

    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        const response = await fetch("http://127.0.0.1:4173");
        ready = response.ok;
      } catch {
        // The Vite server has not bound its port yet.
      }

      if (ready) {
        break;
      }

      await delay(100);
    }

    if (!ready) {
      throw new Error("The native Vite proof server did not become ready");
    }

    const browser = await openBrowser("chrome", { logLevel: "error" });

    try {
      // Remotion's pinned browser wrapper exposes its CDP session through
      // _client(). Keep this private API usage contained here so an upstream
      // renderer change has one explicit migration point.
      const page = await browser.newPage({
        context: () => null,
        logLevel: "error",
        indent: false,
        pageIndex: 0,
        onBrowserLog: null,
        onLog: () => undefined,
      });
      await page.setViewport({
        width: viteProofConfig.designSize.width,
        height: viteProofConfig.designSize.height,
        deviceScaleFactor: 1,
      });
      await page._client().send("Emulation.setEmulatedMedia", {
        features: [
          { name: "prefers-color-scheme", value: "light" },
          { name: "prefers-reduced-motion", value: "reduce" },
        ],
      });
      await page.goto({
        url: "http://127.0.0.1:4173",
        timeout: 30_000,
      });
      await page.evaluate(() => globalThis.document.fonts.ready);
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            globalThis.requestAnimationFrame(() =>
              globalThis.requestAnimationFrame(resolve),
            );
          }),
      );

      const screenshot = await page._client().send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
      });
      await writeFile(outputPath, Buffer.from(screenshot.value.data, "base64"));
      await page.close();
    } finally {
      await browser.close({ silent: true });
    }
  } finally {
    server.kill("SIGTERM");
  }
};

const outputRoot = path.join(viteProofConfig.repositoryRoot, "out/vite-proof");
const entryPoint = "adapters/vite-proof/remotion-entry.tsx";
const configPath = "adapters/vite-proof/remotion.config.ts";
const firstStill = path.join(outputRoot, "dashboard-first.png");
const delayedStill = path.join(outputRoot, "dashboard-delayed.png");
const rspackStill = path.join(outputRoot, "dashboard-rspack.png");
const nativeStill = path.join(outputRoot, "dashboard-native.png");
const nativeSizeStill = path.join(outputRoot, "dashboard-native-size.png");
const tolerance =
  viteProofConfig.verification.surfaces["ViteProof-Dashboard"].pixelTolerance;

await mkdir(outputRoot, { recursive: true });

try {
  await access(
    path.join(viteProofConfig.sourceRoot, "node_modules/vite/package.json"),
  );
} catch {
  throw new Error(
    "The tracked Vite proof fixture has no installed dependencies. " +
      "Run `npm ci --prefix input/vite-proof` before verification.",
  );
}

run("npm", ["run", "build"], { cwd: viteProofConfig.sourceRoot });
run("node", ["scripts/preflight-vite-proof.mjs"]);
run("node", ["scripts/test-vite-proof-css-guard.mjs"]);
run("node", ["scripts/prepare-vite-proof.mjs"]);
run("npx", ["tsc", "-p", "adapters/vite-proof/tsconfig.json"]);

const stillArgs = [
  "remotion",
  "still",
  entryPoint,
  "ViteProof-Dashboard",
  firstStill,
  "--frame=0",
  `--config=${configPath}`,
];

run("npx", stillArgs);
await delay(1500);
run(
  "npx",
  stillArgs.map((arg) => (arg === firstStill ? delayedStill : arg)),
);
await comparePngs(
  firstStill,
  delayedStill,
  path.join(outputRoot, "dashboard-time-diff.png"),
  "Delayed double-render determinism",
  tolerance.determinism,
);

run("npx", [
  ...stillArgs.map((arg) => (arg === firstStill ? rspackStill : arg)),
  "--rspack",
]);
await comparePngs(
  firstStill,
  rspackStill,
  path.join(outputRoot, "dashboard-bundler-diff.png"),
  "Webpack/Rspack parity",
  tolerance.bundler,
);

await captureNativeApp(nativeStill);
run("npx", [
  ...stillArgs.map((arg) => (arg === firstStill ? nativeSizeStill : arg)),
  "--width=1440",
  "--height=900",
]);
await comparePngs(
  nativeStill,
  nativeSizeStill,
  path.join(outputRoot, "dashboard-native-diff.png"),
  "Native Vite/Remotion visual parity",
  tolerance.native,
);

run("npx", [
  "remotion",
  "render",
  entryPoint,
  "ViteProof-Demo",
  path.join(outputRoot, "dashboard-demo.mp4"),
  `--config=${configPath}`,
]);

console.log("Vite native import proof passed");
