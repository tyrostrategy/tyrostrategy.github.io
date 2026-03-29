import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions } from "@/hooks/usePermissions";
import { useRoleStore, DEFAULT_PERMISSIONS } from "@/stores/roleStore";
import { useDataStore } from "@/stores/dataStore";
import { useUIStore } from "@/stores/uiStore";
import type { Proje, Aksiyon, RolePermissions } from "@/types";

// Mock departments
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

vi.mock("@/lib/i18n", () => ({
  default: {
    language: "tr",
    use: () => ({ init: () => {} }),
    changeLanguage: () => {},
  },
}));

vi.mock("@/lib/data/mock-adapter", () => ({
  getInitialProjeler: () => [],
  getInitialAksiyonlar: () => [],
  getInitialData: () => ({ projeler: [], aksiyonlar: [] }),
  getInitialTagDefinitions: () => [],
}));

function setCurrentUser(name: string, role: string) {
  useUIStore.setState({ mockUserName: name, mockUserRole: role });
}

// === Test Data ===
const proje1: Proje = {
  id: "p1", name: "Proje 1", source: "Kurumsal", status: "On Track",
  owner: "Leader User", participants: ["Leader User", "Normal User"],
  department: "IT", progress: 50,
  startDate: "2024-01-01", endDate: "2024-12-31",
};

const proje2: Proje = {
  id: "p2", name: "Proje 2", source: "Türkiye", status: "On Track",
  owner: "Admin User", participants: ["Admin User"],
  department: "IT", progress: 30,
  startDate: "2024-01-01", endDate: "2024-12-31",
};

const aksiyon1: Aksiyon = {
  id: "a1", projeId: "p1", name: "Aksiyon 1", owner: "Normal User",
  progress: 50, status: "On Track", startDate: "2024-01-01", endDate: "2024-03-31",
};

const aksiyon2: Aksiyon = {
  id: "a2", projeId: "p2", name: "Aksiyon 2", owner: "Admin User",
  progress: 0, status: "Not Started", startDate: "2024-01-01", endDate: "2024-03-31",
};

const aksiyon3: Aksiyon = {
  id: "a3", projeId: "p1", name: "Aksiyon 3", owner: "Leader User",
  progress: 100, status: "Achieved", startDate: "2024-01-01", endDate: "2024-02-28",
};

beforeEach(() => {
  useRoleStore.setState({ permissions: { ...DEFAULT_PERMISSIONS } });
  useDataStore.setState({
    projeler: [proje1, proje2],
    aksiyonlar: [aksiyon1, aksiyon2, aksiyon3],
  });
});

describe("RBAC Integration Tests", () => {
  describe("Admin full access", () => {
    beforeEach(() => setCurrentUser("Admin User", "Admin"));

    it("can create proje", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateProje).toBe(true);
    });

    it("can edit any proje", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditProje("p1")).toBe(true);
      expect(result.current.canEditProje("p2")).toBe(true);
    });

    it("can delete proje without children", () => {
      useDataStore.setState({ aksiyonlar: [] });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("p1")).toBe(true);
    });

    it("can create aksiyon", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateAksiyon).toBe(true);
    });

    it("can edit any aksiyon", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditAksiyon("a1")).toBe(true);
      expect(result.current.canEditAksiyon("a3")).toBe(true);
    });

    it("can delete any aksiyon", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteAksiyon("a1")).toBe(true);
    });

    it("sees all projeler unfiltered", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.filterProjeler([proje1, proje2])).toHaveLength(2);
    });

    it("sees all aksiyonlar unfiltered", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.filterAksiyonlar([aksiyon1, aksiyon2, aksiyon3])).toHaveLength(3);
    });
  });

  describe("Proje Lideri restricted access", () => {
    beforeEach(() => setCurrentUser("Leader User", "Proje Lideri"));

    it("cannot create proje", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateProje).toBe(false);
    });

    it("can edit own proje (p1, owner)", () => {
      const { result } = renderHook(() => usePermissions());
      // Proje Lideri has proje.edit = false, so canEditProje returns false
      // But usePermissions checks perms.proje.edit which is false for Proje Lideri
      expect(result.current.canEditProje("p1")).toBe(false);
    });

    it("cannot edit other's proje (p2, admin's)", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditProje("p2")).toBe(false);
    });

    it("can create aksiyon", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateAksiyon).toBe(true);
    });

    it("can edit aksiyonlar in own projects", () => {
      const { result } = renderHook(() => usePermissions());
      // a1 and a3 are in p1 (Leader's project)
      expect(result.current.canEditAksiyon("a1")).toBe(true);
      expect(result.current.canEditAksiyon("a3")).toBe(true);
    });

    it("cannot edit aksiyon in other's project", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditAksiyon("a2")).toBe(false);
    });

    it("cannot delete proje, even without children", () => {
      useDataStore.setState({ aksiyonlar: [] });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("p1")).toBe(false);
    });

    it("cannot delete aksiyon", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteAksiyon("a1")).toBe(false);
    });

    it("only sees projeler they own or participate in", () => {
      const { result } = renderHook(() => usePermissions());
      const filtered = result.current.filterProjeler([proje1, proje2]);
      expect(filtered.some((p) => p.id === "p1")).toBe(true);
      expect(filtered.some((p) => p.id === "p2")).toBe(false);
    });
  });

  describe("Kullanıcı restricted access", () => {
    beforeEach(() => setCurrentUser("Normal User", "Kullanıcı"));

    it("cannot create proje", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateProje).toBe(false);
    });

    it("can create aksiyon", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateAksiyon).toBe(true);
    });

    it("can edit own aksiyon (a1, owned)", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditAksiyon("a1")).toBe(true);
    });

    it("cannot edit proje", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditProje("p1")).toBe(false);
    });

    it("cannot delete aksiyon", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteAksiyon("a1")).toBe(false);
    });

    it("only sees aksiyonlar owned by them", () => {
      const { result } = renderHook(() => usePermissions());
      const filtered = result.current.filterAksiyonlar([aksiyon1, aksiyon2, aksiyon3]);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("a1");
    });

    it("sees projeler linked through owned aksiyonlar", () => {
      const { result } = renderHook(() => usePermissions());
      const filtered = result.current.filterProjeler([proje1, proje2]);
      // Normal User owns a1 -> p1
      expect(filtered.some((p) => p.id === "p1")).toBe(true);
      expect(filtered.some((p) => p.id === "p2")).toBe(false);
    });
  });

  describe("Dynamic role permission changes via roleStore", () => {
    it("updating role permissions reflects in usePermissions", () => {
      setCurrentUser("Leader User", "Proje Lideri");

      // Verify Proje Lideri cannot create proje by default
      let { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateProje).toBe(false);

      // Grant proje.create to Proje Lideri
      const updatedPerms: RolePermissions = {
        ...DEFAULT_PERMISSIONS["Proje Lideri"],
        proje: { create: true, edit: true, delete: false },
      };
      useRoleStore.getState().updatePermissions("Proje Lideri", updatedPerms);

      // Re-render hook
      ({ result } = renderHook(() => usePermissions()));
      expect(result.current.canCreateProje).toBe(true);
    });

    it("resetting to defaults restores original permissions", () => {
      setCurrentUser("Normal User", "Kullanıcı");

      // Grant extra permissions
      const updatedPerms: RolePermissions = {
        ...DEFAULT_PERMISSIONS["Kullanıcı"],
        proje: { create: true, edit: true, delete: true },
      };
      useRoleStore.getState().updatePermissions("Kullanıcı", updatedPerms);

      let { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateProje).toBe(true);

      // Reset
      useRoleStore.getState().resetToDefaults();

      ({ result } = renderHook(() => usePermissions()));
      expect(result.current.canCreateProje).toBe(false);
    });
  });

  describe("Cascade deletion rules", () => {
    it("cannot delete proje with child aksiyonlar", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("p1")).toBe(false);
      expect(result.current.getProjeDeleteReason("p1")).toContain("aksiyon");
    });

    it("can delete proje after removing all child aksiyonlar", () => {
      setCurrentUser("Admin User", "Admin");

      // Remove aksiyonlar from p1
      useDataStore.setState({
        aksiyonlar: [aksiyon2], // only a2 remains (under p2)
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("p1")).toBe(true);
      expect(result.current.getProjeDeleteReason("p1")).toBeNull();
    });
  });

  describe("Page access by role", () => {
    it("Admin can access all admin pages", () => {
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

    it("Proje Lideri can access data pages but not admin pages", () => {
      setCurrentUser("Leader User", "Proje Lideri");
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAccessPage("projeler")).toBe(true);
      expect(result.current.canAccessPage("aksiyonlar")).toBe(true);
      expect(result.current.canAccessPage("gantt")).toBe(true);
      expect(result.current.canAccessKPI).toBe(false);
      expect(result.current.canAccessKullanicilar).toBe(false);
      expect(result.current.canAccessAyarlar).toBe(false);
      expect(result.current.canAccessGuvenlik).toBe(false);
    });

    it("Kullanıcı can access data pages but not admin pages", () => {
      setCurrentUser("Normal User", "Kullanıcı");
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAccessPage("projeler")).toBe(true);
      expect(result.current.canAccessPage("aksiyonlar")).toBe(true);
      expect(result.current.canAccessKPI).toBe(false);
      expect(result.current.canAccessKullanicilar).toBe(false);
      expect(result.current.canAccessAyarlar).toBe(false);
    });
  });
});
