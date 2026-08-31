import { interpolate, useCurrentFrame } from "remotion";
import { Dashboard } from "../../../input/vite-proof/src/demo/Dashboard";
import "../../../.remotion-app/vite-proof/app.css";
import { DeterministicAppSurface } from "../DeterministicAppSurface";
import { dashboardFixture } from "../fixtures";
import { ViteProofProviders } from "../providers";

const NativeDashboard: React.FC = () => {
  return (
    <ViteProofProviders>
      <Dashboard {...dashboardFixture} />
    </ViteProofProviders>
  );
};

export const DashboardStill: React.FC = () => {
  return (
    <DeterministicAppSurface>
      <NativeDashboard />
    </DeterministicAppSurface>
  );
};

export const DashboardDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 75], [1.035, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        height: "100%",
        opacity,
        transform: `scale(${scale})`,
        width: "100%",
      }}
    >
      <DashboardStill />
    </div>
  );
};
