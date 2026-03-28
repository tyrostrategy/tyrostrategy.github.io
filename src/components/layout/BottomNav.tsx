import { useState, useRef, useLayoutEffect, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { HomeIcon } from "@/components/ui/HomeIcon";
import { useDataStore } from "@/stores/dataStore";
import {
  BarChart3, Target, ListChecks, MoreHorizontal,
  GanttChart, GitMerge, Users, Settings, Map,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { usePermissions } from "@/hooks/usePermissions";

export default function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useSidebarTheme();
  const accentColor = theme.accentColor ?? "#c8922a";

  const mainItems = [
    { id: "workspace", label: t("nav.home"), icon: HomeIcon, path: "/workspace" },
    { id: "projeler", label: t("nav.objectives"), icon: Target, path: "/projeler", pageKey: "projeler" as const },
    { id: "aksiyonlar", label: t("nav.actions"), icon: ListChecks, path: "/aksiyonlar", pageKey: "aksiyonlar" as const },
  ];

  const moreItems = [
    { id: "dashboard", label: t("nav.kpi"), icon: BarChart3, path: "/dashboard", pageKey: "kpi" as const },
    { id: "stratejik-kokpit", label: t("nav.strategicHQ"), icon: Map, path: "/stratejik-kokpit", pageKey: "stratejikKokpit" as const },
    { id: "t-alignment", label: t("nav.tAlignment"), icon: GitMerge, path: "/t-alignment", pageKey: "projeler" as const },
    { id: "gantt", label: t("nav.gantt"), icon: GanttChart, path: "/gantt", pageKey: "gantt" as const },
    { id: "users", label: t("nav.users"), icon: Users, path: "/kullanicilar", pageKey: "kullanicilar" as const },
    { id: "settings", label: t("nav.settings"), icon: Settings, path: "/ayarlar", pageKey: "ayarlar" as const },
  ];

  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const { canAccessPage } = usePermissions();
  const riskCount = aksiyonlar.filter((a) => a.status === "Behind" || a.status === "At Risk").length;
  const [moreOpen, setMoreOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorX, setIndicatorX] = useState(0);

  const filteredMainItems = mainItems.filter(
    (item) => !("pageKey" in item && item.pageKey) || canAccessPage(item.pageKey)
  );
  const filteredMoreItems = moreItems.filter(
    (item) => !("pageKey" in item && item.pageKey) || canAccessPage(item.pageKey)
  );

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = filteredMoreItems.some((item) => location.pathname === item.path);

  const allNavItems = [...filteredMainItems, ...(filteredMoreItems.length > 0 ? [{ id: "more", label: t("common.viewAll"), icon: MoreHorizontal, path: "__more__" }] : [])];
  const activeIndex = allNavItems.findIndex((item) => item.path === "__more__" ? (isMoreActive || moreOpen) : isActive(item.path));

  // Measure active tab center for blob indicator
  const measureIndicator = useCallback(() => {
    if (activeIndex < 0 || !navRef.current) return;
    const buttons = navRef.current.querySelectorAll<HTMLButtonElement>("[data-nav-item]");
    const btn = buttons[activeIndex];
    if (btn) {
      const navRect = navRef.current.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorX(btnRect.left - navRect.left + btnRect.width / 2);
    }
  }, [activeIndex]);

  useLayoutEffect(() => {
    measureIndicator();
    const t = setTimeout(measureIndicator, 50);
    return () => clearTimeout(t);
  }, [measureIndicator]);

  useEffect(() => {
    window.addEventListener("resize", measureIndicator);
    return () => window.removeEventListener("resize", measureIndicator);
  }, [measureIndicator]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setMoreOpen(false);
  };

  return (
    <>
      {/* More menu backdrop */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="fixed inset-0 z-20 bg-black/20 backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* More menu popup */}
        <AnimatePresence>
          {moreOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-full right-3 mb-2 w-52 bg-white/95 dark:bg-tyro-surface/95 backdrop-blur-2xl rounded-2xl border border-white/30 dark:border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.15)] p-1.5"
            >
              {filteredMoreItems.map((item, i) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                      active ? "font-semibold" : "text-tyro-text-secondary active:bg-tyro-bg"
                    }`}
                    style={active ? { color: accentColor, backgroundColor: `${accentColor}12` } : undefined}
                  >
                    <Icon size={18} />
                    {item.label}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── WhatsApp-style Bottom Tab Bar ── */}
        <div className="bg-white/80 dark:bg-tyro-surface/80 backdrop-blur-2xl border-t border-tyro-border/20">
          <div
            ref={navRef}
            className="relative flex items-center justify-around h-[56px]"
          >
            {/* Top edge indicator — WhatsApp style thick rounded bar */}
            {activeIndex >= 0 && (
              <motion.div
                className="absolute top-0 h-[3px] rounded-b-full"
                style={{ backgroundColor: accentColor, width: 28 }}
                animate={{ left: indicatorX - 14 }}
                transition={{ type: "spring", damping: 25, stiffness: 350, mass: 0.6 }}
              />
            )}

            {allNavItems.map((item) => {
              const isMore = item.path === "__more__";
              const active = isMore ? (isMoreActive || moreOpen) : isActive(item.path);
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  data-nav-item
                  onClick={() => isMore ? setMoreOpen((prev) => !prev) : handleNavigate(item.path)}
                  className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer active:scale-95 transition-transform"
                >
                  {/* Badge */}
                  {item.id === "aksiyonlar" && riskCount > 0 && (
                    <span className="absolute top-1.5 right-[calc(50%-18px)] min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center z-10">
                      {riskCount}
                    </span>
                  )}

                  {/* Icon with transition */}
                  <motion.div
                    animate={{
                      scale: active ? 1.1 : 1,
                      y: active ? -1 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.5 : 1.7}
                      className="transition-colors duration-200"
                      style={{ color: active ? accentColor : "var(--tyro-text-muted)" }}
                    />
                  </motion.div>

                  {/* Label */}
                  <span
                    className="text-[10px] font-semibold leading-tight transition-colors duration-200"
                    style={{ color: active ? accentColor : "var(--tyro-text-muted)" }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
