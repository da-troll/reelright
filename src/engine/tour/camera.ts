import { Easing, interpolate } from "remotion";

/**
 * A keyframed pan/zoom camera over a fixed-size native page. Camera
 * coordinates are in the *page's* design-space pixels (the same space
 * `DeterministicAppSurface`'s `designWidth`/`designHeight` describe), not the
 * composition's output pixels — pick `cx`/`cy` by reading the page's own
 * layout, ideally the same anchor targets used for highlight overlays.
 */
export type CameraKeyframe = {
  /** Beat frame this keyframe is reached. */
  frame: number;
  /** Page-space x the viewport center should point at. */
  cx: number;
  /** Page-space y the viewport center should point at. */
  cy: number;
  /** Zoom factor relative to the page's natural fit-to-viewport scale. */
  z: number;
};

/**
 * Sample a list of keyframes (sorted by `frame`, holds before the first and
 * after the last) with cubic ease between consecutive keys. Two keyframes at
 * the same `cx`/`cy`/`z` with different frames create a hold.
 */
export const cameraAt = (
  frame: number,
  keyframes: readonly CameraKeyframe[],
): CameraKeyframe => {
  if (keyframes.length === 0) {
    throw new Error("cameraAt requires at least one keyframe");
  }
  if (frame <= keyframes[0].frame) {
    return keyframes[0];
  }

  for (let index = 0; index < keyframes.length - 1; index++) {
    const from = keyframes[index];
    const to = keyframes[index + 1];

    if (frame <= to.frame) {
      const t = interpolate(frame, [from.frame, to.frame], [0, 1], {
        easing: Easing.inOut(Easing.cubic),
      });

      return {
        frame,
        cx: from.cx + (to.cx - from.cx) * t,
        cy: from.cy + (to.cy - from.cy) * t,
        z: from.z + (to.z - from.z) * t,
      };
    }
  }

  return keyframes[keyframes.length - 1];
};

/**
 * CSS transform placing `camera` at the center of a `viewportWidth` ×
 * `viewportHeight` output, given the page's natural fit scale (its container
 * is rendered at `pageDesignWidth`×`pageDesignHeight` and this scales it to
 * fill the composition before the camera zoom is applied on top).
 */
export const cameraTransform = ({
  camera,
  viewportWidth,
  viewportHeight,
  viewportCenterY = viewportHeight / 2,
}: {
  camera: CameraKeyframe;
  viewportWidth: number;
  viewportHeight: number;
  viewportCenterY?: number;
}): string =>
  `translate(${viewportWidth / 2 - camera.cx * camera.z}px, ${
    viewportCenterY - camera.cy * camera.z
  }px) scale(${camera.z})`;
