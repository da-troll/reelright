import { Easing, interpolate, spring } from "remotion";
import { useAnchorRect, useAnchorRects, type AnchorSpec } from "../anchors";
import { fadeWindow } from "./beat";

export type TourTheme = {
  ink: string;
  /** Highlight rings and caption borders. Plain 6-hex-digit color (no alpha
   * channel) — callers derive translucent variants with `withAlpha` rather
   * than pre-mixing alpha, so every overlay gets the same opacity ratios
   * instead of each theme author computing and syncing multiple variants. */
  accent: string;
  /** Eyebrow text and cursor click-pulses. A second, distinct accent — most
   * brand systems use two tones here, so this is not optional-and-defaulted
   * to `accent`; picking one color for both washes out either role. */
  accentSecondary: string;
  fontFamily: string;
};

export const DEFAULT_TOUR_THEME: TourTheme = {
  accent: "#ff9573",
  accentSecondary: "#9773ff",
  fontFamily: "system-ui, sans-serif",
  ink: "#0f172a",
};

/** Append a two-digit hex alpha to a plain `#rrggbb` color. */
const withAlpha = (hex: string, alphaHex: string): string => `${hex}${alphaHex}`;

/**
 * Animated emphasis ring measured from the live DOM around a native element.
 *
 * Geometry MUST come from `anchor`, never a hardcoded rectangle: any change to
 * fixtures, CSS, or the upstream app silently moves hand-estimated
 * coordinates out from under a highlight, and nothing about that failure is
 * visible until someone looks at the rendered frame. A missing anchor cancels
 * the render (see `useAnchorRect`) instead of drawing in the wrong place.
 */
export const HighlightRing: React.FC<{
  anchor: AnchorSpec;
  beat: number;
  /** The fps `beat` is expressed in — must match the `useBeat(beatFps)` call
   * that produced it, not the composition's real render fps, or the spring
   * settles at the wrong rate relative to the authored timeline. */
  beatFps?: number;
  from: number;
  to: number;
  theme?: TourTheme;
}> = ({ anchor, beat, beatFps = 30, from, to, theme = DEFAULT_TOUR_THEME }) => {
  const rect = useAnchorRect(anchor, beat >= from && beat <= to);
  const opacity = fadeWindow(beat, from, to);

  if (opacity === 0 || !rect) {
    return null;
  }

  const grow = spring({ frame: beat - from, fps: beatFps, config: { damping: 200 } });
  const pad = 10 + 14 * (1 - grow);

  return (
    <div
      style={{
        border: `3px solid ${theme.accent}`,
        borderRadius: 14,
        boxShadow: `0 0 0 6px ${withAlpha(theme.accent, "2e")}, 0 0 34px ${withAlpha(theme.accent, "55")}`,
        height: rect.height + pad * 2,
        left: rect.x - pad,
        opacity,
        pointerEvents: "none",
        position: "absolute",
        top: rect.y - pad,
        width: rect.width + pad * 2,
      }}
    />
  );
};

export type CursorWaypoint = {
  /** Beat frame this waypoint is reached. */
  frame: number;
  /** Anchor whose measured rect this waypoint is positioned relative to. */
  anchor: AnchorSpec;
  /** Offset in page-space pixels from the anchor's center. */
  dx?: number;
  dy?: number;
  /** Draw a click pulse when the cursor arrives here. */
  click?: boolean;
};

/**
 * A cursor that glides between DOM-anchored waypoints with click pulses.
 * Waypoints are `anchor` + offset, never absolute page coordinates, for the
 * same reason as `HighlightRing`.
 */
export const TourCursor: React.FC<{
  path: readonly CursorWaypoint[];
  beat: number;
  from: number;
  to: number;
  theme?: TourTheme;
}> = ({ path, beat, from, to, theme = DEFAULT_TOUR_THEME }) => {
  const active = beat >= from && beat <= to;
  const rects = useAnchorRects(
    path.map((waypoint) => waypoint.anchor),
    active,
  );
  const opacity = fadeWindow(beat, from, to, 8);

  if (opacity === 0 || rects.some((rect) => rect === null)) {
    return null;
  }

  const points = path.map((waypoint, index) => ({
    ...waypoint,
    x: (rects[index]?.cx ?? 0) + (waypoint.dx ?? 0),
    y: (rects[index]?.cy ?? 0) + (waypoint.dy ?? 0),
  }));
  const clamped = Math.min(
    Math.max(beat, points[0].frame),
    points[points.length - 1].frame,
  );
  let position = { x: points[0].x, y: points[0].y };

  for (let index = 0; index < points.length - 1; index++) {
    const a = points[index];
    const b = points[index + 1];

    if (clamped <= b.frame) {
      const t = interpolate(clamped, [a.frame, b.frame], [0, 1], {
        easing: Easing.inOut(Easing.quad),
      });
      position = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      break;
    }
    position = { x: b.x, y: b.y };
  }

  return (
    <div style={{ left: 0, opacity, pointerEvents: "none", position: "absolute", top: 0 }}>
      {points
        .filter((point) => point.click)
        .map((point) => {
          const pulse = interpolate(beat, [point.frame, point.frame + 22], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return pulse > 0 && pulse < 1 ? (
            <div
              key={point.frame}
              style={{
                border: `3px solid ${theme.accentSecondary}`,
                borderRadius: "50%",
                height: 64 * pulse,
                left: point.x - 32 * pulse,
                opacity: 1 - pulse,
                position: "absolute",
                top: point.y - 32 * pulse,
                width: 64 * pulse,
              }}
            />
          ) : null;
        })}
      <svg
        height={34}
        style={{
          filter: "drop-shadow(0 2px 3px rgba(15, 10, 31, 0.45))",
          left: position.x,
          overflow: "visible",
          position: "absolute",
          top: position.y,
        }}
        viewBox="0 0 24 30"
        width={27}
      >
        <path
          d="M2 2v22l6.2-5.4 4.4 9 4.5-2.2-4.4-8.8H21L2 2Z"
          fill="white"
          stroke={theme.ink}
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

/** Lower-third caption in viewport space (not scaled by the page camera). */
export const TourCaption: React.FC<{
  eyebrow: string;
  text: string;
  beat: number;
  /** See `HighlightRing`'s `beatFps` — must match the source `useBeat` call. */
  beatFps?: number;
  from: number;
  to: number;
  theme?: TourTheme;
}> = ({ beatFps = 30, eyebrow, text, beat, from, to, theme = DEFAULT_TOUR_THEME }) => {
  const opacity = fadeWindow(beat, from, to);

  if (opacity === 0) {
    return null;
  }

  const rise = spring({ frame: beat - from, fps: beatFps, config: { damping: 200 } });

  return (
    <div
      style={{
        bottom: 64,
        left: 84,
        opacity,
        position: "absolute",
        transform: `translateY(${24 * (1 - rise)}px)`,
      }}
    >
      <div
        style={{
          background: `${theme.ink}e8`,
          borderLeft: `5px solid ${theme.accent}`,
          borderRadius: 12,
          color: "#ffffff",
          fontFamily: theme.fontFamily,
          maxWidth: 780,
          padding: "22px 30px",
        }}
      >
        <div
          style={{
            color: theme.accentSecondary,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "0.24em",
            marginBottom: 6,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
        <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.3 }}>{text}</div>
      </div>
    </div>
  );
};
