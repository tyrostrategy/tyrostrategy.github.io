import { useState } from "react";
import { Button } from "@heroui/react";
import { Pencil, Plus, ArrowLeft, ChevronRight, ChevronDown, X, GitBranch } from "lucide-react";
import TagChip from "@/components/ui/TagChip";
import { useTranslation } from "react-i18next";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import StatusBadge from "@/components/ui/StatusBadge";
import ProjeForm from "@/components/projeler/ProjeForm";
import AksiyonForm from "@/components/aksiyonlar/AksiyonForm";
import AksiyonDetail from "@/components/aksiyonlar/AksiyonDetail";
import { progressColor, statusColor } from "@/lib/colorUtils";
import { formatDate } from "@/lib/dateUtils";
import type { Proje, Aksiyon } from "@/types";

type DetailMode = "detail" | "editing" | "addAksiyon" | "aksiyonDetail";

interface ProjeDetailProps {
  proje: Proje;
  onEdit: () => void;
  onModeChange?: (mode: string) => void;
  onSelectHedef?: (proje: Proje) => void;
  onClose?: () => void;
  initialMode?: DetailMode;
}

export default function ProjeDetail({
  proje,
  onEdit: _onEdit,
  onModeChange,
  onSelectHedef,
  onClose,
  initialMode = "detail",
}: ProjeDetailProps) {
  const { t } = useTranslation();
  const [mode, _setMode] = useState<DetailMode>(initialMode);
  const [selectedAksiyon, setSelectedAksiyon] = useState<Aksiyon | null>(null);
  const [relationsOpen, setRelationsOpen] = useState(false);
  const setMode = (m: DetailMode) => {
    _setMode(m);
    onModeChange?.(m);
  };
  const sidebarTheme = useSidebarTheme();
  const projeler = useDataStore((s) => s.projeler);
  const getAksiyonlarByHedefId = useDataStore((s) => s.getAksiyonlarByHedefId);
  const getProjeById = useDataStore((s) => s.getProjeById);
  const getAksiyonById = useDataStore((s) => s.getAksiyonById);
  const aksiyonlar = getAksiyonlarByHedefId(proje.id);

  const currentHedef = getProjeById(proje.id) ?? proje;

  const parentHedef = currentHedef.parentObjectiveId
    ? getProjeById(currentHedef.parentObjectiveId)
    : undefined;

  const relatedHedefler = currentHedef.parentObjectiveId
    ? projeler.filter(
        (h) =>
          h.parentObjectiveId === currentHedef.parentObjectiveId &&
          h.id !== currentHedef.id
      )
    : [];

  const btnStyle = {
    backgroundColor: sidebarTheme.accentColor ?? sidebarTheme.bg,
    color: sidebarTheme.isDark ? "#ffffff" : "#ffffff",
  };

  if (mode === "editing") {
    return (
      <div className="flex flex-col h-full max-h-full overflow-hidden">
        <ProjeForm
          proje={currentHedef}
          onSuccess={() => setMode("detail")}
          onClose={() => setMode("detail")}
        />
      </div>
    );
  }

  if (mode === "addAksiyon") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setMode("detail")}
          className="flex items-center gap-1.5 text-[13px] font-medium text-tyro-text-secondary hover:text-tyro-navy transition-colors cursor-pointer self-start"
        >
          <ArrowLeft size={14} />
          {t("detail.backToObjective")}
        </button>
        <AksiyonForm
          defaultProjeId={currentHedef.id}
          onSuccess={() => setMode("detail")}
        />
      </div>
    );
  }

  if (mode === "aksiyonDetail" && selectedAksiyon) {
    const freshAksiyon = getAksiyonById(selectedAksiyon.id) ?? selectedAksiyon;
    return (
      <div className="flex flex-col gap-4">
        <AksiyonDetail
          aksiyon={freshAksiyon}
          onBackToParent={() => { setSelectedAksiyon(null); setMode("detail"); }}
          parentLabel={t("detail.backToObjective")}
          onModeChange={(_m) => {
            onModeChange?.("aksiyonDetail");
          }}
        />
      </div>
    );
  }

  const stColor = statusColor(currentHedef.status);

  return (
    <div className="flex flex-col gap-3 overflow-hidden">
      {/* ===== Themed Header Banner ===== */}
      <div
        className="relative rounded-xl overflow-hidden px-4 py-3"
        style={{ background: sidebarTheme.bg }}
      >
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${sidebarTheme.accentColor ?? "rgba(255,255,255,0.4)"} 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }}
        />
        {/* Decorative glow */}
        <div
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20"
          style={{ backgroundColor: sidebarTheme.accentColor ?? "#c8922a" }}
        />

        <div className="relative z-10">
          {(() => {
            const isDark = sidebarTheme.isDark !== false;
            const txtColor = isDark ? "#ffffff" : "#1e293b";
            const txtMuted = isDark ? "rgba(255,255,255,0.7)" : "rgba(30,41,59,0.6)";
            const btnBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
            const btnBgHover = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)";
            const btnBorder = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)";
            const btnBorderHover = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)";
            const sepColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";
            return (
              <>
                {/* Row 0: ID + Buttons */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: txtMuted }}>
                    {currentHedef.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("editing")}
                      className="h-8 px-3.5 rounded-xl flex items-center gap-2 text-[12px] font-semibold transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.03] active:scale-[0.97]"
                      style={{ backgroundColor: btnBg, color: txtColor, border: `1px solid ${btnBorder}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnBgHover; e.currentTarget.style.borderColor = btnBorderHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnBg; e.currentTarget.style.borderColor = btnBorder; }}
                    >
                      <Pencil size={13} />
                      Düzenle
                    </button>
                    {onClose && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.05] active:scale-[0.95]"
                        style={{ backgroundColor: btnBg, color: txtColor, border: `1px solid ${btnBorder}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnBgHover; e.currentTarget.style.borderColor = btnBorderHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnBg; e.currentTarget.style.borderColor = btnBorder; }}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>
                {/* Smooth separator */}
                <div className="h-px rounded-full mb-2" style={{ background: `linear-gradient(to right, transparent, ${sepColor} 30%, ${sepColor} 70%, transparent)` }} />
              </>
            );
          })()}
          {/* Row 1: Title */}
          <h3
            className="text-[15px] font-bold leading-snug"
            style={{ color: sidebarTheme.textPrimary ?? "#ffffff" }}
          >
            {currentHedef.name}
          </h3>

          {/* Row 2: Açıklama (varsa) */}
          {currentHedef.description && (
            <p
              className="text-[11px] leading-relaxed mt-1 line-clamp-2"
              style={{ color: sidebarTheme.textSecondary ?? "rgba(255,255,255,0.6)" }}
            >
              {currentHedef.description}
            </p>
          )}

          {/* Row 3: Statü + Tag + İlerleme */}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <StatusBadge status={currentHedef.status} />
            {currentHedef.tags && currentHedef.tags.length > 0 && (
              <>
                <span className="w-px h-3.5 rounded-full" style={{ backgroundColor: sidebarTheme.isDark !== false ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }} />
                {currentHedef.tags.map((tag) => (
                  <TagChip key={tag} name={tag} size="md" showIcon />
                ))}
              </>
            )}
            <span className="ml-auto text-[13px] font-extrabold tabular-nums" style={{ color: sidebarTheme.isDark !== false ? "#ffffff" : "#1e293b" }}>
              %{currentHedef.progress}
            </span>
          </div>

          {/* Row 4: İlerleme bar */}
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: sidebarTheme.isDark !== false ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${currentHedef.progress}%`,
                backgroundColor: stColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* 5. Bilgi Grid — tüm alanlar */}
      <div className="rounded-xl bg-tyro-surface/60 border border-tyro-border/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm overflow-hidden divide-y divide-tyro-border/20">
        {/* Sahip + Katılımcılar */}
        <div className="grid grid-cols-2 divide-x divide-tyro-border/20">
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-0.5">{t("common.owner")}</span>
            <p className="text-[12px] font-medium text-tyro-text-primary truncate">{currentHedef.owner ?? "-"}</p>
          </div>
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-0.5">Katılımcılar</span>
            <p className="text-[12px] font-medium text-tyro-text-primary truncate">{currentHedef.participants?.join(", ") || "-"}</p>
          </div>
        </div>
        {/* Kaynak + Departman */}
        <div className="grid grid-cols-2 divide-x divide-tyro-border/20">
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-0.5">{t("common.source")}</span>
            <p className="text-[12px] font-medium text-tyro-text-primary">{currentHedef.source}</p>
          </div>
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-0.5">Departman</span>
            <p className="text-[12px] font-medium text-tyro-text-primary">{currentHedef.department || "-"}</p>
          </div>
        </div>
        {/* Başlangıç + Bitiş */}
        <div className="grid grid-cols-2 divide-x divide-tyro-border/20">
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-0.5">{t("common.startDate")}</span>
            <p className="text-[12px] font-medium text-tyro-text-primary">{formatDate(currentHedef.startDate)}</p>
          </div>
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-0.5">{t("common.endDate")}</span>
            <p className="text-[12px] font-medium text-tyro-text-primary">{formatDate(currentHedef.endDate)}</p>
          </div>
        </div>
        {/* Kontrol Tarihi */}
        <div className="grid grid-cols-2 divide-x divide-tyro-border/20">
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-0.5">Kontrol Tarihi</span>
            <p className="text-[12px] font-medium text-tyro-text-primary">{currentHedef.reviewDate ? formatDate(currentHedef.reviewDate) : "-"}</p>
          </div>
          <div className="px-3 py-2" />
        </div>
        {/* Oluşturan + Oluşturulma */}
        <div className="grid grid-cols-2 divide-x divide-tyro-border/20">
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-0.5">{t("common.createdBy")}</span>
            <p className="text-[12px] font-medium text-tyro-text-primary truncate">{currentHedef.createdBy || "-"}</p>
          </div>
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-0.5">{t("common.createdAt")}</span>
            <p className="text-[12px] font-medium text-tyro-text-primary">{currentHedef.createdAt ? formatDate(currentHedef.createdAt) : "-"}</p>
          </div>
        </div>
        {/* Tamamlanma (varsa) */}
        {currentHedef.completedAt && (
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-0.5">{t("common.completedAt")}</span>
            <p className="text-[12px] font-medium text-emerald-600">{formatDate(currentHedef.completedAt)}</p>
          </div>
        )}
      </div>

      {/* Proje İlişkileri — Collapsible */}
      {(parentHedef || relatedHedefler.length > 0) && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-tyro-border to-transparent my-3" />
          <div className="rounded-xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-tyro-border/30 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
            <button
              type="button"
              onClick={() => setRelationsOpen(!relationsOpen)}
              className="w-full flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-tyro-bg/30 transition-colors"
            >
              <GitBranch size={15} className="text-tyro-text-muted shrink-0" />
              <span className="text-[13px] font-bold text-tyro-text-primary flex-1 text-left">
                Proje İlişkileri
                {(parentHedef ? 1 : 0) + relatedHedefler.length > 0 && (
                  <span className="ml-1.5 text-[11px] font-medium text-tyro-text-muted">
                    ({(parentHedef ? 1 : 0) + relatedHedefler.length})
                  </span>
                )}
              </span>
              <ChevronDown size={14} className={`text-tyro-text-muted transition-transform duration-200 ${relationsOpen ? "rotate-180" : ""}`} />
            </button>

            {relationsOpen && (
              <div className="px-4 pb-3 space-y-3">
                {/* Ana Proje */}
                {parentHedef && (
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-tyro-text-muted/70 block mb-1.5">
                      {t("detail.parentObjective")}
                    </span>
                    <div
                      onClick={() => onSelectHedef?.(parentHedef)}
                      className={`px-3 py-2.5 rounded-lg border border-tyro-border/15 bg-tyro-bg/40 ${onSelectHedef ? "cursor-pointer hover:bg-tyro-bg/70" : ""} transition-colors`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[13px] font-medium text-tyro-text-primary leading-snug truncate flex-1">
                          {parentHedef.name}
                        </p>
                        {onSelectHedef && <ChevronRight size={14} className="text-tyro-text-muted shrink-0 ml-2" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={parentHedef.status} />
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-tyro-bg text-tyro-text-secondary">
                          {parentHedef.source}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-tyro-border/30 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${parentHedef.progress}%`, backgroundColor: statusColor(parentHedef.status) }} />
                        </div>
                        <span className="text-[11px] font-medium text-tyro-text-secondary tabular-nums shrink-0">%{parentHedef.progress}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* İlişkili Projeler */}
                {relatedHedefler.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-tyro-text-muted/70 block mb-1.5">
                      {t("detail.relatedObjectives")} ({relatedHedefler.length})
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {relatedHedefler.map((rh) => (
                        <div
                          key={rh.id}
                          onClick={() => onSelectHedef?.(rh)}
                          className={`px-3 py-2 rounded-lg border border-tyro-border/15 bg-tyro-bg/40 ${onSelectHedef ? "cursor-pointer hover:bg-tyro-bg/70" : ""} transition-colors`}
                        >
                          <p className="text-[13px] font-medium text-tyro-text-primary leading-snug mb-1.5 truncate">{rh.name}</p>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={rh.status} />
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-tyro-bg text-tyro-text-secondary">{rh.source}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-tyro-border/30 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${rh.progress}%`, background: statusColor(rh.status) }} />
                            </div>
                            <span className="text-[11px] font-medium text-tyro-text-secondary tabular-nums shrink-0">%{rh.progress}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Gradient Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-tyro-border to-transparent my-3" />

      {/* Aksiyonlar Section */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2 min-w-0">
          <h4 className="text-[13px] font-bold text-tyro-text-primary truncate min-w-0">
            {t("nav.actions")} ({aksiyonlar.length})
          </h4>
          <Button
            size="sm"
            startContent={<Plus size={14} />}
            onPress={() => setMode("addAksiyon")}
            className="rounded-button font-semibold text-[12px] h-7 min-w-0 px-3 border-0"
            style={btnStyle}
          >
            {t("detail.addAction")}
          </Button>
        </div>

        {aksiyonlar.length === 0 ? (
          <p className="text-[13px] text-tyro-text-muted">
            {t("detail.noActionsYet")}
          </p>
        ) : (
          <div className="flex flex-col">
            {aksiyonlar.map((aksiyon) => (
              <div
                key={aksiyon.id}
                onClick={() => { setSelectedAksiyon(aksiyon); setMode("aksiyonDetail"); }}
                className="px-3 py-2.5 cursor-pointer hover:bg-tyro-bg/60 transition-colors rounded-lg"
              >
                <p className="text-[13px] font-medium text-tyro-text-primary leading-snug mb-1.5">
                  {aksiyon.name}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-tyro-bg overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${aksiyon.progress}%`,
                        background: statusColor(aksiyon.status),
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-tyro-text-secondary tabular-nums shrink-0">
                    %{aksiyon.progress}
                  </span>
                  <StatusBadge status={aksiyon.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
