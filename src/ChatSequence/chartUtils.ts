import { theme } from "../theme";

/**
 * Generate smooth SVG path from data points using Catmull-Rom to Bezier conversion.
 * This creates natural-looking curves that pass through all data points.
 *
 * @param points - Array of {x, y} coordinates
 * @param tension - Curve tension (0 = straight lines, 1 = very curved). Defaults to theme value.
 * @returns SVG path string
 */
export const generateSmoothPath = (
  points: { x: number; y: number }[],
  tension: number = theme.chart.line.tension
): string => {
  if (points.length < 2) return "";

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Bezier control points
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
};

/**
 * Helper to mix two hex colors by a given ratio.
 *
 * @param hex1 - Starting hex color (e.g., "#ff0000")
 * @param hex2 - Ending hex color (e.g., "#0000ff")
 * @param t - Mix ratio (0 = hex1, 1 = hex2)
 * @returns Mixed hex color string
 */
export const mixHexColors = (hex1: string, hex2: string, t: number): string => {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};
