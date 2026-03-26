import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Crosshair, CalendarClock, TrendingUp } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useMyWorkspace } from "@/hooks/useMyWorkspace";
import { useDataStore } from "@/stores/dataStore";
import type { EntityStatus } from "@/types";
import { getStatusLabel } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  "On Track": "#10b981",
  "At Risk": "#f59e0b",
  "Behind": "#ef4444",
  "Achieved": "#059669",
  "Not Started": "#94a3b8",
  "Cancelled": "#6b7280",
  "On Hold": "#8b5cf6",
};

const STATUS_ORDER: EntityStatus[] = ["On Track", "At Risk", "Behind", "Achieved", "Not Started", "On Hold", "Cancelled"];

export default function BentoKPI() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ws = useMyWorkspace();
  const projeler = useDataStore((s) => s.projeler);

  const overdueCount = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return projeler.filter((h) => {
      if (!h.reviewDate) return true;
      if (h.status === "Achieved" || h.status === "Cancelled") return false;
      return new Date(h.reviewDate) <= oneMonthAgo;
    }).length;
  }, [projeler]);

  // Status counts for my projects
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

  // Donut segments
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let accOffset = 0;
  const total = ws.myProjeler.length || 1;
  const arcs = statusCounts.filter((s) => s.count > 0).map((seg) => {
    const pct = (seg.count / total) * 100;
    const dashLen = (pct / 100) * circumference;
    const dashOffset = circumference - accOffset;
    accOffset += dashLen;
    return { ...seg, pct, dashLen, dashOffset };
  });

  return (
    <GlassCard className="p-4 sm:p-5 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-tyro-navy/8 flex items-center justify-center">
            <TrendingUp size={15} className="text-tyro-navy" />
          </div>
          <h3 className="text-[13px] font-bold text-tyro-text-primary">Proje Özeti</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate("/projeler")}
          className="text-[11px] font-semibold text-tyro-navy hover:underline cursor-pointer"
        >
          Tümünü Gör &rsaquo;
        </button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-2.5">
        {/* Left: Toplam + Status mini cards (8 col) */}
        <div className="col-span-8 flex flex-col gap-2.5">
          {/* Row 1: Toplam Proje + Ort İlerleme */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Toplam Proje */}
            <div
              onClick={() => navigate("/projeler")}
              className="rounded-xl bg-tyro-navy/5 p-3 cursor-pointer hover:bg-tyro-navy/8 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Crosshair size={13} className="text-tyro-navy" />
                <span className="text-[10px] font-semibold text-tyro-text-muted uppercase tracking-wider">Projelerim</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[24px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{ws.myProjeler.length}</span>
                <span className="text-[10px] text-tyro-text-muted">/ {ws.totalProjeler}</span>
              </div>
            </div>

            {/* Kontrol Tarihi */}
            <div
              onClick={() => navigate("/projeler?reviewOverdue=true")}
              className="rounded-xl bg-amber-500/5 p-3 cursor-pointer hover:bg-amber-500/8 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <CalendarClock size={13} className="text-amber-500" />
                <span className="text-[10px] font-semibold text-tyro-text-muted uppercase tracking-wider">Kontrol</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[24px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{overdueCount}</span>
                <span className="text-[10px] text-tyro-text-muted">güncel değil</span>
              </div>
            </div>
          </div>

          {/* Row 2: Status mini cards — first 4 */}
          <div className="grid grid-cols-4 gap-2">
            {statusCounts.slice(0, 4).map((s) => (
              <div
                key={s.status}
                onClick={() => navigate("/projeler")}
                className={`rounded-xl p-2.5 cursor-pointer hover:brightness-95 transition-all text-center ${s.count === 0 ? "opacity-40" : ""}`}
                style={{ backgroundColor: `${s.color}10` }}
              >
                <span className="text-[18px] font-extrabold tabular-nums leading-none" style={{ color: s.color }}>
                  {s.count}
                </span>
                <p className="text-[9px] font-semibold mt-1 truncate" style={{ color: s.color }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Row 3: Remaining statuses */}
          <div className="grid grid-cols-4 gap-2">
            {statusCounts.slice(4).map((s) => (
              <div
                key={s.status}
                onClick={() => navigate("/projeler")}
                className={`rounded-xl p-2.5 cursor-pointer hover:brightness-95 transition-all text-center ${s.count === 0 ? "opacity-40" : ""}`}
                style={{ backgroundColor: `${s.color}10` }}
              >
                <span className="text-[18px] font-extrabold tabular-nums leading-none" style={{ color: s.color }}>
                  {s.count}
                </span>
                <p className="text-[9px] font-semibold mt-1 truncate" style={{ color: s.color }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Donut + Legend (4 col) */}
        <div className="col-span-4 flex flex-col items-center justify-center">
          {/* Donut */}
          <div className="relative" style={{ width: 100, height: 100 }}>
            <svg width={100} height={100} viewBox="0 0 100 100" className="-rotate-90">
              <circle cx={50} cy={50} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={8} />
              {arcs.map((arc) => (
                <circle
                  key={arc.status}
                  cx={50} cy={50} r={radius}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={`${arc.dashLen} ${circumference - arc.dashLen}`}
                  strokeDashoffset={arc.dashOffset}
                  style={{ transition: "all 0.5s ease" }}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[16px] font-extrabold tabular-nums text-tyro-text-primary leading-none">
                %{avgProgress}
              </span>
              <span className="text-[8px] font-semibold text-tyro-text-muted mt-0.5 uppercase tracking-wider">
                ort.
              </span>
            </div>
          </div>

          {/* Mini legend */}
          <div className="mt-3 w-full space-y-1">
            {statusCounts.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-[9px] text-tyro-text-muted truncate">{s.label}</span>
                </div>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
