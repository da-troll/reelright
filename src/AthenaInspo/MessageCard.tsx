import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { ReactNode } from "react";
import { theme } from "../theme";
import { fonts } from "../fonts";

interface MessageCardProps {
  children: ReactNode;
  entryDelay?: number;
  exitFrame?: number;
  fadeToBackgroundFrame?: number;
  width?: number;
}

export const MessageCard: React.FC<MessageCardProps> = ({
  children,
  entryDelay = 0,
  exitFrame,
  fadeToBackgroundFrame,
  width = 560,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry animation - spring-based fade + slide up
  const entryProgress = spring({
    frame: frame - entryDelay,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
    },
  });

  // Calculate opacity
  let opacity = interpolate(entryProgress, [0, 1], [0, 1]);

  // Fade to background (for user messages that become context)
  if (fadeToBackgroundFrame !== undefined && frame >= fadeToBackgroundFrame) {
    const fadeProgress = interpolate(
      frame,
      [fadeToBackgroundFrame, fadeToBackgroundFrame + 15],
      [1, 0.35],
      { extrapolateRight: "clamp" }
    );
    opacity = opacity * fadeProgress;
  }

  // Exit animation
  if (exitFrame !== undefined) {
    const exitOpacity = interpolate(
      frame,
      [exitFrame, exitFrame + 15],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    opacity = opacity * exitOpacity;
  }

  // Slide up animation
  const translateY = interpolate(entryProgress, [0, 1], [30, 0]);

  // Scale for subtle pop effect
  const scale = interpolate(entryProgress, [0, 1], [0.95, 1]);

  return (
    <div
      style={{
        width,
        backgroundColor: theme.colors.surface.main,
        borderRadius: theme.layout.borderRadius.card,
        padding: "24px 28px",
        boxShadow: theme.layout.shadow.card,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        fontFamily: fonts.body,
      }}
    >
      {children}
    </div>
  );
};
