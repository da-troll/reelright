import { Video } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Img,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { compositionFrameToCaptureFrame } from "../../adapter-runtime/capture-timebase.mjs";
import type { CompositionCatalogEntry } from "./catalog";

type Dimensions = { height: number; width: number };
type CaptureBounds = Dimensions & { x: number; y: number };
type CapturePointer = { x: number; y: number };
type CaptureInteraction = {
  action: "waitFor" | "hover" | "click" | "fill" | "press";
  bounds: CaptureBounds | null;
  captureFrame: number;
  label?: string;
  pointer: CapturePointer | null;
  selector: string;
  timeSeconds: number;
};

type CaptureManifestBase = {
  appId: string;
  coordinateSpace: "css-viewport";
  deviceScaleFactor: number;
  flowId: string;
  interactions: CaptureInteraction[];
  outputSize: Dimensions;
  schemaVersion: 1;
  timebase: {
    durationSeconds: number;
    fps: number;
    frameCount: number;
  };
  viewport: Dimensions;
};

type CaptureManifest = CaptureManifestBase &
  (
    | { files: string[]; mediaKind: "frames" }
    | { file: string; mediaKind: "video" }
  );

type CaptureCompositionProps = {
  assetBase: string;
  showCallouts?: boolean;
  showCursor?: boolean;
  showHighlights?: boolean;
};

const createCaptureMetadata = ({
  assetBase,
  fps,
}: {
  assetBase: string;
  fps: number;
}): CalculateMetadataFunction<Record<string, unknown>> => {
  return async () => {
    const response = await fetch(staticFile(`${assetBase}/capture.json`));
    if (!response.ok) {
      throw new Error(
        `Capture manifest request failed with ${response.status}: ${assetBase}`,
      );
    }
    const manifest = (await response.json()) as CaptureManifest;

    return {
      durationInFrames: Math.ceil(manifest.timebase.durationSeconds * fps),
    };
  };
};

type CaptureCatalogEntry = Omit<
  CompositionCatalogEntry,
  "calculateMetadata"
> & {
  assetBase: string;
};

export const defineCaptureComposition = ({
  assetBase,
  ...entry
}: CaptureCatalogEntry): CompositionCatalogEntry => ({
  ...entry,
  calculateMetadata: createCaptureMetadata({ assetBase, fps: entry.fps }),
});

const useCaptureManifest = (assetBase: string) => {
  const [manifest, setManifest] = useState<CaptureManifest | null>(null);
  const [handle] = useState(() =>
    delayRender(`Loading capture manifest ${assetBase}`),
  );

  useEffect(() => {
    let active = true;

    fetch(staticFile(`${assetBase}/capture.json`))
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Capture manifest request failed with ${response.status}: ${assetBase}`,
          );
        }
        return (await response.json()) as CaptureManifest;
      })
      .then((value) => {
        if (active) {
          setManifest(value);
          continueRender(handle);
        }
      })
      .catch((error: unknown) => cancelRender(error));

    return () => {
      active = false;
    };
  }, [assetBase, handle]);

  return manifest;
};

const pointerAtFrame = (
  interactions: CaptureInteraction[],
  captureFrame: number,
) => {
  const points = interactions.filter(
    (
      interaction,
    ): interaction is CaptureInteraction & {
      pointer: CapturePointer;
    } => interaction.pointer !== null,
  );
  const previous = [...points]
    .reverse()
    .find((point) => point.captureFrame <= captureFrame);
  const next = points.find((point) => point.captureFrame > captureFrame);

  if (!previous) {
    return next?.pointer ?? null;
  }
  if (!next) {
    return previous.pointer;
  }

  const progress = interpolate(
    captureFrame,
    [previous.captureFrame, next.captureFrame],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return {
    x: interpolate(progress, [0, 1], [previous.pointer.x, next.pointer.x]),
    y: interpolate(progress, [0, 1], [previous.pointer.y, next.pointer.y]),
  };
};

const CaptureOverlays: React.FC<{
  captureFrame: number;
  manifest: CaptureManifest;
  showCallouts: boolean;
  showCursor: boolean;
  showHighlights: boolean;
}> = ({ captureFrame, manifest, showCallouts, showCursor, showHighlights }) => {
  const { height, width } = useVideoConfig();
  const scaleX = width / manifest.viewport.width;
  const scaleY = height / manifest.viewport.height;
  const latest = [...manifest.interactions]
    .reverse()
    .find((interaction) => interaction.captureFrame <= captureFrame);
  const pointer = pointerAtFrame(manifest.interactions, captureFrame);
  const highlightVisible =
    latest?.bounds &&
    captureFrame - latest.captureFrame <= manifest.timebase.fps * 0.75;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {showHighlights && highlightVisible && latest.bounds ? (
        <div
          style={{
            border: `${Math.max(2, 2 * scaleX)}px solid #8b5cf6`,
            borderRadius: 8 * scaleX,
            boxShadow: "0 0 0 4px rgba(139, 92, 246, 0.24)",
            height: latest.bounds.height * scaleY,
            left: latest.bounds.x * scaleX,
            position: "absolute",
            top: latest.bounds.y * scaleY,
            width: latest.bounds.width * scaleX,
          }}
        />
      ) : null}

      {showCallouts && highlightVisible && latest?.bounds && latest.label ? (
        <div
          style={{
            background: "#7c3aed",
            borderRadius: 8,
            color: "white",
            fontFamily: "Arial, sans-serif",
            fontSize: Math.max(16, 16 * scaleX),
            fontWeight: 700,
            left: latest.bounds.x * scaleX,
            padding: `${6 * scaleY}px ${10 * scaleX}px`,
            position: "absolute",
            top: Math.max(8, latest.bounds.y * scaleY - 42 * scaleY),
          }}
        >
          {latest.label}
        </div>
      ) : null}

      {showCursor && pointer ? (
        <svg
          aria-hidden="true"
          height={36 * scaleY}
          style={{
            filter: "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.55))",
            left: pointer.x * scaleX,
            overflow: "visible",
            position: "absolute",
            top: pointer.y * scaleY,
          }}
          viewBox="0 0 24 30"
          width={29 * scaleX}
        >
          <path
            d="M2 2v22l6.2-5.4 4.4 9 4.5-2.2-4.4-8.8H21L2 2Z"
            fill="white"
            stroke="#111827"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

export const CaptureComposition: React.FC<CaptureCompositionProps> = ({
  assetBase,
  showCallouts = true,
  showCursor = true,
  showHighlights = true,
}) => {
  const manifest = useCaptureManifest(assetBase);
  const compositionFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const captureFrame = useMemo(
    () =>
      manifest
        ? compositionFrameToCaptureFrame({
            captureFps: manifest.timebase.fps,
            captureFrameCount: manifest.timebase.frameCount,
            compositionFps: fps,
            compositionFrame,
          })
        : 0,
    [compositionFrame, fps, manifest],
  );

  if (!manifest) {
    return null;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#020617" }}>
      {manifest.mediaKind === "frames" ? (
        <Img
          src={staticFile(`${assetBase}/${manifest.files[captureFrame]}`)}
          style={{ height: "100%", objectFit: "fill", width: "100%" }}
        />
      ) : (
        <Video
          muted
          objectFit="fill"
          src={staticFile(`${assetBase}/${manifest.file}`)}
          style={{ height: "100%", width: "100%" }}
        />
      )}
      <CaptureOverlays
        captureFrame={captureFrame}
        manifest={manifest}
        showCallouts={showCallouts}
        showCursor={showCursor}
        showHighlights={showHighlights}
      />
    </AbsoluteFill>
  );
};
