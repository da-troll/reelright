import { createContext, useContext, type PropsWithChildren } from "react";

type DemoWorkspace = {
  company: string;
  reportingPeriod: string;
};

const DemoWorkspaceContext = createContext<DemoWorkspace | null>(null);

export const DemoProvider = ({ children }: PropsWithChildren) => {
  return (
    <DemoWorkspaceContext.Provider
      value={{ company: "Northstar Labs", reportingPeriod: "August 2026" }}
    >
      {children}
    </DemoWorkspaceContext.Provider>
  );
};

export const useDemoWorkspace = () => {
  const value = useContext(DemoWorkspaceContext);

  if (!value) {
    throw new Error("useDemoWorkspace must be used inside DemoProvider");
  }

  return value;
};
