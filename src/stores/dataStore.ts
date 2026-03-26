import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Proje, Aksiyon, TagDefinition } from "@/types";
import {
  getInitialProjeler,
  getInitialAksiyonlar,
  getInitialTagDefinitions,
  getInitialData,
} from "@/lib/data/mock-adapter";
import { DEFAULT_TAG_COLOR } from "@/config/tagColors";

interface DataState {
  projeler: Proje[];
  aksiyonlar: Aksiyon[];
  tagDefinitions: TagDefinition[];

  // CRUD — Proje
  addProje: (h: Omit<Proje, "id">) => void;
  updateProje: (id: string, data: Partial<Proje>) => void;
  deleteProje: (id: string) => boolean;

  // CRUD — Aksiyon
  addAksiyon: (a: Omit<Aksiyon, "id">) => void;
  updateAksiyon: (id: string, data: Partial<Aksiyon>) => void;
  deleteAksiyon: (id: string) => boolean;

  // CRUD — Tag Definitions
  addTagDefinition: (tag: Omit<TagDefinition, "id">) => TagDefinition;
  updateTagDefinition: (id: string, data: Partial<Omit<TagDefinition, "id">>) => void;
  deleteTagDefinition: (id: string) => void;
  renameTag: (oldName: string, newName: string) => void;

  // Selectors
  getProjeById: (id: string) => Proje | undefined;
  getAksiyonById: (id: string) => Aksiyon | undefined;
  getAksiyonlarByHedefId: (projeId: string) => Aksiyon[];
  getTagColor: (tagName: string) => string;
  getTagDefinitionByName: (tagName: string) => TagDefinition | undefined;
}

let counter = Date.now();
function uid(): string {
  counter += 1;
  return `gen-${counter}`;
}

/**
 * Systematic ID generation: O26-0001 for projeler, A26-0001 for aksiyonlar
 * Prefix: O (objective) or A (action)
 * Year: last 2 digits of year from startDate
 * Serial: 4-digit zero-padded, auto-incremented per year
 */
function generateSystematicId(
  prefix: "O" | "A",
  startDate: string,
  existingIds: string[]
): string {
  const year = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
  const yy = String(year).slice(-2);
  const yearPrefix = `${prefix}${yy}-`;

  // Find highest serial number for this year prefix
  let maxSerial = 0;
  for (const id of existingIds) {
    if (id.startsWith(yearPrefix)) {
      const serial = parseInt(id.slice(yearPrefix.length), 10);
      if (!isNaN(serial) && serial > maxSerial) maxSerial = serial;
    }
  }

  const nextSerial = String(maxSerial + 1).padStart(4, "0");
  return `${yearPrefix}${nextSerial}`;
}

const CURRENT_USER = "Cenk Şayli";
function now(): string {
  return new Date().toISOString();
}

/** Recalculate a Proje's progress from its aksiyonlar */
function recalcProjeProgress(
  projeler: Proje[],
  aksiyonlar: Aksiyon[],
  projeId: string
): Proje[] {
  const related = aksiyonlar.filter((a) => a.projeId === projeId);
  if (related.length === 0) return projeler;
  const avg = Math.round(
    related.reduce((sum, a) => sum + a.progress, 0) / related.length
  );
  const allAchieved = related.every((a) => a.status === "Achieved");
  return projeler.map((h) => {
    if (h.id !== projeId) return h;
    const updated: Partial<Proje> = { progress: avg };
    if (allAchieved && h.status !== "Achieved") {
      // Tüm aksiyonlar tamamlandı → proje otomatik tamamlanır
      updated.status = "Achieved";
      updated.completedAt = new Date().toISOString();
    } else if (!allAchieved && h.status === "Achieved") {
      // Bir aksiyon geri alındı → proje tamamlanmış statüsünden çıkar
      updated.status = "On Track";
      updated.completedAt = undefined;
    }
    return { ...h, ...updated };
  });
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      ...getInitialData(),
      tagDefinitions: getInitialTagDefinitions(),

      // Proje CRUD
      addProje: (h) =>
        set((s) => {
          const id = generateSystematicId("P", h.startDate, s.projeler.map((x) => x.id));
          return { projeler: [...s.projeler, { ...h, id, createdBy: h.createdBy ?? CURRENT_USER, createdAt: h.createdAt ?? now() }] };
        }),
      updateProje: (id, data) =>
        set((s) => ({
          projeler: s.projeler.map((h) => {
            if (h.id !== id) return h;
            const updated = { ...h, ...data };
            if (data.status === "Achieved" && h.status !== "Achieved") {
              updated.completedAt = new Date().toISOString();
            } else if (data.status && data.status !== "Achieved") {
              updated.completedAt = undefined;
            }
            return updated;
          }),
        })),
      deleteProje: (id) => {
        const state = get();
        if (state.aksiyonlar.some((a) => a.projeId === id)) return false;
        set((s) => ({ projeler: s.projeler.filter((h) => h.id !== id) }));
        return true;
      },

      // Aksiyon CRUD
      addAksiyon: (a) =>
        set((s) => {
          const id = generateSystematicId("A", a.startDate, s.aksiyonlar.map((x) => x.id));
          const newAksiyon: Aksiyon = { ...a, id, createdBy: a.createdBy ?? CURRENT_USER, createdAt: a.createdAt ?? now() };
          const aksiyonlar = [...s.aksiyonlar, newAksiyon];
          const projeler = recalcProjeProgress(s.projeler, aksiyonlar, newAksiyon.projeId);
          return { aksiyonlar, projeler };
        }),
      updateAksiyon: (id, data) =>
        set((s) => {
          const aksiyonlar = s.aksiyonlar.map((a) => {
            if (a.id !== id) return a;
            const updated = { ...a, ...data };
            if (data.status === "Achieved" && a.status !== "Achieved") {
              updated.completedAt = new Date().toISOString();
            } else if (data.status && data.status !== "Achieved") {
              updated.completedAt = undefined;
            }
            return updated;
          });
          // Recalc parent proje progress
          const aksiyon = aksiyonlar.find((a) => a.id === id);
          const projeler = aksiyon
            ? recalcProjeProgress(s.projeler, aksiyonlar, aksiyon.projeId)
            : s.projeler;
          return { aksiyonlar, projeler };
        }),
      deleteAksiyon: (id) => {
        const state = get();
        const aksiyon = state.aksiyonlar.find((a) => a.id === id);
        const aksiyonlar = state.aksiyonlar.filter((a) => a.id !== id);
        const projeler = aksiyon
          ? recalcProjeProgress(state.projeler, aksiyonlar, aksiyon.projeId)
          : state.projeler;
        set({ aksiyonlar, projeler });
        return true;
      },

      // Tag Definition CRUD
      addTagDefinition: (tag) => {
        const newTag: TagDefinition = { ...tag, id: uid() };
        set((s) => ({ tagDefinitions: [...s.tagDefinitions, newTag] }));
        return newTag;
      },
      updateTagDefinition: (id, data) =>
        set((s) => ({
          tagDefinitions: s.tagDefinitions.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),
      deleteTagDefinition: (id) =>
        set((s) => ({
          tagDefinitions: s.tagDefinitions.filter((t) => t.id !== id),
        })),
      renameTag: (oldName, newName) =>
        set((s) => ({
          // Update tag definition name
          tagDefinitions: s.tagDefinitions.map((t) =>
            t.name === oldName ? { ...t, name: newName } : t
          ),
          // Update all proje references
          projeler: s.projeler.map((h) =>
            h.tags?.includes(oldName)
              ? { ...h, tags: h.tags.map((t) => (t === oldName ? newName : t)) }
              : h
          ),
        })),

      // Selectors
      getProjeById: (id) => get().projeler.find((h) => h.id === id),
      getAksiyonById: (id) => get().aksiyonlar.find((a) => a.id === id),
      getAksiyonlarByHedefId: (projeId) =>
        get().aksiyonlar.filter((a) => a.projeId === projeId),
      getTagColor: (tagName) => {
        const def = get().tagDefinitions.find(
          (t) => t.name.toLocaleLowerCase("tr") === tagName.toLocaleLowerCase("tr")
        );
        return def?.color ?? DEFAULT_TAG_COLOR;
      },
      getTagDefinitionByName: (tagName) =>
        get().tagDefinitions.find(
          (t) => t.name.toLocaleLowerCase("tr") === tagName.toLocaleLowerCase("tr")
        ),
    }),
    {
      name: "tyro-data-store-v5",
      skipHydration: true,
    }
  )
);

// Manual hydrate — prevents infinite loop with useSyncExternalStore
if (typeof window !== "undefined") {
  useDataStore.persist.rehydrate();
}
