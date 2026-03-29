import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ToastContainer from "../shared/ToastContainer";
import { useToastStore } from "@/stores/toastStore";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { onMouseEnter, onMouseLeave, layout, ...rest } = props;
      return (
        <div
          {...rest}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe("ToastContainer", () => {
  beforeEach(() => {
    // Reset store between tests
    useToastStore.setState({ toasts: [] });
  });

  it("renders nothing when there are no toasts", () => {
    const { container } = render(<ToastContainer />);
    // Container exists but has no toast children
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a toast with title", () => {
    useToastStore.getState().addToast({ type: "success", title: "Saved!" });
    render(<ToastContainer />);
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("renders a toast with message", () => {
    useToastStore.getState().addToast({
      type: "info",
      title: "Update",
      message: "Record updated successfully",
    });
    render(<ToastContainer />);
    expect(screen.getByText("Record updated successfully")).toBeInTheDocument();
  });

  it("renders a toast with details", () => {
    useToastStore.getState().addToast({
      type: "success",
      title: "Created",
      details: [
        { label: "Name", value: "Project Alpha" },
        { label: "Status", value: "Active" },
      ],
    });
    render(<ToastContainer />);
    expect(screen.getByText("Name:")).toBeInTheDocument();
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Status:")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders multiple toasts", () => {
    useToastStore.getState().addToast({ type: "success", title: "First" });
    useToastStore.getState().addToast({ type: "error", title: "Second" });
    render(<ToastContainer />);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("removes toast when close button is clicked", () => {
    useToastStore.getState().addToast({ type: "warning", title: "Warning!" });
    render(<ToastContainer />);
    expect(screen.getByText("Warning!")).toBeInTheDocument();
    const closeBtn = screen.getByRole("button");
    fireEvent.click(closeBtn);
    expect(screen.queryByText("Warning!")).not.toBeInTheDocument();
  });

  it("auto-dismisses toast after duration", () => {
    vi.useFakeTimers();
    useToastStore.getState().addToast({
      type: "success",
      title: "Auto-dismiss",
      duration: 200,
    });
    render(<ToastContainer />);
    expect(screen.getByText("Auto-dismiss")).toBeInTheDocument();

    // Advance timers past the duration (intervals run every 50ms)
    // The component uses setTimeout(dismiss, 0) after expiry, so we need extra flush
    act(() => {
      vi.advanceTimersByTime(300);
    });
    // Flush the setTimeout(dismiss, 0) scheduled after expiry
    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.queryByText("Auto-dismiss")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("pauses auto-dismiss on mouse enter", () => {
    vi.useFakeTimers();
    useToastStore.getState().addToast({
      type: "info",
      title: "Hover me",
      duration: 400,
    });
    const { container } = render(<ToastContainer />);

    // Find the toast wrapper div that has onMouseEnter (the w-[360px] element)
    const toastEl = container.querySelector(".w-\\[360px\\]") as HTMLElement;
    expect(toastEl).toBeInTheDocument();

    // Advance part of the duration
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // Hover to pause
    fireEvent.mouseEnter(toastEl);
    // Advance well past the total duration — should NOT dismiss while paused
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByText("Hover me")).toBeInTheDocument();

    vi.useRealTimers();
  });
});
