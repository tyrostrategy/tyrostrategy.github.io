import { describe, it, expect } from "vitest";
import {
  getStatusLabel,
  getStatusOptions,
  getSourceOptions,
  getRoleLabel,
} from "../constants";
import type { EntityStatus, Source, UserRole } from "@/types";

// Simple t function mock that returns the key as-is
const t = (key: string) => key;

describe("getStatusLabel", () => {
  it("returns translated label for 'On Track'", () => {
    expect(getStatusLabel("On Track", t)).toBe("status.onTrack");
  });

  it("returns translated label for 'Achieved'", () => {
    expect(getStatusLabel("Achieved", t)).toBe("status.achieved");
  });

  it("returns translated label for 'Behind'", () => {
    expect(getStatusLabel("Behind", t)).toBe("status.behind");
  });

  it("returns translated label for 'At Risk'", () => {
    expect(getStatusLabel("At Risk", t)).toBe("status.atRisk");
  });

  it("returns translated label for 'Not Started'", () => {
    expect(getStatusLabel("Not Started", t)).toBe("status.notStarted");
  });

  it("returns correct keys for all 5 statuses", () => {
    const statuses: EntityStatus[] = [
      "On Track",
      "Achieved",
      "Behind",
      "At Risk",
      "Not Started",
    ];
    const expectedKeys = [
      "status.onTrack",
      "status.achieved",
      "status.behind",
      "status.atRisk",
      "status.notStarted",
    ];

    statuses.forEach((status, i) => {
      expect(getStatusLabel(status, t)).toBe(expectedKeys[i]);
    });
  });
});

describe("getStatusOptions", () => {
  it("returns array of 7 status options", () => {
    const options = getStatusOptions(t);
    expect(options).toHaveLength(7);
  });

  it("each option has key and label properties", () => {
    const options = getStatusOptions(t);
    options.forEach((option) => {
      expect(option).toHaveProperty("key");
      expect(option).toHaveProperty("label");
    });
  });

  it("contains all status keys", () => {
    const options = getStatusOptions(t);
    const keys = options.map((o) => o.key);
    expect(keys).toContain("On Track");
    expect(keys).toContain("At Risk");
    expect(keys).toContain("Behind");
    expect(keys).toContain("Achieved");
    expect(keys).toContain("Not Started");
  });

  it("labels are i18n keys", () => {
    const options = getStatusOptions(t);
    const labels = options.map((o) => o.label);
    expect(labels).toContain("status.onTrack");
    expect(labels).toContain("status.atRisk");
    expect(labels).toContain("status.behind");
    expect(labels).toContain("status.achieved");
    expect(labels).toContain("status.notStarted");
  });
});

describe("getSourceOptions", () => {
  it("returns array of 3 source options", () => {
    const options = getSourceOptions(t);
    expect(options).toHaveLength(3);
  });

  it("contains Türkiye, Kurumsal, International", () => {
    const options = getSourceOptions(t);
    const keys = options.map((o) => o.key);
    expect(keys).toContain("Türkiye");
    expect(keys).toContain("Kurumsal");
    expect(keys).toContain("International");
  });

  it("each option has key and label", () => {
    const options = getSourceOptions(t);
    options.forEach((option) => {
      expect(option).toHaveProperty("key");
      expect(option).toHaveProperty("label");
      expect(typeof option.key).toBe("string");
      expect(typeof option.label).toBe("string");
    });
  });
});

describe("getRoleLabel", () => {
  it("returns translated label for Admin", () => {
    expect(getRoleLabel("Admin", t)).toBe("roles.admin");
  });

  it("returns translated label for Proje Lideri", () => {
    expect(getRoleLabel("Proje Lideri", t)).toBe("roles.projectLeader");
  });

  it("returns translated label for Kullanıcı", () => {
    expect(getRoleLabel("Kullanıcı", t)).toBe("roles.user");
  });

  it("returns correct keys for all 3 roles", () => {
    const roles: UserRole[] = ["Admin", "Proje Lideri", "Kullanıcı"];
    const expectedKeys = ["roles.admin", "roles.projectLeader", "roles.user"];

    roles.forEach((role, i) => {
      expect(getRoleLabel(role, t)).toBe(expectedKeys[i]);
    });
  });
});
