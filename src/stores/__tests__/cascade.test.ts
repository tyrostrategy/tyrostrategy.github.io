import { describe, it, expect, beforeEach, vi } from "vitest";
import { useDataStore } from "../dataStore";

// Mock the mock-adapter to return empty arrays (clean slate)
vi.mock("@/lib/data/mock-adapter", () => ({
  getInitialProjeler: () => [],
  getInitialAksiyonlar: () => [],
  getInitialData: () => ({ projeler: [], aksiyonlar: [] }),
  getInitialTagDefinitions: () => [],
}));

beforeEach(() => {
  useDataStore.setState({
    projeler: [],
    aksiyonlar: [],
  });
});

describe("cascade delete protection", () => {
  describe("proje → aksiyon cascade", () => {
    it("deleteProje returns false when proje has child aksiyonlar", () => {
      // Create a proje
      useDataStore.getState().addProje({
        name: "Test Proje",
        source: "Kurumsal",
        status: "On Track",
        owner: "Owner",
        participants: ["Owner"],
        department: "IT",
        progress: 0,
        startDate: "2024-01-01",
        endDate: "2024-06-30",
      });

      const projeId = useDataStore.getState().projeler[0].id;

      // Add an aksiyon under it
      useDataStore.getState().addAksiyon({
        projeId,
        name: "Child Aksiyon",
        owner: "Worker",
        progress: 0,
        status: "Not Started",
        startDate: "2024-01-01",
        endDate: "2024-03-31",
      });

      // Attempt to delete the proje — should fail
      const result = useDataStore.getState().deleteProje(projeId);
      expect(result).toBe(false);

      // Proje should still exist
      expect(useDataStore.getState().projeler).toHaveLength(1);
    });

    it("deleteProje returns true after child aksiyon is deleted", () => {
      // Create proje
      useDataStore.getState().addProje({
        name: "Test Proje",
        source: "Kurumsal",
        status: "On Track",
        owner: "Owner",
        participants: ["Owner"],
        department: "IT",
        progress: 0,
        startDate: "2024-01-01",
        endDate: "2024-06-30",
      });

      const projeId = useDataStore.getState().projeler[0].id;

      // Add aksiyon
      useDataStore.getState().addAksiyon({
        projeId,
        name: "Child Aksiyon",
        owner: "Worker",
        progress: 0,
        status: "Not Started",
        startDate: "2024-01-01",
        endDate: "2024-03-31",
      });

      const aksiyonId = useDataStore.getState().aksiyonlar[0].id;

      // Delete the aksiyon first
      useDataStore.getState().deleteAksiyon(aksiyonId);
      expect(useDataStore.getState().aksiyonlar).toHaveLength(0);

      // Now deleteProje should succeed
      const result = useDataStore.getState().deleteProje(projeId);
      expect(result).toBe(true);
      expect(useDataStore.getState().projeler).toHaveLength(0);
    });
  });

  describe("aksiyon delete", () => {
    it("deleteAksiyon always returns true (no cascade protection)", () => {
      useDataStore.getState().addAksiyon({
        projeId: "p1",
        name: "Test Aksiyon",
        owner: "Worker",
        progress: 0,
        status: "Not Started",
        startDate: "2024-01-01",
        endDate: "2024-03-31",
      });

      const aksiyonId = useDataStore.getState().aksiyonlar[0].id;
      const result = useDataStore.getState().deleteAksiyon(aksiyonId);
      expect(result).toBe(true);
      expect(useDataStore.getState().aksiyonlar).toHaveLength(0);
    });
  });

  describe("full cascade chain", () => {
    it("proje with aksiyonlar: must delete aksiyonlar first", () => {
      // Build the chain
      useDataStore.getState().addProje({
        name: "Root Proje",
        source: "International",
        status: "On Track",
        owner: "Owner",
        participants: ["Owner"],
        department: "IT",
        progress: 0,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
      const projeId = useDataStore.getState().projeler[0].id;

      useDataStore.getState().addAksiyon({
        projeId,
        name: "Leaf Aksiyon",
        owner: "Worker",
        progress: 0,
        status: "Not Started",
        startDate: "2024-01-01",
        endDate: "2024-03-31",
      });
      const aksiyonId = useDataStore.getState().aksiyonlar[0].id;

      // Cannot delete proje (has aksiyon)
      expect(useDataStore.getState().deleteProje(projeId)).toBe(false);

      // Delete aksiyon first
      expect(useDataStore.getState().deleteAksiyon(aksiyonId)).toBe(true);
      // Now can delete proje
      expect(useDataStore.getState().deleteProje(projeId)).toBe(true);

      // Everything is gone
      expect(useDataStore.getState().projeler).toHaveLength(0);
      expect(useDataStore.getState().aksiyonlar).toHaveLength(0);
    });
  });
});
