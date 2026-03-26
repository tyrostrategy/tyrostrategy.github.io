import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions } from "@/hooks/usePermissions";
import { useRoleStore, DEFAULT_PERMISSIONS } from "@/stores/roleStore";
import { useDataStore } from "@/stores/dataStore";
import { useUIStore } from "@/stores/uiStore";
import type { Proje, Proje, Gorev, RolePermissions } from "@/types";

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
  getInitialProjeler: () => [],
  getInitialGorevler: () => [],
}));

function setCurrentUser(name: string, role: string) {
  useUIStore.setState({ mockUserName: name, mockUserRole: role });
}

// === Test Data ===
const hedef1: Proje = {
  id: "h1", name: "Proje 1", source: "Kurumsal", status: "On Track",
  owner: "Leader User", leader: "Leader User", startDate: "2024-01-01", endDate: "2024-12-31",
};

const hedef2: Proje = {
  id: "h2", name: "Proje 2", source: "Türkiye", status: "On Track",
  owner: "Admin User", leader: "Admin User", startDate: "2024-01-01", endDate: "2024-12-31",
};

const proje1: Proje = {
  id: "p1", projeId: "h1", name: "Proje 1", department: "IT",
  projectLeader: "Leader User", participants: ["Leader User", "Normal User"],
  startDate: "2024-01-01", endDate: "2024-06-30", status: "On Track", progress: 50,
};

const proje2: Proje = {
  id: "p2", projeId: "h2", name: "Proje 2", department: "IT",
  projectLeader: "Admin User", participants: ["Admin User"],
  startDate: "2024-01-01", endDate: "2024-06-30", status: "On Track", progress: 30,
};

const gorev1: Gorev = {
  id: "g1", projeId: "p1", name: "Gorev 1", assignee: "Normal User",
  progress: 50, status: "On Track", startDate: "2024-01-01", endDate: "2024-03-31",
};

const gorev2: Gorev = {
  id: "g2", projeId: "p2", name: "Gorev 2", assignee: "Admin User",
  progress: 0, status: "Not Started", startDate: "2024-01-01", endDate: "2024-03-31",
};

const gorev3: Gorev = {
  id: "g3", projeId: "p1", name: "Gorev 3", assignee: "Leader User",
  progress: 100, status: "Achieved", startDate: "2024-01-01", endDate: "2024-02-28",
};

beforeEach(() => {
  useRoleStore.setState({ permissions: { ...DEFAULT_PERMISSIONS } });
  useDataStore.setState({
    projeler: [hedef1, hedef2],
    projeler: [proje1, proje2],
    gorevler: [gorev1, gorev2, gorev3],
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
      expect(result.current.canEditProje("h1")).toBe(true);
      expect(result.current.canEditProje("h2")).toBe(true);
    });

    it("can delete proje without children", () => {
      useDataStore.setState({ projeler: [], gorevler: [] });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("h1")).toBe(true);
    });

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
      useDataStore.setState({ gorevler: [] });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("p1")).toBe(true);
    });

    it("can create gorev", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateGorev).toBe(true);
    });

    it("can edit any gorev", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditGorev("g1")).toBe(true);
      expect(result.current.canEditGorev("g3")).toBe(true);
    });

    it("can delete any gorev", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteGorev("g1")).toBe(true);
    });

    it("sees all projeler unfiltered", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.filterProjeler([hedef1, hedef2])).toHaveLength(2);
    });

    it("sees all projeler unfiltered", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.filterProjeler([proje1, proje2])).toHaveLength(2);
    });

    it("sees all gorevler unfiltered", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.filterGorevler([gorev1, gorev2, gorev3])).toHaveLength(3);
    });
  });

  describe("Proje Lideri restricted access", () => {
    beforeEach(() => setCurrentUser("Leader User", "Proje Lideri"));

    it("cannot create proje", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateProje).toBe(false);
    });

    it("cannot create proje", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateProje).toBe(false);
    });

    it("can edit own proje (p1, leader)", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditProje("p1")).toBe(true);
    });

    it("cannot edit other's proje (p2, admin's)", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditProje("p2")).toBe(false);
    });

    it("can create gorev", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateGorev).toBe(true);
    });

    it("can edit gorevler in own projects", () => {
      const { result } = renderHook(() => usePermissions());
      // g1 and g3 are in p1 (Leader's project)
      expect(result.current.canEditGorev("g1")).toBe(true);
      expect(result.current.canEditGorev("g3")).toBe(true);
    });

    it("cannot edit gorev in other's project", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditGorev("g2")).toBe(false);
    });

    it("cannot delete proje, even without children", () => {
      useDataStore.setState({ projeler: [] });
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("h1")).toBe(false);
    });

    it("cannot delete proje", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("p1")).toBe(false);
    });

    it("cannot delete gorev", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteGorev("g1")).toBe(false);
    });

    it("only sees projeler they lead/own or linked via projects", () => {
      const { result } = renderHook(() => usePermissions());
      const filtered = result.current.filterProjeler([hedef1, hedef2]);
      expect(filtered.some((h) => h.id === "h1")).toBe(true);
      expect(filtered.some((h) => h.id === "h2")).toBe(false);
    });

    it("only sees own projects", () => {
      const { result } = renderHook(() => usePermissions());
      const filtered = result.current.filterProjeler([proje1, proje2]);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("p1");
    });
  });

  describe("Kullanıcı restricted access", () => {
    beforeEach(() => setCurrentUser("Normal User", "Kullanıcı"));

    it("cannot create proje", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateProje).toBe(false);
    });

    it("cannot create proje", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateProje).toBe(false);
    });

    it("can create gorev", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateGorev).toBe(true);
    });

    it("can edit own gorev (g1, assigned)", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditGorev("g1")).toBe(true);
    });

    it("cannot edit proje", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditProje("h1")).toBe(false);
    });

    it("cannot edit proje", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditProje("p1")).toBe(false);
    });

    it("cannot delete gorev", () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteGorev("g1")).toBe(false);
    });

    it("only sees gorevler assigned to them", () => {
      const { result } = renderHook(() => usePermissions());
      const filtered = result.current.filterGorevler([gorev1, gorev2, gorev3]);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("g1");
    });

    it("sees projeler linked through assigned gorevler", () => {
      const { result } = renderHook(() => usePermissions());
      const filtered = result.current.filterProjeler([hedef1, hedef2]);
      // Normal User assigned to g1 -> p1 -> h1
      expect(filtered.some((h) => h.id === "h1")).toBe(true);
      expect(filtered.some((h) => h.id === "h2")).toBe(false);
    });

    it("sees projeler where they are participant", () => {
      const { result } = renderHook(() => usePermissions());
      const filtered = result.current.filterProjeler([proje1, proje2]);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("p1");
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
    it("cannot delete proje with child projeler", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("h1")).toBe(false);
      expect(result.current.getProjeDeleteReason("h1")).toContain("proje");
    });

    it("cannot delete proje with child gorevler", () => {
      setCurrentUser("Admin User", "Admin");
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("p1")).toBe(false);
      expect(result.current.getProjeDeleteReason("p1")).toContain("görev");
    });

    it("can delete proje after removing all child projeler", () => {
      setCurrentUser("Admin User", "Admin");

      // h1 has p1 under it. Remove p1 (and its gorevler first)
      useDataStore.setState({
        gorevler: [gorev2], // only g2 remains (under p2)
        projeler: [proje2], // only p2 remains (under h2)
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("h1")).toBe(true);
      expect(result.current.getProjeDeleteReason("h1")).toBeNull();
    });

    it("can delete proje after removing all child gorevler", () => {
      setCurrentUser("Admin User", "Admin");

      // p1 has g1 and g3. Remove them
      useDataStore.setState({
        gorevler: [gorev2], // only g2 remains (under p2)
      });

      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("p1")).toBe(true);
      expect(result.current.getProjeDeleteReason("p1")).toBeNull();
    });

    it("full cascade scenario: delete children first then parent", () => {
      setCurrentUser("Admin User", "Admin");

      // Step 1: Cannot delete h1 (has p1 with gorevler)
      let { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteProje("h1")).toBe(false);

      // Step 2: Remove gorevler from p1
      useDataStore.setState({ gorevler: [gorev2] });
      ({ result } = renderHook(() => usePermissions()));
      expect(result.current.canDeleteProje("p1")).toBe(true);

      // Step 3: Remove p1
      useDataStore.setState({ projeler: [proje2] });
      ({ result } = renderHook(() => usePermissions()));
      expect(result.current.canDeleteProje("h1")).toBe(true);
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
      expect(result.current.canAccessPage("projeler")).toBe(true);
      expect(result.current.canAccessPage("gorevler")).toBe(true);
      expect(result.current.canAccessPage("gantt")).toBe(true);
      expect(result.current.canAccessPage("wbs")).toBe(true);
    });

    it("Proje Lideri can access data pages but not admin pages", () => {
      setCurrentUser("Leader User", "Proje Lideri");
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canAccessPage("projeler")).toBe(true);
      expect(result.current.canAccessPage("projeler")).toBe(true);
      expect(result.current.canAccessPage("gorevler")).toBe(true);
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
      expect(result.current.canAccessPage("projeler")).toBe(true);
      expect(result.current.canAccessPage("gorevler")).toBe(true);
      expect(result.current.canAccessKPI).toBe(false);
      expect(result.current.canAccessKullanicilar).toBe(false);
      expect(result.current.canAccessAyarlar).toBe(false);
    });
  });
});
