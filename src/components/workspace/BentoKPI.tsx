import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Crosshair, AlertTriangle, CalendarClock } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useMyWorkspace } from "@/hooks/useMyWorkspace";
import { useDataStore } from "@/stores/dataStore";

export default function BentoKPI() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ws = useMyWorkspace();
  const projeler = useDataStore((s) => s.projeler);

  const overdueReviewProjeler = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return projeler.filter((h) => {
      if (!h.reviewDate) return true;
      if (h.status === "Achieved" || h.status === "Cancelled") return false;
      const rd = new Date(h.reviewDate);
      return rd <= oneMonthAgo;
    });
  }, [projeler]);

  return (
    <div className="grid grid-cols-3 gap-3 flex-1">
      {/* Card 1: Projelerim + Tamamlanan + Ort İlerleme */}
      <GlassCard
        className="p-4 flex flex-col justify-between cursor-pointer"
        onClick={() => navigate("/projeler")}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-tyro-navy/8 flex items-center justify-center">
            <Crosshair size={16} className="text-tyro-navy" />
          </div>
          <span className="text-[11px] font-semibold text-tyro-text-secondary">{t("workspace.myObjectives")}</span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[28px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{ws.myProjeler.length}</span>
          <span className="text-[11px] text-tyro-text-muted">/ {ws.totalProjeler} toplam</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] text-emerald-600 font-bold">{ws.achievedProjeler} tamamlandı</span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-tyro-text-muted">{t("workspace.avgProgress")}</span>
            <span className="text-[12px] font-extrabold text-tyro-navy tabular-nums">%{ws.overallProgress}</span>
          </div>
          <div className="h-2 rounded-full bg-tyro-bg overflow-hidden">
            <div className="h-full rounded-full bg-tyro-navy transition-all" style={{ width: `${ws.overallProgress}%` }} />
          </div>
        </div>
      </GlassCard>

      {/* Card 2: Geciken / Riskli */}
      <GlassCard
        className="p-4 flex flex-col justify-between cursor-pointer"
        onClick={() => navigate("/projeler")}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-red-500/8 flex items-center justify-center">
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <span className="text-[11px] font-semibold text-tyro-text-secondary">Dikkat Gerektiren</span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[28px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{ws.behindProjeler + ws.atRiskProjeler}</span>
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-tyro-text-secondary">Gecikmeli</span>
            <span className="text-[12px] font-bold text-red-500 tabular-nums">{ws.behindProjeler}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-tyro-text-secondary">Risk Altında</span>
            <span className="text-[12px] font-bold text-amber-500 tabular-nums">{ws.atRiskProjeler}</span>
          </div>
        </div>
      </GlassCard>

      {/* Card 3: Kontrol Tarihi Güncel Değil */}
      <GlassCard
        className="p-4 flex flex-col justify-between cursor-pointer"
        onClick={() => navigate("/projeler?reviewOverdue=true")}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/8 flex items-center justify-center">
            <CalendarClock size={16} className="text-amber-500" />
          </div>
          <span className="text-[11px] font-semibold text-tyro-text-secondary">Kontrol Tarihi</span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[28px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{overdueReviewProjeler.length}</span>
        </div>
        <p className="text-[11px] text-tyro-text-muted mt-2">
          1 ay veya daha fazla güncellenmemiş kontrol tarihi olan projeler
        </p>
      </GlassCard>
    </div>
  );
}
