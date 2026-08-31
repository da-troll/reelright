import { createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { jsx } from "react/jsx-runtime";
import { jsxDEV } from "react/jsx-dev-runtime";
import { z } from "zod";

export const nativeRuntimeIdentity = {
  createElement,
  useState,
  createRoot,
  createPortal,
  jsx,
  jsxDEV,
  zodObject: z.object,
};
