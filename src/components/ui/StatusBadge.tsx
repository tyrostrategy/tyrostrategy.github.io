import { Tooltip } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { getStatusLabel } from "@/lib/constants";
import type { EntityStatus } from "@/types";

const statusConfig: Record<EntityStatus, { bg: string; text: string; dot: string }> = {
  "On Track": {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  Achieved: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    dot: "bg-blue-500",
  },
  Behind: {
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-500",
  },
  "At Risk": {
    bg: "bg-amber-50",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  "Not Started": {
    bg: "bg-slate-100",
    text: "text-tyro-text-muted",
    dot: "bg-slate-400",
  },
  Cancelled: {
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-400",
  },
  "On Hold": {
    bg: "bg-violet-50",
    text: "text-violet-600",
    dot: "bg-violet-500",
  },
};

const statusTooltips: Record<EntityStatus, { tr: string; en: string }> = {
  "Not Started": {
    tr: "İlerleme %0 — henüz başlanmamış",
    en: "Progress 0% — not yet started",
  },
  "On Track": {
    tr: "İlerleme plana uygun ilerliyor (fark <%10)",
    en: "Progress is on schedule (gap <10%)",
  },
  "At Risk": {
    tr: "İlerleme planın %10-20 gerisinde — dikkat gerekiyor",
    en: "Progress is 10-20% behind schedule — needs attention",
  },
  Behind: {
    tr: "İlerleme planın %20'den fazla gerisinde — müdahale gerekli",
    en: "Progress is >20% behind schedule — intervention needed",
  },
  Achieved: {
    tr: "İlerleme %100 — tamamlandı",
    en: "Progress 100% — completed",
  },
  Cancelled: {
    tr: "Bu kayıt iptal edildi",
    en: "This item has been cancelled",
  },
  "On Hold": {
    tr: "Bu kayıt askıya alındı — beklemede",
    en: "This item is on hold — waiting",
  },
};

interface StatusBadgeProps {
  status: EntityStatus;
  showTooltip?: boolean;
}

export default function StatusBadge({ status, showTooltip = true }: StatusBadgeProps) {
  const { t, i18n } = useTranslation();
  const cfg = statusConfig[status];
  const lang = i18n.language === "en" ? "en" : "tr";
  const tooltip = statusTooltips[status]?.[lang] ?? "";

  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text} cursor-default`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {getStatusLabel(status, t)}
    </span>
  );

  if (!showTooltip || !tooltip) return badge;

  return (
    <Tooltip
      content={tooltip}
      placement="top"
      size="sm"
      classNames={{
        content: "text-[11px] max-w-[220px] px-3 py-1.5",
      }}
    >
      {badge}
    </Tooltip>
  );
}
