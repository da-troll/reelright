import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { generateSmoothPath } from "./chartUtils";

// 12-month data: backlog rises Oct-Nov, manager support dips in the same window
const managerLoadData = [
  { month: "Feb", backlog: 32, support: 74 },
  { month: "Mar", backlog: 30, support: 76 },
  { month: "Apr", backlog: 33, support: 75 },
  { month: "May", backlog: 35, support: 73 },
  { month: "Jun", backlog: 38, support: 71 },
  { month: "Jul", backlog: 42, support: 68 },
  { month: "Aug", backlog: 48, support: 64 },
  { month: "Sep", backlog: 55, support: 58 },
  // Stress event: backlog spikes Oct-Nov, support drops
  { month: "Oct", backlog: 68, support: 48 },
  { month: "Nov", backlog: 72, support: 44 },
  // Recovery
  { month: "Dec", backlog: 62, support: 52 },
  { month: "Jan", backlog: 55, support: 58 },
];

interface ManagerLoadSignalCardProps {
  title?: string;
  subtitle?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const ManagerLoadSignalCard: React.FC<ManagerLoadSignalCardProps> = ({
  title = "Manager load signal",
  subtitle = "Backlog vs manager support (12 months)",
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
  const xScale = (i: number) => padding.left + (i / (managerLoadData.length - 1)) * innerWidth;
  // Y scale: 0-100 range, inverted
  const yScale = (val: number) => padding.top + innerHeight - (val / 100) * innerHeight;

  // Generate paths
  const backlogPoints = managerLoadData.map((d, i) => ({ x: xScale(i), y: yScale(d.backlog) }));
  const supportPoints = managerLoadData.map((d, i) => ({ x: xScale(i), y: yScale(d.support) }));
  const backlogPath = generateSmoothPath(backlogPoints);
  const supportPath = generateSmoothPath(supportPoints);

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
            Task backlog index
          </span>
        </div>
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
            Manager support score
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

        {/* Task backlog line (orange) */}
        <path
          d={backlogPath}
          fill="none"
          stroke={theme.colors.charts.orange}
          strokeWidth={theme.chart.line.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={interpolate(progress1, [0, 1], [pathLength, 0])}
        />

        {/* Manager support line (teal) - delayed */}
        <path
          d={supportPath}
          fill="none"
          stroke={theme.colors.charts.teal}
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
