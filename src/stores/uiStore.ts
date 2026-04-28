import { create } from "zustand";
import i18n from "@/lib/i18n";
import type { SidebarThemeId } from "@/config/sidebarThemes";
import { isSupabaseMode } from "@/lib/supabaseMode";
import { toast } from "@/stores/toastStore";

// Lazy import to avoid circular dependency
const getSyncAdapter = () => import("@/lib/data/supabaseAdapter").then((m) => m.supabaseAdapter);

interface UIState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  activePage: string;
  mockLoggedIn: boolean;
  mockUserName: string;
  mockUserRole: string;
  mobileDrawerOpen: boolean;
  theme: "light" | "dark";
  sidebarTheme: SidebarThemeId;
  locale: "tr" | "en";
  companyName: string;
  allowMultipleTags: boolean;
  behindThreshold: number;
  atRiskThreshold: number;
  setCompanyName: (name: string) => void;
  setAllowMultipleTags: (v: boolean) => void;
  setBehindThreshold: (v: number) => void;
  setAtRiskThreshold: (v: number) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setActivePage: (page: string) => void;
  setMockLoggedIn: (v: boolean) => void;
  setMockUserName: (name: string) => void;
  setMockUserRole: (role: string) => void;
  toggleMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleTheme: () => void;
  setSidebarTheme: (theme: SidebarThemeId) => void;
  setLocale: (locale: "tr" | "en") => void;
  workspaceRefreshFn: (() => Promise<void>) | null;
  setWorkspaceRefreshFn: (fn: (() => Promise<void>) | null) => void;
}

function syncSetting(key: string, value: unknown) {
  if (isSupabaseMode) {
    getSyncAdapter().then((adapter) => adapter.upsertAppSetting(key, value)).catch((err) => {
      console.error("[Supabase] syncSetting failed:", err);
      toast.error(i18n.t("toast.syncFailed"));
    });
  }
}

/** Sync locale to users table (fire-and-forget).
 *
 * KRITIK: Equality guard ZORUNLU. Önce yoktu — aynı locale ile çağrılsa
 * bile her seferinde Supabase'e UPDATE atıyordu. Birleşince applyUser ile
 * (her users-array değişiminde fire eder) zincir bir loop'a giriyor:
 *
 *   applyUser fire → setLocale("tr") → syncUserLocale → updateUser
 *     → users state new ref → AuthGuard re-fires applyUser → ...
 *
 * applyUser'ın kendi guard'ı (ui.locale !== user.locale) tek başına
 * yetmiyor çünkü bazen value tam eşit olmayabilir (case, undefined vs
 * "tr"). syncUserLocale tarafında ek savunma şart. Sonuç: 354K boş
 * UPDATE çağrısı (Supabase Observability'de yakalandı 2026-04-24).
 *
 * Ek olarak: artık kullanıcı bulunamazsa veya locale zaten eşitse hiç
 * RPC fire etmiyoruz.
 */
function syncUserLocale(userName: string, locale: string) {
  if (!isSupabaseMode) return;
  import("@/stores/dataStore").then(({ useDataStore }) => {
    const { users, updateUser } = useDataStore.getState();
    const me = users.find((u) => u.displayName.toLowerCase().trim() === userName.toLowerCase().trim());
    if (!me) return;
    // Equality guard — DB'deki locale zaten istenen değer ise hiçbir şey yapma.
    if (me.locale === locale) return;
    updateUser(me.id, { locale });
  }).catch((err) => {
    console.error("[Supabase] syncUserLocale failed:", err);
  });
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  activePage: "dashboard",
  mockLoggedIn: import.meta.env.DEV ? !!localStorage.getItem("tyro-mock-user") : false,
  mockUserName: localStorage.getItem("tyro-mock-user") || "Cenk Şayli",
  mockUserRole: localStorage.getItem("tyro-mock-role") || "Admin",
  mobileDrawerOpen: false,
  theme: (localStorage.getItem("tyro-theme") as "light" | "dark") || "light",
  sidebarTheme: (localStorage.getItem("tyro-sidebar-theme") as SidebarThemeId) || "light",
  locale: (localStorage.getItem("tyro-locale") as "tr" | "en") || "tr",
  companyName: localStorage.getItem("tyro-company-name") || "Tiryaki Agro",
  allowMultipleTags: localStorage.getItem("tyro-allow-multiple-tags") !== "false",
  behindThreshold: Number(localStorage.getItem("tyro-behind-threshold")) || 20,
  atRiskThreshold: Number(localStorage.getItem("tyro-atrisk-threshold")) || 10,
  setCompanyName: (name) => {
    localStorage.setItem("tyro-company-name", name);
    syncSetting("company_name", name);
    set({ companyName: name });
  },
  setAllowMultipleTags: (v) => {
    localStorage.setItem("tyro-allow-multiple-tags", String(v));
    syncSetting("allow_multiple_tags", v);
    set({ allowMultipleTags: v });
  },
  setBehindThreshold: (v) => {
    localStorage.setItem("tyro-behind-threshold", String(v));
    syncSetting("behind_threshold", v);
    set({ behindThreshold: v });
  },
  setAtRiskThreshold: (v) => {
    localStorage.setItem("tyro-atrisk-threshold", String(v));
    syncSetting("atrisk_threshold", v);
    set({ atRiskThreshold: v });
  },
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  setActivePage: (page) => set({ activePage: page }),
  setMockLoggedIn: (v) => set({ mockLoggedIn: v }),
  setMockUserName: (name) => {
    localStorage.setItem("tyro-mock-user", name);
    set({ mockUserName: name });
  },
  setMockUserRole: (role) => {
    localStorage.setItem("tyro-mock-role", role);
    set({ mockUserRole: role });
  },
  toggleMobileDrawer: () =>
    set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),
  closeMobileDrawer: () => set({ mobileDrawerOpen: false }),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "light" ? "dark" : "light";
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("tyro-theme", next);
      return { theme: next };
    }),
  setSidebarTheme: (theme) => {
    localStorage.setItem("tyro-sidebar-theme", theme);
    set({ sidebarTheme: theme });
  },
  setLocale: (locale) => {
    localStorage.setItem("tyro-locale", locale);
    i18n.changeLanguage(locale);
    set({ locale });
    syncUserLocale(get().mockUserName, locale);
  },
  workspaceRefreshFn: null,
  setWorkspaceRefreshFn: (fn) => set({ workspaceRefreshFn: fn }),
}));

// Deterministic defaults — used as the merge base so two browsers with
// different localStorage histories converge on identical state once the
// DB fetch lands. DB always wins; localStorage is a warm cache only.
const DEFAULT_COMPANY_NAME = "Tiryaki Agro";
const DEFAULT_ALLOW_MULTIPLE_TAGS = true;
const DEFAULT_BEHIND_THRESHOLD = 20;
const DEFAULT_ATRISK_THRESHOLD = 10;

/**
 * Force-refresh every DB-backed UI setting from Supabase, bypassing
 * per-browser localStorage drift. Applied on startup and also exported
 * so the Ayarlar page can call it on mount — same pattern as
 * roleStore.reloadFromDb for the Güvenlik page.
 */
export async function reloadUISettingsFromDb(): Promise<void> {
  if (!isSupabaseMode) return;
  try {
    const adapter = await getSyncAdapter();

    // 1) Global app_settings — DB wins, defaults fill any missing keys
    const settings = await adapter.fetchAppSettings();
    const map = new Map(settings.map((s) => [s.key, s.value]));
    const next = {
      companyName: (map.get("company_name") as string | undefined) ?? DEFAULT_COMPANY_NAME,
      allowMultipleTags:
        (map.get("allow_multiple_tags") as boolean | undefined) ?? DEFAULT_ALLOW_MULTIPLE_TAGS,
      behindThreshold:
        (map.get("behind_threshold") as number | undefined) ?? DEFAULT_BEHIND_THRESHOLD,
      atRiskThreshold:
        (map.get("atrisk_threshold") as number | undefined) ?? DEFAULT_ATRISK_THRESHOLD,
    };
    // Write-through the canonical values so the warm cache matches DB
    localStorage.setItem("tyro-company-name", next.companyName);
    localStorage.setItem("tyro-allow-multiple-tags", String(next.allowMultipleTags));
    localStorage.setItem("tyro-behind-threshold", String(next.behindThreshold));
    localStorage.setItem("tyro-atrisk-threshold", String(next.atRiskThreshold));
    useUIStore.setState(next);

    // 2) Current user's locale from users table — DB wins here too
    const users = await adapter.fetchUsers();
    const currentName = useUIStore.getState().mockUserName;
    const me = users.find(
      (u) => u.displayName.toLowerCase().trim() === currentName.toLowerCase().trim(),
    );
    if (me?.locale) {
      const dbLocale = me.locale as "tr" | "en";
      if (dbLocale !== useUIStore.getState().locale) {
        localStorage.setItem("tyro-locale", dbLocale);
        i18n.changeLanguage(dbLocale);
        useUIStore.setState({ locale: dbLocale });
      }
    }
  } catch (err) {
    console.error("[Supabase] reloadUISettingsFromDb failed:", err);
    toast.error(i18n.t("toast.settingsLoadFailed"));
  }
}

// Startup: single deterministic reload from DB
if (isSupabaseMode) {
  void reloadUISettingsFromDb();
}
