import { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Sparkles, Wand2 } from "lucide-react";
import { useMyWorkspace } from "@/hooks/useMyWorkspace";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUIStore } from "@/stores/uiStore";
import SlidingPanel from "@/components/shared/SlidingPanel";
// Lazy load heavy components
const MyHedeflerList = lazy(() => import("@/components/workspace/MyProjectsList"));
const UpcomingDeadlines = lazy(() => import("@/components/workspace/UpcomingDeadlines"));
const MyProgressWidget = lazy(() => import("@/components/workspace/MyProgressWidget"));
const BentoKPI = lazy(() => import("@/components/workspace/BentoKPI"));
import HedefAksiyonWizard from "@/components/wizard/HedefAksiyonWizard";
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

export default function WorkspacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { name, department, initials } = useCurrentUser();
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const ws = useMyWorkspace();
  const [wizardOpen, setWizardOpen] = useState(false);

  const summaryText = useMemo(() => {
    const parts: string[] = [];
    if (ws.myHedefler.length > 0) parts.push(`${ws.myHedefler.length} ${t("workspace.objectivesCount")}`);
    if (ws.achievedAksiyonlar > 0) parts.push(`${ws.achievedAksiyonlar} ${t("workspace.actionsCompleted")}`);
    if (ws.behindAksiyonlar + ws.atRiskAksiyonlar > 0)
      parts.push(`${ws.behindAksiyonlar + ws.atRiskAksiyonlar} ${t("workspace.actionsNeedAttention")}`);
    return parts.length > 0 ? parts.join(", ") + "." : t("common.noResults");
  }, [ws, t]);

  return (
    <motion.div className="space-y-3 sm:space-y-5" variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-tyro-navy flex items-center justify-center text-white text-sm font-bold shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-[18px] sm:text-[22px] font-extrabold tracking-tight text-tyro-text-primary">
                  {t(getGreetingKey())}, {name.split(" ")[0]}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-tyro-gold/10 text-tyro-gold">
                    {department}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-tyro-text-secondary">{summaryText}</p>
          </div>

          <div className="flex items-center gap-2 self-start w-full sm:w-auto">
            {/* Search button */}
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

            {/* Wizard trigger button — right of search */}
            <motion.button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="btn-expandable bg-gradient-to-r from-tyro-gold to-tyro-gold-light text-white font-semibold text-[13px] shadow-sm shadow-tyro-gold/20 cursor-pointer shrink-0"
              whileTap={{ scale: 0.95 }}
            >
              <Wand2 size={14} className="shrink-0" />
              <span>Hedef Sihirbazı</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Row 1: Yaklaşan Tarihler (6) + Bireysel İlerleme (3) + Bento KPI (3) */}
      <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5"><div className="col-span-12 lg:col-span-6 h-48 rounded-2xl bg-tyro-surface animate-pulse" /><div className="col-span-12 lg:col-span-3 h-48 rounded-2xl bg-tyro-surface animate-pulse" /><div className="col-span-12 lg:col-span-3 h-48 rounded-2xl bg-tyro-surface animate-pulse" /></div>}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 items-stretch">
          <motion.div variants={fadeUp} className="col-span-12 lg:col-span-6 flex">
            <UpcomingDeadlines />
          </motion.div>
          <motion.div variants={fadeUp} className="col-span-12 lg:col-span-3 flex">
            <MyProgressWidget />
          </motion.div>
          <motion.div variants={fadeUp} className="col-span-12 lg:col-span-3 flex">
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
        {wizardOpen && <HedefAksiyonWizard onClose={() => setWizardOpen(false)} />}
      </SlidingPanel>
    </motion.div>
  );
}
