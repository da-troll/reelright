import type { PropsWithChildren } from "react";
import { NextNavigationProvider } from "./shims/next-navigation";

export const NextPlaygroundProviders: React.FC<
  PropsWithChildren<{ pathname?: string }>
> = ({ children, pathname = "/layouts" }) => (
  <NextNavigationProvider pathname={pathname}>
    {children}
  </NextNavigationProvider>
);
