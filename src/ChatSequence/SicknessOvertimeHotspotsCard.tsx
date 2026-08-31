import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Sample data sorted by shortTermEpisodesPer100 (descending)
const hotspotsData = [
  {
    team: "Customer Support",
    dept: "Ops",
    shortTermEpisodesPer100: 7.2,
    overtimePrevWeekAvgHours: 12.4,
    remoteDaysAvg: 0.8,
    scheduleRigidityIndex: 84,
    clusterShareAfterHighOvertime: 72,
  },
  {
    team: "Order Operations",
    dept: "Ops",
    shortTermEpisodesPer100: 6.6,
    overtimePrevWeekAvgHours: 11.1,
    remoteDaysAvg: 1.0,
    scheduleRigidityIndex: 79,
    clusterShareAfterHighOvertime: 68,
  },
  {
    team: "Payroll Services",
    dept: "Ops",
    shortTermEpisodesPer100: 6.0,
    overtimePrevWeekAvgHours: 10.3,
    remoteDaysAvg: 1.2,
    scheduleRigidityIndex: 76,
    clusterShareAfterHighOvertime: 64,
  },
  {
    team: "Sales Enablement",
    dept: "Revenue",
    shortTermEpisodesPer100: 5.2,
    overtimePrevWeekAvgHours: 9.4,
    remoteDaysAvg: 2.6,
    scheduleRigidityIndex: 58,
    clusterShareAfterHighOvertime: 41,
  },
  {
    team: "Platform",
    dept: "Product",
    shortTermEpisodesPer100: 4.8,
    overtimePrevWeekAvgHours: 8.9,
    remoteDaysAvg: 2.8,
    scheduleRigidityIndex: 52,
    clusterShareAfterHighOvertime: 38,
  },
];

// Get rigidity label from index
const getRigidityLabel = (index: number): { label: string; color: string } => {
  if (index >= 70) return { label: "High", color: theme.colors.charts.orange };
  if (index >= 50) return { label: "Med", color: theme.colors.charts.teal };
  return { label: "Low", color: theme.colors.charts.green };
};

// Get cluster share color (higher = more concerning)
const getClusterColor = (share: number): string => {
  if (share >= 60) return theme.colors.charts.orange;
  if (share >= 40) return theme.colors.charts.teal;
  return theme.colors.charts.green;
};

interface SicknessOvertimeHotspotsCardProps {
  title?: string;
  subtitle?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const SicknessOvertimeHotspotsCard: React.FC<SicknessOvertimeHotspotsCardProps> = ({
  title = "Top teams by short-term sickness",
  subtitle = "Sorted by episodes per 100 employees",
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

  // Max value for bar scaling
  const maxSickRate = 8;

  // Row animation
  const getRowProgress = (rowIndex: number): number => {
    const rowDelay = rowIndex * 5;
    return spring({
      frame: Math.max(0, frame - rowDelay),
      fps,
      config: theme.chart.animation.spring,
    });
  };

  // Badge animation (appears after row)
  const getBadgeOpacity = (rowIndex: number, badgeIndex: number): number => {
    const baseDelay = rowIndex * 5 + 15;
    const badgeDelay = baseDelay + badgeIndex * 3;
    return interpolate(
      frame,
      [badgeDelay, badgeDelay + 10],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  };

  const fontSize = compact || isMobile ? 10 : 12;
  const rowHeight = compact || isMobile ? 32 : 40;

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
      {/* Header */}
      {!hideTitle && (
        <div
          style={{
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

      {/* Table */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Header row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 100px 70px 60px 80px",
            gap: 8,
            padding: "8px 0",
            borderBottom: `1px solid ${theme.colors.surface.outline}`,
          }}
        >
          <span style={{ fontSize, fontWeight: 500, color: theme.chart.axisLabel.color }}>Team</span>
          <span style={{ fontSize, fontWeight: 500, color: theme.chart.axisLabel.color }}>Sick/100</span>
          <span style={{ fontSize, fontWeight: 500, color: theme.chart.axisLabel.color }}>OT hrs</span>
          <span style={{ fontSize, fontWeight: 500, color: theme.chart.axisLabel.color }}>Remote</span>
          <span style={{ fontSize, fontWeight: 500, color: theme.chart.axisLabel.color }}>Post-OT%</span>
        </div>

        {/* Data rows */}
        {hotspotsData.map((row, rowIndex) => {
          const rowProgress = getRowProgress(rowIndex);
          const rigidity = getRigidityLabel(row.scheduleRigidityIndex);
          const clusterColor = getClusterColor(row.clusterShareAfterHighOvertime);
          const barWidth = (row.shortTermEpisodesPer100 / maxSickRate) * 100;

          return (
            <div
              key={row.team}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 70px 60px 80px",
                gap: 8,
                alignItems: "center",
                height: rowHeight,
                opacity: rowProgress,
                transform: `translateY(${interpolate(rowProgress, [0, 1], [10, 0])}px)`,
                borderBottom: rowIndex < hotspotsData.length - 1 ? `1px solid ${theme.colors.surface.outline}40` : "none",
              }}
            >
              {/* Team name + dept badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize, fontWeight: 500, color: theme.colors.text.default }}>
                  {row.team}
                </span>
                <span
                  style={{
                    fontSize: fontSize - 2,
                    color: theme.chart.legend.color,
                    backgroundColor: theme.colors.surface.variant,
                    padding: "2px 6px",
                    borderRadius: 4,
                    opacity: getBadgeOpacity(rowIndex, 0),
                  }}
                >
                  {row.dept}
                </span>
              </div>

              {/* Sick rate with bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 60,
                    height: 8,
                    backgroundColor: theme.colors.surface.variant,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${barWidth * rowProgress}%`,
                      height: "100%",
                      backgroundColor: row.shortTermEpisodesPer100 >= 6 ? theme.colors.charts.orange : theme.colors.charts.teal,
                      borderRadius: 4,
                    }}
                  />
                </div>
                <span style={{ fontSize, fontWeight: 600, color: theme.colors.text.default, minWidth: 28 }}>
                  {row.shortTermEpisodesPer100.toFixed(1)}
                </span>
              </div>

              {/* Overtime hours */}
              <span
                style={{
                  fontSize,
                  fontWeight: 500,
                  color: row.overtimePrevWeekAvgHours >= 10 ? theme.colors.charts.orange : theme.colors.text.default,
                  opacity: getBadgeOpacity(rowIndex, 1),
                }}
              >
                {row.overtimePrevWeekAvgHours.toFixed(1)}h
              </span>

              {/* Remote days badge */}
              <span
                style={{
                  fontSize: fontSize - 1,
                  fontWeight: 500,
                  color: rigidity.color,
                  backgroundColor: `${rigidity.color}18`,
                  padding: "3px 8px",
                  borderRadius: 4,
                  textAlign: "center",
                  opacity: getBadgeOpacity(rowIndex, 2),
                }}
              >
                {row.remoteDaysAvg.toFixed(1)}d
              </span>

              {/* Cluster share badge */}
              <span
                style={{
                  fontSize: fontSize - 1,
                  fontWeight: 600,
                  color: clusterColor,
                  backgroundColor: `${clusterColor}18`,
                  padding: "3px 8px",
                  borderRadius: 4,
                  textAlign: "center",
                  opacity: getBadgeOpacity(rowIndex, 3),
                }}
              >
                {row.clusterShareAfterHighOvertime}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
