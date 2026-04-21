import { create } from "zustand";
import type { UserRole, RolePermissions } from "@/types";
import { isSupabaseMode } from "@/lib/supabaseMode";
import { toast } from "@/stores/toastStore";
import i18n from "@/lib/i18n";

// ===== Varsayılan Rol Yetkileri =====

const ADMIN_DEFAULTS: RolePermissions = {
  pages: {
    anasayfa: true,
    kpi: true,
    raporKonfigurasyonu: true,
    projeler: true,
    aksiyonlar: true,
    gantt: true,
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
    anasayfa: true,
    kpi: false,
    raporKonfigurasyonu: true,
    projeler: true,
    aksiyonlar: true,
    gantt: true,
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
    anasayfa: true,
    kpi: false,
    raporKonfigurasyonu: false,
    projeler: true,
    aksiyonlar: true,
    gantt: true,
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

const SUB_MANAGEMENT_DEFAULTS: RolePermissions = {
  pages: {
    anasayfa: true,
    kpi: true,
    raporKonfigurasyonu: true,
    projeler: true,
    aksiyonlar: true,
    gantt: true,
    stratejikKokpit: true,
    tMap: true,
    tAlignment: true,
    kullanicilar: false,
    ayarlar: false,
    guvenlik: false,
  },
  proje: { create: false, edit: false, delete: false },
  aksiyon: { create: false, edit: false, delete: false },
  editOnlyOwn: false,
  viewOnlyOwn: false,
};

export const DEFAULT_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Admin: ADMIN_DEFAULTS,
  "Proje Lideri": PROJE_LIDERI_DEFAULTS,
  Kullanıcı: KULLANICI_DEFAULTS,
  "Management": SUB_MANAGEMENT_DEFAULTS,
};

// ===== Store =====

interface RoleStore {
  permissions: Record<UserRole, RolePermissions>;
  getPermissions: (role: UserRole) => RolePermissions;
  updatePermissions: (role: UserRole, perms: RolePermissions) => void;
  resetToDefaults: () => void;
  /**
   * Force-refresh permissions from Supabase, bypassing localStorage. Güvenlik
   * page calls this on mount so the two-browser divergence ("I see different
   * switches than my other tab") never happens — what's on disk loses, DB wins.
   * Merge base is DEFAULT_PERMISSIONS (not the current in-memory state) so the
   * result is deterministic and cross-browser identical.
   */
  reloadFromDb: () => Promise<void>;
}

/**
 * Pull only the nested RolePermissions keys out of a raw JSONB row.
 * DB rows may carry legacy flat keys (canEditProje, canDeleteAksiyon, ...)
 * from older seed / double-write eras; spreading those into the frontend
 * shape pollutes the object with spurious top-level booleans. Migration
 * 012 also strips them on the DB side, but this is defence-in-depth so a
 * future bad write doesn't ripple through.
 */
function sanitizePerms(raw: Partial<RolePermissions> | Record<string, unknown> | undefined): Partial<RolePermissions> {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<RolePermissions> = {};
  if (r.pages && typeof r.pages === "object") out.pages = r.pages as RolePermissions["pages"];
  if (r.proje && typeof r.proje === "object") out.proje = r.proje as RolePermissions["proje"];
  if (r.aksiyon && typeof r.aksiyon === "object") out.aksiyon = r.aksiyon as RolePermissions["aksiyon"];
  if (typeof r.editOnlyOwn === "boolean") out.editOnlyOwn = r.editOnlyOwn;
  if (typeof r.viewOnlyOwn === "boolean") out.viewOnlyOwn = r.viewOnlyOwn;
  return out;
}

function mergePerms(defaults: RolePermissions, saved: Partial<RolePermissions> | undefined): RolePermissions {
  const clean = sanitizePerms(saved);
  return {
    ...defaults,
    ...clean,
    // Deep merge pages so new page keys added to defaults are preserved
    pages: { ...defaults.pages, ...(clean.pages ?? {}) },
  };
}

function loadFromStorage(): Record<UserRole, RolePermissions> {
  try {
    const raw = localStorage.getItem("tyro-role-permissions-v2");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        Admin: mergePerms(ADMIN_DEFAULTS, parsed.Admin),
        "Proje Lideri": mergePerms(PROJE_LIDERI_DEFAULTS, parsed["Proje Lideri"]),
        Kullanıcı: mergePerms(KULLANICI_DEFAULTS, parsed["Kullanıcı"]),
        "Management": mergePerms(SUB_MANAGEMENT_DEFAULTS, parsed["Management"]),
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

  reloadFromDb: async () => {
    if (!isSupabaseMode) return;
    try {
      const m = await import("@/lib/data/supabaseAdapter");
      const rows = await m.supabaseAdapter.fetchRolePermissions();
      const next: Record<UserRole, RolePermissions> = { ...DEFAULT_PERMISSIONS };
      for (const row of rows) {
        if (row.role in DEFAULT_PERMISSIONS) {
          next[row.role as UserRole] = mergePerms(
            DEFAULT_PERMISSIONS[row.role as UserRole],
            row.permissions as Partial<RolePermissions>,
          );
        }
      }
      localStorage.setItem("tyro-role-permissions-v2", JSON.stringify(next));
      set({ permissions: next });
    } catch (err) {
      console.error("[Supabase] reloadFromDb failed:", err);
      toast.error(i18n.t("toast.permissionsLoadFailed"));
    }
  },
}));

// Startup: always resolve permissions from Supabase so every browser
// converges on the same source of truth. localStorage is a warm-cache
// for fast first paint, not the canonical state.
if (isSupabaseMode) {
  void useRoleStore.getState().reloadFromDb();
}
