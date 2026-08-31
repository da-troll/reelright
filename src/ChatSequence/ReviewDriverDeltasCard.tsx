import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Top 3 drivers with delta vs baseline around review window
const driverData = [
  { driver: "Role clarity", delta: -18 },
  { driver: "Fairness", delta: -14 },
  { driver: "Growth opportunity", delta: -9 },
];

interface ReviewDriverDeltasCardProps {
  title?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const ReviewDriverDeltasCard: React.FC<ReviewDriverDeltasCardProps> = ({
  title = "What likely explains it",
  hideTitle = false,
  compact = false,
  embedded = false,
  layout = "desktop",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isMobile = layout === "mobile";

  const noCardStyle = compact || embedded;

  // Bar chart dimensions
  const chartWidth = compact
    ? theme.chart.compact.contentWidth
    : isMobile
      ? theme.chart.mobile.contentWidth
      : theme.chart.contentWidth;
  const chartHeight = compact ? 80 : isMobile ? 70 : 100;
  const padding = { top: 10, right: 40, bottom: 10, left: 130 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxAbsDelta = Math.max(...driverData.map((d) => Math.abs(d.delta)));
  const barHeight = innerHeight / driverData.length - 8;

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: noCardStyle ? "transparent" : theme.colors.surface.main,
        borderRadius: noCardStyle ? 0 : theme.layout.borderRadius.card,
        boxShadow: noCardStyle ? "none" : theme.layout.shadow.card,
        padding: noCardStyle ? 0 : "24px",
        fontFamily: theme.typography.fontFamily.body,
      }}
    >
      {/* Title */}
      {!hideTitle && (
        <h3
          style={{
            fontFamily: theme.chart.title.fontFamily,
            fontSize: compact ? theme.chart.compact.title.fontSize : theme.chart.title.fontSize,
            fontWeight: theme.chart.title.fontWeight,
            color: theme.chart.title.color,
            margin: 0,
            marginBottom: compact ? theme.chart.compact.title.marginBottom : theme.chart.title.marginBottom,
          }}
        >
          {title}
        </h3>
      )}

      {/* Subtitle */}
      <div
        style={{
          fontFamily: theme.chart.legend.fontFamily,
          fontSize: compact ? theme.chart.compact.legend.fontSize : theme.chart.legend.fontSize,
          color: theme.chart.legend.color,
          marginBottom: 8,
          opacity: 0.8,
        }}
      >
        Driver delta vs baseline (around review window)
      </div>

      {/* Horizontal bar chart */}
      <svg width={chartWidth} height={chartHeight}>
        {driverData.map((d, i) => {
          const barProgress = spring({
            frame: Math.max(0, frame - i * 4),
            fps,
            config: { stiffness: 120, damping: 18, mass: 0.9 },
          });

          const targetWidth = (Math.abs(d.delta) / maxAbsDelta) * innerWidth;
          const animatedWidth = interpolate(barProgress, [0, 1], [0, targetWidth]);
          const y = padding.top + i * (barHeight + 8);

          return (
            <g key={d.driver}>
              {/* Driver label */}
              <text
                x={padding.left - 8}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontFamily={theme.chart.axisLabel.fontFamily}
                fontSize={compact ? 10 : 12}
                fill={theme.chart.axisLabel.color}
              >
                {d.driver}
              </text>

              {/* Bar */}
              <rect
                x={padding.left}
                y={y}
                width={animatedWidth}
                height={barHeight}
                rx={barHeight / 2}
                ry={barHeight / 2}
                fill={theme.colors.charts.orange}
              />

              {/* Value label */}
              <text
                x={padding.left + animatedWidth + 8}
                y={y + barHeight / 2 + 4}
                fontFamily={theme.chart.axisLabel.fontFamily}
                fontSize={compact ? 10 : 11}
                fontWeight={500}
                fill={theme.colors.text.secondary}
                opacity={interpolate(barProgress, [0.5, 1], [0, 1])}
              >
                {d.delta}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
