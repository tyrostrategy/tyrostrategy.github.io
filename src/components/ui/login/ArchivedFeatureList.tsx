import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

/**
 * ArchivedFeatureList — stacked liquid-glass cards under the hero copy.
 * Each card teleports in from the board, flickers as it settles, and
 * stays as a persistent history of moves/features shown during the match.
 */

export type ArchivedCard = {
  id: string;
  icon: ReactNode;
  title: string;
  desc: string;
};

type Props = {
  cards: ArchivedCard[];
};

export default function ArchivedFeatureList({ cards }: Props) {
  if (cards.length === 0) return null;

  return (
    <div className="mt-5 flex flex-col gap-2.5 max-w-[400px] pointer-events-auto">
      <AnimatePresence initial={false}>
        {cards.map((card) => (
          <motion.div
            key={card.id}
            layout
            initial={{
              opacity: 0,
              x: 320,          // teleport IN from the chess board (right side)
              y: -80,
              scale: 0.75,
              filter: "blur(6px)",
            }}
            animate={{
              opacity: [0, 1, 0.25, 1, 0.55, 1],        // flicker settle
              x: 0,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              opacity: { duration: 0.9, times: [0, 0.28, 0.42, 0.6, 0.76, 1] },
              x: { type: "spring", stiffness: 140, damping: 20 },
              y: { type: "spring", stiffness: 140, damping: 20 },
              scale: { type: "spring", stiffness: 180, damping: 22 },
              filter: { duration: 0.5 },
              layout: { type: "spring", stiffness: 200, damping: 26 },
            }}
            style={{
              padding: "10px 13px",
              borderRadius: 14,
              background:
                "linear-gradient(135deg, rgba(26,50,92,0.42) 0%, rgba(10,22,40,0.48) 100%)",
              backdropFilter: "blur(22px) saturate(180%)",
              WebkitBackdropFilter: "blur(22px) saturate(180%)",
              border: "1px solid rgba(224,173,62,0.28)",
              boxShadow:
                "0 10px 26px rgba(0,0,0,0.45), 0 0 18px rgba(200,146,42,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span style={{ color: "#e0ad3e", display: "inline-flex" }}>{card.icon}</span>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "0.25px",
                }}
              >
                {card.title}
              </span>
            </div>
            <p
              style={{
                fontSize: 11,
                lineHeight: 1.5,
                color: "#c8daec",
                margin: 0,
                fontWeight: 500,
              }}
            >
              {card.desc}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
