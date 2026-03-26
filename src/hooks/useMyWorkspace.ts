import { useMemo } from "react";
import { useDataStore } from "@/stores/dataStore";
import { useCurrentUser } from "./useCurrentUser";
import type { Proje, Aksiyon } from "@/types";

export interface DeadlineItem {
  id: string;
  name: string;
  type: "proje" | "aksiyon";
  endDate: string;
  parentName: string;
  status: string;
  progress: number;
}

interface WorkspaceData {
  userName: string;
  department: string;
  myProjeler: Proje[];
  myAksiyonlar: Aksiyon[];
  totalAksiyonlar: number;
  achievedAksiyonlar: number;
  behindAksiyonlar: number;
  atRiskAksiyonlar: number;
  overallProgress: number;
  aksiyonProgress: number;
  statusBreakdown: Record<string, number>;
  upcomingDeadlines: DeadlineItem[];
}

export function useMyWorkspace(): WorkspaceData {
  const { name: userName, department } = useCurrentUser();
  const projeler = useDataStore((s) => s.projeler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);

  return useMemo(() => {
    const normalizedName = userName.toLowerCase().trim();

    // Filter projeler where user is owner or participant
    const myProjeler = projeler.filter(
      (h) =>
        h.owner?.toLowerCase().trim() === normalizedName ||
        h.participants?.some((p) => p.toLowerCase().trim() === normalizedName)
    );

    const myHedefIds = new Set(myProjeler.map((h) => h.id));

    // Filter aksiyonlar: owner or belongs to user's proje
    const myAksiyonlar = aksiyonlar.filter(
      (a) =>
        a.owner?.toLowerCase().trim() === normalizedName ||
        myHedefIds.has(a.projeId)
    );

    // Counts
    const totalAksiyonlar = myAksiyonlar.length;
    const achievedAksiyonlar = myAksiyonlar.filter((a) => a.status === "Achieved").length;
    const behindAksiyonlar = myAksiyonlar.filter((a) => a.status === "Behind").length;
    const atRiskAksiyonlar = myAksiyonlar.filter((a) => a.status === "At Risk").length;

    // Progress
    const overallProgress =
      totalAksiyonlar > 0
        ? Math.round(myAksiyonlar.reduce((sum, a) => sum + a.progress, 0) / totalAksiyonlar)
        : 0;
    const aksiyonProgress =
      totalAksiyonlar > 0 ? Math.round((achievedAksiyonlar / totalAksiyonlar) * 100) : 0;

    // Status breakdown for donut chart
    const statusBreakdown: Record<string, number> = {};
    for (const a of myAksiyonlar) {
      statusBreakdown[a.status] = (statusBreakdown[a.status] || 0) + 1;
    }

    // Upcoming deadlines — combine proje and aksiyon deadlines
    const hedefNameMap = new Map(projeler.map((h) => [h.id, h.name]));

    const allDeadlines: DeadlineItem[] = [];

    // Proje deadlines (owner)
    for (const h of myProjeler) {
      if (h.status !== "Achieved" && h.endDate) {
        allDeadlines.push({
          id: h.id,
          name: h.name,
          type: "proje",
          endDate: h.endDate,
          parentName: h.source,
          status: h.status,
          progress: h.progress,
        });
      }
    }

    // Aksiyon deadlines
    for (const a of myAksiyonlar) {
      if (a.status !== "Achieved" && a.endDate) {
        allDeadlines.push({
          id: a.id,
          name: a.name,
          type: "aksiyon",
          endDate: a.endDate,
          parentName: hedefNameMap.get(a.projeId) ?? "-",
          status: a.status,
          progress: a.progress,
        });
      }
    }

    const upcomingDeadlines = allDeadlines
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 10);

    return {
      userName,
      department,
      myProjeler,
      myAksiyonlar,
      totalAksiyonlar,
      achievedAksiyonlar,
      behindAksiyonlar,
      atRiskAksiyonlar,
      overallProgress,
      aksiyonProgress,
      statusBreakdown,
      upcomingDeadlines,
    };
  }, [userName, department, projeler, aksiyonlar]);
}
