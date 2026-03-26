import { useState } from "react";
import { Button } from "@heroui/react";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import StatusBadge from "@/components/ui/StatusBadge";
import AksiyonForm from "@/components/aksiyonlar/AksiyonForm";
import { progressColor } from "@/lib/colorUtils";
import { formatDate } from "@/lib/dateUtils";
import type { Aksiyon } from "@/types";

interface AksiyonDetailProps {
  aksiyon: Aksiyon;
  onBackToParent?: () => void;
  parentLabel?: string;
  onModeChange?: (mode: string) => void;
  onDelete?: () => void;
}

export default function AksiyonDetail({
  aksiyon,
  onBackToParent,
  parentLabel,
  onModeChange,
  onDelete,
}: AksiyonDetailProps) {
  const { t } = useTranslation();
  const [mode, _setMode] = useState<"detail" | "editing">("detail");
  const setMode = (m: "detail" | "editing") => {
    _setMode(m);
    onModeChange?.(m);
  };
  void useSidebarTheme();
  const getAksiyonById = useDataStore((s) => s.getAksiyonById);
  const getProjeById = useDataStore((s) => s.getProjeById);

  const currentAksiyon = getAksiyonById(aksiyon.id) ?? aksiyon;
  const proje = getProjeById(currentAksiyon.projeId);

  if (mode === "editing") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setMode("detail")}
          className="flex items-center gap-1.5 text-[13px] font-medium text-tyro-text-secondary hover:text-tyro-navy transition-colors cursor-pointer self-start"
        >
          <ArrowLeft size={14} />
          {t("detail.actionDetail")}
        </button>
        <AksiyonForm
          aksiyon={currentAksiyon}
          defaultProjeId={currentAksiyon.projeId}
          onSuccess={() => setMode("detail")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Back to parent */}
      {onBackToParent && (
        <button
          type="button"
          onClick={onBackToParent}
          className="flex items-center gap-1.5 text-[13px] font-medium text-tyro-text-secondary hover:text-tyro-navy transition-colors cursor-pointer self-start mb-2"
        >
          <ArrowLeft size={14} />
          {parentLabel ?? t("common.goBack")}
        </button>
      )}

      {/* Header: Title + Edit Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-tyro-text-primary leading-snug">
            {currentAksiyon.name}
          </h3>
          <div className="mt-1.5">
            <StatusBadge status={currentAksiyon.status} />
          </div>
          {proje && (
            <p className="mt-1 text-[12px] text-tyro-text-muted">
              {t("nav.objectives")}: {proje.name}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="bordered"
            onPress={() => setMode("editing")}
            startContent={<Pencil size={13} />}
            className="rounded-button border-tyro-border text-tyro-text-primary relative overflow-hidden group"
          >
            <span className="relative z-10">{t("common.edit")}</span>
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="bordered"
              onPress={onDelete}
              startContent={<Trash2 size={13} />}
              className="rounded-button border-red-200 text-red-500 hover:bg-red-50"
            >
              {t("common.delete")}
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      {currentAksiyon.description && (
        <p className="text-[13px] text-tyro-text-secondary leading-relaxed mt-1">
          {currentAksiyon.description}
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
          <span className="text-[13px] font-bold tabular-nums" style={{ color: progressColor(currentAksiyon.progress) }}>
            %{currentAksiyon.progress}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-tyro-bg overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${currentAksiyon.progress}%`,
              background: `linear-gradient(90deg, ${progressColor(currentAksiyon.progress)}cc, ${progressColor(currentAksiyon.progress)})`,
            }}
          />
        </div>
      </div>

      {/* Info Grid */}
      <div className="rounded-xl bg-tyro-surface/60 border border-tyro-border/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm overflow-hidden divide-y divide-tyro-border/20">
        <div className="px-3 py-2.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-1">
            {t("common.owner")}
          </span>
          <p className="text-[12px] font-medium text-tyro-text-primary">
            {currentAksiyon.owner ?? "-"}
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-tyro-border/20">
          <div className="px-3 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-1">
              {t("common.startDate")}
            </span>
            <p className="text-[12px] font-medium text-tyro-text-primary">
              {formatDate(currentAksiyon.startDate)}
            </p>
          </div>
          <div className="px-3 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-1">
              {t("common.endDate")}
            </span>
            <p className="text-[12px] font-medium text-tyro-text-primary">
              {formatDate(currentAksiyon.endDate)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-tyro-border/20">
          <div className="px-3 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-1">
              ID
            </span>
            <p className="text-[12px] font-mono font-medium text-tyro-text-secondary tabular-nums">
              {currentAksiyon.id}
            </p>
          </div>
          {currentAksiyon.createdBy && (
            <div className="px-3 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-1">
                {t("common.createdBy")}
              </span>
              <p className="text-[12px] font-medium text-tyro-text-primary">
                {currentAksiyon.createdBy}
              </p>
            </div>
          )}
          <div className="px-3 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-1">
              {t("common.createdAt")}
            </span>
            <p className="text-[12px] font-medium text-tyro-text-primary">
              {currentAksiyon.createdAt ? formatDate(currentAksiyon.createdAt) : "-"}
            </p>
          </div>
        </div>

        {currentAksiyon.completedAt && (
          <div className="px-3 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-1">
              {t("common.completedAt")}
            </span>
            <p className="text-[12px] font-medium text-tyro-success">
              {formatDate(currentAksiyon.completedAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
