import { defineAdapterCatalog } from "../../src/engine/catalog";
import { defineCaptureComposition } from "../../src/engine/CaptureComposition";
import { NextPlaygroundChatWidgetStill } from "./demos/ChatWidgetSurface";
import {
  NextPlaygroundCapture,
  NextPlaygroundCaptureVideo,
} from "./demos/CaptureSurface";
import {
  NextPlaygroundDemo,
  NextPlaygroundStill,
} from "./demos/PlaygroundSurface";

export const nextPlaygroundCatalog = defineAdapterCatalog({
  folderName: "Next-Playground",
  stills: [
    {
      id: "NextPlayground-Main",
      component: NextPlaygroundStill,
      width: 1920,
      height: 1080,
    },
    {
      id: "NextPlayground-ChatWidget",
      component: NextPlaygroundChatWidgetStill,
      width: 3840,
      height: 2160,
    },
  ],
  compositions: [
    {
      id: "NextPlayground-Demo",
      component: NextPlaygroundDemo,
      durationInFrames: 120,
      fps: 30,
      width: 1920,
      height: 1080,
    },
    defineCaptureComposition({
      id: "NextPlayground-Capture",
      component: NextPlaygroundCapture,
      assetBase: "generated/next-playground/layouts-navigation",
      durationInFrames: 8,
      fps: 4,
      width: 1920,
      height: 1200,
    }),
    defineCaptureComposition({
      id: "NextPlayground-CaptureVideo",
      component: NextPlaygroundCaptureVideo,
      assetBase: "generated/next-playground/layouts-video",
      durationInFrames: 60,
      fps: 30,
      width: 1920,
      height: 1200,
    }),
  ],
});
