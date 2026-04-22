// 32 preset renk — Etiket Yönetimi'nde seçilebilir (8 sütunlu grid, 4 satır)
// Satır 1-2: canlı / doymuş (ana etiket renkleri)
// Satır 3: derin / koyu tonlar + nötr griler (ciddi/kurumsal etiketler için)
// Satır 4: taze ana renkler + yumuşak pastel aksanlar (vurgu/sınıflandırma için)
export const TAG_COLOR_PALETTE = [
  // ── Satır 1: canlı ana renkler ──
  "#D4A017", // gold
  "#3B82F6", // blue
  "#10B981", // emerald
  "#EF4444", // red
  "#8B5CF6", // violet
  "#F97316", // orange
  "#06B6D4", // cyan
  "#EC4899", // pink
  // ── Satır 2: canlı destek renkler ──
  "#14B8A6", // teal
  "#F59E0B", // amber
  "#6366F1", // indigo
  "#84CC16", // lime
  "#E11D48", // rose
  "#0EA5E9", // sky
  "#A855F7", // purple
  "#78716C", // stone
  // ── Satır 3: derin tonlar + nötrler ──
  "#1E3A8A", // navy
  "#065F46", // forest
  "#7F1D1D", // wine
  "#4C1D95", // royal
  "#9A3412", // rust
  "#155E75", // deep teal
  "#64748B", // slate
  "#6B7280", // gray
  // ── Satır 4: taze ana renkler + pastel aksanlar ──
  "#EAB308", // yellow
  "#22C55E", // green
  "#FB7185", // coral
  "#34D399", // mint
  "#FBBF24", // mustard
  "#A78BFA", // lavender
  "#FDBA74", // peach
  "#2DD4BF", // turquoise
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
