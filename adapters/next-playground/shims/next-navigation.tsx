import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";

type NavigationState = {
  pathname: string;
  searchParams: URLSearchParams;
};

const NavigationContext = createContext<NavigationState>({
  pathname: "/",
  searchParams: new URLSearchParams(),
});

export const NextNavigationProvider: React.FC<
  PropsWithChildren<{ pathname?: string; search?: string }>
> = ({ children, pathname = "/", search = "" }) => {
  const value = useMemo(
    () => ({ pathname, searchParams: new URLSearchParams(search) }),
    [pathname, search],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const usePathname = () => useContext(NavigationContext).pathname;
export const useSearchParams = () => useContext(NavigationContext).searchParams;
export const useSelectedLayoutSegment = () => {
  const pathname = usePathname();
  return pathname.split("/").filter(Boolean)[0] ?? null;
};
export const useSelectedLayoutSegments = () =>
  usePathname().split("/").filter(Boolean);

export const useRouter = () => ({
  back: () => undefined,
  forward: () => undefined,
  prefetch: async () => undefined,
  push: (href: string) => {
    void href;
  },
  refresh: () => undefined,
  replace: (href: string) => {
    void href;
  },
});

export const notFound = (): never => {
  throw new Error("next/navigation notFound() was called inside Remotion");
};

export const redirect = (href: string): never => {
  throw new Error(
    `next/navigation redirect(${href}) was called inside Remotion`,
  );
};

export const permanentRedirect = redirect;
