import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { assertVerificationCapturesExist } from "../adapter-runtime/capture-artifacts.mjs";
import {
  validateCaptureConfig,
  validateCaptureManifest,
} from "../adapter-runtime/capture-contract.mjs";
import {
  captureFrameToCompositionFrame,
  compositionFrameToCaptureFrame,
} from "../adapter-runtime/capture-timebase.mjs";

const capture = validateCaptureConfig({
  id: "fixture",
  capture: {
    server: {
      baseUrl: "http://127.0.0.1:3000",
      command: ["npm", "start"],
      readyPath: "/demo",
    },
    flows: [
      {
        deviceScaleFactor: 2,
        fps: 24,
        frameCount: 48,
        id: "demo-flow",
        output: "frames",
        route: "/demo",
        steps: [{ action: "click", atFrame: 12, selector: "#continue" }],
        viewport: { height: 900, width: 1440 },
      },
    ],
  },
});

assert.equal(capture.flows[0].locale, "en-US");
assert.equal(capture.flows[0].timezoneId, "UTC");
assert.equal(capture.flows[0].disableAnimations, true);
assert.equal(capture.flows[0].steps[0].record, true);
assert.throws(
  () =>
    validateCaptureConfig({
      id: "unsafe",
      capture: {
        server: {
          baseUrl: "https://example.com",
          command: ["npm", "start"],
        },
        flows: [capture.flows[0]],
      },
    }),
  /localhost or 127\.0\.0\.1/,
);
assert.throws(
  () =>
    validateCaptureConfig({
      id: "low-dpr",
      capture: {
        server: {
          baseUrl: "http://localhost:3000",
          command: ["npm", "start"],
        },
        flows: [{ ...capture.flows[0], deviceScaleFactor: 1 }],
      },
    }),
  />=2/,
);

assert.equal(
  compositionFrameToCaptureFrame({
    captureFps: 24,
    captureFrameCount: 48,
    compositionFps: 30,
    compositionFrame: 30,
  }),
  24,
);
assert.equal(
  captureFrameToCompositionFrame({
    captureFps: 24,
    captureFrame: 24,
    compositionFps: 30,
  }),
  30,
);

const manifest = validateCaptureManifest({
  appId: "fixture",
  conditions: {
    colorScheme: "dark",
    disableAnimations: true,
    locale: "en-US",
    reducedMotion: "reduce",
    timezoneId: "UTC",
  },
  coordinateSpace: "css-viewport",
  deviceScaleFactor: 2,
  files: ["frames/frame-000000.png"],
  flowId: "demo-flow",
  interactions: [],
  mediaKind: "frames",
  outputSize: { height: 1800, width: 2880 },
  route: "/demo",
  schemaVersion: 1,
  source: { commit: null, repository: null },
  timebase: { durationSeconds: 1 / 24, fps: 24, frameCount: 1 },
  viewport: { height: 900, width: 1440 },
});

assert.equal(manifest.timebase.fps, 24);
assert.throws(
  () =>
    validateCaptureManifest({
      ...manifest,
      timebase: { ...manifest.timebase, frameCount: 2 },
    }),
  /Frame file count must match/,
);

assert.throws(
  () =>
    validateCaptureManifest({
      ...manifest,
      file: "capture.webm",
      files: undefined,
      mediaKind: "video",
    }),
  /codec/,
);

const fixtureRoot = await mkdtemp(
  path.join(tmpdir(), "remotion-capture-artifacts-"),
);
const artifactConfig = {
  id: "fixture",
  repositoryRoot: fixtureRoot,
  capture: {
    server: {
      baseUrl: "http://127.0.0.1:3000",
      command: ["npm", "start"],
    },
    flows: [capture.flows[0]],
  },
  verification: {
    surfaces: {
      "Fixture-Capture": {
        captureFlow: "demo-flow",
      },
    },
  },
};

await assert.rejects(
  assertVerificationCapturesExist(artifactConfig),
  /Run `npm run app:capture -- --app fixture --flow demo-flow` first/,
);

const artifactRoot = path.join(
  fixtureRoot,
  "public/generated/fixture/demo-flow",
);
await mkdir(path.join(artifactRoot, "frames"), { recursive: true });
await writeFile(path.join(artifactRoot, "frames/frame-000000.png"), "fixture");
await writeFile(
  path.join(artifactRoot, "capture.json"),
  JSON.stringify(manifest),
);
await assert.doesNotReject(assertVerificationCapturesExist(artifactConfig));

console.log("Capture contract and timebase tests passed");
