import { useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SlidingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  /** Desktop max-width in px (default 480). Ignored on mobile — panel goes full-screen. */
  maxWidth?: number;
  /** Optional sticky footer rendered below the scrollable content area. */
  footer?: ReactNode;
  /** Optional custom header replacing the default title bar. Close button is still rendered. */
  headerContent?: ReactNode;
}

export default function SlidingPanel({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = 480,
  footer,
  headerContent,
}: SlidingPanelProps) {
  const { t } = useTranslation();
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed top-0 left-0 z-40 h-screen w-screen bg-black/15 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel — full-screen on mobile, capped width on desktop */}
          <motion.div
            className="fixed top-0 right-0 z-50 h-screen w-full flex flex-col bg-tyro-surface shadow-tyro-lg border-l border-tyro-border sm:rounded-l-[20px] overflow-hidden"
            style={{ maxWidth: `min(100vw, ${maxWidth}px)` }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            {headerContent ? (
              <div className="relative">
                {headerContent}
                <button
                  onClick={onClose}
                  aria-label={t("common.cancel")}
                  className="absolute top-4 right-5 w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer z-10"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-tyro-border">
                <div className="flex items-center gap-2">
                  {icon && (
                    <div className="w-7 h-7 rounded-lg bg-tyro-bg flex items-center justify-center">
                      {icon}
                    </div>
                  )}
                  <h2 className="text-[14px] font-bold text-tyro-text-primary">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label={t("common.cancel")}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-tyro-text-muted hover:bg-tyro-bg transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-3">{children}</div>

            {/* Optional sticky footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-tyro-border bg-tyro-surface/80 backdrop-blur-sm">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
