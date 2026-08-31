import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { generateSmoothPath } from "./chartUtils";

// 12-month data showing workload sentiment dropping, sick leave rising ~4 weeks later
const capacityData = [
  { month: "Feb", workload: 72, sickLeave: 18 },
  { month: "Mar", workload: 74, sickLeave: 17 },
  { month: "Apr", workload: 73, sickLeave: 18 },
  { month: "May", workload: 71, sickLeave: 19 },
  { month: "Jun", workload: 68, sickLeave: 20 },
  { month: "Jul", workload: 65, sickLeave: 22 },
  { month: "Aug", workload: 58, sickLeave: 25 },
  { month: "Sep", workload: 52, sickLeave: 28 },
  // Stress event: workload drops sharply Oct-Nov, sick leave spikes Nov-Dec
  { month: "Oct", workload: 45, sickLeave: 32 },
  { month: "Nov", workload: 42, sickLeave: 38 },
  { month: "Dec", workload: 48, sickLeave: 35 },
  { month: "Jan", workload: 55, sickLeave: 30 },
];

interface CapacityStressSignalCardProps {
  title?: string;
  subtitle?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const CapacityStressSignalCard: React.FC<CapacityStressSignalCardProps> = ({
  title = "Capacity stress signal (Feb 25 – Jan 26)",
  subtitle = "Workload sentiment vs sick leave",
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
  const xScale = (i: number) => padding.left + (i / (capacityData.length - 1)) * innerWidth;
  // Y scale: 0-100 range, inverted
  const yScale = (val: number) => padding.top + innerHeight - (val / 100) * innerHeight;

  // Generate paths
  const workloadPoints = capacityData.map((d, i) => ({ x: xScale(i), y: yScale(d.workload) }));
  const sickLeavePoints = capacityData.map((d, i) => ({ x: xScale(i), y: yScale(d.sickLeave) }));
  const workloadPath = generateSmoothPath(workloadPoints);
  const sickLeavePath = generateSmoothPath(sickLeavePoints);

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
      {/* Header: Title + Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: compact
            ? theme.chart.compact.title.marginBottom
            : isMobile
              ? theme.chart.mobile.title.marginBottom
              : theme.chart.title.marginBottom,
        }}
      >
        {/* Title + Subtitle */}
        {!hideTitle && (
          <div>
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
              }}
            >
              {title}
            </h3>
            <div
              style={{
                fontFamily: theme.chart.legend.fontFamily,
                fontSize: compact || isMobile ? theme.chart.mobile.legend.fontSize : theme.chart.legend.fontSize,
                color: theme.chart.legend.color,
                marginTop: isMobile ? 2 : 4,
                opacity: 0.8,
              }}
            >
              {subtitle}
            </div>
          </div>
        )}

        {/* Legend - top right, vertically stacked */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: compact || isMobile ? theme.chart.mobile.legend.gap : theme.chart.legend.gap,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: compact || isMobile ? theme.chart.mobile.legend.itemGap : theme.chart.legend.itemGap }}>
            <div
              style={{
                width: compact || isMobile ? theme.chart.mobile.legend.indicator.pill.width : theme.chart.legend.indicator.pill.width,
                height: compact || isMobile ? theme.chart.mobile.legend.indicator.pill.height : theme.chart.legend.indicator.pill.height,
                borderRadius: theme.chart.legend.indicator.pill.borderRadius,
                backgroundColor: theme.colors.charts.teal,
              }}
            />
            <span
              style={{
                fontFamily: theme.chart.legend.fontFamily,
                fontSize: compact || isMobile ? theme.chart.mobile.legend.fontSize : theme.chart.legend.fontSize,
                fontWeight: theme.chart.legend.fontWeight,
                color: theme.chart.legend.color,
              }}
            >
              Workload sentiment
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: compact || isMobile ? theme.chart.mobile.legend.itemGap : theme.chart.legend.itemGap }}>
            <div
              style={{
                width: compact || isMobile ? theme.chart.mobile.legend.indicator.pill.width : theme.chart.legend.indicator.pill.width,
                height: compact || isMobile ? theme.chart.mobile.legend.indicator.pill.height : theme.chart.legend.indicator.pill.height,
                borderRadius: theme.chart.legend.indicator.pill.borderRadius,
                backgroundColor: theme.colors.charts.orange,
              }}
            />
            <span
              style={{
                fontFamily: theme.chart.legend.fontFamily,
                fontSize: compact || isMobile ? theme.chart.mobile.legend.fontSize : theme.chart.legend.fontSize,
                fontWeight: theme.chart.legend.fontWeight,
                color: theme.chart.legend.color,
              }}
            >
              Sick leave index
            </span>
          </div>
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

        {/* Workload sentiment line (teal) */}
        <path
          d={workloadPath}
          fill="none"
          stroke={theme.colors.charts.teal}
          strokeWidth={theme.chart.line.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={interpolate(progress1, [0, 1], [pathLength, 0])}
        />

        {/* Sick leave line (orange) - delayed */}
        <path
          d={sickLeavePath}
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
              fontSize={compact || isMobile ? theme.chart.mobile.axisLabel.fontSize : theme.chart.axisLabel.fontSize}
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
