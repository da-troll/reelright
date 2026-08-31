import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Top 5 managers with capacity stress indicators
const outliersData = [
  { manager: "Manager A", team: "Engineering - Platform", spanOfControl: 12, overdueApprovals: 24, supportDelta: -18, responseRate: 89 },
  { manager: "Manager B", team: "Customer Success", spanOfControl: 15, overdueApprovals: 18, supportDelta: -15, responseRate: 92 },
  { manager: "Manager C", team: "Product - Growth", spanOfControl: 9, overdueApprovals: 15, supportDelta: -12, responseRate: 85 },
  { manager: "Manager D", team: "Engineering - Mobile", spanOfControl: 11, overdueApprovals: 12, supportDelta: -10, responseRate: 91 },
  { manager: "Manager E", team: "Design", spanOfControl: 8, overdueApprovals: 9, supportDelta: -8, responseRate: 94 },
];

interface ManagerOutliersTableCardProps {
  title?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

// Delta pill component
const DeltaPill: React.FC<{ value: number; suffix?: string }> = ({
  value,
  suffix = "%",
}) => {
  const isNegative = value < 0;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        backgroundColor: isNegative
          ? "rgba(242, 178, 153, 0.3)" // orange tint for negative
          : "rgba(128, 228, 166, 0.2)", // green tint for positive
        color: isNegative
          ? theme.colors.status.onError
          : theme.colors.charts.teal,
      }}
    >
      {value > 0 ? "+" : ""}{value}{suffix}
    </span>
  );
};

export const ManagerOutliersTableCard: React.FC<ManagerOutliersTableCardProps> = ({
  title = "Outliers to act on",
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
            <th style={headerStyle}>Manager</th>
            <th style={headerStyle}>Team</th>
            <th style={{ ...headerStyle, textAlign: "center" }}>Span</th>
            <th style={{ ...headerStyle, textAlign: "center" }}>Overdue</th>
            <th style={{ ...headerStyle, textAlign: "center" }}>Support Δ (3mo)</th>
            <th style={{ ...headerStyle, textAlign: "center", fontSize: compact ? 9 : 10, opacity: 0.8 }}>Resp.</th>
          </tr>
        </thead>
        <tbody>
          {outliersData.map((row, i) => {
            const opacity = getRowOpacity(i);
            return (
              <tr
                key={row.manager}
                style={{
                  opacity: interpolate(opacity, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(opacity, [0, 1], [8, 0])}px)`,
                }}
              >
                <td style={{ ...cellStyle, fontWeight: 500 }}>{row.manager}</td>
                <td style={cellStyle}>{row.team}</td>
                <td style={{ ...cellStyle, textAlign: "center" }}>{row.spanOfControl}</td>
                <td style={{ ...cellStyle, textAlign: "center" }}>{row.overdueApprovals}</td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  <DeltaPill value={row.supportDelta} />
                </td>
                <td style={{ ...cellStyle, textAlign: "center", opacity: 0.7 }}>
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
