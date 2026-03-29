import { useState, useEffect, useRef } from "react";

type Direction = "up" | "down" | null;

interface ScrollDirectionResult {
  direction: Direction;
  isPastThreshold: boolean;
}

const DEAD_ZONE = 5;

export function useScrollDirection(threshold = 80): ScrollDirectionResult {
  const [direction, setDirection] = useState<Direction>(null);
  const [isPastThreshold, setIsPastThreshold] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const el = document.querySelector("main");
    if (!el) return;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const y = el.scrollTop;
        const diff = y - lastY.current;

        if (Math.abs(diff) > DEAD_ZONE) {
          setDirection(diff > 0 ? "down" : "up");
        }

        setIsPastThreshold(y > threshold);
        lastY.current = y;
        ticking.current = false;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { direction, isPastThreshold };
}
