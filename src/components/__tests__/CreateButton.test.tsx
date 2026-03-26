import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateButton from "../shared/CreateButton";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock i18n module
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

// Mock useSidebarTheme
vi.mock("@/hooks/useSidebarTheme", () => ({
  useSidebarTheme: () => ({
    buttonGradient: "linear-gradient(135deg, #1e3a5f, #2a5a8f)",
    buttonGradientHover: "linear-gradient(135deg, #2a5a8f, #3b82f6)",
  }),
}));

describe("CreateButton", () => {
  it("renders default label (translated common.new)", () => {
    render(<CreateButton onPress={() => {}} />);
    // t("common.new") returns "common.new" in our mock
    expect(screen.getByText("common.new")).toBeInTheDocument();
  });

  it("renders custom label when provided", () => {
    render(<CreateButton onPress={() => {}} label="Custom Label" />);
    expect(screen.getByText("Custom Label")).toBeInTheDocument();
  });

  it("calls onPress callback when clicked", () => {
    const onPress = vi.fn();
    render(<CreateButton onPress={onPress} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders a Plus icon", () => {
    const { container } = render(<CreateButton onPress={() => {}} />);
    // Lucide Plus icon renders as an SVG
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("has font-semibold class on the button", () => {
    render(<CreateButton onPress={() => {}} />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("font-semibold");
  });
});
