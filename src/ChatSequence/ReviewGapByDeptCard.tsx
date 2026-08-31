import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Outcome delta vs company average by department
const deptData = [
  { dept: "Engineering", delta: +8 },
  { dept: "Product", delta: +5 },
  { dept: "Design", delta: +3 },
  { dept: "Finance", delta: +1 },
  { dept: "Marketing", delta: -4 },
  { dept: "Sales", delta: -7 },
  { dept: "Customer Success", delta: -12 },
  { dept: "Operations", delta: -15 },
];

interface ReviewGapByDeptCardProps {
  title?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const ReviewGapByDeptCard: React.FC<ReviewGapByDeptCardProps> = ({
  title = "Outcome gap by department",
  hideTitle = false,
  compact = false,
  embedded = false,
  layout = "desktop",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isMobile = layout === "mobile";

  const noCardStyle = compact || embedded;

  // Chart dimensions
  const chartWidth = compact
    ? theme.chart.compact.contentWidth
    : isMobile
      ? theme.chart.mobile.contentWidth
      : theme.chart.contentWidth;
  const chartHeight = compact ? 180 : isMobile ? 150 : 220;
  const padding = { top: 10, right: 40, bottom: 20, left: isMobile ? 115 : 150 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxAbsDelta = Math.max(...deptData.map((d) => Math.abs(d.delta)));
  const barHeight = innerHeight / deptData.length - 6;
  const centerX = padding.left + innerWidth / 2; // Zero line position

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
          marginBottom: 12,
          opacity: 0.8,
        }}
      >
        Delta vs company average (pts)
      </div>

      {/* SVG Chart */}
      <svg width={chartWidth} height={chartHeight}>
        {/* Zero line */}
        <line
          x1={centerX}
          y1={padding.top}
          x2={centerX}
          y2={chartHeight - padding.bottom}
          stroke={theme.colors.surface.outline}
          strokeWidth={1}
        />

        {deptData.map((d, i) => {
          const barProgress = spring({
            frame: Math.max(0, frame - i * 3),
            fps,
            config: { stiffness: 120, damping: 18, mass: 0.9 },
          });

          const y = padding.top + i * (barHeight + 6);
          const isPositive = d.delta >= 0;
          const maxBarWidth = innerWidth / 2;
          const targetWidth = (Math.abs(d.delta) / maxAbsDelta) * maxBarWidth;
          const animatedWidth = interpolate(barProgress, [0, 1], [0, targetWidth]);

          // Bar position: positive bars go right from center, negative go left
          const barX = isPositive ? centerX : centerX - animatedWidth;

          return (
            <g key={d.dept}>
              {/* Department label */}
              <text
                x={padding.left - 8}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontFamily={theme.chart.axisLabel.fontFamily}
                fontSize={compact ? 10 : 12}
                fill={theme.chart.axisLabel.color}
              >
                {d.dept}
              </text>

              {/* Bar */}
              <rect
                x={barX}
                y={y}
                width={animatedWidth}
                height={barHeight}
                rx={barHeight / 2}
                ry={barHeight / 2}
                fill={isPositive ? theme.colors.charts.green : theme.colors.charts.orange}
              />

              {/* Value label - positioned to right of bar for both positive and negative */}
              <text
                x={isPositive ? centerX + animatedWidth + 8 : centerX + 8}
                y={y + barHeight / 2 + 4}
                textAnchor="start"
                fontFamily={theme.chart.axisLabel.fontFamily}
                fontSize={compact ? 10 : 11}
                fontWeight={500}
                fill={theme.colors.text.secondary}
                opacity={interpolate(barProgress, [0.5, 1], [0, 1])}
              >
                {d.delta > 0 ? "+" : ""}{d.delta}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
