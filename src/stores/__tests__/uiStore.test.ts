import { describe, it, expect, beforeEach, vi } from "vitest";
import { useUIStore } from "../uiStore";

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
  localStorage.clear();
  useUIStore.setState({
    sidebarCollapsed: false,
    commandPaletteOpen: false,
    activePage: "dashboard",
    mockLoggedIn: false,
    mockUserName: "Cenk Şayli",
    mockUserRole: "Admin",
    mobileDrawerOpen: false,
    theme: "light",
    locale: "tr",
  });
});

describe("uiStore", () => {
  describe("default values", () => {
    it("sidebarCollapsed defaults to false", () => {
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it("commandPaletteOpen defaults to false", () => {
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    });

    it("theme defaults to light", () => {
      expect(useUIStore.getState().theme).toBe("light");
    });

    it("locale defaults to tr", () => {
      expect(useUIStore.getState().locale).toBe("tr");
    });

    it("mobileDrawerOpen defaults to false", () => {
      expect(useUIStore.getState().mobileDrawerOpen).toBe(false);
    });

    it("activePage defaults to dashboard", () => {
      expect(useUIStore.getState().activePage).toBe("dashboard");
    });
  });

  describe("toggleSidebar", () => {
    it("flips collapsed state from false to true", () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    });

    it("flips collapsed state back to false", () => {
      useUIStore.getState().toggleSidebar();
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe("toggleTheme", () => {
    it("switches from light to dark", () => {
      useUIStore.getState().toggleTheme();
      expect(useUIStore.getState().theme).toBe("dark");
    });

    it("switches from dark back to light", () => {
      useUIStore.getState().toggleTheme();
      useUIStore.getState().toggleTheme();
      expect(useUIStore.getState().theme).toBe("light");
    });

    it("persists theme to localStorage", () => {
      useUIStore.getState().toggleTheme();
      expect(localStorage.getItem("tyro-theme")).toBe("dark");
    });
  });

  describe("setLocale", () => {
    it("changes locale to en", () => {
      useUIStore.getState().setLocale("en");
      expect(useUIStore.getState().locale).toBe("en");
    });

    it("persists locale to localStorage", () => {
      useUIStore.getState().setLocale("en");
      expect(localStorage.getItem("tyro-locale")).toBe("en");
    });
  });

  describe("setMockUserName", () => {
    it("updates mockUserName", () => {
      useUIStore.getState().setMockUserName("Kemal Yıldız");
      expect(useUIStore.getState().mockUserName).toBe("Kemal Yıldız");
    });

    it("persists to localStorage", () => {
      useUIStore.getState().setMockUserName("Kemal Yıldız");
      expect(localStorage.getItem("tyro-mock-user")).toBe("Kemal Yıldız");
    });
  });

  describe("setMockUserRole", () => {
    it("updates mockUserRole", () => {
      useUIStore.getState().setMockUserRole("Proje Lideri");
      expect(useUIStore.getState().mockUserRole).toBe("Proje Lideri");
    });

    it("persists to localStorage", () => {
      useUIStore.getState().setMockUserRole("Proje Lideri");
      expect(localStorage.getItem("tyro-mock-role")).toBe("Proje Lideri");
    });
  });

  describe("command palette", () => {
    it("openCommandPalette sets commandPaletteOpen to true", () => {
      useUIStore.getState().openCommandPalette();
      expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    });

    it("closeCommandPalette sets commandPaletteOpen to false", () => {
      useUIStore.getState().openCommandPalette();
      useUIStore.getState().closeCommandPalette();
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    });
  });

  describe("mobile drawer", () => {
    it("toggleMobileDrawer flips mobileDrawerOpen", () => {
      useUIStore.getState().toggleMobileDrawer();
      expect(useUIStore.getState().mobileDrawerOpen).toBe(true);
    });

    it("closeMobileDrawer sets mobileDrawerOpen to false", () => {
      useUIStore.getState().toggleMobileDrawer();
      useUIStore.getState().closeMobileDrawer();
      expect(useUIStore.getState().mobileDrawerOpen).toBe(false);
    });
  });

  describe("setActivePage", () => {
    it("updates activePage", () => {
      useUIStore.getState().setActivePage("projeler");
      expect(useUIStore.getState().activePage).toBe("projeler");
    });
  });

  describe("setMockLoggedIn", () => {
    it("updates mockLoggedIn", () => {
      useUIStore.getState().setMockLoggedIn(true);
      expect(useUIStore.getState().mockLoggedIn).toBe(true);
    });
  });
});
