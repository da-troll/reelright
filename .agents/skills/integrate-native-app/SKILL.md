---
name: integrate-native-app
description: Integrate native UI from an application under input/ into deterministic Remotion Stills, demos, and scripted product-tour videos (camera pans, DOM-anchored highlights/cursor/captions). Use when inspecting an input app, creating or debugging an adapter, registering native components in Studio, deciding between direct import and native pre-capture, or building an actual demo/walkthrough video from an admitted surface.
---

# Integrate a native application

Preserve the input application's product UI. Remotion owns time, motion,
capture composition, and presentation; do not silently replace native UI with a
lookalike.

## Repository contract

- Treat `input/<app-id>/` as read-only source unless the user asks to modify it.
- Commit durable integration code under `adapters/<app-id>/`.
- Keep generated active state in `.remotion-app/` and captures in
  `public/generated/<app-id>/`; do not commit either.
- Never copy secrets or local environment values into the adapter.
- Preserve the tracked fallback registry so a clean clone builds with no active
  input application.

This project's extended architecture rationale is kept in private,
internal notes not included in this distribution. Proceed carefully before
changing `adapter-runtime/`, the CSS compiler, bundler infrastructure, or the
capture contract. Ordinary app adapters should use those facilities rather
than forking them.

## Workflow

1. Inventory the input app: package manager, build command, framework, React
   version, routing, global CSS, providers, aliases, fonts, assets, Storybook or
   demo routes, and the component graph needed for the requested demo.
2. Create `adapters/<app-id>/app.config.mjs` and use the generic commands. For a
   pinned external source, run `app:fetch` and `app:install`; otherwise verify
   the existing input checkout without rewriting it.
3. Start with `npm run app:preflight -- --app <app-id>`. Choose a compatibility
   rung from evidence, not preference:
   - Direct import when the reachable UI is a synchronous client graph and
     fixtures, providers, behavior-preserving shims, and scoped CSS can make it
     deterministic. Read [direct-import.md](references/direct-import.md).
   - Native pre-capture when the demo depends on server-only code, async Server
     Components, server actions, framework route behavior, or a shim would have
     to recreate product behavior. Read [capture.md](references/capture.md).
   - Use both in one adapter when different surfaces land on different rungs.
4. Register every Still and Composition in the adapter catalog. Import native
   components directly in authored demos to retain prop checking; use catalogs
   for discovery, registration, and data-driven widget injection.
5. Run the admission gates in
   [verification-and-failures.md](references/verification-and-failures.md).
   Classify failures before changing rungs or tolerances.
6. If the user wants an actual product video — camera movement, callouts,
   narrated pacing — rather than a static Still or a bare fade-in, read
   [product-tour.md](references/product-tour.md) and use the
   `src/engine/tour/` toolkit. An admitted surface is not a finished demo.

## Non-negotiable rendering rules

- The same props and Remotion frame must produce the same pixels.
- Mock the environment around a native component, not the component itself.
- Do not globally freeze browser timers.
- Drive intentional video motion from `useCurrentFrame()` and suppress scoped
  autonomous CSS or library motion.
- Resolve shared modules to one absolute owner path for all importers.
- Inherit the shared `swangle` Chromium OpenGL renderer. A proven adapter-local
  exception must be set after `applyAdapterBundlerConfig()`, documented, and
  reverified under both strict pixel gates; never change the shared default or
  add tolerance to conceal unexplained raster drift.
- Use scoped-prefix CSS by default. Shadow DOM is a last resort only when the
  app does not rely on Tailwind v4 or registered custom properties.
- Never use a live iframe as a render source.

## Command sequence

Use the applicable subset:

```bash
npm run app:fetch -- --app <app-id>
npm run app:install -- --app <app-id>
npm run app:preflight -- --app <app-id>
npm run app:check -- --app <app-id>
npm run app:capture -- --app <app-id> --flow <flow-id>
npm run app:capture:verify -- --app <app-id> --flow <flow-id>
npm run app:verify -- --app <app-id>
npm run app:studio -- --app <app-id>
```

Do not call an adapter complete until every registered surface has passed the
generic verifier. Record why native screenshot parity is unavailable when the
source app has no equivalent route or story harness.
