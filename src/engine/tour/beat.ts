import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Author a tour timeline at a fixed "beat" frame rate, then render the
 * composition at any actual frame rate (typically higher, for smooth camera
 * pans) without re-timing every keyframe, caption, and spring by hand.
 *
 * Pass the same `beatFps` to `spring()` calls so their duration matches the
 * beat timeline rather than the composition's real fps.
 */
export const useBeat = (beatFps: number): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (frame * beatFps) / fps;
};

/** 0→1→1→0 opacity envelope with symmetric fade ramps, in beat units. */
export const fadeWindow = (
  frame: number,
  from: number,
  to: number,
  ramp = 12,
): number =>
  interpolate(frame, [from, from + ramp, to - ramp, to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
