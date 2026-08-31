import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Skill coverage data sorted by lowest coverage first
const skillsData = [
  { skill: "AWS Certified Solutions Architect", coverage: 1 },
  { skill: "SOC 2 Compliance Lead", coverage: 1 },
  { skill: "Kubernetes Admin", coverage: 2 },
  { skill: "Data Privacy Officer", coverage: 2 },
  { skill: "Security Incident Response", coverage: 3 },
  { skill: "Senior React/TypeScript", coverage: 5 },
  { skill: "Python ML Engineer", coverage: 4 },
  { skill: "Product Analytics", coverage: 6 },
];

interface SkillsCoverageRiskCardProps {
  title?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const SkillsCoverageRiskCard: React.FC<SkillsCoverageRiskCardProps> = ({
  title = "Critical skill coverage",
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
  const padding = { top: 10, right: 40, bottom: 30, left: 180 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxCoverage = Math.max(...skillsData.map((d) => d.coverage));
  const barHeight = innerHeight / skillsData.length - 4;

  // Risk zone background (coverage 1-2)
  const riskZoneWidth = (2 / maxCoverage) * innerWidth;

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

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: theme.chart.legend.horizontalGap,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: theme.chart.legend.itemGap }}>
          <div
            style={{
              width: theme.chart.legend.indicator.square.width,
              height: theme.chart.legend.indicator.square.height,
              borderRadius: theme.chart.legend.indicator.square.borderRadius,
              backgroundColor: theme.colors.charts.pink,
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
            Coverage (# employees)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: theme.chart.legend.itemGap }}>
          <div
            style={{
              width: theme.chart.legend.indicator.square.width,
              height: theme.chart.legend.indicator.square.height,
              borderRadius: theme.chart.legend.indicator.square.borderRadius,
              backgroundColor: "rgba(255, 158, 208, 0.15)",
              border: `1px dashed ${theme.colors.charts.pink}`,
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
            Risk zone (1-2 coverage)
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <svg width={chartWidth} height={chartHeight}>
        {/* Risk zone background */}
        <rect
          x={padding.left}
          y={padding.top}
          width={riskZoneWidth}
          height={innerHeight}
          fill={theme.colors.charts.pink}
          opacity={0.1}
        />
        <line
          x1={padding.left + riskZoneWidth}
          y1={padding.top}
          x2={padding.left + riskZoneWidth}
          y2={chartHeight - padding.bottom}
          stroke={theme.colors.charts.pink}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.4}
        />

        {/* Bars */}
        {skillsData.map((d, i) => {
          const barProgress = spring({
            frame: Math.max(0, frame - i * 3),
            fps,
            config: { stiffness: 120, damping: 18, mass: 0.9 },
          });

          const targetWidth = (d.coverage / maxCoverage) * innerWidth;
          const animatedWidth = interpolate(barProgress, [0, 1], [0, targetWidth]);
          const y = padding.top + i * (barHeight + 4);

          // Highlight single-coverage skills
          const isHighRisk = d.coverage <= 2;

          return (
            <g key={d.skill}>
              {/* Skill label */}
              <text
                x={padding.left - 8}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontFamily={theme.chart.axisLabel.fontFamily}
                fontSize={compact ? 10 : 11}
                fill={isHighRisk ? theme.colors.charts.pink : theme.chart.axisLabel.color}
                fontWeight={isHighRisk ? 500 : 400}
              >
                {d.skill}
              </text>

              {/* Bar */}
              <rect
                x={padding.left}
                y={y}
                width={animatedWidth}
                height={barHeight}
                rx={barHeight / 2}
                ry={barHeight / 2}
                fill={isHighRisk ? theme.colors.charts.pink : theme.colors.charts.purple}
                opacity={isHighRisk ? 1 : 0.7}
              />

              {/* Value label */}
              <text
                x={padding.left + animatedWidth + 8}
                y={y + barHeight / 2 + 4}
                fontFamily={theme.chart.axisLabel.fontFamily}
                fontSize={compact ? 10 : 11}
                fontWeight={isHighRisk ? 600 : 500}
                fill={isHighRisk ? theme.colors.charts.pink : theme.colors.text.secondary}
                opacity={interpolate(barProgress, [0.5, 1], [0, 1])}
              >
                {d.coverage}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {[0, 2, 4, 6].map((val) => (
          <text
            key={val}
            x={padding.left + (val / maxCoverage) * innerWidth}
            y={chartHeight - 8}
            textAnchor="middle"
            fontFamily={theme.chart.axisLabel.fontFamily}
            fontSize={compact ? theme.chart.compact.axisLabel.fontSize : theme.chart.axisLabel.fontSize}
            fill={theme.chart.axisLabel.color}
          >
            {val}
          </text>
        ))}
      </svg>
    </div>
  );
};
