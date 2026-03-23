// 16 preset renk — Etiket Yönetimi'nde seçilebilir
export const TAG_COLOR_PALETTE = [
  "#D4A017", // gold
  "#3B82F6", // blue
  "#10B981", // emerald
  "#EF4444", // red
  "#8B5CF6", // violet
  "#F97316", // orange
  "#06B6D4", // cyan
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F59E0B", // amber
  "#6366F1", // indigo
  "#84CC16", // lime
  "#E11D48", // rose
  "#0EA5E9", // sky
  "#A855F7", // purple
  "#78716C", // stone
];

export const DEFAULT_TAG_COLOR = "#D4A017";

/**
 * Returns white or dark text based on background luminance
 */
export function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Relative luminance (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1e293b" : "#ffffff";
}
