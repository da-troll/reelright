import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import Dashboard from "../../../input/oss-dashboard/src/pages/dashboard/Dashboard";
import "../../../.remotion-app/oss-dashboard/app.css";
import { DeterministicAppSurface } from "../../../src/engine/DeterministicAppSurface";
import { OssDashboardProviders } from "../providers";

const NativeDashboard: React.FC = () => (
  <OssDashboardProviders>
    <div
      style={{
        background: "#f7f7f8",
        boxSizing: "border-box",
        color: "#29323a",
        fontFamily: "Arial, sans-serif",
        height: 1000,
        overflow: "hidden",
        padding: "42px 56px",
        width: 1440,
      }}
    >
      <Dashboard />
    </div>
  </OssDashboardProviders>
);

export const OssDashboardStill: React.FC = () => (
  <DeterministicAppSurface
    appId="oss-dashboard"
    backgroundColor="#e9ebee"
    designHeight={1000}
    designWidth={1440}
  >
    <NativeDashboard />
  </DeterministicAppSurface>
);

export const OssDashboardDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 2 * fps], [1.025, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ height: "100%", opacity, transform: `scale(${scale})` }}>
      <OssDashboardStill />
    </div>
  );
};
