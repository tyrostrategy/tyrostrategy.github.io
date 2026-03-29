import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions } from "../usePermissions";
import { useRoleStore, DEFAULT_PERMISSIONS } from "@/stores/roleStore";
import { useDataStore } from "@/stores/dataStore";
import { useUIStore } from "@/stores/uiStore";
import type { Proje, Aksiyon } from "@/types";

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
  getInitialAksiyonlar: () => [],
  getInitialData: () => ({ projeler: [], aksiyonlar: [] }),
  getInitialTagDefinitions: () => [],
}));

// Helper to set up the current user
function setCurrentUser(name: string, role: string) {
  useUIStore.setState({ mockUserName: name, mockUserRole: role });
}

// Sample test data
const proje1: Proje = {
  id: "p1",
  name: "Proje 1",
  source: "Kurumsal",
  status: "On Track",
  owner: "Leader User",
  participants: ["Leader User", "Normal User"],
  department: "IT",
  progress: 50,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
};

const proje2: Proje = {
  id: "p2",
  name: "Proje 2",
  source: "Türkiye",
  status: "On Track",
  owner: "Admin User",
  participants: ["Admin User"],
  department: "IT",
  progress: 30,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
};

const aksiyon1: Aksiyon = {
  id: "a1",
  projeId: "p1",
  name: "Aksiyon 1",
  owner: "Normal User",
  progress: 50,
  status: "On Track",
  startDate: "2024-01-01",
  endDate: "2024-03-31",
};

const aksiyon2: Aksiyon = {
  id: "a2",
  projeId: "p2",
  name: "Aksiyon 2",
  owner: "Admin User",
  progress: 0,
  status: "Not Started",
  startDate: "2024-01-01",
  endDate: "2024-03-31",
};

const aksiyon3: Aksiyon = {
  id: "a3",
  projeId: "p1",
  name: "Aksiyon 3",
  owner: "Leader User",
  progress: 100,
  status: "Achieved",
  startDate: "2024-01-01",
  endDate: "2024-02-28",
};

beforeEach(() => {
  useRoleStore.setState({ permissions: { ...DEFAULT_PERMISSIONS } });
  useDataStore.setState({
    projeler: [proje1, proje2],
    aksiyonlar: [aksiyon1, aksiyon2, aksiyon3],
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
      expect(result.current.canAccessPage("aksiyonlar")).toBe(true);
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
    it("returns false when proje has child aksiyonlar", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());

      // p1 has aksiyon1 and aksiyon3 under it
      expect(result.current.canDeleteProje("p1")).toBe(false);
    });

    it("returns true when proje has no child aksiyonlar", () => {
      setCurrentUser("Admin User", "Admin");
      useDataStore.setState({ aksiyonlar: [] });
      const { result } = renderHook(() => usePermissions());

      expect(result.current.canDeleteProje("p1")).toBe(true);
    });

    it("Proje Lideri cannot delete proje regardless of cascade", () => {
      setCurrentUser("Leader User", "Proje Lideri");
      useDataStore.setState({ aksiyonlar: [] });
      const { result } = renderHook(() => usePermissions());

      expect(result.current.canDeleteProje("p1")).toBe(false);
    });
  });

  describe("filterProjeler", () => {
    it("Admin gets all projeler", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterProjeler([proje1, proje2]);
      expect(filtered).toHaveLength(2);
    });

    it("Proje Lideri gets only projeler they own or participate in", () => {
      setCurrentUser("Leader User", "Proje Lideri");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterProjeler([proje1, proje2]);
      // Leader User owns p1 and is participant
      expect(filtered.some((p) => p.id === "p1")).toBe(true);
      // p2 belongs to Admin User, Leader User has no connection
      expect(filtered.some((p) => p.id === "p2")).toBe(false);
    });

    it("Kullanıcı gets projeler linked through owned aksiyonlar", () => {
      setCurrentUser("Normal User", "Kullanıcı");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterProjeler([proje1, proje2]);
      // Normal User owns aksiyon1 which is in proje1
      expect(filtered.some((p) => p.id === "p1")).toBe(true);
      expect(filtered.some((p) => p.id === "p2")).toBe(false);
    });
  });

  describe("filterAksiyonlar", () => {
    it("Admin gets all aksiyonlar", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterAksiyonlar([aksiyon1, aksiyon2, aksiyon3]);
      expect(filtered).toHaveLength(3);
    });

    it("Kullanıcı only sees owned aksiyonlar", () => {
      setCurrentUser("Normal User", "Kullanıcı");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterAksiyonlar([aksiyon1, aksiyon2, aksiyon3]);
      // Normal User owns aksiyon1 only
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("a1");
    });

    it("Proje Lideri sees aksiyonlar from their projeler", () => {
      setCurrentUser("Leader User", "Proje Lideri");
      const { result } = renderHook(() => usePermissions());

      const filtered = result.current.filterAksiyonlar([aksiyon1, aksiyon2, aksiyon3]);
      // Leader User's proje is p1, aksiyon1 and aksiyon3 are in p1
      expect(filtered.some((a) => a.id === "a1")).toBe(true);
      expect(filtered.some((a) => a.id === "a3")).toBe(true);
      expect(filtered.some((a) => a.id === "a2")).toBe(false);
    });
  });
});
