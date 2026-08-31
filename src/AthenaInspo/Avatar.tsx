import { Img, staticFile } from "remotion";
import { theme } from "../theme";
import { fonts } from "../fonts";

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  badge?: {
    name: string;
    color: string;
  };
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 48,
  badge,
}) => {
  // Generate initials from name
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Generate a consistent color from name using theme colors
  const colorOptions = [
    theme.colors.brand.primary,
    theme.colors.charts.purple,
    theme.colors.charts.pink,
    theme.colors.charts.green,
    theme.colors.charts.orange,
    theme.colors.charts.blue,
    theme.colors.charts.teal,
  ];
  const hashCode = name.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const backgroundColor = colorOptions[Math.abs(hashCode) % colorOptions.length];

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {src ? (
        <Img
          src={src.startsWith("http") ? src : staticFile(src)}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.colors.text.inverted,
            fontSize: size * 0.4,
            fontWeight: theme.typography.weight.semibold,
            fontFamily: fonts.body,
          }}
        >
          {initials}
        </div>
      )}
      {badge && (
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: size * 0.4,
            height: size * 0.4,
            borderRadius: theme.layout.borderRadius.small,
            backgroundColor: badge.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.colors.text.inverted,
            fontSize: size * 0.2,
            fontWeight: theme.typography.weight.bold,
            fontFamily: fonts.body,
          }}
        >
          {badge.name[0].toUpperCase()}
        </div>
      )}
    </div>
  );
};
