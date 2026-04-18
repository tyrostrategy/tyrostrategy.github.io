import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { IntroPhase } from "./introPhases";

/**
 * CheckmateReveal — large centered ŞAH MAT text during checkmate phase.
 * Smooth reveal (no blinking cursor). Visible from p2b through p5, fades out at p6.
 */

type Props = {
  phase: IntroPhase;
  text: string;
};

export default function CheckmateReveal({ phase, text }: Props) {
  const { t } = useTranslation();
  const show = phase === "p2" || phase === "p2b" || phase === "p3" || phase === "p4" || phase === "p5";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[16] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          aria-hidden="true"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.6, opacity: 0, y: -30 }}
            transition={{
              scale: { type: "spring", stiffness: 160, damping: 18, mass: 0.9 },
              opacity: { duration: 0.5 },
              y: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
            }}
            className="relative text-center"
          >
            {/* Gold radial halo behind text */}
            <div
              className="absolute inset-0 -z-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(224,173,62,0.25) 0%, rgba(200,146,42,0.10) 45%, transparent 70%)",
                filter: "blur(40px)",
                transform: "scale(2)",
              }}
              aria-hidden="true"
            />

            {/* Main text */}
            <h1
              style={{
                fontSize: "clamp(56px, 9vw, 140px)",
                fontWeight: 900,
                letterSpacing: "0.18em",
                lineHeight: 1,
                background:
                  "linear-gradient(180deg, #ffffff 0%, #f5deb5 30%, #e0ad3e 55%, #c8922a 75%, #8b6420 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
                textShadow: "0 0 60px rgba(200,146,42,0.4)",
                filter: "drop-shadow(0 6px 24px rgba(200,146,42,0.35))",
                margin: 0,
              }}
            >
              {text}
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{
                marginTop: "16px",
                fontSize: "clamp(11px, 1.1vw, 14px)",
                letterSpacing: "0.45em",
                color: "#c8daec",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {t("login.checkmateSubtitle")}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
