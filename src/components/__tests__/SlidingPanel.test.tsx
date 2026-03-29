import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SlidingPanel from "../shared/SlidingPanel";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { onMouseEnter, onMouseLeave, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe("SlidingPanel", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: "Panel Title",
    children: <p>Panel content</p>,
  };

  it("renders title when isOpen is true", () => {
    render(<SlidingPanel {...defaultProps} />);
    expect(screen.getByText("Panel Title")).toBeInTheDocument();
  });

  it("renders children content when isOpen is true", () => {
    render(<SlidingPanel {...defaultProps} />);
    expect(screen.getByText("Panel content")).toBeInTheDocument();
  });

  it("does not render content when isOpen is false", () => {
    render(<SlidingPanel {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Panel Title")).not.toBeInTheDocument();
    expect(screen.queryByText("Panel content")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<SlidingPanel {...defaultProps} onClose={onClose} />);
    const closeBtn = screen.getByLabelText("common.cancel");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<SlidingPanel {...defaultProps} onClose={onClose} />);
    // Backdrop is the first motion.div with bg-black/15 class
    const backdrop = container.querySelector(".bg-black\\/15");
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<SlidingPanel {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose on Escape when panel is closed", () => {
    const onClose = vi.fn();
    render(<SlidingPanel {...defaultProps} isOpen={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders icon when provided", () => {
    render(
      <SlidingPanel {...defaultProps} icon={<span data-testid="panel-icon">I</span>} />
    );
    expect(screen.getByTestId("panel-icon")).toBeInTheDocument();
  });

  it("renders footer when provided", () => {
    render(
      <SlidingPanel {...defaultProps} footer={<button>Save</button>} />
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("hides default header when hideHeader is true", () => {
    render(<SlidingPanel {...defaultProps} hideHeader />);
    expect(screen.queryByText("Panel Title")).not.toBeInTheDocument();
  });

  it("renders custom headerContent when provided", () => {
    render(
      <SlidingPanel
        {...defaultProps}
        headerContent={<div>Custom Header</div>}
      />
    );
    expect(screen.getByText("Custom Header")).toBeInTheDocument();
  });
});
