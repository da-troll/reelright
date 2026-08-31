# Native application adapter plan

## Goal

Use the real UI components and native runtime of applications cloned under
`input/` to create deterministic Remotion Stills and demos. Remotion owns time,
motion, capture composition, and presentation. It does not silently recreate
product UI.

Direct import versus native pre-capture is an evidence-based compatibility
decision. Phases 1 and 3 will determine which path dominates for the target
application population.

## Repository boundaries

```text
input/<app-id>/                  Local cloned source; ignored
adapters/<app-id>/               Durable integration code; committed
.remotion-app/                   Generated active-app state; ignored
public/generated/<app-id>/       Captures and frame sequences; ignored
src/engine/                      Generic Remotion orchestration
src/widgets/                     Frame-driven video-native widgets
```

The tracked fallback registry must keep the repository buildable when no app is
selected and `.remotion-app/` does not exist.

## Compatibility ladder

Use the first rung that preserves native behavior and deterministic rendering:

1. Directly import a client component or existing Storybook story.
2. Add adapter-owned providers, fixtures, conservative shims, and scoped CSS.
3. Run a native demo route and pre-capture it with the application's framework.

Do not use a live animated iframe as a render source. Do not replace a failed
native integration with a lookalike without explicit user direction. Record the
incompatibility that caused a rung change.

## Adapter shape

```text
adapters/<app-id>/
├── app.config.ts
├── providers.tsx
├── catalog.ts
├── fixtures/
├── demos/
├── shims/
├── styles/
└── capture/
```

Authored demos import native components directly to preserve TypeScript prop
checking. The catalog exists for machine discovery, automatic Still
registration, validation enumeration, and data-driven consumers such as chat
widget maps.

Video-native widgets remain first-class. A consumer may merge built-in,
adapter-native, and composition-specific widget catalogs.

## Bundler portability

Build shared adapter behavior on `Config.overrideBundlerConfig()` with
plugin-free aliases, resolve rules, and module ownership. Put unavoidable
bundler-specific behavior behind a small internal interface with separate
Webpack and Rspack implementations. Never pass a plugin implementation from one
bundler into the other.

Every admitted adapter surface must bundle and render equivalently with Webpack
and Rspack. App selection is implemented by a wrapper that generates active
state before starting Studio. Switching apps requires a Studio restart; loading
multiple arbitrary applications in one bundle is initially out of scope.

## Module ownership

An ownership declaration is directional: all importers resolve the module to
the owner's absolute real path. Preflight must verify the resolved graph has a
single instance rather than trusting configuration.

The default watch-list is:

- `react`
- `react-dom`
- `react/jsx-runtime`
- `react/jsx-dev-runtime`
- `zod`
- Any library whose provider and consumer depend on module identity

The provider/consumer copy may belong to the host or the active app. Zod must be
single-instance when schemas cross the adapter boundary.

## CSS isolation

Scoped-prefix compilation is the default and invested path. Shadow DOM is a
last-resort strategy only for applications that do not depend on Tailwind v4 or
registered custom properties.

The scoped compiler must:

- Translate `:root`, `html`, and `body` selectors into the adapter scope.
- Hoist `@property` and `@font-face` to document scope.
- Detect registered-property-name collisions before bundling.
- Namespace `@keyframes` names and update animation references.
- Detect root font-size mutation, because document-relative `rem` units cannot
  be contained by selector prefixing.
- Keep engine overlays protected from application resets and global selectors.

## Deterministic direct surfaces

The admission rule is: identical props and Remotion frame produce identical
pixels.

- Suppress scoped CSS transitions, CSS animations, and autonomous library
  motion unless explicitly controlled by `useCurrentFrame()`.
- Fix application data, auth, flags, network boundaries, locale, timezone,
  clock services, randomness, fonts, and asset readiness.
- Do not globally freeze browser timers.
- Render the application subtree in a fixed-size layout container at its
  declared design dimensions, then transform-scale the container to fit the
  composition. A viewport prop alone cannot affect media or container queries.
- Render every candidate Still twice with a wall-clock delay and pixel-diff the
  outputs. Any pixel difference fails admission until explained and removed.

## Capture contract

Playwright runs the application under its native framework using a declared
viewport, device scale factor, locale, timezone, fixtures, and interaction
timeline. Capture output includes media plus a manifest of timing and overlay
coordinates.

- Use device scale factor 2 or greater when 4K fidelity requires it.
- Prefer lossless frame sequences for short, fidelity-critical flows.
- Use video plus manifest as the default for longer flows.
- Declare capture fps, frame count, viewport, and device scale factor.
- Map capture time to composition time; never assume equal frame rates.
- Record actual interaction timestamps and element bounds for cursor,
  highlight, and callout overlays.
- Compose video with `<Video>` from `@remotion/media`.

## Verification gates

1. Static preflight: framework, package manager, React versions, client/server
   boundaries, aliases, providers, global CSS, Storybook, and module ownership.
2. Minimal bundle smoke test before creating a full demo.
3. Still render for every catalog entry under both bundlers.
4. Mandatory delayed double-render pixel diff for determinism.
5. Native Playwright screenshot versus Remotion Still comparison where a story
   or harness exists, normalized for viewport, DPR, fonts, locale, and fixtures.

Pixel comparison is strict by default. Each surface may declare an explicit
color threshold and maximum changed-pixel count for a named comparison gate.
Non-zero tolerance requires a recorded reason; it must never be introduced by
silently weakening a global default.

## Implementation phases

### Phase 0 — stable baseline

1. Restore the clean-clone build with a tracked fallback registry.
2. Upgrade Remotion to a release supporting Rspack and verify existing output.
3. Add a clean-clone CI guard.
4. Establish input, adapter, generated-state, and capture directories.
5. Commit `CLAUDE.md` and a minimal `integrate-native-app` skill.

### Phase 1 — direct-import proof

Integrate one real Vite/React app: absolute module ownership, one provider
boundary, scoped CSS, one native Still, one demo composition, mandatory
determinism diff, and equivalent Webpack/Rspack output.

Status: implemented and verified with the tracked `input/vite-proof` test
fixture. The proof additionally asserts shared runtime identity in the rendered
bundle, proves the root-font rejection guard with a negative test, and produces
a zero-pixel native-page versus Remotion-Still comparison. Its app-specific
implementation is intentionally not yet the generic framework; that extraction
belongs to Phase 2.

### Phase 2 — adapter framework

Extract app configuration, module graph verification, bundler interfaces,
scoped CSS compilation, catalog-to-Still registration, Studio launcher, widget
injection, and reusable preflight commands.

Phase 2 is not complete until the extracted framework is exercised against a
genuinely external OSS Vite application, rather than only the cooperative proof
fixture. Module graph verification must also derive owned subpath coverage
systematically instead of relying on a short manually listed alias set.

Status: implemented. `adapter-runtime/` now provides validated config loading,
pinned upstream fetching, source install/build commands, export-derived
absolute module aliases, preflight reports, scoped CSS generation, active-app
state, generic verification, and the Studio launcher. Browser-safe primitives
in `src/engine/` register adapter catalogs and scale fixed native layouts,
while `src/widgets/` and `ChatSequence` accept merged built-in, native, and
composition-specific widget catalogs.

The external exit gate uses Flatlogic's MIT-licensed React Dashboard at pinned
commit `c96bf57e88c7b674fda6a34b2bf52654e9c96fa6`. Its unchanged dashboard is
mounted with deterministic Redux state and an in-memory router. The integration
exercises Bootstrap global CSS, SCSS modules, Reactstrap, React Redux, and React
Router under both bundlers. It exposed and fixed an incorrect compiler rule
that treated containable `body` font size as document-root `rem` mutation.

The upstream project has no isolated dashboard story or matching native
harness, so native screenshot parity is explicitly unavailable for this
surface. Mandatory delayed determinism and Webpack/Rspack parity remain strict
at zero changed pixels. The tracked proof retains its native-page parity gate.

Post-review hardening keeps each adapter provider's mutable store stable across
React rerenders and renders a visible diagnostic when a data-driven widget key
is missing from the merged catalog.

### Phase 3 — Next.js proof

Validate client boundaries, server-only detection, conservative Next.js shims,
fonts, images, portals, and the evidence-based threshold for moving to capture.

Phase 3 also closes two framework execution gaps carried forward from Phase 2:

- Register and render a composition or Still that injects an adapter-native
  widget catalog into `ChatSequence`, proving the data-driven native-widget path
  in both bundlers.
- Extend the generic verifier to cover every catalog composition at configured
  representative frames, defaulting to its first, middle, and final frame.
  Delayed determinism and Webpack/Rspack parity apply independently to each
  representative frame with the composition's declared pixel tolerance.

Status: implemented and verified with Vercel's MIT-licensed Next.js App Router
Playground at pinned commit
`cd0363f3aefd4f4b50ee1b7655feefcc04695f4c`. The input application builds
unchanged under Next.js 16.3 preview and is admitted at compatibility rung 2
for the selected synchronous UI graph.

The adapter globally resolves React and React DOM to the app-owned 19.2.4
runtime. Preflight checks that app-owned React satisfies Remotion's peer range
and checks other app-owned packages against the builder's declared range. It
compiles Tailwind v4 with the application's own PostCSS plugin and uses narrow
shims for `next/image`, `next/link`, `next/navigation`, and `next/font`. The font
shim loads the real Geist and Geist Mono faces through Remotion's deterministic
font loader. The adapter directly renders native navigation, tabs, boundaries,
product cards, and local image assets. A scoped portal host keeps portaled
native tabs inside the app CSS boundary. A registered 4K Still also renders a
native product card through the injected `ChatSequence` widget catalog.

Preflight now inventories App Router client directives, async Server
Components, framework imports, and server-only modules across non-`src/`
layouts, including function and arrow-form async component exports. It
traverses the adapter's reachable native import graph and rejects reachable
server-only or async component files. A negative test proves that removing the
fixture database shim admits `lib/db.ts` into the graph and fails preflight.

Generic verification now discovers the actual Remotion registry, rejects
catalog entries without verification config, checks every Still, and checks the
first, middle, and final frame of every Composition by default. All five
Next.js proof targets pass delayed determinism and Webpack/Rspack parity with
zero changed pixels.

The evidence does not support one globally dominant rung. Synchronous,
fixture-backed client surfaces remain practical direct imports; async Server
Components, server actions, framework data caches, and route behavior should
move to native pre-capture instead of accumulating behavioral shims. Phase 4
implements that capture path.

### Phase 4 — native capture subsystem

Implement app server lifecycle, Playwright flows, high-DPR media/frame output,
timebase and coordinate manifests, and Remotion capture composition.

Status: implemented and verified against the native Next.js App Router
Playground server. Capture configuration declares a local server command and
frame-addressed flows with fixed route, viewport, device scale factor, locale,
timezone, reduced-motion preference, fps, and frame count. The runtime owns the
server process lifecycle, waits for route readiness and asset loading, executes
Playwright interactions, and records CSS-viewport element bounds and pointer
coordinates.

The `layouts-navigation` proof emits eight lossless 2880×1800 PNG frames from a
1440×900 DPR-2 viewport. The `layouts-video` proof captures sixteen DPR-2 frames
and encodes a 2560×1600 VP9 WebM at 8 fps. The encoder output is probed and must
match its declared resolution, fps, and frame count before `capture.json` is
written. This avoids Playwright's low-resolution recording fallback and makes
the manifest the authoritative media timebase.

Capture reproducibility is also mechanized. Each proof flow is generated twice
with a wall-clock delay. Frame-sequence verification hashes decoded PNG pixels;
video verification hashes decoded frames, intentionally ignoring non-semantic
WebM container variation. Both Next.js capture flows reproduce exactly.

State-changing steps use explicit same-frame readiness barriers for their
resulting UI. Readiness-only waits are excluded from recorded interaction
overlays. On a reproducibility failure, the verifier reports whether manifest
fields or named decoded frames changed and preserves both attempts for CI
diagnostics.

Viewport image readiness requires a successfully decoded candidate rather than
the HTML `complete` flag alone. Lazy images may report complete before a source
candidate has loaded, which produced a Linux-only first-frame race in the
Next.js proof and is now covered by the capture runtime.

Generated capture assets are environment-local. They should be regenerated on
the CI image or target render machine; strict pixel identity is an intra-machine
gate and is not promised across operating systems with different font and
browser rasterization.

`CaptureComposition` consumes both manifest variants, maps composition frames
to capture frames using the ratio of their declared frame rates, loads frame
sequences with Remotion `Img`, and loads video with `Video` from
`@remotion/media`. Composition duration is calculated from the manifest rather
than duplicated in adapter code. Cursor movement, target highlights, and
callouts are drawn by Remotion from the recorded coordinates. First, middle,
and final frames of both capture compositions pass delayed determinism and
Webpack/Rspack parity with strict zero-pixel tolerance.

Capture-backed verification surfaces declare their source flow. The generic
verifier validates each manifest and referenced media before preflight, failing
with the exact `app:capture` command when generated assets are absent or stale.
Capture catalog entries derive metadata from the same fps value used to
register the composition, eliminating duplicated timebase configuration.

### Phase 5 — mature the skill

Update `integrate-native-app` with the proven recipes, failure classifications,
and scripts from Phases 1–4. Keep the Phase 0 invariants stable.

Status: implemented. The shared skill now uses progressive disclosure: its
entrypoint preserves repository and rendering invariants, then routes agents to
focused direct-import, native-capture, and verification/failure-classification
references. The recipes encode the module-ownership, client/server admission,
CSS containment, physical viewport, deterministic fixture, native server,
frame-addressed capture, manifest, timebase, overlay, and same-environment pixel
rules demonstrated by the three proof adapters.

The failure guide maps observed symptoms to corrective action and makes rung
changes evidence-based. It distinguishes bootstrap, runtime identity,
direct-import incompatibility, shim fidelity, CSS containment, autonomous time,
bundler portability, capture contract, capture reproducibility, tolerance, and
cross-environment failures. The canonical skill remains under `.agents/skills/`
and Claude Code discovers the same files through the existing `.claude/skills/`
symlink.

### Phase 6 — DOM-anchored overlays and a product-tour toolkit

Not part of the original six-phase plan; added after a fourth proof adapter
(a private, non-public Next.js app with no pinned upstream) was used to
build an actual scripted demo video
rather than a Still or a bare fade-in, and a hand-estimated highlight
rectangle was caught pointing at the wrong panel after a fixture change moved
the layout underneath it.

Status: implemented. `src/engine/anchors.tsx` (`AnchorSurface`,
`useAnchorRect`/`useAnchorRects`) measures overlay targets from the live,
post-font-load DOM by text/selector/`closest()`, in design-space units. A
missing anchor cancels the render rather than falling back to a guessed
rectangle. `src/engine/tour/` builds a themeable, reusable toolkit on top of
it (`beat.ts` for fps-independent timeline authoring, `camera.ts` for
keyframed pan/zoom, `overlays.tsx` for anchor-driven highlight rings, cursor
paths, and captions, `cards.tsx` for title/end cards, and
`camera-anchors.ts` for pointing the camera itself at measured element
bounds via a `fitBounds`-style fit — the same "detect the target element,
frame its bounds" idea current screen-recording demo tools use for automatic
zoom, rather than a hand-picked `{cx, cy, z}`). `integrate-native-app`'s
[product-tour.md](../.agents/skills/integrate-native-app/references/product-tour.md)
documents the toolkit's rules, including three refactor mistakes (a
collapsed box-shadow alpha, a spring driven by the wrong fps, a collapsed
two-color theme) that shipped past the delayed-determinism and
Webpack/Rspack-parity gates — both compare a render against itself, so they
cannot catch confidently, consistently wrong output — and were only caught
by pixel-diffing against a known-good baseline render.

This phase does not change the Phase 0–5 invariants; it adds presentation
tooling used once a surface is already admitted through the compatibility
ladder described above.

### Phase 7 — a fifth proof adapter, built by a fresh agent with no prior context

Not part of the original plan either; added as an end-to-end validation
exercise. A general-purpose agent, given only this repository's own public
docs and skill (no memory of Phases 0–6), was asked to integrate a real,
previously untouched app: Horizon UI's MIT-licensed Tailwind React admin
dashboard (Create React App, Tailwind v3, Chakra UI, ApexCharts, React
Router — a stack combination none of the first four adapters exercise). It
produced `adapters/horizon-tailwind-react/`, admitted at direct-import rung
1, independently re-verified afterward (fresh `app:fetch`, `app:install`,
`app:check`, `app:verify`, and a rendered frame inspected by eye) rather than
trusted on its own report.

It correctly solved four real problems using only the skill's existing
rules: a CSS tooling version mismatch (Tailwind v3 has no single-file
"expand all utilities" build this repo's compiler can process directly, so
the adapter lets the app's own build produce and purge its CSS, then scopes
that output — the same idea `oss-dashboard` already uses for prebuilt
Bootstrap CSS); an exact-version React pin narrower than the host's own
range, resolved by flipping module ownership to the app, the same direction
`next-playground` already uses for the same reason; two components reading
`new Date()` directly, fixed with environment-mocking shims per the
"mock the environment, not the component" rule; and a real determinism-gate
catch — ApexCharts' animated initial draw-in is JS-driven, not CSS, so the
scoped-CSS motion suppressor could not reach it, and the fix (disable that
one animation through the chart library's own option) is now a second,
independent confirmation of the same underlying category: a native
component's own script-driven mount animation needs the library's own
disable mechanism, not a CSS rule.

Two problems were genuinely new: a package with no `exports` map at all
(`react-icons`) needed every consumed subpath declared explicitly rather
than derived, and Create React App's implicit `src/`-relative import
resolution needed an adapter-local bundler `resolve.modules` addition
instead of one alias per bare import — both folded into
[direct-import.md](../.agents/skills/integrate-native-app/references/direct-import.md).
The one adapter-authored lint violation (an untyped bundler override inline
in a `.ts` file) was caught by running `npm run lint` against this
repository's real committed state before review, not by trusting the
agent's own report of success — the same lesson Phase 6's own retrospective
already recorded about verifying against a real baseline rather than a
self-report.
