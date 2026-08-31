# Verification and failure classification

Classify evidence before weakening a gate, adding a shim, or moving a surface to
capture.

## Admission sequence

1. `app:preflight`: source availability, framework and package inventory,
   React compatibility, module ownership, aliases, CSS risks, and reachable
   client/server graph.
2. `app:check`: optional native build, preflight, scoped CSS generation, and
   adapter typecheck.
3. `app:capture:verify` for each capture flow: two independently generated
   captures must have identical manifests and decoded pixels.
4. `app:verify`: the Remotion registry and verification config must match; each
   Still and representative Composition frame must pass delayed determinism and
   Webpack/Rspack parity.
5. Native parity when an equivalent source route or Storybook harness exists.

Generic Composition verification defaults to first, middle, and final frames.
Configure additional frames when a meaningful state is otherwise missed.

## Failure classes

| Evidence                                                                                                      | Classification                    | Required response                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Input checkout or dependencies are absent                                                                     | Source bootstrap                  | For a configured pinned upstream, run `app:fetch` and `app:install`. Otherwise report what the user must provide; do not manufacture source.                                                                                        |
| React peer range fails, an invalid-hook error appears, context is empty, or duplicate Zod schemas disagree    | Runtime identity                  | Correct directional module ownership and absolute export-derived aliases. Verify one realpath for every importer. Do not work around it inside the component.                                                                       |
| The reachable graph touches server-only code, an async Server Component, server action, or framework cache    | Direct-import incompatibility     | Narrow the selected client surface or move that behavior to native capture. Do not accumulate behavioral shims.                                                                                                                     |
| A framework shim must emulate routing, data loading, auth, or server semantics used in the demo               | Shim fidelity failure             | Use native capture. Shims may provide deterministic environment boundaries, not counterfeit application behavior.                                                                                                                   |
| Root font-size mutation or registered-property collision is detected                                          | CSS admission failure             | Select a narrower stylesheet or correct adapter scoping inputs. Do not silently drop the rule. Shadow DOM is unavailable for Tailwind v4/registered-property dependencies.                                                          |
| Tailwind utilities, fonts, images, or portals differ from the native surface                                  | Environment fidelity              | Use the app's Tailwind compiler, load real fonts/assets deterministically, and keep portals in the scoped host. Record native parity as unavailable only when no matching harness exists.                                           |
| Two delayed renders differ                                                                                    | Autonomous time or nondeterminism | Find motion, clocks, randomness, network state, lazy assets, or mutable providers. Suppress scoped autonomous motion or fixture the environment. Any unexplained pixel difference fails admission.                                  |
| Webpack and Rspack differ                                                                                     | Bundler portability               | Fix shared alias/resolve behavior or the isolated per-bundler implementation. Do not admit a one-bundler surface.                                                                                                                   |
| Fractionally transformed edges alternate by a one-channel value, and either bundler can produce either result | Raster backend drift              | Test an adapter-local Remotion-supported backend before blaming a bundler. Declare a proven choice as `rendering.chromiumOpenGlRenderer`, record the evidence, and rerun every surface because one backend can destabilize another. |
| `capture.json` or referenced media is missing/invalid                                                         | Missing capture artifact          | Run the exact `app:capture` command printed by `app:verify`, then rerun capture reproducibility and adapter verification.                                                                                                           |
| Encoded resolution, fps, or frame count differs from config                                                   | Capture contract failure          | Reject and regenerate the capture. Never edit the manifest to match incorrect media.                                                                                                                                                |
| Capture hashes differ across repeated runs                                                                    | Native capture nondeterminism     | Stabilize readiness, fixtures, animations, fonts, assets, or source state. Do not compensate with a Remotion pixel tolerance.                                                                                                       |
| Same-machine render pixels differ slightly for a justified rasterization reason                               | Surface tolerance candidate       | Keep strict zero as the default. Add the narrowest per-surface, per-gate threshold and changed-pixel limit with a recorded reason. Never weaken a global default.                                                                   |
| Assets generated on another OS differ                                                                         | Environment mismatch              | Regenerate in the target environment. Cross-OS pixel equality is not part of the capture contract.                                                                                                                                  |
| A highlight, cursor, or callout points at the wrong native element                                            | Hardcoded overlay geometry        | Replace estimated coordinates with `AnchorSurface`/`useAnchorRect` DOM anchors, ensure the anchored frames are in the surface's verification `frames`, and let missing anchors cancel the render.                                   |
| Delayed renders differ only inside a chart, carousel, or other library-driven widget                          | Script-driven mount animation     | The scoped-CSS suppressor only stops CSS animations/transitions. A library that animates via its own JS (many chart libraries) needs that library's own animation-disable option; find it before reaching for a shim.               |

## Completion record

Record for each adapter:

- the selected compatibility rung for each surface and the evidence behind it;
- module owners and all non-trivial shims;
- deterministic fixtures and CSS strategy;
- registered Stills/Compositions and representative verification frames;
- native parity result, or explicit `unavailable` status and reason;
- any adapter-local Chromium OpenGL override and the evidence requiring it;
- any non-zero pixel tolerance and its surface-specific justification.

An unknown widget key must render a visible development diagnostic rather than
silently returning nothing. A verification surface missing from the Remotion
registry, or a registered entry lacking verification config, is a hard failure.
