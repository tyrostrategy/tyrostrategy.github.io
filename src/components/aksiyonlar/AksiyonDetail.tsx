import { useState } from "react";
import { Pencil, Trash2, ArrowLeft, X, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import StatusBadge from "@/components/ui/StatusBadge";
import AksiyonForm from "@/components/aksiyonlar/AksiyonForm";
import { formatDate } from "@/lib/dateUtils";
import type { Aksiyon } from "@/types";

const STATUS_HEX: Record<string, string> = {
  "On Track": "#10b981", "At Risk": "#f59e0b", "Behind": "#ef4444",
  "Achieved": "#3b82f6", "Not Started": "#94a3b8", "Cancelled": "#6b7280", "On Hold": "#8b5cf6",
};

interface AksiyonDetailProps {
  aksiyon: Aksiyon;
  onBackToParent?: () => void;
  parentLabel?: string;
  onModeChange?: (mode: string) => void;
  onDelete?: () => void;
  onClose?: () => void;
}

export default function AksiyonDetail({
  aksiyon,
  onBackToParent,
  parentLabel,
  onModeChange,
  onDelete,
  onClose,
}: AksiyonDetailProps) {
  const { t } = useTranslation();
  const [mode, _setMode] = useState<"detail" | "editing">("detail");
  const [projeCardOpen, setProjeCardOpen] = useState(false);
  const setMode = (m: "detail" | "editing") => { _setMode(m); onModeChange?.(m); };
  const sidebarTheme = useSidebarTheme();
  const getAksiyonById = useDataStore((s) => s.getAksiyonById);
  const getProjeById = useDataStore((s) => s.getProjeById);

  const currentAksiyon = getAksiyonById(aksiyon.id) ?? aksiyon;
  const proje = getProjeById(currentAksiyon.projeId);
  const stColor = STATUS_HEX[currentAksiyon.status] ?? "#94a3b8";

  if (mode === "editing") {
    return (
      <div className="flex flex-col h-full max-h-full overflow-hidden">
        <AksiyonForm aksiyon={currentAksiyon} defaultProjeId={currentAksiyon.projeId} onSuccess={() => setMode("detail")} onClose={() => setMode("detail")} />
      </div>
    );
  }

  // Theme colors (same pattern as ProjeDetail)
  const isDark = sidebarTheme.isDark !== false;
  const txtColor = isDark ? "#ffffff" : "#1e293b";
  const txtMuted = isDark ? "rgba(255,255,255,0.7)" : "rgba(30,41,59,0.6)";
  const btnBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
  const btnBgHover = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)";
  const btnBorder = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)";
  const btnBorderHover = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)";
  const sepColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";

  return (
    <div className="flex flex-col gap-3 overflow-hidden">
      {/* Back to parent */}
      {onBackToParent && (
        <button type="button" onClick={onBackToParent}
          className="flex items-center gap-1.5 text-[13px] font-medium text-tyro-text-secondary hover:text-tyro-navy transition-colors cursor-pointer self-start -mb-1">
          <ArrowLeft size={14} />
          {parentLabel ?? t("common.goBack")}
        </button>
      )}

      {/* ── Themed Header Card (same style as ProjeDetail) ── */}
      <div className="relative rounded-xl overflow-hidden px-4 py-3" style={{ background: sidebarTheme.bg }}>
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${sidebarTheme.accentColor ?? "rgba(255,255,255,0.4)"} 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }} />
        {/* Glow */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ backgroundColor: sidebarTheme.accentColor ?? "#c8922a" }} />

        <div className="relative z-10">
          {/* Row 0: ID + Buttons */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold tabular-nums" style={{ color: txtMuted }}>{currentAksiyon.id}</span>
              <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: txtMuted, opacity: 0.7 }}>Aksiyon Detayı</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setMode("editing")}
                className="h-8 px-3.5 rounded-xl flex items-center gap-2 text-[12px] font-semibold transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.03] active:scale-[0.97]"
                style={{ backgroundColor: btnBg, color: txtColor, border: `1px solid ${btnBorder}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnBgHover; e.currentTarget.style.borderColor = btnBorderHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnBg; e.currentTarget.style.borderColor = btnBorder; }}>
                <Pencil size={13} /> {t("common.edit")}
              </button>
              {onDelete && (
                <button type="button" onClick={onDelete}
                  className="h-8 px-3.5 rounded-xl flex items-center gap-2 text-[12px] font-semibold transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.03] active:scale-[0.97]"
                  style={{ backgroundColor: btnBg, color: "#ef4444", border: `1px solid ${btnBorder}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnBgHover; e.currentTarget.style.borderColor = btnBorderHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnBg; e.currentTarget.style.borderColor = btnBorder; }}>
                  <Trash2 size={13} /> {t("common.delete")}
                </button>
              )}
              {onClose && (
                <button type="button" onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.05] active:scale-[0.95]"
                  style={{ backgroundColor: btnBg, color: txtColor, border: `1px solid ${btnBorder}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnBgHover; e.currentTarget.style.borderColor = btnBorderHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnBg; e.currentTarget.style.borderColor = btnBorder; }}>
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="h-px rounded-full mb-2" style={{ background: `linear-gradient(to right, transparent, ${sepColor} 30%, ${sepColor} 70%, transparent)` }} />

          {/* Title */}
          <h3 className="text-[15px] font-bold leading-snug" style={{ color: sidebarTheme.textPrimary ?? "#ffffff" }}>
            {currentAksiyon.name}
          </h3>

          {/* Description */}
          {currentAksiyon.description && (
            <p className="text-[11px] leading-relaxed mt-1 line-clamp-2" style={{ color: sidebarTheme.textSecondary ?? "rgba(255,255,255,0.6)" }}>
              {currentAksiyon.description}
            </p>
          )}

          {/* Status + Progress */}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <StatusBadge status={currentAksiyon.status} />
            <span className="ml-auto text-[13px] font-extrabold tabular-nums" style={{ color: txtColor }}>
              %{currentAksiyon.progress}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${currentAksiyon.progress}%`, backgroundColor: stColor }} />
          </div>
        </div>
      </div>

      {/* ── Parent Project Card ── */}
      {proje && (
        <div className="relative rounded-xl overflow-hidden" style={{ background: sidebarTheme.brandStrategy ?? sidebarTheme.accentColor ?? "#c8922a" }}>
          <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)`,
            backgroundSize: "16px 16px",
          }} />
          <button type="button" onClick={() => setProjeCardOpen(!projeCardOpen)}
            className="relative z-10 w-full flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/5 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Bağlı Proje: <span className="text-white tabular-nums">{proje.id}</span></span>
            <ChevronDown size={14} className={`text-white/80 transition-transform duration-200 ${projeCardOpen ? "rotate-180" : ""}`} />
          </button>
          {projeCardOpen && (
            <div className="relative z-10 px-4 pb-3">
              <p className="text-[13px] font-semibold text-white leading-snug">{proje.name}</p>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <StatusBadge status={proje.status} />
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-white/15 text-white/80">{proje.source}</span>
                <span className="text-[11px] text-white/70">{proje.owner}</span>
                <span className="ml-auto text-[12px] font-bold tabular-nums text-white/80">%{proje.progress}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Info Grid ── */}
      <div className="rounded-xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-tyro-border/30 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden divide-y divide-tyro-border/20">
        <div className="grid grid-cols-2 divide-x divide-tyro-border/15">
          <InfoCell label={t("common.startDate")} value={formatDate(currentAksiyon.startDate)} />
          <InfoCell label={t("common.endDate")} value={formatDate(currentAksiyon.endDate)} />
        </div>
        <div className="grid grid-cols-2 divide-x divide-tyro-border/15">
          <InfoCell label={t("common.createdAt")} value={currentAksiyon.createdAt ? formatDate(currentAksiyon.createdAt) : "—"} />
          <InfoCell label={t("common.createdBy")} value={currentAksiyon.createdBy ?? "—"} />
        </div>
        {currentAksiyon.completedAt && (
          <InfoCell label={t("common.completedAt")} value={formatDate(currentAksiyon.completedAt)} color="#059669" />
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div className="px-3.5 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-tyro-text-muted/70 block mb-1">{label}</span>
      <p className={`text-[12px] font-semibold ${mono ? "font-mono text-tyro-text-secondary tabular-nums" : "text-tyro-text-primary"}`}
        style={color ? { color } : undefined}>
        {value || "—"}
      </p>
    </div>
  );
}
