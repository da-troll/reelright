import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Helper to mix two hex colors
const mixHex = (hex1: string, hex2: string, t: number): string => {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

// Default eNPS score distribution data (0-10)
const defaultScoreData = [
  { score: 0, count: 2 },
  { score: 1, count: 1 },
  { score: 2, count: 3 },
  { score: 3, count: 4 },
  { score: 4, count: 6 },
  { score: 5, count: 8 },
  { score: 6, count: 12 },
  { score: 7, count: 18 },
  { score: 8, count: 24 },
  { score: 9, count: 32 },
  { score: 10, count: 28 },
];

interface EnpsDistributionChartProps {
  title?: string;
  scoreData?: { score: number; count: number }[];
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean; // When true, removes card styling (bg, shadow, radius) for nesting in another card
  layout?: "desktop" | "mobile";
}

// Colors
const colors = {
  promoters: theme.colors.charts.green, // #80e4a6
  passives: theme.colors.charts.orange, // #F2B299
  detractors: mixHex(theme.colors.status.onError, "#ffffff", 0.78), // pastel red
};

// Get color based on score
const getScoreColor = (score: number): string => {
  if (score >= 9) return "url(#grad-promoters)";
  if (score >= 7) return "url(#grad-passives)";
  return "url(#grad-detractors)";
};

export const EnpsDistributionChart: React.FC<EnpsDistributionChartProps> = ({
  title = "eNPS Distribution",
  scoreData = defaultScoreData,
  hideTitle = false,
  compact = false,
  embedded = false,
  layout = "desktop",
}) => {
  const isMobile = layout === "mobile";

  // Calculate category totals
  const totalResponses = scoreData.reduce((sum, d) => sum + d.count, 0);
  const promoters = scoreData.filter((d) => d.score >= 9).reduce((sum, d) => sum + d.count, 0);
  const passives = scoreData.filter((d) => d.score >= 7 && d.score <= 8).reduce((sum, d) => sum + d.count, 0);
  const detractors = scoreData.filter((d) => d.score <= 6).reduce((sum, d) => sum + d.count, 0);

  const promotersPct = Math.round((promoters / totalResponses) * 100);
  const passivesPct = Math.round((passives / totalResponses) * 100);
  const detractorsPct = Math.round((detractors / totalResponses) * 100);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // When embedded or compact, remove card styling
  const noCardStyle = compact || embedded;

  // Chart dimensions (width from theme, height flexible for content)
  const chartWidth = compact
    ? theme.chart.compact.width
    : isMobile
      ? theme.chart.mobile.width
      : theme.chart.width;
  const chartHeight = compact ? 160 : isMobile ? 140 : 220;
  const padding = { top: 20, right: 20, bottom: 50, left: 40 };
  const barWidth = compact ? 18 : isMobile ? 16 : 24;

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate slot width for even spacing
  const slotWidth = innerWidth / 10; // 11 bars, 10 gaps between first and last

  // Max count for scaling
  const maxCount = Math.max(...scoreData.map((d) => d.count));

  // Grid lines (3 horizontal)
  const gridLines = [0.25, 0.5, 0.75];

  return (
    <div
      style={{
        backgroundColor: noCardStyle ? "transparent" : theme.colors.surface.main,
        borderRadius: noCardStyle ? 0 : theme.layout.borderRadius.card,
        boxShadow: noCardStyle ? "none" : theme.layout.shadow.card,
        padding: noCardStyle ? 0 : "24px 24px 32px 24px",
        width: "100%",
      }}
    >
      {/* Title */}
      {!hideTitle && (
        <div
          style={{
            fontFamily: theme.chart.title.fontFamily,
            fontSize: compact
              ? theme.chart.compact.title.fontSize
              : isMobile
                ? theme.chart.mobile.title.fontSize
                : theme.chart.title.fontSize,
            fontWeight: theme.chart.title.fontWeight,
            color: theme.chart.title.color,
            marginBottom: compact
              ? theme.chart.compact.title.marginBottom
              : isMobile
                ? theme.chart.mobile.title.marginBottom
                : theme.chart.title.marginBottom,
          }}
        >
          {title}
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: compact
            ? theme.chart.compact.legend.gap
            : isMobile
              ? theme.chart.mobile.legend.horizontalGap
              : theme.chart.legend.horizontalGap,
          marginBottom: compact
            ? theme.chart.compact.title.marginBottom
            : isMobile
              ? theme.chart.mobile.title.marginBottom
              : theme.chart.title.marginBottom,
          fontFamily: theme.chart.legend.fontFamily,
          fontSize: compact || isMobile ? theme.chart.mobile.legend.fontSize : theme.chart.legend.fontSize,
          fontWeight: theme.chart.legend.fontWeight,
          color: theme.chart.legend.color,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: compact || isMobile ? theme.chart.mobile.legend.itemGap : theme.chart.legend.itemGap }}>
          <div
            style={{
              width: compact || isMobile ? theme.chart.mobile.legend.indicator.square.width : theme.chart.legend.indicator.square.width,
              height: compact || isMobile ? theme.chart.mobile.legend.indicator.square.height : theme.chart.legend.indicator.square.height,
              borderRadius: compact || isMobile ? theme.chart.mobile.legend.indicator.square.borderRadius : theme.chart.legend.indicator.square.borderRadius,
              backgroundColor: colors.promoters,
            }}
          />
          <span>Promoters (9-10) {promotersPct}%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: compact || isMobile ? theme.chart.mobile.legend.itemGap : theme.chart.legend.itemGap }}>
          <div
            style={{
              width: compact || isMobile ? theme.chart.mobile.legend.indicator.square.width : theme.chart.legend.indicator.square.width,
              height: compact || isMobile ? theme.chart.mobile.legend.indicator.square.height : theme.chart.legend.indicator.square.height,
              borderRadius: compact || isMobile ? theme.chart.mobile.legend.indicator.square.borderRadius : theme.chart.legend.indicator.square.borderRadius,
              backgroundColor: colors.passives,
            }}
          />
          <span>Passives (7-8) {passivesPct}%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: compact || isMobile ? theme.chart.mobile.legend.itemGap : theme.chart.legend.itemGap }}>
          <div
            style={{
              width: compact || isMobile ? theme.chart.mobile.legend.indicator.square.width : theme.chart.legend.indicator.square.width,
              height: compact || isMobile ? theme.chart.mobile.legend.indicator.square.height : theme.chart.legend.indicator.square.height,
              borderRadius: compact || isMobile ? theme.chart.mobile.legend.indicator.square.borderRadius : theme.chart.legend.indicator.square.borderRadius,
              backgroundColor: colors.detractors,
            }}
          />
          <span>Detractors (0-6) {detractorsPct}%</span>
        </div>
      </div>

      {/* SVG Chart */}
      <svg width={chartWidth} height={chartHeight}>
        <defs>
          {/* Gradient for Promoters */}
          <linearGradient id="grad-promoters" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.promoters} stopOpacity={0.95} />
            <stop offset="100%" stopColor={colors.promoters} stopOpacity={0.75} />
          </linearGradient>
          {/* Gradient for Passives */}
          <linearGradient id="grad-passives" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.passives} stopOpacity={0.95} />
            <stop offset="100%" stopColor={colors.passives} stopOpacity={0.75} />
          </linearGradient>
          {/* Gradient for Detractors */}
          <linearGradient id="grad-detractors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.detractors} stopOpacity={0.95} />
            <stop offset="100%" stopColor={colors.detractors} stopOpacity={0.75} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((ratio, i) => {
          const y = padding.top + innerHeight * (1 - ratio);
          return (
            <line
              key={i}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke={theme.colors.surface.outline}
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          );
        })}

        {/* X-axis baseline */}
        <line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke={theme.colors.surface.outline}
          strokeWidth={1}
        />

        {/* Bars */}
        {scoreData.map((d, i) => {
          const targetHeight = (d.count / maxCount) * innerHeight;
          const barProgress = spring({
            frame: frame - i * 2,
            fps,
            config: { stiffness: 120, damping: 18, mass: 0.9 },
          });
          const animatedHeight = interpolate(barProgress, [0, 1], [0, targetHeight]);
          const x = padding.left + slotWidth * d.score - barWidth / 2;
          const baselineY = chartHeight - padding.bottom;
          const y = baselineY - animatedHeight;

          return (
            <rect
              key={d.score}
              x={x}
              y={y}
              width={barWidth}
              height={animatedHeight}
              rx={barWidth / 2}
              ry={barWidth / 2}
              fill={getScoreColor(d.score)}
            />
          );
        })}

        {/* X-axis labels */}
        {scoreData.map((d) => {
          const x = padding.left + slotWidth * d.score;
          return (
            <text
              key={d.score}
              x={x}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              fontSize={compact || isMobile ? theme.chart.mobile.axisLabel.fontSize : theme.chart.axisLabel.fontSize}
              fontFamily={theme.chart.axisLabel.fontFamily}
              fill={theme.chart.axisLabel.color}
            >
              {d.score}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
