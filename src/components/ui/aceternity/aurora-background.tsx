import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface AuroraBackgroundProps {
  children: ReactNode;
  className?: string;
  variant?: "light" | "dark";
  showRadialGradient?: boolean;
}

/* ── Color palettes ── */
const DARK = {
  bg: "#0f172a",
  /* Two aurora gradients combined in one element — keyframe animates both positions */
  aurora: [
    "repeating-linear-gradient(100deg, #1e3a5f 10%, #2a4f7f 15%, rgba(200,146,42,0.12) 20%, #142842 25%, rgba(30,58,95,0.4) 30%)",
    "repeating-linear-gradient(100deg, #1e3a5f 10%, #2a4f7f 15%, rgba(200,146,42,0.08) 20%, #142842 25%, rgba(30,58,95,0.3) 30%)",
  ].join(", "),
  overlay:
    "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 20%, rgba(20,40,66,0.6) 100%)",
  dotColor: "rgba(200,146,42,0.15)",
  auroraOpacity: "opacity-0",
  blur: "12px",
  bgSize: "300%, 200%",
};

/* Light — Aceternity-style: prismatic light streaks on white.
   Two repeating-linear-gradients in one element so the keyframe
   moves both background-positions from 50% to 350%.                */
const LIGHT = {
  bg: "#ffffff",
  aurora: [
    "repeating-linear-gradient(100deg, #fff 0%, #fff 6%, rgba(180,195,255,0.35) 9%, rgba(160,180,255,0.25) 12%, #fff 15%, rgba(200,185,255,0.3) 19%, rgba(180,210,240,0.2) 22%, #fff 26%, rgba(190,200,255,0.25) 30%, #fff 34%)",
    "repeating-linear-gradient(100deg, #fff 0%, rgba(195,185,255,0.25) 7%, rgba(175,200,240,0.2) 11%, #fff 15%, rgba(185,195,255,0.3) 20%, #fff 25%, rgba(210,200,255,0.2) 30%, rgba(180,195,240,0.15) 34%, #fff 38%)",
  ].join(", "),
  overlay:
    "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(255,255,255,0.4) 100%)",
  dotColor: "rgba(30,58,95,0.01)",
  auroraOpacity: "opacity-100",
  blur: "24px",
  bgSize: "300%, 200%",
  /* Mask: aurora only visible bottom-right, fades to transparent top-left */
  mask: "radial-gradient(ellipse 90% 90% at 80% 80%, black 0%, transparent 65%)",
};

export function AuroraBackground({
  children,
  className,
  variant = "light",
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  const p = variant === "dark" ? DARK : LIGHT;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden",
        "transition-colors duration-700",
        className,
      )}
      style={{ backgroundColor: p.bg }}
    >
      {/* Aurora layer — two gradients, animated via @keyframes aurora
          which moves background-position: 50%,50% → 350%,50%       */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-700",
          p.auroraOpacity,
          "will-change-[background-position]",
          "[animation:aurora_60s_linear_infinite]",
        )}
        style={{
          backgroundImage: p.aurora,
          backgroundSize: p.bgSize,
          filter: `blur(${p.blur})`,
          ...("mask" in p && {
            maskImage: p.mask,
            WebkitMaskImage: p.mask,
          }),
        }}
      />

      {/* Radial overlay for text readability */}
      {showRadialGradient && (
        <div
          className="pointer-events-none absolute inset-0 transition-all duration-700"
          style={{ backgroundImage: p.overlay }}
        />
      )}

      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 transition-all duration-700"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${p.dotColor} 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
