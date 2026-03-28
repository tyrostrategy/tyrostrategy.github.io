import { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ArrowRight, BarChart3, FileText } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { useUIStore } from "@/stores/uiStore";
import KPICard from "@/components/dashboard/KPICard";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import CircularProgress from "@/components/ui/CircularProgress";

// Lazy load heavy chart components (recharts ~200KB)
const SourceChart = lazy(() => import("@/components/dashboard/SourceChart"));
const ProjectStatusBreakdown = lazy(() => import("@/components/dashboard/ProjectStatusBreakdown"));
const MultiRingWidget = lazy(() => import("@/components/dashboard/MultiRingWidget"));
const ActivityFeed = lazy(() => import("@/components/dashboard/ActivityFeed"));
const TagActivityGauge = lazy(() => import("@/components/dashboard/TagActivityGauge"));
const AdvancedFilterPanel = lazy(() => import("@/components/dashboard/AdvancedFilterPanel"));
const RaporSihirbazi = lazy(() => import("@/components/dashboard/RaporSihirbazi"));

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t("workspace.goodMorning");
  if (hour < 18) return t("workspace.goodAfternoon");
  return t("workspace.goodEvening");
}

function getSummaryText(
  aktivCount: number,
  gecikenCount: number,
  achievedCount: number,
  totalGorev: number,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const completionRate = totalGorev > 0 ? Math.round((achievedCount / totalGorev) * 100) : 0;
  if (gecikenCount === 0) {
    return t("dashboard.summaryGood", { count: aktivCount, rate: completionRate });
  }
  return t("dashboard.summaryWarning", { activeCount: aktivCount, delayedCount: gecikenCount, rate: completionRate });
}

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 },
  },
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const sidebarTheme = useSidebarTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const activeTab = searchParams.get("tab") || "dashboard";
  const projeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);

  // ===== KPI Hesaplamaları (tamamen veriye dayalı) =====

  // KPI 1: Proje Tamamlanma — tüm aksiyonları "Achieved" olan projeler
  const hedefTamamlanan = useMemo(
    () =>
      projeler.filter((h) => {
        const aksiyonlarForH = aksiyonlar.filter((a) => a.projeId === h.id);
        if (aksiyonlarForH.length === 0) return false;
        return aksiyonlarForH.every((a) => a.status === "Achieved");
      }),
    [projeler, aksiyonlar]
  );
  const projeProgress =
    projeler.length > 0 ? Math.round((hedefTamamlanan.length / projeler.length) * 100) : 0;

  // Single-pass status counts + avg progress
  const { statusCounts, avgProgress } = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalProgress = 0;
    for (const h of projeler) {
      counts[h.status] = (counts[h.status] ?? 0) + 1;
      totalProgress += h.progress;
    }
    return {
      statusCounts: counts,
      avgProgress: projeler.length > 0 ? Math.round(totalProgress / projeler.length) : 0,
    };
  }, [projeler]);

  const onTrackCount = statusCounts["On Track"] ?? 0;
  const behindCount = statusCounts["Behind"] ?? 0;
  const atRiskCount = statusCounts["At Risk"] ?? 0;
  const aktivProjeler = projeler.filter((h) => h.status === "On Track" || h.status === "At Risk");
  const gecikenProjeler = projeler.filter((h) => h.status === "Behind" || h.status === "At Risk");

  const kpiCards = [
    {
      label: "Proje Tamamlanma",
      value: hedefTamamlanan.length,
      target: projeler.length,
      icon: "Target",
      color: "var(--tyro-navy)",
      progress: projeProgress,
      contextText: `${hedefTamamlanan.length}/${projeler.length} proje`,
      onClick: () => navigate("/stratejik-kokpit?status=Achieved"),
    },
    {
      label: "Aktif Projeler",
      value: aktivProjeler.length,
      icon: "Target",
      color: "var(--tyro-gold)",
      trend: onTrackCount,
      trendLabel: "yolunda",
      contextText: `${projeler.length} toplam proje`,
      onClick: () => navigate("/stratejik-kokpit?status=On Track,At Risk,Behind,On Hold"),
    },
    {
      label: "Gecikmeli / Riskli",
      value: gecikenProjeler.length,
      icon: "AlertTriangle",
      color: "var(--tyro-danger)",
      trend: behindCount,
      trendLabel: `gecikmeli, ${atRiskCount} risk altında`,
      contextText: `${projeler.length} toplam projeden`,
      onClick: () => navigate("/stratejik-kokpit?status=Behind,At Risk"),
    },
    {
      label: "Ortalama İlerleme",
      value: avgProgress,
      icon: "BarChart3",
      color: "var(--tyro-info)",
      progress: avgProgress,
      contextText: `${projeler.length} proje ortalaması`,
      onClick: () => navigate("/stratejik-kokpit"),
    },
  ];

  const switchTab = (tab: string) => {
    setSearchParams(tab === "dashboard" ? {} : { tab });
  };

  // ===== Tab render helper =====
  const renderTabs = () => (
    <div className="flex items-center gap-1 text-[12px] print:hidden">
      {[
        { id: "dashboard", label: "Dashboard", icon: BarChart3 },
        { id: "rapor", label: "Rapor Sihirbazı", icon: FileText },
      ].map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              isActive
                ? "shadow-sm"
                : "text-tyro-text-muted hover:bg-tyro-bg hover:text-tyro-text-secondary"
            }`}
            style={isActive ? { backgroundColor: sidebarTheme.bg, color: sidebarTheme.isDark !== false ? "#ffffff" : "#1e293b" } : undefined}
          >
            <Icon size={14} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  // ===== Rapor Sihirbazı tab =====
  if (activeTab === "rapor") {
    return (
      <div>
        <div className="flex items-center justify-between mb-5 print:hidden">
          {renderTabs()}
        </div>
        <Suspense fallback={<div className="flex items-center justify-center py-20 text-tyro-text-muted">Yükleniyor...</div>}>
          <RaporSihirbazi />
        </Suspense>
      </div>
    );
  }

  return (
    <motion.div className="space-y-5" variants={stagger} initial="hidden" animate="show">
      {/* Page Header — Tabs + Greeting + Summary */}
      <motion.div variants={fadeUp} className="space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            {renderTabs()}
          </div>

          <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openCommandPalette}
            className="inline-flex items-center gap-2 h-10 flex-1 sm:flex-none px-3 rounded-button border border-tyro-border bg-tyro-surface text-tyro-text-secondary hover:border-tyro-navy/20 transition-colors cursor-pointer"
          >
            <Search size={16} />
            <span className="text-[13px] text-tyro-text-muted">{t("common.search")}</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-tyro-bg border border-tyro-border text-[11px] font-mono text-tyro-text-muted ml-auto sm:ml-2">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-button border border-tyro-border bg-tyro-surface text-tyro-text-secondary hover:border-tyro-navy/20 hover:text-tyro-navy transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={16} />
            <span className="text-[13px] font-semibold">{t("common.filter")}</span>
          </button>
          </div>
        </div>
      </motion.div>

      {/* Advanced Filter Panel */}
      <Suspense fallback={null}>
        <AdvancedFilterPanel isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
      </Suspense>

      {/* Row 1: 4 KPI Cards — equal height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        <motion.div key={kpiCards[0].label} variants={fadeUp} className="flex">
          <ActiveBentoCard
            kpi={kpiCards[0]}
            completedHedefler={hedefTamamlanan.map((h) => ({ id: h.id, name: h.name }))}
          />
        </motion.div>
        {kpiCards.slice(1).map((kpi) => (
          <motion.div key={kpi.label} variants={fadeUp} className="flex">
            <KPICard {...kpi} onClick={kpi.onClick} />
          </motion.div>
        ))}
      </div>

      {/* Row 2: İş Grubu Bazlı Proje Dağılımı (7) + Tag Gauge (5) */}
      <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-12 gap-5"><div className="col-span-12 lg:col-span-7 h-64 rounded-2xl bg-tyro-surface animate-pulse" /><div className="col-span-12 lg:col-span-5 h-64 rounded-2xl bg-tyro-surface animate-pulse" /></div>}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
          <motion.div variants={fadeUp} className="lg:col-span-3 flex">
            <SourceChart />
          </motion.div>
          <motion.div variants={fadeUp} className="lg:col-span-1 flex">
            <TagActivityGauge />
          </motion.div>
        </div>
      </Suspense>

      {/* Row 3: Departman Bazlı + Proje Lideri Bazlı Dağılım */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <motion.div variants={fadeUp}>
          <DepartmentDistribution projeler={projeler} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <LeaderDistribution projeler={projeler} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ===== Active Bento Card =====
interface ActiveBentoCardProps {
  kpi: {
    label: string;
    value: number;
    target?: number;
    prefix?: string;
    suffix?: string;
    icon: string;
    color: string;
    progress?: number;
    trend?: number;
    trendLabel?: string;
    contextText?: string;
  };
  completedHedefler: { id: string; name: string }[];
}

function ActiveBentoCard({ kpi, completedHedefler }: ActiveBentoCardProps) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const trendIsPositive = kpi.trend !== undefined && kpi.trend >= 0;
  const trendColor = trendIsPositive ? "text-tyro-success" : "text-tyro-danger";

  return (
    <div
      className="flex-1 flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <GlassCard className="p-6 overflow-hidden flex-1 flex flex-col cursor-pointer" onClick={() => navigate("/stratejik-kokpit?status=Achieved")}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-semibold text-tyro-text-secondary">{kpi.label}</span>
          <div
            className="flex items-center justify-center w-9 h-9 rounded-button"
            style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
          </div>
        </div>

        <div className="text-3xl font-extrabold tracking-tight tabular-nums leading-none mb-3 text-tyro-text-primary">
          <AnimatedCounter value={kpi.value} prefix={kpi.prefix ?? ""} suffix={kpi.suffix ?? ""} />
          {kpi.target !== undefined && (
            <span className="text-base font-medium text-tyro-text-muted ml-1">/ {kpi.target}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col gap-0.5">
            {kpi.trend !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${trendColor}`}>
                  {trendIsPositive ? "↑" : "↓"} {kpi.trend}
                </span>
                {kpi.trendLabel && <span className="text-xs text-tyro-text-muted">{kpi.trendLabel}</span>}
              </div>
            )}
            {kpi.contextText && (
              <span className="text-[11px] text-tyro-text-muted">{kpi.contextText}</span>
            )}
          </div>
          {kpi.progress !== undefined && (
            <CircularProgress progress={kpi.progress} size={44} strokeWidth={4} color={kpi.color}>
              <span className="text-[11px] font-bold text-tyro-text-secondary">{kpi.progress}%</span>
            </CircularProgress>
          )}
        </div>

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ maxHeight: 0, opacity: 0 }}
              animate={{ maxHeight: 200, opacity: 1 }}
              exit={{ maxHeight: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-3 border-t border-tyro-border">
                <p className="text-[11px] font-bold uppercase tracking-wider text-tyro-text-muted mb-2">
                  Tamamlanan Hedefler
                </p>
                {completedHedefler.length === 0 ? (
                  <p className="text-xs text-tyro-text-muted">Henüz tamamlanan proje yok</p>
                ) : (
                  <ul className="space-y-1">
                    {completedHedefler.slice(0, 3).map((h) => (
                      <li
                        key={h.id}
                        className="text-xs text-tyro-text-secondary truncate cursor-pointer hover:text-tyro-navy transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(`/projeler?selected=${h.id}`); }}
                      >
                        <span className="text-tyro-success mr-1.5">●</span>{h.name}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-tyro-navy/[0.07] text-xs font-semibold text-tyro-navy hover:bg-tyro-navy/[0.14] transition-colors cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); navigate("/projeler"); }}
                >
                  Tüm hedefleri gör
                  <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}

// ===== Departman Bazlı Proje Dağılımı =====
const STATUS_COLORS: Record<string, string> = {
  "On Track": "#10b981",
  "At Risk": "#f59e0b",
  "Behind": "#ef4444",
  "Achieved": "#06b6d4",
  "Not Started": "#94a3b8",
  "Cancelled": "#6b7280",
  "On Hold": "#8b5cf6",
};

const STATUS_LABELS: Record<string, string> = {
  "On Track": "Yolunda",
  "At Risk": "Risk Altında",
  "Behind": "Gecikmeli",
  "Achieved": "Tamamlandı",
  "Not Started": "Başlanmadı",
  "Cancelled": "İptal",
  "On Hold": "Askıda",
};

function DepartmentDistribution({ projeler }: { projeler: { department: string; status: string }[] }) {
  const grouped = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    for (const p of projeler) {
      const dept = p.department || "Diğer";
      if (!m.has(dept)) m.set(dept, {});
      const d = m.get(dept)!;
      d[p.status] = (d[p.status] || 0) + 1;
    }
    return Array.from(m.entries())
      .map(([dept, statuses]) => ({ dept, statuses, total: Object.values(statuses).reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total);
  }, [projeler]);

  return (
    <GlassCard className="p-5 flex-1 flex flex-col">
      <h3 className="text-[13px] font-bold text-tyro-text-primary mb-1">Departman Bazlı Proje Dağılımı</h3>
      <p className="text-[11px] text-tyro-text-secondary mb-4">Departmanlara göre proje statüleri</p>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {grouped.map(({ dept, statuses, total }) => (
          <div key={dept}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-semibold text-tyro-text-primary">{dept}</span>
              <span className="text-[11px] text-tyro-text-muted">{total} proje</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-tyro-bg">
              {Object.entries(statuses).map(([status, count]) => (
                <div
                  key={status}
                  className="h-full transition-all"
                  style={{
                    width: `${(count / total) * 100}%`,
                    backgroundColor: STATUS_COLORS[status] || "#94a3b8",
                  }}
                  title={`${STATUS_LABELS[status] || status}: ${count}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-4 pt-3 border-t border-tyro-border/20">
        {Object.entries(STATUS_COLORS).slice(0, 5).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-tyro-text-muted">{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ===== Proje Lideri Bazlı Dağılım =====
function LeaderDistribution({ projeler }: { projeler: { owner: string; status: string }[] }) {
  const grouped = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    for (const p of projeler) {
      const owner = p.owner || "Belirtilmemiş";
      if (!m.has(owner)) m.set(owner, {});
      const d = m.get(owner)!;
      d[p.status] = (d[p.status] || 0) + 1;
    }
    return Array.from(m.entries())
      .map(([owner, statuses]) => ({ owner, statuses, total: Object.values(statuses).reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // top 10
  }, [projeler]);

  return (
    <GlassCard className="p-5 flex-1 flex flex-col">
      <h3 className="text-[13px] font-bold text-tyro-text-primary mb-1">Proje Lideri Bazlı Dağılım</h3>
      <p className="text-[11px] text-tyro-text-secondary mb-4">Proje liderlerine göre proje statüleri</p>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {grouped.map(({ owner, statuses, total }) => (
          <div key={owner}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-semibold text-tyro-text-primary truncate max-w-[200px]">{owner}</span>
              <span className="text-[11px] text-tyro-text-muted shrink-0">{total} proje</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-tyro-bg">
              {Object.entries(statuses).map(([status, count]) => (
                <div
                  key={status}
                  className="h-full transition-all"
                  style={{
                    width: `${(count / total) * 100}%`,
                    backgroundColor: STATUS_COLORS[status] || "#94a3b8",
                  }}
                  title={`${STATUS_LABELS[status] || status}: ${count}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-4 pt-3 border-t border-tyro-border/20">
        {Object.entries(STATUS_COLORS).slice(0, 5).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-tyro-text-muted">{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
