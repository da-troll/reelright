import { spawn, spawnSync } from "node:child_process";
import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { compileScopedCss } from "./scoped-css.mjs";
import { runCapture, verifyCaptureReproducibility } from "./capture.mjs";
import { validateCaptureConfig } from "./capture-contract.mjs";
import { loadAppConfig } from "./config.mjs";
import { getOwnedModuleAliases } from "./module-ownership.mjs";
import { runPreflight } from "./preflight.mjs";
import { verifyAdapter } from "./verify.mjs";

const parseArguments = (argv) => {
  const [command = "help", ...rest] = argv;
  const options = {};

  for (let index = 0; index < rest.length; index++) {
    const argument = rest[index];

    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }

    const [rawKey, inlineValue] = argument.slice(2).split("=", 2);
    const value = inlineValue ?? rest[index + 1];

    if (inlineValue === undefined) {
      index++;
    }

    options[rawKey] = value;
  }

  return { command, options };
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with ${result.status}`,
    );
  }
};

const relativeToRepository = (config, value) =>
  path.relative(config.repositoryRoot, value);

const writeActiveAdapter = async (config) => {
  const activeRoot = path.join(config.repositoryRoot, ".remotion-app");
  const manifestPath = path.join(activeRoot, "active-adapter.json");
  const ownership = getOwnedModuleAliases(config);

  await mkdir(activeRoot, { recursive: true });
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        appId: config.id,
        entryPoint: relativeToRepository(config, config.remotion.entryPoint),
        generatedAt: new Date().toISOString(),
        moduleAliases: ownership,
        remotionConfig: relativeToRepository(
          config,
          config.remotion.configFile,
        ),
      },
      null,
      2,
    )}\n`,
  );

  return manifestPath;
};

const ensureSourceExists = async (config) => {
  try {
    await access(path.join(config.sourceRoot, "package.json"));
  } catch {
    throw new Error(
      `Input app ${config.id} is missing at ${config.sourceRoot}. ` +
        (config.upstream
          ? `Run \`npm run app:fetch -- --app ${config.id}\`.`
          : "Clone or copy it into input/ first."),
    );
  }
};

const fetchApp = async (config) => {
  if (!config.upstream?.repository || !config.upstream?.commit) {
    throw new Error(`Adapter ${config.id} has no pinned upstream source`);
  }

  try {
    await access(config.sourceRoot);
    const result = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: config.sourceRoot,
      encoding: "utf8",
    });

    if (
      result.status !== 0 ||
      result.stdout.trim() !== config.upstream.commit
    ) {
      throw new Error(
        `Existing ${config.sourceRoot} is not pinned commit ${config.upstream.commit}; refusing to modify it`,
      );
    }

    console.log(`${config.id} is already at ${config.upstream.commit}`);
    return;
  } catch (error) {
    if (error?.message?.includes("refusing to modify")) {
      throw error;
    }
  }

  await mkdir(path.dirname(config.sourceRoot), { recursive: true });
  run("git", ["clone", config.upstream.repository, config.sourceRoot], {
    cwd: config.repositoryRoot,
  });
  run("git", ["checkout", "--detach", config.upstream.commit], {
    cwd: config.sourceRoot,
  });
};

const checkApp = async (config) => {
  if (config.capture) {
    validateCaptureConfig(config);
  }

  if (config.sourceCommands?.build) {
    const [command, ...args] = config.sourceCommands.build;
    run(command, args, { cwd: config.sourceRoot });
  }

  const { reportPath } = await runPreflight(config);
  const { outputPath } = await compileScopedCss(config);

  run("npx", ["tsc", "-p", config.remotion.tsconfig], {
    cwd: config.repositoryRoot,
  });

  console.log(
    `Checked ${config.id}: ${relativeToRepository(config, reportPath)}, ` +
      relativeToRepository(config, outputPath),
  );
};

const listApps = async (repositoryRoot) => {
  const adaptersRoot = path.join(repositoryRoot, "adapters");
  const entries = await readdir(adaptersRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    try {
      await access(path.join(adaptersRoot, entry.name, "app.config.mjs"));
      console.log(entry.name);
    } catch {
      // This directory is documentation or shared adapter support.
    }
  }
};

const showHelp = () => {
  console.log(`Usage: node scripts/remotion-app.mjs <command> --app <app-id>

Commands:
  capture     Run a configured native Playwright capture flow
  capture-verify  Capture the flow twice and compare manifests plus decoded pixels
  check       Run preflight, scoped CSS generation, and adapter type-checking
  fetch       Clone a configured upstream app at its pinned commit
  install     Install the input application's npm dependencies
  list        List configured adapters
  preflight   Inspect framework and module ownership
  prepare     Generate scoped CSS and active adapter state
  studio      Prepare the adapter and start Remotion Studio
  verify      Verify every Still and representative Composition frame under both bundlers
`);
};

export const runAdapterCli = async (argv, repositoryRoot = process.cwd()) => {
  const { command, options } = parseArguments(argv);

  if (command === "help") {
    showHelp();
    return;
  }
  if (command === "list") {
    await listApps(repositoryRoot);
    return;
  }
  if (!options.app) {
    throw new Error(`Command ${command} requires --app <app-id>`);
  }

  const config = await loadAppConfig(options.app, repositoryRoot);

  if (command === "fetch") {
    await fetchApp(config);
    return;
  }

  await ensureSourceExists(config);

  if (command === "install") {
    const [installCommand, ...installArgs] = config.sourceCommands?.install ?? [
      "npm",
      "ci",
    ];
    run(installCommand, installArgs, { cwd: config.sourceRoot });
    return;
  }
  if (command === "capture") {
    if (!options.flow) {
      throw new Error("Command capture requires --flow <flow-id>");
    }
    await runCapture(config, options.flow);
    return;
  }
  if (command === "capture-verify") {
    if (!options.flow) {
      throw new Error("Command capture-verify requires --flow <flow-id>");
    }
    await verifyCaptureReproducibility(config, options.flow);
    return;
  }
  if (command === "preflight") {
    const { reportPath } = await runPreflight(config);
    console.log(
      `Preflight passed: ${relativeToRepository(config, reportPath)}`,
    );
    return;
  }
  if (command === "prepare") {
    const { outputPath } = await compileScopedCss(config);
    const manifestPath = await writeActiveAdapter(config);
    console.log(
      `Prepared ${relativeToRepository(config, outputPath)} and ${relativeToRepository(config, manifestPath)}`,
    );
    return;
  }
  if (command === "check") {
    await checkApp(config);
    return;
  }
  if (command === "verify") {
    await verifyAdapter(config);
    return;
  }
  if (command === "studio") {
    await runPreflight(config);
    await compileScopedCss(config);
    await writeActiveAdapter(config);

    const child = spawn(
      "npx",
      [
        "remotion",
        "studio",
        relativeToRepository(config, config.remotion.entryPoint),
        `--config=${relativeToRepository(config, config.remotion.configFile)}`,
      ],
      { cwd: config.repositoryRoot, stdio: "inherit" },
    );
    const exitCode = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", resolve);
    });

    process.exitCode = exitCode ?? 1;
    return;
  }

  throw new Error(`Unknown command: ${command}`);
};
