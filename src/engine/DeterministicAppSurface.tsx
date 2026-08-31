import type { PropsWithChildren } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

export type DeterministicAppSurfaceProps = PropsWithChildren<{
  appId: string;
  backgroundColor?: string;
  designHeight: number;
  designWidth: number;
}>;

export const DeterministicAppSurface: React.FC<
  DeterministicAppSurfaceProps
> = ({
  appId,
  backgroundColor = "#ffffff",
  children,
  designHeight,
  designWidth,
}) => {
  const { width, height } = useVideoConfig();
  const scale = Math.min(width / designWidth, height / designHeight);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        backgroundColor,
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        data-native-app={appId}
        style={{
          flex: "0 0 auto",
          height: designHeight,
          overflow: "hidden",
          transform: `scale(${scale})`,
          width: designWidth,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
