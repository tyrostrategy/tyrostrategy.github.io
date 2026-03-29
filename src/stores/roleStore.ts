import { create } from "zustand";
import type { UserRole, RolePermissions } from "@/types";
import { isSupabaseMode } from "@/hooks/useSupabaseData";
import { toast } from "@/stores/toastStore";
import i18n from "@/lib/i18n";

// ===== Varsayılan Rol Yetkileri =====

const ADMIN_DEFAULTS: RolePermissions = {
  pages: {
    kpi: true,
    projeler: true,
    aksiyonlar: true,
    gantt: true,
    wbs: true,
    stratejikKokpit: true,
    tMap: true,
    tAlignment: true,
    kullanicilar: true,
    ayarlar: true,
    guvenlik: true,
  },
  proje: { create: true, edit: true, delete: true },
  aksiyon: { create: true, edit: true, delete: true },
  editOnlyOwn: false,
  viewOnlyOwn: false,
};

const PROJE_LIDERI_DEFAULTS: RolePermissions = {
  pages: {
    kpi: false,
    projeler: true,
    aksiyonlar: true,
    gantt: true,
    wbs: true,
    stratejikKokpit: false,
    tMap: false,
    tAlignment: false,
    kullanicilar: false,
    ayarlar: false,
    guvenlik: false,
  },
  proje: { create: false, edit: false, delete: false },
  aksiyon: { create: true, edit: true, delete: false },
  editOnlyOwn: true,
  viewOnlyOwn: true,
};

const KULLANICI_DEFAULTS: RolePermissions = {
  pages: {
    kpi: false,
    projeler: true,
    aksiyonlar: true,
    gantt: true,
    wbs: true,
    stratejikKokpit: false,
    tMap: false,
    tAlignment: false,
    kullanicilar: false,
    ayarlar: false,
    guvenlik: false,
  },
  proje: { create: false, edit: false, delete: false },
  aksiyon: { create: true, edit: true, delete: false },
  editOnlyOwn: true,
  viewOnlyOwn: true,
};

export const DEFAULT_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Admin: ADMIN_DEFAULTS,
  "Proje Lideri": PROJE_LIDERI_DEFAULTS,
  Kullanıcı: KULLANICI_DEFAULTS,
};

// ===== Store =====

interface RoleStore {
  permissions: Record<UserRole, RolePermissions>;
  getPermissions: (role: UserRole) => RolePermissions;
  updatePermissions: (role: UserRole, perms: RolePermissions) => void;
  resetToDefaults: () => void;
}

function loadFromStorage(): Record<UserRole, RolePermissions> {
  try {
    const raw = localStorage.getItem("tyro-role-permissions-v2");
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to handle new fields added later
      return {
        Admin: { ...ADMIN_DEFAULTS, ...parsed.Admin },
        "Proje Lideri": { ...PROJE_LIDERI_DEFAULTS, ...parsed["Proje Lideri"] },
        Kullanıcı: { ...KULLANICI_DEFAULTS, ...parsed["Kullanıcı"] },
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_PERMISSIONS };
}

export const useRoleStore = create<RoleStore>((set, get) => ({
  permissions: loadFromStorage(),

  getPermissions: (role) => {
    return get().permissions[role] ?? DEFAULT_PERMISSIONS[role];
  },

  updatePermissions: (role, perms) => {
    set((state) => {
      const next = { ...state.permissions, [role]: perms };
      localStorage.setItem("tyro-role-permissions-v2", JSON.stringify(next));
      // Supabase sync
      if (isSupabaseMode) {
        import("@/lib/data/supabaseAdapter").then((m) =>
          m.supabaseAdapter.upsertRolePermissions(role, perms as unknown as Record<string, unknown>)
        ).catch((err) => {
          console.error("[Supabase] upsertRolePermissions failed:", err);
          toast.error(i18n.t("toast.syncFailed"));
        });
      }
      return { permissions: next };
    });
  },

  resetToDefaults: () => {
    localStorage.removeItem("tyro-role-permissions-v2");
    set({ permissions: { ...DEFAULT_PERMISSIONS } });
  },
}));

// Startup: load from Supabase (overrides localStorage)
if (isSupabaseMode) {
  import("@/lib/data/supabaseAdapter").then((m) =>
    m.supabaseAdapter.fetchRolePermissions().then((rows) => {
      if (rows.length > 0) {
        const current = useRoleStore.getState().permissions;
        const updates: Record<string, RolePermissions> = {};
        for (const row of rows) {
          if (row.role in current) {
            updates[row.role] = { ...current[row.role as UserRole], ...row.permissions } as RolePermissions;
          }
        }
        if (Object.keys(updates).length > 0) {
          console.log("[Supabase] Loaded role_permissions:", Object.keys(updates));
          useRoleStore.setState({ permissions: { ...current, ...updates } as Record<UserRole, RolePermissions> });
        }
      }
    })
  ).catch((err) => {
    console.error("[Supabase] fetchRolePermissions failed:", err);
    toast.error(i18n.t("toast.permissionsLoadFailed"));
  });
}
