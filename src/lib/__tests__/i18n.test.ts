import { describe, it, expect, beforeEach } from "vitest";
import i18n from "../i18n";

beforeEach(async () => {
  // Reset to Turkish before each test
  await i18n.changeLanguage("tr");
});

describe("i18n setup", () => {
  describe("default language", () => {
    it("default language is 'tr'", () => {
      // After reset, language should be tr
      expect(i18n.language).toBe("tr");
    });
  });

  describe("language switching", () => {
    it("changing language to 'en' works", async () => {
      await i18n.changeLanguage("en");
      expect(i18n.language).toBe("en");
    });

    it("changing back to 'tr' works", async () => {
      await i18n.changeLanguage("en");
      expect(i18n.language).toBe("en");
      await i18n.changeLanguage("tr");
      expect(i18n.language).toBe("tr");
    });
  });

  describe("translation keys exist", () => {
    it("status keys exist in Turkish", () => {
      expect(i18n.t("status.onTrack", { lng: "tr" })).toBe("Yolunda");
      expect(i18n.t("status.achieved", { lng: "tr" })).toBe("Tamamlandı");
      expect(i18n.t("status.behind", { lng: "tr" })).toBe("Gecikmeli");
      expect(i18n.t("status.atRisk", { lng: "tr" })).toBe("Risk Altında");
      expect(i18n.t("status.notStarted", { lng: "tr" })).toBe("Başlanmadı");
    });

    it("status keys exist in English", () => {
      expect(i18n.t("status.onTrack", { lng: "en" })).toBe("On Track");
      expect(i18n.t("status.achieved", { lng: "en" })).toBe("Achieved");
      expect(i18n.t("status.behind", { lng: "en" })).toBe("Behind");
      expect(i18n.t("status.atRisk", { lng: "en" })).toBe("At Risk");
      expect(i18n.t("status.notStarted", { lng: "en" })).toBe("Not Started");
    });

    it("role keys exist in Turkish", () => {
      expect(i18n.t("roles.admin", { lng: "tr" })).toBe("Admin");
      expect(i18n.t("roles.projectLeader", { lng: "tr" })).toBe("Proje Lideri");
      expect(i18n.t("roles.user", { lng: "tr" })).toBe("Kullanıcı");
    });

    it("role keys exist in English", () => {
      expect(i18n.t("roles.admin", { lng: "en" })).toBe("Admin");
      expect(i18n.t("roles.projectLeader", { lng: "en" })).toBe("Objective Leader");
      expect(i18n.t("roles.user", { lng: "en" })).toBe("User");
    });

    it("nav keys exist in both languages", () => {
      expect(i18n.t("nav.home", { lng: "tr" })).toBe("Anasayfa");
      expect(i18n.t("nav.home", { lng: "en" })).toBe("Home");
    });
  });

  describe("status labels translate correctly", () => {
    it("'On Track' status translates to 'Yolunda' in Turkish", () => {
      expect(i18n.t("status.onTrack", { lng: "tr" })).toBe("Yolunda");
    });

    it("'On Track' status translates to 'On Track' in English", () => {
      expect(i18n.t("status.onTrack", { lng: "en" })).toBe("On Track");
    });

    it("'Achieved' status translates correctly in both languages", () => {
      expect(i18n.t("status.achieved", { lng: "tr" })).toBe("Tamamlandı");
      expect(i18n.t("status.achieved", { lng: "en" })).toBe("Achieved");
    });

    it("'Behind' status translates correctly in both languages", () => {
      expect(i18n.t("status.behind", { lng: "tr" })).toBe("Gecikmeli");
      expect(i18n.t("status.behind", { lng: "en" })).toBe("Behind");
    });

    it("'At Risk' status translates correctly in both languages", () => {
      expect(i18n.t("status.atRisk", { lng: "tr" })).toBe("Risk Altında");
      expect(i18n.t("status.atRisk", { lng: "en" })).toBe("At Risk");
    });

    it("'Not Started' status translates correctly in both languages", () => {
      expect(i18n.t("status.notStarted", { lng: "tr" })).toBe("Başlanmadı");
      expect(i18n.t("status.notStarted", { lng: "en" })).toBe("Not Started");
    });
  });
});
