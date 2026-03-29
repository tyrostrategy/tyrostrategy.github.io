import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import GlassCard from "@/components/ui/GlassCard";
import { useMyWorkspace } from "@/hooks/useMyWorkspace";
import { getStatusLabel } from "@/lib/constants";
import type { EntityStatus } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  "On Track": "#10b981",
  "Achieved": "#1e3a5f",
  "Behind": "#ef4444",
  "At Risk": "#f59e0b",
  "Not Started": "#94a3b8",
};

export default function WorkspaceTaskDonut() {
  const { t } = useTranslation();
  const { statusBreakdown, totalAksiyonlar } = useMyWorkspace();

  const data = useMemo(
    () =>
      Object.entries(statusBreakdown)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
          name: getStatusLabel(status as EntityStatus, t),
          value: count,
          color: STATUS_COLORS[status] || "#94a3b8",
        })),
    [statusBreakdown, t]
  );

  return (
    <GlassCard className="p-3 sm:p-5 flex-1 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-tyro-info/10 flex items-center justify-center">
          <PieChartIcon size={14} className="text-tyro-info" />
        </div>
        <h3 className="text-[13px] font-bold text-tyro-text-primary">{t("workspace.actionStatus")}</h3>
      </div>
      {totalAksiyonlar === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-tyro-text-muted">
          {t("workspace.noActions")}
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string) => [`${value} ${t("nav.actions").toLowerCase()}`, ""]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--tyro-border)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-tyro-text-muted">{d.name}</span>
                <span className="text-[11px] font-semibold text-tyro-text-secondary">{d.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </GlassCard>
  );
}
