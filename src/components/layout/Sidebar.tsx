import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  // House replaced with custom HomeIcon
  BarChart3,
  LayoutDashboard,
  Crosshair,
  CircleCheckBig,
  CalendarRange,
  GitBranch,
  GitMerge,
  Map,
  ChevronLeft,
  UsersRound,
  SlidersHorizontal,
  Shield,
  User,
  LogOut,
  Palette,
  Check,
  Pin,
  PinOff,
  Database,
  LifeBuoy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/uiStore";
import { TyroLogo } from "@/components/ui/TyroLogo";
import { HomeIcon } from "@/components/ui/HomeIcon";
import { useSidebarTheme, sidebarCSSVars } from "@/hooks/useSidebarTheme";
import { sidebarOnlyThemes, fullAppThemes } from "@/config/sidebarThemes";
import type { SidebarThemeId } from "@/config/sidebarThemes";
import { usePermissions } from "@/hooks/usePermissions";
import { getRoleLabel } from "@/lib/constants";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { RoleAvatar } from "@/components/ui/RoleAvatar";
import { clsx } from "clsx";
import { useMsal } from "@azure/msal-react";
import { setSupabaseUserContext } from "@/lib/supabase";

/** Animated mesh gradient blobs for mesh-style themes */
function MeshBlobs({ colors }: { colors: string[] }) {
  const blobPositions = [
    { top: "8%", left: "10%", delay: "0s", size: 140 },
    { top: "45%", right: "5%", delay: "-7s", size: 120 },
    { bottom: "15%", left: "30%", delay: "-13s", size: 130 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-sidebar">
      {colors.map((color, i) => {
        const pos = blobPositions[i % blobPositions.length];
        return (
          <div
            key={i}
            className="absolute rounded-full animate-[mesh-blob_20s_ease-in-out_infinite]"
            style={{
              width: pos.size,
              height: pos.size,
              background: color,
              filter: "blur(60px)",
              opacity: 0.35,
              top: pos.top,
              left: pos.left,
              right: pos.right,
              bottom: pos.bottom,
              animationDelay: pos.delay,
            }}
          />
        );
      })}
    </div>
  );
}

function getNavSections(t: (key: string) => string) {
  return [
    {
      title: t("sections.mainMenu"),
      items: [
        { id: "workspace", label: t("nav.home"), icon: HomeIcon, path: "/workspace", pageKey: "anasayfa" as const },
        { id: "stratejik-kokpit", label: t("nav.strategicHQ"), icon: LayoutDashboard, path: "/stratejik-kokpit", pageKey: "stratejikKokpit" as const },
        { id: "projeler", label: t("nav.objectives"), icon: Crosshair, path: "/projeler", pageKey: "projeler" as const },
        { id: "aksiyonlar", label: t("nav.actions"), icon: CircleCheckBig, path: "/aksiyonlar", pageKey: "aksiyonlar" as const },
      ],
    },
    {
      title: t("sections.views"),
      items: [
        { id: "dashboard", label: t("nav.kpi"), icon: BarChart3, path: "/dashboard", pageKey: "kpi" as const },
        { id: "strategy-map", label: "T-Map", icon: Map, path: "/strategy-map", pageKey: "tMap" as const },
        { id: "t-alignment", label: t("nav.tAlignment"), icon: GitMerge, path: "/t-alignment", pageKey: "projeler" as const },
        { id: "gantt", label: t("nav.gantt"), icon: CalendarRange, path: "/gantt", pageKey: "gantt" as const },
      ],
    },
    {
      title: t("sections.system"),
      items: [
        { id: "users", label: t("nav.users"), icon: UsersRound, path: "/kullanicilar", pageKey: "kullanicilar" as const },
        { id: "guvenlik", label: t("nav.security"), icon: Shield, path: "/guvenlik", pageKey: "guvenlik" as const },
        { id: "veri-yonetimi", label: t("nav.dataManagement"), icon: Database, path: "/veri-yonetimi", pageKey: "ayarlar" as const },
        { id: "settings", label: t("nav.settings"), icon: SlidersHorizontal, path: "/ayarlar", pageKey: "ayarlar" as const },
      ],
    },
  ];
}

/** Shared sidebar content used by both desktop and mobile drawer */
function SidebarContent({ collapsed, onNavigate, pinned, onTogglePin }: { collapsed: boolean; onNavigate?: () => void; pinned?: boolean; onTogglePin?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setMockLoggedIn, setSidebarTheme } = useUIStore();
  const theme = useSidebarTheme();
  const { canAccessPage } = usePermissions();
  const currentUser = useCurrentUser();
  const navSections = getNavSections(t);
  const [profileOpen, setProfileOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setThemePickerOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const { instance: msalInstance } = useMsal();
  const handleLogout = () => {
    setProfileOpen(false);
    setMockLoggedIn(false);
    // Clear the RLS identity header so subsequent requests are anonymous
    setSupabaseUserContext(null);
    // Clear MSAL session — use redirect on mobile, popup on desktop
    const isMob = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    if (isMob) {
      msalInstance.logoutRedirect({ postLogoutRedirectUri: "/" }).catch(() => {});
    } else {
      msalInstance.logoutPopup({ onRedirectNavigate: () => false }).catch(() => {});
    }
    onNavigate?.();
    navigate("/login");
  };

  const handleProfile = () => {
    setProfileOpen(false);
    onNavigate?.();
    navigate("/profil");
  };

  const handleNav = (path: string) => {
    onNavigate?.();
    navigate(path);
  };

  const handleThemeSelect = (id: SidebarThemeId) => {
    setSidebarTheme(id);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-3.5 py-[18px] pb-3.5 min-h-[60px]">
        <div className="w-9 h-9 shrink-0 flex items-center justify-center">
          <TyroLogo
            size={36}
            variant="sidebar"
            isDark={theme.isDark}
            accentColor={theme.isDark ? theme.accentColorLight : undefined}
            themeId={theme.id}
            themeColors={(theme.scope === "full" || theme.id === "arctic") ? {
              gradStart: theme.logoGradientStart,
              gradEnd: theme.logoGradientEnd,
              fillA: theme.logoFillA,
              fillB: theme.logoFillB,
              fillC: theme.logoFillC,
            } : undefined}
          />
        </div>
        <div
          className={clsx(
            "transition-all duration-300 flex-1 min-w-0",
            collapsed ? "opacity-0 w-0" : "opacity-100"
          )}
        >
          <span className="text-lg font-extrabold tracking-tight whitespace-nowrap">
            <span style={{ color: "var(--sb-brand-tyro)" }}>tyro</span>
            <span style={{ color: "var(--sb-brand-strategy)" }}>strategy</span>
          </span>
        </div>
        {/* Pin/Unpin button */}
        {onTogglePin && !collapsed && (
          <motion.button
            onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
            style={{
              backgroundColor: "transparent",
              color: pinned ? theme.brandTyro : theme.textPrimary,
              opacity: pinned ? 1 : 0.35,
            }}
            animate={pinned ? { rotate: [0, -30, 0], scale: [1, 1.2, 1] } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={{ scale: 1.15, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            title={pinned ? t("nav.unpinSidebar") : t("nav.pinSidebar")}
          >
            {pinned ? <Pin size={14} /> : <PinOff size={14} />}
          </motion.button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-1 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
        {navSections
          .map((section) => ({
            ...section,
            items: section.items.filter((item) =>
              !("pageKey" in item && item.pageKey) || canAccessPage(item.pageKey)
            ),
          }))
          .filter((section) => section.items.length > 0)
          .map((section) => (
          <div key={section.title}>
            <div
              className={clsx(
                "text-[11px] font-bold tracking-wider px-3 py-3 whitespace-nowrap overflow-hidden transition-all duration-300",
                collapsed && "opacity-0 h-2 py-1"
              )}
              style={{ color: "var(--sb-section-title)" }}
            >
              {section.title.toLocaleUpperCase('en-US')}
            </div>
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.path)}
                  title={collapsed ? item.label : undefined}
                  className={clsx(
                    "relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-button text-[13px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap overflow-hidden",
                    collapsed && "justify-center px-2.5"
                  )}
                  style={
                    isActive
                      ? { backgroundColor: "var(--sb-active-bg)", color: "var(--sb-active-text)", fontWeight: 600 }
                      : { color: "var(--sb-text-secondary)" }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "var(--sb-hover-bg)";
                      e.currentTarget.style.color = "var(--sb-hover-text)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--sb-text-secondary)";
                    }
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-[3px]"
                      style={{ backgroundColor: "var(--sb-active-bar)" }}
                    />
                  )}
                  <Icon size={18} className="shrink-0" />
                  <span
                    className={clsx(
                      "transition-all duration-300 overflow-hidden",
                      collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[180px]"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Profile Button — Apple style */}
      <div className="px-2.5 pb-3 mt-auto relative" ref={profileRef}>
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={clsx(
                "absolute bottom-full mb-2 z-50 rounded-[16px] p-1.5 backdrop-blur-xl",
                collapsed ? "left-1/2 -translate-x-1/2 w-12" : "left-2.5 right-2.5"
              )}
              style={{
                backgroundColor: "var(--sb-popover-bg)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "var(--sb-popover-border)",
                boxShadow: theme.popoverShadow,
              }}
            >
              {/* Profil */}
              <button
                title={collapsed ? t("nav.profile") : undefined}
                onClick={handleProfile}
                className={clsx(
                  "w-full flex items-center gap-2.5 py-2.5 rounded-[10px] font-medium transition-colors cursor-pointer",
                  collapsed ? "justify-center px-0" : "px-3 text-[13px]"
                )}
                style={{ color: "var(--sb-text-primary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sb-popover-hover-bg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <User size={16} className="shrink-0" style={{ color: "var(--sb-active-text)" }} />
                {!collapsed && t("nav.profile")}
              </button>

              {/* Divider */}
              {!collapsed && (
                <div className="mx-2 my-0.5 h-px" style={{ backgroundColor: "var(--sb-popover-divider)" }} />
              )}

              {/* Yardım */}
              <button
                title={collapsed ? t("nav.help") : undefined}
                onClick={() => { handleNav("/yardim"); setProfileOpen(false); }}
                className={clsx(
                  "w-full flex items-center gap-2.5 py-2.5 rounded-[10px] font-medium transition-colors cursor-pointer",
                  collapsed ? "justify-center px-0" : "px-3 text-[13px]"
                )}
                style={{ color: "var(--sb-text-primary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sb-popover-hover-bg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <LifeBuoy size={16} className="shrink-0" style={{ color: "var(--sb-active-text)" }} />
                {!collapsed && t("nav.help")}
              </button>

              {/* Divider */}
              {!collapsed && (
                <div className="mx-2 my-0.5 h-px" style={{ backgroundColor: "var(--sb-popover-divider)" }} />
              )}

              {/* Theme Selector */}
              {!collapsed && (
                <div>
                  <button
                    onClick={() => setThemePickerOpen((prev) => !prev)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] font-medium text-[13px] transition-colors cursor-pointer"
                    style={{ color: "var(--sb-text-primary)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sb-popover-hover-bg)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <Palette size={16} className="shrink-0" style={{ color: "var(--sb-active-text)" }} />
                    {t("nav.theme")}
                    <ChevronLeft
                      size={12}
                      className={clsx(
                        "ml-auto shrink-0 transition-transform duration-200",
                        themePickerOpen ? "-rotate-90" : "rotate-0"
                      )}
                      style={{ color: "var(--sb-text-muted)" }}
                    />
                  </button>

                  <AnimatePresence>
                    {themePickerOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pt-1.5 pb-2">
                          {/* Sidebar-only themes */}
                          <p
                            className="text-[11px] font-bold tracking-wider mb-1.5"
                            style={{ color: "var(--sb-text-muted)" }}
                          >
                            {t("nav.sidebarTheme").toLocaleUpperCase('en-US')}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {sidebarOnlyThemes.map((t) => {
                              const isSelected = theme.id === t.id;
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => handleThemeSelect(t.id)}
                                  title={t.label}
                                  className={clsx(
                                    "relative w-6 h-6 rounded-full cursor-pointer transition-all duration-200",
                                    isSelected ? "scale-110" : "hover:scale-105"
                                  )}
                                  style={{
                                    background: t.glass ? t.previewColor : (t.bgGradient || t.bg),
                                    boxShadow: isSelected
                                      ? `0 0 0 2px var(--sb-popover-bg), 0 0 0 4px var(--sb-active-bar)`
                                      : `inset 0 0 0 1px rgba(0,0,0,0.1)`,
                                  }}
                                >
                                  {isSelected && (
                                    <Check
                                      size={12}
                                      className="absolute inset-0 m-auto"
                                      style={{ color: t.isDark ? "#fff" : "#1e3a5f" }}
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Divider between sidebar and full themes */}
                          <div
                            className="my-2.5 h-px"
                            style={{ backgroundColor: "var(--sb-popover-divider)" }}
                          />

                          {/* Full app themes */}
                          <p
                            className="text-[11px] font-bold tracking-wider mb-1.5"
                            style={{ color: "var(--sb-text-muted)" }}
                          >
                            {t("nav.appTheme").toLocaleUpperCase('en-US')}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {fullAppThemes.map((t) => {
                              const isSelected = theme.id === t.id;
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => handleThemeSelect(t.id)}
                                  title={t.label}
                                  className={clsx(
                                    "relative w-6 h-6 rounded-full cursor-pointer transition-all duration-200",
                                    isSelected ? "scale-110" : "hover:scale-105"
                                  )}
                                  style={{
                                    background: t.glass ? t.previewColor : (t.bgGradient || t.bg),
                                    boxShadow: isSelected
                                      ? `0 0 0 2px var(--sb-popover-bg), 0 0 0 4px var(--sb-active-bar)`
                                      : `inset 0 0 0 1px rgba(0,0,0,0.1)`,
                                  }}
                                >
                                  {isSelected && (
                                    <Check
                                      size={12}
                                      className="absolute inset-0 m-auto"
                                      style={{ color: t.isDark ? "#fff" : "#1e3a5f" }}
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Divider */}
              {!collapsed && (
                <div className="mx-2 my-0.5 h-px" style={{ backgroundColor: "var(--sb-popover-divider)" }} />
              )}

              {/* Logout */}
              <button
                title={collapsed ? t("nav.logout") : undefined}
                onClick={handleLogout}
                className={clsx(
                  "w-full flex items-center gap-2.5 py-2.5 rounded-[10px] font-medium text-tyro-danger hover:bg-tyro-danger/[0.06] transition-colors cursor-pointer",
                  collapsed ? "justify-center px-0" : "px-3 text-[13px]"
                )}
              >
                <LogOut size={16} className="shrink-0" />
                {!collapsed && t("nav.logout")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setProfileOpen((prev) => !prev)}
          className={clsx(
            "w-full flex items-center gap-2.5 p-2 rounded-[14px] cursor-pointer transition-all duration-200",
            "active:scale-[0.98]"
          )}
          style={{ backgroundColor: "var(--sb-profile-hover-bg)" }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          {/* Avatar with role border */}
          <div className="shrink-0">
            <RoleAvatar
              name={currentUser.name}
              role={currentUser.role}
              size="sm"
              innerBg={theme.isDark ? theme.bg : undefined}
              innerText={theme.isDark ? theme.textPrimary : undefined}
              accentColor={theme.isDark ? theme.activeBar : undefined}
            />
          </div>

          {/* Name + role */}
          <div
            className={clsx(
              "overflow-hidden whitespace-nowrap transition-all duration-300 text-left flex-1 min-w-0",
              collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[140px]"
            )}
          >
            <h4 className="text-[13px] font-semibold truncate" style={{ color: "var(--sb-text-primary)" }}>{currentUser.name}</h4>
            <p className="text-[11px] font-medium truncate" style={{ color: "var(--sb-text-muted)" }}>{getRoleLabel(currentUser.role, t)}</p>
          </div>

          {/* Chevron indicator */}
          <ChevronLeft
            size={14}
            className={clsx(
              "shrink-0 transition-all duration-200",
              collapsed ? "opacity-0 w-0" : "opacity-60 rotate-90",
              profileOpen && "!-rotate-90"
            )}
            style={{ color: "var(--sb-text-muted)" }}
          />
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const mobileDrawerOpen = useUIStore((s) => s.mobileDrawerOpen);
  const closeMobileDrawer = useUIStore((s) => s.closeMobileDrawer);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const collapsed = !hovered && !pinned;
  const theme = useSidebarTheme();
  const vars = sidebarCSSVars(theme);

  return (
    <>
      {/* Desktop sidebar — expands on hover */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={clsx(
          "group relative hidden lg:flex flex-col rounded-sidebar m-3 mr-0 overflow-visible shrink-0 transition-all",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
        style={{
          ...vars,
          background: theme.bgGradient || theme.bg,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "var(--sb-border)",
          boxShadow: hovered && theme.gradBorder ? theme.gradBorder.glow : theme.shadow,
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          transitionDuration: "300ms",
          ...(theme.glass ? {
            backdropFilter: theme.glass.backdropFilter,
            WebkitBackdropFilter: theme.glass.backdropFilter,
          } : {}),
        }}
      >
        {theme.meshBlobs && <MeshBlobs colors={theme.meshBlobs.colors} />}
        {/* Gradient border glow for frosted themes */}
        {theme.gradBorder && (
          <div
            className="absolute inset-0 rounded-sidebar pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-500 grad-border-mask"
            style={{
              background: theme.gradBorder.gradient,
            }}
          />
        )}
        <SidebarContent collapsed={collapsed} pinned={pinned} onTogglePin={() => setPinned(!pinned)} />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileDrawer}
            />
            <motion.div
              className="fixed top-0 left-0 bottom-0 z-50 w-[280px] flex flex-col lg:hidden overflow-y-auto overflow-x-hidden"
              style={{
                ...vars,
                background: theme.bgGradient || theme.bg,
                boxShadow: theme.shadow,
                ...(theme.glass ? {
                  backdropFilter: theme.glass.backdropFilter,
                  WebkitBackdropFilter: theme.glass.backdropFilter,
                } : {}),
              }}
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {theme.meshBlobs && <MeshBlobs colors={theme.meshBlobs.colors} />}
              <SidebarContent collapsed={false} onNavigate={closeMobileDrawer} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
