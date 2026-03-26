import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { clsx } from "clsx";
import { Search } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useDataStore } from "@/stores/dataStore";
import i18n from "@/lib/i18n";
import type { Aksiyon } from "@/types";

const sourceColors: Record<string, string> = {
  "T\u00fcrkiye": "var(--tyro-navy)",
  Kurumsal: "var(--tyro-gold)",
  International: "var(--tyro-info)",
};

type ZoomLevel = "quarter" | "year" | "all";
const LABEL_COL_W = 240;

export default function GanttPage() {
  const { t } = useTranslation();
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const projeler = useDataStore((s) => s.projeler);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  // Dynamic year range from data
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
  const [selectedQuarter, setSelectedQuarter] = useState(
    Math.ceil((new Date().getMonth() + 1) / 3)
  );
  const [ganttSearch, setGanttSearch] = useState("");

  // Visible date range
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

  // Proje name lookup
  const hedefNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of projeler) map.set(h.id, h.name);
    return map;
  }, [projeler]);

  // Filter aksiyonlar that overlap with range + text search
  const tasks = useMemo(() => {
    let filtered = aksiyonlar.filter((a) => a.startDate && a.endDate);
    if (rangeStart && rangeEnd) {
      filtered = filtered.filter((a) => {
        const s = new Date(a.startDate);
        const e = new Date(a.endDate);
        return s <= rangeEnd && e >= rangeStart;
      });
    }
    if (ganttSearch.trim()) {
      const q = ganttSearch.toLocaleLowerCase("tr");
      filtered = filtered.filter((a) => {
        return [a.name, a.description, a.owner, hedefNameMap.get(a.projeId) ?? "", a.status].filter(Boolean).join(" ").toLocaleLowerCase("tr").includes(q);
      });
    }
    return filtered.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [aksiyonlar, rangeStart, rangeEnd, ganttSearch, hedefNameMap]);

  // Timeline min/max
  const { tlMin, tlMax, tlDays } = useMemo(() => {
    let min: Date;
    let max: Date;
    if (rangeStart && rangeEnd) {
      min = new Date(rangeStart);
      max = new Date(rangeEnd);
    } else {
      if (tasks.length === 0) return { tlMin: new Date(), tlMax: new Date(), tlDays: 1 };
      const allDates = tasks.flatMap((t) => [
        new Date(t.startDate).getTime(),
        new Date(t.endDate).getTime(),
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
  }, [tasks, rangeStart, rangeEnd]);

  // Generate header labels
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

  // Today marker
  const todayPct = useMemo(() => {
    const off = ((Date.now() - tlMin.getTime()) / 86400000 / tlDays) * 100;
    return off >= 0 && off <= 100 ? off : -1;
  }, [tlMin, tlDays]);

  const getHedefSource = (projeId: string) =>
    projeler.find((h) => h.id === projeId)?.source || "Kurumsal";

  // Bar position helper
  const barPos = (task: Aksiyon) => {
    const s = Math.max(new Date(task.startDate).getTime(), tlMin.getTime());
    const e = Math.min(new Date(task.endDate).getTime(), tlMax.getTime());
    const left = ((s - tlMin.getTime()) / 86400000 / tlDays) * 100;
    const width = ((e - s) / 86400000 / tlDays) * 100;
    return { left: Math.max(0, left), width: Math.max(0.3, width) };
  };

  return (
    <div>
      <PageHeader title={t("pages.gantt.title")} subtitle={t("pages.gantt.subtitle")} />

      {/* Controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Search */}
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
            >
              {"‹"}
            </button>
            <div className="flex bg-tyro-bg rounded-button p-0.5 gap-0.5">
              {yearOptions
                .filter((y) => Math.abs(y - selectedYear) <= 2)
                .map((y) => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={clsx(
                      "px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all cursor-pointer",
                      selectedYear === y
                        ? "bg-tyro-surface text-tyro-navy shadow-tyro-sm"
                        : "text-tyro-text-muted hover:text-tyro-text-secondary"
                    )}
                  >
                    {y}
                  </button>
                ))}
            </div>
            <button
              onClick={() =>
                setSelectedYear((y) => Math.min(y + 1, yearOptions[yearOptions.length - 1]))
              }
              disabled={selectedYear >= yearOptions[yearOptions.length - 1]}
              className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg bg-tyro-bg flex items-center justify-center text-tyro-text-muted hover:text-tyro-navy disabled:opacity-30 cursor-pointer transition-colors text-sm font-bold"
            >
              {"›"}
            </button>
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
              >
                Q{q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile timeline */}
      <div className="block sm:hidden space-y-2">
        {tasks.length === 0 ? (
          <div className="glass-card py-16 text-center text-tyro-text-muted text-sm">
            {t("pages.gantt.noActions")}
          </div>
        ) : (
          tasks.map((task) => {
            const color = sourceColors[getHedefSource(task.projeId)] || "var(--tyro-navy)";
            return (
              <div key={task.id} className="glass-card px-4 py-3">
                <div className="flex items-start gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-tyro-text-muted truncate">{projeler.find((h) => h.id === task.projeId)?.name}</p>
                    <p className="text-sm font-semibold text-tyro-text-primary leading-snug">{task.name}</p>
                    <p className="text-[11px] text-tyro-text-muted mt-0.5">
                      {new Date(task.startDate).toLocaleDateString(i18n.language === "en" ? "en-US" : "tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                      {" \u2192 "}
                      {new Date(task.endDate).toLocaleDateString(i18n.language === "en" ? "en-US" : "tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-tyro-bg overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${task.progress}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-[11px] font-bold text-tyro-text-secondary tabular-nums">%{task.progress}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chart */}
      <div className="hidden sm:block">
      <div ref={ref} className="glass-card p-5 overflow-x-auto">
        {tasks.length === 0 ? (
          <div className="py-16 text-center text-tyro-text-muted text-sm">
            {t("pages.gantt.noActions")}
          </div>
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
                  >
                    {tl.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-0.5 min-w-[900px] mt-1">
              {tasks.map((task, i) => {
                const { left, width } = barPos(task);
                const color = sourceColors[getHedefSource(task.projeId)] || "var(--tyro-navy)";
                const realStart = new Date(task.startDate);
                const isClipped = zoom === "all" && realStart.getTime() < tlMin.getTime();
                const clippedYear = realStart.getFullYear();

                return (
                  <div
                    key={task.id}
                    className="flex items-center h-[42px] hover:bg-tyro-bg/40 rounded-lg transition-colors group"
                  >
                    <div
                      className="shrink-0 flex items-center gap-2 px-2"
                      style={{ width: LABEL_COL_W }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0 mt-1"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex flex-col truncate flex-1 leading-tight" title={`${projeler.find((h) => h.id === task.projeId)?.name ?? ""} › ${task.name}`}>
                        <span className="text-[11px] text-tyro-text-muted truncate">{projeler.find((h) => h.id === task.projeId)?.name}</span>
                        <span className="text-[11px] text-tyro-text-secondary truncate">{task.name}</span>
                      </div>
                      {isClipped && (
                        <span className="text-[11px] font-bold text-tyro-text-muted bg-tyro-bg px-1.5 py-0.5 rounded shrink-0">
                          {clippedYear}›
                        </span>
                      )}
                    </div>

                    <div className="flex-1 relative h-6">
                      {timeLabels.map((tl, j) => (
                        <div
                          key={j}
                          className="absolute top-0 bottom-0 w-px bg-tyro-border/20"
                          style={{ left: `${tl.pct}%` }}
                        />
                      ))}

                      <motion.div
                        className={clsx(
                          "absolute top-1 bottom-1 flex items-center overflow-hidden",
                          isClipped ? "rounded-r-[4px]" : "rounded-[4px]"
                        )}
                        style={{ left: `${left}%`, backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={isInView ? { width: `${width}%` } : undefined}
                        transition={{
                          duration: 0.7,
                          delay: i * 0.03,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                      >
                        {isClipped && (
                          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white/40 to-transparent" />
                        )}
                        <div
                          className="absolute right-0 top-0 bottom-0 bg-white/25 rounded-r-[4px]"
                          style={{ width: `${100 - task.progress}%` }}
                        />
                        {width > 4 && (
                          <span className="relative z-10 px-2 text-[11px] font-bold text-white truncate">
                            %{task.progress}
                          </span>
                        )}
                      </motion.div>

                      {todayPct >= 0 && (
                        <div
                          className="absolute top-0 bottom-0 z-10 flex flex-col items-center"
                          style={{ left: `${todayPct}%` }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-[4px] -mt-1 shadow-sm" />
                          <div className="w-[2px] flex-1 bg-red-500/70" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-4 pt-3 border-t border-tyro-border/30 min-w-[900px]">
              {Object.entries(sourceColors).map(([label, color]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                  <span className="text-[11px] text-tyro-text-muted">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="w-4 h-[2px] bg-red-500/70" />
                <span className="text-[11px] text-tyro-text-muted">Bug\u00fcn</span>
              </div>
              <span className="ml-auto text-[11px] text-tyro-text-muted">
                {tasks.length} aksiyon
              </span>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
