# Native pre-capture recipe

Use capture for behavior that must execute in the application's own framework:
route transitions, server-rendered or async surfaces, server actions, framework
caches, or client state whose environment cannot be reproduced faithfully in a
Remotion bundle.

## 1. Declare the native server and flow

Add a `capture` block to `app.config.mjs` with:

- a localhost or `127.0.0.1` server URL, start command, ready path, and timeout;
- a stable route, viewport, device scale factor, locale, timezone, color scheme,
  and reduced-motion preference per flow;
- explicit capture fps and frame count;
- frame-addressed `waitFor`, `hover`, `click`, `fill`, or `press` steps;
- `frames` output for short fidelity-critical flows, or `video` for compact
  longer flows.

Device scale factor must be at least 2. Choose viewport and DPR so captured
physical pixels meet or exceed the composition's effective scale.

The first frame should contain a `waitFor` step targeting stable application UI.
Navigation waits only for `domcontentloaded`; flow selectors and explicit font
and image readiness are the actual readiness contract. Do not rely on
`networkidle`, because valid applications may keep connections open.

After a state-changing click, add a same-frame `waitFor` for the resulting UI
state. Set `record: false` when the wait is only a readiness barrier so it does
not replace the click as the recorded cursor/highlight interaction.

## 2. Capture deterministically

The runtime starts and stops the native server, opens Playwright with the
declared browser context, executes all actions scheduled for a capture frame,
waits for assets, and takes a DPR-correct screenshot for that frame. This is a
frame-addressed capture, not a wall-clock screen recording.

Asset readiness must require viewport-intersecting images to have a decoded
candidate (`naturalWidth > 0` plus `decode()`), not merely `complete`; lazy
images can report complete before their browser candidate has loaded.

When animations are disabled, apply Playwright's per-screenshot animation
control. Do not globally freeze timers. If application state changes between
frames, it remains in the one browser page used for the flow.

For video output, encode the deterministic screenshots to VP9. `ffprobe` must
confirm resolution, fps, and frame count before writing the manifest. Do not use
Playwright's low-resolution video recorder as the render source.

## 3. Preserve the manifest contract

`public/generated/<app-id>/<flow-id>/capture.json` is authoritative. It records:

- source repository and pinned commit;
- viewport, DPR, output pixel size, locale, timezone, color and motion settings;
- capture fps, frame count, and duration;
- media filenames and encoding information;
- interaction capture frames, seconds, selectors, element bounds, and pointer
  coordinates in CSS-viewport space.

Never assume capture fps equals composition fps. Map both directions using the
timebase helpers. Scale recorded CSS-viewport coordinates into the composition
for Remotion-owned cursors, highlights, and callouts.

## 4. Register the composition once

Render frame sequences with Remotion `Img` and video with `Video` from
`@remotion/media`. Register capture compositions with
`defineCaptureComposition`; it derives manifest-based duration from the same
catalog `fps` field used by the Composition, avoiding a duplicated fps value.

Mark each capture-backed verification surface with its `captureFlow`. The
generic verifier then validates `capture.json` and every referenced media file
before bundling. If assets are missing or stale, run the exact `app:capture`
command in its error.

## 5. Generate and verify

```bash
npm run app:check -- --app <app-id>
npm run app:capture:verify -- --app <app-id> --flow <flow-id>
npm run app:verify -- --app <app-id>
```

`app:capture:verify` captures twice with a wall-clock delay. It hashes decoded
PNG pixels for frame output and decoded frames for video, ignoring non-semantic
container differences.

On failure, use the reported manifest-field and per-frame/media differences.
The runtime preserves both capture attempts under
`.remotion-app/<app-id>/capture-verification/<flow-id>/`; CI uploads those files
with the generated capture and server logs.

Generated captures are environment-local. Regenerate them on the CI image or
target render machine. Exact pixel equality is an intra-environment guarantee,
not a promise that macOS- and Linux-rasterized captures match.

Do not use a live iframe inside Remotion: it is not time-locked to independently
rendered frames and cannot provide deterministic output.
