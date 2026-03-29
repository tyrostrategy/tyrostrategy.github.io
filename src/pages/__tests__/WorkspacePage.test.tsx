import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import WorkspacePage from "../WorkspacePage";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, opts?: any) => opts?.count != null ? `${opts.count} ${key}` : key }),
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

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, variants, initial, animate, ...rest }: any) => (
      <div {...rest}>{children}</div>
    ),
    button: ({ children, variants, initial, animate, transition, whileHover, whileTap, ...rest }: any) => (
      <button {...rest}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock lazy-loaded components
vi.mock("@/components/workspace/MyProjectsList", () => ({
  default: () => <div data-testid="my-projects-list">MyProjectsList</div>,
}));

vi.mock("@/components/workspace/UpcomingDeadlines", () => ({
  default: () => <div data-testid="upcoming-deadlines">UpcomingDeadlines</div>,
}));

vi.mock("@/components/workspace/BentoKPI", () => ({
  default: () => <div data-testid="bento-kpi">BentoKPI</div>,
}));

vi.mock("@/components/shared/SlidingPanel", () => ({
  default: ({ children }: any) => <div data-testid="sliding-panel">{children}</div>,
}));

vi.mock("@/components/wizard/ProjeAksiyonWizard", () => ({
  default: () => <div data-testid="wizard">Wizard</div>,
}));

vi.mock("@/components/wizard/WizardHeader", () => ({
  default: () => <div data-testid="wizard-header">WizardHeader</div>,
}));

// Mock useSidebarTheme
vi.mock("@/hooks/useSidebarTheme", () => ({
  useSidebarTheme: () => ({
    brandStrategy: "#c8922a",
    accentColor: "#c8922a",
  }),
}));

// Mock useCurrentUser
vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({
    name: "Cenk Şayli",
    email: "cenk.sayli@tiryaki.com.tr",
    department: "IT",
    initials: "CŞ",
    role: "Admin",
  }),
}));

// Mock useMyWorkspace
vi.mock("@/hooks/useMyWorkspace", () => ({
  useMyWorkspace: () => ({
    userName: "Cenk Şayli",
    department: "IT",
    myProjeler: [
      { id: "p1", name: "Proje 1", status: "On Track", progress: 60, source: "Kurumsal", owner: "Cenk Şayli", participants: ["Cenk Şayli"], startDate: "2024-01-01", endDate: "2024-12-31" },
      { id: "p2", name: "Proje 2", status: "Behind", progress: 20, source: "Türkiye", owner: "Cenk Şayli", participants: ["Cenk Şayli"], startDate: "2024-01-01", endDate: "2024-12-31" },
    ],
    myAksiyonlar: [{ id: "a1" }, { id: "a2" }, { id: "a3" }],
    totalProjeler: 2,
    achievedProjeler: 0,
    behindProjeler: 1,
    atRiskProjeler: 0,
    totalAksiyonlar: 3,
    achievedAksiyonlar: 1,
    behindAksiyonlar: 1,
    atRiskAksiyonlar: 0,
    overallProgress: 40,
    aksiyonProgress: 33,
    statusBreakdown: { "On Track": 1, "Achieved": 1, "Behind": 1 },
    projeStatusBreakdown: { "On Track": 1, "Behind": 1 },
    upcomingDeadlines: [],
  }),
}));

beforeEach(() => {
  mockNavigate.mockClear();
});

describe("WorkspacePage", () => {
  it("renders greeting with user first name", () => {
    render(<WorkspacePage />);
    expect(screen.getByText(/Cenk/)).toBeInTheDocument();
  });

  it("renders user initials", () => {
    render(<WorkspacePage />);
    expect(screen.getByText("CŞ")).toBeInTheDocument();
  });

  it("shows department badge", () => {
    render(<WorkspacePage />);
    expect(screen.getByText("IT")).toBeInTheDocument();
  });

  it("renders BentoKPI component", () => {
    render(<WorkspacePage />);
    expect(screen.getByTestId("bento-kpi")).toBeInTheDocument();
  });

  it("renders search button with command palette trigger", () => {
    render(<WorkspacePage />);
    expect(screen.getByText("common.search")).toBeInTheDocument();
  });

  it("shows summary text with active project count", () => {
    render(<WorkspacePage />);
    // 2 projects, 0 achieved -> 2 active
    expect(screen.getByText(/2 workspace\.activeProjectsTracked/)).toBeInTheDocument();
  });
});
