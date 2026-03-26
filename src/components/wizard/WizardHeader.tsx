import { motion } from "framer-motion";
import { Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";

const sparkles = [
  { x: -8, y: -14, delay: 0, size: 3 },
  { x: 12, y: -10, delay: 0.15, size: 2.5 },
  { x: -12, y: 6, delay: 0.3, size: 2 },
  { x: 14, y: 8, delay: 0.45, size: 3 },
  { x: 0, y: -18, delay: 0.6, size: 2 },
  { x: -6, y: 14, delay: 0.75, size: 2.5 },
];

export default function WizardHeader() {
  const { t } = useTranslation();
  const theme = useSidebarTheme();

  // Use sidebar theme's background — gradient or solid
  const bgStyle = theme.bgGradient
    ? { background: theme.bgGradient }
    : { background: theme.bg };

  // Sparkle color adapts — gold on dark themes, navy on light
  const sparkleColor = theme.isDark ? "var(--tyro-gold-light, #e0ad3e)" : "var(--tyro-gold, #c8922a)";
  const wandColor = theme.isDark ? "text-tyro-gold-light" : "text-tyro-gold";
  const wandGlow = theme.isDark
    ? "drop-shadow-[0_0_10px_rgba(224,173,62,0.6)]"
    : "drop-shadow-[0_0_8px_rgba(200,146,42,0.5)]";
  const titleColor = theme.textPrimary;
  const subtitleColor = theme.textMuted;

  // Dot grid: slightly visible on all themes
  const dotColor = theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(200,146,42,0.08)";

  return (
    <div className="relative overflow-hidden px-6 py-5" style={bgStyle}>
      {/* Dot grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
      {/* Glow orb — adapts to theme accent */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-[40px]"
        style={{ background: `${sparkleColor}22` }}
      />

      <div className="relative flex items-center gap-3.5">
        {/* Wand icon — no background, animated sparkles */}
        <motion.div
          className="relative w-11 h-11 flex items-center justify-center cursor-pointer"
          initial={{ rotate: -30, scale: 0.7 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          whileHover={{ rotate: [0, -15, 10, -5, 0], scale: 1.1 }}
        >
          {sparkles.map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: s.size,
                height: s.size,
                left: `calc(50% + ${s.x}px)`,
                top: `calc(50% + ${s.y}px)`,
                backgroundColor: sparkleColor,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 1.8,
                delay: s.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
          <Wand2 size={24} className={`${wandColor} ${wandGlow}`} />
        </motion.div>

        <div>
          <motion.h2
            className="text-[15px] font-extrabold tracking-tight"
            style={{ color: titleColor }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {t("wizard.title")}
          </motion.h2>
          <motion.p
            className="text-[11px] font-medium mt-0.5"
            style={{ color: subtitleColor }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Stratejik proje ve aksiyonlarınızı adım adım oluşturun
          </motion.p>
        </div>
      </div>
    </div>
  );
}
