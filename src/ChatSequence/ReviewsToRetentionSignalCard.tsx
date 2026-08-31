import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { generateSmoothPath } from "./chartUtils";

// 12-month data: outcomes soften before a leavers rise (lag effect)
const reviewRetentionData = [
  { month: "Feb", outcomes: 72, leavers: 22 },
  { month: "Mar", outcomes: 74, leavers: 20 },
  { month: "Apr", outcomes: 73, leavers: 21 },
  { month: "May", outcomes: 70, leavers: 23 },
  { month: "Jun", outcomes: 65, leavers: 25 },
  { month: "Jul", outcomes: 58, leavers: 28 }, // Outcomes drop
  { month: "Aug", outcomes: 52, leavers: 32 }, // Leavers rise follows
  { month: "Sep", outcomes: 48, leavers: 38 },
  // Review cycle event: poor outcomes
  { month: "Oct", outcomes: 45, leavers: 42 },
  { month: "Nov", outcomes: 50, leavers: 45 }, // Peak leavers (lagged)
  // Recovery
  { month: "Dec", outcomes: 58, leavers: 38 },
  { month: "Jan", outcomes: 64, leavers: 32 },
];

interface ReviewsToRetentionSignalCardProps {
  title?: string;
  subtitle?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const ReviewsToRetentionSignalCard: React.FC<ReviewsToRetentionSignalCardProps> = ({
  title = "Reviews → retention signal",
  subtitle = "Outcomes vs leavers (12 months)",
  hideTitle = false,
  compact = false,
  embedded = false,
  layout = "desktop",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isMobile = layout === "mobile";

  // Stagger line drawing: line 1 first, line 2 delayed by 6 frames
  const progress1 = spring({
    frame,
    fps,
    config: theme.chart.animation.spring,
  });

  const progress2 = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: theme.chart.animation.spring,
  });

  // When embedded or compact, remove card styling
  const noCardStyle = compact || embedded;

  // Chart dimensions
  const chartWidth = compact
    ? theme.chart.compact.contentWidth
    : isMobile
      ? theme.chart.mobile.contentWidth
      : theme.chart.contentWidth;
  const chartHeight = compact ? 120 : isMobile ? 100 : 160;
  const padding = theme.chart.line.padding;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Scales
  const xScale = (i: number) => padding.left + (i / (reviewRetentionData.length - 1)) * innerWidth;
  // Y scale: 0-100 range, inverted
  const yScale = (val: number) => padding.top + innerHeight - (val / 100) * innerHeight;

  // Generate paths
  const outcomesPoints = reviewRetentionData.map((d, i) => ({ x: xScale(i), y: yScale(d.outcomes) }));
  const leaversPoints = reviewRetentionData.map((d, i) => ({ x: xScale(i), y: yScale(d.leavers) }));
  const outcomesPath = generateSmoothPath(outcomesPoints);
  const leaversPath = generateSmoothPath(leaversPoints);

  const pathLength = 600;
  const xLabels = ["Feb", "May", "Aug", "Nov"];

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: noCardStyle ? "transparent" : theme.colors.surface.main,
        borderRadius: noCardStyle ? 0 : theme.layout.borderRadius.card,
        boxShadow: noCardStyle ? "none" : theme.layout.shadow.card,
        padding: noCardStyle ? 0 : "24px 24px 32px 24px",
        fontFamily: theme.typography.fontFamily.body,
      }}
    >
      {/* Title + Subtitle */}
      {!hideTitle && (
        <div style={{ marginBottom: compact ? theme.chart.compact.title.marginBottom : theme.chart.title.marginBottom }}>
          <h3
            style={{
              fontFamily: theme.chart.title.fontFamily,
              fontSize: compact ? theme.chart.compact.title.fontSize : theme.chart.title.fontSize,
              fontWeight: theme.chart.title.fontWeight,
              color: theme.chart.title.color,
              margin: 0,
            }}
          >
            {title}
          </h3>
          <div
            style={{
              fontFamily: theme.chart.legend.fontFamily,
              fontSize: compact ? theme.chart.compact.legend.fontSize : theme.chart.legend.fontSize,
              color: theme.chart.legend.color,
              marginTop: 4,
              opacity: 0.8,
            }}
          >
            {subtitle}
          </div>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: compact ? theme.chart.compact.legend.gap : theme.chart.legend.horizontalGap,
          marginBottom: compact ? theme.chart.compact.title.marginBottom : 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: compact ? theme.chart.compact.legend.itemGap : theme.chart.legend.itemGap }}>
          <div
            style={{
              width: compact ? theme.chart.compact.legend.indicator.pill.width : theme.chart.legend.indicator.pill.width,
              height: compact ? theme.chart.compact.legend.indicator.pill.height : theme.chart.legend.indicator.pill.height,
              borderRadius: theme.chart.legend.indicator.pill.borderRadius,
              backgroundColor: theme.colors.charts.teal,
            }}
          />
          <span
            style={{
              fontFamily: theme.chart.legend.fontFamily,
              fontSize: compact ? theme.chart.compact.legend.fontSize : theme.chart.legend.fontSize,
              fontWeight: theme.chart.legend.fontWeight,
              color: theme.chart.legend.color,
            }}
          >
            % positive outcomes
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: compact ? theme.chart.compact.legend.itemGap : theme.chart.legend.itemGap }}>
          <div
            style={{
              width: compact ? theme.chart.compact.legend.indicator.pill.width : theme.chart.legend.indicator.pill.width,
              height: compact ? theme.chart.compact.legend.indicator.pill.height : theme.chart.legend.indicator.pill.height,
              borderRadius: theme.chart.legend.indicator.pill.borderRadius,
              backgroundColor: theme.colors.charts.orange,
            }}
          />
          <span
            style={{
              fontFamily: theme.chart.legend.fontFamily,
              fontSize: compact ? theme.chart.compact.legend.fontSize : theme.chart.legend.fontSize,
              fontWeight: theme.chart.legend.fontWeight,
              color: theme.chart.legend.color,
            }}
          >
            Leavers index
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <svg width={chartWidth} height={chartHeight}>
        {/* Subtle grid lines */}
        {[0.33, 0.66].map((ratio, i) => {
          const y = padding.top + innerHeight * (1 - ratio);
          return (
            <line
              key={i}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke={theme.colors.surface.outline}
              strokeOpacity={0.4}
              strokeWidth={1}
            />
          );
        })}

        {/* Outcomes line (teal) */}
        <path
          d={outcomesPath}
          fill="none"
          stroke={theme.colors.charts.teal}
          strokeWidth={theme.chart.line.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={interpolate(progress1, [0, 1], [pathLength, 0])}
        />

        {/* Leavers line (orange) - delayed */}
        <path
          d={leaversPath}
          fill="none"
          stroke={theme.colors.charts.orange}
          strokeWidth={theme.chart.line.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={interpolate(progress2, [0, 1], [pathLength, 0])}
        />

        {/* X-axis labels */}
        {xLabels.map((label, i) => {
          const dataIndex = i * 3;
          return (
            <text
              key={label}
              x={xScale(dataIndex)}
              y={chartHeight - theme.chart.line.labelOffset}
              textAnchor="middle"
              fontFamily={theme.chart.axisLabel.fontFamily}
              fontSize={compact ? theme.chart.compact.axisLabel.fontSize : theme.chart.axisLabel.fontSize}
              fill={theme.chart.axisLabel.color}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
