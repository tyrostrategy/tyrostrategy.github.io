import { describe, it, expect, beforeEach } from "vitest";
import { useFilterStore } from "../filterStore";

beforeEach(() => {
  localStorage.clear();
  useFilterStore.setState({
    source: [],
    status: [],
    department: [],
    leader: [],
    dateFrom: "",
    dateTo: "",
    progressMin: 0,
    progressMax: 100,
  });
});

describe("filterStore", () => {
  describe("default values", () => {
    it("source defaults to empty array", () => {
      expect(useFilterStore.getState().source).toEqual([]);
    });

    it("status defaults to empty array", () => {
      expect(useFilterStore.getState().status).toEqual([]);
    });

    it("department defaults to empty array", () => {
      expect(useFilterStore.getState().department).toEqual([]);
    });

    it("leader defaults to empty array", () => {
      expect(useFilterStore.getState().leader).toEqual([]);
    });

    it("dateFrom defaults to empty string", () => {
      expect(useFilterStore.getState().dateFrom).toBe("");
    });

    it("dateTo defaults to empty string", () => {
      expect(useFilterStore.getState().dateTo).toBe("");
    });

    it("progressMin defaults to 0", () => {
      expect(useFilterStore.getState().progressMin).toBe(0);
    });

    it("progressMax defaults to 100", () => {
      expect(useFilterStore.getState().progressMax).toBe(100);
    });
  });

  describe("setSource", () => {
    it("sets source filter values", () => {
      useFilterStore.getState().setSource(["ERP", "CRM"]);
      expect(useFilterStore.getState().source).toEqual(["ERP", "CRM"]);
    });
  });

  describe("setStatus", () => {
    it("sets status filter values", () => {
      useFilterStore.getState().setStatus(["active", "completed"]);
      expect(useFilterStore.getState().status).toEqual(["active", "completed"]);
    });
  });

  describe("setDepartment", () => {
    it("sets department filter values", () => {
      useFilterStore.getState().setDepartment(["IT", "Finans"]);
      expect(useFilterStore.getState().department).toEqual(["IT", "Finans"]);
    });
  });

  describe("setLeader", () => {
    it("sets leader filter values", () => {
      useFilterStore.getState().setLeader(["Cenk", "Burcu"]);
      expect(useFilterStore.getState().leader).toEqual(["Cenk", "Burcu"]);
    });
  });

  describe("setDateFrom", () => {
    it("sets dateFrom value", () => {
      useFilterStore.getState().setDateFrom("2026-01-01");
      expect(useFilterStore.getState().dateFrom).toBe("2026-01-01");
    });
  });

  describe("setDateTo", () => {
    it("sets dateTo value", () => {
      useFilterStore.getState().setDateTo("2026-12-31");
      expect(useFilterStore.getState().dateTo).toBe("2026-12-31");
    });
  });

  describe("setProgressMin", () => {
    it("sets progressMin value", () => {
      useFilterStore.getState().setProgressMin(25);
      expect(useFilterStore.getState().progressMin).toBe(25);
    });
  });

  describe("setProgressMax", () => {
    it("sets progressMax value", () => {
      useFilterStore.getState().setProgressMax(75);
      expect(useFilterStore.getState().progressMax).toBe(75);
    });
  });

  describe("clearAll", () => {
    it("resets all filters to initial values", () => {
      useFilterStore.getState().setSource(["ERP"]);
      useFilterStore.getState().setStatus(["active"]);
      useFilterStore.getState().setDepartment(["IT"]);
      useFilterStore.getState().setLeader(["Cenk"]);
      useFilterStore.getState().setDateFrom("2026-01-01");
      useFilterStore.getState().setDateTo("2026-12-31");
      useFilterStore.getState().setProgressMin(10);
      useFilterStore.getState().setProgressMax(90);

      useFilterStore.getState().clearAll();

      const s = useFilterStore.getState();
      expect(s.source).toEqual([]);
      expect(s.status).toEqual([]);
      expect(s.department).toEqual([]);
      expect(s.leader).toEqual([]);
      expect(s.dateFrom).toBe("");
      expect(s.dateTo).toBe("");
      expect(s.progressMin).toBe(0);
      expect(s.progressMax).toBe(100);
    });
  });

  describe("activeCount", () => {
    it("returns 0 when no filters are active", () => {
      expect(useFilterStore.getState().activeCount()).toBe(0);
    });

    it("counts source as 1 active filter", () => {
      useFilterStore.getState().setSource(["ERP"]);
      expect(useFilterStore.getState().activeCount()).toBe(1);
    });

    it("counts status as 1 active filter", () => {
      useFilterStore.getState().setStatus(["active"]);
      expect(useFilterStore.getState().activeCount()).toBe(1);
    });

    it("counts department as 1 active filter", () => {
      useFilterStore.getState().setDepartment(["IT"]);
      expect(useFilterStore.getState().activeCount()).toBe(1);
    });

    it("counts leader as 1 active filter", () => {
      useFilterStore.getState().setLeader(["Cenk"]);
      expect(useFilterStore.getState().activeCount()).toBe(1);
    });

    it("counts dateFrom as 1 active filter", () => {
      useFilterStore.getState().setDateFrom("2026-01-01");
      expect(useFilterStore.getState().activeCount()).toBe(1);
    });

    it("counts dateTo as 1 active filter", () => {
      useFilterStore.getState().setDateTo("2026-12-31");
      expect(useFilterStore.getState().activeCount()).toBe(1);
    });

    it("counts progressMin > 0 as 1 active filter", () => {
      useFilterStore.getState().setProgressMin(10);
      expect(useFilterStore.getState().activeCount()).toBe(1);
    });

    it("counts progressMax < 100 as 1 active filter", () => {
      useFilterStore.getState().setProgressMax(90);
      expect(useFilterStore.getState().activeCount()).toBe(1);
    });

    it("counts multiple active filters correctly", () => {
      useFilterStore.getState().setSource(["ERP"]);
      useFilterStore.getState().setStatus(["active"]);
      useFilterStore.getState().setDateFrom("2026-01-01");
      useFilterStore.getState().setProgressMin(20);
      expect(useFilterStore.getState().activeCount()).toBe(4);
    });

    it("returns 0 after clearAll", () => {
      useFilterStore.getState().setSource(["ERP"]);
      useFilterStore.getState().setStatus(["active"]);
      useFilterStore.getState().clearAll();
      expect(useFilterStore.getState().activeCount()).toBe(0);
    });
  });
});
