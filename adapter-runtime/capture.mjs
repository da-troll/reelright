import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pngjs from "pngjs";
import { chromium } from "playwright";
import {
  validateCaptureConfig,
  validateCaptureManifest,
} from "./capture-contract.mjs";

const { PNG } = pngjs;

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const normalizeBaseUrl = (value) => (value.endsWith("/") ? value : `${value}/`);

const captureUrl = (baseUrl, route) =>
  new URL(route.slice(1), normalizeBaseUrl(baseUrl)).href;

const stopServer = async (child) => {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  const signal = (name) => {
    if (process.platform === "win32" || !child.pid) {
      child.kill(name);
      return;
    }

    try {
      process.kill(-child.pid, name);
    } catch {
      child.kill(name);
    }
  };

  const exitPromise = new Promise((resolve) =>
    child.once("exit", () => resolve(true)),
  );
  signal("SIGTERM");
  const exited = await Promise.race([
    exitPromise,
    wait(5_000).then(() => false),
  ]);

  if (!exited) {
    signal("SIGKILL");
  }
};

const startServer = async (config, server) => {
  const [command, ...args] = server.command;
  const log = [];
  let spawnError = null;
  const child = spawn(command, args, {
    cwd: config.sourceRoot,
    detached: process.platform !== "win32",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const collect = (chunk) => log.push(chunk.toString());

  child.once("error", (error) => {
    spawnError = error;
  });
  child.stdout.on("data", collect);
  child.stderr.on("data", collect);

  const readyUrl = captureUrl(server.baseUrl, server.readyPath);
  const deadline = Date.now() + server.timeoutMs;

  while (Date.now() < deadline) {
    if (spawnError) {
      throw new Error(`Could not start capture server: ${spawnError.message}`);
    }
    if (child.exitCode !== null) {
      throw new Error(
        `Capture server exited with ${child.exitCode}\n${log.join("").slice(-4_000)}`,
      );
    }

    try {
      const response = await fetch(readyUrl, { redirect: "manual" });
      if (response.status < 500) {
        return { child, log };
      }
    } catch {
      // The server is still starting.
    }

    await wait(250);
  }

  await stopServer(child);
  throw new Error(
    `Capture server did not become ready at ${readyUrl}\n${log.join("").slice(-4_000)}`,
  );
};

const getLocatorGeometry = async (locator) => {
  const bounds = await locator.boundingBox();

  if (!bounds) {
    return { bounds: null, pointer: null };
  }

  return {
    bounds,
    pointer: {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    },
  };
};

const performStep = async (page, step) => {
  const locator = page.locator(step.selector).first();

  if (step.action === "waitFor") {
    await locator.waitFor({ state: step.state });
    return {
      action: step.action,
      ...(await getLocatorGeometry(locator)),
      label: step.label,
      selector: step.selector,
    };
  }

  await locator.waitFor({ state: "visible" });
  const geometry = await getLocatorGeometry(locator);

  if (!geometry.bounds) {
    throw new Error(`Capture target has no bounding box: ${step.selector}`);
  }

  if (step.action === "hover") {
    await locator.hover();
  } else if (step.action === "click") {
    await locator.click();
  } else if (step.action === "fill") {
    await locator.fill(step.value);
  } else if (step.action === "press") {
    await locator.press(step.key);
  }

  return {
    action: step.action,
    ...geometry,
    label: step.label,
    selector: step.selector,
  };
};

const createInteraction = (step, result, timebaseFps) => ({
  ...result,
  captureFrame: step.atFrame,
  timeSeconds: step.atFrame / timebaseFps,
});

const waitForAssets = async (page) => {
  await page.evaluate(async () => {
    await globalThis.document.fonts.ready;
  });

  await page.evaluate(() => {
    for (const image of globalThis.document.images) {
      const bounds = image.getBoundingClientRect();
      const intersectsViewport =
        bounds.bottom > 0 &&
        bounds.right > 0 &&
        bounds.top < globalThis.innerHeight &&
        bounds.left < globalThis.innerWidth;

      if (intersectsViewport) {
        image.loading = "eager";
      }
    }
  });

  await page.waitForFunction(() => {
    return [...globalThis.document.images]
      .filter((image) => {
        const bounds = image.getBoundingClientRect();
        return (
          bounds.bottom > 0 &&
          bounds.right > 0 &&
          bounds.top < globalThis.innerHeight &&
          bounds.left < globalThis.innerWidth
        );
      })
      .every((image) => image.complete && image.naturalWidth > 0);
  });

  await page.evaluate(async () => {
    const visibleImages = [...globalThis.document.images].filter((image) => {
      const bounds = image.getBoundingClientRect();
      return (
        bounds.bottom > 0 &&
        bounds.right > 0 &&
        bounds.top < globalThis.innerHeight &&
        bounds.left < globalThis.innerWidth
      );
    });
    await Promise.all(visibleImages.map((image) => image.decode()));
  });
};

const createContextOptions = (flow) => ({
  colorScheme: flow.colorScheme,
  deviceScaleFactor: flow.deviceScaleFactor,
  locale: flow.locale,
  reducedMotion: flow.reducedMotion,
  timezoneId: flow.timezoneId,
  viewport: flow.viewport,
});

const captureFrames = async ({
  flow,
  framesDirectory = "frames",
  outputRoot,
  page,
}) => {
  const framesRoot = path.join(outputRoot, framesDirectory);
  const interactions = [];
  const files = [];
  const stepsByFrame = Object.groupBy(flow.steps, (step) => step.atFrame);

  await mkdir(framesRoot, { recursive: true });

  for (let frame = 0; frame < flow.frameCount; frame++) {
    for (const step of stepsByFrame[frame] ?? []) {
      const result = await performStep(page, step);
      if (step.record) {
        interactions.push(createInteraction(step, result, flow.fps));
      }
      await waitForAssets(page);
    }

    const relativeFile = `${framesDirectory}/frame-${String(frame).padStart(6, "0")}.png`;
    const absoluteFile = path.join(outputRoot, relativeFile);
    await page.screenshot({
      animations: flow.disableAnimations ? "disabled" : "allow",
      caret: "hide",
      path: absoluteFile,
      scale: "device",
    });
    files.push(relativeFile);
  }

  const firstPng = PNG.sync.read(
    await readFile(path.join(outputRoot, files[0])),
  );
  const expectedSize = {
    height: flow.viewport.height * flow.deviceScaleFactor,
    width: flow.viewport.width * flow.deviceScaleFactor,
  };

  if (
    firstPng.height !== expectedSize.height ||
    firstPng.width !== expectedSize.width
  ) {
    throw new Error(
      `Captured frame contract mismatch for ${flow.id}: ` +
        `${firstPng.width}x${firstPng.height}, expected ` +
        `${expectedSize.width}x${expectedSize.height}`,
    );
  }

  return {
    files,
    interactions,
    mediaKind: "frames",
    outputSize: expectedSize,
    timebase: {
      durationSeconds: flow.frameCount / flow.fps,
      fps: flow.fps,
      frameCount: flow.frameCount,
    },
  };
};

const parseRate = (rate) => {
  const [numerator, denominator = "1"] = rate.split("/").map(Number);
  return numerator / denominator;
};

const probeVideo = (file) => {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-count_frames",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=avg_frame_rate,duration,height,nb_frames,nb_read_frames,width:format=duration",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8" },
  );

  if (result.error || result.status !== 0) {
    throw new Error(
      `ffprobe is required to measure capture timebase: ${result.stderr || result.error?.message}`,
    );
  }

  const probe = JSON.parse(result.stdout);
  const stream = probe.streams?.[0];
  const fps = parseRate(stream.avg_frame_rate);
  const durationSeconds = Number(stream.duration ?? probe.format?.duration);
  const frameCount = Number(
    stream.nb_read_frames ??
      stream.nb_frames ??
      Math.round(durationSeconds * fps),
  );

  return {
    outputSize: { height: Number(stream.height), width: Number(stream.width) },
    timebase: { durationSeconds, fps, frameCount },
  };
};

const encodeVideo = ({ flow, framesRoot, outputFile }) => {
  const result = spawnSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-y",
      "-framerate",
      String(flow.fps),
      "-i",
      path.join(framesRoot, "frame-%06d.png"),
      "-frames:v",
      String(flow.frameCount),
      "-c:v",
      "libvpx-vp9",
      "-crf",
      "18",
      "-b:v",
      "0",
      "-pix_fmt",
      "yuv420p",
      outputFile,
    ],
    { encoding: "utf8" },
  );

  if (result.error || result.status !== 0) {
    throw new Error(
      `ffmpeg is required to encode capture video: ${result.stderr || result.error?.message}`,
    );
  }
};

const captureVideo = async ({ flow, outputRoot, page }) => {
  const outputFile = path.join(outputRoot, "capture.webm");
  const framesDirectory = ".video-frames";
  const frameCapture = await captureFrames({
    flow,
    framesDirectory,
    outputRoot,
    page,
  });
  const framesRoot = path.join(outputRoot, framesDirectory);
  encodeVideo({ flow, framesRoot, outputFile });

  const probed = probeVideo(outputFile);
  const expectedSize = {
    height: flow.viewport.height * flow.deviceScaleFactor,
    width: flow.viewport.width * flow.deviceScaleFactor,
  };

  if (
    probed.outputSize.height !== expectedSize.height ||
    probed.outputSize.width !== expectedSize.width ||
    Math.abs(probed.timebase.fps - flow.fps) > 0.001 ||
    probed.timebase.frameCount !== flow.frameCount
  ) {
    throw new Error(
      `Encoded capture contract mismatch for ${flow.id}: ${JSON.stringify(probed)}`,
    );
  }

  await rm(framesRoot, { force: true, recursive: true });

  return {
    codec: "vp9",
    encoding: "crf-18-yuv420p",
    file: "capture.webm",
    interactions: frameCapture.interactions,
    mediaKind: "video",
    ...probed,
  };
};

const ensureGeneratedBoundary = (config, outputRoot) => {
  const generatedRoot = path.resolve(
    config.repositoryRoot,
    "public/generated",
    config.id,
  );
  const relative = path.relative(generatedRoot, outputRoot);

  if (
    relative === "" ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Unsafe capture output path: ${outputRoot}`);
  }
};

export const runCapture = async (config, requestedFlowId) => {
  const capture = validateCaptureConfig(config);
  const flow = capture.flows.find(({ id }) => id === requestedFlowId);

  if (!flow) {
    throw new Error(
      `Unknown capture flow ${requestedFlowId}; expected one of ${capture.flows.map(({ id }) => id).join(", ")}`,
    );
  }

  const outputRoot = path.resolve(
    config.repositoryRoot,
    "public/generated",
    config.id,
    flow.id,
  );
  ensureGeneratedBoundary(config, outputRoot);
  await rm(outputRoot, { force: true, recursive: true });
  await mkdir(outputRoot, { recursive: true });

  const server = await startServer(config, capture.server);
  let browser;
  let context;

  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext(createContextOptions(flow));
    const page = await context.newPage();
    await page.goto(captureUrl(capture.server.baseUrl, flow.route), {
      waitUntil: "domcontentloaded",
    });
    // Flow-level waitFor steps define application readiness. Asset readiness is
    // handled separately so long-lived connections cannot block navigation.
    await waitForAssets(page);

    const media =
      flow.output === "frames"
        ? await captureFrames({ flow, outputRoot, page })
        : await captureVideo({ flow, outputRoot, page });

    await context.close();
    context = undefined;

    const manifest = validateCaptureManifest({
      appId: config.id,
      conditions: {
        colorScheme: flow.colorScheme,
        disableAnimations: flow.disableAnimations,
        locale: flow.locale,
        reducedMotion: flow.reducedMotion,
        timezoneId: flow.timezoneId,
      },
      coordinateSpace: "css-viewport",
      deviceScaleFactor: flow.deviceScaleFactor,
      flowId: flow.id,
      route: flow.route,
      schemaVersion: 1,
      source: {
        commit: config.upstream?.commit ?? null,
        repository: config.upstream?.repository ?? null,
      },
      viewport: flow.viewport,
      ...media,
    });
    const manifestPath = path.join(outputRoot, "capture.json");
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    console.log(
      `Captured ${config.id}/${flow.id}: ${path.relative(config.repositoryRoot, manifestPath)}`,
    );
    return { manifest, manifestPath };
  } finally {
    if (context) {
      await context.close().catch(() => undefined);
    }
    if (browser) {
      await browser.close().catch(() => undefined);
    }
    await stopServer(server.child);
    await writeFile(
      path.join(config.generatedRoot, `capture-${flow.id}.log`),
      server.log.join(""),
    ).catch(async () => {
      await mkdir(config.generatedRoot, { recursive: true });
      await writeFile(
        path.join(config.generatedRoot, `capture-${flow.id}.log`),
        server.log.join(""),
      );
    });
  }
};

const decodedVideoSignature = (file) => {
  const result = spawnSync(
    "ffmpeg",
    ["-v", "error", "-i", file, "-f", "framemd5", "-"],
    { encoding: "utf8" },
  );

  if (result.error || result.status !== 0) {
    throw new Error(
      `Could not decode captured video for verification: ${result.stderr || result.error?.message}`,
    );
  }

  return result.stdout;
};

const digest = (value) => createHash("sha256").update(value).digest("hex");

const captureFingerprint = async (manifestPath, manifest) => {
  const outputRoot = path.dirname(manifestPath);
  const manifestBytes = await readFile(manifestPath);
  const hash = createHash("sha256");
  const media = [];
  hash.update(manifestBytes);

  if (manifest.mediaKind === "frames") {
    for (const file of manifest.files) {
      const png = PNG.sync.read(await readFile(path.join(outputRoot, file)));
      const dimensions = `${png.width}x${png.height}:`;
      const frameHash = createHash("sha256");
      frameHash.update(dimensions);
      frameHash.update(png.data);
      media.push({ file, signature: frameHash.digest("hex") });
      hash.update(dimensions);
      hash.update(png.data);
    }
  } else {
    const decoded = decodedVideoSignature(path.join(outputRoot, manifest.file));
    media.push({ file: manifest.file, signature: digest(decoded) });
    hash.update(decoded);
  }

  return {
    manifest: digest(manifestBytes),
    media,
    signature: hash.digest("hex"),
  };
};

const changedJsonPaths = (left, right, prefix = "") => {
  if (Object.is(left, right)) {
    return [];
  }
  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object" ||
    Array.isArray(left) !== Array.isArray(right)
  ) {
    return [prefix || "<root>"];
  }

  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].flatMap((key) =>
    changedJsonPaths(left[key], right[key], prefix ? `${prefix}.${key}` : key),
  );
};

const describeFingerprintDifference = ({
  first,
  firstManifest,
  second,
  secondManifest,
}) => {
  const details = [];

  if (first.manifest !== second.manifest) {
    const changedPaths = changedJsonPaths(firstManifest, secondManifest);
    details.push(
      `manifest fields changed: ${changedPaths.slice(0, 12).join(", ")}` +
        (changedPaths.length > 12
          ? ` (+${changedPaths.length - 12} more)`
          : ""),
    );
  }

  const firstMedia = new Map(
    first.media.map((item) => [item.file, item.signature]),
  );
  const secondMedia = new Map(
    second.media.map((item) => [item.file, item.signature]),
  );
  const changedMedia = [
    ...new Set([...firstMedia.keys(), ...secondMedia.keys()]),
  ].filter((file) => firstMedia.get(file) !== secondMedia.get(file));

  if (changedMedia.length > 0) {
    details.push(`decoded media changed: ${changedMedia.join(", ")}`);
  }

  return details.join("; ") || "aggregate content changed";
};

export const verifyCaptureReproducibility = async (config, flowId) => {
  const diagnosticsRoot = path.join(
    config.generatedRoot,
    "capture-verification",
    flowId,
  );
  await rm(diagnosticsRoot, { force: true, recursive: true });
  await mkdir(diagnosticsRoot, { recursive: true });

  const first = await runCapture(config, flowId);
  const firstFingerprint = await captureFingerprint(
    first.manifestPath,
    first.manifest,
  );
  await cp(
    path.dirname(first.manifestPath),
    path.join(diagnosticsRoot, "first"),
    {
      recursive: true,
    },
  );
  await wait(1_000);
  const second = await runCapture(config, flowId);
  const secondFingerprint = await captureFingerprint(
    second.manifestPath,
    second.manifest,
  );

  if (firstFingerprint.signature !== secondFingerprint.signature) {
    await cp(
      path.dirname(second.manifestPath),
      path.join(diagnosticsRoot, "second"),
      { recursive: true },
    );
    const difference = describeFingerprintDifference({
      first: firstFingerprint,
      firstManifest: first.manifest,
      second: secondFingerprint,
      secondManifest: second.manifest,
    });
    throw new Error(
      `Capture ${config.id}/${flowId} is not reproducible: ` +
        `${firstFingerprint.signature} != ${secondFingerprint.signature}; ` +
        `${difference}. Diagnostics: ${path.relative(config.repositoryRoot, diagnosticsRoot)}`,
    );
  }

  await rm(diagnosticsRoot, { force: true, recursive: true });
  console.log(
    `Capture reproducibility passed for ${config.id}/${flowId}: ${secondFingerprint.signature}`,
  );
};
