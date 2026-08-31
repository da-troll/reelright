import { access, readFile } from "node:fs/promises";
import path from "node:path";
import {
  validateCaptureConfig,
  validateCaptureManifest,
} from "./capture-contract.mjs";

const captureCommand = (appId, flowId) =>
  `npm run app:capture -- --app ${appId} --flow ${flowId}`;

const artifactError = (config, surfaceId, flowId, detail) =>
  new Error(
    `Verification surface ${surfaceId} requires capture flow ${flowId}, but ${detail}. ` +
      `Run \`${captureCommand(config.id, flowId)}\` first.`,
  );

const assertFileExists = async (file, error) => {
  try {
    await access(file);
  } catch {
    throw error;
  }
};

export const assertVerificationCapturesExist = async (config) => {
  const requiredSurfaces = Object.entries(
    config.verification?.surfaces ?? {},
  ).filter(([, surface]) => surface.captureFlow);

  if (requiredSurfaces.length === 0) {
    return;
  }

  const capture = validateCaptureConfig(config);
  const flows = new Map(capture.flows.map((flow) => [flow.id, flow]));

  for (const [surfaceId, surface] of requiredSurfaces) {
    const flowId = surface.captureFlow;

    if (!flows.has(flowId)) {
      throw new Error(
        `Verification surface ${surfaceId} references unknown capture flow ${flowId}`,
      );
    }

    const outputRoot = path.resolve(
      config.repositoryRoot,
      "public/generated",
      config.id,
      flowId,
    );
    const manifestPath = path.join(outputRoot, "capture.json");
    const missingManifest = artifactError(
      config,
      surfaceId,
      flowId,
      "capture.json is missing",
    );
    await assertFileExists(manifestPath, missingManifest);

    let manifest;
    try {
      manifest = validateCaptureManifest(
        JSON.parse(await readFile(manifestPath, "utf8")),
      );
    } catch (error) {
      throw artifactError(
        config,
        surfaceId,
        flowId,
        `capture.json is invalid (${error instanceof Error ? error.message : String(error)})`,
      );
    }

    if (manifest.appId !== config.id || manifest.flowId !== flowId) {
      throw artifactError(
        config,
        surfaceId,
        flowId,
        `capture.json identifies ${manifest.appId}/${manifest.flowId}`,
      );
    }

    const mediaFiles =
      manifest.mediaKind === "frames" ? manifest.files : [manifest.file];

    for (const mediaFile of mediaFiles) {
      await assertFileExists(
        path.join(outputRoot, mediaFile),
        artifactError(
          config,
          surfaceId,
          flowId,
          `referenced media ${mediaFile} is missing`,
        ),
      );
    }
  }
};
