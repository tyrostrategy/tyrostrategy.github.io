import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "../ui/StatusBadge";
import type { EntityStatus } from "@/types";

// Mock i18n — t returns the key
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "tr" } }),
}));

describe("StatusBadge", () => {
  const statuses: EntityStatus[] = ["On Track", "Achieved", "Behind", "At Risk", "Not Started"];

  it.each(statuses)("renders a label for status '%s'", (status) => {
    render(<StatusBadge status={status} />);
    // getStatusLabel calls t() with the status i18n key, so text content should exist
    const badge = screen.getByText(/status\./);
    expect(badge).toBeInTheDocument();
  });

  it("applies emerald classes for On Track status", () => {
    const { container } = render(<StatusBadge status="On Track" />);
    const outerSpan = container.querySelector("span.bg-emerald-50");
    expect(outerSpan).toBeInTheDocument();
    expect(outerSpan).toHaveClass("text-emerald-600");
    const dot = container.querySelector("span.bg-emerald-500");
    expect(dot).toBeInTheDocument();
  });

  it("applies blue classes for Achieved status", () => {
    const { container } = render(<StatusBadge status="Achieved" />);
    const outerSpan = container.querySelector("span.bg-blue-50");
    expect(outerSpan).toBeInTheDocument();
    expect(outerSpan).toHaveClass("text-blue-600");
    const dot = container.querySelector("span.bg-blue-500");
    expect(dot).toBeInTheDocument();
  });

  it("applies red classes for Behind status", () => {
    const { container } = render(<StatusBadge status="Behind" />);
    const outerSpan = container.querySelector("span.bg-red-50");
    expect(outerSpan).toBeInTheDocument();
    expect(outerSpan).toHaveClass("text-red-600");
    const dot = container.querySelector("span.bg-red-500");
    expect(dot).toBeInTheDocument();
  });

  it("applies amber classes for At Risk status", () => {
    const { container } = render(<StatusBadge status="At Risk" />);
    const outerSpan = container.querySelector("span.bg-amber-50");
    expect(outerSpan).toBeInTheDocument();
    expect(outerSpan).toHaveClass("text-amber-600");
    const dot = container.querySelector("span.bg-amber-500");
    expect(dot).toBeInTheDocument();
  });

  it("applies slate classes for Not Started status", () => {
    const { container } = render(<StatusBadge status="Not Started" />);
    const outerSpan = container.querySelector("span.bg-slate-100");
    expect(outerSpan).toBeInTheDocument();
    expect(outerSpan).toHaveClass("text-tyro-text-muted");
    const dot = container.querySelector("span.bg-slate-400");
    expect(dot).toBeInTheDocument();
  });

  it("renders with correct CSS structure (inline-flex, rounded-full, etc.)", () => {
    const { container } = render(<StatusBadge status="On Track" />);
    const outerSpan = container.firstElementChild as HTMLElement;
    expect(outerSpan).toHaveClass("inline-flex");
    expect(outerSpan).toHaveClass("rounded-full");
    expect(outerSpan).toHaveClass("font-semibold");
  });
});
