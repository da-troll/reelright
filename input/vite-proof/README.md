# Tracked Vite proof fixture

This purpose-built Vite/React application is the sole tracked exception under
`input/`. It keeps the Phase 1 native-import adapter reproducible in clean
clones and CI. User-provided applications under `input/<app-id>/` remain
ignored.

The fixture deliberately includes:

- A native provider and stateful dashboard component.
- A registered CSS property and autonomous keyframe animation.
- Global `:root` and `body` styles consumed by the adapter's scoped compiler.
- An unused scaffold `src/index.css` with a document-root `font` declaration,
  used as a negative test for the root-font mutation guard.
- Runtime exports used to prove shared-module identity inside the rendered
  bundle.

Install its dependencies independently from the repository root:

```bash
npm ci --prefix input/vite-proof
```
