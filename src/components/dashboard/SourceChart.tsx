import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useDataStore } from "@/stores/dataStore";
import GlassCard from "@/components/ui/GlassCard";

const STATUS_COLORS: Record<string, string> = {
  "Yolunda": "#10b981",
  "Riskte": "#f59e0b",
  "Yüksek Riskte": "#ef4444",
  "Tamamlandı": "#06b6d4",
  "Başlanmadı": "#94a3b8",
  "Askıda": "#8b5cf6",
  "İptal": "#6b7280",
};

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  fill?: string;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: TooltipPayloadEntry) => s + (p.value || 0), 0);
  return (
    <div className="bg-white/95 dark:bg-tyro-surface/95 backdrop-blur-xl border border-tyro-border/30 rounded-xl shadow-[0_8px_32px_rgba(30,58,95,0.15)] p-3 min-w-[160px]">
      <p className="text-[12px] font-bold text-tyro-text-primary mb-2 pb-1.5 border-b border-tyro-border/20">
        {label} <span className="text-tyro-text-muted font-normal">· {total} proje</span>
      </p>
      <div className="space-y-1.5">
        {payload.filter((p: TooltipPayloadEntry) => p.value > 0).map((p: TooltipPayloadEntry) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.fill || p.color }} />
              <span className="text-[11px] text-tyro-text-secondary">{p.dataKey}</span>
            </div>
            <span className="text-[11px] font-bold text-tyro-text-primary tabular-nums">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SourceChart() {
  const projeler = useDataStore((s) => s.projeler);

  const chartData = useMemo(() => {
    // Single pass — accumulate counts per source × status
    const acc: Record<string, Record<string, number>> = {};
    for (const h of projeler) {
      const src = h.source === "International" ? "Intl" : h.source;
      if (!acc[src]) acc[src] = {};
      acc[src][h.status] = (acc[src][h.status] ?? 0) + 1;
    }
    const sources = ["Türkiye", "Kurumsal", "Intl"];
    const statusMap: [string, string][] = [
      ["On Track", "Yolunda"], ["At Risk", "Riskte"], ["High Risk", "Yüksek Riskte"],
      ["Achieved", "Tamamlandı"], ["Not Started", "Başlanmadı"], ["On Hold", "Askıda"], ["Cancelled", "İptal"],
    ];
    return sources.map((source) => {
      const entry: Record<string, string | number> = { source };
      for (const [key, label] of statusMap) entry[label] = acc[source]?.[key] ?? 0;
      return entry;
    });
  }, [projeler]);

  return (
    <GlassCard className="p-5 flex-1 flex flex-col">
      <h3 className="text-[13px] font-bold text-tyro-text-primary mb-1">
        İş Kolu Dağılımı
      </h3>
      <p className="text-[11px] text-tyro-text-secondary mb-3">
        Türkiye, Kurumsal ve International iş kolları
      </p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={2} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tyro-border)" vertical={false} />
            <XAxis
              dataKey="source"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--tyro-text-secondary)" }}
              padding={{ left: 5, right: 5 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--tyro-text-muted)" }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(30,58,95,0.04)", radius: 6 }} />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              iconType="circle"
              iconSize={7}
            />
            <Bar dataKey="Yolunda" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1200} />
            <Bar dataKey="Riskte" fill="#f59e0b" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={100} />
            <Bar dataKey="Yüksek Riskte" fill="#ef4444" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={200} />
            <Bar dataKey="Tamamlandı" fill="#06b6d4" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={300} />
            <Bar dataKey="Başlanmadı" fill="#94a3b8" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={400} />
            <Bar dataKey="Askıda" fill="#8b5cf6" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={500} />
            <Bar dataKey="İptal" fill="#6b7280" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={600} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
