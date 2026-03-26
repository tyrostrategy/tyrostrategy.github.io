import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Crosshair, CircleCheckBig, CheckCircle, AlertTriangle, CalendarClock } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useMyWorkspace } from "@/hooks/useMyWorkspace";
import { useDataStore } from "@/stores/dataStore";

export default function BentoKPI() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ws = useMyWorkspace();
  const projeler = useDataStore((s) => s.projeler);

  // Kontrol tarihi 1 ay veya daha fazla güncel olmayan projeler
  const overdueReviewProjeler = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return projeler.filter((h) => {
      if (!h.reviewDate) return true; // reviewDate yoksa güncel değil
      if (h.status === "Achieved" || h.status === "Cancelled") return false;
      const rd = new Date(h.reviewDate);
      return rd <= oneMonthAgo;
    });
  }, [projeler]);

  const aksiyonPct = ws.totalAksiyonlar > 0
    ? Math.round((ws.achievedAksiyonlar / ws.totalAksiyonlar) * 100) : 0;

  return (
    <GlassCard className="p-4 sm:p-5 flex-1 flex flex-col gap-3 overflow-hidden">
      {/* Hedefler + Aksiyonlar side by side */}
      <div className="grid grid-cols-2 gap-2">
        {/* Hedeflerim */}
        <div
          onClick={() => navigate("/projeler")}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-tyro-navy/5 cursor-pointer hover:bg-tyro-navy/10 transition-colors"
        >
          <Crosshair size={18} className="text-tyro-navy mb-1" />
          <span className="text-[22px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{ws.myProjeler.length}</span>
          <span className="text-[11px] font-medium text-tyro-text-muted">{t("workspace.myObjectives")}</span>
        </div>

        {/* Aksiyonlarım */}
        <div
          onClick={() => navigate("/aksiyonlar")}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors"
        >
          <CircleCheckBig size={18} className="text-blue-500 mb-1" />
          <span className="text-[22px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{ws.totalAksiyonlar}</span>
          <span className="text-[11px] font-medium text-tyro-text-muted">{t("workspace.myActions")}</span>
        </div>
      </div>

      {/* Tamamlanan — big donut */}
      <div
        onClick={() => navigate("/aksiyonlar")}
        className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 cursor-pointer hover:bg-emerald-500/10 transition-colors"
      >
        <div className="relative w-12 h-12 shrink-0">
          <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
            <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" className="text-tyro-bg" stroke="currentColor" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--tyro-success)" strokeWidth="3"
              strokeDasharray={`${aksiyonPct * 0.88} 88`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums text-emerald-600">
            {aksiyonPct}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-[12px] font-bold text-tyro-text-primary">{ws.achievedAksiyonlar}</span>
            <span className="text-[11px] text-tyro-text-muted">/ {ws.totalAksiyonlar}</span>
          </div>
          <span className="text-[11px] text-tyro-text-muted">{t("workspace.completed")}</span>
        </div>
      </div>

      {/* Geciken/Riskli + Kontrol Tarihi — same row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Geciken / Riskli */}
        <div
          onClick={() => navigate("/aksiyonlar")}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors"
        >
          <AlertTriangle size={18} className="text-red-500 mb-0.5" />
          <span className="text-[20px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{ws.behindAksiyonlar + ws.atRiskAksiyonlar}</span>
          <span className="text-[10px] text-tyro-text-muted text-center leading-tight">
            {ws.behindAksiyonlar} geciken, {ws.atRiskAksiyonlar} riskli
          </span>
        </div>

        {/* Kontrol tarihi güncel olmayan */}
        <div
          onClick={() => navigate("/projeler?reviewOverdue=true")}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-colors"
        >
          <CalendarClock size={18} className="text-amber-500 mb-0.5" />
          <span className="text-[20px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{overdueReviewProjeler.length}</span>
          <span className="text-[10px] text-tyro-text-muted text-center leading-tight">kontrol tarihi güncel değil</span>
        </div>
      </div>

      {/* spacer for flex layout */}
      <div className="mt-auto" />
    </GlassCard>
  );
}
