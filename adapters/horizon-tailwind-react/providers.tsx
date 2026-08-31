import type { PropsWithChildren } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// The native App.jsx mounts AdminLayout under a `admin/*` route. We recreate
// only that one route line here rather than importing the real App.jsx,
// which would also eagerly pull in AuthLayout/RtlLayout (and, through
// AuthLayout, Chakra UI + Emotion) for surfaces this demo never renders.
export const HorizonTailwindReactProviders: React.FC<PropsWithChildren> = ({
  children,
}) => (
  <MemoryRouter initialEntries={["/admin/default"]}>
    <Routes>
      <Route element={children} path="admin/*" />
    </Routes>
  </MemoryRouter>
);
