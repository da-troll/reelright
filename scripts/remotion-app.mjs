#!/usr/bin/env node

import { runAdapterCli } from "../adapter-runtime/cli.mjs";

await runAdapterCli(process.argv.slice(2));
