import { existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const findPackageRoot = (moduleRequire, packageName) => {
  try {
    return path.dirname(moduleRequire.resolve(`${packageName}/package.json`));
  } catch {
    let current = path.dirname(moduleRequire.resolve(packageName));

    while (current !== path.dirname(current)) {
      const candidate = path.join(current, "package.json");

      if (existsSync(candidate) && readJson(candidate).name === packageName) {
        return current;
      }

      current = path.dirname(current);
    }
  }

  throw new Error(`Could not find package root for ${packageName}`);
};

const exportedSubpaths = (packageJson) => {
  const keys = new Set(["."]);
  const exportsField = packageJson.exports;

  if (
    exportsField &&
    typeof exportsField === "object" &&
    !Array.isArray(exportsField)
  ) {
    for (const key of Object.keys(exportsField)) {
      if (key === "." || (key.startsWith("./") && !key.includes("*"))) {
        keys.add(key);
      }
    }
  }

  return [...keys];
};

const ownerRequire = (config, owner) => {
  const root = owner === "host" ? config.repositoryRoot : config.sourceRoot;
  return createRequire(path.join(root, "package.json"));
};

const isInside = (parent, candidate) => {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

export const getOwnedModuleRecords = (config) => {
  const records = [];

  for (const declaration of config.moduleOwnership) {
    if (declaration.owner !== "host" && declaration.owner !== "app") {
      throw new Error(
        `Unsupported owner for ${declaration.package}: ${declaration.owner}`,
      );
    }

    const moduleRequire = ownerRequire(config, declaration.owner);
    const packageRoot = realpathSync(
      findPackageRoot(moduleRequire, declaration.package),
    );
    const packageJson = readJson(path.join(packageRoot, "package.json"));

    if (
      declaration.owner === "app" &&
      !isInside(path.join(config.sourceRoot, "node_modules"), packageRoot)
    ) {
      throw new Error(
        `App-owned ${declaration.package} resolved outside the app node_modules: ${packageRoot}`,
      );
    }
    if (
      declaration.owner === "host" &&
      !isInside(path.join(config.repositoryRoot, "node_modules"), packageRoot)
    ) {
      throw new Error(
        `Host-owned ${declaration.package} resolved outside the host node_modules: ${packageRoot}`,
      );
    }
    const subpaths = new Set([
      ...exportedSubpaths(packageJson),
      ...(declaration.includeSubpaths ?? []).map((subpath) =>
        subpath === "." || subpath.startsWith("./") ? subpath : `./${subpath}`,
      ),
    ]);

    for (const subpath of subpaths) {
      const specifier =
        subpath === "."
          ? declaration.package
          : `${declaration.package}${subpath.slice(1)}`;

      try {
        records.push({
          absolutePath: realpathSync(moduleRequire.resolve(specifier)),
          owner: declaration.owner,
          packageName: declaration.package,
          packageRoot,
          specifier,
          version: packageJson.version,
        });
      } catch (error) {
        if ((declaration.requiredSubpaths ?? []).includes(subpath)) {
          throw new Error(`Cannot resolve required owned module ${specifier}`, {
            cause: error,
          });
        }
      }
    }
  }

  return records;
};

export const getOwnedModuleAliases = (config) => {
  return Object.fromEntries(
    getOwnedModuleRecords(config).map(({ absolutePath, specifier }) => [
      `${specifier}$`,
      absolutePath,
    ]),
  );
};

export const createModuleOwnershipReport = (config) => {
  const records = getOwnedModuleRecords(config);
  const packages = Object.groupBy(records, (record) => record.packageName);

  return {
    aliases: Object.fromEntries(
      records.map(({ absolutePath, specifier }) => [specifier, absolutePath]),
    ),
    packages: Object.fromEntries(
      Object.entries(packages).map(([packageName, packageRecords]) => [
        packageName,
        {
          owner: packageRecords[0].owner,
          packageRoot: packageRecords[0].packageRoot,
          specifiers: packageRecords.map((record) => record.specifier).sort(),
          version: packageRecords[0].version,
        },
      ]),
    ),
  };
};
