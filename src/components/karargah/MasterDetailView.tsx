import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Input, Button, Tooltip, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
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
import HedefForm from "@/components/hedefler/HedefForm";
import AksiyonDetail from "@/components/aksiyonlar/AksiyonDetail";
import { progressColor } from "@/lib/colorUtils";
import { formatDate } from "@/lib/dateUtils";
import { STATUS_DOT_COLOR, getStatusLabel } from "@/lib/constants";
import { toast } from "@/stores/toastStore";
import type { Hedef, Aksiyon, EntityStatus, Source } from "@/types";

// ===== STATUS BAR COLORS =====
const STATUS_BAR: Record<EntityStatus, string> = {
  "Not Started": "#94a3b8",
  "On Track": "#10b981",   // emerald — StatusBadge ile tutarlı
  "At Risk": "#f59e0b",
  "Behind": "#ef4444",
  "Achieved": "#3b82f6",   // blue — StatusBadge ile tutarlı
};

// ===== QUICK PROGRESS STEPS =====
const PROGRESS_STEPS = [0, 25, 50, 75, 100];

interface MasterDetailViewProps {
  hedefler: Hedef[];
  onOpenWizard?: () => void;
}

// ========================================
// MASTER LIST CARD
// ========================================
function MasterListCard({
  hedef,
  aksiyonCount,
  isSelected,
  onClick,
}: {
  hedef: Hedef;
  aksiyonCount: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const pColor = progressColor(hedef.progress);
  // Mini circular progress (SVG)
  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (hedef.progress / 100) * circumference;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all duration-200 cursor-pointer group relative ${
        isSelected
          ? "bg-tyro-navy/[0.04] border-tyro-navy/20 shadow-[0_2px_8px_rgba(30,58,95,0.1)] translate-x-1"
          : "bg-tyro-bg/40 border-transparent hover:bg-tyro-surface hover:border-tyro-border/30 hover:shadow-sm"
      }`}
    >
      {/* Status bar left edge — 6px, vivid color */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
        style={{ backgroundColor: STATUS_BAR[hedef.status] }}
      />

      <div className="pl-4 pr-3 py-2.5">
        {/* Row 1: Name + Mini circular progress + % */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h4 className="text-[12px] font-semibold text-tyro-text-primary leading-snug line-clamp-2 flex-1">
            {hedef.name}
          </h4>
          <div className="relative w-[36px] h-[36px] shrink-0 flex items-center justify-center">
            <svg width="36" height="36" className="-rotate-90">
              <defs>
                <linearGradient id={`pg-${hedef.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={pColor} stopOpacity="0.5" />
                  <stop offset="100%" stopColor={pColor} />
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-tyro-border/10" />
              <circle cx="18" cy="18" r="15" fill="none" stroke={`url(#pg-${hedef.id})`} strokeWidth="3"
                strokeDasharray={2 * Math.PI * 15} strokeDashoffset={2 * Math.PI * 15 - (hedef.progress / 100) * 2 * Math.PI * 15} strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" }}
              />
            </svg>
            {hedef.progress >= 100 ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={pColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black tabular-nums" style={{ color: pColor }}>
                {hedef.progress}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Owner + Source badge */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] text-tyro-text-muted truncate">{hedef.owner}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-tyro-border/20 text-tyro-text-muted font-medium shrink-0">
            {hedef.source}
          </span>
        </div>

        {/* Row 3: Dates */}
        <span className="text-[10px] text-tyro-text-muted/70">
          {formatDate(hedef.startDate)} → {formatDate(hedef.endDate)}
        </span>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="w-full flex items-center justify-center gap-1 mt-1 py-0.5 text-tyro-text-muted hover:text-tyro-gold transition-colors cursor-pointer"
        >
          <ChevronDown size={11} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </button>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-2 mt-1 border-t border-tyro-border/15 grid grid-cols-2 gap-x-3 gap-y-1.5">
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-tyro-text-muted/60 block">{t("common.department", "Departman")}</span>
                  <span className="text-[10px] text-tyro-text-secondary font-medium">{hedef.department || "—"}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-tyro-text-muted/60 block">{t("forms.objective.reviewDate", "Kontrol")}</span>
                  <span className="text-[10px] text-tyro-text-secondary font-medium">{hedef.reviewDate ? formatDate(hedef.reviewDate) : "—"}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-tyro-text-muted/60 block">{t("nav.actions", "Aksiyonlar")}</span>
                  <span className="text-[10px] text-tyro-text-secondary font-medium">{aksiyonCount} aksiyon</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-tyro-text-muted/60 block">{t("common.status", "Durum")}</span>
                  <StatusBadge status={hedef.status} showTooltip={false} />
                </div>
                {hedef.tags && hedef.tags.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-[8px] uppercase tracking-wider text-tyro-text-muted/60 block mb-0.5">{t("forms.objective.tags", "Etiketler")}</span>
                    <div className="flex flex-wrap gap-1">
                      {hedef.tags.map((tag) => (
                        <TagChip key={tag} name={tag} size="sm" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}

// ========================================
// QUICK PROGRESS BUTTONS
// ========================================
// Chip color matching AksiyonForm gradient palette
function chipBg(v: number, selected: boolean): string {
  if (!selected) return "bg-white/60 dark:bg-white/10 text-tyro-text-muted/50 hover:text-tyro-text-muted border border-tyro-border/15 hover:border-tyro-border/30";
  if (v === 0) return "bg-slate-400 text-white shadow-md";
  if (v <= 25) return "bg-red-500 text-white shadow-md";
  if (v <= 50) return "bg-amber-500 text-white shadow-md";
  if (v <= 75) return "bg-yellow-500 text-white shadow-md";
  return "bg-emerald-500 text-white shadow-md";
}

function QuickProgressButtons({
  current,
  onChange,
}: {
  current: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex items-center gap-[3px]">
      {PROGRESS_STEPS.map((step) => {
        const isExact = current === step || (step === 100 && current >= 100);
        const isPassed = current > step; // geçilmiş adımlar
        const isActive = current >= step && step > 0;
        return (
          <button
            key={step}
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(step); }}
            className={`relative min-w-[34px] h-[24px] rounded-lg text-[9px] font-bold tabular-nums cursor-pointer transition-all ${
              isExact
                ? chipBg(step, true) + " scale-110"
                : isPassed
                ? chipBg(step, true).replace("shadow-md", "").replace("text-white", "text-white/80") + " opacity-50"
                : chipBg(step, false)
            }`}
          >
            <span className={isPassed && !isExact ? "line-through decoration-[1.5px]" : ""}>{step}%</span>
          </button>
        );
      })}
    </div>
  );
}

// ========================================
// DETAIL PANEL — RIGHT SIDE
// ========================================
function DetailPanel({
  hedef,
  aksiyonlar,
  onUpdateAksiyon,
  onAddAksiyon,
  onEditHedef,
  onEditAksiyon,
  onClickAksiyon,
  onUpdateHedef,
  onDeleteHedef,
  parentHedefName,
}: {
  hedef: Hedef;
  aksiyonlar: Aksiyon[];
  onUpdateAksiyon: (id: string, data: Partial<Aksiyon>) => void;
  onAddAksiyon?: () => void;
  onEditHedef?: () => void;
  onEditAksiyon?: (aksiyon: Aksiyon) => void;
  onClickAksiyon?: (aksiyon: Aksiyon) => void;
  onUpdateHedef?: (data: Partial<Hedef>) => void;
  onDeleteHedef?: () => void;
  parentHedefName?: string;
}) {
  const { t } = useTranslation();
  const [reviewPopoverOpen, setReviewPopoverOpen] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [reviewDateDraft, setReviewDateDraft] = useState(todayStr);
  const [infoExpanded, setInfoExpanded] = useState(false);

  const completedCount = aksiyonlar.filter((a) => a.status === "Achieved").length;
  const totalCount = aksiyonlar.length;

  // Status distribution for multi-color bar
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { "Achieved": 0, "On Track": 0, "At Risk": 0, "Behind": 0, "Not Started": 0 };
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
        if (diff > 20) status = "Behind";
        else if (diff > 10) status = "At Risk";
        else status = "On Track";
      } else {
        status = "On Track";
      }
    } else {
      status = "On Track";
    }
    onUpdateAksiyon(aksiyonId, { progress, status });
    const aksName = aksiyon?.name ?? "";
    const statusLabel = status === "Not Started" ? "Başlanmadı" : status === "Achieved" ? "Tamamlandı" : status === "Behind" ? "Gecikmeli" : status === "At Risk" ? "Risk Altında" : "Yolunda";
    toast.success(t("karargah.actionUpdated"), `"${aksName}" → %${progress} · ${statusLabel}`);
  };

  return (
    <motion.div
      key={hedef.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-3 overflow-y-auto h-full px-5 py-4"
    >
      {/* === HERO SECTION === */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[20px] font-bold text-tyro-text-primary leading-snug flex-1">
            {hedef.name}
          </h2>
          {/* Actions moved to FAB */}
        </div>
        {hedef.description && (
          <p className="text-[12px] text-tyro-text-muted leading-relaxed mt-1 line-clamp-2">
            {hedef.description}
          </p>
        )}
        <div className="mt-1.5">
          <StatusBadge status={hedef.status} />
        </div>
        {/* Tags */}
        {hedef.tags && hedef.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {hedef.tags.map((tag) => (
              <TagChip key={tag} name={tag} size="sm" />
            ))}
          </div>
        )}
      </div>

      {/* === OBJECTIVE INFO — expandable glass card === */}
      <div className="rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        {/* Always visible: dates + review date */}
        <div className="grid grid-cols-3 divide-x divide-tyro-border/15">
          <InfoCell icon={<Calendar size={12} />} label={t("common.startDate")} value={formatDate(hedef.startDate)} />
          <InfoCell icon={<Calendar size={12} />} label={t("common.endDate")} value={formatDate(hedef.endDate)} />
          <InfoCell icon={<Clock size={12} />} label={t("forms.objective.reviewDate", "Kontrol")} value={hedef.reviewDate ? formatDate(hedef.reviewDate) : "—"} />
        </div>
        {/* Expandable: owner, dept, source, participants */}
        <AnimatePresence>
          {infoExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-tyro-border/15 grid grid-cols-3 divide-x divide-tyro-border/15">
                <InfoCell icon={<Users size={12} />} label={t("common.owner")} value={hedef.owner} />
                <InfoCell icon={<Building2 size={12} />} label={t("common.department", "Departman")} value={hedef.department} />
                <InfoCell icon={<Globe size={12} />} label={t("common.source")} value={hedef.source} />
              </div>
              {/* Parent Objective */}
              {parentHedefName && (
                <div className="border-t border-tyro-border/15 px-3 py-2">
                  <span className="text-[9px] uppercase tracking-wider text-tyro-text-muted/60 block mb-0.5">{t("forms.objective.parentObjective", "Ana Hedef")}</span>
                  <p className="text-[11px] text-tyro-text-primary font-medium">{parentHedefName}</p>
                </div>
              )}
              {/* Participants */}
              {hedef.participants && hedef.participants.length > 0 && (
                <div className="border-t border-tyro-border/15 px-3 py-2">
                  <span className="text-[9px] uppercase tracking-wider text-tyro-text-muted/60 block mb-1">{t("forms.objective.participants", "Katılımcılar")}</span>
                  <p className="text-[11px] text-tyro-text-secondary">{hedef.participants.join(", ")}</p>
                </div>
              )}
              {/* Tags already shown in header */}
              {/* Meta */}
              {(hedef.createdBy || hedef.updatedBy) && (
                <div className="border-t border-tyro-border/15 px-3 py-2 flex gap-4">
                  {hedef.createdBy && (
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-tyro-text-muted/60 block">{t("common.createdBy", "Oluşturan")}</span>
                      <span className="text-[10px] text-tyro-text-secondary">{hedef.createdBy}{hedef.createdAt ? ` · ${formatDate(hedef.createdAt)}` : ""}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Toggle button — visible and clear */}
        <button
          type="button"
          onClick={() => setInfoExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 border-t border-tyro-border/15 text-tyro-text-muted hover:text-tyro-gold hover:bg-tyro-gold/5 transition-colors cursor-pointer"
        >
          <span className="text-[10px] font-semibold">{infoExpanded ? "Daha az" : "Detaylar"}</span>
          <ChevronDown size={13} className={`transition-transform duration-200 ${infoExpanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Description moved to header as subtitle */}

      {/* === PROGRESS — gradient bar matching AksiyonForm style === */}
      {(() => {
        const p = hedef.progress;
        const barGradient = p <= 25 ? "from-red-400 to-red-500"
          : p <= 50 ? "from-amber-400 to-amber-500"
          : p <= 75 ? "from-yellow-400 to-emerald-400"
          : "from-emerald-400 to-emerald-500";
        const textColor = p <= 25 ? "text-red-500"
          : p <= 50 ? "text-amber-500"
          : p <= 75 ? "text-yellow-600"
          : "text-emerald-500";
        return (
      <div className="rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.04)] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-tyro-text-muted shrink-0">
            {t("common.progress", "İlerleme")}
          </span>
          <div className="flex-1 h-3 rounded-full bg-tyro-border/15 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
              style={{ width: `${p}%`, transition: "width 500ms ease, background 300ms ease" }}
            />
          </div>
          <span className={`text-[15px] font-extrabold tabular-nums shrink-0 ${p === 0 ? "text-tyro-text-muted" : textColor}`}>
            %{p}
          </span>
          <span className="text-[10px] text-tyro-text-muted shrink-0">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>
        );
      })()}

      {/* === ACTIONS LIST === */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-bold text-tyro-text-primary">
            {t("karargah.actionsCount", { count: totalCount })}
          </h3>
          {/* Aksiyon Ekle butonu kaldırıldı — FAB üzerinden erişiliyor */}
        </div>

        <div className="flex flex-col gap-2">
          {aksiyonlar
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((aksiyon, idx) => (
              <AksiyonRow
                key={aksiyon.id}
                aksiyon={aksiyon}
                index={idx + 1}
                canEdit={true}
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
function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-tyro-text-muted">{icon}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-tyro-text-muted">{label}</span>
      </div>
      <p className="text-[12px] font-medium text-tyro-text-primary truncate">{value || "-"}</p>
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
  const statusIcon = aksiyon.status === "Achieved" ? "✅" : aksiyon.status === "On Track" ? "▶" : aksiyon.status === "At Risk" ? "⚠" : "○";

  return (
    <div className="glass-card rounded-xl p-3 hover:shadow-md transition-all group/row cursor-pointer relative hover:border-l-[3px] hover:border-l-tyro-navy/30" onClick={onClick}>
      {/* Top row: index + name + edit + status badge */}
      <div className="flex items-start gap-2 mb-1.5">
        <span className="text-[11px] font-bold text-tyro-text-muted w-5 shrink-0 mt-0.5">{index}</span>
        <span className="text-[11px] mr-1">{statusIcon}</span>
        <h4 className="text-[12px] font-semibold text-tyro-text-primary flex-1 leading-snug hover:text-tyro-navy transition-colors">
          {aksiyon.name}
        </h4>
        {onEdit && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-tyro-text-muted hover:text-tyro-navy hover:bg-tyro-navy/5 cursor-pointer opacity-0 group-hover/row:opacity-100 transition-all shrink-0"
          >
            <Pencil size={12} />
          </button>
        )}
        <StatusBadge status={aksiyon.status} />
      </div>

      {/* Owner + Dates */}
      <div className="flex items-center gap-2 ml-7 mb-2">
        <span className="text-[10px] text-tyro-text-muted">
          {aksiyon.owner || "—"} · {formatDate(aksiyon.startDate)} – {formatDate(aksiyon.endDate)}
        </span>
      </div>

      {/* Progress bar + Quick buttons */}
      {(() => {
        const p = aksiyon.progress;
        const barGrad = p <= 25 ? "from-red-400 to-red-500"
          : p <= 50 ? "from-amber-400 to-amber-500"
          : p <= 75 ? "from-yellow-400 to-emerald-400"
          : "from-emerald-400 to-emerald-500";
        const txtColor = p === 0 ? "text-tyro-text-muted"
          : p <= 25 ? "text-red-500"
          : p <= 50 ? "text-amber-500"
          : p <= 75 ? "text-yellow-600"
          : "text-emerald-500";
        return (
          <div className="flex items-center gap-3 ml-7">
            {canEdit && <QuickProgressButtons current={p} onChange={onQuickProgress} />}
            <div className="flex-1 h-2 rounded-full bg-tyro-border/15 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barGrad}`}
                style={{ width: `${p}%`, transition: "width 500ms ease" }}
              />
            </div>
            <span className={`text-[11px] font-bold tabular-nums shrink-0 ${txtColor}`}>
              %{p}
            </span>
          </div>
        );
      })()}
    </div>
  );
}

// ========================================
// MAIN: MASTER-DETAIL VIEW
// ========================================
export default function MasterDetailView({ hedefler, onOpenWizard }: MasterDetailViewProps) {
  const { t } = useTranslation();
  const sidebarTheme = useSidebarTheme();
  const { filterHedefler } = usePermissions();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"progress" | "name" | "date" | "status">("progress");
  const [sortAsc, setSortAsc] = useState(true);

  // Selected
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Mobile detail mode
  const [mobileDetail, setMobileDetail] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = filterHedefler(hedefler);
    if (search.trim()) {
      const q = search.toLocaleLowerCase("tr");
      list = list.filter((h) =>
        [h.name, h.owner, h.department].join(" ").toLocaleLowerCase("tr").includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((h) => h.status === statusFilter);
    if (sourceFilter !== "all") list = list.filter((h) => h.source === sourceFilter);

    // Sort with direction
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name": cmp = a.name.localeCompare(b.name, "tr"); break;
        case "date": cmp = new Date(a.startDate).getTime() - new Date(b.startDate).getTime(); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "progress":
        default: cmp = a.progress - b.progress;
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [hedefler, search, statusFilter, sourceFilter, sortBy, sortAsc, filterHedefler]);

  // Aksiyonlar from store — fetched once at top level
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const updateAksiyon = useDataStore((s) => s.updateAksiyon);
  const updateHedef = useDataStore((s) => s.updateHedef);
  const deleteHedef = useDataStore((s) => s.deleteHedef);
  const deleteAksiyon = useDataStore((s) => s.deleteAksiyon);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Panel state for forms
  const [aksiyonPanelOpen, setAksiyonPanelOpen] = useState(false);
  const [hedefPanelOpen, setHedefPanelOpen] = useState(false);
  const [editingAksiyon, setEditingAksiyon] = useState<Aksiyon | null>(null);
  const [viewingAksiyon, setViewingAksiyon] = useState<Aksiyon | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [actionsFabOpen, setActionsFabOpen] = useState(false);
  const [reviewPopoverOpen, setReviewPopoverOpen] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [reviewDateDraft, setReviewDateDraft] = useState(todayStr);
  const aksiyonCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of aksiyonlar) map.set(a.hedefId, (map.get(a.hedefId) ?? 0) + 1);
    return map;
  }, [aksiyonlar]);

  // Auto-select first if none selected
  const firstFilteredId = filtered.length > 0 ? filtered[0].id : null;
  useEffect(() => {
    if (!selectedId && firstFilteredId) {
      setSelectedId(firstFilteredId);
    }
  }, [firstFilteredId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedHedef = useMemo(
    () => hedefler.find((h) => h.id === selectedId),
    [hedefler, selectedId]
  );

  const selectedAksiyonlar = useMemo(
    () => selectedId ? aksiyonlar.filter((a) => a.hedefId === selectedId) : [],
    [aksiyonlar, selectedId]
  );

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

  const handleSelectHedef = (id: string) => {
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
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <Input
          isClearable
          size="sm"
          variant="bordered"
          placeholder={t("common.search")}
          startContent={<Search size={14} className="text-default-300" />}
          value={search}
          onClear={() => setSearch("")}
          onValueChange={setSearch}
          classNames={{ inputWrapper: "h-9 min-h-9" }}
        />
      </div>

      {/* Compact filters + sort */}
      <div className="px-3 pb-2 flex items-center gap-1.5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-[10px] px-2 py-1 rounded-md border border-tyro-border bg-tyro-bg text-tyro-text-secondary cursor-pointer focus:outline-none focus:ring-1 focus:ring-tyro-navy/30"
        >
          <option value="all">{t("common.status")}</option>
          <option value="On Track">{t("status.onTrack")}</option>
          <option value="At Risk">{t("status.atRisk")}</option>
          <option value="Behind">{t("status.behind")}</option>
          <option value="Not Started">{t("status.notStarted")}</option>
          <option value="Achieved">{t("status.achieved")}</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="text-[10px] px-2 py-1 rounded-md border border-tyro-border bg-tyro-bg text-tyro-text-secondary cursor-pointer focus:outline-none focus:ring-1 focus:ring-tyro-navy/30"
        >
          <option value="all">{t("common.source")}</option>
          <option value="Türkiye">Türkiye</option>
          <option value="Kurumsal">Kurumsal</option>
          <option value="International">International</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="text-[10px] px-2 py-1 rounded-md border border-tyro-border bg-tyro-bg text-tyro-text-secondary cursor-pointer focus:outline-none focus:ring-1 focus:ring-tyro-navy/30 flex-1 min-w-0"
        >
          <option value="progress">{t("karargah.sortByProgress")}</option>
          <option value="name">{t("karargah.sortByName")}</option>
          <option value="date">{t("karargah.sortByDate")}</option>
          <option value="status">{t("karargah.sortByStatus")}</option>
        </select>
        {/* Sort direction toggle */}
        <button
          type="button"
          onClick={() => setSortAsc((v) => !v)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-tyro-text-muted hover:text-tyro-navy hover:bg-tyro-navy/5 cursor-pointer transition-colors shrink-0"
          title={sortAsc ? "Artan" : "Azalan"}
        >
          <ArrowUpDown size={13} className={sortAsc ? "" : "rotate-180"} />
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[10px] px-1.5 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer font-medium shrink-0"
          >
            {t("karargah.clearFilters")}
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-tyro-border/30 mx-3" />

      {/* Card list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
        {filtered.map((h) => (
          <MasterListCard
            key={h.id}
            hedef={h}
            aksiyonCount={aksiyonCountMap.get(h.id) ?? 0}
            isSelected={h.id === selectedId}
            onClick={() => handleSelectHedef(h.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-[12px] text-tyro-text-muted mb-2">{t("karargah.noObjectivesFound")}</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] text-tyro-navy font-semibold hover:underline cursor-pointer"
              >
                {t("karargah.clearFilters")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Count footer */}
      <div className="px-3 py-2 border-t border-tyro-border/20 text-[11px] text-tyro-text-secondary text-center font-medium">
        <span className="text-tyro-text-primary font-bold">{filtered.length}</span> / {hedefler.length} hedef
      </div>
    </div>
  );

  // ===== RIGHT PANEL =====
  const rightPanel = (
    <div
      className={`flex-1 min-w-0 bg-tyro-surface/30 rounded-xl border border-tyro-border/20 overflow-hidden ${
        !mobileDetail ? "hidden lg:flex lg:flex-col" : "flex flex-col"
      }`}
    >
      {/* Mobile back button */}
      <div className="lg:hidden px-4 pt-3">
        <button
          type="button"
          onClick={() => setMobileDetail(false)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-tyro-text-secondary hover:text-tyro-navy cursor-pointer"
        >
          <ArrowLeft size={14} /> {t("detail.backToObjective", "Geri")}
        </button>
      </div>

      {selectedHedef ? (
        <DetailPanel
          hedef={selectedHedef}
          aksiyonlar={selectedAksiyonlar}
          onUpdateAksiyon={updateAksiyon}
          onAddAksiyon={() => setAksiyonPanelOpen(true)}
          onEditHedef={() => setHedefPanelOpen(true)}
          onClickAksiyon={(a) => { setViewingAksiyon(a); }}
          onEditAksiyon={(a) => { setEditingAksiyon(a); }}
          onUpdateHedef={(data) => selectedHedef && updateHedef(selectedHedef.id, data)}
          parentHedefName={selectedHedef.parentObjectiveId ? hedefler.find((h) => h.id === selectedHedef.parentObjectiveId)?.name : undefined}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-tyro-bg flex items-center justify-center">
            <Target size={28} className="text-tyro-text-muted/40" />
          </div>
          <h3 className="text-[14px] font-semibold text-tyro-text-muted">
            {t("karargah.selectObjective")}
          </h3>
          <p className="text-[12px] text-tyro-text-muted/70 max-w-[280px]">
            {t("karargah.selectObjectiveDesc")}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] relative">
      {/* Left: 360px on desktop, full on mobile */}
      <div className="w-full lg:w-[360px] lg:shrink-0 h-full">
        {leftPanel}
      </div>
      {/* Panel divider */}
      <div className="hidden lg:block w-px bg-tyro-border/30 mx-1 shrink-0" />
      {/* Right: flex-1, hidden on mobile until selected */}
      {rightPanel}

      {/* ===== ACTIONS FAB — İşlemler ===== */}
      {selectedHedef && (
      <div className="fixed bottom-6 right-24 z-40">
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
                        <p className="text-[10px] text-tyro-text-muted leading-tight mt-0.5">Tarihi güncelle</p>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-3 w-[220px]">
                    <p className="text-[11px] font-semibold text-tyro-text-secondary mb-2">Kontrol Tarihi</p>
                    <input
                      type="date"
                      value={reviewDateDraft}
                      onChange={(e) => setReviewDateDraft(e.target.value)}
                      className="w-full text-[12px] px-2.5 py-1.5 rounded-lg border border-tyro-border bg-tyro-bg text-tyro-text-primary focus:outline-none focus:ring-2 focus:ring-teal-300/30 mb-2"
                    />
                    <Button
                      size="sm"
                      className="w-full rounded-lg text-[11px] font-semibold bg-teal-500 text-white"
                      startContent={<Check size={13} />}
                      onPress={() => {
                        updateHedef(selectedHedef.id, { reviewDate: reviewDateDraft });
                        toast.success("Güncellendi", `"${selectedHedef.name}" — Kontrol Tarihi: ${reviewDateDraft}`);
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
                  onClick={() => { setActionsFabOpen(false); setHedefPanelOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-tyro-gold/5 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
                    <Pencil size={15} className="text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[13px] font-semibold text-tyro-text-primary leading-tight">Düzenle</p>
                    <p className="text-[10px] text-tyro-text-muted leading-tight mt-0.5">Hedef bilgilerini düzenle</p>
                  </div>
                </button>
                <div className="h-px bg-tyro-border/15 mx-4" />
                {/* Sil */}
                <button
                  type="button"
                  onClick={() => {
                    setActionsFabOpen(false);
                    setConfirmMessage(`"${selectedHedef.name}" hedefini silmek istediğinize emin misiniz?`);
                    setConfirmAction(() => () => {
                      const ok = deleteHedef(selectedHedef.id);
                      if (ok) {
                        toast.success("Silindi", `"${selectedHedef.name}" silindi.`);
                        setSelectedId(null);
                      } else {
                        toast.error("Silinemedi", "Bu hedefe bağlı aksiyonlar var.");
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
                    <p className="text-[13px] font-semibold text-red-600 leading-tight">Sil</p>
                    <p className="text-[10px] text-tyro-text-muted leading-tight mt-0.5">Hedefi kalıcı olarak sil</p>
                  </div>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={() => { setActionsFabOpen((v) => !v); setFabOpen(false); }}
          className="w-14 h-14 rounded-full bg-tyro-navy text-white flex items-center justify-center shadow-[0_4px_12px_rgba(30,58,95,0.3)] cursor-pointer z-40 relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: actionsFabOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <MoreVertical size={22} />
        </motion.button>
      </div>
      )}

      {/* ===== CREATE FAB — Oluşturma ===== */}
      <div className="fixed bottom-6 right-6 lg:bottom-6 lg:right-6 z-40">
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
                  onClick={() => { setFabOpen(false); onOpenWizard?.(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-tyro-gold/5 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tyro-gold to-tyro-gold-light flex items-center justify-center shadow-sm shrink-0">
                    <Crosshair size={15} className="text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[13px] font-semibold text-tyro-text-primary leading-tight">Hedef Sihirbazı</p>
                    <p className="text-[10px] text-tyro-text-muted leading-tight mt-0.5">Adım adım hedef oluştur</p>
                  </div>
                </button>
                <div className="h-px bg-tyro-border/15 mx-4" />
                <button
                  type="button"
                  onClick={() => { setFabOpen(false); setAksiyonPanelOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-tyro-navy/5 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tyro-navy to-tyro-navy-light flex items-center justify-center shadow-sm shrink-0">
                    <CircleCheckBig size={15} className="text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[13px] font-semibold text-tyro-text-primary leading-tight">Yeni Aksiyon</p>
                    <p className="text-[10px] text-tyro-text-muted leading-tight mt-0.5">Hedefe aksiyon ekle</p>
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
          className="w-14 h-14 rounded-full bg-tyro-gold text-white flex items-center justify-center shadow-[0_4px_12px_rgba(200,146,42,0.35)] cursor-pointer z-40 relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: fabOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus size={24} />
        </motion.button>
      </div>

      {/* Aksiyon Ekle SlidingPanel */}
      <SlidingPanel
        isOpen={aksiyonPanelOpen}
        onClose={() => setAksiyonPanelOpen(false)}
        title="Yeni Aksiyon Oluştur"
        icon={<CircleCheckBig size={16} className="text-emerald-500" />}
      >
        {selectedHedef && (
          <AksiyonForm
            defaultHedefId={selectedHedef.id}
            onSuccess={() => setAksiyonPanelOpen(false)}
          />
        )}
      </SlidingPanel>

      {/* Hedef Düzenle SlidingPanel */}
      <SlidingPanel
        isOpen={hedefPanelOpen}
        onClose={() => setHedefPanelOpen(false)}
        title="Hedef Kartını Düzenle"
        icon={<Pencil size={16} className="text-amber-500" />}
      >
        {selectedHedef && (
          <HedefForm
            hedef={selectedHedef}
            onSuccess={() => setHedefPanelOpen(false)}
          />
        )}
      </SlidingPanel>

      {/* Aksiyon Detay SlidingPanel */}
      <SlidingPanel
        isOpen={!!viewingAksiyon}
        onClose={() => setViewingAksiyon(null)}
        title="Aksiyon Detayı"
        icon={<CircleCheckBig size={16} className="text-tyro-navy" />}
      >
        {viewingAksiyon && (
          <AksiyonDetail
            aksiyon={viewingAksiyon}
            onBackToParent={() => setViewingAksiyon(null)}
            parentLabel={t("detail.backToObjective", "Geri")}
            onDelete={() => {
              setConfirmMessage(`"${viewingAksiyon.name}" aksiyonunu silmek istediğinize emin misiniz?`);
              setConfirmAction(() => () => {
                deleteAksiyon(viewingAksiyon.id);
                toast.success(t("toast.actionDeleted", "Aksiyon silindi"), `"${viewingAksiyon.name}" silindi.`);
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
        title="Aksiyonu Düzenle"
        icon={<Pencil size={16} className="text-amber-500" />}
      >
        {editingAksiyon && (
          <AksiyonForm
            aksiyon={editingAksiyon}
            defaultHedefId={editingAksiyon.hedefId}
            onSuccess={() => setEditingAksiyon(null)}
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
