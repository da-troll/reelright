# Horizon UI Tailwind React adapter

This adapter imports the native admin dashboard from Horizon UI's
MIT-licensed `horizon-tailwind-react` repository at pinned commit
`8f17779f2b45419112f32541bb555817dabc5b7c`.

It exercises a stack combination none of this repo's other adapters touch:
Create React App (not Vite or Next.js), Tailwind v3, Chakra UI/Emotion,
ApexCharts, React Router, and `react-icons`.

## Notable integration decisions

- **CSS**: Tailwind v3 has no single-file "expand every utility" build this
  repo's CSS compiler can process directly, so `sourceCommands.build` wraps
  the app's own `npm run build` (`scripts/build-and-copy-css.mjs`) and points
  `css.entries` at its already-compiled, already-purged output — copied to a
  stable filename since Create React App content-hashes it.
- **Module resolution**: the app resolves its own files as bare specifiers
  rooted at `src/` (Create React App's implicit `baseUrl` behavior).
  `bundler.mjs` adds that directory to `resolve.modules` as an adapter-local
  override, applied identically to Webpack and Rspack, rather than aliasing
  every bare import individually.
- **Module ownership**: `react`/`react-dom` are app-owned because the app
  pins an exact `19.0.0` with no semver range, which fails a host-owned range
  check even though both are React 19 — the same direction `next-playground`
  uses for the same reason. `react-icons` has no `exports` field, so every
  icon family subpath it uses is declared explicitly.
- **Determinism**: `MiniCalendar` and `Footer` both seed themselves from
  `new Date()` with no override prop — shimmed to a fixed reference date,
  mirroring their real markup exactly. ApexCharts' animated initial draw-in
  is JS-driven, not CSS, so the scoped-CSS motion suppressor can't reach it;
  a shim disables that one animation through the chart library's own option.
- **Providers**: `providers.tsx` recreates only the app's single
  `admin/*` route rather than importing the real `App.jsx`, which would also
  eagerly mount `AuthLayout`/`RtlLayout` (and, through `AuthLayout`, Chakra UI
  + Emotion) for surfaces this demo never renders. The rendered dashboard
  itself is still the unmodified native component.

## Commands

```bash
npm run app:fetch -- --app horizon-tailwind-react
npm run app:install -- --app horizon-tailwind-react
npm run app:check -- --app horizon-tailwind-react
npm run app:verify -- --app horizon-tailwind-react
npm run app:studio -- --app horizon-tailwind-react
```

The cloned upstream repository remains ignored under
`input/horizon-tailwind-react`.
