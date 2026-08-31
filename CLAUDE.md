# Reelright

This repository turns native application surfaces into deterministic Remotion
demos. Remotion owns time, motion, capture composition, and presentation; the
input application remains the source of truth for product UI.

## Repository boundaries

- `input/<app-id>/` contains local cloned applications and is ignored by Git.
  Treat it as read-only unless the user explicitly asks to change the app.
- `adapters/<app-id>/` contains durable, committed integration code.
- `.remotion-app/` contains generated active-adapter state and is ignored.
- `public/generated/<app-id>/` contains generated captures and is ignored.
- `src/engine/` and `src/widgets/` are generic builder code. Do not move
  app-specific product UI into them.

## Native-first rule

When creating or integrating a demo, use the `integrate-native-app` skill.
Import and mount the application's real components when they can be made
render-safe. Do not silently replace product UI with a lookalike. If direct
integration cannot preserve native behavior and deterministic rendering, use a
native application capture and document why the compatibility rung changed.
This project's extended architecture rationale is kept in private,
internal notes not included in this distribution. Proceed carefully and
favor the smallest change that satisfies the invariants above when
changing the adapter runtime, capture subsystem, or compatibility gates.

## Render invariants

- The same props and Remotion frame must produce the same pixels.
- Drive video animation from `useCurrentFrame()`; suppress autonomous app motion.
- Do not globally replace or freeze browser timers.
- Keep module ownership explicit. React, React DOM, both JSX runtimes, Zod, and
  any provider/consumer context package must resolve consistently.
- Keep shared bundler behavior plugin-free and compatible with both Webpack and
  Rspack. Quarantine bundler-specific behavior behind internal implementations.
- Inherit the shared `swangle` Chromium OpenGL renderer. Only a demonstrated
  adapter requirement may override it after `applyAdapterBundlerConfig()`; in
  that case document the evidence and rerun both strict pixel gates.
- Use `<Video>` from `@remotion/media` for generated captures.
- Anchor overlay and camera geometry (highlights, cursors, callouts, camera
  keyframes) to the live DOM via `src/engine/anchors.tsx`; never hand-pick page
  coordinates. A missing anchor must cancel the render, not fall back to a
  guess. See the skill's `references/product-tour.md` for scripted demos.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run build:rspack
npm run check:clean-clone
npm run proof:vite:check
npm run test:next-preflight
npm run test:capture-runtime
npm run test:adapter-runtime
npm run app:list
npm run app:fetch -- --app <app-id>
npm run app:install -- --app <app-id>
npm run app:preflight -- --app <app-id>
npm run app:check -- --app <app-id>
npm run app:capture -- --app <app-id> --flow <flow-id>
npm run app:capture:verify -- --app <app-id> --flow <flow-id>
npm run app:verify -- --app <app-id>
npm run app:studio -- --app <app-id>
```

Remotion and all `@remotion/*` packages are pinned to the same version. Zod is
pinned to the version required by that Remotion release; do not change one in
isolation.

## Theme tokens

`src/theme.ts` ships with placeholder design tokens, not a specific product's
brand. When building a demo for an app in `input/<app-id>/`, either replace
the relevant tokens with that app's real values, or — preferably — derive
them at runtime from the active adapter's own theme/CSS variables (see
`adapters/<app-id>/providers.tsx` in an existing adapter for the pattern of
bridging a native app's theme into the engine). Do not leave one app's brand
palette as the shared default once another app becomes the active one.
