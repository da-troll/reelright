import type { PropsWithChildren } from "react";
import { DeterministicAppSurface as EngineAppSurface } from "../../src/engine/DeterministicAppSurface";

export const DeterministicAppSurface: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <EngineAppSurface
      appId="vite-proof"
      backgroundColor="#e8efea"
      designHeight={900}
      designWidth={1440}
    >
      {children}
    </EngineAppSurface>
  );
};
