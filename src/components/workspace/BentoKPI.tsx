import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FolderKanban, Trophy, ShieldAlert, TrendingUp } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useMyWorkspace } from "@/hooks/useMyWorkspace";
import type { EntityStatus } from "@/types";
import { getStatusLabel } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  "On Track": "#10b981",
  "At Risk": "#f59e0b",
  "Behind": "#ef4444",
  "Achieved": "#3b82f6",
  "Not Started": "#94a3b8",
  "Cancelled": "#6b7280",
  "On Hold": "#8b5cf6",
};

const STATUS_ORDER: EntityStatus[] = ["On Track", "At Risk", "Behind", "Achieved", "Not Started", "On Hold", "Cancelled"];

export default function BentoKPI() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ws = useMyWorkspace();

  const overdueCount = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return ws.myProjeler.filter((h) => {
      if (!h.reviewDate) return true;
      if (h.status === "Achieved" || h.status === "Cancelled") return false;
      return new Date(h.reviewDate) <= oneMonthAgo;
    }).length;
  }, [ws.myProjeler]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const h of ws.myProjeler) counts.set(h.status, (counts.get(h.status) ?? 0) + 1);
    return STATUS_ORDER.map((s) => ({
      status: s,
      label: getStatusLabel(s, t),
      count: counts.get(s) ?? 0,
      color: STATUS_COLORS[s] ?? "#94a3b8",
    }));
  }, [ws.myProjeler, t]);

  const avgProgress = ws.overallProgress;
  const progColor = avgProgress >= 75 ? "#059669" : avgProgress >= 50 ? "#10b981" : avgProgress >= 25 ? "#f59e0b" : "#ef4444";
  const r = 52;
  const c = 2 * Math.PI * r;
  const progressDash = (avgProgress / 100) * c;

  return (
    <GlassCard className="p-4 sm:p-5 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <TrendingUp size={18} className="text-tyro-navy" />
          <h3 className="text-[14px] font-bold text-tyro-text-primary">Proje Özeti</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate("/stratejik-kokpit")}
          className="text-[12px] font-semibold text-tyro-navy hover:underline cursor-pointer"
        >
          Tümünü Gör &rsaquo;
        </button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-3">
        {/* Left section (9 col) */}
        <div className="col-span-9 flex flex-col gap-3">
          {/* Row 1: 3 summary KPI cards — no icon backgrounds, unique icons */}
          <div className="grid grid-cols-3 gap-3">
            {/* Projelerim */}
            <div
              onClick={() => navigate("/stratejik-kokpit")}
              className="rounded-2xl border border-tyro-border/30 bg-white/50 dark:bg-white/5 p-4 cursor-pointer hover:shadow-md hover:border-tyro-navy/20 transition-all"
            >
              <FolderKanban size={18} className="text-tyro-navy mb-2" />
              <span className="text-[28px] font-extrabold text-tyro-text-primary tabular-nums leading-none block">{ws.myProjeler.length}</span>
              <span className="text-[11px] font-medium text-tyro-text-secondary mt-1 block">Projelerim <span className="text-tyro-text-muted">/ {ws.totalProjeler}</span></span>
            </div>

            {/* Tamamlanan */}
            <div
              onClick={() => navigate("/stratejik-kokpit?status=Achieved")}
              className="rounded-2xl border border-tyro-border/30 bg-white/50 dark:bg-white/5 p-4 cursor-pointer hover:shadow-md hover:border-emerald-300/40 transition-all"
            >
              <Trophy size={18} className="text-emerald-500 mb-2" />
              <span className="text-[28px] font-extrabold text-tyro-text-primary tabular-nums leading-none block">{ws.achievedProjeler}</span>
              <span className="text-[11px] font-medium text-tyro-text-secondary mt-1 block">Tamamlanan Proje</span>
            </div>

            {/* Kontrol Edilmesi Gereken */}
            <div
              onClick={() => navigate("/stratejik-kokpit?reviewOverdue=true")}
              className="rounded-2xl border border-tyro-border/30 bg-white/50 dark:bg-white/5 p-4 cursor-pointer hover:shadow-md hover:border-amber-300/40 transition-all"
            >
              <ShieldAlert size={18} className="text-amber-500 mb-2" />
              <span className="text-[28px] font-extrabold text-tyro-text-primary tabular-nums leading-none block">{overdueCount}</span>
              <span className="text-[11px] font-medium text-tyro-text-secondary mt-1 block">Kontrol Bekleyen</span>
            </div>
          </div>

          {/* Row 2: 6 status cards (Achieved excluded) — premium mini cards */}
          <div className="grid grid-cols-6 gap-2">
            {statusCounts.filter((s) => s.status !== "Achieved").map((s) => (
              <div
                key={s.status}
                onClick={() => navigate(`/stratejik-kokpit?status=${s.status}`)}
                className={`rounded-xl border p-2.5 cursor-pointer hover:shadow-sm transition-all text-center ${s.count === 0 ? "opacity-30" : "hover:scale-[1.03]"}`}
                style={{
                  backgroundColor: `${s.color}08`,
                  borderColor: s.count > 0 ? `${s.color}25` : "transparent",
                }}
              >
                <span className="text-[18px] font-extrabold tabular-nums leading-none block" style={{ color: s.color }}>
                  {s.count}
                </span>
                <p className="text-[11px] font-medium mt-1 truncate" style={{ color: s.count > 0 ? s.color : undefined }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Premium Circular Progress (3 col) */}
        <div className="col-span-3 flex items-center justify-center">
          <div className="relative" style={{ width: 130, height: 130 }}>
            {/* Subtle glow */}
            <div className="absolute inset-2 rounded-full" style={{ background: `radial-gradient(circle, ${progColor}10 0%, transparent 70%)` }} />
            <svg width={130} height={130} viewBox="0 0 130 130" className="-rotate-90">
              {/* Track */}
              <circle cx={65} cy={65} r={r} fill="none" stroke="#e2e8f0" strokeWidth={9} opacity={0.35} />
              {/* Progress arc */}
              <circle
                cx={65} cy={65} r={r}
                fill="none"
                stroke={progColor}
                strokeWidth={9}
                strokeLinecap="round"
                strokeDasharray={`${progressDash} ${c - progressDash}`}
                strokeDashoffset={0}
                style={{ transition: "all 0.8s ease", filter: `drop-shadow(0 0 6px ${progColor}40)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[26px] font-extrabold tabular-nums text-tyro-text-primary leading-none">
                %{avgProgress}
              </span>
              <span className="text-[11px] font-medium text-tyro-text-secondary mt-1">
                Ort. İlerleme
              </span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
