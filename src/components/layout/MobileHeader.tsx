import { useState } from "react";
import { Menu, Search, RefreshCw } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useTranslation } from "react-i18next";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}

export default function MobileHeader() {
  const { t } = useTranslation();
  const toggleMobileDrawer = useUIStore((s) => s.toggleMobileDrawer);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const workspaceRefreshFn = useUIStore((s) => s.workspaceRefreshFn);
  const theme = useSidebarTheme();
  const [refreshing, setRefreshing] = useState(false);

  const dark = theme.isDark;
  const bgRgb = hexToRgb(theme.bg);
  const accentRgb = hexToRgb(theme.accentColor);

  // ── Header glass background: tinted with sidebar color ──
  const headerStyle: React.CSSProperties = {
    height: 56,
    background: dark
      ? `linear-gradient(180deg, rgba(${bgRgb}, 0.78) 0%, rgba(${bgRgb}, 0.62) 100%)`
      : `linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(${bgRgb}, 0.18) 100%)`,
    backdropFilter: "blur(32px) saturate(190%)",
    WebkitBackdropFilter: "blur(32px) saturate(190%)",
    border: `0.5px solid ${dark ? `rgba(255,255,255,0.1)` : `rgba(${accentRgb}, 0.12)`}`,
    boxShadow: dark
      ? `inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.35)`
      : `inset 0 1px 0 rgba(255,255,255,0.65), 0 4px 20px rgba(${accentRgb}, 0.06)`,
    transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
  };

  // ── Button pill style ──
  const btnStyle: React.CSSProperties = {
    borderRadius: 12,
    background: dark
      ? `rgba(255,255,255,0.08)`
      : `rgba(255,255,255,0.55)`,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: `0.5px solid ${dark ? "rgba(255,255,255,0.12)" : `rgba(${accentRgb}, 0.15)`}`,
    boxShadow: dark
      ? "0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)"
      : `0 2px 8px rgba(${accentRgb}, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)`,
    color: dark ? theme.textPrimary : theme.accentColor,
    transition: "all 0.3s ease",
  };

  // ── Glass sheen overlay ──
  const sheenBg = dark
    ? `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 50%)`
    : `linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.08) 50%, transparent 100%)`;

  // ── Droplet orb — accent colored ──
  const orbBg = dark
    ? `radial-gradient(ellipse at 50% 40%, rgba(${accentRgb}, 0.15) 0%, transparent 70%)`
    : `radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.6) 0%, rgba(${accentRgb}, 0.06) 50%, transparent 100%)`;

  const handleRefresh = async () => {
    if (!workspaceRefreshFn || refreshing) return;
    setRefreshing(true);
    try { await workspaceRefreshFn(); } finally { setRefreshing(false); }
  };

  return (
    <header className="fixed top-2 left-3 right-3 z-30 lg:hidden" style={{ ...headerStyle, borderRadius: 20, overflow: "hidden" }}>
      {/* Sheen */}
      <div aria-hidden style={{ position: "absolute", inset: 0, background: sheenBg, pointerEvents: "none", borderRadius: "inherit" }} />

      {/* Orb */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -14,
          left: "50%",
          transform: "translateX(-50%)",
          width: 140,
          height: 44,
          background: orbBg,
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />

      <div className="relative flex items-center justify-between h-full px-4">
        {/* Hamburger */}
        <button
          type="button"
          onClick={toggleMobileDrawer}
          className="flex items-center justify-center w-9 h-9 -ml-0.5 cursor-pointer"
          style={btnStyle}
          aria-label={t("common.openMenu")}
        >
          <Menu size={17} strokeWidth={2.2} />
        </button>

        {/* Logo */}
        <span className="text-[17px] font-extrabold tracking-normal select-none" style={{ transition: "all 0.4s ease" }}>
          <span style={{ color: theme.brandTyro, transition: "color 0.4s ease", textShadow: dark ? "none" : `0 1px 3px rgba(${accentRgb}, 0.12)` }}>
            tyro
          </span>
          <span style={{ color: theme.brandStrategy, transition: "color 0.4s ease", textShadow: dark ? "none" : `0 1px 3px rgba(${accentRgb}, 0.08)` }}>
            strategy
          </span>
        </span>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {workspaceRefreshFn && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center w-9 h-9 cursor-pointer disabled:opacity-50"
              style={btnStyle}
              aria-label={t("workspace.refreshData")}
            >
              <RefreshCw size={15} strokeWidth={2.2} className={refreshing ? "animate-spin" : ""} />
            </button>
          )}
          <button
            type="button"
            onClick={openCommandPalette}
            className="flex items-center justify-center w-9 h-9 -mr-0.5 cursor-pointer"
            style={btnStyle}
            aria-label={t("common.searchLabel")}
          >
            <Search size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </header>
  );
}
