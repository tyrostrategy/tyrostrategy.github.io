import { useWatch, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Target, User, Calendar, Users, MapPin, FolderTree } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import type { WizardFormData } from "../ProjeAksiyonWizard";

interface AksiyonEntry {
  name: string;
  description?: string;
  owner?: string;
  startDate: string;
  endDate: string;
}

interface Props {
  control: Control<WizardFormData>;
}

function formatDate(d: string): string {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

export default function StepReview({ control }: Props) {
  const { t } = useTranslation();
  const sidebarTheme = useSidebarTheme();
  const data = useWatch({ control });
  const projeler = useDataStore((s) => s.projeler);
  const parentName = data.parentObjectiveId
    ? projeler.find((h) => h.id === data.parentObjectiveId)?.name
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Proje Summary */}
      <div className="rounded-2xl border border-tyro-border overflow-hidden">
        <div className="px-4 py-2.5 rounded-t-2xl" style={{ backgroundColor: sidebarTheme.accentColor ?? "#c8922a" }}>
          <span className="text-[11px] font-bold text-white/80 uppercase tracking-wide">
            {t("wizard.reviewProje", "Proje Özeti")}
          </span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Target size={14} className="text-tyro-gold mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-tyro-text-primary">{data.name || "—"}</p>
              {data.description && (
                <p className="text-xs text-tyro-text-secondary mt-0.5">{data.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-tyro-text-secondary">
              <MapPin size={12} />
              <span>{data.source || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-tyro-text-secondary">
              <FolderTree size={12} />
              <span>{data.department || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-tyro-text-secondary">
              <User size={12} />
              <span>{data.owner || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-tyro-text-secondary">
              <Users size={12} />
              <span>{data.participants?.length || 0} katılımcı</span>
            </div>
            <div className="flex items-center gap-1.5 text-tyro-text-secondary">
              <Calendar size={12} />
              <span>{formatDate(data.startDate ?? "")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-tyro-text-secondary">
              <Calendar size={12} />
              <span>{formatDate(data.endDate ?? "")}</span>
            </div>
          </div>

          {parentName && (
            <div className="text-xs text-tyro-text-muted pt-1 border-t border-tyro-border">
              Ana Proje: <span className="font-medium text-tyro-text-secondary">{parentName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Aksiyonlar Summary */}
      <div className="rounded-2xl border border-tyro-border overflow-hidden">
        <div className="bg-tyro-gold/10 px-4 py-2.5">
          <span className="text-[11px] font-bold text-tyro-gold uppercase tracking-wide">
            {t("wizard.reviewAksiyonlar")} ({data.aksiyonlar?.length || 0})
          </span>
        </div>
        <div className="divide-y divide-tyro-border">
          {data.aksiyonlar?.map((a: AksiyonEntry, i: number) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-tyro-navy/10 flex items-center justify-center text-[11px] font-bold text-tyro-navy shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-tyro-text-primary truncate">{a.name || "—"}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-tyro-text-muted">
                  <span className="flex items-center gap-1">
                    <User size={10} /> {a.owner || "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {formatDate(a.startDate ?? "")} → {formatDate(a.endDate ?? "")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
