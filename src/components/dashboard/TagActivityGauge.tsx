import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import GlassCard from "@/components/ui/GlassCard";
import { useDataStore } from "@/stores/dataStore";
import { DEFAULT_TAG_COLOR } from "@/config/tagColors";

interface TagStat {
  name: string;
  value: number; // average progress (0-100)
  count: number;
  fill: string;
}

/* ---------- Custom Tooltip ---------- */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TagStat }>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl bg-white dark:bg-tyro-surface border border-tyro-border/50 shadow-lg px-3 py-2 text-[11px]">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: d.fill }}
        />
        <span className="font-bold text-tyro-text-primary">{d.name}</span>
      </div>
      <div className="text-tyro-text-secondary">
        {d.count} proje · ort. %{d.value} ilerleme
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function TagActivityGauge() {
  const { t } = useTranslation();
  const projeler = useDataStore((s) => s.projeler);
  const tagDefinitions = useDataStore((s) => s.tagDefinitions);

  const tagStats: TagStat[] = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const h of projeler) {
      for (const tag of h.tags ?? []) {
        const entry = map.get(tag) ?? { total: 0, count: 0 };
        entry.total += h.progress;
        entry.count += 1;
        map.set(tag, entry);
      }
    }

    return Array.from(map.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([name, { total, count }]) => {
        const def = tagDefinitions.find(
          (td) =>
            td.name.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr")
        );
        return {
          name,
          value: Math.round(total / count),
          count,
          fill: def?.color ?? DEFAULT_TAG_COLOR,
        };
      });
  }, [projeler, tagDefinitions]);

  const totalTaggedHedef = useMemo(() => {
    const ids = new Set<string>();
    for (const h of projeler) {
      if (h.tags && h.tags.length > 0) ids.add(h.id);
    }
    return ids.size;
  }, [projeler]);

  if (tagStats.length === 0) return null;

  // Reverse: inner ring = first item, outer = last
  const chartData = [...tagStats].reverse();

  return (
    <GlassCard className="flex-1 flex flex-col p-5 min-h-0">
      <h3 className="text-[13px] font-bold text-tyro-text-primary mb-1">
        {t("dashboard.tagDistribution", "Tag Bazlı Proje Dağılımı")}
      </h3>
      <p className="text-[11px] text-tyro-text-secondary mb-3">
        {t("dashboard.tagDistributionDesc", "Etiket bazında ortalama ilerleme")}
      </p>

      <div className="flex-1 flex items-center min-h-0">
        {/* Activity Gauge — Untitled UI style */}
        <div className="w-[55%] min-h-[180px] h-full relative">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 1, height: 1 }}
          >
            <RadialBarChart
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="25%"
              outerRadius="90%"
              barSize={10}
              startAngle={90}
              endAngle={90 + 360}
            >
              <PolarAngleAxis
                tick={false}
                domain={[0, 100]}
                type="number"
              />
              <RadialBar
                dataKey="value"
                cornerRadius={99}
                background={{
                  fill: "var(--color-tyro-border, #e2e8f0)",
                  opacity: 0.25,
                }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Center text: just the count */}
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fill: "var(--color-tyro-text-primary, #0f172a)", fontSize: 22, fontWeight: 700 }}
              >
                {totalTaggedHedef}
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-[45%] flex flex-col gap-2.5 pl-2">
          {tagStats.map((stat) => (
            <div key={stat.name} className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: stat.fill }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-tyro-text-primary truncate leading-tight">
                  {stat.name}
                </p>
                <p className="text-[10px] text-tyro-text-secondary leading-tight">
                  {stat.count} proje · %{stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
