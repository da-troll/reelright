import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Action plan data
const backupCandidates = [
  { skill: "AWS Architect", backupType: "Senior Eng (Platform)", action: "Cross-train" },
  { skill: "SOC 2 Lead", backupType: "Security Engineer", action: "Certify" },
  { skill: "Kubernetes Admin", backupType: "DevOps Engineer", action: "Shadow" },
];

const planColumns = [
  {
    title: "This week",
    items: [
      "Brief backup candidates on critical tasks",
      "Set up shadowing schedule",
    ],
  },
  {
    title: "Next 2–4 weeks",
    items: [
      "Complete cross-training for AWS",
      "Start SOC 2 certification process",
      "Document runbooks for critical ops",
    ],
  },
  {
    title: "Next quarter",
    items: [
      "Full certification for 2nd SOC 2 lead",
      "Hire additional Kubernetes admin",
      "Build redundancy into on-call rotation",
    ],
  },
];

interface SkillsMitigationPlanCardProps {
  title?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const SkillsMitigationPlanCard: React.FC<SkillsMitigationPlanCardProps> = ({
  title = "Backup candidates",
  hideTitle = false,
  compact = false,
  embedded = false,
  layout = "desktop",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isMobile = layout === "mobile";

  const noCardStyle = compact || embedded;

  // Card entrance for first card
  const card1Progress = spring({
    frame,
    fps,
    config: { stiffness: 100, damping: 18 },
  });

  // Card entrance for second card (slightly delayed)
  const card2Progress = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { stiffness: 100, damping: 18 },
  });

  // Staggered column entrance
  const getColumnProgress = (colIndex: number) => {
    return spring({
      frame: Math.max(0, frame - 16 - colIndex * 6),
      fps,
      config: { stiffness: 80, damping: 16 },
    });
  };

  const headerStyle: React.CSSProperties = {
    fontFamily: theme.chart.legend.fontFamily,
    fontSize: compact || isMobile ? 9 : 10,
    fontWeight: 600,
    color: theme.chart.legend.color,
    textAlign: "left",
    padding: isMobile ? "4px 6px" : "5px 8px",
    borderBottom: `1px solid ${theme.colors.surface.outline}`,
  };

  const cellStyle: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: compact || isMobile ? 10 : 11,
    fontWeight: 400,
    color: theme.colors.text.default,
    padding: isMobile ? "5px 6px" : "6px 8px",
    borderBottom: `1px solid ${theme.colors.surface.outline}`,
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: compact ? 10 : 16, // Gap between cards shows message bubble bg
        fontFamily: theme.typography.fontFamily.body,
      }}
    >
      {/* Card 1: Backup candidates table */}
      <div
        style={{
          backgroundColor: noCardStyle ? "transparent" : theme.colors.surface.main,
          borderRadius: noCardStyle ? 0 : theme.layout.borderRadius.card,
          boxShadow: noCardStyle ? "none" : theme.layout.shadow.card,
          padding: noCardStyle ? 0 : "24px",
          opacity: interpolate(card1Progress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(card1Progress, [0, 1], [10, 0])}px)`,
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
              <th style={headerStyle}>Skill</th>
              <th style={headerStyle}>Backup candidate type</th>
              <th style={headerStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {backupCandidates.map((row) => (
              <tr key={row.skill}>
                <td style={{ ...cellStyle, fontWeight: 500 }}>{row.skill}</td>
                <td style={cellStyle}>{row.backupType}</td>
                <td style={cellStyle}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 500,
                      backgroundColor: theme.colors.brand.primaryLight,
                      color: theme.colors.brand.primary,
                    }}
                  >
                    {row.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card 2: 30-60-90 day plan */}
      <div
        style={{
          backgroundColor: noCardStyle ? "transparent" : theme.colors.surface.main,
          borderRadius: noCardStyle ? 0 : theme.layout.borderRadius.card,
          boxShadow: noCardStyle ? "none" : theme.layout.shadow.card,
          padding: noCardStyle ? 0 : "24px",
          opacity: interpolate(card2Progress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(card2Progress, [0, 1], [10, 0])}px)`,
        }}
      >
        {/* Plan title */}
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
          30–60–90 day plan
        </h3>

        {/* 3-column plan */}
        <div
          style={{
            display: "flex",
            gap: compact ? 12 : 20,
          }}
        >
          {planColumns.map((col, colIdx) => {
            const colProgress = getColumnProgress(colIdx);

            return (
              <div
                key={col.title}
                style={{
                  flex: 1,
                  opacity: interpolate(colProgress, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(colProgress, [0, 1], [8, 0])}px)`,
                }}
              >
                {/* Column header */}
                <div
                  style={{
                    fontFamily: theme.chart.legend.fontFamily,
                    fontSize: compact ? 11 : 12,
                    fontWeight: 600,
                    color: theme.colors.text.default,
                    marginBottom: 8,
                    paddingBottom: 6,
                    borderBottom: `2px solid ${theme.colors.brand.primary}`,
                  }}
                >
                  {col.title}
                </div>

                {/* Column items */}
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 16,
                  }}
                >
                  {col.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      style={{
                        fontFamily: theme.typography.fontFamily.body,
                        fontSize: compact ? 11 : 12,
                        color: theme.colors.text.secondary,
                        marginBottom: 6,
                        lineHeight: 1.4,
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
