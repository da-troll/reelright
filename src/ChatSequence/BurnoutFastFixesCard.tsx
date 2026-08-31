import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Manager approval backlog data
const backlogData = [
  { manager: "Sarah K.", pending: 24 },
  { manager: "Michael R.", pending: 18 },
  { manager: "Jennifer L.", pending: 15 },
  { manager: "David M.", pending: 12 },
  { manager: "Others", pending: 8 },
];

interface BurnoutFastFixesCardProps {
  title?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const BurnoutFastFixesCard: React.FC<BurnoutFastFixesCardProps> = ({
  title = "Manager approval backlog",
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
  const chartHeight = compact ? 100 : isMobile ? 90 : 130;
  const padding = { top: 10, right: 20, bottom: 30, left: 90 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxPending = Math.max(...backlogData.map((d) => d.pending));
  const barHeight = innerHeight / backlogData.length - 6;

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
            fontSize: compact
              ? theme.chart.compact.title.fontSize
              : isMobile
                ? theme.chart.mobile.title.fontSize
                : theme.chart.title.fontSize,
            fontWeight: theme.chart.title.fontWeight,
            color: theme.chart.title.color,
            margin: 0,
            marginBottom: compact
              ? theme.chart.compact.title.marginBottom
              : isMobile
                ? theme.chart.mobile.title.marginBottom
                : theme.chart.title.marginBottom,
          }}
        >
          {title}
        </h3>
      )}

      {/* Horizontal bar chart */}
      <svg width={chartWidth} height={chartHeight}>
        {backlogData.map((d, i) => {
          const barProgress = spring({
            frame: Math.max(0, frame - i * 3),
            fps,
            config: { stiffness: 120, damping: 18, mass: 0.9 },
          });

          const targetWidth = (d.pending / maxPending) * innerWidth;
          const animatedWidth = interpolate(barProgress, [0, 1], [0, targetWidth]);
          const y = padding.top + i * (barHeight + 6);

          return (
            <g key={d.manager}>
              {/* Manager label */}
              <text
                x={padding.left - 8}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontFamily={theme.chart.axisLabel.fontFamily}
                fontSize={compact || isMobile ? 9 : 12}
                fill={theme.chart.axisLabel.color}
              >
                {d.manager}
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
                {d.pending}
              </text>
            </g>
          );
        })}

        {/* X-axis label */}
        <text
          x={chartWidth / 2}
          y={chartHeight - 5}
          textAnchor="middle"
          fontFamily={theme.chart.axisLabel.fontFamily}
          fontSize={compact ? 9 : 10}
          fill={theme.chart.legend.color}
          opacity={0.8}
        >
          Pending approvals (tasks)
        </text>
      </svg>
    </div>
  );
};
