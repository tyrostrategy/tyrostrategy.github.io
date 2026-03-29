import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyState from "../shared/EmptyState";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe("EmptyState", () => {
  it("renders default title from translation key", () => {
    render(<EmptyState />);
    expect(screen.getByText("common.noRecordsFound")).toBeInTheDocument();
  });

  it("renders default description from translation key", () => {
    render(<EmptyState />);
    expect(screen.getByText("common.tryChangingCriteria")).toBeInTheDocument();
  });

  it("renders custom title when provided", () => {
    render(<EmptyState title="No projects yet" />);
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
  });

  it("renders custom description when provided", () => {
    render(<EmptyState description="Create your first project to get started" />);
    expect(screen.getByText("Create your first project to get started")).toBeInTheDocument();
  });

  it("renders custom icon when provided", () => {
    render(<EmptyState icon={<span data-testid="custom-icon">Icon</span>} />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders default SearchX icon when no icon is provided", () => {
    const { container } = render(<EmptyState />);
    // The default icon container div should exist
    const iconContainer = container.querySelector(".w-16.h-16");
    expect(iconContainer).toBeInTheDocument();
  });

  it("renders action slot when provided", () => {
    render(<EmptyState action={<button>Add New</button>} />);
    expect(screen.getByText("Add New")).toBeInTheDocument();
  });

  it("does not render action slot when not provided", () => {
    render(<EmptyState />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("applies correct CSS structure for centering", () => {
    const { container } = render(<EmptyState />);
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv).toHaveClass("flex");
    expect(outerDiv).toHaveClass("flex-col");
    expect(outerDiv).toHaveClass("items-center");
    expect(outerDiv).toHaveClass("justify-center");
  });
});
