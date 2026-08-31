import type { PropsWithChildren } from "react";
import { AbsoluteFill, spring } from "remotion";
import { fadeWindow } from "./beat";
import { DEFAULT_TOUR_THEME, type TourTheme } from "./overlays";

/** Full-frame card with a fade envelope and a spring pop-in. Compose your own
 * title/end-card content as children; this owns only the timing mechanics. */
export const TourCard: React.FC<
  PropsWithChildren<{
    beat: number;
    /** See `HighlightRing`'s `beatFps` — must match the source `useBeat` call. */
    beatFps?: number;
    from: number;
    to?: number;
    background?: string;
    theme?: TourTheme;
  }>
> = ({
  background = "#ffffff",
  beat,
  beatFps = 30,
  children,
  from,
  theme = DEFAULT_TOUR_THEME,
  to,
}) => {
  const opacity =
    to === undefined
      ? Math.min(1, Math.max(0, (beat - from) / 18))
      : fadeWindow(beat, from, to, 16);

  if (opacity === 0) {
    return null;
  }

  const pop = spring({
    frame: beat - from,
    fps: beatFps,
    config: { damping: 200 },
    durationInFrames: 40,
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background,
        fontFamily: theme.fontFamily,
        justifyContent: "center",
        opacity,
      }}
    >
      <div style={{ textAlign: "center", transform: `scale(${0.94 + 0.06 * pop})` }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
