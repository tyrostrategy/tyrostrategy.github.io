import { describe, it, expect } from "vitest";
import { progressColor, hexToHSL } from "../colorUtils";

describe("progressColor", () => {
  it("returns emerald (#10b981) for 100%", () => {
    expect(progressColor(100)).toBe("#10b981");
  });

  it("returns emerald (#10b981) for values above 100%", () => {
    expect(progressColor(150)).toBe("#10b981");
  });

  it("returns emerald (#10b981) for 76-99%", () => {
    expect(progressColor(76)).toBe("#10b981");
    expect(progressColor(99)).toBe("#10b981");
  });

  it("returns yellow (#eab308) for 51-75%", () => {
    expect(progressColor(51)).toBe("#eab308");
    expect(progressColor(75)).toBe("#eab308");
  });

  it("returns amber (#f59e0b) for 26-50%", () => {
    expect(progressColor(26)).toBe("#f59e0b");
    expect(progressColor(50)).toBe("#f59e0b");
  });

  it("returns red (#ef4444) for 1-25%", () => {
    expect(progressColor(1)).toBe("#ef4444");
    expect(progressColor(25)).toBe("#ef4444");
  });

  it("returns slate (#94a3b8) for 0%", () => {
    expect(progressColor(0)).toBe("#94a3b8");
  });

  it("returns red for negative values", () => {
    expect(progressColor(-10)).toBe("#ef4444");
  });
});

describe("hexToHSL", () => {
  it("converts pure red (#ff0000)", () => {
    expect(hexToHSL("#ff0000")).toBe("0 100% 50%");
  });

  it("converts pure green (#00ff00)", () => {
    expect(hexToHSL("#00ff00")).toBe("120 100% 50%");
  });

  it("converts pure blue (#0000ff)", () => {
    expect(hexToHSL("#0000ff")).toBe("240 100% 50%");
  });

  it("converts white (#ffffff) as achromatic", () => {
    expect(hexToHSL("#ffffff")).toBe("0 0% 100%");
  });

  it("converts black (#000000) as achromatic", () => {
    expect(hexToHSL("#000000")).toBe("0 0% 0%");
  });

  it("converts a mid-grey (#808080) as achromatic", () => {
    const result = hexToHSL("#808080");
    expect(result).toBe("0 0% 50%");
  });

  it("converts a typical color (#fb923c)", () => {
    const result = hexToHSL("#fb923c");
    // Should produce an HSL string with three space-separated parts
    const parts = result.split(" ");
    expect(parts).toHaveLength(3);
    expect(parts[1]).toContain("%");
    expect(parts[2]).toContain("%");
  });
});
