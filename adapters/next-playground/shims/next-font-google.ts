import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

type FontOptions = {
  subsets?: string[];
  variable?: string;
};

const geist = loadGeist("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700"],
});
const geistMono = loadGeistMono("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700"],
});

const deterministicFont = (
  family: "Geist" | "Geist_Mono",
  fontFamily: string,
  options: FontOptions = {},
) => ({
  className: `next-font-${family.toLowerCase().split("_").join("-")}`,
  style: { fontFamily },
  variable: options.variable ?? "",
});

export const Geist = (options?: FontOptions) =>
  deterministicFont("Geist", geist.fontFamily, options);
export const Geist_Mono = (options?: FontOptions) =>
  deterministicFont("Geist_Mono", geistMono.fontFamily, options);
