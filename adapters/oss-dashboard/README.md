# External OSS dashboard adapter

This adapter imports the native dashboard from Flatlogic's
MIT-licensed `react-dashboard` repository at pinned commit
`c96bf57e88c7b674fda6a34b2bf52654e9c96fa6`.

The adapter supplies deterministic Redux state and an in-memory router around
the unchanged dashboard component. It exercises React 19, Redux context,
React Router context, Reactstrap, Bootstrap global CSS, and SCSS modules under
both Webpack and Rspack.

```bash
npm run app:fetch -- --app oss-dashboard
npm run app:install -- --app oss-dashboard
npm run app:check -- --app oss-dashboard
npm run app:studio -- --app oss-dashboard
```

The cloned upstream repository remains ignored under `input/oss-dashboard`.
