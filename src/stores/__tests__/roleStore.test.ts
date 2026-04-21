import { describe, it, expect, beforeEach, vi } from "vitest";
import { useRoleStore, DEFAULT_PERMISSIONS } from "../roleStore";
import type { RolePermissions } from "@/types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
  // Reset to defaults
  useRoleStore.setState({ permissions: { ...DEFAULT_PERMISSIONS } });
});

describe("roleStore", () => {
  describe("default permissions", () => {
    it("Admin has full page access", () => {
      const perms = useRoleStore.getState().getPermissions("Admin");
      expect(perms.pages.kpi).toBe(true);
      expect(perms.pages.projeler).toBe(true);
      expect(perms.pages.aksiyonlar).toBe(true);
      expect(perms.pages.gantt).toBe(true);
      expect(perms.pages.kullanicilar).toBe(true);
      expect(perms.pages.ayarlar).toBe(true);
      expect(perms.pages.guvenlik).toBe(true);
    });

    it("Admin has full CRUD on proje and aksiyon", () => {
      const perms = useRoleStore.getState().getPermissions("Admin");
      expect(perms.proje).toEqual({ create: true, edit: true, delete: true });
      expect(perms.aksiyon).toEqual({ create: true, edit: true, delete: true });
    });

    it("Admin has editOnlyOwn=false and viewOnlyOwn=false", () => {
      const perms = useRoleStore.getState().getPermissions("Admin");
      expect(perms.editOnlyOwn).toBe(false);
      expect(perms.viewOnlyOwn).toBe(false);
    });

    it("Proje Lideri cannot access KPI, Kullanıcılar, Ayarlar, Güvenlik", () => {
      const perms = useRoleStore.getState().getPermissions("Proje Lideri");
      expect(perms.pages.kpi).toBe(false);
      expect(perms.pages.kullanicilar).toBe(false);
      expect(perms.pages.ayarlar).toBe(false);
      expect(perms.pages.guvenlik).toBe(false);
    });

    it("Proje Lideri can access projeler, aksiyonlar, gantt", () => {
      const perms = useRoleStore.getState().getPermissions("Proje Lideri");
      expect(perms.pages.projeler).toBe(true);
      expect(perms.pages.aksiyonlar).toBe(true);
      expect(perms.pages.gantt).toBe(true);
    });

    it("Proje Lideri has restricted CRUD permissions", () => {
      const perms = useRoleStore.getState().getPermissions("Proje Lideri");
      expect(perms.proje).toEqual({ create: false, edit: false, delete: false });
      expect(perms.aksiyon).toEqual({ create: true, edit: true, delete: false });
      expect(perms.editOnlyOwn).toBe(true);
      expect(perms.viewOnlyOwn).toBe(true);
    });

    it("Kullanıcı cannot access KPI, Kullanıcılar, Ayarlar, Güvenlik", () => {
      const perms = useRoleStore.getState().getPermissions("Kullanıcı");
      expect(perms.pages.kpi).toBe(false);
      expect(perms.pages.kullanicilar).toBe(false);
      expect(perms.pages.ayarlar).toBe(false);
      expect(perms.pages.guvenlik).toBe(false);
    });

    it("Kullanıcı has minimal CRUD (only aksiyon create/edit)", () => {
      const perms = useRoleStore.getState().getPermissions("Kullanıcı");
      expect(perms.proje).toEqual({ create: false, edit: false, delete: false });
      expect(perms.aksiyon).toEqual({ create: true, edit: true, delete: false });
      expect(perms.editOnlyOwn).toBe(true);
      expect(perms.viewOnlyOwn).toBe(true);
    });
  });

  describe("getPermissions", () => {
    it("returns correct permissions for each role", () => {
      const admin = useRoleStore.getState().getPermissions("Admin");
      const lideri = useRoleStore.getState().getPermissions("Proje Lideri");
      const kullanici = useRoleStore.getState().getPermissions("Kullanıcı");

      expect(admin).toEqual(DEFAULT_PERMISSIONS["Admin"]);
      expect(lideri).toEqual(DEFAULT_PERMISSIONS["Proje Lideri"]);
      expect(kullanici).toEqual(DEFAULT_PERMISSIONS["Kullanıcı"]);
    });
  });

  describe("updatePermissions", () => {
    it("persists updated permissions in store state", () => {
      const customPerms: RolePermissions = {
        ...DEFAULT_PERMISSIONS["Kullanıcı"],
        pages: {
          ...DEFAULT_PERMISSIONS["Kullanıcı"].pages,
          kpi: true, // grant KPI access
        },
      };

      useRoleStore.getState().updatePermissions("Kullanıcı", customPerms);

      const updated = useRoleStore.getState().getPermissions("Kullanıcı");
      expect(updated.pages.kpi).toBe(true);
    });

    it("persists changes to localStorage", () => {
      const customPerms: RolePermissions = {
        ...DEFAULT_PERMISSIONS["Admin"],
        proje: { create: true, edit: true, delete: false },
      };

      useRoleStore.getState().updatePermissions("Admin", customPerms);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "tyro-role-permissions-v2",
        expect.any(String)
      );

      const stored = JSON.parse(
        localStorageMock.setItem.mock.calls[0][1]
      );
      expect(stored.Admin.proje.delete).toBe(false);
    });

    it("does not affect other roles when updating one role", () => {
      const customPerms: RolePermissions = {
        ...DEFAULT_PERMISSIONS["Kullanıcı"],
        aksiyon: { create: false, edit: false, delete: false },
      };

      useRoleStore.getState().updatePermissions("Kullanıcı", customPerms);

      // Admin should remain unchanged
      const admin = useRoleStore.getState().getPermissions("Admin");
      expect(admin).toEqual(DEFAULT_PERMISSIONS["Admin"]);
    });
  });

  describe("resetToDefaults", () => {
    it("restores original permissions after modification", () => {
      const customPerms: RolePermissions = {
        ...DEFAULT_PERMISSIONS["Admin"],
        pages: { ...DEFAULT_PERMISSIONS["Admin"].pages, kpi: false },
      };
      useRoleStore.getState().updatePermissions("Admin", customPerms);

      // Verify it was changed
      expect(useRoleStore.getState().getPermissions("Admin").pages.kpi).toBe(false);

      // Reset
      useRoleStore.getState().resetToDefaults();

      // Verify restored
      expect(useRoleStore.getState().getPermissions("Admin").pages.kpi).toBe(true);
      expect(useRoleStore.getState().getPermissions("Admin")).toEqual(
        DEFAULT_PERMISSIONS["Admin"]
      );
    });

    it("removes localStorage entry on reset", () => {
      useRoleStore.getState().updatePermissions("Admin", DEFAULT_PERMISSIONS["Admin"]);
      useRoleStore.getState().resetToDefaults();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("tyro-role-permissions-v2");
    });
  });

  describe("localStorage persistence", () => {
    it("saves to localStorage on updatePermissions", () => {
      useRoleStore.getState().updatePermissions("Admin", DEFAULT_PERMISSIONS["Admin"]);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "tyro-role-permissions-v2",
        expect.any(String)
      );
    });

    it("removes from localStorage on resetToDefaults", () => {
      useRoleStore.getState().resetToDefaults();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("tyro-role-permissions-v2");
    });
  });
});
