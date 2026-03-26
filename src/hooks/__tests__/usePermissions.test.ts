import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions } from "../usePermissions";
import { useRoleStore, DEFAULT_PERMISSIONS } from "@/stores/roleStore";
import { useDataStore } from "@/stores/dataStore";
import { useUIStore } from "@/stores/uiStore";
import type { Proje, Proje, Gorev } from "@/types";

// Mock useCurrentUser by controlling uiStore + mock departments
vi.mock("@/config/departments", () => ({
  departments: [
    {
      name: "IT",
      users: [
        { name: "Admin User", email: "admin@test.com" },
        { name: "Leader User", email: "leader@test.com" },
        { name: "Normal User", email: "normal@test.com" },
      ],
    },
  ],
  getDepartmentByUser: () => ({ name: "IT" }),
}));

// Mock i18n to avoid side effects
vi.mock("@/lib/i18n", () => ({
  default: {
    language: "tr",
    use: () => ({ init: () => {} }),
    changeLanguage: () => {},
  },
}));

// Mock the mock-adapter to return empty arrays
vi.mock("@/lib/data/mock-adapter", () => ({
  getInitialProjeler: () => [],
  getInitialProjeler: () => [],
  getInitialGorevler: () => [],
}));

// Helper to set up the current user
function setCurrentUser(name: string, role: string) {
  useUIStore.setState({ mockUserName: name, mockUserRole: role });
}

// Sample test data
const hedef1: Proje = {
  id: "h1",
  name: "Proje 1",
  source: "Kurumsal",
  status: "On Track",
  owner: "Leader User",
  leader: "Leader User",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
};

const hedef2: Proje = {
  id: "h2",
  name: "Proje 2",
  source: "Türkiye",
  status: "On Track",
  owner: "Admin User",
  leader: "Admin User",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
};

const proje1: Proje = {
  id: "p1",
  projeId: "h1",
  name: "Proje 1",
  department: "IT",
  projectLeader: "Leader User",
  participants: ["Leader User", "Normal User"],
  startDate: "2024-01-01",
  endDate: "2024-06-30",
  status: "On Track",
  progress: 50,
};

const proje2: Proje = {
  id: "p2",
  projeId: "h2",
  name: "Proje 2",
  department: "IT",
  projectLeader: "Admin User",
  participants: ["Admin User"],
  startDate: "2024-01-01",
  endDate: "2024-06-30",
  status: "On Track",
  progress: 30,
};

const gorev1: Gorev = {
  id: "g1",
  projeId: "p1",
  name: "Gorev 1",
  assignee: "Normal User",
  progress: 50,
  status: "On Track",
  startDate: "2024-01-01",
  endDate: "2024-03-31",
};

const gorev2: Gorev = {
  id: "g2",
  projeId: "p2",
  name: "Gorev 2",
  assignee: "Admin User",
  progress: 0,
  status: "Not Started",
  startDate: "2024-01-01",
  endDate: "2024-03-31",
};

const gorev3: Gorev = {
  id: "g3",
  projeId: "p1",
  name: "Gorev 3",
  assignee: "Leader User",
  progress: 100,
  status: "Achieved",
  startDate: "2024-01-01",
  endDate: "2024-02-28",
};

beforeEach(() => {
  useRoleStore.setState({ permissions: { ...DEFAULT_PERMISSIONS } });
  useDataStore.setState({
    projeler: [hedef1, hedef2],
    projeler: [proje1, proje2],
    gorevler: [gorev1, gorev2, gorev3],
  });
});

describe("usePermissions", () => {
  describe("page access", () => {
    it("Admin can access all pages", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccessKPI).toBe(true);
      expect(result.current.canAccessKullanicilar).toBe(true);
      expect(result.current.canAccessAyarlar).toBe(true);
      expect(result.current.canAccessGuvenlik).toBe(true);
      expect(result.current.canAccessPage("projeler")).toBe(true);
      expect(result.current.canAccessPage("projeler")).toBe(true);
      expect(result.current.canAccessPage("gorevler")).toBe(true);
      expect(result.current.canAccessPage("gantt")).toBe(true);
      expect(result.current.canAccessPage("wbs")).toBe(true);
    });

    it("Proje Lideri cannot access KPI, Kullanıcılar, Ayarlar, Güvenlik", () => {
      setCurrentUser("Leader User", "Proje Lideri");
      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccessKPI).toBe(false);
      expect(result.current.canAccessKullanicilar).toBe(false);
      expect(result.current.canAccessAyarlar).toBe(false);
      expect(result.current.canAccessGuvenlik).toBe(false);
    });

    it("Kullanıcı cannot access KPI, Kullanıcılar, Ayarlar, Güvenlik", () => {
      setCurrentUser("Normal User", "Kullanıcı");
      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccessKPI).toBe(false);
      expect(result.current.canAccessKullanicilar).toBe(false);
      expect(result.current.canAccessAyarlar).toBe(false);
      expect(result.current.canAccessGuvenlik).toBe(false);
    });
  });

  describe("canCreateProje", () => {
    it("Admin can create proje", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateProje).toBe(true);
    });

    it("Proje Lideri cannot create proje", () => {
      setCurrentUser("Leader User", "Proje Lideri");
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateProje).toBe(false);
    });

    it("Kullanıcı cannot create proje", () => {
      setCurrentUser("Normal User", "Kullanıcı");
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateProje).toBe(false);
    });
  });

  describe("canDeleteProje with cascade", () => {
    it("returns false when proje has child projeler", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());

      // h1 has proje1 under it
      expect(result.current.canDeleteProje("h1")).toBe(false);
    });

    it("returns true when proje has no child projeler", () => {
      setCurrentUser("Admin User", "Admin");
      // Remove all projeler
      useDataStore.setState({ projeler: [] });
      const { result } = renderHook(() => usePermissions());

      expect(result.current.canDeleteProje("h1")).toBe(true);
    });

    it("Proje Lideri cannot delete proje regardless of cascade", () => {
      setCurrentUser("Leader User", "Proje Lideri");
      useDataStore.setState({ projeler: [] });
      const { result } = renderHook(() => usePermissions());

      // Permission is false for Proje Lideri
      expect(result.current.canDeleteProje("h1")).toBe(false);
    });
  });

  describe("canDeleteProje with cascade", () => {
    it("returns false when proje has child gorevler", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());

      // p1 has gorev1 and gorev3 under it
      expect(result.current.canDeleteProje("p1")).toBe(false);
    });

    it("returns true when proje has no child gorevler", () => {
      setCurrentUser("Admin User", "Admin");
      useDataStore.setState({ gorevler: [] });
      const { result } = renderHook(() => usePermissions());

      expect(result.current.canDeleteProje("p1")).toBe(true);
    });
  });

  describe("filterProjeler", () => {
    it("Admin gets all projeler", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterProjeler([hedef1, hedef2]);
      expect(filtered).toHaveLength(2);
    });

    it("Proje Lideri gets only projeler they own/lead or linked via projeler", () => {
      setCurrentUser("Leader User", "Proje Lideri");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterProjeler([hedef1, hedef2]);
      // Leader User owns/leads h1 and is leader of proje1 which is under h1
      expect(filtered.some((h) => h.id === "h1")).toBe(true);
      // h2 belongs to Admin User, Leader User has no connection
      expect(filtered.some((h) => h.id === "h2")).toBe(false);
    });

    it("Kullanıcı gets projeler linked through assigned gorevler", () => {
      setCurrentUser("Normal User", "Kullanıcı");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterProjeler([hedef1, hedef2]);
      // Normal User is assignee of gorev1 which is in proje1 which is under hedef1
      expect(filtered.some((h) => h.id === "h1")).toBe(true);
      expect(filtered.some((h) => h.id === "h2")).toBe(false);
    });
  });

  describe("filterProjeler", () => {
    it("Admin gets all projeler", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterProjeler([proje1, proje2]);
      expect(filtered).toHaveLength(2);
    });

    it("non-admin gets filtered by ownership/participation", () => {
      setCurrentUser("Leader User", "Proje Lideri");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterProjeler([proje1, proje2]);
      // Leader User is projectLeader of proje1
      expect(filtered.some((p) => p.id === "p1")).toBe(true);
      // proje2 belongs to Admin User
      expect(filtered.some((p) => p.id === "p2")).toBe(false);
    });
  });

  describe("filterGorevler", () => {
    it("Admin gets all gorevler", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterGorevler([gorev1, gorev2, gorev3]);
      expect(filtered).toHaveLength(3);
    });

    it("Kullanıcı only sees assigned tasks", () => {
      setCurrentUser("Normal User", "Kullanıcı");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterGorevler([gorev1, gorev2, gorev3]);
      // Normal User is assigned to gorev1 only
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("g1");
    });

    it("Proje Lideri sees gorevler from their projeler", () => {
      setCurrentUser("Leader User", "Proje Lideri");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterGorevler([gorev1, gorev2, gorev3]);
      // Leader User's proje is p1, gorev1 and gorev3 are in p1
      // Also gorev3 has assignee "Leader User"
      expect(filtered.some((g) => g.id === "g1")).toBe(true);
      expect(filtered.some((g) => g.id === "g3")).toBe(true);
      expect(filtered.some((g) => g.id === "g2")).toBe(false);
    });
  });
});
