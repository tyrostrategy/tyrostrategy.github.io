import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Hedef, Aksiyon, TagDefinition } from "@/types";
import {
  getInitialHedefler,
  getInitialAksiyonlar,
  getInitialTagDefinitions,
} from "@/lib/data/mock-adapter";
import { DEFAULT_TAG_COLOR } from "@/config/tagColors";

interface DataState {
  hedefler: Hedef[];
  aksiyonlar: Aksiyon[];
  tagDefinitions: TagDefinition[];

  // CRUD — Hedef
  addHedef: (h: Omit<Hedef, "id">) => void;
  updateHedef: (id: string, data: Partial<Hedef>) => void;
  deleteHedef: (id: string) => boolean;

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
  getHedefById: (id: string) => Hedef | undefined;
  getAksiyonById: (id: string) => Aksiyon | undefined;
  getAksiyonlarByHedefId: (hedefId: string) => Aksiyon[];
  getTagColor: (tagName: string) => string;
  getTagDefinitionByName: (tagName: string) => TagDefinition | undefined;
}

let counter = Date.now();
function uid(): string {
  counter += 1;
  return `gen-${counter}`;
}

const CURRENT_USER = "Cenk Şayli";
function now(): string {
  return new Date().toISOString();
}

/** Recalculate a Hedef's progress from its aksiyonlar */
function recalcHedefProgress(
  hedefler: Hedef[],
  aksiyonlar: Aksiyon[],
  hedefId: string
): Hedef[] {
  const related = aksiyonlar.filter((a) => a.hedefId === hedefId);
  if (related.length === 0) return hedefler;
  const avg = Math.round(
    related.reduce((sum, a) => sum + a.progress, 0) / related.length
  );
  const allAchieved = related.every((a) => a.status === "Achieved");
  return hedefler.map((h) => {
    if (h.id !== hedefId) return h;
    const updated: Partial<Hedef> = { progress: avg };
    if (allAchieved && h.status !== "Achieved") {
      // Tüm aksiyonlar tamamlandı → hedef otomatik tamamlanır
      updated.status = "Achieved";
      updated.completedAt = new Date().toISOString();
    } else if (!allAchieved && h.status === "Achieved") {
      // Bir aksiyon geri alındı → hedef tamamlanmış statüsünden çıkar
      updated.status = "On Track";
      updated.completedAt = undefined;
    }
    return { ...h, ...updated };
  });
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      hedefler: getInitialHedefler(),
      aksiyonlar: getInitialAksiyonlar(),
      tagDefinitions: getInitialTagDefinitions(),

      // Hedef CRUD
      addHedef: (h) =>
        set((s) => ({ hedefler: [...s.hedefler, { ...h, id: uid(), createdBy: h.createdBy ?? CURRENT_USER, createdAt: h.createdAt ?? now() }] })),
      updateHedef: (id, data) =>
        set((s) => ({
          hedefler: s.hedefler.map((h) => {
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
      deleteHedef: (id) => {
        const state = get();
        if (state.aksiyonlar.some((a) => a.hedefId === id)) return false;
        set((s) => ({ hedefler: s.hedefler.filter((h) => h.id !== id) }));
        return true;
      },

      // Aksiyon CRUD
      addAksiyon: (a) =>
        set((s) => {
          const newAksiyon: Aksiyon = { ...a, id: uid(), createdBy: a.createdBy ?? CURRENT_USER, createdAt: a.createdAt ?? now() };
          const aksiyonlar = [...s.aksiyonlar, newAksiyon];
          const hedefler = recalcHedefProgress(s.hedefler, aksiyonlar, newAksiyon.hedefId);
          return { aksiyonlar, hedefler };
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
          // Recalc parent hedef progress
          const aksiyon = aksiyonlar.find((a) => a.id === id);
          const hedefler = aksiyon
            ? recalcHedefProgress(s.hedefler, aksiyonlar, aksiyon.hedefId)
            : s.hedefler;
          return { aksiyonlar, hedefler };
        }),
      deleteAksiyon: (id) => {
        const state = get();
        const aksiyon = state.aksiyonlar.find((a) => a.id === id);
        const aksiyonlar = state.aksiyonlar.filter((a) => a.id !== id);
        const hedefler = aksiyon
          ? recalcHedefProgress(state.hedefler, aksiyonlar, aksiyon.hedefId)
          : state.hedefler;
        set({ aksiyonlar, hedefler });
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
          // Update all hedef references
          hedefler: s.hedefler.map((h) =>
            h.tags?.includes(oldName)
              ? { ...h, tags: h.tags.map((t) => (t === oldName ? newName : t)) }
              : h
          ),
        })),

      // Selectors
      getHedefById: (id) => get().hedefler.find((h) => h.id === id),
      getAksiyonById: (id) => get().aksiyonlar.find((a) => a.id === id),
      getAksiyonlarByHedefId: (hedefId) =>
        get().aksiyonlar.filter((a) => a.hedefId === hedefId),
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
      name: "tyro-data-store-v3",
      skipHydration: true,
    }
  )
);

// Manual hydrate — prevents infinite loop with useSyncExternalStore
if (typeof window !== "undefined") {
  useDataStore.persist.rehydrate();
}
