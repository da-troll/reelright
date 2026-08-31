import { z } from "zod";

const dimensionsSchema = z
  .object({
    height: z.number().int().positive(),
    width: z.number().int().positive(),
  })
  .strict();

const boundsSchema = z
  .object({
    height: z.number().nonnegative(),
    width: z.number().nonnegative(),
    x: z.number(),
    y: z.number(),
  })
  .strict();

const pointerSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .strict();

const baseStep = {
  atFrame: z.number().int().nonnegative(),
  label: z.string().min(1).optional(),
  record: z.boolean().default(true),
};

const captureStepSchema = z.discriminatedUnion("action", [
  z
    .object({
      ...baseStep,
      action: z.literal("waitFor"),
      selector: z.string().min(1),
      state: z
        .enum(["attached", "detached", "hidden", "visible"])
        .default("visible"),
    })
    .strict(),
  z
    .object({
      ...baseStep,
      action: z.literal("hover"),
      selector: z.string().min(1),
    })
    .strict(),
  z
    .object({
      ...baseStep,
      action: z.literal("click"),
      selector: z.string().min(1),
    })
    .strict(),
  z
    .object({
      ...baseStep,
      action: z.literal("fill"),
      selector: z.string().min(1),
      value: z.string(),
    })
    .strict(),
  z
    .object({
      ...baseStep,
      action: z.literal("press"),
      key: z.string().min(1),
      selector: z.string().min(1),
    })
    .strict(),
]);

export const captureFlowSchema = z
  .object({
    colorScheme: z.enum(["dark", "light", "no-preference"]).default("dark"),
    deviceScaleFactor: z.number().min(2),
    disableAnimations: z.boolean().default(true),
    fps: z.number().positive().max(120),
    frameCount: z.number().int().positive(),
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    locale: z.string().min(2).default("en-US"),
    output: z.enum(["frames", "video"]),
    reducedMotion: z.enum(["no-preference", "reduce"]).default("reduce"),
    route: z.string().startsWith("/"),
    steps: z.array(captureStepSchema).default([]),
    timezoneId: z.string().min(1).default("UTC"),
    viewport: dimensionsSchema,
  })
  .strict()
  .superRefine((flow, context) => {
    for (const step of flow.steps) {
      if (step.atFrame >= flow.frameCount) {
        context.addIssue({
          code: "custom",
          message: `Step frame ${step.atFrame} is outside ${flow.frameCount}-frame flow ${flow.id}`,
          path: ["steps"],
        });
      }
    }
  });

const localBaseUrl = z.url().refine((value) => {
  const hostname = new URL(value).hostname;
  return hostname === "127.0.0.1" || hostname === "localhost";
}, "Capture server baseUrl must use localhost or 127.0.0.1");

export const captureConfigSchema = z
  .object({
    flows: z.array(captureFlowSchema).min(1),
    server: z
      .object({
        baseUrl: localBaseUrl,
        command: z.array(z.string()).min(1),
        readyPath: z.string().startsWith("/").default("/"),
        timeoutMs: z.number().int().positive().default(120_000),
      })
      .strict(),
  })
  .strict()
  .superRefine((capture, context) => {
    const ids = new Set();
    for (const flow of capture.flows) {
      if (ids.has(flow.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate capture flow id: ${flow.id}`,
          path: ["flows"],
        });
      }
      ids.add(flow.id);
    }
  });

const interactionSchema = z
  .object({
    action: z.enum(["waitFor", "hover", "click", "fill", "press"]),
    bounds: boundsSchema.nullable(),
    captureFrame: z.number().int().nonnegative(),
    label: z.string().min(1).optional(),
    pointer: pointerSchema.nullable(),
    selector: z.string().min(1),
    timeSeconds: z.number().nonnegative(),
  })
  .strict();

const manifestBase = {
  appId: z.string().min(1),
  conditions: z
    .object({
      colorScheme: z.enum(["dark", "light", "no-preference"]),
      disableAnimations: z.boolean(),
      locale: z.string().min(2),
      reducedMotion: z.enum(["no-preference", "reduce"]),
      timezoneId: z.string().min(1),
    })
    .strict(),
  coordinateSpace: z.literal("css-viewport"),
  deviceScaleFactor: z.number().min(2),
  flowId: z.string().min(1),
  interactions: z.array(interactionSchema),
  outputSize: dimensionsSchema,
  route: z.string().startsWith("/"),
  schemaVersion: z.literal(1),
  source: z
    .object({
      commit: z.string().min(1).nullable(),
      repository: z.string().min(1).nullable(),
    })
    .strict(),
  timebase: z
    .object({
      durationSeconds: z.number().positive(),
      fps: z.number().positive(),
      frameCount: z.number().int().positive(),
    })
    .strict(),
  viewport: dimensionsSchema,
};

export const captureManifestSchema = z
  .discriminatedUnion("mediaKind", [
    z
      .object({
        ...manifestBase,
        files: z.array(z.string().min(1)).min(1),
        mediaKind: z.literal("frames"),
      })
      .strict(),
    z
      .object({
        ...manifestBase,
        codec: z.literal("vp9"),
        encoding: z.literal("crf-18-yuv420p"),
        file: z.string().min(1),
        mediaKind: z.literal("video"),
      })
      .strict(),
  ])
  .superRefine((manifest, context) => {
    if (
      manifest.mediaKind === "frames" &&
      manifest.files.length !== manifest.timebase.frameCount
    ) {
      context.addIssue({
        code: "custom",
        message: "Frame file count must match the declared frame count",
        path: ["files"],
      });
    }

    for (const [index, interaction] of manifest.interactions.entries()) {
      if (interaction.captureFrame >= manifest.timebase.frameCount) {
        context.addIssue({
          code: "custom",
          message: "Interaction frame is outside the capture timebase",
          path: ["interactions", index, "captureFrame"],
        });
      }
    }
  });

export const validateCaptureConfig = (config) => {
  if (!config.capture) {
    throw new Error(`Adapter ${config.id} has no capture configuration`);
  }

  return captureConfigSchema.parse(config.capture);
};

export const validateCaptureManifest = (manifest) =>
  captureManifestSchema.parse(manifest);
