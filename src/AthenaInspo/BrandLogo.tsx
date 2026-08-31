import { Img, staticFile } from "remotion";

interface BrandLogoProps {
  size?: number;
  imageSrc?: string;
}

// Provide your own default brand mark asset under public/, or always
// pass `imageSrc` explicitly.
const DEFAULT_LOGO = "brand-assets/logo.svg";

// Brand logo using image file
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 44,
  imageSrc = DEFAULT_LOGO,
}) => {
  return (
    <Img
      src={staticFile(imageSrc)}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        borderRadius: 8,
      }}
    />
  );
};

// SVG fallback if needed
interface SvgLogoProps {
  color?: string;
  size?: number;
}

export const SiaLogo: React.FC<SvgLogoProps> = ({
  color = "#9773FF",
  size = 40,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Four-pointed star / sparkle shape */}
      <path
        d="M20 4C20 4 22 14 26 18C30 22 36 20 36 20C36 20 30 22 26 26C22 30 20 36 20 36C20 36 18 30 14 26C10 22 4 20 4 20C4 20 14 18 18 14C22 10 20 4 20 4Z"
        fill={color}
      />
      {/* Small accent sparkle */}
      <circle cx="32" cy="8" r="2" fill={color} />
    </svg>
  );
};
