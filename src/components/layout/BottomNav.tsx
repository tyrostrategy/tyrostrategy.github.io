import { useState, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { HomeIcon } from "@/components/ui/HomeIcon";
import { BarChart3, MoreHorizontal, Map, UserCircle2, LifeBuoy } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { usePermissions } from "@/hooks/usePermissions";

export default function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useSidebarTheme();
  const accentColor = theme.accentColor ?? "#c8922a";

  const mainItems = [
    { id: "workspace", label: t("nav.home"), icon: HomeIcon, path: "/workspace", pageKey: "anasayfa" as const },
    { id: "stratejik-kokpit", label: t("nav.strategicHQ"), icon: Map, path: "/stratejik-kokpit", pageKey: "stratejikKokpit" as const },
    { id: "dashboard", label: t("nav.kpi"), icon: BarChart3, path: "/dashboard", pageKey: "kpi" as const },
    { id: "profil", label: t("nav.profile"), icon: UserCircle2, path: "/profil" },
  ];

  const moreItems = [
    { id: "yardim", label: t("nav.help"), icon: LifeBuoy, path: "/yardim" },
  ] as typeof mainItems;
  const { canAccessPage } = usePermissions();
  const [moreOpen, setMoreOpen] = useState(false);
  const [pressing, setPressing] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const filteredMainItems = mainItems.filter(
    (item) => !("pageKey" in item && item.pageKey) || canAccessPage(item.pageKey)
  );
  const filteredMoreItems = moreItems.filter(
    (item) => !("pageKey" in item && item.pageKey) || canAccessPage(item.pageKey)
  );

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = filteredMoreItems.some((item) => location.pathname === item.path);
  const allNavItems = [...filteredMainItems, ...(filteredMoreItems.length > 0 ? [{ id: "more", label: t("common.viewAll"), icon: MoreHorizontal, path: "__more__" }] : [])];

  // --- Droplet resting state (subtle, calm) ---
  const dropletRest = useMemo(() => ({
    background: `radial-gradient(ellipse at 50% 30%, ${accentColor}18, ${accentColor}0a 60%, transparent 100%)`,
    boxShadow: `
      0 2px 12px ${accentColor}12,
      inset 0 -2px 5px ${accentColor}08,
      inset 0 1.5px 3px rgba(255,255,255,0.6)
    `,
    border: `1px solid ${accentColor}12`,
  }), [accentColor]);

  // --- Droplet pressed state (loupe/magnify — brighter, stronger glow) ---
  const dropletPressed = useMemo(() => ({
    background: `radial-gradient(ellipse at 50% 25%, ${accentColor}40, ${accentColor}20 50%, ${accentColor}08 80%, transparent 100%)`,
    boxShadow: `
      0 4px 28px ${accentColor}35,
      0 0 48px ${accentColor}15,
      inset 0 -3px 8px ${accentColor}18,
      inset 0 2px 5px rgba(255,255,255,0.8)
    `,
    border: `1.5px solid ${accentColor}25`,
  }), [accentColor]);

  // Top glint
  const highlightStyle = useMemo(() => ({
    background: `radial-gradient(ellipse at 50% 25%, rgba(255,255,255,0.85), rgba(255,255,255,0.1) 65%, transparent 85%)`,
  }), []);

  // Transition flash
  const glowFlashStyle = useMemo(() => ({
    background: `radial-gradient(circle, ${accentColor}40, transparent 70%)`,
  }), [accentColor]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setMoreOpen(false);
  }, [navigate]);

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
        className="fixed bottom-3 left-4 right-4 z-30 lg:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* More menu popup */}
        <AnimatePresence>
          {moreOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-full right-0 mb-2 w-52 bg-white/60 dark:bg-tyro-surface/50 backdrop-blur-[40px] backdrop-saturate-[1.8] rounded-2xl border border-white/30 dark:border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4)] p-1.5"
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

        {/* ── Liquid Glass Bottom Tab Bar ── */}
        <div className="bg-white/40 dark:bg-tyro-surface/30 backdrop-blur-[40px] backdrop-saturate-[1.8] rounded-[20px] border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(255,255,255,0.3),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div
            ref={navRef}
            className="relative flex items-center justify-around h-[68px] px-1"
          >
            {allNavItems.map((item) => {
              const isMore = item.path === "__more__";
              const active = isMore ? (isMoreActive || moreOpen) : isActive(item.path);
              const Icon = item.icon;
              const isPressed = pressing === item.id;

              return (
                <motion.button
                  key={item.id}
                  data-nav-item
                  onClick={() => isMore ? setMoreOpen((prev) => !prev) : handleNavigate(item.path)}
                  onTapStart={() => setPressing(item.id)}
                  onTap={() => setPressing(null)}
                  onTapCancel={() => setPressing(null)}
                  className="relative flex flex-col items-center justify-center flex-1 h-full cursor-pointer select-none"
                >
                  {/* ── Water Droplet Capsule ── */}
                  {active && (
                    <motion.div
                      layoutId="liquid-droplet"
                      className="absolute -z-10 rounded-[18px]"
                      style={{
                        inset: "6px 10px",
                        ...(isPressed ? dropletPressed : dropletRest),
                      }}
                      animate={{
                        scale: isPressed ? 1.12 : 1,
                      }}
                      transition={{
                        layout: { type: "spring", stiffness: 350, damping: 22, mass: 0.7 },
                        scale: { type: "spring", stiffness: 500, damping: 18 },
                      }}
                    >
                      {/* Specular highlight — brighter on press (loupe flash) */}
                      <motion.div
                        className="absolute top-[1px] left-[18%] right-[18%] h-[38%] rounded-full pointer-events-none"
                        style={highlightStyle}
                        animate={{ opacity: isPressed ? 1 : 0.6 }}
                        transition={{ duration: 0.15 }}
                      />
                    </motion.div>
                  )}

                  {/* Glow flash — only during transition, fades out */}
                  {active && (
                    <motion.div
                      key={item.id + "-glow"}
                      className="absolute inset-0 -z-20 rounded-[18px] pointer-events-none"
                      style={glowFlashStyle}
                      initial={{ opacity: 0.9, scale: 1.4 }}
                      animate={{ opacity: 0, scale: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  )}

                  {/* Icon — loupe magnify on press */}
                  <motion.div
                    animate={{
                      scale: isPressed && active ? 1.35 : active ? 1.08 : 1,
                      y: isPressed && active ? -3 : active ? -1 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  >
                    <Icon
                      size={active ? 22 : 20}
                      strokeWidth={active ? 2 : 1.5}
                      className="transition-colors duration-150"
                      style={{
                        color: active ? accentColor : "var(--tyro-text-muted)",
                        opacity: active ? 1 : 0.5,
                      }}
                    />
                  </motion.div>

                  {/* Label — loupe magnify on press */}
                  <motion.span
                    animate={{
                      opacity: isPressed && active ? 1 : active ? 1 : 0.4,
                      y: isPressed && active ? 1 : active ? 0 : -1,
                      scale: isPressed && active ? 1.15 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className={`mt-0.5 leading-none whitespace-nowrap ${
                      active ? "text-[10px] font-semibold" : "text-[9px] font-medium"
                    }`}
                    style={{
                      color: active ? accentColor : "var(--tyro-text-muted)",
                    }}
                  >
                    {item.label}
                  </motion.span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
