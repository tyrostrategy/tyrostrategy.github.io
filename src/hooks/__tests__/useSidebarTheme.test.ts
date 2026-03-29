import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSidebarTheme, sidebarCSSVars, appCSSVars, getAppTheme } from "../useSidebarTheme";
import { useUIStore } from "@/stores/uiStore";
import { sidebarThemes } from "@/config/sidebarThemes";

// Mock i18n
vi.mock("@/lib/i18n", () => ({
  default: {
    language: "tr",
    use: () => ({ init: () => {} }),
    changeLanguage: vi.fn(),
  },
}));

// Mock mock-adapter
vi.mock("@/lib/data/mock-adapter", () => ({
  getInitialProjeler: () => [],
  getInitialAksiyonlar: () => [],
  getInitialData: () => ({ projeler: [], aksiyonlar: [] }),
  getInitialTagDefinitions: () => [],
}));

beforeEach(() => {
  useUIStore.setState({ sidebarTheme: "light" });
});

describe("useSidebarTheme", () => {
  it("returns the light theme by default", () => {
    const { result } = renderHook(() => useSidebarTheme());
    expect(result.current.id).toBe("light");
  });

  it("returns the correct theme object structure", () => {
    const { result } = renderHook(() => useSidebarTheme());
    expect(result.current).toHaveProperty("bg");
    expect(result.current).toHaveProperty("textPrimary");
    expect(result.current).toHaveProperty("activeBg");
    expect(result.current).toHaveProperty("scope");
  });

  it("returns navy theme when sidebarTheme is navy", () => {
    useUIStore.setState({ sidebarTheme: "navy" });
    const { result } = renderHook(() => useSidebarTheme());
    expect(result.current.id).toBe("navy");
    expect(result.current.isDark).toBe(true);
  });

  it("matches the theme from sidebarThemes config", () => {
    useUIStore.setState({ sidebarTheme: "arctic" });
    const { result } = renderHook(() => useSidebarTheme());
    expect(result.current).toBe(sidebarThemes["arctic"]);
  });
});

describe("sidebarCSSVars", () => {
  it("returns CSS variables for the given theme", () => {
    const theme = sidebarThemes["light"];
    const vars = sidebarCSSVars(theme);
    expect(vars["--sb-bg" as keyof typeof vars]).toBe(theme.bg);
    expect(vars["--sb-text-primary" as keyof typeof vars]).toBe(theme.textPrimary);
    expect(vars["--sb-active-bg" as keyof typeof vars]).toBe(theme.activeBg);
  });

  it("includes border variable", () => {
    const theme = sidebarThemes["navy"];
    const vars = sidebarCSSVars(theme);
    expect(vars["--sb-border" as keyof typeof vars]).toBe(theme.border);
  });
});

describe("appCSSVars", () => {
  it("returns empty object for sidebar-scoped theme", () => {
    const theme = sidebarThemes["light"];
    const vars = appCSSVars(theme);
    expect(vars).toEqual({});
  });

  it("returns CSS variables for full-scoped theme with app config", () => {
    // Find a full-scoped theme
    const fullThemeEntry = Object.values(sidebarThemes).find(
      (t) => t.scope === "full" && t.app
    );
    if (!fullThemeEntry) return; // skip if no full themes exist

    const vars = appCSSVars(fullThemeEntry);
    expect(vars["--tyro-bg" as keyof typeof vars]).toBe(fullThemeEntry.app!.bg);
    expect(vars["--tyro-surface" as keyof typeof vars]).toBe(fullThemeEntry.app!.surface);
  });
});

describe("getAppTheme", () => {
  it("returns null for sidebar-scoped theme", () => {
    const theme = sidebarThemes["light"];
    expect(getAppTheme(theme)).toBeNull();
  });

  it("returns AppThemeConfig for full-scoped theme", () => {
    const fullThemeEntry = Object.values(sidebarThemes).find(
      (t) => t.scope === "full" && t.app
    );
    if (!fullThemeEntry) return;

    const appTheme = getAppTheme(fullThemeEntry);
    expect(appTheme).not.toBeNull();
    expect(appTheme).toHaveProperty("bg");
    expect(appTheme).toHaveProperty("surface");
    expect(appTheme).toHaveProperty("isDark");
  });
});
