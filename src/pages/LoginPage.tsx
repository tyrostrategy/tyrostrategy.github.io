import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";
import { TyroLogo } from "@/components/ui/TyroLogo";
import { useUIStore } from "@/stores/uiStore";
import { useMsalLogin, resolveUser, applyUser } from "@/hooks/useMsalLogin";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "@/stores/dataStore";
import CinematicOverlays from "@/components/ui/login/CinematicOverlays";
import CheckmateReveal from "@/components/ui/login/CheckmateReveal";
import PortalButton from "@/components/ui/login/PortalButton";
import ArchivedFeatureList, { type ArchivedCard } from "@/components/ui/login/ArchivedFeatureList";
import type { ActiveFeatureCard } from "@/components/ui/login/MoveFeatureCard";
import { cn } from "@/lib/cn";
import type { IntroPhase } from "@/components/ui/login/introPhases";

const LoginChessboard = lazy(() => import("@/components/ui/LoginChessboard"));

const COPYRIGHT = "© 2026 Powered by TTECH Business Solutions · Tiryaki Agro";

const PHASE_DELAYS: Record<Exclude<IntroPhase, "idle">, number> = {
  p1: 100, p2: 600, p2b: 900, p3: 1800, p4: 2100, p5: 2700, p6: 3100, auth: 3700,
};

const MOBILE_PHASE_DELAYS: Record<Exclude<IntroPhase, "idle">, number> = {
  p1: 80, p2: 400, p2b: 500, p3: 900, p4: 1000, p5: 1200, p6: 1500, auth: 1900,
};

export default function LoginPage() {
  const { t } = useTranslation();
  const { locale, setLocale } = useUIStore();
  const { login: msalLogin, loading: msalLoading, error: msalError } = useMsalLogin();
  const [phase, setPhase] = useState<IntroPhase>("idle");
  const [showCheckWindow, setShowCheckWindow] = useState(false);
  // Lazy init so the default card is only computed once on mount.
  const [archivedFeatures, setArchivedFeatures] = useState<ArchivedCard[]>(() => [
    {
      id: "intro-default",
      icon: <Shield size={14} />,
      title: t("login.introCard.title"),
      desc: t("login.introCard.desc"),
    },
  ]);

  // Keep the default intro card's label in sync with the active locale.
  useEffect(() => {
    setArchivedFeatures((prev) =>
      prev.map((c) =>
        c.id === "intro-default"
          ? { ...c, title: t("login.introCard.title"), desc: t("login.introCard.desc") }
          : c,
      ),
    );
  }, [t, locale]);

  const handleFeatureArchive = useCallback((card: ActiveFeatureCard) => {
    setArchivedFeatures((prev) => {
      if (prev.some((c) => c.id === card.id)) return prev;
      const newCard: ArchivedCard = {
        id: card.id,
        icon: card.icon,
        title: card.title,
        desc: card.desc,
      };
      // Newer cards go on top, cap at 3 items total
      return [newCard, ...prev].slice(0, 3);
    });
  }, []);
  const introTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isAuthenticated = useIsAuthenticated();
  const { accounts, inProgress } = useMsal();
  const mockLoggedIn = useUIStore((s) => s.mockLoggedIn);
  const users = useDataStore((s) => s.users);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || mockLoggedIn || accounts.length === 0) return;
    if (inProgress !== InteractionStatus.None) return;
    if (users.length === 0) return;
    const email = accounts[0].username.toLowerCase().trim();
    const user = resolveUser(email, users);
    if (user) {
      applyUser(user);
      navigate("/workspace", { replace: true });
    }
  }, [isAuthenticated, mockLoggedIn, accounts, users, inProgress, navigate]);

  const clearTimers = useCallback(() => {
    introTimers.current.forEach((t) => clearTimeout(t));
    introTimers.current = [];
  }, []);

  const startIntro = useCallback(() => {
    if (phase !== "idle") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      msalLogin();
      return;
    }
    const isMobile = window.innerWidth < 1024;
    const delays = isMobile ? MOBILE_PHASE_DELAYS : PHASE_DELAYS;
    window._tyroLoginAnim = true;
    window._tyroLoginStart = performance.now();

    const schedule = (p: Exclude<IntroPhase, "idle">) =>
      introTimers.current.push(setTimeout(() => setPhase(p), delays[p]));

    setPhase("p1");
    (["p2", "p2b", "p3", "p4", "p5", "p6"] as const).forEach(schedule);

    introTimers.current.push(
      setTimeout(() => {
        setPhase("auth");
        msalLogin();
      }, delays.auth),
    );
    introTimers.current.push(
      setTimeout(() => setShowCheckWindow(true), delays.auth + 4000),
    );
  }, [phase, msalLogin]);

  useEffect(() => {
    if (msalError && phase === "auth") {
      clearTimers();
      window._tyroLoginAnim = false;
      setPhase("idle");
      setShowCheckWindow(false);
    }
  }, [msalError, phase, clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
      window._tyroLoginAnim = false;
    };
  }, [clearTimers]);

  const brandHidden = phase !== "idle" && phase !== "p1";

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 75% 40%, #1a3558 0%, #0a1628 55%, #050b18 100%)",
      }}
    >
      {/* ═════ 3D CHESSBOARD — full-screen background ═════ */}
      <div className="hidden lg:block absolute inset-0 z-[1]" aria-hidden="true">
        <Suspense fallback={null}>
          <LoginChessboard
            t={t}
            phase={phase}
            onPortalClick={startIntro}
            onFeatureArchive={handleFeatureArchive}
          />
        </Suspense>
      </div>

      {/* Gold dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] z-[2]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(200,146,42,0.5) 1px, transparent 0)",
          backgroundSize: "52px 52px",
        }}
        aria-hidden="true"
      />

      {/* Cinematic overlays */}
      <CinematicOverlays phase={phase} />

      {/* ŞAH MAT reveal (center screen during checkmate phase) */}
      <CheckmateReveal phase={phase} text={t("login.checkmateWord")} />

      {/* Auth status */}
      <AnimatePresence>
        {phase === "auth" && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[18] flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            aria-live="polite"
          >
            <div
              className="text-center font-semibold uppercase"
              style={{
                fontSize: "13px",
                letterSpacing: "4px",
                color: "#e0ad3e",
                textShadow: "0 0 20px rgba(200,146,42,0.5)",
              }}
            >
              <span>{t("login.authVerifying")}</span>
              <span className="inline-flex ml-2">
                <span style={{ animation: "dotBounce 1.2s infinite", display: "inline-block" }}>.</span>
                <span style={{ animation: "dotBounce 1.2s infinite 0.15s", display: "inline-block" }}>.</span>
                <span style={{ animation: "dotBounce 1.2s infinite 0.3s", display: "inline-block" }}>.</span>
              </span>
            </div>
            {showCheckWindow && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 0.7, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-3 text-[11px] font-medium"
                style={{ color: "#c8daec" }}
              >
                {t("login.authCheckWindow")}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════ DESKTOP: flat brand overlays (no frosted card) ═════ */}
      {/* High z-index so 3D Html feature cards (rendered to document.body by drei) don't cover brand text */}
      <div className="hidden lg:block absolute inset-0 z-[50] pointer-events-none">
        {/* Top-left: Logo + app name + motto + description */}
        <motion.div
          className="absolute top-10 left-10 xl:top-12 xl:left-14 max-w-[460px]"
          initial={{ opacity: 0, x: -24 }}
          animate={{
            opacity: brandHidden ? 0 : 1,
            x: brandHidden ? -40 : 0,
            filter: brandHidden ? "blur(8px)" : "blur(0px)",
          }}
          transition={{ duration: brandHidden ? 0.5 : 0.7, delay: brandHidden ? 0 : 0.2 }}
        >
          {/* Logo + app name */}
          <div className="flex items-center gap-3 mb-14 xl:mb-16">
            <TyroLogo size={42} variant="login" />
            <span className="text-[24px] font-extrabold tracking-tight text-white leading-none">
              tyro
              <span
                style={{
                  background: "linear-gradient(90deg, #c8922a, #e0ad3e, #c8922a)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                strategy
              </span>
            </span>
          </div>

          {/* Headline / motto */}
          <motion.h1
            className="text-[32px] xl:text-[38px] font-extrabold leading-[1.1] tracking-tight mb-3 text-white"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            {t("login.strategicManagement")}
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #e0ad3e 0%, #f0c95e 50%, #c8922a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {t("login.platform")}
            </span>
          </motion.h1>

          {/* Subtext / description */}
          <motion.p
            className="text-[14px] leading-relaxed max-w-[420px]"
            style={{ color: "#c8daec", textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            {t("login.heroDescription")}
          </motion.p>

          {/* Archived feature history — cards teleport here from the board */}
          <ArchivedFeatureList cards={archivedFeatures} />
        </motion.div>

        {/* Top-right: TR / EN toggle */}
        <motion.div
          className="absolute top-10 right-10 xl:top-12 xl:right-14 pointer-events-auto"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: brandHidden ? 0 : 1, y: 0 }}
          transition={{ duration: 0.5, delay: brandHidden ? 0 : 0.3 }}
        >
          <div className="inline-flex items-center gap-0.5 p-1 rounded-full backdrop-blur-md border bg-white/[0.09] border-white/[0.15] shadow-md">
            <button
              type="button"
              onClick={() => setLocale("tr")}
              className={cn(
                "text-[11px] font-bold px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8922a]/60",
                locale === "tr"
                  ? "bg-white/[0.20] text-white shadow-sm"
                  : "text-white/65 hover:text-white",
              )}
            >
              TR
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={cn(
                "text-[11px] font-bold px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8922a]/60",
                locale === "en"
                  ? "bg-white/[0.20] text-white shadow-sm"
                  : "text-white/65 hover:text-white",
              )}
            >
              EN
            </button>
          </div>
        </motion.div>

        {/* Bottom-left: copyright footer */}
        <motion.p
          className="absolute bottom-6 left-10 xl:left-14 text-[11px] tracking-wide"
          style={{ color: "rgba(151,184,216,0.55)", textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: brandHidden ? 0 : 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          {COPYRIGHT}
        </motion.p>

        {/* MSAL error (floating bottom-right) */}
        {msalError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 right-10 xl:right-14 flex items-start gap-2 p-3 rounded-xl backdrop-blur-sm border bg-red-500/15 border-red-400/30 max-w-[400px] pointer-events-auto"
          >
            <Shield size={13} className="mt-0.5 shrink-0 text-red-300" />
            <p className="text-[11px] leading-relaxed text-red-100">{msalError}</p>
          </motion.div>
        )}
      </div>

      {/* ═════ MOBILE single-column ═════
          Text block üstte, button (ve orbit halkaları onun etrafında) orta-alt
          bölgede — orbit'in üst yayı (outermost ring 420px çapında, radius 210)
          button merkezinden ~210px yukarıda başlar. pt-[4vh] + gap-5 ile text
          block'u ~240px yüksekliğe sığdırıp tamamen orbit'in üst yayının
          üzerinde tutuyoruz; altındaki flex-1 spacer button'ı aynı dikey
          merkezde (yaklaşık %65 konumunda) bırakıyor. */}
      <div className="lg:hidden relative z-[30] min-h-screen flex flex-col items-center justify-start pt-[6.5vh] p-6">
        <motion.div
          className="w-full max-w-[440px] flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Logo + app name — identical pattern to desktop brand row.
              Sabit konumda, pt-[6.5vh] ile ekranın üstüne yerleşmiş. */}
          <div className="flex items-center gap-3">
            <TyroLogo size={42} variant="login" />
            <span className="text-[22px] font-extrabold tracking-tight text-white leading-none">
              tyro
              <span
                style={{
                  background: "linear-gradient(90deg, #c8922a, #e0ad3e, #c8922a)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                strategy
              </span>
            </span>
          </div>

          {/* Title + description — orbit'e yakın, logo ile orbit arasındaki
              ferah boşluğu dolduruyor. translate-y layout akışını bozmuyor:
              Logo flex'te kendi yerinde, button/orbit kendi merkezinde.
              Görsel olarak h1+p ~48px aşağı kayıyor, DOM'da hâlâ logo'nun
              hemen altında. Bu yüzden button pozisyonu değişmez. */}
          <div className="flex flex-col items-center gap-5 mt-5 translate-y-12">
            <h1 className="text-[26px] font-extrabold leading-tight text-white">
              {t("login.strategicManagement")}
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #e0ad3e 0%, #f0c95e 50%, #c8922a 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {t("login.platform")}
              </span>
            </h1>

            <p className="text-[13px] leading-relaxed" style={{ color: "#c8daec" }}>
              {t("login.heroDescription")}
            </p>
          </div>
        </motion.div>

        {/* Spacer — text ile button arası boşluğu orbit için açıyor. Orbit
            button merkezli olduğu için button'ın üst yarısı bu boşlukta
            kalacak; text'e artık bitişmiyor. */}
        <div className="flex-1 min-h-[12vh]" />

        {/* Button + olası MSAL hata bileşeni — ekranın alt-orta bölgesinde.
            PortalButton kendi orbit halkalarını kendi merkezinde çizer, bu
            pozisyon (orbit dahil) değişmiyor. */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <PortalButton
            phase={phase}
            onActivate={startIntro}
            label={t("login.portalCta")}
            loading={msalLoading}
          />

          {msalError && (
            <div className="flex items-start gap-2 p-3 rounded-xl backdrop-blur-sm border bg-red-500/10 border-red-400/25 text-left max-w-[440px]">
              <Shield size={13} className="mt-0.5 shrink-0 text-red-300" />
              <p className="text-[11px] leading-relaxed text-red-100">{msalError}</p>
            </div>
          )}
        </motion.div>

        {/* Spacer — button'ın altında ferah alan bırakır, copyright'a
            değmesin diye. */}
        <div className="flex-1 min-h-[8vh]" />

        {/* Copyright — pinned to the bottom so the orbital rings never cut through it */}
        <p
          className="absolute bottom-4 left-0 right-0 text-center text-[10px] px-4"
          style={{ color: "rgba(151,184,216,0.45)" }}
        >
          {COPYRIGHT}
        </p>
      </div>
    </div>
  );
}
