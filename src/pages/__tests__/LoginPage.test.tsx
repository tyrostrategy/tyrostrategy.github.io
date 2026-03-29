import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "../LoginPage";
import { useUIStore } from "@/stores/uiStore";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/lib/i18n", () => ({
  default: {
    language: "tr",
    use: () => ({ init: () => {} }),
    changeLanguage: vi.fn(),
  },
}));

vi.mock("@/lib/data/mock-adapter", () => ({
  getInitialProjeler: () => [],
  getInitialAksiyonlar: () => [],
  getInitialData: () => ({ projeler: [], aksiyonlar: [] }),
  getInitialTagDefinitions: () => [],
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }: any) => {
      const { variants, initial, animate, transition, whileHover, whileTap, ...safeRest } = rest;
      return <div {...safeRest}>{children}</div>;
    },
    button: ({ children, ...rest }: any) => {
      const { variants, initial, animate, transition, whileHover, whileTap, ...safeRest } = rest;
      return <button {...safeRest}>{children}</button>;
    },
    p: ({ children, ...rest }: any) => {
      const { variants, initial, animate, transition, ...safeRest } = rest;
      return <p {...safeRest}>{children}</p>;
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock TyroLogo
vi.mock("@/components/ui/TyroLogo", () => ({
  TyroLogo: () => <div data-testid="tyro-logo">Logo</div>,
}));

// Mock RoleAvatar
vi.mock("@/components/ui/RoleAvatar", () => ({
  RoleAvatar: ({ name }: any) => <div data-testid="role-avatar">{name}</div>,
}));

beforeEach(() => {
  mockNavigate.mockClear();
  useUIStore.setState({
    locale: "tr",
    mockUserName: "Cenk Şayli",
    mockUserRole: "Admin",
    mockLoggedIn: false,
  });
});

describe("LoginPage", () => {
  it("renders 3 demo user cards", () => {
    render(<LoginPage />);
    // Each user name appears in both the RoleAvatar mock and the h4 label, so use getAllByText
    expect(screen.getAllByText("Cenk Şayli").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Kemal Yıldız").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Burcu Gözen").length).toBeGreaterThanOrEqual(1);
  });

  it("renders welcome text and select user prompt", () => {
    render(<LoginPage />);
    expect(screen.getByText("login.welcome")).toBeInTheDocument();
    expect(screen.getByText("login.selectUser")).toBeInTheDocument();
  });

  it("clicking a user card selects it", () => {
    render(<LoginPage />);
    // Each user name appears multiple times (RoleAvatar + h4), get the h4 version
    const kemalElements = screen.getAllByText("Kemal Yıldız");
    const kemalH4 = kemalElements.find((el) => el.tagName === "H4");
    const kemalButton = kemalH4?.closest("button");
    expect(kemalButton).toBeTruthy();
    fireEvent.click(kemalButton!);
    // The selected user gets accent border color; Kemal's accent is #3b82f6 (jsdom converts to rgb)
    expect(kemalButton?.style.borderColor).toBe("rgb(59, 130, 246)");
  });

  it("renders language toggle buttons", () => {
    render(<LoginPage />);
    expect(screen.getByText("TR")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  it("clicking EN toggles locale to en", () => {
    render(<LoginPage />);
    const enButton = screen.getByText("EN");
    fireEvent.click(enButton);
    expect(useUIStore.getState().locale).toBe("en");
  });

  it("renders login button", () => {
    render(<LoginPage />);
    expect(screen.getByText("login.login")).toBeInTheDocument();
  });

  it("renders demo mode info text", () => {
    render(<LoginPage />);
    expect(screen.getByText("login.demoMode")).toBeInTheDocument();
  });

  it("shows role labels for each user", () => {
    render(<LoginPage />);
    // getRoleLabel returns t("roles.admin"), etc., which our mock returns as the key
    expect(screen.getByText("roles.admin")).toBeInTheDocument();
    expect(screen.getByText("roles.projectLeader")).toBeInTheDocument();
    expect(screen.getByText("roles.user")).toBeInTheDocument();
  });

  it("shows department names for each user", () => {
    render(<LoginPage />);
    expect(screen.getByText("IT")).toBeInTheDocument();
    expect(screen.getByText("Uluslararası Operasyonlar")).toBeInTheDocument();
    expect(screen.getByText("Finans")).toBeInTheDocument();
  });
});
