import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Skills at risk with gap periods in next 30 days
const gapData = [
  {
    skill: "AWS Solutions Architect",
    coverage: 1,
    gapDays: 5,
    gapWeeks: [2], // Week 2 has zero coverage
  },
  {
    skill: "SOC 2 Compliance Lead",
    coverage: 1,
    gapDays: 8,
    gapWeeks: [3, 4], // Weeks 3-4 have zero coverage
  },
  {
    skill: "Kubernetes Admin",
    coverage: 2,
    gapDays: 3,
    gapWeeks: [1], // Week 1 has zero coverage (both on leave same time)
  },
];

interface SkillsCoverageGapNext30CardProps {
  title?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const SkillsCoverageGapNext30Card: React.FC<SkillsCoverageGapNext30CardProps> = ({
  title = "Coverage gaps - Next 30 days",
  hideTitle = false,
  compact = false,
  embedded = false,
  layout = "desktop",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isMobile = layout === "mobile";

  const noCardStyle = compact || embedded;

  // Animation
  const tableProgress = spring({
    frame,
    fps,
    config: { stiffness: 100, damping: 18 },
  });

  const stripProgress = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { stiffness: 80, damping: 16 },
  });

  const headerStyle: React.CSSProperties = {
    fontFamily: theme.chart.legend.fontFamily,
    fontSize: compact || isMobile ? 9 : 11,
    fontWeight: 600,
    color: theme.chart.legend.color,
    textAlign: "left",
    padding: isMobile ? "4px 6px" : "6px 10px",
    borderBottom: `1px solid ${theme.colors.surface.outline}`,
  };

  const cellStyle: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: compact || isMobile ? 9 : 12,
    fontWeight: 400,
    color: theme.colors.text.default,
    padding: isMobile ? "6px 6px" : "8px 10px",
    borderBottom: `1px solid ${theme.colors.surface.outline}`,
  };

  // Gap strip dimensions
  const stripWidth = compact ? 280 : isMobile ? 200 : 340;
  const stripHeight = compact ? 16 : 20;
  const weekWidth = stripWidth / 4;

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

      {/* Mini table */}
      <div style={{ opacity: interpolate(tableProgress, [0, 1], [0, 1]) }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            borderSpacing: 0,
            marginBottom: 16,
          }}
        >
          <thead>
            <tr>
              <th style={headerStyle}>Skill</th>
              <th style={{ ...headerStyle, textAlign: "center" }}>Coverage</th>
              <th style={{ ...headerStyle, textAlign: "center" }}>Gap days (next 30)</th>
            </tr>
          </thead>
          <tbody>
            {gapData.map((row) => (
              <tr key={row.skill}>
                <td style={{ ...cellStyle, fontWeight: 500 }}>{row.skill}</td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      backgroundColor: row.coverage === 1
                        ? "rgba(255, 158, 208, 0.2)"
                        : "rgba(242, 178, 153, 0.2)",
                      color: row.coverage === 1
                        ? theme.colors.charts.pink
                        : theme.colors.charts.orange,
                    }}
                  >
                    {row.coverage}
                  </span>
                </td>
                <td style={{ ...cellStyle, textAlign: "center", fontWeight: 600, color: theme.colors.charts.pink }}>
                  {row.gapDays} days
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gap strip visualization */}
      <div
        style={{
          opacity: interpolate(stripProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(stripProgress, [0, 1], [10, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: theme.chart.legend.fontFamily,
            fontSize: compact ? theme.chart.compact.legend.fontSize : 11,
            fontWeight: 600,
            color: theme.chart.legend.color,
            marginBottom: 10,
          }}
        >
          Coverage timeline (zero = gap)
        </div>

        {gapData.map((row, idx) => (
          <div
            key={row.skill}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            {/* Skill label */}
            <div
              style={{
                width: compact ? 100 : 130,
                fontFamily: theme.chart.axisLabel.fontFamily,
                fontSize: compact ? 10 : 11,
                color: theme.chart.axisLabel.color,
                flexShrink: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.skill.split(" ").slice(0, 2).join(" ")}
            </div>

            {/* Gap strip */}
            <svg width={stripWidth} height={stripHeight}>
              {/* Background track */}
              <rect
                x={0}
                y={0}
                width={stripWidth}
                height={stripHeight}
                rx={stripHeight / 2}
                fill={theme.colors.charts.green}
                opacity={0.3}
              />

              {/* Gap blocks */}
              {row.gapWeeks.map((week) => {
                const gapProgress = spring({
                  frame: Math.max(0, frame - 20 - idx * 5),
                  fps,
                  config: { stiffness: 100, damping: 14 },
                });

                return (
                  <rect
                    key={week}
                    x={(week - 1) * weekWidth}
                    y={0}
                    width={weekWidth}
                    height={stripHeight}
                    rx={stripHeight / 2 === (week - 1) * weekWidth ? stripHeight / 2 : 0}
                    fill={theme.colors.charts.pink}
                    opacity={interpolate(gapProgress, [0, 1], [0, 0.8])}
                  />
                );
              })}

              {/* Week tick marks */}
              {[1, 2, 3].map((tick) => (
                <line
                  key={tick}
                  x1={tick * weekWidth}
                  y1={0}
                  x2={tick * weekWidth}
                  y2={stripHeight}
                  stroke={theme.colors.surface.outline}
                  strokeWidth={1}
                  opacity={0.5}
                />
              ))}
            </svg>
          </div>
        ))}

        {/* Week labels */}
        <div
          style={{
            display: "flex",
            marginLeft: compact ? 100 : 130,
          }}
        >
          {["Week 1", "Week 2", "Week 3", "Week 4"].map((label) => (
            <div
              key={label}
              style={{
                width: weekWidth,
                fontFamily: theme.chart.axisLabel.fontFamily,
                fontSize: compact ? 9 : 10,
                color: theme.chart.axisLabel.color,
                textAlign: "center",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
