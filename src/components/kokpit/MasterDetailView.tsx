import { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { Input, Button, Tooltip, Popover, PopoverTrigger, PopoverContent, DatePicker } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, X, ChevronDown, ArrowLeft, ArrowUpDown, Plus, Pencil, Trash2, Wand2, MoreVertical,
  Target, Crosshair, CircleCheckBig, Calendar, CalendarCheck, Users, Building2, Globe, Clock, Check,
} from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { usePermissions } from "@/hooks/usePermissions";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import StatusBadge from "@/components/ui/StatusBadge";
import TagChip from "@/components/ui/TagChip";
import SlidingPanel from "@/components/shared/SlidingPanel";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import AksiyonForm from "@/components/aksiyonlar/AksiyonForm";
import ProjeForm from "@/components/projeler/ProjeForm";
import AksiyonDetail from "@/components/aksiyonlar/AksiyonDetail";
import { progressColor } from "@/lib/colorUtils";
import { formatDate } from "@/lib/dateUtils";
import { deptLabel } from "@/config/departments";
import { toCalendarDate, fromCalendarDate } from "@/lib/utils";
import { STATUS_DOT_COLOR, getStatusLabel } from "@/lib/constants";
import { toast } from "@/stores/toastStore";
import type { Proje, Aksiyon, EntityStatus, Source } from "@/types";

// ===== STATUS BAR COLORS =====
const STATUS_BAR: Record<EntityStatus, string> = {
  "Not Started": "#94a3b8",
  "On Track": "#10b981",
  "At Risk": "#f59e0b",
  "High Risk": "#ef4444",
  "Achieved": "#3b82f6",
  "Cancelled": "#9ca3af",
  "On Hold": "#8b5cf6",
};

// ===== QUICK PROGRESS STEPS =====
const PROGRESS_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const PROGRESS_STEPS_MOBILE = [0, 15, 25, 50, 75, 100];

const STATUS_HEX: Record<string, string> = {
  "On Track": "#10b981",
  "At Risk": "#f59e0b",
  "High Risk": "#ef4444",
  "Achieved": "#3b82f6",
  "Not Started": "#94a3b8",
  "Cancelled": "#6b7280",
  "On Hold": "#8b5cf6",
};

interface AksiyonFilters {
  statuses?: string[];
  owners?: string[];
  progressMin?: number;
  progressMax?: number;
}

interface MasterDetailViewProps {
  projeler: Proje[];
  onOpenWizard?: () => void;
  externalSearch?: string;
  externalStatusFilter?: string;
  externalSourceFilter?: string;
  externalSortBy?: string;
  externalSortAsc?: boolean;
  aksiyonFilters?: AksiyonFilters | null;
  onSelectionChange?: (projeId: string | null) => void;
}

// ========================================
// MASTER LIST CARD
// ========================================
const MasterListCard = memo(function MasterListCard({
  proje,
  aksiyonCount,
  isSelected,
  onClick,
}: {
  proje: Proje;
  aksiyonCount: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const statusColor = STATUS_BAR[proje.status] || "#10b981";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className={`w-full text-left rounded-xl transition-all duration-200 cursor-pointer group relative ${
        isSelected
          ? "moving-border shadow-[0_4px_16px_rgba(30,58,95,0.12)] scale-[1.01]"
          : "border border-tyro-border/30 bg-tyro-surface shadow-sm hover:shadow-md hover:border-tyro-border/50"
      }`}
      style={isSelected ? { "--status-color": statusColor } as React.CSSProperties : undefined}
    >
      {/* Status bar left edge — wraps around corners into moving border */}
      {isSelected && (
        <div
          className="absolute -left-[2.5px] -top-[2.5px] -bottom-[2.5px] z-10 pointer-events-none"
          style={{
            width: "14px",
            background: `linear-gradient(to right, ${statusColor}, transparent)`,
            borderRadius: "12px 0 0 12px",
            maskImage: "linear-gradient(to right, black 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 40%, transparent 100%)",
          }}
        />
      )}

      <div className={`${isSelected ? "pl-4" : "pl-3"} pr-3 py-2.5`}>
        {/* Row 1: Name + Mini circular progress */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h4 className="text-[12px] font-semibold text-tyro-text-primary leading-snug line-clamp-2 flex-1">
            {proje.name}
          </h4>
          <div className="relative w-[36px] h-[36px] shrink-0 flex items-center justify-center">
            <svg width="36" height="36" className="-rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-tyro-border/10" />
              <circle cx="18" cy="18" r="15" fill="none" stroke={statusColor} strokeWidth="3"
                strokeDasharray={2 * Math.PI * 15} strokeDashoffset={2 * Math.PI * 15 - (proje.progress / 100) * 2 * Math.PI * 15} strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" }}
              />
            </svg>
            {proje.status === "On Hold" ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="18" />
                </svg>
              </span>
            ) : proje.status === "Cancelled" ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            ) : proje.status === "Achieved" || proje.progress >= 100 ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black tabular-nums" style={{ color: statusColor }}>
                {proje.progress}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Owner + Source badge */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[11px] text-tyro-text-muted truncate">{proje.owner}</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-tyro-border/20 text-tyro-text-muted font-medium shrink-0">
            {proje.source}
          </span>
        </div>

        {/* Row 3: Dates */}
        <span className="text-[11px] text-tyro-text-muted">
          {formatDate(proje.startDate)} → {formatDate(proje.endDate)}
        </span>
      </div>
    </div>
  );
});

// ========================================
// QUICK PROGRESS BUTTONS
// ========================================
// Chip color matching AksiyonForm gradient palette
function QuickProgressButtons({
  current,
  onChange,
  statusColor = "#94a3b8",
}: {
  current: number;
  onChange: (val: number) => void;
  statusColor?: string;
}) {
  const renderBtn = (step: number) => {
    const isExact = current === step || (step === 100 && current >= 100);
    const isPassed = current > step;
    return (
      <button
        key={step}
        type="button"
        onClick={(e) => { e.stopPropagation(); onChange(step); }}
        className={`relative min-w-[30px] h-[22px] px-1 rounded-md text-[11px] font-bold tabular-nums cursor-pointer transition-all ${
          isExact
            ? "text-white shadow-sm scale-110"
            : isPassed
              ? "text-white/70"
              : "bg-tyro-bg text-tyro-text-muted hover:bg-tyro-border/20"
        }`}
        style={isExact || isPassed ? { backgroundColor: isExact ? statusColor : `${statusColor}60` } : undefined}
      >
        {step}%
      </button>
    );
  };

  return (
    <>
      {/* Mobile: 5 steps */}
      <div className="flex sm:hidden items-center gap-[3px]">
        {PROGRESS_STEPS_MOBILE.map(renderBtn)}
      </div>
      {/* Desktop: 11 steps */}
      <div className="hidden sm:flex items-center gap-[3px] flex-wrap">
        {PROGRESS_STEPS.map(renderBtn)}
      </div>
    </>
  );
}

// ========================================
// DETAIL PANEL — RIGHT SIDE
// ========================================
function DetailPanel({
  proje,
  aksiyonlar,
  onUpdateAksiyon,
  onAddAksiyon,
  onEditProje,
  onEditAksiyon,
  onClickAksiyon,
  onUpdateProje,
  onDeleteProje,
  parentProje,
}: {
  proje: Proje;
  aksiyonlar: Aksiyon[];
  onUpdateAksiyon: (id: string, data: Partial<Aksiyon>) => void;
  onAddAksiyon?: () => void;
  onEditProje?: () => void;
  onEditAksiyon?: (aksiyon: Aksiyon) => void;
  onClickAksiyon?: (aksiyon: Aksiyon) => void;
  onUpdateProje?: (data: Partial<Proje>) => void;
  onDeleteProje?: () => void;
  parentProje?: Proje;
}) {
  const { t } = useTranslation();
  const { canEditAksiyon } = usePermissions();
  const [reviewPopoverOpen, setReviewPopoverOpen] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [reviewDateDraft, setReviewDateDraft] = useState(todayStr);
  const [infoExpanded, setInfoExpanded] = useState(false);

  const completedCount = aksiyonlar.filter((a) => a.status === "Achieved").length;
  const totalCount = aksiyonlar.length;

  // Status distribution for multi-color bar
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { "Achieved": 0, "On Track": 0, "At Risk": 0, "High Risk": 0, "Not Started": 0 };
    for (const a of aksiyonlar) counts[a.status] = (counts[a.status] ?? 0) + 1;
    return counts;
  }, [aksiyonlar]);

  const handleQuickProgress = (aksiyonId: string, progress: number) => {
    const aksiyon = aksiyonlar.find((a) => a.id === aksiyonId);
    let status: EntityStatus = "Not Started";
    if (progress === 0) {
      status = "Not Started";
    } else if (progress >= 100) {
      status = "Achieved";
    } else if (aksiyon?.startDate && aksiyon?.endDate) {
      // Tarih bazlı durum hesaplama
      const now = Date.now();
      const startMs = new Date(aksiyon.startDate).getTime();
      const endMs = new Date(aksiyon.endDate).getTime();
      const totalDuration = endMs - startMs;
      if (totalDuration > 0) {
        const expectedProgress = Math.min(100, Math.max(0, ((now - startMs) / totalDuration) * 100));
        const diff = expectedProgress - progress;
        const behindT = Number(localStorage.getItem("tyro-behind-threshold")) || 20;
        const atRiskT = Number(localStorage.getItem("tyro-atrisk-threshold")) || 10;
        if (diff > behindT) status = "High Risk";
        else if (diff > atRiskT) status = "At Risk";
        else status = "On Track";
      } else {
        status = "On Track";
      }
    } else {
      status = "On Track";
    }
    onUpdateAksiyon(aksiyonId, { progress, status });
    const aksName = aksiyon?.name ?? "";
    const statusLabel = getStatusLabel(status, t);
    toast.success(t("kokpit.actionUpdated"), {
      message: aksName,
      details: [
        { label: t("common.progress"), value: `%${progress}` },
        { label: t("common.status"), value: statusLabel },
      ],
    });
  };

  return (
    <motion.div
      key={proje.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-3 px-3 sm:px-5 py-3 sm:py-4"
    >
      {/* === HERO SECTION === */}
      {(() => {
        const p = proje.progress;
        const stColor = STATUS_HEX[proje.status] ?? "#94a3b8";
        const r = 32; const c = 2 * Math.PI * r;
        const dash = (p / 100) * c;
        return (
          <>
            {/* ── MOBILE layout: title full-width + progress bar ── */}
            <div className="sm:hidden flex flex-col gap-2">
              {/* Title + ID */}
              <div>
                <h2 className="text-[15px] font-bold text-tyro-text-primary leading-snug">
                  {proje.name}
                </h2>
                <p className="text-[11px] text-tyro-text-muted mt-0.5">
                  {proje.id}{proje.description ? ` · ${proje.description}` : ""}
                </p>
              </div>
              {/* Status + tags */}
              <div className="flex items-center flex-wrap gap-1.5">
                <StatusBadge status={proje.status} />
                {proje.tags && proje.tags.length > 0 && proje.tags.map((tag) => (
                  <TagChip key={tag} name={tag} size="sm" />
                ))}
              </div>
              {/* Horizontal progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-tyro-border/20">
                  <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: stColor, transition: "width 0.8s ease" }} />
                </div>
                <span className="text-[12px] font-extrabold tabular-nums" style={{ color: stColor }}>%{p}</span>
                <span className="text-[11px] text-tyro-text-muted tabular-nums">{completedCount}/{totalCount}</span>
              </div>
            </div>

            {/* ── DESKTOP layout: title left + circular progress right ── */}
            <div className="hidden sm:flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-[20px] font-bold text-tyro-text-primary leading-snug">
                  {proje.name}
                </h2>
                <div className="flex items-center gap-3 mt-1 ml-1">
                  {proje.owner && (
                    <span className="text-[12px] text-tyro-text-muted">
                      <span className="font-medium text-tyro-text-secondary">{proje.owner}</span>
                    </span>
                  )}
                  {proje.owner && proje.source && <span className="w-px h-3.5 bg-tyro-border/60 rounded-full" />}
                  {proje.source && (
                    <span className="text-[12px] text-tyro-text-muted">{proje.source}</span>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-2 mt-1.5">
                  <StatusBadge status={proje.status} />
                  {proje.tags && proje.tags.length > 0 && (
                    <>
                      <span className="w-px h-4 bg-tyro-border/40 rounded-full" />
                      {proje.tags.map((tag) => <TagChip key={tag} name={tag} size="sm" />)}
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-[80px] h-[80px]">
                  <svg width="100%" height="100%" viewBox="0 0 80 80" className="-rotate-90">
                    <circle cx={40} cy={40} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} opacity={0.3} />
                    <circle cx={40} cy={40} r={r} fill="none" stroke={stColor} strokeWidth={5} strokeLinecap="round"
                      strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={0}
                      style={{ transition: "all 0.8s ease", filter: `drop-shadow(0 0 4px ${stColor}40)` }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[16px] font-extrabold tabular-nums text-tyro-text-primary">%{p}</span>
                  </div>
                </div>
                <span className="text-[13px] font-bold text-tyro-text-muted mt-1 tabular-nums">{completedCount}/{totalCount}</span>
              </div>
            </div>
          </>
        );
      })()}

      {/* === INFO GRID — 4 column expandable === */}
      <div className="rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-tyro-border/30 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        {/* Always visible: 4 dates */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-tyro-border/40">
          <InfoCell icon={<Calendar size={12} />} label={t("common.startDate")} value={formatDate(proje.startDate)} />
          <InfoCell icon={<Calendar size={12} />} label={t("common.endDate")} value={formatDate(proje.endDate)} />
          <InfoCell icon={<Clock size={12} />} label={t("kokpit.control")} value={proje.reviewDate ? formatDate(proje.reviewDate) : "—"} className="border-t sm:border-t-0 border-tyro-border/40" />
          <InfoCell icon={<Users size={12} />} label={t("common.owner")} value={proje.owner} className="border-t sm:border-t-0 border-tyro-border/40" />
        </div>
        {/* Expandable rows */}
        <AnimatePresence>
          {infoExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {/* Row 2: kaynak, departman, oluşturulma, katılımcılar */}
              <div className="border-t border-tyro-border/15 grid grid-cols-2 sm:grid-cols-4 divide-x divide-tyro-border/40">
                <InfoCell icon={<Globe size={12} />} label={t("common.source")} value={proje.source} />
                <InfoCell icon={<Building2 size={12} />} label={t("common.department")} value={deptLabel(proje.department, t)} />
                <InfoCell icon={<Calendar size={12} />} label={t("common.createdAt")} value={proje.createdAt ? formatDate(proje.createdAt) : "—"} className="border-t sm:border-t-0 border-tyro-border/40" />
                <InfoCell label={t("common.participants")} value={proje.participants?.join(", ") || "—"} className="border-t sm:border-t-0 border-tyro-border/40" />
              </div>
              {/* Row 3: Proje ID + Açıklama
                   Empty descriptions fall back to an italic placeholder
                   hint so the row always reads with the same shape. */}
              <div className="border-t border-tyro-border/15 px-3 py-2.5 flex items-center gap-1.5">
                <span className="text-[11px] text-tyro-text-muted tabular-nums shrink-0">{proje.id}</span>
                <span className="text-tyro-text-muted">·</span>
                {proje.description?.trim() ? (
                  <p className="text-[11px] text-tyro-text-muted truncate">{proje.description}</p>
                ) : (
                  <p className="text-[11px] italic text-tyro-text-muted/70 truncate">
                    {t("forms.objective.descriptionEmpty")}
                  </p>
                )}
              </div>
              {/* Row 4: Ana Proje (sadece varsa) */}
              {parentProje && (
                <div className="border-t border-tyro-border/15 px-3 py-2.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-1">{t("kokpit.parentProject")}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-tyro-text-muted tabular-nums">{parentProje.id}</span>
                    <span className="text-[11px] font-medium text-tyro-text-primary truncate flex-1">{parentProje.name}</span>
                    <StatusBadge status={parentProje.status} />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Toggle */}
        <button
          type="button"
          onClick={() => setInfoExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 border-t border-tyro-border/15 text-tyro-text-muted hover:text-tyro-gold hover:bg-tyro-gold/5 transition-colors cursor-pointer"
        >
          <span className="text-[11px] font-semibold">{infoExpanded ? t("common.showLess") : t("kokpit.details")}</span>
          <ChevronDown size={13} className={`transition-transform duration-200 ${infoExpanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* === ACTIONS LIST === natural height — page scrolls, no internal scroll */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-bold text-tyro-text-primary">
            {t("kokpit.actionsCount", { count: totalCount })}
          </h3>
          {/* Aksiyon Ekle butonu kaldırıldı — FAB üzerinden erişiliyor */}
        </div>

        <div className="flex flex-col gap-2">
          {[...aksiyonlar]
            .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
            .map((aksiyon) => (
              <AksiyonRow
                key={aksiyon.id}
                aksiyon={aksiyon}
                index={aksiyon.sortOrder ?? 0}
                canEdit={canEditAksiyon(aksiyon.id)}
                onQuickProgress={(val) => handleQuickProgress(aksiyon.id, val)}
                onClick={() => onClickAksiyon?.(aksiyon)}
                onEdit={() => onEditAksiyon?.(aksiyon)}
              />
            ))}
          {aksiyonlar.length === 0 && (
            <p className="text-[12px] text-tyro-text-muted italic text-center py-6">
              {t("detail.noActionsYet")}
            </p>
          )}
        </div>
      </div>

      {/* Footer meta moved to expandable info card */}
    </motion.div>
  );
}

// Small info cell
function InfoCell({ icon, label, value, className }: { icon?: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className={`px-2 py-2 sm:px-3 sm:py-2.5 ${className ?? ""}`}>
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-tyro-text-muted">{icon}</span>
        <span className="text-[9px] sm:text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted">{label}</span>
      </div>
      <p className="text-[11px] sm:text-[12px] font-medium text-tyro-text-primary truncate">{value || "-"}</p>
    </div>
  );
}

// ========================================
// AKSIYON ROW
// ========================================
function AksiyonRow({
  aksiyon,
  index,
  canEdit,
  onQuickProgress,
  onEdit,
  onClick,
}: {
  aksiyon: Aksiyon;
  index: number;
  canEdit: boolean;
  onQuickProgress: (val: number) => void;
  onEdit?: () => void;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  const stColor = STATUS_HEX[aksiyon.status] ?? "#94a3b8";
  return (
    <div
      className="glass-card rounded-xl p-3 hover:shadow-md transition-all group/row cursor-pointer relative border-l-[3px] border-l-transparent"
      style={{ ["--hover-border" as string]: stColor }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = stColor; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent"; }}
      onClick={onClick}
    >
      {/* Top row: index + name + edit + status badge */}
      <div className="flex items-start gap-2">
        <span className="text-[11px] font-bold text-tyro-text-muted w-5 shrink-0 mt-0.5">{index}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h4 className="text-[12px] font-semibold text-tyro-text-primary flex-1 leading-snug hover:text-tyro-navy transition-colors">
              {aksiyon.name}
            </h4>
            {onEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-tyro-text-muted hover:text-tyro-navy hover:bg-tyro-navy/5 cursor-pointer sm:opacity-0 sm:group-hover/row:opacity-100 transition-all shrink-0"
              >
                <Pencil size={12} />
              </button>
            )}
            <StatusBadge status={aksiyon.status} />
          </div>
          <span className="text-[11px] text-tyro-text-muted mt-0.5 block">
            {formatDate(aksiyon.startDate)} – {formatDate(aksiyon.endDate)}
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-2" />

      {/* Progress bar + Quick buttons */}
      {(() => {
        const p = aksiyon.progress;
        const statusColor = STATUS_HEX[aksiyon.status] ?? "#94a3b8";
        return (
          <div className="flex flex-col gap-1.5 ml-7">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-tyro-border/15 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${p}%`, backgroundColor: statusColor, transition: "width 500ms ease" }}
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color: statusColor }}>
                %{p}
              </span>
            </div>
            {canEdit && <QuickProgressButtons current={p} onChange={onQuickProgress} statusColor={statusColor} />}
          </div>
        );
      })()}
    </div>
  );
}

// ========================================
// MAIN: MASTER-DETAIL VIEW
// ========================================
export default function MasterDetailView({ projeler, onOpenWizard, externalSearch = "", externalStatusFilter, externalSourceFilter, externalSortBy, externalSortAsc, aksiyonFilters, onSelectionChange }: MasterDetailViewProps) {
  const { t } = useTranslation();
  const sidebarTheme = useSidebarTheme();
  const { filterProjeler, canCreateAksiyon, canEditProje, canCreateProje } = usePermissions();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"progress" | "name" | "date" | "status">("progress");
  const [sortAsc, setSortAsc] = useState(true);

  // Selected
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(selectedId);
  }, [selectedId, onSelectionChange]);

  // Mobile detail mode
  const [mobileDetail, setMobileDetail] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = filterProjeler(projeler);
    const combinedSearch = (externalSearch || search).trim();
    if (combinedSearch) {
      const q = combinedSearch.toLocaleLowerCase("tr");
      list = list.filter((h) => {
        const fields = [h.id, h.name, h.owner, h.department, h.source, h.status, h.description, ...(h.tags ?? [])];
        return fields.filter(Boolean).join(" ").toLocaleLowerCase("tr").includes(q);
      });
    }
    const effectiveStatus = externalStatusFilter ?? statusFilter;
    const effectiveSource = externalSourceFilter ?? sourceFilter;
    const effectiveSort = externalSortBy ?? sortBy;
    const effectiveSortAsc = externalSortAsc ?? sortAsc;

    if (effectiveStatus !== "all") {
      const statuses = effectiveStatus.includes(",") ? effectiveStatus.split(",").map((s) => s.trim()) : [effectiveStatus];
      list = list.filter((h) => statuses.includes(h.status));
    }
    if (effectiveSource !== "all") list = list.filter((h) => h.source === effectiveSource);

    // Sort with direction
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (effectiveSort) {
        case "id": cmp = a.id.localeCompare(b.id); break;
        case "name": cmp = a.name.localeCompare(b.name, "tr"); break;
        case "date":
        case "endDate": cmp = new Date(a.endDate).getTime() - new Date(b.endDate).getTime(); break;
        case "reviewDate": cmp = new Date(a.reviewDate ?? "9999").getTime() - new Date(b.reviewDate ?? "9999").getTime(); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "progress": cmp = a.progress - b.progress; break;
        default: cmp = a.id.localeCompare(b.id);
      }
      return effectiveSortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [projeler, search, statusFilter, sourceFilter, sortBy, sortAsc, externalSearch, externalStatusFilter, externalSourceFilter, externalSortBy, externalSortAsc, filterProjeler]);

  // Aksiyonlar from store — fetched once at top level
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const updateAksiyon = useDataStore((s) => s.updateAksiyon);
  const updateProje = useDataStore((s) => s.updateProje);
  const deleteProje = useDataStore((s) => s.deleteProje);
  const deleteAksiyon = useDataStore((s) => s.deleteAksiyon);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Panel state for forms
  const [aksiyonPanelOpen, setAksiyonPanelOpen] = useState(false);
  const [projePanelOpen, setProjePanelOpen] = useState(false);
  const [editingAksiyon, setEditingAksiyon] = useState<Aksiyon | null>(null);
  const [viewingAksiyon, setViewingAksiyon] = useState<Aksiyon | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [actionsFabOpen, setActionsFabOpen] = useState(false);
  const [reviewPopoverOpen, setReviewPopoverOpen] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [reviewDateDraft, setReviewDateDraft] = useState(todayStr);
  const aksiyonCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of aksiyonlar) map.set(a.projeId, (map.get(a.projeId) ?? 0) + 1);
    return map;
  }, [aksiyonlar]);

  // Auto-select first if none selected
  const firstFilteredId = filtered.length > 0 ? filtered[0].id : null;
  useEffect(() => {
    if (!selectedId && firstFilteredId) {
      setSelectedId(firstFilteredId);
    }
  }, [firstFilteredId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProje = useMemo(
    () => projeler.find((h) => h.id === selectedId),
    [projeler, selectedId]
  );

  const selectedAksiyonlar = useMemo(() => {
    if (!selectedId) return [];
    let list = aksiyonlar.filter((a) => a.projeId === selectedId);
    if (aksiyonFilters) {
      if (aksiyonFilters.statuses?.length) list = list.filter((a) => aksiyonFilters.statuses!.includes(a.status));
      if (aksiyonFilters.owners?.length) list = list.filter((a) => aksiyonFilters.owners!.includes(a.owner));
      if (aksiyonFilters.progressMin !== undefined && aksiyonFilters.progressMin > 0) list = list.filter((a) => a.progress >= aksiyonFilters.progressMin!);
      if (aksiyonFilters.progressMax !== undefined && aksiyonFilters.progressMax < 100) list = list.filter((a) => a.progress <= aksiyonFilters.progressMax!);
    }
    return list.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
  }, [aksiyonlar, selectedId, aksiyonFilters]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!filtered.length) return;
    const currentIdx = filtered.findIndex((h) => h.id === selectedId);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(currentIdx + 1, filtered.length - 1);
      setSelectedId(filtered[next].id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(currentIdx - 1, 0);
      setSelectedId(filtered[prev].id);
    }
  }, [filtered, selectedId]);

  const hasActiveFilters = statusFilter !== "all" || sourceFilter !== "all" || search.trim() !== "";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSourceFilter("all");
  };

  const handleSelectProje = (id: string) => {
    setSelectedId(id);
    setMobileDetail(true);
  };

  // ===== LEFT PANEL =====
  const leftPanel = (
    <div
      className={`flex flex-col h-full bg-tyro-surface/50 rounded-xl border border-tyro-border/20 overflow-hidden ${
        mobileDetail ? "hidden lg:flex" : "flex"
      }`}
      style={{ width: "100%", maxWidth: "100%" }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Filters moved to page-level toolbar */}

      {/* Divider */}
      <div className="h-px bg-tyro-border/30 mx-3" />

      {/* Card list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
        {filtered.map((h) => (
          <MasterListCard
            key={h.id}
            proje={h}
            aksiyonCount={aksiyonCountMap.get(h.id) ?? 0}
            isSelected={h.id === selectedId}
            onClick={() => handleSelectProje(h.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-[12px] text-tyro-text-muted mb-2">{t("kokpit.noObjectivesFound")}</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] text-tyro-navy font-semibold hover:underline cursor-pointer"
              >
                {t("kokpit.clearFilters")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Count footer */}
      <div className="px-3 py-2 border-t border-tyro-border/20 text-[11px] text-tyro-text-secondary text-center font-medium">
        <span className="text-tyro-text-primary font-bold">{filtered.length}</span> / {projeler.length} {t("nav.objectives")}
      </div>
    </div>
  );

  // ===== RIGHT PANEL =====
  const rightPanel = (
    <div
      className={`min-w-0 bg-tyro-surface/30 rounded-xl border border-tyro-border/20 overflow-hidden ${
        !mobileDetail ? "hidden lg:flex lg:flex-col lg:flex-1" : "flex flex-col w-full lg:flex-1"
      }`}
    >
      {/* Mobile back button */}
      <div className="lg:hidden px-4 pt-3 pb-2 border-b border-tyro-border/20">
        <button
          type="button"
          onClick={() => setMobileDetail(false)}
          className="flex items-center gap-2 text-[13px] font-semibold text-tyro-navy cursor-pointer active:opacity-70"
        >
          <ArrowLeft size={16} /> {t("detail.backToList", "Proje Listesi")}
        </button>
      </div>

      {selectedProje ? (
        <DetailPanel
          proje={selectedProje}
          aksiyonlar={selectedAksiyonlar}
          onUpdateAksiyon={updateAksiyon}
          onAddAksiyon={() => { if (canCreateAksiyon) setAksiyonPanelOpen(true); }}
          onEditProje={() => { if (selectedProje && canEditProje(selectedProje.id)) setProjePanelOpen(true); }}
          onClickAksiyon={(a) => { setViewingAksiyon(a); }}
          onEditAksiyon={(a) => { setEditingAksiyon(a); }}
          onUpdateProje={(data) => selectedProje && updateProje(selectedProje.id, data)}
          parentProje={selectedProje.parentObjectiveId ? projeler.find((h) => h.id === selectedProje.parentObjectiveId) : undefined}
        />
      ) : (
        <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center gap-3 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-tyro-bg flex items-center justify-center">
            <Target size={28} className="text-tyro-text-muted/40" />
          </div>
          <h3 className="text-[14px] font-semibold text-tyro-text-muted">
            {t("kokpit.selectObjective")}
          </h3>
          <p className="text-[12px] text-tyro-text-muted max-w-[280px]">
            {t("kokpit.selectObjectiveDesc")}
          </p>
        </div>
      )}
    </div>
  );


  return (
    <div className="flex min-h-[500px] relative items-start gap-1">
      {/* Left: 360px on desktop, full on mobile — hidden when detail open on mobile.
          Sticky sidebar so project list stays visible while right-panel content
          (proje detayı + aksiyonlar) scrolls naturally with the page. */}
      <div className={`lg:w-[360px] lg:shrink-0 lg:sticky lg:top-3 lg:max-h-[calc(100vh-100px)] lg:h-[calc(100vh-100px)] ${mobileDetail ? "hidden lg:block" : "w-full lg:w-[360px]"}`}>
        {leftPanel}
      </div>
      {/* Panel divider */}
      <div className="hidden lg:block w-px bg-tyro-border/30 mx-1 shrink-0 self-stretch" />
      {/* Right: flex-1, content-height — grows with aksiyon count, page scrolls */}
      {rightPanel}

      {/* FABs removed — actions moved to page-level toolbar */}
      {false && selectedProje && (
      <div className="fixed bottom-24 right-20 lg:bottom-6 lg:right-[180px] z-40">
        <AnimatePresence>
          {actionsFabOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30"
                onClick={() => setActionsFabOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-16 right-0 z-50 w-[230px] rounded-2xl bg-white dark:bg-tyro-surface border border-tyro-border/50 shadow-2xl overflow-hidden py-1"
              >
                {/* Kontrol Tarihi */}
                <Popover placement="left" isOpen={reviewPopoverOpen} onOpenChange={(open) => { setReviewPopoverOpen(open); if (open) setReviewDateDraft(todayStr); }}>
                  <PopoverTrigger>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-teal-50/50 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-sm shrink-0">
                        <CalendarCheck size={15} className="text-white" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[13px] font-semibold text-tyro-text-primary leading-tight">Kontrol Tarihi</p>
                        <p className="text-[11px] text-tyro-text-muted leading-tight mt-0.5">{t("kokpit.updateReviewDate")}</p>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-3 w-[220px]">
                    <p className="text-[11px] font-semibold text-tyro-text-secondary mb-2">Kontrol Tarihi</p>
                    <div className="mb-2">
                      <DatePicker
                        value={toCalendarDate(reviewDateDraft)}
                        onChange={(date) => setReviewDateDraft(fromCalendarDate(date))}
                        variant="bordered"
                        size="sm"
                        granularity="day"
                        classNames={{ inputWrapper: "border-tyro-border", input: "font-semibold text-tyro-text-primary" }}
                      />
                    </div>
                    <Button
                      size="sm"
                      className="w-full rounded-lg text-[11px] font-semibold bg-teal-500 text-white"
                      startContent={<Check size={13} />}
                      onPress={() => {
                        updateProje(selectedProje.id, { reviewDate: reviewDateDraft });
                        toast.success("Kontrol Tarihi Güncellendi", {
                          message: selectedProje.name,
                          details: [{ label: "Yeni Tarih", value: reviewDateDraft }],
                        });
                        setReviewPopoverOpen(false);
                        setActionsFabOpen(false);
                      }}
                    >
                      Güncelle
                    </Button>
                  </PopoverContent>
                </Popover>
                <div className="h-px bg-tyro-border/15 mx-4" />
                {/* Düzenle */}
                <button
                  type="button"
                  disabled={!selectedProje || !canEditProje(selectedProje.id)}
                  onClick={() => { setActionsFabOpen(false); setProjePanelOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-tyro-gold/5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
                    <Pencil size={15} className="text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[13px] font-semibold text-tyro-text-primary leading-tight">{t("common.edit")}</p>
                    <p className="text-[11px] text-tyro-text-muted leading-tight mt-0.5">{t("kokpit.editProjectInfo")}</p>
                  </div>
                </button>
                <div className="h-px bg-tyro-border/15 mx-4" />
                {/* Sil */}
                <button
                  type="button"
                  onClick={() => {
                    setActionsFabOpen(false);
                    setConfirmMessage(`"${selectedProje.name}" hedefini silmek istediğinize emin misiniz?`);
                    setConfirmAction(() => () => {
                      const ok = deleteProje(selectedProje.id);
                      if (ok) {
                        toast.success("Silindi", { message: selectedProje.name });
                        setSelectedId(null);
                      } else {
                        toast.error("Silinemedi", { message: "Bu hedefe bağlı aksiyonlar var." });
                      }
                    });
                    setConfirmOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50/50 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-sm shrink-0">
                    <Trash2 size={15} className="text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[13px] font-semibold text-red-600 leading-tight">{t("common.delete")}</p>
                    <p className="text-[11px] text-tyro-text-muted leading-tight mt-0.5">{t("kokpit.deleteProjectPermanently")}</p>
                  </div>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={() => { setActionsFabOpen((v) => !v); setFabOpen(false); }}
          className="h-12 rounded-full bg-tyro-navy text-white flex items-center justify-center shadow-[0_4px_12px_rgba(30,58,95,0.3)] cursor-pointer z-40 relative w-12 lg:w-auto lg:h-11 lg:px-4 lg:gap-2 lg:rounded-xl"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <MoreVertical size={18} />
          <span className="hidden lg:inline text-[12px] font-semibold">{t("common.edit")}</span>
        </motion.button>
      </div>
      )}

      {false && (
      <div className="fixed bottom-24 right-6 lg:bottom-6 lg:right-[68px] z-40">
        <AnimatePresence>
          {fabOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30"
                onClick={() => setFabOpen(false)}
              />
              {/* FAB Menu */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-16 right-0 z-50 w-[230px] rounded-2xl bg-white dark:bg-tyro-surface border border-tyro-border/50 shadow-2xl overflow-hidden py-1"
              >
                <button
                  type="button"
                  disabled={!canCreateProje}
                  onClick={() => { setFabOpen(false); onOpenWizard?.(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-tyro-gold/5 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tyro-gold to-tyro-gold-light flex items-center justify-center shadow-sm shrink-0">
                    <Crosshair size={15} className="text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[13px] font-semibold text-tyro-text-primary leading-tight">{t("kokpit.projectWizard")}</p>
                    <p className="text-[11px] text-tyro-text-muted leading-tight mt-0.5">{t("kokpit.projectWizardDesc")}</p>
                  </div>
                </button>
                <div className="h-px bg-tyro-border/15 mx-4" />
                <button
                  type="button"
                  disabled={!canCreateAksiyon}
                  onClick={() => { setFabOpen(false); setAksiyonPanelOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-tyro-navy/5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tyro-navy to-tyro-navy-light flex items-center justify-center shadow-sm shrink-0">
                    <CircleCheckBig size={15} className="text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[13px] font-semibold text-tyro-text-primary leading-tight">{t("kokpit.newAction")}</p>
                    <p className="text-[11px] text-tyro-text-muted leading-tight mt-0.5">{t("kokpit.newActionDesc")}</p>
                  </div>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* FAB Button */}
        <motion.button
          type="button"
          onClick={() => { setFabOpen((v) => !v); setActionsFabOpen(false); }}
          className="h-12 rounded-full text-white flex items-center justify-center shadow-lg cursor-pointer z-40 relative w-12 lg:w-auto lg:h-11 lg:px-4 lg:gap-2 lg:rounded-xl"
          style={{ backgroundColor: sidebarTheme.brandStrategy ?? sidebarTheme.accentColor ?? "#c8922a" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Plus size={20} />
          <span className="hidden lg:inline text-[12px] font-semibold">Yeni</span>
        </motion.button>
      </div>
      )}

      {/* Aksiyon Ekle SlidingPanel */}
      <SlidingPanel
        isOpen={aksiyonPanelOpen}
        onClose={() => setAksiyonPanelOpen(false)}
        title={t("kokpit.createNewAction")}
        hideHeader
      >
        {selectedProje && (
          <AksiyonForm
            defaultProjeId={selectedProje.id}
            onSuccess={() => setAksiyonPanelOpen(false)}
            onClose={() => setAksiyonPanelOpen(false)}
          />
        )}
      </SlidingPanel>

      {/* Proje Düzenle SlidingPanel */}
      <SlidingPanel
        isOpen={projePanelOpen}
        onClose={() => setProjePanelOpen(false)}
        title={t("kokpit.editProjectCard")}
        hideHeader
      >
        {selectedProje && (
          <ProjeForm
            proje={selectedProje}
            onSuccess={() => setProjePanelOpen(false)}
            onClose={() => setProjePanelOpen(false)}
          />
        )}
      </SlidingPanel>

      {/* Aksiyon Detay SlidingPanel */}
      <SlidingPanel
        isOpen={!!viewingAksiyon}
        onClose={() => setViewingAksiyon(null)}
        title={t("kokpit.actionDetail")}
        hideHeader
      >
        {viewingAksiyon && (
          <AksiyonDetail
            aksiyon={viewingAksiyon}
            onClose={() => setViewingAksiyon(null)}
            onDelete={() => {
              setConfirmMessage(`"${viewingAksiyon.name}" aksiyonunu silmek istediğinize emin misiniz?`);
              setConfirmAction(() => () => {
                deleteAksiyon(viewingAksiyon.id);
                toast.success(t("toast.actionDeleted", "Aksiyon silindi"), { message: viewingAksiyon.name });
                setViewingAksiyon(null);
              });
              setConfirmOpen(true);
            }}
          />
        )}
      </SlidingPanel>

      {/* Aksiyon Düzenle SlidingPanel */}
      <SlidingPanel
        isOpen={!!editingAksiyon}
        onClose={() => setEditingAksiyon(null)}
        title={t("kokpit.editActionTitle")}
        hideHeader
      >
        {editingAksiyon && (
          <AksiyonForm
            aksiyon={editingAksiyon}
            defaultProjeId={editingAksiyon.projeId}
            onSuccess={() => setEditingAksiyon(null)}
            onClose={() => setEditingAksiyon(null)}
          />
        )}
      </SlidingPanel>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        message={confirmMessage}
      />
    </div>
  );
}
