import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Segment data showing policy impact variation
const segmentData = [
  { segment: "Engineering", adoptionDelta: +2.1, clarityDelta: +18, responseRate: 91 },
  { segment: "Product", adoptionDelta: +1.8, clarityDelta: +15, responseRate: 88 },
  { segment: "Design", adoptionDelta: +1.5, clarityDelta: +12, responseRate: 94 },
  { segment: "Marketing", adoptionDelta: +0.4, clarityDelta: +3, responseRate: 82 },
  { segment: "Sales", adoptionDelta: +0.2, clarityDelta: +1, responseRate: 78 },
];

interface PolicyImpactSegmentsCardProps {
  title?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

// Delta pill component with color coding
const DeltaPill: React.FC<{ value: number; suffix?: string }> = ({
  value,
  suffix = "",
}) => {
  // Determine if this is a meaningful change
  const isMeaningful = Math.abs(value) >= 1;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        backgroundColor: isMeaningful
          ? "rgba(128, 228, 166, 0.2)" // green tint for meaningful
          : "rgba(221, 219, 228, 0.4)", // neutral for flat
        color: isMeaningful
          ? theme.colors.charts.teal
          : theme.colors.text.secondary,
      }}
    >
      {value > 0 ? "+" : ""}{value.toFixed(1)}{suffix}
    </span>
  );
};

export const PolicyImpactSegmentsCard: React.FC<PolicyImpactSegmentsCardProps> = ({
  title = "Policy impact by segment",
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
            <th style={headerStyle}>Segment</th>
            <th style={{ ...headerStyle, textAlign: "center" }}>Adoption Δ (days)</th>
            <th style={{ ...headerStyle, textAlign: "center" }}>Clarity Δ (pts)</th>
            <th style={{ ...headerStyle, textAlign: "center" }}>Response rate</th>
          </tr>
        </thead>
        <tbody>
          {segmentData.map((row, i) => {
            const opacity = getRowOpacity(i);
            return (
              <tr
                key={row.segment}
                style={{
                  opacity: interpolate(opacity, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(opacity, [0, 1], [8, 0])}px)`,
                }}
              >
                <td style={{ ...cellStyle, fontWeight: 500 }}>{row.segment}</td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  <DeltaPill value={row.adoptionDelta} suffix=" days" />
                </td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  <DeltaPill value={row.clarityDelta} suffix=" pts" />
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
