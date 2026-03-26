import { describe, it, expect, beforeEach } from "vitest";
import { useDataStore } from "../dataStore";

// Reset the store before each test to avoid shared state
beforeEach(() => {
  // Clear all items for a clean slate
  useDataStore.setState({
    projeler: [],
    projeler: [],
    gorevler: [],
  });
});

describe("Proje CRUD", () => {
  it("addProje adds a new proje with generated id", () => {
    useDataStore.getState().addProje({
      name: "Test Proje",
      source: "Kurumsal",
      status: "On Track",
      leader: "Test Leader",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });

    const projeler = useDataStore.getState().projeler;
    expect(projeler).toHaveLength(1);
    expect(projeler[0].name).toBe("Test Proje");
    expect(projeler[0].id).toBeTruthy();
    expect(projeler[0].id).toMatch(/^gen-/);
  });

  it("updateProje updates an existing proje", () => {
    useDataStore.getState().addProje({
      name: "Original",
      source: "Türkiye",
      status: "Not Started",
      leader: "Leader",
      startDate: "2024-01-01",
      endDate: "2024-06-30",
    });

    const id = useDataStore.getState().projeler[0].id;
    useDataStore.getState().updateProje(id, { name: "Updated", status: "Achieved" });

    const updated = useDataStore.getState().projeler[0];
    expect(updated.name).toBe("Updated");
    expect(updated.status).toBe("Achieved");
    expect(updated.leader).toBe("Leader"); // unchanged field
  });

  it("deleteProje removes a proje by id", () => {
    useDataStore.getState().addProje({
      name: "To Delete",
      source: "International",
      status: "Behind",
      leader: "Leader",
      startDate: "2024-01-01",
      endDate: "2024-06-30",
    });

    const id = useDataStore.getState().projeler[0].id;
    expect(useDataStore.getState().projeler).toHaveLength(1);

    useDataStore.getState().deleteProje(id);
    expect(useDataStore.getState().projeler).toHaveLength(0);
  });

  it("getHedefById returns the correct proje", () => {
    useDataStore.getState().addProje({
      name: "Find Me",
      source: "Kurumsal",
      status: "On Track",
      leader: "Leader",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });

    const id = useDataStore.getState().projeler[0].id;
    const found = useDataStore.getState().getHedefById(id);
    expect(found).toBeDefined();
    expect(found!.name).toBe("Find Me");
  });

  it("getHedefById returns undefined for nonexistent id", () => {
    expect(useDataStore.getState().getHedefById("nonexistent")).toBeUndefined();
  });
});

describe("Proje CRUD", () => {
  it("addProje adds a new proje with generated id", () => {
    useDataStore.getState().addProje({
      projeId: "h1",
      name: "Test Proje",
      department: "IT",
      projectLeader: "Leader",
      participants: ["Leader"],
      startDate: "2024-01-01",
      endDate: "2024-06-30",
      status: "On Track",
      progress: 50,
    });

    const projeler = useDataStore.getState().projeler;
    expect(projeler).toHaveLength(1);
    expect(projeler[0].name).toBe("Test Proje");
    expect(projeler[0].id).toMatch(/^gen-/);
    expect(projeler[0].projeId).toBe("h1");
  });

  it("updateProje updates an existing proje", () => {
    useDataStore.getState().addProje({
      projeId: "h1",
      name: "Original Proje",
      department: "HR",
      projectLeader: "Leader",
      participants: [],
      startDate: "2024-01-01",
      endDate: "2024-06-30",
      status: "Not Started",
      progress: 0,
    });

    const id = useDataStore.getState().projeler[0].id;
    useDataStore.getState().updateProje(id, { progress: 75, status: "On Track" });

    const updated = useDataStore.getState().projeler[0];
    expect(updated.progress).toBe(75);
    expect(updated.status).toBe("On Track");
    expect(updated.name).toBe("Original Proje");
  });

  it("deleteProje removes a proje by id", () => {
    useDataStore.getState().addProje({
      projeId: "h1",
      name: "To Delete",
      department: "IT",
      projectLeader: "Leader",
      participants: [],
      startDate: "2024-01-01",
      endDate: "2024-06-30",
      status: "On Track",
      progress: 0,
    });

    const id = useDataStore.getState().projeler[0].id;
    useDataStore.getState().deleteProje(id);
    expect(useDataStore.getState().projeler).toHaveLength(0);
  });

  it("getProjelerByHedefId returns matching projeler", () => {
    useDataStore.getState().addProje({
      projeId: "h1",
      name: "Proje A",
      department: "IT",
      projectLeader: "Leader",
      participants: [],
      startDate: "2024-01-01",
      endDate: "2024-06-30",
      status: "On Track",
      progress: 0,
    });
    useDataStore.getState().addProje({
      projeId: "h2",
      name: "Proje B",
      department: "HR",
      projectLeader: "Leader",
      participants: [],
      startDate: "2024-01-01",
      endDate: "2024-06-30",
      status: "On Track",
      progress: 0,
    });

    const result = useDataStore.getState().getProjelerByHedefId("h1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Proje A");
  });
});

describe("Gorev CRUD", () => {
  it("addGorev adds a new gorev with generated id", () => {
    useDataStore.getState().addGorev({
      projeId: "p1",
      name: "Test Gorev",
      progress: 0,
      status: "Not Started",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });

    const gorevler = useDataStore.getState().gorevler;
    expect(gorevler).toHaveLength(1);
    expect(gorevler[0].name).toBe("Test Gorev");
    expect(gorevler[0].id).toMatch(/^gen-/);
    expect(gorevler[0].projeId).toBe("p1");
  });

  it("updateGorev updates an existing gorev", () => {
    useDataStore.getState().addGorev({
      projeId: "p1",
      name: "Original Gorev",
      progress: 0,
      status: "Not Started",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });

    const id = useDataStore.getState().gorevler[0].id;
    useDataStore.getState().updateGorev(id, { progress: 100, status: "Achieved" });

    const updated = useDataStore.getState().gorevler[0];
    expect(updated.progress).toBe(100);
    expect(updated.status).toBe("Achieved");
    expect(updated.name).toBe("Original Gorev");
  });

  it("deleteGorev removes a gorev by id", () => {
    useDataStore.getState().addGorev({
      projeId: "p1",
      name: "To Delete",
      progress: 0,
      status: "Not Started",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });

    const id = useDataStore.getState().gorevler[0].id;
    useDataStore.getState().deleteGorev(id);
    expect(useDataStore.getState().gorevler).toHaveLength(0);
  });

  it("getGorevlerByProjeId returns matching gorevler", () => {
    useDataStore.getState().addGorev({
      projeId: "p1",
      name: "Gorev A",
      progress: 0,
      status: "Not Started",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });
    useDataStore.getState().addGorev({
      projeId: "p2",
      name: "Gorev B",
      progress: 50,
      status: "On Track",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });

    const result = useDataStore.getState().getGorevlerByProjeId("p1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Gorev A");
  });
});
