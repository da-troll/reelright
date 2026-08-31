import { createElement, useState, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { jsx } from "react/jsx-runtime";
import { jsxDEV } from "react/jsx-dev-runtime";
import { z } from "zod";
import { DemoProvider } from "../../input/vite-proof/src/demo/DemoProvider";
import { nativeRuntimeIdentity } from "../../input/vite-proof/src/demo/runtimeIdentity";

const hostRuntimeIdentity = {
  createElement,
  useState,
  createRoot,
  createPortal,
  jsx,
  jsxDEV,
  zodObject: z.object,
};

for (const key of Object.keys(
  hostRuntimeIdentity,
) as (keyof typeof hostRuntimeIdentity)[]) {
  if (hostRuntimeIdentity[key] !== nativeRuntimeIdentity[key]) {
    throw new Error(
      `Module ownership failure: native and host runtimes disagree for ${key}`,
    );
  }
}

export const ViteProofProviders: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return <DemoProvider>{children}</DemoProvider>;
};
