import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Sample data showing hybrid teams have lower short-term sickness
const remoteData = [
  { group: "Hybrid >2 remote days", shortTermSickRate: 3.0, avgOvertime: 8.4, sampleSize: 420 },
  { group: "Hybrid 1–2 remote days", shortTermSickRate: 3.6, avgOvertime: 8.7, sampleSize: 610 },
  { group: "Full on-site", shortTermSickRate: 5.0, avgOvertime: 8.9, sampleSize: 530 },
];

// Short labels for chart
const shortLabels = ["Hybrid >2d", "Hybrid 1–2d", "On-site"];

interface RemoteImmunitySignalCardProps {
  title?: string;
  subtitle?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const RemoteImmunitySignalCard: React.FC<RemoteImmunitySignalCardProps> = ({
  title = "Short-term sickness by work arrangement",
  subtitle = "Sick episodes per 100 employees/month",
  hideTitle = false,
  compact = false,
  embedded = false,
  layout = "desktop",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isMobile = layout === "mobile";

  // When embedded or compact, remove card styling
  const noCardStyle = compact || embedded;

  // Chart dimensions - use full width of container
  // viewBox coordinates for SVG scaling
  const viewBoxWidth = 480;
  const chartHeight = compact ? 140 : isMobile ? 120 : 180;
  const padding = { top: 20, right: 30, bottom: 40, left: 30 };
  const innerWidth = viewBoxWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate bar dimensions - spread bars across full width with generous spacing
  const barCount = remoteData.length;
  const totalBarWidth = innerWidth * 0.7; // Bars take 70% of width
  const barWidth = totalBarWidth / barCount;
  const totalGapWidth = innerWidth - totalBarWidth;
  const barGap = totalGapWidth / (barCount - 1);
  const barStartOffset = (innerWidth - (barWidth * barCount + barGap * (barCount - 1))) / 2;
  const maxValue = 6; // Scale to 6 for visual balance

  // Y scale
  const yScale = (val: number) => padding.top + innerHeight - (val / maxValue) * innerHeight;

  // X position for each bar - centered within chart area
  const xPos = (i: number) => padding.left + barStartOffset + i * (barWidth + barGap);

  // Colors for groups
  const barColors = [
    theme.colors.charts.green, // Hybrid >2 (best)
    theme.colors.charts.teal,  // Hybrid 1-2
    theme.colors.charts.orange, // On-site (worst)
  ];

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
      {/* Header: Title */}
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
          {shortLabels.map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: compact || isMobile ? theme.chart.mobile.legend.itemGap : theme.chart.legend.itemGap }}>
              <div
                style={{
                  width: compact || isMobile ? theme.chart.mobile.legend.indicator.square.width : theme.chart.legend.indicator.square.width,
                  height: compact || isMobile ? theme.chart.mobile.legend.indicator.square.height : theme.chart.legend.indicator.square.height,
                  borderRadius: theme.chart.legend.indicator.square.borderRadius,
                  backgroundColor: barColors[i],
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
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Chart - fills container width */}
      <svg width="100%" viewBox={`0 0 ${viewBoxWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        {/* Subtle grid lines */}
        {[2, 4].map((val, i) => {
          const y = yScale(val);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={viewBoxWidth - padding.right}
                y2={y}
                stroke={theme.colors.surface.outline}
                strokeOpacity={0.4}
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontFamily={theme.chart.axisLabel.fontFamily}
                fontSize={compact || isMobile ? theme.chart.mobile.axisLabel.fontSize : theme.chart.axisLabel.fontSize}
                fill={theme.chart.axisLabel.color}
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {remoteData.map((d, i) => {
          // Stagger animation: 8 frames between each bar (as per spec)
          const barProgress = spring({
            frame: Math.max(0, frame - i * 8),
            fps,
            config: theme.chart.animation.spring,
          });

          const barHeight = (d.shortTermSickRate / maxValue) * innerHeight * barProgress;
          const barY = padding.top + innerHeight - barHeight;

          // Value label opacity
          const valueOpacity = interpolate(
            barProgress,
            [0.8, 1],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <g key={d.group}>
              {/* Bar */}
              <rect
                x={xPos(i)}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={barColors[i]}
                rx={4}
              />

              {/* Value label above bar */}
              <text
                x={xPos(i) + barWidth / 2}
                y={barY - 8}
                textAnchor="middle"
                fontFamily={theme.chart.axisLabel.fontFamily}
                fontSize={compact || isMobile ? theme.chart.mobile.axisLabel.fontSize + 2 : theme.chart.axisLabel.fontSize + 2}
                fontWeight={600}
                fill={theme.chart.title.color}
                opacity={valueOpacity}
              >
                {d.shortTermSickRate.toFixed(1)}
              </text>

              {/* X-axis label */}
              <text
                x={xPos(i) + barWidth / 2}
                y={chartHeight - 8}
                textAnchor="middle"
                fontFamily={theme.chart.axisLabel.fontFamily}
                fontSize={compact || isMobile ? theme.chart.mobile.axisLabel.fontSize : theme.chart.axisLabel.fontSize}
                fill={theme.chart.axisLabel.color}
              >
                {shortLabels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
