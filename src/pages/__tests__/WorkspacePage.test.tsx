import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import WorkspacePage from "../WorkspacePage";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock lazy-loaded components
vi.mock("@/components/workspace/WorkspaceTaskDonut", () => ({
  default: () => <div data-testid="workspace-task-donut">TaskDonut</div>,
}));

vi.mock("@/components/workspace/MyProjectsList", () => ({
  default: () => <div data-testid="my-projects-list">MyProjectsList</div>,
}));

vi.mock("@/components/workspace/UpcomingDeadlines", () => ({
  default: () => <div data-testid="upcoming-deadlines">UpcomingDeadlines</div>,
}));

vi.mock("@/components/workspace/MyProgressWidget", () => ({
  default: () => <div data-testid="my-progress-widget">MyProgressWidget</div>,
}));

// Mock KPICard
vi.mock("@/components/dashboard/KPICard", () => ({
  default: ({ label, value, contextText }: any) => (
    <div data-testid="kpi-card">
      <span>{label}</span>
      <span>{value}</span>
      {contextText && <span>{contextText}</span>}
    </div>
  ),
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
    myProjeler: [],
    myProjeler: [{ id: "p1", name: "Proje 1" }, { id: "p2", name: "Proje 2" }],
    myGorevler: [{ id: "g1" }, { id: "g2" }, { id: "g3" }],
    projectsAsLeader: 1,
    projectsAsParticipant: 1,
    totalGorevler: 3,
    achievedGorevler: 1,
    behindGorevler: 1,
    atRiskGorevler: 0,
    overallProgress: 50,
    gorevProgress: 33,
    statusBreakdown: { "On Track": 1, "Achieved": 1, "Behind": 1 },
    upcomingDeadlines: [],
  }),
}));

beforeEach(() => {
  mockNavigate.mockClear();
});

describe("WorkspacePage", () => {
  it("renders greeting with user first name", () => {
    render(<WorkspacePage />);
    // getGreetingKey returns a translation key, and name.split(" ")[0] = "Cenk"
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

  it("renders 4 KPI cards", () => {
    render(<WorkspacePage />);
    const kpiCards = screen.getAllByTestId("kpi-card");
    expect(kpiCards).toHaveLength(4);
  });

  it("renders KPI labels for Hedeflerim and Aksiyonlarım", () => {
    render(<WorkspacePage />);
    expect(screen.getByText("workspace.myObjectives")).toBeInTheDocument();
    expect(screen.getByText("workspace.myActions")).toBeInTheDocument();
    expect(screen.getByText("workspace.completed")).toBeInTheDocument();
    expect(screen.getByText("workspace.delayedOrRisky")).toBeInTheDocument();
  });

  it("renders search button with command palette trigger", () => {
    render(<WorkspacePage />);
    expect(screen.getByText("common.search")).toBeInTheDocument();
  });

  it("shows summary text with objective and action counts", () => {
    render(<WorkspacePage />);
    // Summary includes objective count: "2 workspace.objectivesCount"
    expect(screen.getByText(/2 workspace\.objectivesCount/)).toBeInTheDocument();
  });
});
