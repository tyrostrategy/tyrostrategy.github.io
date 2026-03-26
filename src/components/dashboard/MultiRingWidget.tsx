import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useDataStore } from "@/stores/dataStore";
import GlassCard from "@/components/ui/GlassCard";
import CircularProgress from "@/components/ui/CircularProgress";

const ringConfigs = [
  { size: 150, strokeWidth: 9 },
  { size: 110, strokeWidth: 8 },
];

export default function MultiRingWidget() {
  const { t } = useTranslation();
  const projeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const [hoveredRing, setHoveredRing] = useState<number | null>(null);

  const rings = useMemo(() => {
    const projeCompleted = projeler.filter((h) => {
      const aksiyonlarForH = aksiyonlar.filter((a) => a.projeId === h.id);
      if (aksiyonlarForH.length === 0) return false;
      return aksiyonlarForH.every((a) => a.status === "Achieved");
    }).length;
    const projeProgress = projeler.length > 0 ? Math.round((projeCompleted / projeler.length) * 100) : 0;

    const aksiyonCompleted = aksiyonlar.filter((a) => a.status === "Achieved").length;
    const aksiyonProgress = aksiyonlar.length > 0 ? Math.round((aksiyonCompleted / aksiyonlar.length) * 100) : 0;

    return [
      { label: t("nav.objectives"), progress: projeProgress, color: "var(--tyro-navy)", actual: projeCompleted, total: projeler.length },
      { label: t("nav.actions"), progress: aksiyonProgress, color: "var(--tyro-success)", actual: aksiyonCompleted, total: aksiyonlar.length },
    ];
  }, [projeler, aksiyonlar, t]);

  return (
    <GlassCard className="p-6 flex-1 flex flex-col">
      <h3 className="text-[13px] font-bold text-tyro-text-primary mb-3">
        {t("dashboard.overallProgress")}
      </h3>

      {/* Interactive nested rings */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative" style={{ width: 160, height: 160 }}>
          {rings.map((ring, i) => {
            const cfg = ringConfigs[i];
            const isHovered = hoveredRing === i;
            const isDimmed = hoveredRing !== null && hoveredRing !== i;
            const baseOffset = (160 - cfg.size) / 2;

            return (
              <motion.div
                key={ring.label}
                className="absolute cursor-pointer"
                style={{ top: baseOffset, left: baseOffset }}
                animate={{
                  scale: isHovered ? 1.08 : 1,
                  opacity: isDimmed ? 0.3 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onMouseEnter={() => setHoveredRing(i)}
                onMouseLeave={() => setHoveredRing(null)}
              >
                <CircularProgress
                  progress={ring.progress}
                  size={cfg.size}
                  strokeWidth={isHovered ? cfg.strokeWidth + 2 : cfg.strokeWidth}
                  color={ring.color}
                />
              </motion.div>
            );
          })}

          {/* Center tooltip on hover */}
          <AnimatePresence>
            {hoveredRing !== null && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <span className="text-[18px] font-extrabold tabular-nums text-tyro-text-primary leading-none">
                  {rings[hoveredRing].progress}%
                </span>
                <span className="text-[11px] font-semibold text-tyro-text-muted mt-0.5">
                  {rings[hoveredRing].label}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Interactive legend */}
      <div className="space-y-1.5 mt-auto">
        {rings.map((ring, i) => {
          const isHovered = hoveredRing === i;
          const isDimmed = hoveredRing !== null && hoveredRing !== i;

          return (
            <motion.div
              key={ring.label}
              className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded-lg cursor-pointer transition-colors hover:bg-tyro-bg/60"
              animate={{ opacity: isDimmed ? 0.4 : 1 }}
              onMouseEnter={() => setHoveredRing(i)}
              onMouseLeave={() => setHoveredRing(null)}
            >
              <div className="flex items-center gap-2">
                <motion.span
                  className="rounded-full shrink-0"
                  style={{ backgroundColor: ring.color }}
                  animate={{
                    width: isHovered ? 12 : 10,
                    height: isHovered ? 12 : 10,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                />
                <span className={`text-xs font-medium transition-colors ${isHovered ? "text-tyro-text-primary" : "text-tyro-text-secondary"}`}>
                  {ring.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-tyro-text-muted tabular-nums">
                  {ring.actual} / {ring.total}
                </span>
                <motion.span
                  className="tabular-nums font-bold text-tyro-text-primary"
                  animate={{ fontSize: isHovered ? "14px" : "12px" }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {ring.progress}%
                </motion.span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
