# Reelright

[![CI](https://github.com/da-troll/reelright/actions/workflows/clean-clone.yml/badge.svg)](https://github.com/da-troll/reelright/actions/workflows/clean-clone.yml)
![license: MIT](https://img.shields.io/badge/license-MIT-brightgreen)
![remotion license: proprietary](https://img.shields.io/badge/remotion%20license-proprietary-critical)
![node](https://img.shields.io/badge/node-22.x-brightgreen)

Reelright turns application prototypes cloned into `input/` into deterministic
Remotion demos and scripted product-tour videos. The cloned application stays
the source of truth for its own product UI; Reelright owns time, motion,
camera, and presentation around it.

**How it works:**

- Clone a real app into `input/<app-id>/` (ignored by Git — never committed).
- An agent — this repo ships a Claude Code skill for exactly this — inspects
  the app and builds `adapters/<app-id>/`: providers, fixtures, CSS scoping,
  and either a direct import of the app's own components or a deterministic
  Playwright pre-capture for surfaces that can't render inside Remotion.
- Every registered Still and Composition must pass a determinism gate
  (a delayed double-render diff plus Webpack/Rspack parity) before an adapter
  is considered done.
- Optionally, script a full product-tour video on top: camera pans, DOM-
  anchored highlights, cursor clicks, and captions — never hand-picked page
  coordinates, which silently point at the wrong element the next time
  something upstream changes shape.

## The quickest start

Paste this to a coding agent (Claude Code, Cursor, etc.) with shell access:

```text
Clone https://github.com/da-troll/reelright.git and set it up:

git clone https://github.com/da-troll/reelright.git
cd reelright
npm install
npm ci --prefix input/vite-proof
npm run proof:vite:verify

That last command renders an actual demo video (out/vite-proof/dashboard-demo.mp4)
of a real app's UI mounted inside Remotion and verified pixel-for-pixel
deterministic - that's the actual point of this project, not the generic
template `npm run dev` shows on its own.

Then read CLAUDE.md and load the `integrate-native-app` skill
(.agents/skills/integrate-native-app/SKILL.md) before doing anything else -
this repo works by following that skill, not by improvising against the
source. If I give you an app to clone into input/<app-id>, follow the
skill's workflow to build its adapter and, if I ask for a demo video, its
product tour.
```

## Quick start

If you'd rather run it yourself:

```bash
git clone https://github.com/da-troll/reelright.git
cd reelright
npm install
```

`npm run dev` opens Remotion Studio, but on its own it only shows Remotion's
generic starter template — that confirms the tool boots, not what Reelright
actually does. To see the real thing, render the tracked `input/vite-proof`
fixture: a small, reproducible test app whose actual UI gets mounted inside
Remotion and verified pixel-for-pixel deterministic across two renders and
both bundlers:

```bash
npm ci --prefix input/vite-proof
npm run proof:vite:verify    # renders out/vite-proof/dashboard-demo.mp4
```

`npm run proof:vite:studio` opens Studio on that fixture directly if you'd
rather look around interactively than just render the file.

Useful checks:

```bash
npm run lint
npm run build
npm run build:rspack
npm run check:clean-clone   # what CI runs on a fresh clone
npm run app:list            # list configured adapters
```

## Features

- **Native-first demos** — mount an application's real components in
  Remotion; never a recreated lookalike.
- **Two compatibility rungs** — direct import for synchronous client UI,
  deterministic Playwright pre-capture for server-rendered, async, or
  otherwise unrenderable surfaces, chosen from evidence per surface.
- **Determinism gates, not vibes** — a delayed double-render pixel diff and
  Webpack/Rspack parity check catch nondeterminism automatically; a missing
  DOM anchor cancels a render instead of drawing in the wrong place.
- **Scripted product-tour videos** — camera pans, DOM-anchored highlight
  rings, cursor clicks, and captions, built from `src/engine/tour/`.
- **Portable adapter runtime** — module ownership, scoped CSS isolation, and
  bundler behavior are handled generically once, in `adapter-runtime/`, and
  reused by every adapter.
- **A Claude Code skill included** — `integrate-native-app` teaches an agent
  the whole workflow: inventory, rung selection, module ownership, CSS
  scoping, capture, and verification.

## Tech stack

| Layer | Tech |
|---|---|
| Video | Remotion + React + TypeScript |
| Bundler | Webpack and Rspack, kept portable per adapter |
| Styling | Scoped-prefix compiled CSS (Tailwind v4-aware); plain CSS otherwise |
| Native pre-capture | Playwright (frame-addressed, not wall-clock recording) |
| Verification | `pixelmatch` pixel diffing, Node's built-in `assert` for tests |
| Agent workflow | A Claude Code skill (`.agents/skills/integrate-native-app/`) |

## Repo layout

```
src/
├── engine/                        # Core Remotion orchestration
│   ├── anchors.tsx                 # DOM-anchored overlay/camera geometry
│   ├── tour/                       # Product-tour toolkit (camera, cursor, captions)
│   ├── AdapterRoot.tsx              # Registers an adapter's Stills/Compositions
│   ├── DeterministicAppSurface.tsx  # Scales a native page into the frame
│   ├── CaptureComposition.tsx       # Plays back a Playwright pre-capture
│   └── catalog.ts                   # Adapter catalog types
├── widgets/                        # Mergeable widget catalog types
├── registry/                       # Tracked fallback composition (clean-clone safety net)
├── ChatSequence/                   # Frame-driven chat + chart demo components
├── AthenaInspo/                    # Alternative chat demo components
├── HelloWorld/                     # Default Remotion template composition
└── theme.ts                        # Placeholder design tokens - see CLAUDE.md
adapters/
├── vite-proof/                     # Tracked fixture: direct-import proof (Vite/React)
├── oss-dashboard/                  # Flatlogic React Dashboard (MIT, pinned commit)
├── next-playground/                # Vercel App Router Playground (MIT, pinned commit)
└── horizon-tailwind-react/         # Horizon UI dashboard (MIT, pinned commit)
adapter-runtime/                    # Generic Node-side runtime every adapter shares
├── config.mjs                       # app.config.mjs loading/validation
├── module-ownership.mjs             # Absolute, export-derived shared-module aliases
├── scoped-css.mjs                   # Scoped-prefix CSS compiler
├── preflight.mjs                    # Framework/React/reachability inspection
├── verify.mjs                       # Delayed double-render + bundler-parity gates
├── capture*.mjs                     # Playwright pre-capture + manifest contract
└── cli.mjs                          # `npm run app:*` command implementations
.agents/skills/
├── integrate-native-app/           # The core skill for this repo
└── remotion-best-practices/        # General Remotion authoring rules
scripts/                            # Fixture and adapter-runtime test/CI scripts
```

`.remotion-app/` (generated active-app state) and `public/generated/`
(generated captures) are both gitignored — see [Input applications](#input-applications).

## How adapters work

Every adapter exposes `adapters/<app-id>/app.config.mjs`. Generic commands
load that config and keep generated state under `.remotion-app/`:

```bash
npm run app:list
npm run app:fetch -- --app <app-id>        # only if the adapter pins an upstream
npm run app:install -- --app <app-id>
npm run app:preflight -- --app <app-id>
npm run app:check -- --app <app-id>
npm run app:capture -- --app <app-id> --flow <flow-id>
npm run app:capture:verify -- --app <app-id> --flow <flow-id>
npm run app:verify -- --app <app-id>
npm run app:studio -- --app <app-id>
```

`app:studio` writes `.remotion-app/active-adapter.json` and starts Studio
with the selected entry point. Switching applications requires a Studio
restart; loading two adapters into one bundle is out of scope.

`oss-dashboard` targets Flatlogic's MIT-licensed React Dashboard at a pinned
commit — a real external Redux + React Router app, imported directly:

```bash
npm run app:fetch -- --app oss-dashboard
npm run app:install -- --app oss-dashboard
npm run app:verify -- --app oss-dashboard
```

`next-playground` targets Vercel's MIT-licensed App Router Playground at a
pinned commit. It imports native Next.js UI directly through deterministic
image, link, navigation, font, data, and portal boundaries — Tailwind v4 is
compiled with the input application's own PostCSS plugin before selector
scoping, and preflight fails if a reachable client graph crosses into
`server-only` code. It also has two Playwright pre-capture flows for surfaces
that can't be imported directly:

```bash
npm run app:fetch -- --app next-playground
npm run app:install -- --app next-playground
npm run test:next-preflight
npm run app:check -- --app next-playground
npx playwright install chromium
npm run app:capture -- --app next-playground --flow layouts-navigation
npm run app:capture -- --app next-playground --flow layouts-video
npm run app:verify -- --app next-playground
```

A pre-capture flow emits either lossless DPR-2 PNG frames (short,
fidelity-critical flows) or DPR-correct frames encoded to VP9 with `ffmpeg`
and probed for actual resolution/timebase (longer flows) — both manifests
record interaction timestamps, element bounds, and pointer coordinates for
frame-driven Remotion overlays. `app:capture:verify` runs a flow twice with a
wall-clock delay and compares the manifest plus decoded pixel/frame hashes;
container metadata is deliberately not a reproducibility signal. Generated
capture assets are environment-local — regenerate them on whichever machine
renders, rather than assuming pixel equality across operating systems.

`horizon-tailwind-react` targets Horizon UI's MIT-licensed Tailwind React
admin dashboard at a pinned commit — a Create React App (not Vite or
Next.js) app using Tailwind v3, Chakra UI, and ApexCharts, none of which the
adapters above touch:

```bash
npm run app:fetch -- --app horizon-tailwind-react
npm run app:install -- --app horizon-tailwind-react
npm run app:check -- --app horizon-tailwind-react
npm run app:verify -- --app horizon-tailwind-react
```

It demonstrates handling a few real, generalizable integration problems:
Tailwind v3 has no single-file "all utilities" build this repo's CSS compiler
can expand directly, so the adapter lets the app's own `npm run build`
produce and purge its CSS, then scopes that finished stylesheet (see
`oss-dashboard`'s prebuilt-CSS approach for the same idea); Create React
App's implicit `src/`-relative import resolution needs an adapter-local
`resolve.modules` bundler override rather than one alias per bare import;
and ApexCharts' animated initial draw-in is disabled through the chart
library's own animation option, not a CSS override — a mount animation
driven by the library's own JS (as most chart libraries' are) can't be
stopped by the scoped-CSS suppressor, which only reaches CSS-driven motion.

Generic verification discovers the registered catalog from Remotion itself:
every Still is checked at frame 0, every Composition at first/middle/final
frames, each under the delayed double-render and Webpack/Rspack pixel gates.
`app:verify` checks required capture artifacts up front and prints the exact
`app:capture` command when one is missing. Native screenshot comparison
against the source app is adapter-specific, required only when the app
exposes a matching route or story harness.

An app with no public upstream (a private or local-only project) follows the
same pattern minus `app:fetch` — clone or copy it into `input/<app-id>`
yourself and verify the existing checkout rather than rewriting it.

Beyond a Still or a fade-in demo, an adapter can also carry a full scripted
product-tour composition (`src/engine/tour/`): camera pans, highlight rings,
cursor clicks, and captions. These must target `src/engine/anchors.tsx` DOM
anchors — text/selector specs, the same kind an adapter's demos already use
— never hand-picked page coordinates. See
[`references/product-tour.md`](.agents/skills/integrate-native-app/references/product-tour.md)
for the toolkit's rules before building one.

## Input applications

Clone or copy an application into its own ignored directory:

```bash
git clone <repository-url> input/<app-id>
```

Treat the input application as source material — read-only unless you're
deliberately changing it. App-specific providers, fixtures, shims, component
registration, demos, and capture flows all live in `adapters/<app-id>/`
instead. Generated active-adapter state belongs in `.remotion-app/`;
generated captures belong in `public/generated/<app-id>/`. Both are
gitignored. `input/vite-proof` is the one tracked exception — a test fixture
that keeps the reference adapter verifiable in clean clones and CI.

## Architectural invariants

- Prefer native application components over recreated product UI.
- Mock the environment around a native component, not the component itself.
- The same props and Remotion frame must produce the same pixels.
- Do not globally freeze browser timers.
- Use scoped CSS compilation by default; Shadow DOM is a constrained fallback.
- Pre-capture native app flows that cannot render deterministically in Remotion.
- Keep adapter bundler behavior portable across Webpack and Rspack.
- Use `<Video>` from `@remotion/media` for generated capture video.
- Anchor overlay and camera geometry (highlights, cursors, callouts, camera
  keyframes) to the live DOM; never hand-pick page coordinates. A missing
  anchor must cancel the render, not fall back to a guess.

Claude Code sessions started at the repository root automatically discover
the project instructions in `CLAUDE.md` and the `integrate-native-app` skill.

## Rendering the fallback

```bash
npx remotion render HelloWorld out/hello-world.mp4
```


## License

Reelright's own code is [MIT licensed](LICENSE).

**Remotion is not.** This project is built on [Remotion](https://remotion.dev)
and the `@remotion/*` packages, which are separately licensed under
[Remotion's own license](https://www.remotion.dev/docs/license) — free for
individuals, non-profits, and for-profit organizations with three or fewer
people; a paid [Company License](https://www.remotion.pro/license) is
required once four or more people (aggregated across any collaborating
parties) operate it. Reelright's MIT license covers only the code in this
repository — it does not, and cannot, extend any rights to Remotion itself.
Using Reelright means using Remotion; each user or organization is
independently responsible for complying with Remotion's own license terms.
