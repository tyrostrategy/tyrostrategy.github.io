import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointerClick } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TyroLogo } from "@/components/ui/TyroLogo";
import type { IntroPhase } from "./introPhases";

/**
 * PortalButton — mobile / fallback portal button. Same visual language
 * as the scene-anchored desktop version:
 *   [Logo]  tyro  verse  │  Bağlan  [click icon]
 * Orbital rings + gold radial glow react on hover and phase p1.
 */

const SCRAMBLE_GLYPHS = "!@#$%^&*<>{}[]|~+=/\\?¢§∆¿⊗◈◊Δ╬╔╩┼";

function useScrambleText(target: string, active: boolean, duration = 800) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (!active) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const revealed = Math.floor(progress * target.length);
      const out = target
        .split("")
        .map((c, i) => {
          if (i < revealed) return c;
          if (c === " ") return " ";
          return SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
        })
        .join("");
      setDisplay(out);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setDisplay(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return display;
}

export default function PortalButton({
  phase,
  onActivate,
  loading,
}: {
  phase: IntroPhase;
  onActivate: () => void;
  label?: string;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const connectLabel = t("login.connect");

  const isImploding =
    phase === "p3" ||
    phase === "p4" ||
    phase === "p5" ||
    phase === "p6" ||
    phase === "auth";
  const show = !isImploding;

  const [hover, setHover] = useState(false);
  const [scrambleDone, setScrambleDone] = useState(false);

  const tyroText = useScrambleText("tyro", show, 700);
  const verseText = useScrambleText("verse", show, 800);
  const baglanText = useScrambleText(connectLabel, show, 900);

  useEffect(() => {
    if (!show) {
      setScrambleDone(false);
      return;
    }
    const timer = setTimeout(() => setScrambleDone(true), 1000);
    return () => clearTimeout(timer);
  }, [show]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ isolation: "isolate" }}>
      {/* Ring + glow container — anchored at button center (0×0 wrapper) */}
      <div
        className="pointer-events-none absolute"
        style={{ top: "50%", left: "50%", width: 0, height: 0 }}
        aria-hidden="true"
      >
        {/* Outer radial bloom */}
        <div
          className="absolute rounded-full"
          style={{
            top: "-200px",
            left: "-200px",
            width: "400px",
            height: "400px",
            background: hover
              ? "radial-gradient(circle, rgba(224,173,62,0.28) 0%, rgba(200,146,42,0.14) 45%, transparent 78%)"
              : "radial-gradient(circle, rgba(224,173,62,0.10) 0%, rgba(200,146,42,0.04) 45%, transparent 78%)",
            animation: "portalRing 3s ease-in-out infinite",
            transition: "background 0.35s",
          }}
        />
        {/* Inner radial glow pulse */}
        <div
          className="absolute rounded-full"
          style={{
            top: "-135px",
            left: "-135px",
            width: "270px",
            height: "270px",
            background: hover
              ? "radial-gradient(circle, rgba(200,146,42,0.4) 0%, transparent 72%)"
              : "radial-gradient(circle, rgba(200,146,42,0.16) 0%, transparent 72%)",
            animation: "portalRing 3s ease-in-out infinite",
            transition: "background 0.4s",
          }}
        />

        {/* Inner orbital ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            top: "-125px",
            left: "-125px",
            width: "250px",
            height: "250px",
            border: `1px solid ${phase === "p1" ? "rgba(240,201,94,0.95)" : hover ? "rgba(224,173,62,0.70)" : "rgba(200,146,42,0.35)"}`,
            boxShadow: phase === "p1"
              ? "inset 0 0 30px rgba(240,201,94,0.5), 0 0 24px rgba(240,201,94,0.55)"
              : hover ? "inset 0 0 18px rgba(200,146,42,0.26)" : "none",
            transition: "border-color 0.25s, box-shadow 0.25s",
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: phase === "p1" ? 0.5 : hover ? 10 : 22,
            repeat: Infinity,
            ease: phase === "p1" ? "easeIn" : "linear",
          }}
        />

        {/* Outer orbital ring — dashed */}
        <motion.div
          className="absolute rounded-full"
          style={{
            top: "-150px",
            left: "-150px",
            width: "300px",
            height: "300px",
            border: `1.5px dashed ${phase === "p1" ? "rgba(240,201,94,1)" : hover ? "rgba(224,173,62,0.82)" : "rgba(200,146,42,0.40)"}`,
            boxShadow: phase === "p1"
              ? "0 0 60px rgba(240,201,94,0.7)"
              : hover ? "0 0 38px rgba(200,146,42,0.4)" : "none",
            transition: "border-color 0.25s, box-shadow 0.25s",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: phase === "p1" ? 0.4 : hover ? 7 : 16,
            repeat: Infinity,
            ease: phase === "p1" ? "easeIn" : "linear",
          }}
        />

        {/* Orbital dots on outer ring */}
        <motion.div
          className="absolute"
          style={{ top: "-150px", left: "-150px", width: "300px", height: "300px" }}
          animate={{ rotate: 360 }}
          transition={{
            duration: phase === "p1" ? 0.4 : hover ? 7 : 16,
            repeat: Infinity,
            ease: phase === "p1" ? "easeIn" : "linear",
          }}
        >
          {[0, 90, 180, 270].map((deg) => (
            <div
              key={deg}
              className="absolute rounded-full"
              style={{
                top: "50%",
                left: "50%",
                width: "5px",
                height: "5px",
                background: "#e0ad3e",
                boxShadow: "0 0 10px rgba(224,173,62,0.95)",
                transform: `translate(-50%, -50%) rotate(${deg}deg) translate(150px)`,
                opacity: hover ? 1 : 0.55,
                transition: "opacity 0.3s",
              }}
            />
          ))}
        </motion.div>

        {/* Dr Strange burst (phase p1) */}
        <AnimatePresence>
          {phase === "p1" && (
            <>
              <motion.div
                key="burst-1"
                className="absolute rounded-full"
                style={{
                  top: "-150px",
                  left: "-150px",
                  width: "300px",
                  height: "300px",
                  border: "2px solid rgba(240,201,94,0.9)",
                  boxShadow: "0 0 50px rgba(240,201,94,0.7), inset 0 0 35px rgba(240,201,94,0.4)",
                }}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1.8, opacity: [0, 1, 0], rotate: 180 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * 360;
                return (
                  <motion.div
                    key={`spark-${i}`}
                    className="absolute"
                    style={{
                      top: "50%",
                      left: "50%",
                      width: "3px",
                      height: "20px",
                      background:
                        "linear-gradient(180deg, rgba(255,235,180,1) 0%, rgba(240,201,94,0.8) 50%, transparent 100%)",
                      transformOrigin: "50% 0%",
                      borderRadius: "2px",
                      boxShadow: "0 0 10px rgba(240,201,94,0.9)",
                    }}
                    initial={{ opacity: 0, rotate: angle, x: -1.5, y: 0, scale: 0.3 }}
                    animate={{ opacity: [0, 1, 0], y: [0, 160, 200], scale: [0.3, 1.2, 0.6] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, delay: i * 0.025, ease: "easeOut" }}
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Button */}
      <motion.button
        type="button"
        onClick={onActivate}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        disabled={loading || isImploding}
        whileHover={!isImploding && phase === "idle" ? { scale: 1.04, y: -1 } : undefined}
        whileTap={!isImploding ? { scale: 0.96 } : undefined}
        animate={{
          scale: isImploding ? 0.4 : 1,
          opacity: isImploding ? 0 : 1,
          filter: isImploding ? "blur(20px)" : "blur(0px)",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative z-10 inline-flex items-center gap-3 px-6 py-3 rounded-[18px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8922a]/70"
        style={{
          background:
            "linear-gradient(135deg, rgba(18,32,56,0.92) 0%, rgba(10,22,40,0.88) 100%)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1.5px solid rgba(224,173,62,0.55)",
          boxShadow: hover
            ? "0 14px 38px rgba(0,0,0,0.6), 0 0 48px rgba(200,146,42,0.35), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.3)"
            : "0 12px 32px rgba(0,0,0,0.55), 0 0 32px rgba(200,146,42,0.22), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.3)",
        }}
      >
        <TyroLogo size={22} variant="login" />

        <span className="inline-flex items-center">
          <span
            style={{
              fontSize: "17px",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              color: "#ffffff",
            }}
          >
            {scrambleDone ? "tyro" : tyroText}
          </span>
          <span
            style={{
              fontSize: "17px",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              background: "linear-gradient(90deg, #c8922a 0%, #f0c95e 45%, #e0ad3e 55%, #c8922a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: scrambleDone ? "transparent" : "#e0ad3e",
            }}
          >
            {scrambleDone ? "verse" : verseText}
          </span>
        </span>

        <span
          className="inline-block w-px h-4 rounded-full"
          style={{ background: "rgba(255,255,255,0.3)" }}
          aria-hidden="true"
        />

        <span className="inline-flex items-center gap-1.5">
          <span
            style={{
              fontSize: "17px",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              color: "#ffffff",
            }}
          >
            {scrambleDone ? connectLabel : baglanText}
          </span>
          <motion.span
            style={{ display: "inline-flex" }}
            animate={hover ? { y: [0, 3, 0] } : { y: 0 }}
            transition={{ duration: 0.8, repeat: hover ? Infinity : 0, ease: "easeInOut" }}
          >
            <MousePointerClick size={14} style={{ color: "#e0ad3e" }} strokeWidth={2.5} />
          </motion.span>
        </span>
      </motion.button>
    </div>
  );
}
