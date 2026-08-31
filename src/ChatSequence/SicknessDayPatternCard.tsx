import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { mixHexColors } from "./chartUtils";

// Heatmap data: rows = overtime quartile, columns = weekday
// Pattern shows HIGH overtime tiers have elevated sick rates across ALL weekdays (burnout signal)
// NOT concentrated on Mon/Fri (which would indicate abuse)
const heatmapData = [
  // Low overtime - baseline rates, evenly distributed
  { segment: "Overtime Q1 (low)", weekday: "Mon", shortTermEpisodesPer100: 2.1, deltaVsCompanyAvg: -1.9 },
  { segment: "Overtime Q1 (low)", weekday: "Tue", shortTermEpisodesPer100: 2.0, deltaVsCompanyAvg: -2.0 },
  { segment: "Overtime Q1 (low)", weekday: "Wed", shortTermEpisodesPer100: 2.2, deltaVsCompanyAvg: -1.8 },
  { segment: "Overtime Q1 (low)", weekday: "Thu", shortTermEpisodesPer100: 2.0, deltaVsCompanyAvg: -2.0 },
  { segment: "Overtime Q1 (low)", weekday: "Fri", shortTermEpisodesPer100: 2.1, deltaVsCompanyAvg: -1.9 },
  // Medium-low overtime
  { segment: "Overtime Q2", weekday: "Mon", shortTermEpisodesPer100: 3.2, deltaVsCompanyAvg: -0.8 },
  { segment: "Overtime Q2", weekday: "Tue", shortTermEpisodesPer100: 3.4, deltaVsCompanyAvg: -0.6 },
  { segment: "Overtime Q2", weekday: "Wed", shortTermEpisodesPer100: 3.5, deltaVsCompanyAvg: -0.5 },
  { segment: "Overtime Q2", weekday: "Thu", shortTermEpisodesPer100: 3.3, deltaVsCompanyAvg: -0.7 },
  { segment: "Overtime Q2", weekday: "Fri", shortTermEpisodesPer100: 3.2, deltaVsCompanyAvg: -0.8 },
  // Medium-high overtime
  { segment: "Overtime Q3", weekday: "Mon", shortTermEpisodesPer100: 4.8, deltaVsCompanyAvg: 0.8 },
  { segment: "Overtime Q3", weekday: "Tue", shortTermEpisodesPer100: 5.0, deltaVsCompanyAvg: 1.0 },
  { segment: "Overtime Q3", weekday: "Wed", shortTermEpisodesPer100: 5.2, deltaVsCompanyAvg: 1.2 },
  { segment: "Overtime Q3", weekday: "Thu", shortTermEpisodesPer100: 4.9, deltaVsCompanyAvg: 0.9 },
  { segment: "Overtime Q3", weekday: "Fri", shortTermEpisodesPer100: 4.7, deltaVsCompanyAvg: 0.7 },
  // High overtime - elevated across ALL weekdays (burnout pattern, not abuse)
  { segment: "Overtime Q4 (high)", weekday: "Mon", shortTermEpisodesPer100: 6.8, deltaVsCompanyAvg: 2.8 },
  { segment: "Overtime Q4 (high)", weekday: "Tue", shortTermEpisodesPer100: 7.2, deltaVsCompanyAvg: 3.2 },
  { segment: "Overtime Q4 (high)", weekday: "Wed", shortTermEpisodesPer100: 7.5, deltaVsCompanyAvg: 3.5 },
  { segment: "Overtime Q4 (high)", weekday: "Thu", shortTermEpisodesPer100: 7.1, deltaVsCompanyAvg: 3.1 },
  { segment: "Overtime Q4 (high)", weekday: "Fri", shortTermEpisodesPer100: 6.9, deltaVsCompanyAvg: 2.9 },
];

const segments = ["Overtime Q1 (low)", "Overtime Q2", "Overtime Q3", "Overtime Q4 (high)"];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Color scale: low (green) -> high (orange/red)
const lowColor = theme.colors.charts.green;
const highColor = theme.colors.charts.orange;

interface SicknessDayPatternCardProps {
  title?: string;
  subtitle?: string;
  hideTitle?: boolean;
  compact?: boolean;
  embedded?: boolean;
  layout?: "desktop" | "mobile";
}

export const SicknessDayPatternCard: React.FC<SicknessDayPatternCardProps> = ({
  title = "Short-term sick leave by overtime level",
  subtitle = "Episodes per 100 employees, by weekday",
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

  // Get value for a cell
  const getValue = (segment: string, weekday: string): number => {
    const cell = heatmapData.find(d => d.segment === segment && d.weekday === weekday);
    return cell?.shortTermEpisodesPer100 ?? 0;
  };

  // Color scale (2.0 to 7.5 range)
  const minVal = 2.0;
  const maxVal = 7.5;
  const getColor = (val: number): string => {
    const t = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
    return mixHexColors(lowColor, highColor, t);
  };

  // Cell dimensions
  const cellWidth = compact || isMobile ? 44 : 56;
  const cellHeight = compact || isMobile ? 28 : 36;
  const cellGap = 3;
  const labelWidth = compact || isMobile ? 100 : 130;

  // Animation: cells fade in row by row
  const getRowOpacity = (rowIndex: number): number => {
    const rowDelay = rowIndex * 8;
    const progress = spring({
      frame: Math.max(0, frame - rowDelay),
      fps,
      config: theme.chart.animation.spring,
    });
    return progress;
  };

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
      {/* Header: Title + Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: compact
            ? theme.chart.compact.title.marginBottom
            : isMobile
              ? theme.chart.mobile.title.marginBottom
              : theme.chart.title.marginBottom,
        }}
      >
        {/* Title + Subtitle */}
        {!hideTitle && (
          <div>
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

        {/* Color scale legend */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: theme.chart.legend.fontFamily,
                fontSize: compact || isMobile ? theme.chart.mobile.legend.fontSize : theme.chart.legend.fontSize,
                color: theme.chart.legend.color,
              }}
            >
              Low
            </span>
            <div
              style={{
                width: 60,
                height: 12,
                borderRadius: 4,
                background: `linear-gradient(to right, ${lowColor}, ${highColor})`,
              }}
            />
            <span
              style={{
                fontFamily: theme.chart.legend.fontFamily,
                fontSize: compact || isMobile ? theme.chart.mobile.legend.fontSize : theme.chart.legend.fontSize,
                color: theme.chart.legend.color,
              }}
            >
              High
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div style={{ display: "flex", flexDirection: "column", gap: cellGap }}>
        {/* Header row with weekday labels */}
        <div style={{ display: "flex", gap: cellGap, marginLeft: labelWidth + cellGap }}>
          {weekdays.map(day => (
            <div
              key={day}
              style={{
                width: cellWidth,
                textAlign: "center",
                fontFamily: theme.chart.axisLabel.fontFamily,
                fontSize: compact || isMobile ? theme.chart.mobile.axisLabel.fontSize : theme.chart.axisLabel.fontSize,
                fontWeight: 500,
                color: theme.chart.axisLabel.color,
                paddingBottom: 4,
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {segments.map((segment, rowIndex) => {
          const rowOpacity = getRowOpacity(rowIndex);

          return (
            <div
              key={segment}
              style={{
                display: "flex",
                alignItems: "center",
                gap: cellGap,
                opacity: rowOpacity,
              }}
            >
              {/* Row label */}
              <div
                style={{
                  width: labelWidth,
                  fontFamily: theme.chart.axisLabel.fontFamily,
                  fontSize: compact || isMobile ? theme.chart.mobile.axisLabel.fontSize : theme.chart.axisLabel.fontSize,
                  color: theme.chart.axisLabel.color,
                  textAlign: "right",
                  paddingRight: 8,
                  whiteSpace: "nowrap",
                }}
              >
                {segment}
              </div>

              {/* Cells for each weekday */}
              {weekdays.map((day, colIndex) => {
                const value = getValue(segment, day);
                const cellColor = getColor(value);

                // Cell animation with column stagger
                const cellProgress = spring({
                  frame: Math.max(0, frame - rowIndex * 8 - colIndex * 2),
                  fps,
                  config: theme.chart.animation.spring,
                });

                return (
                  <div
                    key={day}
                    style={{
                      width: cellWidth,
                      height: cellHeight,
                      backgroundColor: cellColor,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `scale(${interpolate(cellProgress, [0, 1], [0.8, 1])})`,
                      opacity: cellProgress,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: theme.chart.axisLabel.fontFamily,
                        fontSize: compact || isMobile ? 10 : 12,
                        fontWeight: 600,
                        color: "#fff",
                      }}
                    >
                      {value.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
