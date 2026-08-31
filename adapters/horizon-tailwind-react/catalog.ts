import { defineAdapterCatalog } from "../../src/engine/catalog";
import {
  HorizonTailwindReactDemo,
  HorizonTailwindReactStill,
} from "./demos/DashboardSurface";

export const horizonTailwindReactCatalog = defineAdapterCatalog({
  folderName: "Horizon-Tailwind-React",
  stills: [
    {
      id: "HorizonTailwindReact-Main",
      component: HorizonTailwindReactStill,
      width: 1920,
      height: 1080,
    },
  ],
  compositions: [
    {
      id: "HorizonTailwindReact-Demo",
      component: HorizonTailwindReactDemo,
      durationInFrames: 120,
      fps: 30,
      width: 1920,
      height: 1080,
    },
  ],
});
