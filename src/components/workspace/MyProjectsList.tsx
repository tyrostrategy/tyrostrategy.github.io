import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Crosshair, CircleCheckBig, TrendingUp, ChevronRight } from "lucide-react";
import { Tooltip } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useMyWorkspace } from "@/hooks/useMyWorkspace";
import { useDataStore } from "@/stores/dataStore";
import TagChip from "@/components/ui/TagChip";
import { progressColor } from "@/lib/colorUtils";
import { getStatusLabel } from "@/lib/constants";
import { formatDate } from "@/lib/dateUtils";
import type { EntityStatus } from "@/types";

const SOURCE_COLORS: Record<string, string> = { "Türkiye": "#10b981", "Kurumsal": "#8b5cf6", "International": "#f97316" };
const STATUS_COLORS: Record<string, string> = {
  "On Track": "#10b981", "Achieved": "#3b82f6", "Behind": "#ef4444", "At Risk": "#f59e0b", "Not Started": "#94a3b8",
};

type Tab = "proje" | "aksiyon";

/* ── Radial Gauge (compact) ── */
function RadialGauge({ value, total, avgProgress: _avgProgress, color }: { value: number; total: number; avgProgress: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="relative w-[70px] h-[70px] shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-tyro-bg" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${pct * 0.942} 94.2`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[14px] font-extrabold tabular-nums text-tyro-text-primary leading-none">{value}</span>
        <span className="text-[11px] text-tyro-text-muted">/ {total}</span>
      </div>
    </div>
  );
}

/* ── Horizontal Stacked Bar ── */
function StackedStatusBar({ items, getStatus }: { items: { status: string }[]; getStatus: (s: string) => string }) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
  const total = items.length || 1;
  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-2">
      {entries.map(([status, count]) => {
        const pct = Math.round((count / total) * 100);
        const color = STATUS_COLORS[status] ?? "#94a3b8";
        return (
          <div key={status} className="flex items-center gap-3">
            <span className="text-[12px] font-medium text-tyro-text-secondary w-[90px] truncate">{getStatus(status)}</span>
            <div className="flex-1 h-[10px] rounded-full bg-tyro-bg/60 overflow-hidden">
              <Tooltip content={`${count} (${pct}%)`} placement="top" size="sm">
                <motion.div
                  className="h-full rounded-full cursor-help"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </Tooltip>
            </div>
            <span className="text-[12px] font-bold tabular-nums w-8 text-right" style={{ color }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Progress Card (compact) ── */
function ProgressCard({ item, onClick, showParent }: {
  item: { id: string; name: string; progress: number; status: EntityStatus; endDate: string; owner?: string; parentName?: string; aksiyonCount?: number };
  onClick: () => void;
  showParent?: boolean;
}) {
  const pColor = progressColor(item.progress);
  return (
    <motion.div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all group border border-tyro-border/10 hover:border-tyro-border/30"
      style={{
        background: "rgba(255,255,255,0.5)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      whileHover={{ y: -1, boxShadow: "0 4px 16px rgba(30,58,95,0.08)" }}
    >
      {/* Progress ring — compact */}
      <div className="relative w-9 h-9 shrink-0">
        <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-tyro-bg" strokeWidth="3.5" />
          <circle
            cx="18" cy="18" r="14" fill="none" stroke={pColor} strokeWidth="3.5"
            strokeDasharray={`${item.progress * 0.88} 88`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums" style={{ color: pColor }}>
          {item.progress}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        {showParent && item.parentName && (
          <p className="text-[11px] font-medium text-tyro-navy/40 truncate leading-tight mb-0.5">{item.parentName}</p>
        )}
        <p className="text-[12px] font-semibold text-tyro-text-primary truncate group-hover:text-tyro-navy transition-colors leading-snug">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <StatusBadge status={item.status} />
          {item.owner && (
            <span className="text-[11px] text-tyro-text-muted truncate max-w-[100px]">{item.owner}</span>
          )}
          {item.endDate && (
            <span className="text-[11px] text-tyro-text-muted">{formatDate(item.endDate)}</span>
          )}
          {item.aksiyonCount !== undefined && (
            <span className="text-[11px] text-tyro-text-muted">{item.aksiyonCount} aks.</span>
          )}
        </div>
      </div>

      <ChevronRight size={14} className="text-tyro-text-muted/30 group-hover:text-tyro-navy transition-colors shrink-0" />
    </motion.div>
  );
}

/* ── Main ── */
export default function MyProjectsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ws = useMyWorkspace();
  const [tab, setTab] = useState<Tab>("proje");
  const [showAll, setShowAll] = useState(false);

  // Stats
  const hedefSourceMap = new Map<string, number>();
  for (const h of ws.myProjeler) hedefSourceMap.set(h.source, (hedefSourceMap.get(h.source) ?? 0) + 1);
  const hedefTagMap = new Map<string, number>();
  for (const h of ws.myProjeler) {
    for (const tag of (h.tags ?? [])) hedefTagMap.set(tag, (hedefTagMap.get(tag) ?? 0) + 1);
  }
  const getTagColor = useDataStore((s) => s.getTagColor);
  const hedefAvg = ws.myProjeler.length > 0
    ? Math.round(ws.myProjeler.reduce((s, h) => s + h.progress, 0) / ws.myProjeler.length) : 0;
  const hedefAchieved = ws.myProjeler.filter((h) => h.status === "Achieved").length;
  const aksiyonAvg = ws.myAksiyonlar.length > 0
    ? Math.round(ws.myAksiyonlar.reduce((s, a) => s + a.progress, 0) / ws.myAksiyonlar.length) : 0;

  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const hedefNameMap = new Map(ws.myProjeler.map((h) => [h.id, h.name]));
  const aksiyonlarWithParent = ws.myAksiyonlar.map((a) => ({ ...a, parentName: hedefNameMap.get(a.projeId) ?? "" }));

  // Count aksiyonlar per proje for display
  const aksiyonCountMap = new Map<string, number>();
  for (const a of aksiyonlar) aksiyonCountMap.set(a.projeId, (aksiyonCountMap.get(a.projeId) ?? 0) + 1);

  const currentItems = (tab === "proje"
    ? ws.myProjeler.map((h) => ({ ...h, parentName: "", aksiyonCount: aksiyonCountMap.get(h.id) ?? 0 }))
    : aksiyonlarWithParent
  ).sort((a, b) => b.progress - a.progress);

  const visibleItems = showAll ? currentItems : currentItems.slice(0, 3);
  const hasMore = currentItems.length > 3;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* LEFT — Stats Card */}
      <GlassCard className="p-4 sm:p-5 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-tyro-navy/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-tyro-navy" />
            </div>
            <h3 className="text-[13px] font-bold text-tyro-text-primary">{t("workspace.personalKPI")}</h3>
          </div>
          <div
            className="flex items-center rounded-full p-1 border border-white/20"
            style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(16px) saturate(1.6)", WebkitBackdropFilter: "blur(16px) saturate(1.6)" }}
          >
            {(["proje", "aksiyon"] as const).map((t2) => (
              <button
                key={t2}
                type="button"
                onClick={() => { setTab(t2); setShowAll(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                  tab === t2 ? "bg-white/90 shadow-md text-tyro-navy" : "text-tyro-text-muted hover:text-tyro-text-secondary hover:bg-white/15"
                }`}
              >
                {t2 === "proje" ? <Crosshair size={13} /> : <CircleCheckBig size={13} />}
                {t2 === "proje" ? t("nav.objectives") : t("nav.actions")}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`stats-${tab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-5 flex-1"
          >
            {/* Gauge + Status bars */}
            <div className="flex items-start gap-6">
              <RadialGauge
                value={tab === "proje" ? hedefAchieved : ws.achievedAksiyonlar}
                total={tab === "proje" ? ws.myProjeler.length : ws.totalAksiyonlar}
                avgProgress={tab === "proje" ? hedefAvg : aksiyonAvg}
                color="var(--tyro-success)"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-bold text-tyro-text-primary">
                    {t("workspace.statusDistribution")}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] text-tyro-text-muted">{t("workspace.avgProgress")}</span>
                    <span className="text-[16px] font-extrabold text-tyro-navy tabular-nums">%{tab === "proje" ? hedefAvg : aksiyonAvg}</span>
                  </div>
                </div>
                <StackedStatusBar
                  items={tab === "proje" ? ws.myProjeler : ws.myAksiyonlar}
                  getStatus={(s) => getStatusLabel(s as EntityStatus, t)}
                />
              </div>
            </div>

            {/* Source distribution (proje only) */}
            {tab === "proje" && ws.myProjeler.length > 0 && (
              <div>
                <p className="text-[12px] font-bold text-tyro-text-primary mb-2">{t("workspace.sourceDistribution")}</p>
                <div className="flex items-center gap-1 h-5 rounded-lg overflow-hidden bg-tyro-bg/40">
                  {Array.from(hedefSourceMap.entries()).map(([source, count]) => {
                    const pct = Math.round((count / ws.myProjeler.length) * 100);
                    return (
                      <Tooltip key={source} content={`${source}: ${count} (${pct}%)`} placement="top" size="sm">
                        <div
                          className="h-full rounded-lg flex items-center justify-center cursor-help hover:brightness-110 transition-all"
                          style={{ width: `${(count / ws.myProjeler.length) * 100}%`, backgroundColor: SOURCE_COLORS[source] ?? "#94a3b8", minWidth: 28 }}
                        >
                          <span className="text-[10px] font-bold text-white/90 drop-shadow-sm truncate px-0.5">{pct >= 20 ? `${source} · ${pct}%` : `${pct}%`}</span>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  {Array.from(hedefSourceMap.entries()).map(([source, count]) => (
                    <span key={source} className="flex items-center gap-1 text-[10px] text-tyro-text-secondary">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SOURCE_COLORS[source] ?? "#94a3b8" }} />
                      {source} · {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tag distribution (proje only) */}
            {tab === "proje" && hedefTagMap.size > 0 && (
              <div>
                <p className="text-[12px] font-bold text-tyro-text-primary mb-2">{t("workspace.tagDistribution", "Etiket Dağılımı")}</p>
                {(() => {
                  const sortedTags = Array.from(hedefTagMap.entries()).sort((a, b) => b[1] - a[1]);
                  const total = ws.myProjeler.length;
                  return (
                    <>
                      <div className="flex items-center gap-1 h-5 rounded-lg overflow-hidden bg-tyro-bg/40">
                        {sortedTags.map(([tag, count]) => {
                          const pct = Math.round((count / total) * 100);
                          const tagColor = getTagColor(tag);
                          return (
                            <Tooltip key={tag} content={`${tag}: ${count} (${pct}%)`} placement="top" size="sm">
                              <div
                                className="h-full rounded-lg flex items-center justify-center cursor-help hover:brightness-110 transition-all"
                                style={{ width: `${(count / total) * 100}%`, backgroundColor: tagColor, minWidth: 28 }}
                              >
                                <span className="text-[10px] font-bold text-white/90 drop-shadow-sm truncate px-0.5">{pct >= 20 ? `${tag} · ${pct}%` : `${pct}%`}</span>
                              </div>
                            </Tooltip>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                        {sortedTags.map(([tag, count]) => (
                          <span key={tag} className="flex items-center gap-1 text-[10px] text-tyro-text-secondary">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getTagColor(tag) }} />
                            {tag} · {count}
                          </span>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </GlassCard>

      {/* RIGHT — Progress List Card */}
      <GlassCard className="p-4 sm:p-5 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[13px] font-bold text-tyro-text-primary">
            {tab === "proje" ? t("workspace.objectiveProgress") : t("workspace.actionProgress")}
          </h4>
          {hasMore && (
            <button
              type="button"
              onClick={() => navigate(tab === "proje" ? "/projeler" : "/aksiyonlar")}
              className="flex items-center gap-1 text-[12px] font-semibold text-tyro-navy hover:text-tyro-navy-light transition-colors cursor-pointer"
            >
              {t("common.viewAll")}
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`list-${tab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-h-0"
          >
            <div className={`flex flex-col gap-2 ${showAll ? "overflow-y-auto max-h-[320px]" : ""}`}>
              {visibleItems.map((item) => (
                <ProgressCard
                  key={item.id}
                  item={item as any}
                  onClick={() => navigate(tab === "proje" ? `/projeler?selected=${item.id}` : `/aksiyonlar?selected=${item.id}`)}
                  showParent={tab === "aksiyon"}
                />
              ))}
            </div>

            {hasMore && !showAll && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="mt-3 w-full py-2 text-center text-[12px] font-semibold text-tyro-navy rounded-xl border border-tyro-border/20 hover:bg-tyro-bg/40 transition-colors cursor-pointer"
              >
                +{currentItems.length - 3} {t("common.more")}
              </button>
            )}
            {showAll && hasMore && (
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="mt-3 w-full py-2 text-center text-[12px] font-semibold text-tyro-text-muted rounded-xl hover:bg-tyro-bg/40 transition-colors cursor-pointer"
              >
                {t("common.showLess")}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
