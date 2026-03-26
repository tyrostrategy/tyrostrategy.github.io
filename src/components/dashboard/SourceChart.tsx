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
import { useTranslation } from "react-i18next";
import { useDataStore } from "@/stores/dataStore";
import GlassCard from "@/components/ui/GlassCard";

export default function SourceChart() {
  const { t } = useTranslation();
  const projeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);

  const chartData = useMemo(() => {
    const sources = ["T\u00fcrkiye", "Kurumsal", "International"];
    return sources.map((source) => {
      const sourceHedefler = projeler.filter((h) => h.source === source);
      const sourceHedefIds = new Set(sourceHedefler.map((h) => h.id));
      const sourceAksiyonlar = aksiyonlar.filter((a) => sourceHedefIds.has(a.projeId));
      const achieved = sourceAksiyonlar.filter((a) => a.status === "Achieved").length;
      const active = sourceAksiyonlar.filter(
        (a) => a.status === "On Track" || a.status === "At Risk"
      ).length;
      const remaining = sourceAksiyonlar.length - achieved - active;

      return {
        source: source === "International" ? "Intl" : source,
        proje: sourceHedefler.length,
        aksiyon: sourceAksiyonlar.length,
        tamamlanan: achieved,
        devamEden: active,
        bekleyen: Math.max(0, remaining),
      };
    });
  }, [projeler, aksiyonlar]);

  return (
    <GlassCard className="p-5 flex-1 flex flex-col">
      <h3 className="text-[13px] font-bold text-tyro-text-primary mb-1">
        {t("dashboard.sourceDistribution")}
      </h3>
      <p className="text-[11px] text-tyro-text-secondary mb-3">
        {t("dashboard.sourceSubtitle")}
      </p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={3} barSize={18}>
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
            <Tooltip
              contentStyle={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--tyro-border)",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(30,58,95,0.12)",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              iconType="circle"
              iconSize={7}
            />
            <Bar
              dataKey="tamamlanan"
              name={t("dashboard.completed")}
              fill="var(--tyro-success)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={1200}
            />
            <Bar
              dataKey="devamEden"
              name={t("dashboard.inProgress")}
              fill="var(--tyro-navy)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={1200}
              animationBegin={200}
            />
            <Bar
              dataKey="bekleyen"
              name={t("dashboard.pending")}
              fill="var(--tyro-gold)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={1200}
              animationBegin={400}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
