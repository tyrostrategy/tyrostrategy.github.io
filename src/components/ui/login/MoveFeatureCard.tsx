import { Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

/**
 * MoveFeatureCard — liquid glass card anchored to the moved piece.
 * Appears for ~3s then fades out.
 */

export type ActiveFeatureCard = {
  id: string;
  worldPos: [number, number, number];
  icon: ReactNode;
  title: string;
  desc: string;
};

type Props = {
  card: ActiveFeatureCard | null;
};

export default function MoveFeatureCard({ card }: Props) {
  if (!card) return null;

  // Anchor card above the piece, but offset Z so it doesn't overlap
  // the centered portal button at board origin.
  const anchorZ = card.worldPos[2] < 0 ? card.worldPos[2] - 0.03 : card.worldPos[2] + 0.12;

  return (
    <Html
      key={card.id}
      position={[card.worldPos[0], card.worldPos[1] + 0.16, anchorZ]}
      center
      zIndexRange={[20, 10]}
      style={{ pointerEvents: "none", transform: "translateX(55%)" }}
    >
      <AnimatePresence>
        <motion.div
          key={card.id}
          initial={{ scale: 0.6, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          role="status"
          aria-live="polite"
          style={{
            width: 240,
            padding: "11px 14px",
            borderRadius: 14,
            background:
              "linear-gradient(135deg, rgba(18,32,56,0.94) 0%, rgba(10,22,40,0.92) 100%)",
            backdropFilter: "blur(18px) saturate(170%)",
            WebkitBackdropFilter: "blur(18px) saturate(170%)",
            border: "1px solid rgba(224,173,62,0.42)",
            boxShadow:
              "0 14px 32px rgba(0,0,0,0.55), 0 0 28px rgba(200,146,42,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span style={{ color: "#e0ad3e", display: "inline-flex" }}>{card.icon}</span>
            <span
              style={{
                fontSize: 13,
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
              color: "#dce7f4",
              margin: 0,
              fontWeight: 500,
            }}
          >
            {card.desc}
          </p>
        </motion.div>
      </AnimatePresence>
    </Html>
  );
}
