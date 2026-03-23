/** Returns a color based on progress percentage — matches AksiyonForm gradient palette */
export function progressColor(pct: number): string {
  if (pct === 0) return "#94a3b8";    // slate-400 — başlanmamış (gri)
  if (pct <= 25) return "#ef4444";    // red-500 — kritik düşük
  if (pct <= 50) return "#f59e0b";    // amber-500 — düşük
  if (pct <= 75) return "#eab308";    // yellow-500 — orta
  if (pct < 100) return "#10b981";    // emerald-500 — iyi
  return "#10b981";                    // emerald-500 — tamamlandı
}

/** Convert hex color to HSL string for HeroUI CSS variables (e.g. "30 90% 44%") */
export function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
