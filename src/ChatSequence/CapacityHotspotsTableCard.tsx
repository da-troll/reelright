import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Top 5 teams with capacity stress indicators
const hotspotsData = [
  { team: "Engineering - Platform", workloadDelta: -18, sickLeaveDelta: +12, vacationBacklog: 42, responseRate: 89 },
  { team: "Customer Success", workloadDelta: -15, sickLeaveDelta: +9, vacationBacklog: 38, responseRate: 92 },
  { team: "Product - Growth", workloadDelta: -14, sickLeaveDelta: +8, vacationBacklog: 35, responseRate: 85 },
  { team: "Engineering - Mobile", workloadDelta: -12, sickLeaveDelta: +7, vacationBacklog: 31, responseRate: 91 },
  { team: "Design", workloadDelta: -10, sickLeaveDelta: +5, vacationBacklog: 28, responseRate: 94 },
];

interface CapacityHotspotsTableCardProps {
  title?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

// Delta pill component
const DeltaPill: React.FC<{ value: number; suffix?: string; inverse?: boolean }> = ({
  value,
  suffix = "%",
  inverse = false // When true, negative is good (like workload dropping)
}) => {
  const isNegative = value < 0;
  const isGood = inverse ? isNegative : !isNegative;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        backgroundColor: isGood
          ? "rgba(128, 228, 166, 0.2)" // green tint
          : "rgba(242, 178, 153, 0.3)", // orange tint
        color: isGood
          ? theme.colors.charts.teal
          : theme.colors.status.onError,
      }}
    >
      {value > 0 ? "+" : ""}{value}{suffix}
    </span>
  );
};

export const CapacityHotspotsTableCard: React.FC<CapacityHotspotsTableCardProps> = ({
  title = "Capacity hotspots - Top 5 teams",
  hideTitle = false,
  compact = false,
  embedded = false,
  layout = "desktop",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isMobile = layout === "mobile";

  const noCardStyle = compact || embedded;

  // Staggered row entrance
  const getRowOpacity = (rowIndex: number) => {
    const rowProgress = spring({
      frame: Math.max(0, frame - rowIndex * 4),
      fps,
      config: { stiffness: 120, damping: 20 },
    });
    return rowProgress;
  };

  const headerStyle: React.CSSProperties = {
    fontFamily: theme.chart.legend.fontFamily,
    fontSize: compact || isMobile ? 9 : 11,
    fontWeight: 600,
    color: theme.chart.legend.color,
    textAlign: "left",
    padding: isMobile ? "6px 8px" : "8px 12px",
    borderBottom: `1px solid ${theme.colors.surface.outline}`,
  };

  const cellStyle: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: compact || isMobile ? 10 : 13,
    fontWeight: 400,
    color: theme.colors.text.default,
    padding: isMobile ? "6px 8px" : "10px 12px",
    borderBottom: `1px solid ${theme.colors.surface.outline}`,
  };

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
            fontSize: compact
              ? theme.chart.compact.title.fontSize
              : isMobile
                ? theme.chart.mobile.title.fontSize
                : theme.chart.title.fontSize,
            fontWeight: theme.chart.title.fontWeight,
            color: theme.chart.title.color,
            margin: 0,
            marginBottom: compact
              ? theme.chart.compact.title.marginBottom
              : isMobile
                ? theme.chart.mobile.title.marginBottom
                : theme.chart.title.marginBottom,
          }}
        >
          {title}
        </h3>
      )}

      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderSpacing: 0,
        }}
      >
        <thead>
          <tr>
            <th style={headerStyle}>Team</th>
            <th style={{ ...headerStyle, textAlign: "center" }}>Workload Δ (3mo)</th>
            <th style={{ ...headerStyle, textAlign: "center" }}>Sick leave Δ (3mo)</th>
            <th style={{ ...headerStyle, textAlign: "center" }}>Vacation backlog</th>
            <th style={{ ...headerStyle, textAlign: "center" }}>Response rate</th>
          </tr>
        </thead>
        <tbody>
          {hotspotsData.map((row, i) => {
            const opacity = getRowOpacity(i);
            return (
              <tr
                key={row.team}
                style={{
                  opacity: interpolate(opacity, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(opacity, [0, 1], [8, 0])}px)`,
                }}
              >
                <td style={{ ...cellStyle, fontWeight: 500 }}>{row.team}</td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  <DeltaPill value={row.workloadDelta} inverse={false} />
                </td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  <DeltaPill value={row.sickLeaveDelta} suffix="%" inverse={false} />
                </td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  {row.vacationBacklog}%
                </td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  {row.responseRate}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
