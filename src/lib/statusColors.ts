import type { EntityStatus } from "@/types";

/**
 * Canonical project / aksiyon status color palette — single source of
 * truth so every widget (matrix, badges, charts) renders the same hue
 * for the same status. Hex values mirror the ones that were scattered
 * across SourceChart / DashboardPage / MasterDetailView.
 */
export const STATUS_HEX: Record<EntityStatus, string> = {
  "On Track":    "#10b981", // emerald  — Yolunda
  "At Risk":     "#f59e0b", // amber    — Riskte
  "High Risk":   "#ef4444", // red      — Yüksek Riskte
  "Achieved":    "#06b6d4", // cyan     — Tamamlandı
  "Not Started": "#94a3b8", // slate    — Başlanmadı
  "On Hold":     "#8b5cf6", // violet   — Askıda
  "Cancelled":   "#6b7280", // gray     — İptal
};

/**
 * Darker (~Tailwind 700) variant of each status color — used when we
 * already paint the background with the soft tint (e.g. heatmap cells)
 * and want the number/label to pop with a same-hue deeper shade instead
 * of the mid-weight color blending into the tinted background.
 */
export const STATUS_HEX_DARK: Record<EntityStatus, string> = {
  "On Track":    "#047857", // emerald-700
  "At Risk":     "#b45309", // amber-700
  "High Risk":   "#b91c1c", // red-700
  "Achieved":    "#0e7490", // cyan-700
  "Not Started": "#475569", // slate-600
  "On Hold":     "#6d28d9", // violet-700
  "Cancelled":   "#374151", // gray-700
};

export function statusColor(status: EntityStatus): string {
  return STATUS_HEX[status] ?? "#94a3b8";
}

/**
 * Display order for matrix columns / legend rows — active statuses
 * grouped on the left, archived ones (Cancelled/Achieved) on the right.
 * Kept as a separate export so callers that want a different order
 * (e.g. reports) can override freely.
 */
export const STATUS_ORDER: EntityStatus[] = [
  "On Track",
  "At Risk",
  "High Risk",
  "Not Started",
  "On Hold",
  "Achieved",
  "Cancelled",
];
