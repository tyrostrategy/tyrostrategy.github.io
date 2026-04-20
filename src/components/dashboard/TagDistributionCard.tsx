import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import GlassCard from "@/components/ui/GlassCard";
import { useDataStore } from "@/stores/dataStore";
import type { Proje } from "@/types";

interface Props {
  projeler: Proje[];
}

/**
 * Right-side companion to BreakdownMatrixCard. Lists every tag that
 * actually appears on a project, sorted by count desc, rendered as a
 * horizontal bar with the tag's own color and a trailing circular
 * "N proje" badge. Unused tag_definitions entries are skipped so the
 * list stays relevant.
 */
export default function TagDistributionCard({ projeler }: Props) {
  const { t } = useTranslation();
  const tagDefinitions = useDataStore((s) => s.tagDefinitions);

  // Build { tagName → count } in one pass — reuses the pattern from
  // MyProjectsList for consistency.
  const rows = useMemo(() => {
    const tagCount = new Map<string, number>();
    for (const h of projeler) {
      for (const tag of h.tags ?? []) {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
      }
    }
    const colorFor = (name: string) =>
      tagDefinitions.find((td) => td.name === name)?.color ?? "#94a3b8";

    return Array.from(tagCount.entries())
      .filter(([, count]) => count > 0)
      .map(([name, count]) => ({ name, count, color: colorFor(name) }))
      .sort((a, b) => b.count - a.count);
  }, [projeler, tagDefinitions]);

  const max = rows[0]?.count ?? 0;

  return (
    <GlassCard className="p-5 flex-1 flex flex-col w-full">
      <h3 className="text-[13px] font-bold text-tyro-text-primary mb-1">
        {t("dashboard.tagDistribution")}
      </h3>
      <p className="text-[11px] text-tyro-text-secondary mb-4">
        {t("dashboard.tagDistributionDesc")}
      </p>

      {rows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[12px] text-tyro-text-muted">
          {t("common.noResults")}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto">
          {rows.map(({ name, count, color }) => {
            // Bar width scaled to the biggest bucket so the heaviest
            // tag fills the row and the rest are relative to it.
            const pct = max > 0 ? Math.round((count / max) * 100) : 0;
            return (
              <div key={name} className="flex items-center gap-3">
                {/* Left: tag pill (name + dot) */}
                <div className="flex items-center gap-1.5 shrink-0 min-w-[110px]">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[12px] font-medium text-tyro-text-primary truncate">
                    {name}
                  </span>
                </div>
                {/* Middle: proportional bar */}
                <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ backgroundColor: `${color}14` }}>
                  <div
                    className="h-full rounded-lg transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                {/* Right: count badge — circle + "proje" caption */}
                <div className="flex flex-col items-center shrink-0 min-w-[44px]">
                  <span
                    className="flex items-center justify-center w-9 h-9 rounded-full border text-[12px] font-bold tabular-nums"
                    style={{ borderColor: `${color}80`, color, backgroundColor: `${color}0F` }}
                  >
                    {count}
                  </span>
                  <span className="text-[9px] text-tyro-text-muted mt-0.5 lowercase">
                    {t("dashboard.project").toLowerCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
