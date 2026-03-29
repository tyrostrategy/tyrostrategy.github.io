import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoleAvatar } from "../ui/RoleAvatar";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("RoleAvatar", () => {
  describe("initials", () => {
    it("renders correct initials for 'Cenk Şayli' -> 'CŞ'", () => {
      render(<RoleAvatar name="Cenk Şayli" role="Admin" />);
      expect(screen.getByText("CŞ")).toBeInTheDocument();
    });

    it("renders correct initials for 'Kemal Yıldız' -> 'KY'", () => {
      render(<RoleAvatar name="Kemal Yıldız" role="Proje Lideri" />);
      expect(screen.getByText("KY")).toBeInTheDocument();
    });

    it("renders correct initials for single name 'Admin' -> 'A'", () => {
      render(<RoleAvatar name="Admin" role="Admin" />);
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("limits initials to 2 characters for 3-word name", () => {
      render(<RoleAvatar name="İdris İlhan Telci" role="Kullanıcı" />);
      expect(screen.getByText("İİ")).toBeInTheDocument();
    });
  });

  describe("role-based border styling", () => {
    it("Admin has gold gradient border (conic-gradient)", () => {
      const { container } = render(<RoleAvatar name="Test User" role="Admin" />);
      const ring = container.querySelector(".role-ring-admin");
      expect(ring).toBeInTheDocument();
      expect(ring?.getAttribute("style")).toContain("conic-gradient");
    });

    it("Proje Lideri has blue gradient border", () => {
      const { container } = render(<RoleAvatar name="Test User" role="Proje Lideri" />);
      // The ring div is the first child of the flex container, with borderWidth padding and gradient background
      const ringDiv = container.querySelector("[style*='border-radius: 50%']") as HTMLElement;
      expect(ringDiv).toBeInTheDocument();
      expect(ringDiv?.style.background).toContain("linear-gradient");
      // jsdom converts hex to rgb, so check for the rgb equivalent of #1e40af
      expect(ringDiv?.style.background).toContain("rgb(30, 64, 175)");
    });

    it("Kullanıcı has gray gradient border", () => {
      const { container } = render(<RoleAvatar name="Test User" role="Kullanıcı" />);
      const ringDiv = container.querySelector("[style*='border-radius: 50%']") as HTMLElement;
      expect(ringDiv).toBeInTheDocument();
      expect(ringDiv?.style.background).toContain("linear-gradient");
      // jsdom converts hex to rgb, so check for the rgb equivalent of #64748b
      expect(ringDiv?.style.background).toContain("rgb(100, 116, 139)");
    });
  });

  describe("showBadge", () => {
    it("shows role badge when showBadge is true", () => {
      render(<RoleAvatar name="Test User" role="Admin" showBadge />);
      // getRoleLabel returns t("roles.admin") which in mock returns "roles.admin"
      expect(screen.getByText("roles.admin")).toBeInTheDocument();
    });

    it("does not show badge when showBadge is false (default)", () => {
      render(<RoleAvatar name="Test User" role="Admin" />);
      expect(screen.queryByText("roles.admin")).not.toBeInTheDocument();
    });
  });

  describe("sizes", () => {
    it("sm size renders 32px inner circle", () => {
      const { container } = render(<RoleAvatar name="Test" role="Admin" size="sm" />);
      const inner = container.querySelector("[style*='width: 32px']") as HTMLElement;
      expect(inner).toBeInTheDocument();
      expect(inner?.style.width).toBe("32px");
      expect(inner?.style.height).toBe("32px");
    });

    it("md size renders 40px inner circle", () => {
      const { container } = render(<RoleAvatar name="Test" role="Admin" size="md" />);
      const inner = container.querySelector("[style*='width: 40px']") as HTMLElement;
      expect(inner).toBeInTheDocument();
      expect(inner?.style.width).toBe("40px");
      expect(inner?.style.height).toBe("40px");
    });

    it("lg size renders 56px inner circle", () => {
      const { container } = render(<RoleAvatar name="Test" role="Admin" size="lg" />);
      const inner = container.querySelector("[style*='width: 56px']") as HTMLElement;
      expect(inner).toBeInTheDocument();
      expect(inner?.style.width).toBe("56px");
      expect(inner?.style.height).toBe("56px");
    });
  });

  describe("Admin glow animation", () => {
    it("renders style tag with animation keyframes for Admin", () => {
      const { container } = render(<RoleAvatar name="Test" role="Admin" />);
      const styleTag = container.querySelector("style");
      expect(styleTag).toBeInTheDocument();
      expect(styleTag?.textContent).toContain("admin-ring-glow");
    });

    it("does not render style tag for non-Admin roles", () => {
      const { container } = render(<RoleAvatar name="Test" role="Kullanıcı" />);
      const styleTag = container.querySelector("style");
      expect(styleTag).not.toBeInTheDocument();
    });
  });
});
