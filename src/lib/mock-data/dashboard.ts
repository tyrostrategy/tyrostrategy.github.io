import type { ActivityItem, ChartDataPoint } from "@/types";

export const kpiData = [
  {
    id: "goal-completion",
    label: "Proje Tamamlanma",
    value: 2,
    target: 46,
    suffix: "",
    progress: 4,
    trend: 0,
    trendLabel: "vs Q3",
    variant: "active" as const,
    icon: "Target",
    color: "var(--tyro-navy)",
    details: [
      { name: "Tiryaki LTIP programının global düzeyde hayata geçirilmesi", status: "completed" }
    ],
  },
  {
    id: "active-projects",
    label: "Aktif Projeler",
    value: 46,
    trend: 39,
    trendLabel: "on track",
    variant: "default" as const,
    icon: "Briefcase",
    color: "var(--tyro-gold)",
    sparklineData: [35, 39, 39, 37, 42, 40, 42, 44, 46, 47, 45, 47],
  },
  {
    id: "budget-usage",
    label: "Bütçe Kullanım",
    value: 24,
    suffix: "M",
    prefix: "₺",
    progress: 68,
    trend: 4.7,
    trendLabel: "YoY",
    variant: "ring" as const,
    icon: "Wallet",
    color: "var(--tyro-success)",
    budgetTotal: 35,
  },
  {
    id: "overdue-tasks",
    label: "Geciken Görevler",
    value: 21,
    trend: -3,
    trendLabel: "vs geçen hafta",
    variant: "default" as const,
    icon: "AlertTriangle",
    color: "var(--tyro-danger)",
    sparklineData: [21, 21, 20, 21, 22, 19, 17, 20, 22, 19, 23, 20],
    criticalCount: 4,
  },
];

export const chartData: ChartDataPoint[] = [
  { month: "Ağu", budget: 12, spend: 10 },
  { month: "Eyl", budget: 14, spend: 12 },
  { month: "Eki", budget: 11, spend: 13 },
  { month: "Kas", budget: 16, spend: 14 },
  { month: "Ara", budget: 15, spend: 12 },
  { month: "Oca", budget: 18, spend: 16 },
  { month: "Şub", budget: 17, spend: 15 },
  { month: "Mar", budget: 20, spend: 18 },
];

export const multiRingData = [
  { label: "Projeler", progress: 4, color: "var(--tyro-navy)" },
  { label: "Projeler", progress: 2, color: "var(--tyro-gold)" },
  { label: "Bütçe", progress: 68, color: "var(--tyro-success)" },
];

export const projectStatusData = [
  {
    status: "Aktif",
    count: 39,
    color: "var(--tyro-success)",
    projects: [
      { name: "Muş Sulama Sistemi devreye alınması ve verimli kullanma", progress: 96 },
      { name: "Yıldız Muş Arazisi Tarımsal Mekanizasyon Projesi", progress: 100 },
      { name: "Faz 1 - Değişkenli Tarım (2024-2025 Sezonu)", progress: 100 },
      { name: "Yıldız Alparslan Anıtkır Yatırımında Arsa Edinimi", progress: 50 }
    ],
  },
  {
    status: "Risk Altında",
    count: 9,
    color: "var(--tyro-warning)",
    projects: [
      { name: "Antep fıstığının Çin pazarına girmesi", progress: 83 },
      { name: "Faz 2 - Rejeneratif Tarım (2025-2026 Sezonu)", progress: 33 },
      { name: "Yem katkı ihracat arttırılması, Yem katkı ve premix ve yiy-dışı pazar genişlet.", progress: 63 },
      { name: "Çiftlik Yönetimi FarmERP", progress: 0 }
    ],
  },
  {
    status: "Tamamlanan",
    count: 1,
    color: "var(--tyro-navy)",
    projects: [
      { name: "Tiryaki LTIP programının global düzeyde hayata geçirilmesi", progress: 100 }
    ],
  },
  {
    status: "Planlanan",
    count: 1,
    color: "var(--tyro-info)",
    projects: [
      { name: "Faz2 - Deodorizasyon Ünitesinin Rafineriye Dön. & Yenilenebilir Yağ Tankları", progress: 0 }
    ],
  },
];

export const activityFeed: ActivityItem[] = [
  {
    id: "a1",
    title: "1-Pazar analizi tamamlandı",
    description: "Antep fıstığının Çin pazarına girmesi projesinde görev tamamlandı",
    time: "Bu hafta",
    color: "var(--tyro-success)",
  },
  {
    id: "a2",
    title: "2-Rakip analizi tamamlandı",
    description: "Antep fıstığının Çin pazarına girmesi projesinde görev tamamlandı",
    time: "Bu hafta",
    color: "var(--tyro-success)",
  },
  {
    id: "a3",
    title: "6-Stratejik stok bulundurma risk altında",
    description: "Antep fıstığının Çin pazarına girmesi projesinde dikkat gerektiriyor",
    time: "Bu hafta",
    color: "var(--tyro-warning)",
  },
  {
    id: "a4",
    title: "19-B2-B3-B7 Sisteme Su Verilmesi ve Sulama Yapılması risk altında",
    description: "Muş Sulama Sistemi devreye alınması ve verimli kullanma projesinde dikkat gerektiriyor",
    time: "Bu hafta",
    color: "var(--tyro-warning)",
  },
  {
    id: "a5",
    title: "Şubat 2026 raporu hazırlandı",
    description: "Cascade proje durum raporu güncellendi",
    time: "2 gün önce",
    color: "var(--tyro-navy)",
  }
];

export const miniKpiData = {
  teamMembers: 23,
  completedTasks: 140,
};
