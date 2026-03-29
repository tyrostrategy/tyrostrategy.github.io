import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import BottomNav from "./BottomNav";
import CommandPalette from "@/components/shared/CommandPalette";
import ToastContainer from "@/components/shared/ToastContainer";
import { useSidebarTheme, appCSSVars, getAppTheme } from "@/hooks/useSidebarTheme";
import { clsx } from "clsx";

export default function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useSidebarTheme();
  const appTheme = getAppTheme(theme);
  const vars = appCSSVars(theme);
  const isFullTheme = !!appTheme;

  return (
    <>
      <div
        className={clsx(
          "flex h-screen overflow-hidden transition-colors duration-300",
          isFullTheme && "app-full-theme",
          isFullTheme && appTheme.isDark && "app-full-dark",
          appTheme?.rootClass
        )}
        data-full-theme={isFullTheme ? (appTheme.isDark ? "dark" : "light") : undefined}
        style={{
          ...vars,
          ...(isFullTheme
            ? {
                background: appTheme.bgGradient || appTheme.bg,
                color: appTheme.textPrimary,
              }
            : {}),
        }}
      >
        <Sidebar />
        <MobileHeader />
        <main
          className={clsx(
            "flex-1 overflow-y-auto px-4 sm:px-5 lg:px-8 pt-[78px] lg:pt-[36px] pb-32 lg:pb-6",
            !isFullTheme && "bg-tyro-bg"
          )}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>

          {/* TTECH Footer — page bottom */}
          <div className="mt-16 pb-6 flex flex-col items-center gap-2 print:hidden">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-tyro-border to-transparent" />
            <p className="text-[11px] text-tyro-text-muted tracking-wide">
              {t("footer.poweredBy")} <span className="font-semibold text-tyro-text-secondary">TTECH Business Solutions</span>
            </p>
            <p className="text-[11px] text-tyro-text-muted">
              © {new Date().getFullYear()} Tiryaki Agro · {t("footer.allRightsReserved")}
            </p>
          </div>
        </main>
        <BottomNav />
        <CommandPalette />
      </div>
      <ToastContainer />
    </>
  );
}
