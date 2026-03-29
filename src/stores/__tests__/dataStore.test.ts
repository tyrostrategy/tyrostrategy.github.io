import { describe, it, expect, beforeEach, vi } from "vitest";
import { useDataStore } from "../dataStore";

// Mock mock-adapter
vi.mock("@/lib/data/mock-adapter", () => ({
  getInitialProjeler: () => [],
  getInitialAksiyonlar: () => [],
  getInitialData: () => ({ projeler: [], aksiyonlar: [] }),
  getInitialTagDefinitions: () => [],
}));

// Reset the store before each test to avoid shared state
beforeEach(() => {
  useDataStore.setState({
    projeler: [],
    aksiyonlar: [],
  });
});

describe("Proje CRUD", () => {
  it("addProje adds a new proje with generated id", () => {
    useDataStore.getState().addProje({
      name: "Test Proje",
      source: "Kurumsal",
      status: "On Track",
      owner: "Test Owner",
      participants: ["Test Owner"],
      department: "IT",
      progress: 0,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });

    const projeler = useDataStore.getState().projeler;
    expect(projeler).toHaveLength(1);
    expect(projeler[0].name).toBe("Test Proje");
    expect(projeler[0].id).toBeTruthy();
    expect(projeler[0].id).toMatch(/^P\d{2}-\d{4}$/);
  });

  it("updateProje updates an existing proje", () => {
    useDataStore.getState().addProje({
      name: "Original",
      source: "Türkiye",
      status: "Not Started",
      owner: "Owner",
      participants: ["Owner"],
      department: "IT",
      progress: 0,
      startDate: "2024-01-01",
      endDate: "2024-06-30",
    });

    const id = useDataStore.getState().projeler[0].id;
    useDataStore.getState().updateProje(id, { name: "Updated", status: "Achieved" });

    const updated = useDataStore.getState().projeler[0];
    expect(updated.name).toBe("Updated");
    expect(updated.status).toBe("Achieved");
    expect(updated.owner).toBe("Owner"); // unchanged field
  });

  it("deleteProje removes a proje by id (when no child aksiyonlar)", () => {
    useDataStore.getState().addProje({
      name: "To Delete",
      source: "International",
      status: "Behind",
      owner: "Owner",
      participants: ["Owner"],
      department: "IT",
      progress: 0,
      startDate: "2024-01-01",
      endDate: "2024-06-30",
    });

    const id = useDataStore.getState().projeler[0].id;
    expect(useDataStore.getState().projeler).toHaveLength(1);

    useDataStore.getState().deleteProje(id);
    expect(useDataStore.getState().projeler).toHaveLength(0);
  });

  it("getProjeById returns the correct proje", () => {
    useDataStore.getState().addProje({
      name: "Find Me",
      source: "Kurumsal",
      status: "On Track",
      owner: "Owner",
      participants: ["Owner"],
      department: "IT",
      progress: 0,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });

    const id = useDataStore.getState().projeler[0].id;
    const found = useDataStore.getState().getProjeById(id);
    expect(found).toBeDefined();
    expect(found!.name).toBe("Find Me");
  });

  it("getProjeById returns undefined for nonexistent id", () => {
    expect(useDataStore.getState().getProjeById("nonexistent")).toBeUndefined();
  });
});

describe("Aksiyon CRUD", () => {
  it("addAksiyon adds a new aksiyon with generated id", () => {
    useDataStore.getState().addAksiyon({
      projeId: "p1",
      name: "Test Aksiyon",
      owner: "Worker",
      progress: 0,
      status: "Not Started",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });

    const aksiyonlar = useDataStore.getState().aksiyonlar;
    expect(aksiyonlar).toHaveLength(1);
    expect(aksiyonlar[0].name).toBe("Test Aksiyon");
    expect(aksiyonlar[0].id).toMatch(/^A\d{2}-\d{4}$/);
    expect(aksiyonlar[0].projeId).toBe("p1");
  });

  it("updateAksiyon updates an existing aksiyon", () => {
    useDataStore.getState().addAksiyon({
      projeId: "p1",
      name: "Original Aksiyon",
      owner: "Worker",
      progress: 0,
      status: "Not Started",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });

    const id = useDataStore.getState().aksiyonlar[0].id;
    useDataStore.getState().updateAksiyon(id, { progress: 100, status: "Achieved" });

    const updated = useDataStore.getState().aksiyonlar[0];
    expect(updated.progress).toBe(100);
    expect(updated.status).toBe("Achieved");
    expect(updated.name).toBe("Original Aksiyon");
  });

  it("deleteAksiyon removes an aksiyon by id", () => {
    useDataStore.getState().addAksiyon({
      projeId: "p1",
      name: "To Delete",
      owner: "Worker",
      progress: 0,
      status: "Not Started",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });

    const id = useDataStore.getState().aksiyonlar[0].id;
    useDataStore.getState().deleteAksiyon(id);
    expect(useDataStore.getState().aksiyonlar).toHaveLength(0);
  });

  it("getAksiyonlarByHedefId returns matching aksiyonlar", () => {
    useDataStore.getState().addAksiyon({
      projeId: "p1",
      name: "Aksiyon A",
      owner: "Worker",
      progress: 0,
      status: "Not Started",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });
    useDataStore.getState().addAksiyon({
      projeId: "p2",
      name: "Aksiyon B",
      owner: "Worker",
      progress: 50,
      status: "On Track",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });

    const result = useDataStore.getState().getAksiyonlarByHedefId("p1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Aksiyon A");
  });
});
