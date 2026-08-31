# Direct-import recipe

Use this path for a reachable, synchronous client-component graph that can be
rendered deterministically without recreating application behavior.

## 1. Admit the source graph

- Run `app:preflight` before authoring a large demo.
- Start from the exact native component, Storybook story, or narrow client
  surface the demo needs. Trace its transitive imports.
- Treat reachable `server-only`, `next/headers`, `next/server`, `next/cache`,
  async Server Components, server actions, and equivalent framework-only
  boundaries as hard failures for direct import.
- Prefer a fixture boundary over importing a database, API client, auth server,
  or environment-dependent service. A fixture shim should provide data, not
  emulate a framework runtime.

If removing one proposed shim makes a server-only file reachable, the preflight
negative case should fail and name that file. This proves the boundary is real.

## 2. Resolve module identity

Declare module ownership directionally. The chosen owner's absolute real path
must resolve for every importer, including exported subpaths.

Always inspect:

- `react`, `react-dom`, `react/jsx-runtime`, and `react/jsx-dev-runtime`
- `zod` when schemas cross the boundary
- Provider/consumer libraries such as React Redux, React Router, React Query,
  Emotion, styled-components, or Zustand

Use the runtime's export-derived aliases rather than maintaining a short list
of guessed deep imports. Preflight must verify a single resolved instance. If
React is app-owned, verify it against Remotion's actual peer dependency range;
if a different module is app-owned, verify it against the builder's declared
range where one exists.

A package with no `exports` field at all (older or less strict packages)
gives the runtime nothing to derive subpaths from; declare each subpath the
adapter actually imports explicitly via `includeSubpaths`/`requiredSubpaths`
rather than skipping ownership for that module.

Module ownership only covers imports of installed packages. An app that
resolves its own internal files as bare specifiers rooted at its own source
directory (Create React App's implicit `src/`-relative resolution, or an
explicit bundler `baseUrl`) needs a different fix: add that directory to the
bundler's module resolution search path (e.g. Webpack/Rspack's
`resolve.modules`) as an adapter-local override, the same way Node already
searches `node_modules` — not one alias per bare import across the app.

## 3. Build the adapter environment

- Put adapter providers in `providers.tsx`. Create mutable stores once with a
  lazy initializer so React rerenders do not reset state.
- Put deterministic data in `fixtures/` and framework replacements in `shims/`.
- Make navigation, redirect, and not-found shims loud for unsupported behavior.
  A shim is acceptable only when it preserves the behavior used by the demo.
- Load real fonts deterministically. Do not hide a typography change behind a
  silent system-font fallback.
- Map native images onto Remotion-safe loading, such as `Img`, while preserving
  the dimensions and fitting behavior the surface uses.
- Keep portals inside an adapter-owned host within the scoped surface.

## 4. Compile and contain CSS

Use the generic scoped compiler. It must:

- translate `:root`, `html`, and `body` selectors into the app scope;
- hoist `@property` and `@font-face` to document scope;
- collision-check registered property names;
- namespace keyframes and rewrite their animation references;
- reject document-root font-size mutations because scoped CSS cannot contain
  their effect on `rem`;
- append the scoped autonomous-motion suppressor, which also makes scrollbar
  thumbs/tracks transparent: overlay-scrollbar fade runs on browser timers and
  intermittently leaks into screenshots of scrollable surfaces. Make the paint
  transparent, never remove the scrollbar box (`display: none` /
  `scrollbar-width: none`) — Remotion's headless Chromium reserves layout
  space for classic scrollbars, so removing the box changes a scrollable
  container's content width and can race with a native component's own
  resize-driven measurement, trading one nondeterminism source for another.

For Tailwind v4, compile with the input application's own PostCSS plugin and add
adapter sources to Tailwind scanning before selector scoping. Do not introduce a
second Tailwind runtime. Use Shadow DOM only after confirming the app does not
depend on Tailwind v4 registered properties or root variables.

For a CSS toolchain this repo's compiler has no processor for (Tailwind v3 and
earlier have no equivalent single-file "expand every utility" build the way
v4's PostCSS plugin does), let the app's own build produce and purge its real
CSS, then point `css.entries` at that already-compiled output and scope it
through the plain processor — the same technique already used for a
Bootstrap-based adapter's prebuilt CSS. If the build tool content-hashes its
output filename, wrap the build command in a small script that copies the
result to a stable name `css.entries` can reference.

## 5. Preserve physical layout

Render the native subtree through `DeterministicAppSurface` at its declared
design width and height. The component creates a fixed-size layout container
and transform-scales it into the composition. A width/height prop alone does
not establish the viewport used by media or container queries.

Keep engine cursors, callouts, and framing outside the scoped native subtree so
application resets cannot restyle them.

## 6. Anchor overlay geometry to the DOM

Highlight rings, cursors, callouts, and any overlay that points at native UI
must derive their geometry from the rendered page, never from hand-estimated
coordinates. Estimated rectangles break silently the moment fixtures, CSS, or
the upstream app change — the overlay keeps rendering, in the wrong place.

- Wrap the native page in the engine's `AnchorSurface` and resolve targets
  with `useAnchorRect` by text, selector, and `closest()` ancestor.
- A missing anchor must cancel the render. Never fall back to a guessed
  rectangle or skip the overlay silently.
- Scope anchors to the frames where their overlay is active when the target
  only exists in part of the timeline (for example a data-driven cell).
- Add explicit `frames` to the surface's verification config so every anchored
  scene is rendered by `app:verify`; a stale anchor then fails the gate
  instead of shipping a mispointed demo.

## 7. Register and prove the surface

- Import native components directly from demo files for TypeScript prop checks.
- Register Stills and Compositions through `defineAdapterCatalog`.
- A native widget catalog may be merged with the video-native widget library.
  Render at least one executing consumer when adding a new injection path.
- Run `app:check` for source build, preflight, CSS compilation, and adapter
  typecheck.
- Run `app:verify` for registry completeness, delayed double-render
  determinism, and Webpack/Rspack parity at representative frames.
- When a matching native route or story exists, compare its Playwright
  screenshot to the Remotion Still under identical viewport, DPR, fonts,
  locale, reduced-motion preference, and fixtures.
