import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, UserCircle2, Briefcase } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { STATUS_HEX, STATUS_ORDER } from "@/lib/statusColors";
import { getStatusLabel } from "@/lib/constants";
import { deptLabel } from "@/config/departments";
import type { Proje, EntityStatus } from "@/types";

type Dim = "dept" | "leader" | "source";

interface Props {
  projeler: Proje[];
}

/**
 * Tabbed 2D heatmap: rows are the active dimension values (dept / owner
 * / source), columns are statuses. Cells show per-bucket counts; 0 cells
 * are muted, populated cells carry a soft-tinted status color.
 */
export default function BreakdownMatrixCard({ projeler }: Props) {
  const { t } = useTranslation();
  const sidebarTheme = useSidebarTheme();
  const accentColor = sidebarTheme.accentColor ?? "#c8922a";
  const [dim, setDim] = useState<Dim>("dept");

  // Tab metadata — label comes from i18n; icon lifts visual distinction
  // between the three dimensions.
  const tabs: { id: Dim; label: string; icon: typeof Building2 }[] = [
    { id: "dept",   label: t("dashboard.breakdownTabs.dept"),   icon: Building2 },
    { id: "leader", label: t("dashboard.breakdownTabs.leader"), icon: UserCircle2 },
    { id: "source", label: t("dashboard.breakdownTabs.source"), icon: Briefcase },
  ];

  // Extract the row key for a proje given the active dimension.
  // department labels are passed through deptLabel() to resolve tr/en
  // aliases (same helper the other widgets use).
  const extract = (h: Proje): string => {
    if (dim === "dept") return deptLabel(h.department, t) || t("dashboard.other");
    if (dim === "leader") return h.owner || "-";
    return h.source || "-";
  };

  // Build { rowKey → Record<EntityStatus, number> }. Single pass,
  // zero cells initialized so the matrix is rectangular — no holes.
  const matrix = useMemo(() => {
    const bucket = new Map<string, Record<EntityStatus, number>>();
    const blank = (): Record<EntityStatus, number> =>
      STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<EntityStatus, number>);

    for (const h of projeler) {
      const key = extract(h);
      if (!bucket.has(key)) bucket.set(key, blank());
      const row = bucket.get(key)!;
      row[h.status] = (row[h.status] ?? 0) + 1;
    }

    // Sort rows by total desc so the heaviest buckets read first.
    return Array.from(bucket.entries())
      .map(([key, counts]) => {
        const total = STATUS_ORDER.reduce((s, st) => s + (counts[st] ?? 0), 0);
        return { key, counts, total };
      })
      .sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeler, dim]);

  return (
    <GlassCard className="p-5 flex-1 flex flex-col w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-[13px] font-bold text-tyro-text-primary">
          {t("dashboard.breakdownMatrixTitle")}
        </h3>
        {/* Tab row — mirrors DashboardPage's desktop tab style. */}
        <div className="flex items-center gap-1 text-[12px]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = dim === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDim(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "shadow-sm text-white"
                    : "text-tyro-text-muted hover:bg-tyro-bg hover:text-tyro-text-secondary"
                }`}
                style={isActive ? { backgroundColor: accentColor } : undefined}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Matrix — mobile gets a horizontal scroll window so the status
          columns don't wrap. */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full min-w-[540px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-tyro-text-muted px-2 py-1 sticky left-0 bg-tyro-surface z-10">
                {tabs.find((x) => x.id === dim)?.label}
              </th>
              {STATUS_ORDER.map((s) => (
                <th
                  key={s}
                  className="text-[10px] font-semibold uppercase tracking-wider text-tyro-text-muted px-1 py-1 text-center"
                  style={{ minWidth: 64 }}
                >
                  {getStatusLabel(s, t)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.length === 0 && (
              <tr>
                <td
                  colSpan={STATUS_ORDER.length + 1}
                  className="text-center text-[12px] text-tyro-text-muted py-8"
                >
                  {t("common.noResults")}
                </td>
              </tr>
            )}
            {matrix.map(({ key, counts }) => (
              <tr key={key}>
                <td className="text-[12px] font-medium text-tyro-text-primary px-2 py-1.5 truncate max-w-[200px] sticky left-0 bg-tyro-surface z-10">
                  {key}
                </td>
                {STATUS_ORDER.map((s) => {
                  const n = counts[s] ?? 0;
                  const color = STATUS_HEX[s];
                  return (
                    <td key={s} className="px-1 py-1">
                      <div
                        className="h-10 flex items-center justify-center rounded-lg tabular-nums text-[13px] font-bold"
                        style={
                          n > 0
                            ? { backgroundColor: `${color}20`, color }
                            : { backgroundColor: "var(--tyro-bg)", color: "var(--tyro-text-muted)", opacity: 0.5 }
                        }
                      >
                        {n}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
