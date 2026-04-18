import { motion, AnimatePresence } from "framer-motion";
import type { IntroPhase } from "./introPhases";

/**
 * CinematicOverlays — Vignette, grain, dissolve, and flash layers.
 *
 * All layers are aria-hidden and pointer-events: none. Framer-motion
 * variants react to the phase prop.
 */

/* Fractal noise SVG (TYROWMS heritage, data URI for zero network dep) */
const GRAIN_SVG =
  'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.9%22/></svg>")';

export default function CinematicOverlays({ phase }: { phase: IntroPhase }) {
  // Vignette: visible from p2 onward
  const vignetteOpacity =
    phase === "idle" || phase === "p1"
      ? 0
      : phase === "p2"
      ? 0.55
      : phase === "p2b" || phase === "p3"
      ? 0.75
      : 0.85;

  // Dissolve blur: from p4 onward
  const dissolveBlur =
    phase === "p4"
      ? 8
      : phase === "p5"
      ? 14
      : phase === "p6" || phase === "auth"
      ? 20
      : 0;

  // Desaturate / contrast effect at p5
  const saturation =
    phase === "p5" || phase === "p6" || phase === "auth" ? 0.35 : 1;
  const contrast = phase === "p5" || phase === "p6" ? 1.6 : 1;

  // Grain opacity: from p4
  const grainOpacity =
    phase === "p4" ? 0.16 : phase === "p5" ? 0.22 : phase === "p6" ? 0.1 : 0;

  // Flash sequence at p6 (two-stage)
  const showFlash = phase === "p6" || phase === "auth";

  return (
    <>
      {/* ─── Vignette (z-10) — navy radial darkening from edges ─── */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[10]"
        aria-hidden="true"
        animate={{ opacity: vignetteOpacity }}
        transition={{ duration: phase === "p2" ? 1.2 : 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(10,22,40,0.85) 100%)",
        }}
      />

      {/* ─── Dissolve blur layer (z-11) — backdrop blur intensifies ─── */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[11]"
        aria-hidden="true"
        animate={{
          backdropFilter: `blur(${dissolveBlur}px) saturate(${saturation}) contrast(${contrast})`,
          WebkitBackdropFilter: `blur(${dissolveBlur}px) saturate(${saturation}) contrast(${contrast})`,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      {/* ─── Grain (z-11) — fractal noise overlay ─── */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[11] mix-blend-overlay"
        aria-hidden="true"
        animate={{ opacity: grainOpacity }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundImage: GRAIN_SVG,
          backgroundSize: "200px 200px",
          backgroundRepeat: "repeat",
        }}
      />

      {/* ─── Stargate-style finale (z-13..16) — replaces flat dissolve ─── */}
      <AnimatePresence>
        {showFlash && (
          <>
            {/* Brief gold impact glow — quick screen wash at checkmate */}
            <motion.div
              key="impact-glow"
              className="pointer-events-none fixed inset-0 z-[13]"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0.15] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, times: [0, 0.3, 1], ease: "easeOut" }}
              style={{
                background:
                  "radial-gradient(ellipse at 50% 60%, rgba(224,173,62,0.6) 0%, rgba(200,146,42,0.3) 40%, transparent 70%)",
                mixBlendMode: "screen",
              }}
            />

            {/* Concentric portal rings — staggered gold expansion, Dr Strange-style */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`portal-ring-${i}`}
                className="pointer-events-none fixed z-[14] rounded-full"
                aria-hidden="true"
                style={{
                  top: "50%",
                  left: "50%",
                  width: "240px",
                  height: "240px",
                  marginLeft: "-120px",
                  marginTop: "-120px",
                  border: `${2 - i * 0.4}px ${i === 1 ? "dashed" : "solid"} rgba(240,201,94,${0.9 - i * 0.2})`,
                  boxShadow: `0 0 ${60 - i * 12}px rgba(240,201,94,${0.6 - i * 0.12}), inset 0 0 ${30 - i * 6}px rgba(240,201,94,${0.35 - i * 0.08})`,
                }}
                initial={{ scale: 0, opacity: 0, rotate: 0 }}
                animate={{
                  scale: 14 + i * 3,
                  opacity: [0, 1, 0.8, 0],
                  rotate: i % 2 === 0 ? 360 : -360,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5 + i * 0.15,
                  delay: i * 0.12,
                  ease: [0.22, 0.8, 0.3, 1],
                }}
              />
            ))}

            {/* Navy dissolve curtain — final fade into app */}
            <motion.div
              key="dissolve-navy"
              className="pointer-events-none fixed inset-0 z-[16]"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "auth" ? 0.95 : 0.5 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: phase === "auth" ? 0.8 : 0.6,
                delay: phase === "auth" ? 0.3 : 0,
                ease: "easeOut",
              }}
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, #1a3560 0%, #0a1628 45%, #050b18 100%)",
              }}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
