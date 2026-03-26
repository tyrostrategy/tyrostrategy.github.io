import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCurrentUser } from "../useCurrentUser";
import { useUIStore } from "@/stores/uiStore";

// Mock i18n
vi.mock("@/lib/i18n", () => ({
  default: {
    language: "tr",
    use: () => ({ init: () => {} }),
    changeLanguage: () => {},
  },
}));

// Mock mock-adapter
vi.mock("@/lib/data/mock-adapter", () => ({
  getInitialProjeler: () => [],
  getInitialProjeler: () => [],
  getInitialGorevler: () => [],
}));

beforeEach(() => {
  useUIStore.setState({
    mockUserName: "Cenk Şayli",
    mockUserRole: "Admin",
  });
});

describe("useCurrentUser", () => {
  it("returns correct name for default mock user", () => {
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.name).toBe("Cenk Şayli");
  });

  it("returns Admin role for IT department user with Admin role", () => {
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.role).toBe("Admin");
  });

  it("returns correct department for Cenk Şayli (IT)", () => {
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.department).toBe("IT");
  });

  it("returns correct email for Cenk Şayli", () => {
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.email).toBe("cenk.sayli@tiryaki.com.tr");
  });

  it("returns correct initials for Cenk Şayli (CŞ)", () => {
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.initials).toBe("CŞ");
  });

  it("updates user info when mockUserName changes", () => {
    useUIStore.setState({ mockUserName: "Burcu Gözen", mockUserRole: "Kullanıcı" });
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.name).toBe("Burcu Gözen");
    expect(result.current.department).toBe("Finans");
    expect(result.current.initials).toBe("BG");
    expect(result.current.role).toBe("Kullanıcı");
  });

  it("returns Proje Lideri role when mockUserRole is set", () => {
    useUIStore.setState({ mockUserName: "Kemal Yıldız", mockUserRole: "Proje Lideri" });
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.role).toBe("Proje Lideri");
    expect(result.current.department).toBe("Uluslararası Operasyonlar");
  });

  it("defaults to Kullanıcı when mockUserRole is invalid", () => {
    useUIStore.setState({ mockUserRole: "InvalidRole" });
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.role).toBe("Kullanıcı");
  });

  it("returns Bilinmiyor department for unknown user", () => {
    useUIStore.setState({ mockUserName: "Unknown Person", mockUserRole: "Admin" });
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.department).toBe("Bilinmiyor");
    expect(result.current.email).toBe("");
  });

  it("returns correct initials for single-name user", () => {
    useUIStore.setState({ mockUserName: "Admin", mockUserRole: "Admin" });
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.initials).toBe("A");
  });
});
