import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { compileScopedCss } from "./scoped-css.mjs";
import { assertVerificationCapturesExist } from "./capture-artifacts.mjs";
import { runPreflight } from "./preflight.mjs";

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with ${result.status}`,
    );
  }
};

const runCaptured = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0" },
    ...options,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with ${result.status}\n${result.stderr}`,
    );
  }

  return result.stdout;
};

export const parseCompositionListing = (output) => {
  const renderables = [];

  for (const line of output.split("\n")) {
    const stillMatch = line.match(/^([^\s]+)\s+(\d+)x(\d+)\s+Still\s*$/);

    if (stillMatch) {
      renderables.push({
        durationInFrames: 1,
        fps: null,
        height: Number(stillMatch[3]),
        id: stillMatch[1],
        kind: "still",
        width: Number(stillMatch[2]),
      });
      continue;
    }

    const compositionMatch = line.match(
      /^([^\s]+)\s+(\d+)\s+(\d+)x(\d+)\s+(\d+)\s+\([^)]+\)\s*$/,
    );

    if (compositionMatch) {
      renderables.push({
        durationInFrames: Number(compositionMatch[5]),
        fps: Number(compositionMatch[2]),
        height: Number(compositionMatch[4]),
        id: compositionMatch[1],
        kind: "composition",
        width: Number(compositionMatch[3]),
      });
    }
  }

  if (renderables.length === 0) {
    throw new Error("Could not parse any registered Remotion renderables");
  }

  return renderables;
};

export const getRepresentativeFrames = (renderable, configuredFrames) => {
  const frames =
    configuredFrames ??
    (renderable.kind === "still"
      ? [0]
      : [
          0,
          Math.floor((renderable.durationInFrames - 1) / 2),
          renderable.durationInFrames - 1,
        ]);
  const uniqueFrames = [...new Set(frames)];

  for (const frame of uniqueFrames) {
    if (
      !Number.isInteger(frame) ||
      frame < 0 ||
      frame >= renderable.durationInFrames
    ) {
      throw new Error(
        `Invalid verification frame ${frame} for ${renderable.id}; ` +
          `duration is ${renderable.durationInFrames} frames`,
      );
    }
  }

  return uniqueFrames;
};

const comparePngs = async ({
  diffPath,
  label,
  leftPath,
  rightPath,
  tolerance,
}) => {
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

export const verifyAdapter = async (config) => {
  await assertVerificationCapturesExist(config);
  await runPreflight(config);
  await compileScopedCss(config);
  run("npx", ["tsc", "-p", config.remotion.tsconfig], {
    cwd: config.repositoryRoot,
  });

  const outputRoot = path.join(
    config.repositoryRoot,
    "out/adapters",
    config.id,
  );
  const entryPoint = path.relative(
    config.repositoryRoot,
    config.remotion.entryPoint,
  );
  const configPath = path.relative(
    config.repositoryRoot,
    config.remotion.configFile,
  );
  const listing = runCaptured(
    "npx",
    ["remotion", "compositions", entryPoint, `--config=${configPath}`],
    { cwd: config.repositoryRoot },
  );
  const renderables = parseCompositionListing(listing);
  const configuredSurfaces = config.verification.surfaces;

  for (const renderable of renderables) {
    if (!configuredSurfaces[renderable.id]) {
      throw new Error(
        `Registered ${renderable.kind} ${renderable.id} has no verification surface config`,
      );
    }
  }

  for (const compositionId of Object.keys(configuredSurfaces)) {
    if (!renderables.some((renderable) => renderable.id === compositionId)) {
      throw new Error(
        `Verification surface ${compositionId} is not registered in the adapter catalog`,
      );
    }
  }

  await mkdir(outputRoot, { recursive: true });

  for (const renderable of renderables) {
    const surface = configuredSurfaces[renderable.id];
    const frames = getRepresentativeFrames(renderable, surface.frames);

    for (const frame of frames) {
      const outputPrefix = `${renderable.id}-f${frame}`;
      const firstStill = path.join(outputRoot, `${outputPrefix}-webpack.png`);
      const delayedStill = path.join(
        outputRoot,
        `${outputPrefix}-webpack-delayed.png`,
      );
      const rspackStill = path.join(outputRoot, `${outputPrefix}-rspack.png`);
      const stillArgs = [
        "remotion",
        "still",
        entryPoint,
        renderable.id,
        firstStill,
        `--frame=${frame}`,
        `--config=${configPath}`,
      ];

      run("npx", stillArgs, { cwd: config.repositoryRoot });
      await delay(config.verification.delayMs ?? 1500);
      run(
        "npx",
        stillArgs.map((argument) =>
          argument === firstStill ? delayedStill : argument,
        ),
        { cwd: config.repositoryRoot },
      );
      await comparePngs({
        leftPath: firstStill,
        rightPath: delayedStill,
        diffPath: path.join(outputRoot, `${outputPrefix}-time-diff.png`),
        label: `${renderable.id} frame ${frame} delayed determinism`,
        tolerance: surface.pixelTolerance.determinism,
      });

      run(
        "npx",
        [
          ...stillArgs.map((argument) =>
            argument === firstStill ? rspackStill : argument,
          ),
          "--rspack",
        ],
        { cwd: config.repositoryRoot },
      );
      await comparePngs({
        leftPath: firstStill,
        rightPath: rspackStill,
        diffPath: path.join(outputRoot, `${outputPrefix}-bundler-diff.png`),
        label: `${renderable.id} frame ${frame} Webpack/Rspack parity`,
        tolerance: surface.pixelTolerance.bundler,
      });
    }
  }

  console.log(`Verified ${config.id}`);
};
