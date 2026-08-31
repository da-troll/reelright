// src/fonts.ts - Load Google Fonts for Remotion

import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";

// Load Inter (body and heading font)
export const { fontFamily: interFont } = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

// Load Source Serif 4 (display font)
export const { fontFamily: sourceSerifFont } = loadSourceSerif4("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

// Export convenient font family strings
export const fonts = {
  body: interFont,
  heading: interFont,
  display: sourceSerifFont,
} as const;
