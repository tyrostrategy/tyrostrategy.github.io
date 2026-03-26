import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMyWorkspace } from "../useMyWorkspace";
import { useDataStore } from "@/stores/dataStore";
import { useUIStore } from "@/stores/uiStore";
import type { Proje, Proje, Gorev } from "@/types";

// Mock i18n
vi.mock("@/lib/i18n", () => ({
  default: {
    language: "tr",
    use: () => ({ init: () => {} }),
    changeLanguage: () => {},
  },
}));

// Mock mock-adapter
vi.mock("@/lib/data/mock-adapter", () => ({
  getInitialProjeler: () => [],
  getInitialProjeler: () => [],
  getInitialGorevler: () => [],
}));

const hedef1: Proje = {
  id: "h1",
  name: "Proje 1",
  source: "Kurumsal",
  status: "On Track",
  owner: "Cenk Şayli",
  leader: "Cenk Şayli",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
};

const hedef2: Proje = {
  id: "h2",
  name: "Proje 2",
  source: "Türkiye",
  status: "On Track",
  owner: "Kemal Yıldız",
  leader: "Kemal Yıldız",
  startDate: "2024-01-01",
  endDate: "2024-06-30",
};

const proje1: Proje = {
  id: "p1",
  projeId: "h1",
  name: "Proje 1",
  department: "IT",
  projectLeader: "Cenk Şayli",
  participants: ["Cenk Şayli", "Emre Padar"],
  startDate: "2024-01-01",
  endDate: "2024-06-30",
  status: "On Track",
  progress: 60,
};

const proje2: Proje = {
  id: "p2",
  projeId: "h2",
  name: "Proje 2",
  department: "IT",
  projectLeader: "Kemal Yıldız",
  participants: ["Kemal Yıldız", "Cenk Şayli"],
  startDate: "2024-03-01",
  endDate: "2024-09-30",
  status: "Behind",
  progress: 20,
};

const proje3: Proje = {
  id: "p3",
  projeId: "h2",
  name: "Proje 3",
  department: "Finans",
  projectLeader: "Kemal Yıldız",
  participants: ["Kemal Yıldız"],
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  status: "On Track",
  progress: 40,
};

const gorev1: Gorev = {
  id: "g1",
  projeId: "p1",
  name: "Gorev 1",
  assignee: "Cenk Şayli",
  progress: 100,
  status: "Achieved",
  startDate: "2024-01-01",
  endDate: "2024-03-31",
};

const gorev2: Gorev = {
  id: "g2",
  projeId: "p1",
  name: "Gorev 2",
  assignee: "Emre Padar",
  progress: 50,
  status: "On Track",
  startDate: "2024-02-01",
  endDate: "2024-05-31",
};

const gorev3: Gorev = {
  id: "g3",
  projeId: "p2",
  name: "Gorev 3",
  assignee: "Cenk Şayli",
  progress: 0,
  status: "Behind",
  startDate: "2024-03-01",
  endDate: "2024-04-30",
};

const gorev4: Gorev = {
  id: "g4",
  projeId: "p3",
  name: "Gorev 4",
  assignee: "Kemal Yıldız",
  progress: 30,
  status: "At Risk",
  startDate: "2024-03-01",
  endDate: "2024-07-31",
};

beforeEach(() => {
  useUIStore.setState({ mockUserName: "Cenk Şayli", mockUserRole: "Admin" });
  useDataStore.setState({
    projeler: [hedef1, hedef2],
    projeler: [proje1, proje2, proje3],
    gorevler: [gorev1, gorev2, gorev3, gorev4],
  });
});

describe("useMyWorkspace", () => {
  it("returns correct userName and department", () => {
    const { result } = renderHook(() => useMyWorkspace());
    expect(result.current.userName).toBe("Cenk Şayli");
    expect(result.current.department).toBe("IT");
  });

  describe("myProjeler", () => {
    it("includes projects where user is leader", () => {
      const { result } = renderHook(() => useMyWorkspace());
      expect(result.current.myProjeler.some((p) => p.id === "p1")).toBe(true);
    });

    it("includes projects where user is participant", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // Cenk is a participant in p2
      expect(result.current.myProjeler.some((p) => p.id === "p2")).toBe(true);
    });

    it("excludes projects where user is neither leader nor participant", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // p3 has no connection to Cenk
      expect(result.current.myProjeler.some((p) => p.id === "p3")).toBe(false);
    });
  });

  describe("myGorevler", () => {
    it("includes tasks assigned to user", () => {
      const { result } = renderHook(() => useMyWorkspace());
      expect(result.current.myGorevler.some((g) => g.id === "g1")).toBe(true);
      expect(result.current.myGorevler.some((g) => g.id === "g3")).toBe(true);
    });

    it("includes tasks in user's projects (even if assigned to someone else)", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // g2 is in p1 (Cenk's project) even though assigned to Emre
      expect(result.current.myGorevler.some((g) => g.id === "g2")).toBe(true);
    });

    it("excludes tasks in other projects not assigned to user", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // g4 is in p3, which Cenk is not part of, and is assigned to Kemal
      expect(result.current.myGorevler.some((g) => g.id === "g4")).toBe(false);
    });
  });

  describe("statistics", () => {
    it("calculates projectsAsLeader correctly", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // Cenk is leader of p1 only
      expect(result.current.projectsAsLeader).toBe(1);
    });

    it("calculates projectsAsParticipant correctly", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // Cenk is participant in p2 (not leader)
      expect(result.current.projectsAsParticipant).toBe(1);
    });

    it("calculates achievedGorevler correctly", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // g1 is Achieved
      expect(result.current.achievedGorevler).toBe(1);
    });

    it("calculates behindGorevler correctly", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // g3 is Behind
      expect(result.current.behindGorevler).toBe(1);
    });

    it("calculates totalGorevler correctly", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // g1, g2, g3 (not g4)
      expect(result.current.totalGorevler).toBe(3);
    });

    it("calculates overallProgress as average of gorev progress", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // (100 + 50 + 0) / 3 = 50
      expect(result.current.overallProgress).toBe(50);
    });

    it("calculates gorevProgress as percentage of achieved", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // 1/3 achieved = 33%
      expect(result.current.gorevProgress).toBe(33);
    });

    it("calculates statusBreakdown correctly", () => {
      const { result } = renderHook(() => useMyWorkspace());
      expect(result.current.statusBreakdown["Achieved"]).toBe(1);
      expect(result.current.statusBreakdown["On Track"]).toBe(1);
      expect(result.current.statusBreakdown["Behind"]).toBe(1);
    });
  });

  describe("upcomingDeadlines", () => {
    it("is sorted by endDate ascending", () => {
      const { result } = renderHook(() => useMyWorkspace());
      const dates = result.current.upcomingDeadlines.map((d) => d.endDate);
      for (let i = 1; i < dates.length; i++) {
        expect(new Date(dates[i]).getTime()).toBeGreaterThanOrEqual(
          new Date(dates[i - 1]).getTime()
        );
      }
    });

    it("excludes Achieved items from deadlines", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // g1 is Achieved and should not appear
      expect(result.current.upcomingDeadlines.some((d) => d.id === "g1")).toBe(false);
    });

    it("includes non-achieved proje, proje, gorev deadlines", () => {
      const { result } = renderHook(() => useMyWorkspace());
      const types = result.current.upcomingDeadlines.map((d) => d.type);
      // Should have proje, proje, and gorev types
      expect(types).toContain("gorev");
      expect(types).toContain("proje");
    });
  });

  describe("empty state", () => {
    it("returns zeros when user has no assignments", () => {
      useUIStore.setState({ mockUserName: "Nobody Special", mockUserRole: "Kullanıcı" });
      const { result } = renderHook(() => useMyWorkspace());
      expect(result.current.myProjeler).toHaveLength(0);
      expect(result.current.myGorevler).toHaveLength(0);
      expect(result.current.totalGorevler).toBe(0);
      expect(result.current.overallProgress).toBe(0);
      expect(result.current.gorevProgress).toBe(0);
      expect(result.current.upcomingDeadlines).toHaveLength(0);
    });
  });
});
