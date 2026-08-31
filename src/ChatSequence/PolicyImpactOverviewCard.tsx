import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { generateSmoothPath } from "./chartUtils";

// Before/After data for remote work adoption
const adoptionData = {
  before: 2.1, // avg remote days per employee per month
  after: 3.8,
};

// Clarity trend data - 12 months with policy change at month 6 (Sep)
const clarityData = [
  { month: "Apr", score: 62 },
  { month: "May", score: 61 },
  { month: "Jun", score: 63 },
  { month: "Jul", score: 60 },
  { month: "Aug", score: 58 },
  { month: "Sep", score: 64 }, // Policy change
  { month: "Oct", score: 68 },
  { month: "Nov", score: 72 },
  { month: "Dec", score: 74 },
  { month: "Jan", score: 76 },
  { month: "Feb", score: 78 },
  { month: "Mar", score: 79 },
];

interface PolicyImpactOverviewCardProps {
  title?: string;
  policyChangeDate?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const PolicyImpactOverviewCard: React.FC<PolicyImpactOverviewCardProps> = ({
  title = "Policy impact snapshot",
  policyChangeDate = "Sep 2025",
  hideTitle = false,
  compact = false,
  embedded = false,
  layout = "desktop",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isMobile = layout === "mobile";

  const noCardStyle = compact || embedded;

  // Bar animation
  const barProgress = spring({
    frame,
    fps,
    config: { stiffness: 100, damping: 18 },
  });

  // Line animation (starts after bars)
  const lineProgress = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: theme.chart.animation.spring,
  });

  // Dimensions
  const chartWidth = compact
    ? theme.chart.compact.contentWidth
    : isMobile
      ? theme.chart.mobile.contentWidth
      : theme.chart.contentWidth;

  // Bar chart section
  const barChartHeight = compact ? 70 : 90;
  const maxDays = 5;
  const barMaxWidth = chartWidth * 0.6;

  // Line chart section
  const lineChartHeight = compact ? 80 : 100;
  const linePadding = { top: 10, right: 20, bottom: 25, left: 30 };
  const lineInnerWidth = chartWidth - linePadding.left - linePadding.right;
  const lineInnerHeight = lineChartHeight - linePadding.top - linePadding.bottom;

  // Line scales
  const xScale = (i: number) => linePadding.left + (i / (clarityData.length - 1)) * lineInnerWidth;
  const yScale = (val: number) => linePadding.top + lineInnerHeight - ((val - 50) / 40) * lineInnerHeight;

  // Generate clarity path
  const clarityPoints = clarityData.map((d, i) => ({ x: xScale(i), y: yScale(d.score) }));
  const clarityPath = generateSmoothPath(clarityPoints);
  const pathLength = 600;

  // Policy change marker position (Sep = index 5)
  const policyChangeX = xScale(5);

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
      {/* Header */}
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
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontFamily: theme.chart.legend.fontFamily,
                fontSize: compact ? theme.chart.compact.legend.fontSize : theme.chart.legend.fontSize,
                color: theme.chart.legend.color,
              }}
            >
              Remote work policy update
            </span>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 500,
                backgroundColor: theme.colors.brand.primaryLight,
                color: theme.colors.brand.primary,
              }}
            >
              Change date: {policyChangeDate}
            </span>
          </div>
        </div>
      )}

      {/* Before/After Bar Chart */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontFamily: theme.chart.legend.fontFamily,
            fontSize: compact ? theme.chart.compact.legend.fontSize : 11,
            fontWeight: 600,
            color: theme.chart.legend.color,
            marginBottom: 8,
          }}
        >
          Avg. remote days per employee per month
        </div>

        <svg width={chartWidth} height={barChartHeight}>
          {/* Before bar */}
          <g>
            <text
              x={0}
              y={20}
              fontFamily={theme.chart.axisLabel.fontFamily}
              fontSize={compact ? 10 : 12}
              fill={theme.chart.axisLabel.color}
            >
              Before
            </text>
            <rect
              x={60}
              y={8}
              width={interpolate(barProgress, [0, 1], [0, (adoptionData.before / maxDays) * barMaxWidth])}
              height={compact ? 18 : 22}
              rx={compact ? 9 : 11}
              ry={compact ? 9 : 11}
              fill={theme.colors.charts.blue}
              opacity={0.6}
            />
            <text
              x={60 + (adoptionData.before / maxDays) * barMaxWidth + 10}
              y={24}
              fontFamily={theme.chart.axisLabel.fontFamily}
              fontSize={compact ? 11 : 13}
              fontWeight={600}
              fill={theme.colors.text.secondary}
              opacity={interpolate(barProgress, [0.5, 1], [0, 1])}
            >
              {adoptionData.before.toFixed(1)} days
            </text>
          </g>

          {/* After bar */}
          <g>
            <text
              x={0}
              y={barChartHeight - 18}
              fontFamily={theme.chart.axisLabel.fontFamily}
              fontSize={compact ? 10 : 12}
              fill={theme.chart.axisLabel.color}
            >
              After
            </text>
            <rect
              x={60}
              y={barChartHeight - 30}
              width={interpolate(barProgress, [0, 1], [0, (adoptionData.after / maxDays) * barMaxWidth])}
              height={compact ? 18 : 22}
              rx={compact ? 9 : 11}
              ry={compact ? 9 : 11}
              fill={theme.colors.charts.purple}
            />
            <text
              x={60 + (adoptionData.after / maxDays) * barMaxWidth + 10}
              y={barChartHeight - 14}
              fontFamily={theme.chart.axisLabel.fontFamily}
              fontSize={compact ? 11 : 13}
              fontWeight={600}
              fill={theme.colors.text.secondary}
              opacity={interpolate(barProgress, [0.5, 1], [0, 1])}
            >
              {adoptionData.after.toFixed(1)} days
            </text>
          </g>
        </svg>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          backgroundColor: theme.colors.surface.outline,
          margin: "12px 0",
        }}
      />

      {/* Clarity Trend Line Chart */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontFamily: theme.chart.legend.fontFamily,
              fontSize: compact ? theme.chart.compact.legend.fontSize : 11,
              fontWeight: 600,
              color: theme.chart.legend.color,
            }}
          >
            Remote work clarity (survey driver)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: theme.chart.legend.itemGap }}>
            <div
              style={{
                width: theme.chart.legend.indicator.pill.width,
                height: theme.chart.legend.indicator.pill.height,
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
              Clarity score
            </span>
          </div>
        </div>

        <svg width={chartWidth} height={lineChartHeight}>
          {/* Policy change vertical marker */}
          <line
            x1={policyChangeX}
            y1={linePadding.top}
            x2={policyChangeX}
            y2={lineChartHeight - linePadding.bottom}
            stroke={theme.colors.brand.primary}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.6}
          />
          <text
            x={policyChangeX}
            y={linePadding.top - 2}
            textAnchor="middle"
            fontFamily={theme.chart.axisLabel.fontFamily}
            fontSize={9}
            fill={theme.colors.brand.primary}
          >
            Policy change
          </text>

          {/* Clarity line */}
          <path
            d={clarityPath}
            fill="none"
            stroke={theme.colors.charts.teal}
            strokeWidth={theme.chart.line.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={interpolate(lineProgress, [0, 1], [pathLength, 0])}
          />

          {/* X-axis labels */}
          {["Apr", "Jul", "Oct", "Jan"].map((label) => {
            const idx = clarityData.findIndex((d) => d.month === label);
            if (idx < 0) return null;
            return (
              <text
                key={label}
                x={xScale(idx)}
                y={lineChartHeight - 5}
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
    </div>
  );
};
