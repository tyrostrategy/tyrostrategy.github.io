import { useState, useRef, useEffect, useLayoutEffect, useCallback, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { HomeIcon } from "@/components/ui/HomeIcon";
import { useDataStore } from "@/stores/dataStore";
import {
  BarChart3,
  Target,
  ListChecks,
  MoreHorizontal,
  GanttChart,
  GitMerge,
  Network,
  Users,
  Settings,
  Map,
} from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { usePermissions } from "@/hooks/usePermissions";

/* ─── Dock magnification config ─── */
const DOCK_ICON_SIZE = 22;      // base icon size
const DOCK_ICON_MAX = 32;       // max icon size when hovered
const DOCK_DISTANCE = 100;      // px radius of magnification effect

function useDockMagnification(mouseX: ReturnType<typeof useMotionValue>, ref: React.RefObject<HTMLButtonElement | null>) {
  const distance = useTransform(mouseX, (val: number) => {
    const el = ref.current;
    if (!el || val < 0) return DOCK_DISTANCE + 1; // out of range
    const rect = el.getBoundingClientRect();
    return Math.abs(val - (rect.left + rect.width / 2));
  });

  const sizeRaw = useTransform(distance, [0, DOCK_DISTANCE], [DOCK_ICON_MAX, DOCK_ICON_SIZE]);
  const size = useSpring(sizeRaw, { mass: 0.1, stiffness: 200, damping: 15 });

  return size;
}

function DockItem({
  item,
  active,
  accentColor,
  mouseX,
  riskCount,
  onClick,
}: {
  item: { id: string; label: string; icon: any; path: string };
  active: boolean;
  accentColor: string;
  mouseX: ReturnType<typeof useMotionValue>;
  riskCount?: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const size = useDockMagnification(mouseX, ref);
  const Icon = item.icon;

  return (
    <button
      ref={ref}
      data-nav-item
      onClick={onClick}
      className="relative z-10 flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-0.5 cursor-pointer touch-none"
    >
      <motion.div
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
        animate={active ? { y: -3 } : { y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Icon
          size="100%"
          strokeWidth={active ? 2.5 : 1.8}
          className="transition-colors duration-200"
          style={{ color: active ? accentColor : undefined }}
        />
      </motion.div>
      {item.id === "aksiyonlar" && riskCount && riskCount > 0 && (
        <span className="absolute -top-0.5 right-0 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
          {riskCount}
        </span>
      )}
      <motion.span
        animate={{ opacity: active ? 1 : 0.5, scale: active ? 1 : 0.95 }}
        transition={{ duration: 0.2 }}
        className="text-[11px] font-semibold leading-tight"
        style={{ color: active ? accentColor : undefined }}
      >
        {item.label}
      </motion.span>
    </button>
  );
}

export default function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useSidebarTheme();

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
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const accentColor = theme.accentColor;

  const filteredMainItems = mainItems.filter(
    (item) => !("pageKey" in item && item.pageKey) || canAccessPage(item.pageKey)
  );
  const filteredMoreItems = moreItems.filter(
    (item) => !("pageKey" in item && item.pageKey) || canAccessPage(item.pageKey)
  );

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = filteredMoreItems.some((item) => location.pathname === item.path);

  const allNavItems = [...filteredMainItems, ...(filteredMoreItems.length > 0 ? [{ id: "more", label: t("common.viewAll"), icon: MoreHorizontal, path: "__more__" }] : [])];
  const activeIndex = filteredMainItems.findIndex((item) => isActive(item.path));
  const moreIndex = filteredMainItems.length;
  const resolvedIndex = activeIndex >= 0 ? activeIndex : isMoreActive ? moreIndex : -1;

  // Mouse X for dock magnification
  const mouseX = useMotionValue(-1);

  const handlePointerMove = (e: ReactPointerEvent) => {
    mouseX.set(e.clientX);
  };

  const handlePointerLeave = () => {
    mouseX.set(-1);
  };

  // Measure active tab position for sliding indicator
  const measureIndicator = useCallback(() => {
    if (resolvedIndex < 0 || !navRef.current) return;
    const buttons = navRef.current.querySelectorAll<HTMLButtonElement>("[data-nav-item]");
    const btn = buttons[resolvedIndex];
    if (btn) {
      const navRect = navRef.current.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const center = btnRect.left - navRect.left + btnRect.width / 2;
      setIndicatorStyle({ left: center - 12, width: 24 });
    }
  }, [resolvedIndex]);

  // Use layoutEffect for immediate measurement after DOM paint
  useLayoutEffect(() => {
    measureIndicator();
    // Re-measure after fonts/layout settle
    const t = setTimeout(measureIndicator, 100);
    return () => clearTimeout(t);
  }, [measureIndicator]);

  // Re-measure on resize (dock magnification changes sizes)
  useEffect(() => {
    if (!navRef.current) return;
    const ro = new ResizeObserver(() => measureIndicator());
    ro.observe(navRef.current);
    return () => ro.disconnect();
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
            className="fixed inset-0 z-20 bg-black/10 backdrop-blur-[1px] lg:hidden"
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
              className="absolute bottom-full right-2 mb-2 w-48 bg-tyro-surface/95 backdrop-blur-xl rounded-2xl border border-tyro-border/50 shadow-tyro-lg p-1.5"
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                      active
                        ? "font-semibold"
                        : "text-tyro-text-secondary hover:bg-tyro-bg active:scale-[0.97]"
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

        {/* Bottom nav bar — macOS Dock style floating pill */}
        <div className="mx-3 mb-2 rounded-2xl bg-tyro-surface/70 backdrop-blur-2xl border border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.08)]">
          <div
            ref={navRef}
            className="relative flex items-end justify-around px-1 h-16 pb-1"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            {/* Sliding dot indicator under active icon */}
            {resolvedIndex >= 0 && (
              <motion.div
                className="absolute bottom-1 h-[3px] rounded-full"
                style={{ backgroundColor: accentColor }}
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                transition={{ type: "spring", damping: 28, stiffness: 350, mass: 0.8 }}
              />
            )}

            {allNavItems.map((item) => {
              const isMore = item.path === "__more__";
              const active = isMore ? (isMoreActive || moreOpen) : isActive(item.path);

              return (
                <DockItem
                  key={item.id}
                  item={item}
                  active={active}
                  accentColor={accentColor}
                  mouseX={mouseX}
                  riskCount={item.id === "aksiyonlar" ? riskCount : undefined}
                  onClick={() => isMore ? setMoreOpen((prev) => !prev) : handleNavigate(item.path)}
                />
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
