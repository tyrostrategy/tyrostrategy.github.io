import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Wand2, RefreshCw } from "lucide-react";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useMyWorkspace } from "@/hooks/useMyWorkspace";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import SlidingPanel from "@/components/shared/SlidingPanel";
// Lazy load heavy components
const MyHedeflerList = lazy(() => import("@/components/workspace/MyProjectsList"));
const UpcomingDeadlines = lazy(() => import("@/components/workspace/UpcomingDeadlines"));
// MyProgressWidget merged into BentoKPI
const BentoKPI = lazy(() => import("@/components/workspace/BentoKPI"));
import ProjeAksiyonWizard from "@/components/wizard/ProjeAksiyonWizard";
import WizardHeader from "@/components/wizard/WizardHeader";

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "workspace.goodMorning";
  if (hour < 18) return "workspace.goodAfternoon";
  return "workspace.goodEvening";
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

function SummaryPills({ items }: { items: { text: string; color?: string }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [lineStarts, setLineStarts] = useState<boolean[]>([]);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const spans = itemRefs.current;
      const starts = spans.map((el, i) => {
        if (i === 0 || !el || !spans[i - 1]) return true;
        return el.offsetTop > (spans[i - 1]?.offsetTop ?? 0);
      });
      setLineStarts(starts);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [items]);

  return (
    <div ref={containerRef} className="mt-1 flex flex-wrap items-center gap-y-1 gap-x-1 -ml-2">
      {items.map((item, i) => (
        <span
          key={i}
          ref={(el) => { itemRefs.current[i] = el; }}
          className="flex items-center gap-1 shrink-0"
        >
          {i > 0 && !lineStarts[i] && (
            <span className="text-[8px] text-tyro-text-muted/50">•</span>
          )}
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
              item.color
                ? `${item.color} bg-amber-50/80`
                : "text-tyro-text-muted bg-tyro-bg/80"
            }`}
          >
            {item.text}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function WorkspacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { name, department, initials } = useCurrentUser();
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const ws = useMyWorkspace();
  const sidebarTheme = useSidebarTheme();
  const brandColor = sidebarTheme.brandStrategy ?? sidebarTheme.accentColor ?? "#c8922a";
  const [wizardOpen, setWizardOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { direction, isPastThreshold } = useScrollDirection(80);
  const showFab = !isPastThreshold || direction === "up";

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Dynamic import to avoid bundling supabaseAdapter in mock mode
      const isSupabase = import.meta.env.VITE_DATA_PROVIDER === "supabase";
      if (isSupabase) {
        const { supabaseAdapter } = await import("@/lib/data/supabaseAdapter");
        const [projeler, aksiyonlar, tags] = await Promise.all([
          supabaseAdapter.fetchProjeler(),
          supabaseAdapter.fetchAksiyonlar(),
          supabaseAdapter.fetchTagDefinitions(),
        ]);
        useDataStore.setState({ projeler, aksiyonlar, tagDefinitions: tags });
      } else {
        // Mock mode: reload from initial data
        const { getInitialData, getInitialTagDefinitions } = await import("@/lib/data/mock-adapter");
        useDataStore.setState({ ...getInitialData(), tagDefinitions: getInitialTagDefinitions() });
      }
    } catch (err) {
      console.error("[Refresh] Failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Register refresh function for MobileHeader
  useEffect(() => {
    useUIStore.getState().setWorkspaceRefreshFn(handleRefresh);
    return () => useUIStore.getState().setWorkspaceRefreshFn(null);
  }, [handleRefresh]);

  const projeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);

  const summaryItems = useMemo(() => {
    const items: { text: string; color?: string }[] = [];
    const totalProje = ws.myProjeler.length;
    const achievedProje = ws.myProjeler.filter((p) => p.status === "Achieved").length;
    const activeProje = totalProje - achievedProje;

    // Bekleyen aksiyonlar (tamamlanmamış)
    const myProjeIds = new Set(ws.myProjeler.map((p) => p.id));
    const pendingAks = aksiyonlar.filter((a) => myProjeIds.has(a.projeId) && a.status !== "Achieved").length;

    // Kontrol tarihi güncel olmayan
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const overdueReview = ws.myProjeler.filter((h) => {
      if (!h.reviewDate) return true;
      if (h.status === "Achieved" || h.status === "Cancelled") return false;
      return new Date(h.reviewDate) <= oneMonthAgo;
    }).length;

    items.push({ text: t("workspace.activeProjectsTracked", { count: activeProje }) });
    if (pendingAks > 0) items.push({ text: t("workspace.actionsAwaitingCompletion", { count: pendingAks }) });
    if (overdueReview > 0) items.push({ text: t("workspace.projectsNotReviewed", { count: overdueReview }), color: "text-amber-600" });

    return items;
  }, [ws, aksiyonlar]);

  return (
    <motion.div className="space-y-3 sm:space-y-5" variants={stagger} initial="hidden" animate="show">
      {/* ── Mobile Compact Header ── */}
      <motion.div variants={fadeUp} className="sm:hidden">
        <div className="rounded-2xl bg-white/60 dark:bg-tyro-surface/50 backdrop-blur-sm border border-tyro-border/30 px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h1 className="text-[15px] font-bold tracking-tight text-tyro-text-primary truncate">
            {t(getGreetingKey())}, {name.split(" ")[0]}
          </h1>
          {summaryItems.length > 0 && (
            <SummaryPills items={summaryItems} />
          )}
        </div>
      </motion.div>

      {/* ── Desktop Full Header (unchanged) ── */}
      <motion.div variants={fadeUp} className="hidden sm:block">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: brandColor }}>
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[18px] sm:text-[22px] font-extrabold tracking-tight text-tyro-text-primary">
                    {t(getGreetingKey())}, {name.split(" ")[0]}
                  </h1>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-tyro-gold/10 text-tyro-gold">
                    {department}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {summaryItems.map((item, i) => (
                <span key={i} className={`text-[12px] font-medium ${item.color ?? "text-tyro-text-secondary"}`}>
                  {i > 0 && <span className="text-tyro-border mr-3">·</span>}
                  {item.text}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start w-full sm:w-auto">
            <button
              type="button"
              onClick={openCommandPalette}
              className="inline-flex items-center gap-2 h-10 px-4 sm:px-5 flex-1 sm:flex-none sm:min-w-[220px] rounded-button border border-tyro-border bg-tyro-surface text-tyro-text-secondary hover:border-tyro-navy/20 transition-colors cursor-pointer"
            >
              <Search size={16} />
              <span className="text-[13px] text-tyro-text-muted">{t("common.search")}</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-tyro-bg border border-tyro-border text-[11px] font-mono text-tyro-text-muted ml-auto">
                ⌘K
              </kbd>
            </button>

            <motion.button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-10 w-10 rounded-xl border border-tyro-border bg-tyro-surface flex items-center justify-center cursor-pointer hover:bg-tyro-bg transition-colors shrink-0 disabled:opacity-50"
              whileTap={{ scale: 0.93 }}
              title={t("workspace.refreshData")}
            >
              <RefreshCw size={16} className={`text-tyro-text-secondary ${refreshing ? "animate-spin" : ""}`} />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="btn-expandable bg-gradient-to-r from-tyro-gold to-tyro-gold-light text-white font-semibold text-[13px] shadow-sm shadow-tyro-gold/20 cursor-pointer shrink-0"
              whileTap={{ scale: 0.95 }}
            >
              <Wand2 size={14} className="shrink-0" />
              <span>{t("kokpit.projectWizard")}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Row 1: Bento KPI (5) + Bireysel İlerleme (7) */}
      <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5"><div className="col-span-12 lg:col-span-5 h-48 rounded-2xl bg-tyro-surface animate-pulse" /><div className="col-span-12 lg:col-span-7 h-48 rounded-2xl bg-tyro-surface animate-pulse" /></div>}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 items-stretch">
          <motion.div variants={fadeUp} className="col-span-12 flex">
            <BentoKPI />
          </motion.div>
        </div>
      </Suspense>

      {/* Row 2: Bireysel Performans (12 — tam genişlik) */}
      <Suspense fallback={<div className="h-64 rounded-2xl bg-tyro-surface animate-pulse" />}>
        <motion.div variants={fadeUp}>
          <MyHedeflerList />
        </motion.div>
      </Suspense>

      {/* Wizard Panel */}
      <SlidingPanel
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title={t("wizard.title")}
        maxWidth={680}
        headerContent={<WizardHeader />}
      >
        {wizardOpen && <ProjeAksiyonWizard onClose={() => setWizardOpen(false)} />}
      </SlidingPanel>

      {/* ── Wizard FAB (mobile only) ── */}
      <AnimatePresence>
        {showFab && (
          <motion.button
            type="button"
            onClick={() => setWizardOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="fixed bottom-24 right-4 z-20 w-12 h-12 rounded-full backdrop-blur-[16px] backdrop-saturate-[1.4] border border-tyro-gold/30 shadow-[0_4px_24px_rgba(200,146,42,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] flex items-center justify-center cursor-pointer sm:hidden"
            style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(200,146,42,0.85), rgba(200,146,42,0.65) 70%)" }}
            whileTap={{ scale: 0.9 }}
            aria-label={t("kokpit.projectWizard")}
          >
            <Wand2 size={20} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
