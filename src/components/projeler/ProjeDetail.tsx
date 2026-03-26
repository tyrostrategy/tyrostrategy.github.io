import { useState } from "react";
import { Button } from "@heroui/react";
import { Pencil, Plus, ArrowLeft, ChevronRight } from "lucide-react";
import TagChip from "@/components/ui/TagChip";
import { useTranslation } from "react-i18next";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import StatusBadge from "@/components/ui/StatusBadge";
import ProjeForm from "@/components/projeler/ProjeForm";
import AksiyonForm from "@/components/aksiyonlar/AksiyonForm";
import AksiyonDetail from "@/components/aksiyonlar/AksiyonDetail";
import { progressColor } from "@/lib/colorUtils";
import { formatDate } from "@/lib/dateUtils";
import type { Proje, Aksiyon } from "@/types";

type DetailMode = "detail" | "editing" | "addAksiyon" | "aksiyonDetail";

interface ProjeDetailProps {
  proje: Proje;
  onEdit: () => void;
  onModeChange?: (mode: string) => void;
  onSelectHedef?: (proje: Proje) => void;
}

export default function ProjeDetail({
  proje,
  onEdit: _onEdit,
  onModeChange,
  onSelectHedef,
}: ProjeDetailProps) {
  const { t } = useTranslation();
  const [mode, _setMode] = useState<DetailMode>("detail");
  const [selectedAksiyon, setSelectedAksiyon] = useState<Aksiyon | null>(null);
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
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setMode("detail")}
          className="flex items-center gap-1.5 text-[13px] font-medium text-tyro-text-secondary hover:text-tyro-navy transition-colors cursor-pointer self-start"
        >
          <ArrowLeft size={14} />
          {t("detail.backToObjective")}
        </button>
        <ProjeForm
          proje={currentHedef}
          onSuccess={() => setMode("detail")}
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

  return (
    <div className="flex flex-col gap-1 overflow-hidden">
      {/* Header: Title + Edit Button */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1 overflow-hidden">
          <h3 className="text-[15px] font-bold text-tyro-text-primary leading-snug truncate">
            {currentHedef.name}
          </h3>
          <div className="mt-1.5">
            <StatusBadge status={currentHedef.status} />
          </div>
        </div>
        <Button
          size="sm"
          variant="bordered"
          onPress={() => setMode("editing")}
          startContent={<Pencil size={13} />}
          className="rounded-button border-tyro-border text-tyro-text-primary relative overflow-hidden group shrink-0"
        >
          <span className="relative z-10">{t("common.edit")}</span>
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
            <span className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-tyro-navy/5 to-transparent group-hover:left-[150%] transition-all duration-700 ease-out" />
          </span>
        </Button>
      </div>

      {/* Tags */}
      {currentHedef.tags && currentHedef.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {currentHedef.tags.map((tag) => (
            <TagChip key={tag} name={tag} size="md" showIcon />
          ))}
        </div>
      )}

      {/* Description */}
      {currentHedef.description && (
        <p className="text-[13px] text-tyro-text-secondary leading-relaxed mt-1">
          {currentHedef.description}
        </p>
      )}

      {/* Gradient Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-tyro-border to-transparent my-3" />

      {/* Progress Bar */}
      <div className="rounded-xl bg-tyro-surface/60 border border-tyro-border/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm overflow-hidden p-3 mb-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted">
            {t("common.progress")}
          </span>
          <span className="text-[13px] font-bold tabular-nums" style={{ color: progressColor(currentHedef.progress) }}>
            %{currentHedef.progress}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-tyro-bg overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${currentHedef.progress}%`,
              background: `linear-gradient(90deg, ${progressColor(currentHedef.progress)}cc, ${progressColor(currentHedef.progress)})`,
            }}
          />
        </div>
      </div>

      {/* Info Grid */}
      <div className="rounded-xl bg-tyro-surface/60 border border-tyro-border/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm overflow-hidden divide-y divide-tyro-border/20">
        <div className="grid grid-cols-2 divide-x divide-tyro-border/20">
          <div className="px-3 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-1">
              {t("common.owner")}
            </span>
            <p className="text-[12px] font-medium text-tyro-text-primary truncate">
              {currentHedef.owner ?? "-"}
            </p>
          </div>
          <div className="px-3 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-1">
              {t("common.source")}
            </span>
            <p className="text-[12px] font-medium text-tyro-text-primary">
              {currentHedef.source}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-tyro-border/20">
          <div className="px-3 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-1">
              {t("common.startDate")}
            </span>
            <p className="text-[12px] font-medium text-tyro-text-primary">
              {formatDate(currentHedef.startDate)}
            </p>
          </div>
          <div className="px-3 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-1">
              {t("common.endDate")}
            </span>
            <p className="text-[12px] font-medium text-tyro-text-primary">
              {formatDate(currentHedef.endDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Meta */}
      {(currentHedef.createdBy || currentHedef.createdAt || currentHedef.completedAt) && (
        <div className="mt-3 pt-3 border-t border-tyro-border/30 flex flex-wrap gap-x-6 gap-y-1">
          {currentHedef.createdBy && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-tyro-text-muted font-semibold mb-0.5">{t("common.createdBy").toUpperCase()}</p>
              <p className="text-[13px] text-tyro-text-primary">{currentHedef.createdBy}</p>
            </div>
          )}
          {currentHedef.createdAt && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-tyro-text-muted font-semibold mb-0.5">{t("common.createdAt").toUpperCase()}</p>
              <p className="text-[13px] text-tyro-text-primary">{formatDate(currentHedef.createdAt)}</p>
            </div>
          )}
          {currentHedef.completedAt && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-tyro-text-muted font-semibold mb-0.5">{t("common.completedAt").toUpperCase()}</p>
              <p className="text-[13px] text-tyro-text-primary text-emerald-600 font-medium">{formatDate(currentHedef.completedAt)}</p>
            </div>
          )}
        </div>
      )}

      {/* Ana Proje (Parent Objective) */}
      {parentHedef && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-tyro-border to-transparent my-3" />
          <div>
            <h4 className="text-[13px] font-bold text-tyro-text-primary mb-2">
              {t("detail.parentObjective")}
            </h4>
            <div
              onClick={() => onSelectHedef?.(parentHedef)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border border-tyro-border/20 bg-tyro-surface/60 ${onSelectHedef ? "cursor-pointer hover:bg-tyro-bg/60" : ""} transition-colors`}
            >
              <p className="text-[13px] font-medium text-tyro-text-primary truncate">
                {parentHedef.name}
              </p>
              {onSelectHedef && <ChevronRight size={14} className="text-tyro-text-muted shrink-0" />}
            </div>
          </div>
        </>
      )}

      {/* Related Objectives (Siblings) */}
      {relatedHedefler.length > 0 && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-tyro-border to-transparent my-3" />
          <div>
            <h4 className="text-[13px] font-bold text-tyro-text-primary mb-2">
              {t("detail.relatedObjectives")} ({relatedHedefler.length})
            </h4>
            <div className="flex flex-col gap-1">
              {relatedHedefler.map((rh) => (
                <div
                  key={rh.id}
                  onClick={() => onSelectHedef?.(rh)}
                  className={`px-3 py-2 rounded-lg border border-tyro-border/20 bg-tyro-surface/60 ${onSelectHedef ? "cursor-pointer hover:bg-tyro-bg/60" : ""} transition-colors`}
                >
                  <p className="text-[13px] font-medium text-tyro-text-primary leading-snug mb-1.5 truncate">
                    {rh.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-tyro-bg text-tyro-text-secondary">
                      {rh.source}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-tyro-bg overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${rh.progress}%`,
                          background: progressColor(rh.progress),
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-tyro-text-secondary tabular-nums shrink-0">
                      %{rh.progress}
                    </span>
                    <StatusBadge status={rh.status} />
                  </div>
                </div>
              ))}
            </div>
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
                        background: progressColor(aksiyon.progress),
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
