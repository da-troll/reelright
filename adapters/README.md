# Application adapters

This directory contains durable, committed integration code for applications
under `input/`.

Each `adapters/<app-id>/` directory will own the native component bridge,
providers, fixtures, style isolation, shims, demos, and capture flows for the
matching `input/<app-id>/` application.

Generated active-app state belongs in `.remotion-app/`. Generated screenshots,
frame sequences, and recordings belong in `public/generated/`.

Each adapter exports a validated `app.config.mjs`. The generic runtime in
`adapter-runtime/` consumes that configuration for module ownership, CSS
compilation, preflight, verification, and Studio startup. Authored demos still
import native application components directly to retain prop checking.

Adapter Remotion configs inherit the runtime's `swangle` Chromium OpenGL
renderer so Chrome cannot choose a different raster backend per host. A proven
adapter-specific exception may call `Config.setChromiumOpenGlRenderer()` after
`applyAdapterBundlerConfig()`; document the reason and rerun strict delayed
determinism and Webpack/Rspack verification. Do not weaken pixel tolerances to
mask renderer drift.

CSS entries may opt into `tailwind-v4` processing. The runtime resolves the
input application's own PostCSS plugin, scans the input plus declared adapter
sources, and then applies the same scoped-prefix compiler and collision guards.

Adapters may also declare local server lifecycle and Playwright flows under
`capture`. Each flow fixes its route, viewport, DPR, fps, frame count, locale,
timezone, motion preference, and frame-addressed interactions. The generic
runtime emits validated `capture.json` manifests and either lossless PNG frames
or a probed VP9 video under `public/generated/<app-id>/<flow-id>/`.
