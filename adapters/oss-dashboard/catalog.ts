import { defineAdapterCatalog } from "../../src/engine/catalog";
import { OssDashboardDemo, OssDashboardStill } from "./demos/DashboardSurface";

export const ossDashboardCatalog = defineAdapterCatalog({
  folderName: "OSS-Dashboard",
  stills: [
    {
      id: "OssDashboard-Main",
      component: OssDashboardStill,
      width: 1920,
      height: 1080,
    },
  ],
  compositions: [
    {
      id: "OssDashboard-Demo",
      component: OssDashboardDemo,
      durationInFrames: 120,
      fps: 30,
      width: 1920,
      height: 1080,
    },
  ],
});
