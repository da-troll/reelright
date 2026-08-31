import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { generateSmoothPath, mixHexColors } from "./chartUtils";

// 12-month data with a compelling story: stability, then turnover event in Oct-Nov
type MonthPoint = {
  month: string;
  s6: number;
  s7: number;
  s8: number;
  s9: number;
  s10: number;
  joiners: number;
  leavers: number;
};

const data: MonthPoint[] = [
  { month: "Feb", s6: 8, s7: 12, s8: 22, s9: 30, s10: 28, joiners: 12, leavers: 6 },
  { month: "Mar", s6: 7, s7: 11, s8: 23, s9: 31, s10: 28, joiners: 14, leavers: 5 },
  { month: "Apr", s6: 7, s7: 12, s8: 22, s9: 32, s10: 27, joiners: 15, leavers: 7 },
  { month: "May", s6: 6, s7: 11, s8: 21, s9: 33, s10: 29, joiners: 16, leavers: 6 },
  { month: "Jun", s6: 6, s7: 10, s8: 22, s9: 34, s10: 28, joiners: 18, leavers: 5 },
  { month: "Jul", s6: 7, s7: 11, s8: 21, s9: 33, s10: 28, joiners: 14, leavers: 8 },
  { month: "Aug", s6: 8, s7: 12, s8: 22, s9: 31, s10: 27, joiners: 10, leavers: 11 },
  { month: "Sep", s6: 9, s7: 13, s8: 23, s9: 30, s10: 25, joiners: 8, leavers: 14 },
  // Turnover event: Oct-Nov
  { month: "Oct", s6: 12, s7: 16, s8: 24, s9: 26, s10: 22, joiners: 6, leavers: 22 },
  { month: "Nov", s6: 14, s7: 17, s8: 23, s9: 25, s10: 21, joiners: 5, leavers: 19 },
  // Recovery
  { month: "Dec", s6: 11, s7: 14, s8: 24, s9: 28, s10: 23, joiners: 9, leavers: 12 },
  { month: "Jan", s6: 9, s7: 13, s8: 23, s9: 29, s10: 26, joiners: 13, leavers: 8 },
];

// Colors
const lineColors = {
  s10: theme.colors.charts.purple,
  s9: theme.colors.charts.pink,
  s8: theme.colors.charts.blue,
  s7: theme.colors.charts.teal,
  s6: theme.colors.charts.orange,
};

const turnoverColors = {
  joiners: theme.colors.charts.teal,
  leavers: mixHexColors(theme.colors.status.onError, "#ffffff", 0.55),
};

// Compute Pearson correlation
const pearson = (x: number[], y: number[]): number => {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return den === 0 ? 0 : num / den;
};

// Calculate correlations
const leavers = data.map((d) => d.leavers);
const s910 = data.map((d) => d.s9 + d.s10);
const s67 = data.map((d) => d.s6 + d.s7);
const corrLeaversHigh = pearson(leavers, s910);
const corrLeaversLow = pearson(leavers, s67);

interface EnpsBucketsVsTurnoverChartProps {
  layout?: "desktop" | "mobile";
}

export const EnpsBucketsVsTurnoverChart: React.FC<EnpsBucketsVsTurnoverChartProps> = ({
  layout = "desktop",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isMobile = layout === "mobile";

  // Animation progress
  const drawProgress = spring({
    frame,
    fps,
    config: { mass: 1, damping: 18, stiffness: 60 },
  });

  const bottomDrawProgress = spring({
    frame: frame - 8,
    fps,
    config: { mass: 1, damping: 18, stiffness: 60 },
  });

  // Chart dimensions - mobile uses smaller sizes
  const topChartWidth = isMobile ? 320 : 520;
  const topChartHeight = isMobile ? 100 : 140;
  const bottomChartHeight = isMobile ? 60 : 80;
  const padding = { top: 10, right: 30, bottom: 25, left: 35 };

  const innerWidth = topChartWidth - padding.left - padding.right;
  const topInnerHeight = topChartHeight - padding.top - padding.bottom;
  const bottomInnerHeight = bottomChartHeight - padding.top - padding.bottom;

  // Scales
  const xScale = (i: number) => padding.left + (i / (data.length - 1)) * innerWidth;

  // Top chart Y scale (for percentages 0-40)
  const topYScale = (val: number) =>
    padding.top + topInnerHeight - (val / 40) * topInnerHeight;

  // Bottom chart Y scale (for joiners/leavers 0-25)
  const bottomYScale = (val: number) =>
    padding.top + bottomInnerHeight - (val / 25) * bottomInnerHeight;

  // Generate paths for score lines
  const scoreKeys = ["s6", "s7", "s8", "s9", "s10"] as const;
  const scorePaths = scoreKeys.map((key) => {
    const points = data.map((d, i) => ({
      x: xScale(i),
      y: topYScale(d[key]),
    }));
    return { key, path: generateSmoothPath(points) };
  });

  // Generate paths for joiners/leavers
  const joinersPoints = data.map((d, i) => ({ x: xScale(i), y: bottomYScale(d.joiners) }));
  const leaversPoints = data.map((d, i) => ({ x: xScale(i), y: bottomYScale(d.leavers) }));
  const joinersPath = generateSmoothPath(joinersPoints);
  const leaversPath = generateSmoothPath(leaversPoints);

  const pathLength = 800;

  return (
    <div
      style={{
        backgroundColor: theme.colors.surface.main,
        borderRadius: theme.layout.borderRadius.card,
        boxShadow: theme.layout.shadow.card,
        padding: "20px 24px 28px 24px",
        width: "100%",
        fontFamily: theme.typography.fontFamily.body,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: theme.chart.title.fontFamily,
          fontSize: isMobile ? theme.chart.mobile.title.fontSize : theme.chart.title.fontSize,
          fontWeight: theme.chart.title.fontWeight,
          color: theme.chart.title.color,
          marginBottom: isMobile ? 4 : 6,
        }}
      >
        eNPS Score Trends vs. Turnover
      </div>

      {/* Micro-summary */}
      <div
        style={{
          fontSize: isMobile ? 10 : theme.typography.size.small,
          color: theme.colors.text.secondary,
          marginBottom: isMobile ? 8 : 12,
          lineHeight: 1.4,
        }}
      >
        Notice how 9–10s dip when leavers spike in Oct–Nov, while 6–7s rise.
      </div>

      {/* Top Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: `${theme.chart.legend.gap}px ${theme.chart.legend.horizontalGap}px`,
          marginBottom: 12,
          fontFamily: theme.chart.legend.fontFamily,
          fontSize: theme.chart.compact.legend.fontSize,
          fontWeight: theme.chart.legend.fontWeight,
          color: theme.chart.legend.color,
        }}
      >
        {(["s10", "s9", "s8", "s7", "s6"] as const).map((key) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: theme.chart.compact.legend.itemGap }}>
            <div
              style={{
                width: theme.chart.compact.legend.indicator.pill.width,
                height: theme.chart.compact.legend.indicator.pill.height,
                borderRadius: theme.chart.legend.indicator.pill.borderRadius,
                backgroundColor: lineColors[key],
              }}
            />
            <span>Score {key.slice(1)}</span>
          </div>
        ))}
      </div>

      {/* Top Chart: Score Trends */}
      <svg width={topChartWidth} height={topChartHeight}>
        {/* Grid lines */}
        {[10, 20, 30].map((val) => (
          <line
            key={val}
            x1={padding.left}
            y1={topYScale(val)}
            x2={topChartWidth - padding.right}
            y2={topYScale(val)}
            stroke={theme.colors.surface.outline}
            strokeOpacity={0.4}
            strokeWidth={1}
          />
        ))}

        {/* Score lines */}
        {scorePaths.map(({ key, path }) => (
          <path
            key={key}
            d={path}
            fill="none"
            stroke={lineColors[key]}
            strokeWidth={theme.chart.line.strokeWidthSecondary}
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={interpolate(drawProgress, [0, 1], [pathLength, 0])}
          />
        ))}

        {/* X-axis labels (every other month) */}
        {data.map((d, i) =>
          i % 2 === 0 ? (
            <text
              key={d.month}
              x={xScale(i)}
              y={topChartHeight - theme.chart.line.labelOffset}
              textAnchor="middle"
              fontFamily={theme.chart.axisLabel.fontFamily}
              fontSize={theme.chart.compact.axisLabel.fontSize}
              fill={theme.chart.axisLabel.color}
            >
              {d.month}
            </text>
          ) : null
        )}
      </svg>

      {/* Divider */}
      <div
        style={{
          height: 1,
          backgroundColor: theme.colors.surface.outline,
          margin: "12px 0",
          opacity: 0.5,
        }}
      />

      {/* Bottom Legend */}
      <div
        style={{
          display: "flex",
          gap: theme.chart.legend.horizontalGap,
          marginBottom: 8,
          fontFamily: theme.chart.legend.fontFamily,
          fontSize: theme.chart.compact.legend.fontSize,
          fontWeight: theme.chart.legend.fontWeight,
          color: theme.chart.legend.color,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: theme.chart.compact.legend.itemGap }}>
          <div
            style={{
              width: theme.chart.compact.legend.indicator.pill.width,
              height: theme.chart.compact.legend.indicator.pill.height,
              borderRadius: theme.chart.legend.indicator.pill.borderRadius,
              backgroundColor: turnoverColors.joiners,
            }}
          />
          <span>Joiners</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: theme.chart.compact.legend.itemGap }}>
          <div
            style={{
              width: theme.chart.compact.legend.indicator.pill.width,
              height: theme.chart.compact.legend.indicator.pill.height,
              borderRadius: theme.chart.legend.indicator.pill.borderRadius,
              backgroundColor: turnoverColors.leavers,
            }}
          />
          <span>Leavers</span>
        </div>
      </div>

      {/* Bottom Chart: Joiners vs Leavers */}
      <svg width={topChartWidth} height={bottomChartHeight}>
        {/* Grid line */}
        <line
          x1={padding.left}
          y1={bottomYScale(12)}
          x2={topChartWidth - padding.right}
          y2={bottomYScale(12)}
          stroke={theme.colors.surface.outline}
          strokeOpacity={0.4}
          strokeWidth={1}
        />

        {/* Joiners line */}
        <path
          d={joinersPath}
          fill="none"
          stroke={turnoverColors.joiners}
          strokeWidth={theme.chart.line.strokeWidthSecondary}
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={interpolate(bottomDrawProgress, [0, 1], [pathLength, 0])}
        />

        {/* Leavers line */}
        <path
          d={leaversPath}
          fill="none"
          stroke={turnoverColors.leavers}
          strokeWidth={theme.chart.line.strokeWidthSecondary}
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={interpolate(bottomDrawProgress, [0, 1], [pathLength, 0])}
        />

        {/* X-axis labels */}
        {data.map((d, i) =>
          i % 2 === 0 ? (
            <text
              key={d.month}
              x={xScale(i)}
              y={bottomChartHeight - theme.chart.line.labelOffset}
              textAnchor="middle"
              fontFamily={theme.chart.axisLabel.fontFamily}
              fontSize={theme.chart.compact.axisLabel.fontSize}
              fill={theme.chart.axisLabel.color}
            >
              {d.month}
            </text>
          ) : null
        )}
      </svg>

      {/* Correlation callout */}
      <div
        style={{
          marginTop: 14,
          padding: "10px 12px",
          backgroundColor: theme.colors.surface.variant,
          borderRadius: 8,
          fontFamily: theme.chart.insight.fontFamily,
          fontSize: theme.chart.insight.fontSizeSmall,
          color: theme.chart.insight.color,
          lineHeight: theme.chart.insight.lineHeight,
        }}
      >
        <div style={{ fontWeight: theme.chart.insight.fontWeight, marginBottom: 4 }}>
          Correlation (illustrative)
        </div>
        <div>Leavers vs 9–10s: r = {corrLeaversHigh.toFixed(2)}</div>
        <div>Leavers vs 6–7s: r = {corrLeaversLow > 0 ? "+" : ""}{corrLeaversLow.toFixed(2)}</div>
        <div
          style={{
            marginTop: 6,
            fontStyle: "italic",
            fontSize: theme.chart.compact.insight.fontSizeSmall,
            opacity: 0.8,
          }}
        >
          Note: correlation ≠ causation
        </div>
      </div>
    </div>
  );
};
