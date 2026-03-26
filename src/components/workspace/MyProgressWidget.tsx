import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useMyWorkspace } from "@/hooks/useMyWorkspace";
import GlassCard from "@/components/ui/GlassCard";
import { TrendingUp } from "lucide-react";
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

interface DonutSegment {
  status: string;
  label: string;
  count: number;
  color: string;
  pct: number;
}

export default function MyProgressWidget() {
  const { t } = useTranslation();
  const ws = useMyWorkspace();

  const segments = useMemo(() => {
    const total = ws.myProjeler.length || 1;
    const counts = new Map<string, number>();
    for (const h of ws.myProjeler) counts.set(h.status, (counts.get(h.status) ?? 0) + 1);

    return STATUS_ORDER
      .filter((s) => counts.has(s))
      .map((s) => ({
        status: s,
        label: getStatusLabel(s, t),
        count: counts.get(s)!,
        color: STATUS_COLORS[s] ?? "#94a3b8",
        pct: Math.round((counts.get(s)! / total) * 100),
      }));
  }, [ws.myProjeler, t]);

  const avgProgress = ws.myProjeler.length > 0
    ? Math.round(ws.myProjeler.reduce((s, h) => s + h.progress, 0) / ws.myProjeler.length)
    : 0;

  // Build SVG donut segments
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let accOffset = 0;
  const arcs = segments.map((seg) => {
    const dashLen = (seg.pct / 100) * circumference;
    const dashOffset = circumference - accOffset;
    accOffset += dashLen;
    return { ...seg, dashLen, dashOffset };
  });

  return (
    <GlassCard className="p-3 sm:p-5 flex-1 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-tyro-navy/10 flex items-center justify-center">
          <TrendingUp size={14} className="text-tyro-navy" />
        </div>
        <h3 className="text-[13px] font-bold text-tyro-text-primary">{t("workspace.individualProgress")}</h3>
      </div>

      {/* Donut chart — status segments */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative" style={{ width: 140, height: 140 }}>
          <svg width={140} height={140} viewBox="0 0 140 140" className="-rotate-90">
            {/* Background circle */}
            <circle cx={70} cy={70} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={10} />
            {/* Status segments */}
            {arcs.map((arc) => (
              <circle
                key={arc.status}
                cx={70} cy={70} r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${arc.dashLen} ${circumference - arc.dashLen}`}
                strokeDashoffset={arc.dashOffset}
                style={{ transition: "stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease" }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-extrabold tabular-nums text-tyro-text-primary leading-none">
              %{avgProgress}
            </span>
            <span className="text-[10px] font-semibold text-tyro-text-muted mt-1 uppercase tracking-wider">
              {t("workspace.overall")}
            </span>
          </div>
        </div>
      </div>

      {/* Legend — all statuses */}
      <div className="space-y-1.5 mt-auto">
        {segments.map((seg) => (
          <div key={seg.status} className="flex items-center justify-between py-1 px-1.5 -mx-1.5 rounded-lg hover:bg-tyro-bg/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[11px] font-medium text-tyro-text-secondary">{seg.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-tyro-text-muted tabular-nums">{seg.count}</span>
              <span className="text-[11px] font-bold text-tyro-text-primary tabular-nums">{seg.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
