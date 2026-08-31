import { Img } from "remotion";
import balls from "../../../input/next-playground/public/shop/balls.png";
import gloves from "../../../input/next-playground/public/shop/gloves.png";
import laptop from "../../../input/next-playground/public/shop/laptop.png";
import phone from "../../../input/next-playground/public/shop/phone.png";
import shoes from "../../../input/next-playground/public/shop/shoes.png";
import shorts from "../../../input/next-playground/public/shop/shorts.png";
import tablet from "../../../input/next-playground/public/shop/tablet.png";
import top from "../../../input/next-playground/public/shop/top.png";
import weights from "../../../input/next-playground/public/shop/weights.png";

const localImages: Record<string, string> = {
  "/shop/balls.png": balls,
  "/shop/gloves.png": gloves,
  "/shop/laptop.png": laptop,
  "/shop/phone.png": phone,
  "/shop/shoes.png": shoes,
  "/shop/shorts.png": shorts,
  "/shop/tablet.png": tablet,
  "/shop/top.png": top,
  "/shop/weights.png": weights,
};

type ImageSource = string | { src: string };
type NextImageProps = Omit<React.ComponentProps<typeof Img>, "src"> & {
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  src: ImageSource;
  unoptimized?: boolean;
};

const NextImage: React.FC<NextImageProps> = ({
  fill,
  height,
  priority: _priority,
  quality: _quality,
  src,
  style,
  unoptimized: _unoptimized,
  width,
  ...props
}) => {
  void _priority;
  void _quality;
  void _unoptimized;

  const rawSource = typeof src === "string" ? src : src.src;
  const resolvedSource = localImages[rawSource] ?? rawSource;

  return (
    <Img
      {...props}
      src={resolvedSource}
      style={{
        ...(fill ? { height: "100%", width: "100%" } : { height, width }),
        ...style,
      }}
    />
  );
};

export default NextImage;
