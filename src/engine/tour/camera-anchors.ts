import { useLayoutEffect, type RefObject } from "react";
import { useAnchorRects, type AnchorRect, type AnchorSpec } from "../anchors";
import { cameraAt, cameraTransform, type CameraKeyframe } from "./camera";

/**
 * A camera keyframe pointed at DOM-anchored UI, not hand-picked page
 * coordinates — the same "fitBounds" idea mapping/imaging tools have long
 * used (Mapbox, OpenSeadragon) and the pattern current screen-recording demo
 * tools (Screen Studio, Arcade, and similar, as of 2026) use for automatic
 * camera framing: detect the target element(s), fit the camera to their
 * bounding box, rather than keyframe a scale number by eye.
 */
export type AnchoredCameraKeyframe = {
  /** Beat frame this keyframe is reached. */
  frame: number;
  /** One anchor, or several to frame their union (e.g. two panels at once). */
  anchor: AnchorSpec | readonly AnchorSpec[];
  /** Page-space pixels of breathing room around the fitted box. */
  padding?: number;
  minZoom?: number;
  maxZoom?: number;
};

const asAnchorList = (anchor: AnchorSpec | readonly AnchorSpec[]): AnchorSpec[] =>
  Array.isArray(anchor) ? anchor : [anchor as AnchorSpec];

const unionRects = (rects: readonly AnchorRect[]): AnchorRect => {
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  const width = right - left;
  const height = bottom - top;

  return { x: left, y: top, width, height, cx: left + width / 2, cy: top + height / 2 };
};

/**
 * Fit a page-space box into a viewport: the standard `fitBounds` calculation
 * (padding, aspect-ratio-correct, optionally clamped), returning a
 * `CameraKeyframe`-shaped `{cx, cy, z}`.
 */
export const fitBoundsToCamera = ({
  box,
  frame,
  maxZoom,
  minZoom,
  padding = 0,
  viewportHeight,
  viewportWidth,
}: {
  box: AnchorRect;
  frame: number;
  maxZoom?: number;
  minZoom?: number;
  padding?: number;
  viewportHeight: number;
  viewportWidth: number;
}): CameraKeyframe => {
  if (box.width <= 0 || box.height <= 0) {
    throw new Error(
      `Cannot fit the camera to a degenerate box (${box.width}x${box.height})`,
    );
  }

  const scaleX = viewportWidth / (box.width + padding * 2);
  const scaleY = viewportHeight / (box.height + padding * 2);
  let z = Math.min(scaleX, scaleY);

  if (maxZoom !== undefined) {
    z = Math.min(z, maxZoom);
  }
  if (minZoom !== undefined) {
    z = Math.max(z, minZoom);
  }
  if (!Number.isFinite(z) || z <= 0) {
    throw new Error(`fitBoundsToCamera produced an invalid zoom: ${z}`);
  }

  return { frame, cx: box.cx, cy: box.cy, z };
};

/**
 * Resolve a list of `AnchoredCameraKeyframe`s against the live DOM into
 * concrete `CameraKeyframe`s that `cameraAt`/`cameraTransform` already
 * consume. Returns `null` until every anchor has been measured (mirrors
 * `useAnchorRect`'s contract: a genuinely missing anchor cancels the render
 * rather than falling back to a guessed frame).
 */
export const useAnchoredCamera = (
  keyframes: readonly AnchoredCameraKeyframe[],
  {
    padding: defaultPadding = 0,
    viewportHeight,
    viewportWidth,
  }: { padding?: number; viewportHeight: number; viewportWidth: number },
): CameraKeyframe[] | null => {
  const specsPerKeyframe = keyframes.map((keyframe) => asAnchorList(keyframe.anchor));
  const flatSpecs = specsPerKeyframe.flat();
  const flatRects = useAnchorRects(flatSpecs);

  if (flatRects.some((rect) => rect === null)) {
    return null;
  }

  const rects = flatRects as AnchorRect[];
  let cursor = 0;

  return keyframes.map((keyframe, index) => {
    const count = specsPerKeyframe[index].length;
    const box = unionRects(rects.slice(cursor, cursor + count));
    cursor += count;

    return fitBoundsToCamera({
      box,
      frame: keyframe.frame,
      maxZoom: keyframe.maxZoom,
      minZoom: keyframe.minZoom,
      padding: keyframe.padding ?? defaultPadding,
      viewportHeight,
      viewportWidth,
    });
  });
};

/**
 * Renders nothing; resolves `keyframes` and imperatively writes the current
 * beat's camera transform onto `wrapperRef.current`.
 *
 * Must be rendered *inside* `AnchorSurface` (it needs anchor context) while
 * `wrapperRef` points at an *ancestor* of that `AnchorSurface` (the transform
 * has to move the whole page + overlay tree). A React child cannot
 * declaratively set an ancestor's style, so the value is written imperatively
 * inside a `useLayoutEffect` — synchronously, before the browser paints, the
 * same measure-then-position technique positioning libraries like Floating UI
 * use. There is no visible flash: Remotion only captures a frame once all
 * effects for that commit have settled.
 */
export const AnchoredCameraRig: React.FC<{
  beat: number;
  keyframes: readonly AnchoredCameraKeyframe[];
  viewportWidth: number;
  viewportHeight: number;
  viewportCenterY?: number;
  wrapperRef: RefObject<HTMLElement | null>;
}> = ({ beat, keyframes, viewportCenterY, viewportHeight, viewportWidth, wrapperRef }) => {
  const resolved = useAnchoredCamera(keyframes, { viewportHeight, viewportWidth });

  useLayoutEffect(() => {
    if (!resolved || !wrapperRef.current) {
      return;
    }

    const camera = cameraAt(beat, resolved);

    wrapperRef.current.style.transform = cameraTransform({
      camera,
      viewportCenterY,
      viewportHeight,
      viewportWidth,
    });
  }, [beat, resolved, viewportCenterY, viewportHeight, viewportWidth, wrapperRef]);

  return null;
};
