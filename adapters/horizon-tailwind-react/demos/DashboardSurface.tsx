import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain JSX, no type declarations
import AdminLayout from "../../../input/horizon-tailwind-react/src/layouts/admin";
import "../../../.remotion-app/horizon-tailwind-react/app.css";
import { DeterministicAppSurface } from "../../../src/engine/DeterministicAppSurface";
import { HorizonTailwindReactProviders } from "../providers";

const NativeAdmin: React.FC = () => (
  <HorizonTailwindReactProviders>
    <AdminLayout />
  </HorizonTailwindReactProviders>
);

export const HorizonTailwindReactStill: React.FC = () => (
  <DeterministicAppSurface
    appId="horizon-tailwind-react"
    backgroundColor="#f4f7fe"
    designHeight={982}
    designWidth={1512}
  >
    <NativeAdmin />
  </DeterministicAppSurface>
);

export const HorizonTailwindReactDemo: React.FC = () => {
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
      <HorizonTailwindReactStill />
    </div>
  );
};
