import { motion } from "framer-motion";
import { SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const { t } = useTranslation();
  const displayTitle = title ?? t("common.noRecordsFound");
  const displayDescription = description ?? t("common.tryChangingCriteria");
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-tyro-bg flex items-center justify-center mb-4">
        {icon || <SearchX size={28} className="text-tyro-text-muted" />}
      </div>
      <h3 className="text-sm font-semibold text-tyro-text-primary mb-1">{displayTitle}</h3>
      <p className="text-xs text-tyro-text-muted text-center max-w-[240px] mb-4">{displayDescription}</p>
      {action}
    </motion.div>
  );
}
