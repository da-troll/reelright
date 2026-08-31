// Wraps the native app's own `npm run build` (invoked with this script's cwd
// set to input/horizon-tailwind-react by adapter-runtime/cli.mjs) and then
// copies Create React App's content-hashed CSS bundle to a stable filename.
//
// Why this exists: the app uses Tailwind v3 (`@tailwind base/components/
// utilities`), which this repo's scoped CSS compiler cannot expand -- it
// only supports a "plain" passthrough processor and a "tailwind-v4"
// processor. So instead this repo's app.config.mjs points `css.entries` at
// the app's own already-compiled, already-purged CSS output. CRA names that
// file `main.<contenthash>.css`, and the hash changes on every build (and a
// fresh `build/` directory is created each time), so app.config.mjs cannot
// reference it directly. This script copies it to a fixed `app.css` name
// after every build so the adapter config has something stable to point at.
import { spawnSync } from "node:child_process";
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const buildResult = spawnSync("npm", ["run", "build"], { stdio: "inherit" });

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

const cssDir = path.resolve("build/static/css");
const hashedCssFile = readdirSync(cssDir).find((file) =>
  /^main\.[a-z0-9]+\.css$/.test(file),
);

if (!hashedCssFile) {
  console.error(
    `Could not find a compiled main.*.css bundle in ${cssDir} after build`,
  );
  process.exit(1);
}

const target = path.join(cssDir, "app.css");
copyFileSync(path.join(cssDir, hashedCssFile), target);

// CRA assumes the build is served from "/" and emits root-relative asset
// URLs (e.g. `url(/static/media/checked.<hash>.svg)`) for assets referenced
// from CSS (here, the custom checkbox's checkmark icon). Remotion's bundler
// resolves url() as filesystem module requests, not server-root paths, and
// the scoped-CSS compiler copies this file's contents into a different
// generated location under .remotion-app/, so a path relative to this file
// would not stay valid there either. Rewrite to the real absolute
// filesystem path instead -- this file is itself a regenerated, gitignored
// build artifact, so an absolute path baked in here is fine (regenerate on
// whichever machine renders, same as this repo's other generated assets).
const mediaDir = path.resolve("build/static/media");
const css = readFileSync(target, "utf8");
const rewritten = css.replaceAll("/static/media/", `${mediaDir}/`);
writeFileSync(target, rewritten);

console.log(`Copied ${hashedCssFile} -> ${path.relative(process.cwd(), target)}`);
