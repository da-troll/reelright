import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme, chartColors } from "../theme";

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ChartCardProps {
  data: ChartData[];
  entryDelay?: number;
  title?: string;
  maxValue?: number;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  data,
  entryDelay = 0,
  title,
  maxValue,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const max = maxValue ?? Math.max(...data.map((d) => d.value));
  const STAGGER_DELAY = 4; // frames between each bar animation

  return (
    <div
      style={{
        backgroundColor: theme.colors.surface.variant,
        borderRadius: theme.layout.borderRadius.card - 4,
        padding: 20,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: theme.typography.size.small,
            fontWeight: theme.typography.weight.medium,
            color: theme.colors.text.secondary,
            marginBottom: 16,
          }}
        >
          {title}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.map((item, index) => {
          const delay = entryDelay + index * STAGGER_DELAY;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: {
              damping: 100,
              stiffness: 150,
            },
          });

          const barWidth = interpolate(
            progress,
            [0, 1],
            [0, (item.value / max) * 100]
          );

          const opacity = interpolate(progress, [0, 0.3], [0, 1], {
            extrapolateRight: "clamp",
          });

          // Use theme chart colors, falling back to provided color
          const barColor = item.color || chartColors[index % chartColors.length];

          return (
            <div key={item.label} style={{ opacity }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: theme.typography.size.small,
                    fontWeight: theme.typography.weight.medium,
                    color: theme.colors.text.default,
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: theme.typography.size.small,
                    fontWeight: theme.typography.weight.semibold,
                    color: theme.colors.text.default,
                  }}
                >
                  {item.value}
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  backgroundColor: theme.colors.surface.outline,
                  borderRadius: theme.layout.borderRadius.small,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${barWidth}%`,
                    backgroundColor: barColor,
                    borderRadius: theme.layout.borderRadius.small,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
