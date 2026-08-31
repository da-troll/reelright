import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { generateSmoothPath } from "./chartUtils";

// 12-month turnover data matching the eNPS story: stability, then Oct-Nov turnover event
const turnoverData = [
  { month: "Feb", joiners: 15, leavers: 8 },
  { month: "Mar", joiners: 16, leavers: 7 },
  { month: "Apr", joiners: 15, leavers: 8 },
  { month: "May", joiners: 17, leavers: 7 },
  { month: "Jun", joiners: 18, leavers: 6 },
  { month: "Jul", joiners: 16, leavers: 8 },
  { month: "Aug", joiners: 14, leavers: 10 },
  { month: "Sep", joiners: 12, leavers: 13 },
  // Turnover event: Oct-Nov (leavers spike, joiners drop)
  { month: "Oct", joiners: 8, leavers: 20 },
  { month: "Nov", joiners: 7, leavers: 18 },
  // Recovery
  { month: "Dec", joiners: 10, leavers: 12 },
  { month: "Jan", joiners: 14, leavers: 9 },
];

interface JoinersLeaversChartProps {
  title?: string;
  compact?: boolean;
  xLabels?: string[];
  hideTitle?: boolean;
  embedded?: boolean; // When true, removes card styling (bg, shadow, radius) for nesting in another card
  layout?: "desktop" | "mobile";
}

export const JoinersLeaversChart: React.FC<JoinersLeaversChartProps> = ({
  title = "Turnover - Last 12 months",
  compact = false,
  xLabels = ["Feb", "May", "Aug", "Nov"],
  hideTitle = false,
  embedded = false,
  layout = "desktop",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isMobile = layout === "mobile";

  // Animation: Draw the lines
  const progress = spring({
    frame,
    fps,
    config: theme.chart.animation.spring,
  });

  // Chart dimensions using theme tokens - mobile uses smaller dimensions
  const chartWidth = compact
    ? theme.chart.compact.contentWidth
    : isMobile
      ? theme.chart.mobile.contentWidth
      : theme.chart.contentWidth;
  const chartHeight = isMobile ? 100 : 140;
  const padding = theme.chart.line.padding;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Scales
  const xScale = (i: number) => padding.left + (i / (turnoverData.length - 1)) * innerWidth;
  // Y scale: 0-25 range for joiners/leavers count, inverted (lower y = higher value)
  const yScale = (val: number) => padding.top + innerHeight - (val / 25) * innerHeight;

  // Generate smooth paths from data points
  const joinerPoints = turnoverData.map((d, i) => ({ x: xScale(i), y: yScale(d.joiners) }));
  const leaverPoints = turnoverData.map((d, i) => ({ x: xScale(i), y: yScale(d.leavers) }));
  const joinerPath = generateSmoothPath(joinerPoints);
  const leaverPath = generateSmoothPath(leaverPoints);

  // Path length for dashoffset animation (approximate)
  const pathLength = 600;

  // When embedded in another card, remove card styling but keep full size
  const noCardStyle = compact || embedded;

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: noCardStyle ? "transparent" : "white",
        padding: compact ? "0" : embedded ? "0" : "24px 24px 32px 24px",
        display: "flex",
        flexDirection: "column",
        borderRadius: noCardStyle ? 0 : 16,
        boxShadow: noCardStyle ? "none" : "0 4px 20px rgba(0,0,0,0.04)",
        fontFamily: theme.typography.fontFamily.body,
      }}
    >
      {/* HEADER: Title Left, Legend Right */}
      {!hideTitle && (
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

          {/* Legend - Vertical Stack */}
          <div style={{
            display: "flex",
            flexDirection: compact || isMobile ? "row" : "column",
            gap: compact
              ? theme.chart.compact.legend.gap
              : isMobile
                ? theme.chart.mobile.legend.gap
                : theme.chart.legend.gap
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: compact || isMobile ? theme.chart.mobile.legend.itemGap : theme.chart.legend.itemGap }}>
              <div
                style={{
                  width: compact || isMobile ? theme.chart.mobile.legend.indicator.pill.width : theme.chart.legend.indicator.pill.width,
                  height: compact || isMobile ? theme.chart.mobile.legend.indicator.pill.height : theme.chart.legend.indicator.pill.height,
                  borderRadius: theme.chart.legend.indicator.pill.borderRadius,
                  backgroundColor: theme.colors.brand.primary,
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
                Joiners
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
                Leavers
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CHART AREA */}
      <svg width={chartWidth} height={chartHeight}>
        {/* Line 1: Joiners (Brand Primary) */}
        <path
          d={joinerPath}
          fill="none"
          stroke={theme.colors.brand.primary}
          strokeWidth={theme.chart.line.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={interpolate(progress, [0, 1], [pathLength, 0])}
        />

        {/* Line 2: Leavers (Orange) */}
        <path
          d={leaverPath}
          fill="none"
          stroke={theme.colors.charts.orange}
          strokeWidth={theme.chart.line.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={interpolate(progress, [0, 1], [pathLength, 0])}
        />

        {/* X-AXIS LABELS */}
        {xLabels.map((label, i) => {
          // Map label index to data index (Feb=0, May=3, Aug=6, Nov=9)
          const dataIndex = i * 3;
          return (
            <text
              key={label}
              x={xScale(dataIndex)}
              y={chartHeight - theme.chart.line.labelOffset}
              fill={theme.chart.axisLabel.color}
              fontFamily={theme.chart.axisLabel.fontFamily}
              fontSize={isMobile ? theme.chart.mobile.axisLabel.fontSize : theme.chart.axisLabel.fontSize}
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
