import { defineAdapterCatalog } from "../../src/engine/catalog";
import { DashboardStill } from "./demos/DashboardSurface";
import { DashboardDemo } from "./demos/DashboardSurface";

export const viteProofCatalog = defineAdapterCatalog({
  folderName: "Vite-Proof",
  stills: [
    {
      id: "ViteProof-Dashboard",
      component: DashboardStill,
      width: 1920,
      height: 1080,
    },
  ],
  compositions: [
    {
      id: "ViteProof-Demo",
      component: DashboardDemo,
      durationInFrames: 120,
      fps: 30,
      width: 1920,
      height: 1080,
    },
  ],
});
