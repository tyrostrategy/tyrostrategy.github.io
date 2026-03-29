import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMyWorkspace } from "../useMyWorkspace";
import { useDataStore } from "@/stores/dataStore";
import { useUIStore } from "@/stores/uiStore";
import type { Proje, Aksiyon } from "@/types";

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
  getInitialAksiyonlar: () => [],
  getInitialData: () => ({ projeler: [], aksiyonlar: [] }),
  getInitialTagDefinitions: () => [],
}));

const proje1: Proje = {
  id: "p1",
  name: "Proje 1",
  source: "Kurumsal",
  status: "On Track",
  owner: "Cenk Şayli",
  participants: ["Cenk Şayli", "Emre Padar"],
  department: "IT",
  progress: 60,
  startDate: "2024-01-01",
  endDate: "2024-06-30",
};

const proje2: Proje = {
  id: "p2",
  name: "Proje 2",
  source: "Türkiye",
  status: "Behind",
  owner: "Kemal Yıldız",
  participants: ["Kemal Yıldız", "Cenk Şayli"],
  department: "IT",
  progress: 20,
  startDate: "2024-03-01",
  endDate: "2024-09-30",
};

const proje3: Proje = {
  id: "p3",
  name: "Proje 3",
  source: "International",
  status: "On Track",
  owner: "Kemal Yıldız",
  participants: ["Kemal Yıldız"],
  department: "Finans",
  progress: 40,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
};

const aksiyon1: Aksiyon = {
  id: "a1",
  projeId: "p1",
  name: "Aksiyon 1",
  owner: "Cenk Şayli",
  progress: 100,
  status: "Achieved",
  startDate: "2024-01-01",
  endDate: "2024-03-31",
};

const aksiyon2: Aksiyon = {
  id: "a2",
  projeId: "p1",
  name: "Aksiyon 2",
  owner: "Emre Padar",
  progress: 50,
  status: "On Track",
  startDate: "2024-02-01",
  endDate: "2024-05-31",
};

const aksiyon3: Aksiyon = {
  id: "a3",
  projeId: "p2",
  name: "Aksiyon 3",
  owner: "Cenk Şayli",
  progress: 0,
  status: "Behind",
  startDate: "2024-03-01",
  endDate: "2024-04-30",
};

const aksiyon4: Aksiyon = {
  id: "a4",
  projeId: "p3",
  name: "Aksiyon 4",
  owner: "Kemal Yıldız",
  progress: 30,
  status: "At Risk",
  startDate: "2024-03-01",
  endDate: "2024-07-31",
};

beforeEach(() => {
  useUIStore.setState({ mockUserName: "Cenk Şayli", mockUserRole: "Admin" });
  useDataStore.setState({
    projeler: [proje1, proje2, proje3],
    aksiyonlar: [aksiyon1, aksiyon2, aksiyon3, aksiyon4],
  });
});

describe("useMyWorkspace", () => {
  it("returns correct userName and department", () => {
    const { result } = renderHook(() => useMyWorkspace());
    expect(result.current.userName).toBe("Cenk Şayli");
    expect(result.current.department).toBe("IT");
  });

  describe("myProjeler", () => {
    it("includes projects where user is owner", () => {
      const { result } = renderHook(() => useMyWorkspace());
      expect(result.current.myProjeler.some((p) => p.id === "p1")).toBe(true);
    });

    it("includes projects where user is participant", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // Cenk is a participant in p2
      expect(result.current.myProjeler.some((p) => p.id === "p2")).toBe(true);
    });

    it("excludes projects where user is neither owner nor participant", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // p3 has no connection to Cenk
      expect(result.current.myProjeler.some((p) => p.id === "p3")).toBe(false);
    });
  });

  describe("myAksiyonlar", () => {
    it("includes aksiyonlar owned by user", () => {
      const { result } = renderHook(() => useMyWorkspace());
      expect(result.current.myAksiyonlar.some((a) => a.id === "a1")).toBe(true);
      expect(result.current.myAksiyonlar.some((a) => a.id === "a3")).toBe(true);
    });

    it("includes aksiyonlar in user's projects (even if owned by someone else)", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // a2 is in p1 (Cenk's project) even though owned by Emre
      expect(result.current.myAksiyonlar.some((a) => a.id === "a2")).toBe(true);
    });

    it("excludes aksiyonlar in other projects not owned by user", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // a4 is in p3, which Cenk is not part of, and is owned by Kemal
      expect(result.current.myAksiyonlar.some((a) => a.id === "a4")).toBe(false);
    });
  });

  describe("statistics", () => {
    it("calculates totalProjeler correctly", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // p1 and p2 (not p3)
      expect(result.current.totalProjeler).toBe(2);
    });

    it("calculates achievedAksiyonlar correctly", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // a1 is Achieved
      expect(result.current.achievedAksiyonlar).toBe(1);
    });

    it("calculates behindAksiyonlar correctly", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // a3 is Behind
      expect(result.current.behindAksiyonlar).toBe(1);
    });

    it("calculates totalAksiyonlar correctly", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // a1, a2, a3 (not a4)
      expect(result.current.totalAksiyonlar).toBe(3);
    });

    it("calculates overallProgress as average of proje progress", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // (60 + 20) / 2 = 40
      expect(result.current.overallProgress).toBe(40);
    });

    it("calculates aksiyonProgress as percentage of achieved", () => {
      const { result } = renderHook(() => useMyWorkspace());
      // 1/3 achieved = 33%
      expect(result.current.aksiyonProgress).toBe(33);
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
      // a1 is Achieved and should not appear
      expect(result.current.upcomingDeadlines.some((d) => d.id === "a1")).toBe(false);
    });

    it("includes non-achieved proje and aksiyon deadlines", () => {
      const { result } = renderHook(() => useMyWorkspace());
      const types = result.current.upcomingDeadlines.map((d) => d.type);
      // Should have aksiyon and proje types
      expect(types).toContain("aksiyon");
      expect(types).toContain("proje");
    });
  });

  describe("empty state", () => {
    it("returns zeros when user has no assignments", () => {
      useUIStore.setState({ mockUserName: "Nobody Special", mockUserRole: "Kullanıcı" });
      const { result } = renderHook(() => useMyWorkspace());
      expect(result.current.myProjeler).toHaveLength(0);
      expect(result.current.myAksiyonlar).toHaveLength(0);
      expect(result.current.totalAksiyonlar).toBe(0);
      expect(result.current.overallProgress).toBe(0);
      expect(result.current.aksiyonProgress).toBe(0);
      expect(result.current.upcomingDeadlines).toHaveLength(0);
    });
  });
});
