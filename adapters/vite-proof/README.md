# Vite direct-import proof

This adapter is the reference direct-import implementation. It mounts the real
`Dashboard` component from the tracked test fixture at `input/vite-proof`,
supplies its native provider, and leaves all product UI in the input
application. Normal user-provided applications under `input/` remain ignored.

The proof intentionally exercises the difficult boundaries:

- Absolute host ownership for React, React DOM, both JSX runtimes, and Zod.
- Runtime identity assertions across the input/adapter boundary.
- Generated selector-scoped CSS with hoisted `@property`, namespaced
  keyframes, root font-size rejection, and scoped autonomous-motion
  suppression.
- A fixed 1440×900 layout surface transform-scaled into 1920×1080 output.
- Catalog registration for the native Still plus a frame-driven demo.
- Delayed deterministic rendering, native visual comparison, and
  Webpack/Rspack parity checks.
- Per-surface pixel tolerances that are declared in `app.config.mjs` and remain
  strict at zero for this fixture.
- A negative test proving that document-root font mutation is rejected.

Run it from the repository root:

```bash
npm ci --prefix input/vite-proof
npm run proof:vite:check
npm run proof:vite:studio
npm run proof:vite:verify
```

`npm run proof:vite:prepare` writes generated CSS and its manifest to
`.remotion-app/vite-proof/`.
