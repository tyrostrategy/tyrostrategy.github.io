import { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

  // KPI 2: Aktif Hedefler — On Track veya At Risk
  const aktivHedefler = projeler.filter((h) => h.status === "On Track" || h.status === "At Risk");
  const onTrackCount = projeler.filter((h) => h.status === "On Track").length;

  // KPI 3: Aksiyon Tamamlanma — Achieved aksiyonlar / toplam aksiyon
  const achievedAksiyonlar = aksiyonlar.filter((a) => a.status === "Achieved");
  const aksiyonProgress =
    aksiyonlar.length > 0 ? Math.round((achievedAksiyonlar.length / aksiyonlar.length) * 100) : 0;

  // KPI 4: Geciken/Riskli — Behind veya At Risk aksiyonlar
  const gecikenAksiyonlar = aksiyonlar.filter((a) => a.status === "Behind" || a.status === "At Risk");
  const behindCount = aksiyonlar.filter((a) => a.status === "Behind").length;
  const atRiskCount = aksiyonlar.filter((a) => a.status === "At Risk").length;

  const kpiCards = [
    {
      label: "Proje Tamamlanma",
      value: hedefTamamlanan.length,
      target: projeler.length,
      icon: "Target",
      color: "var(--tyro-navy)",
      progress: projeProgress,
      contextText: `${hedefTamamlanan.length}/${projeler.length} proje`,
      onClick: () => navigate("/projeler"),
    },
    {
      label: "Aktif Hedefler",
      value: aktivHedefler.length,
      icon: "Target",
      color: "var(--tyro-gold)",
      trend: onTrackCount,
      trendLabel: "yolunda",
      contextText: `${projeler.length} toplam proje`,
      onClick: () => navigate("/projeler"),
    },
    {
      label: "Aksiyon Tamamlanma",
      value: achievedAksiyonlar.length,
      target: aksiyonlar.length,
      icon: "CheckCircle",
      color: "var(--tyro-success)",
      progress: aksiyonProgress,
      contextText: `${achievedAksiyonlar.length}/${aksiyonlar.length} aksiyon`,
      onClick: () => navigate("/aksiyonlar?status=Achieved"),
    },
    {
      label: "Geciken / Riskli",
      value: gecikenAksiyonlar.length,
      icon: "AlertTriangle",
      color: "var(--tyro-danger)",
      trend: behindCount,
      trendLabel: `gecikmi\u015f, ${atRiskCount} risk alt\u0131nda`,
      contextText: `${aksiyonlar.length} toplam aksiyondan`,
      onClick: () => navigate("/aksiyonlar?status=Behind,At+Risk"),
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
                ? "bg-tyro-navy text-white shadow-sm"
                : "text-tyro-text-muted hover:bg-tyro-bg hover:text-tyro-text-secondary"
            }`}
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

      {/* Row 2: Kaynak Bazlı Dağılım (5) + Tag Gauge (4) + Genel İlerleme (3) */}
      <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-12 gap-5"><div className="col-span-12 lg:col-span-5 h-64 rounded-2xl bg-tyro-surface animate-pulse" /><div className="col-span-12 lg:col-span-4 h-64 rounded-2xl bg-tyro-surface animate-pulse" /><div className="col-span-12 lg:col-span-3 h-64 rounded-2xl bg-tyro-surface animate-pulse" /></div>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          <motion.div variants={fadeUp} className="col-span-1 sm:col-span-2 lg:col-span-5 flex">
            <SourceChart />
          </motion.div>
          <motion.div variants={fadeUp} className="col-span-1 lg:col-span-4 flex">
            <TagActivityGauge />
          </motion.div>
          <motion.div variants={fadeUp} className="col-span-1 lg:col-span-3 flex">
            <MultiRingWidget />
          </motion.div>
        </div>
      </Suspense>

      {/* Row 3: Proje Durum Dağılımı (4) + Son Aktiviteler (8) */}
      <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-12 gap-5"><div className="col-span-12 lg:col-span-4 h-64 rounded-2xl bg-tyro-surface animate-pulse" /><div className="col-span-12 lg:col-span-8 h-64 rounded-2xl bg-tyro-surface animate-pulse" /></div>}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <motion.div variants={fadeUp} className="col-span-12 lg:col-span-4 flex">
            <ProjectStatusBreakdown />
          </motion.div>
          <motion.div variants={fadeUp} className="col-span-12 lg:col-span-8 flex">
            <ActivityFeed />
          </motion.div>
        </div>
      </Suspense>
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
      <GlassCard className="p-6 overflow-hidden flex-1 flex flex-col cursor-pointer" onClick={() => navigate("/projeler")}>
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
