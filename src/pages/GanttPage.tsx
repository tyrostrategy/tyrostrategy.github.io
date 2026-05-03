import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef } from "react";
import { clsx } from "clsx";
import { Search, ChevronRight } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useDataStore } from "@/stores/dataStore";
import { usePermissions } from "@/hooks/usePermissions";
import i18n from "@/lib/i18n";
import type { Aksiyon } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  "On Track":    "#10b981",
  "At Risk":     "#f59e0b",
  "High Risk":      "#ef4444",
  "Achieved":    "#06b6d4",
  "Not Started": "#94a3b8",
  "Cancelled":   "#6b7280",
  "On Hold":     "#8b5cf6",
};

type ZoomLevel = "quarter" | "year" | "all";
const LABEL_COL_W = 260;

function fmt(date: string) {
  return new Date(date).toLocaleDateString(
    i18n.language === "en" ? "en-US" : "tr-TR",
    { day: "2-digit", month: "short", year: "numeric" }
  );
}

export default function GanttPage() {
  const { t } = useTranslation();
  const allAksiyonlar = useDataStore((s) => s.aksiyonlar);
  const allProjeler = useDataStore((s) => s.projeler);
  const { filterProjeler, filterAksiyonlar } = usePermissions();
  const projeler = useMemo(() => filterProjeler(allProjeler), [allProjeler, filterProjeler]);
  const aksiyonlar = useMemo(() => filterAksiyonlar(allAksiyonlar), [allAksiyonlar, filterAksiyonlar]);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const yearOptions = useMemo(() => {
    const years = aksiyonlar
      .flatMap((a) => [
        a.startDate ? new Date(a.startDate).getFullYear() : null,
        a.endDate ? new Date(a.endDate).getFullYear() : null,
      ])
      .filter((y): y is number => y !== null);
    if (years.length === 0) return [new Date().getFullYear()];
    const min = Math.min(...years);
    const max = Math.max(...years);
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }, [aksiyonlar]);

  const currentYear = new Date().getFullYear();
  const defaultYear = yearOptions.includes(currentYear) ? currentYear : yearOptions[0];

  const [zoom, setZoom] = useState<ZoomLevel>("year");
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [ganttSearch, setGanttSearch] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (zoom === "quarter") {
      return {
        rangeStart: new Date(selectedYear, (selectedQuarter - 1) * 3, 1),
        rangeEnd: new Date(selectedYear, selectedQuarter * 3, 0),
      };
    } else if (zoom === "year") {
      return {
        rangeStart: new Date(selectedYear, 0, 1),
        rangeEnd: new Date(selectedYear, 11, 31),
      };
    }
    return { rangeStart: null, rangeEnd: null };
  }, [zoom, selectedYear, selectedQuarter]);

  // Group aksiyonlar by project, apply filters
  const projectGroups = useMemo(() => {
    const withDates = aksiyonlar.filter((a) => a.startDate && a.endDate);

    // Filter by range
    const rangeFiltered = rangeStart && rangeEnd
      ? withDates.filter((a) => {
          const s = new Date(a.startDate);
          const e = new Date(a.endDate);
          return s <= rangeEnd && e >= rangeStart;
        })
      : withDates;

    // Text search — PROJE alanları (id, ad, açıklama, lider, kaynak,
    // departman, durum) üzerinde. Aksiyon alanları (name/description/
    // owner/status) BİLİNÇLİ olarak hariç: kullanıcı bir proje arar,
    // o projenin tüm aksiyonlarını görmek ister; aksiyon adına göre
    // arama o projedeki diğer aksiyonları gizliyordu.
    const q = ganttSearch.trim().toLocaleLowerCase("tr");
    const matchingProjeIds = new Set<string>();
    if (q) {
      for (const p of projeler) {
        const hay = [p.id, p.name, p.description, p.owner, p.source, p.department, p.status]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr");
        if (hay.includes(q)) matchingProjeIds.add(p.id);
      }
    }
    const searched = q
      ? rangeFiltered.filter((a) => matchingProjeIds.has(a.projeId))
      : rangeFiltered;

    // Group by projeId
    const map = new Map<string, Aksiyon[]>();
    for (const a of searched) {
      if (!map.has(a.projeId)) map.set(a.projeId, []);
      map.get(a.projeId)!.push(a);
    }

    // Build sorted project groups
    return Array.from(map.entries())
      .map(([projeId, actions]) => {
        const proje = projeler.find((p) => p.id === projeId);
        const sortedActions = [...actions].sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        const minStart = sortedActions.reduce((min, a) =>
          new Date(a.startDate) < new Date(min.startDate) ? a : min
        ).startDate;
        const maxEnd = sortedActions.reduce((max, a) =>
          new Date(a.endDate) > new Date(max.endDate) ? a : max
        ).endDate;
        const avgProgress = Math.round(
          sortedActions.reduce((s, a) => s + a.progress, 0) / sortedActions.length
        );
        return { projeId, proje, actions: sortedActions, minStart, maxEnd, avgProgress };
      })
      .sort((a, b) => new Date(a.minStart).getTime() - new Date(b.minStart).getTime());
  }, [aksiyonlar, projeler, rangeStart, rangeEnd, ganttSearch]);

  const totalActions = projectGroups.reduce((s, g) => s + g.actions.length, 0);

  // Timeline min/max
  const { tlMin, tlMax, tlDays } = useMemo(() => {
    let min: Date;
    let max: Date;
    if (rangeStart && rangeEnd) {
      min = new Date(rangeStart);
      max = new Date(rangeEnd);
    } else {
      if (projectGroups.length === 0) return { tlMin: new Date(), tlMax: new Date(), tlDays: 1 };
      const allDates = projectGroups.flatMap((g) => [
        new Date(g.minStart).getTime(),
        new Date(g.maxEnd).getTime(),
      ]);
      min = new Date(Math.min(...allDates));
      max = new Date(Math.max(...allDates));
    }
    if (zoom === "all") {
      const clampYear = 2020;
      min = new Date(Math.max(min.getFullYear(), clampYear), 0, 1);
      max = new Date(max.getFullYear(), 11, 31);
    } else {
      min = new Date(min.getFullYear(), min.getMonth(), 1);
      max = new Date(max.getFullYear(), max.getMonth() + 1, 0);
    }
    const days = (max.getTime() - min.getTime()) / 86400000;
    return { tlMin: min, tlMax: max, tlDays: Math.max(days, 1) };
  }, [projectGroups, rangeStart, rangeEnd, zoom]);

  const timeLabels = useMemo(() => {
    const labels: { label: string; pct: number }[] = [];
    if (zoom === "all") {
      for (let y = tlMin.getFullYear(); y <= tlMax.getFullYear(); y++) {
        const d = new Date(y, 0, 1);
        const pct = ((d.getTime() - tlMin.getTime()) / 86400000 / tlDays) * 100;
        if (pct >= 0 && pct <= 100) labels.push({ label: String(y), pct });
      }
    } else {
      const cursor = new Date(tlMin.getFullYear(), tlMin.getMonth(), 1);
      while (cursor <= tlMax) {
        const pct = ((cursor.getTime() - tlMin.getTime()) / 86400000 / tlDays) * 100;
        labels.push({
          label: cursor.toLocaleDateString(i18n.language === "en" ? "en-US" : "tr-TR", { month: "short" }),
          pct: Math.max(0, pct),
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }
    return labels;
  }, [tlMin, tlMax, tlDays, zoom]);

  const todayPct = useMemo(() => {
    const off = ((Date.now() - tlMin.getTime()) / 86400000 / tlDays) * 100;
    return off >= 0 && off <= 100 ? off : -1;
  }, [tlMin, tlDays]);

  const getProjeColor = (projeId: string) => {
    const status = projeler.find((p) => p.id === projeId)?.status || "Not Started";
    return STATUS_COLORS[status] || "#94a3b8";
  };

  const getAksiyonColor = (status: string) =>
    STATUS_COLORS[status] || "#94a3b8";

  const barPos = (startDate: string, endDate: string) => {
    const s = Math.max(new Date(startDate).getTime(), tlMin.getTime());
    const e = Math.min(new Date(endDate).getTime(), tlMax.getTime());
    const left = ((s - tlMin.getTime()) / 86400000 / tlDays) * 100;
    const width = ((e - s) / 86400000 / tlDays) * 100;
    return { left: Math.max(0, left), width: Math.max(0.3, width) };
  };

  return (
    <div>
      <PageHeader title={t("pages.gantt.title")} subtitle={t("pages.gantt.subtitle")} />

      {/* Controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative min-w-[200px] max-w-[280px]">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tyro-text-muted" />
          <input
            type="text"
            value={ganttSearch}
            onChange={(e) => setGanttSearch(e.target.value)}
            placeholder={t("common.search", "Ara...")}
            className="w-full h-8 pl-8 pr-3 text-[12px] rounded-xl border border-tyro-border bg-tyro-surface text-tyro-text-primary placeholder:text-tyro-text-muted focus:outline-none focus:ring-2 focus:ring-tyro-gold/30"
          />
        </div>
        <div className="flex bg-tyro-bg rounded-button p-0.5 gap-0.5">
          {(["quarter", "year", "all"] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={clsx(
                "px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all cursor-pointer",
                zoom === z
                  ? "bg-tyro-surface text-tyro-navy shadow-tyro-sm"
                  : "text-tyro-text-muted hover:text-tyro-text-secondary"
              )}
            >
              {z === "quarter" ? t("pages.gantt.quarter") : z === "year" ? t("pages.gantt.year") : t("pages.gantt.all")}
            </button>
          ))}
        </div>

        {zoom !== "all" && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedYear((y) => Math.max(y - 1, yearOptions[0]))}
              disabled={selectedYear <= yearOptions[0]}
              className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg bg-tyro-bg flex items-center justify-center text-tyro-text-muted hover:text-tyro-navy disabled:opacity-30 cursor-pointer transition-colors text-sm font-bold"
            >{"‹"}</button>
            <div className="flex bg-tyro-bg rounded-button p-0.5 gap-0.5">
              {yearOptions.filter((y) => Math.abs(y - selectedYear) <= 2).map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={clsx(
                    "px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all cursor-pointer",
                    selectedYear === y
                      ? "bg-tyro-surface text-tyro-navy shadow-tyro-sm"
                      : "text-tyro-text-muted hover:text-tyro-text-secondary"
                  )}
                >{y}</button>
              ))}
            </div>
            <button
              onClick={() => setSelectedYear((y) => Math.min(y + 1, yearOptions[yearOptions.length - 1]))}
              disabled={selectedYear >= yearOptions[yearOptions.length - 1]}
              className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg bg-tyro-bg flex items-center justify-center text-tyro-text-muted hover:text-tyro-navy disabled:opacity-30 cursor-pointer transition-colors text-sm font-bold"
            >{"›"}</button>
          </div>
        )}

        {zoom === "quarter" && (
          <div className="flex bg-tyro-bg rounded-button p-0.5 gap-0.5">
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={clsx(
                  "px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all cursor-pointer",
                  selectedQuarter === q
                    ? "bg-tyro-surface text-tyro-navy shadow-tyro-sm"
                    : "text-tyro-text-muted hover:text-tyro-text-secondary"
                )}
              >Q{q}</button>
            ))}
          </div>
        )}

        {/* Expand / collapse all */}
        {projectGroups.length > 0 && (
          <button
            onClick={() => {
              if (expandedProjects.size === projectGroups.length) {
                setExpandedProjects(new Set());
              } else {
                setExpandedProjects(new Set(projectGroups.map((g) => g.projeId)));
              }
            }}
            className="ml-auto text-[11px] font-semibold text-tyro-text-muted hover:text-tyro-navy transition-colors cursor-pointer"
          >
            {expandedProjects.size === projectGroups.length ? "Tümünü Kapat" : "Tümünü Aç"}
          </button>
        )}
      </div>

      {/* Mobile view */}
      <div className="block sm:hidden space-y-2">
        {projectGroups.length === 0 ? (
          <div className="glass-card py-16 text-center text-tyro-text-muted text-sm">{t("pages.gantt.noActions")}</div>
        ) : (
          projectGroups.map(({ projeId, proje, actions, avgProgress }) => {
            const color = getProjeColor(projeId);
            const isOpen = expandedProjects.has(projeId);
            return (
              <div key={projeId} className="glass-card overflow-hidden">
                {/* Project header */}
                <button
                  type="button"
                  onClick={() => toggleProject(projeId)}
                  className="w-full flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-tyro-bg/40 transition-colors text-left"
                >
                  <ChevronRight
                    size={14}
                    className="shrink-0 transition-transform text-tyro-text-muted"
                    style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                  />
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-[13px] text-tyro-text-primary flex-1 truncate">{proje?.name ?? projeId}</span>
                  <span className="text-[11px] text-tyro-text-muted shrink-0">{actions.length} aksiyon · %{avgProgress}</span>
                </button>
                {/* Actions */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-tyro-border/20 divide-y divide-tyro-border/10">
                        {actions.map((task) => {
                          const taskColor = getAksiyonColor(task.status);
                          return (
                          <div key={task.id} className="px-4 py-2.5 pl-9">
                            <p className="text-[12px] font-medium text-tyro-text-primary">{task.name}</p>
                            <p className="text-[11px] text-tyro-text-muted mt-0.5">
                              {fmt(task.startDate)} → {fmt(task.endDate)}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-1.5 rounded-full bg-tyro-bg overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${task.progress}%`, backgroundColor: taskColor }} />
                              </div>
                              <span className="text-[10px] font-bold text-tyro-text-secondary tabular-nums">%{task.progress}</span>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Gantt chart */}
      <div className="hidden sm:block">
        <div ref={ref} className="glass-card p-5 overflow-x-auto">
          {projectGroups.length === 0 ? (
            <div className="py-16 text-center text-tyro-text-muted text-sm">{t("pages.gantt.noActions")}</div>
          ) : (
            <>
              {/* Header row */}
              <div className="flex min-w-[900px]">
                <div className="shrink-0" style={{ width: LABEL_COL_W }} />
                <div className="flex-1 relative h-7 border-b border-tyro-border/40">
                  {timeLabels.map((tl, i) => (
                    <span
                      key={i}
                      className="absolute text-[11px] font-semibold text-tyro-text-muted whitespace-nowrap"
                      style={{ left: `${tl.pct}%`, bottom: 4 }}
                    >{tl.label}</span>
                  ))}
                </div>
              </div>

              {/* Project rows */}
              <div className="flex flex-col min-w-[900px] mt-1">
                {projectGroups.map((group, gi) => {
                  const color = getProjeColor(group.projeId);
                  const isOpen = expandedProjects.has(group.projeId);
                  const projBar = barPos(group.minStart, group.maxEnd);
                  const isClipped = zoom === "all" && new Date(group.minStart).getTime() < tlMin.getTime();

                  return (
                    <div key={group.projeId}>
                      {/* Project row */}
                      <div
                        className="flex items-center min-h-[44px] hover:bg-tyro-bg/50 rounded-lg transition-colors group cursor-pointer py-1"
                        onClick={() => toggleProject(group.projeId)}
                      >
                        <div
                          className="shrink-0 flex items-start gap-1.5 px-2 py-1"
                          style={{ width: LABEL_COL_W }}
                        >
                          <ChevronRight
                            size={13}
                            className="shrink-0 text-tyro-text-muted transition-transform mt-0.5"
                            style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                          />
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: color }} />
                          <span
                            className="text-[12px] font-bold text-tyro-text-primary flex-1 break-words leading-snug"
                          >
                            {group.proje?.name ?? group.projeId}
                          </span>
                          <span className="text-[10px] text-tyro-text-muted shrink-0 tabular-nums mt-0.5">{group.actions.length}</span>
                        </div>

                        {/* Project bar (spans full duration) */}
                        <div className="flex-1 relative h-7">
                          {timeLabels.map((tl, j) => (
                            <div
                              key={j}
                              className="absolute top-0 bottom-0 w-px bg-tyro-border/20"
                              style={{ left: `${tl.pct}%` }}
                            />
                          ))}
                          <motion.div
                            className={clsx(
                              "absolute top-1 bottom-1 flex items-center overflow-hidden opacity-70",
                              isClipped ? "rounded-r-[5px]" : "rounded-[5px]"
                            )}
                            style={{ left: `${projBar.left}%`, backgroundColor: color }}
                            initial={{ width: 0 }}
                            animate={isInView ? { width: `${projBar.width}%` } : undefined}
                            transition={{ duration: 0.8, delay: gi * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                          >
                            <div
                              className="absolute right-0 top-0 bottom-0 bg-white/30 rounded-r-[5px]"
                              style={{ width: `${100 - group.avgProgress}%` }}
                            />
                            {projBar.width > 4 && (
                              <span className="relative z-10 px-2 text-[11px] font-bold text-white truncate">
                                %{group.avgProgress}
                              </span>
                            )}
                          </motion.div>
                          {todayPct >= 0 && (
                            <div className="absolute top-0 bottom-0 z-10 flex flex-col items-center pointer-events-none" style={{ left: `${todayPct}%` }}>
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-[4px] -mt-1 shadow-sm" />
                              <div className="w-[2px] flex-1 bg-red-500/70" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action rows (collapsible) */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            {group.actions.map((task, ai) => {
                              const { left, width } = barPos(task.startDate, task.endDate);
                              const taskClipped = zoom === "all" && new Date(task.startDate).getTime() < tlMin.getTime();
                              const taskColor = getAksiyonColor(task.status);
                              return (
                                <div
                                  key={task.id}
                                  className="flex items-center min-h-[36px] hover:bg-tyro-bg/30 rounded-lg transition-colors py-1"
                                >
                                  <div
                                    className="shrink-0 flex items-start gap-1.5 py-0.5"
                                    style={{ width: LABEL_COL_W, paddingLeft: 32 }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0 opacity-60 mt-1" style={{ backgroundColor: taskColor }} />
                                    <span
                                      className="text-[11px] text-tyro-text-secondary flex-1 break-words leading-snug"
                                    >{task.name}</span>
                                  </div>

                                  <div className="flex-1 relative h-5">
                                    {timeLabels.map((tl, j) => (
                                      <div
                                        key={j}
                                        className="absolute top-0 bottom-0 w-px bg-tyro-border/10"
                                        style={{ left: `${tl.pct}%` }}
                                      />
                                    ))}
                                    <motion.div
                                      className={clsx(
                                        "absolute top-1 bottom-1 flex items-center overflow-hidden",
                                        taskClipped ? "rounded-r-[4px]" : "rounded-[4px]"
                                      )}
                                      style={{ left: `${left}%`, backgroundColor: taskColor, opacity: 0.85 }}
                                      initial={{ width: 0 }}
                                      animate={isInView ? { width: `${width}%` } : undefined}
                                      transition={{ duration: 0.6, delay: ai * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    >
                                      <div
                                        className="absolute right-0 top-0 bottom-0 bg-white/25 rounded-r-[4px]"
                                        style={{ width: `${100 - task.progress}%` }}
                                      />
                                      {width > 4 && (
                                        <span className="relative z-10 px-1.5 text-[10px] font-bold text-white truncate">
                                          %{task.progress}
                                        </span>
                                      )}
                                    </motion.div>
                                    {todayPct >= 0 && (
                                      <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: `${todayPct}%` }}>
                                        <div className="w-[1px] h-full bg-red-500/50" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-tyro-border/30 min-w-[900px] flex-wrap">
                {[
                  { key: "On Track",    label: t("status.onTrack") },
                  { key: "High Risk",      label: t("status.behind") },
                  { key: "At Risk",     label: t("status.atRisk") },
                  { key: "Not Started", label: t("status.notStarted") },
                  { key: "On Hold",     label: t("status.onHold") },
                  { key: "Achieved",    label: t("status.achieved") },
                  { key: "Cancelled",   label: t("status.cancelled") },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS[key] }} />
                    <span className="text-[11px] text-tyro-text-muted">{label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="w-4 h-[2px] bg-red-500/70" />
                  <span className="text-[11px] text-tyro-text-muted">Bugün</span>
                </div>
                <span className="ml-auto text-[11px] text-tyro-text-muted">
                  {projectGroups.length} proje · {totalActions} aksiyon
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
