import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Proje, Aksiyon, TagDefinition, AppUser } from "@/types";
import {
  getInitialProjeler,
  getInitialAksiyonlar,
  getInitialTagDefinitions,
  getInitialData,
} from "@/lib/data/mock-adapter";
import { DEFAULT_TAG_COLOR } from "@/config/tagColors";
import { supabaseAdapter } from "@/lib/data/supabaseAdapter";
import { toast } from "@/stores/toastStore";
import i18n from "@/lib/i18n";

const isSupabaseMode = import.meta.env.VITE_DATA_PROVIDER === "supabase";

/** Fire-and-forget Supabase sync — doesn't block UI, shows toast on failure */
function syncToSupabase(fn: () => Promise<unknown>) {
  if (!isSupabaseMode) return;
  fn().catch((err) => {
    console.error("[Supabase Sync]", err);
    toast.error(i18n.t("toast.syncFailed"));
  });
}

interface DataState {
  projeler: Proje[];
  aksiyonlar: Aksiyon[];
  tagDefinitions: TagDefinition[];
  users: AppUser[];

  // CRUD — Users
  addUser: (u: Omit<AppUser, "id" | "createdAt" | "updatedAt">) => void;
  updateUser: (id: string, data: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  getUserByName: (name: string) => AppUser | undefined;

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
  prefix: "P" | "A",
  _startDate: string,
  existingIds: string[]
): string {
  const year = new Date().getFullYear();
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

function getCurrentUser() { return localStorage.getItem("tyro-mock-user") || "Demo User"; }
function now(): string {
  return new Date().toISOString();
}

/** Calculate status from progress + dates — thresholds from app settings */
function suggestStatusFromProgress(progress: number, startDate: string, endDate: string): EntityStatus {
  if (progress === 0) return "Not Started";
  if (progress >= 100) return "Achieved";
  if (!startDate || !endDate) return "On Track";
  const now = Date.now();
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const totalDuration = endMs - startMs;
  if (totalDuration <= 0) return "On Track";
  const elapsed = now - startMs;
  const expectedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const diff = expectedProgress - progress;
  // Thresholds from settings (lazy import to avoid circular dep)
  const behindT = Number(localStorage.getItem("tyro-behind-threshold")) || 20;
  const atRiskT = Number(localStorage.getItem("tyro-atrisk-threshold")) || 10;
  if (diff > behindT) return "Behind";
  if (diff > atRiskT) return "At Risk";
  return "On Track";
}

/** Recalculate a Proje's progress + status from its aksiyonlar */
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
    if (allAchieved) {
      updated.status = "Achieved";
      if (h.status !== "Achieved") updated.completedAt = new Date().toISOString();
    } else {
      // Tarih bazlı statü hesapla (aksiyon ile aynı mantık)
      updated.status = suggestStatusFromProgress(avg, h.startDate, h.endDate);
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
      users: [],

      // Users CRUD
      addUser: (u) =>
        set((s) => {
          const newUser = { ...u, id: uid(), createdAt: now() } as AppUser;
          syncToSupabase(() => supabaseAdapter.createUser(u));
          return { users: [...s.users, newUser] };
        }),
      updateUser: (id, data) => {
        syncToSupabase(() => supabaseAdapter.updateUser(id, data));
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...data, updatedAt: now() } : u)),
        }));
      },
      deleteUser: (id) =>
        set((s) => {
          syncToSupabase(() => supabaseAdapter.deleteUser(id));
          return { users: s.users.filter((u) => u.id !== id) };
        }),
      getUserByName: (name) => get().users.find((u) => u.displayName === name),

      // Proje CRUD
      addProje: (h) =>
        set((s) => {
          const id = generateSystematicId("P", h.startDate, s.projeler.map((x) => x.id));
          const newProje = { ...h, id, createdBy: h.createdBy ?? getCurrentUser(), createdAt: h.createdAt ?? now() };
          syncToSupabase(() => supabaseAdapter.createProje({ ...newProje }));
          return { projeler: [...s.projeler, newProje] };
        }),
      updateProje: (id, data) =>
        set((s) => {
          const projeler = s.projeler.map((h) => {
            if (h.id !== id) return h;
            const updated = { ...h, ...data };
            if (data.status === "Achieved" && h.status !== "Achieved") {
              updated.completedAt = new Date().toISOString();
            } else if (data.status && data.status !== "Achieved") {
              updated.completedAt = undefined;
            }
            return updated;
          });
          syncToSupabase(() => supabaseAdapter.updateProje(id, data));
          return { projeler };
        }),
      deleteProje: (id) => {
        const state = get();
        if (state.aksiyonlar.some((a) => a.projeId === id)) return false;
        set((s) => ({ projeler: s.projeler.filter((h) => h.id !== id) }));
        syncToSupabase(() => supabaseAdapter.deleteProje(id));
        return true;
      },

      // Aksiyon CRUD
      addAksiyon: (a) =>
        set((s) => {
          const id = generateSystematicId("A", a.startDate, s.aksiyonlar.map((x) => x.id));
          const newAksiyon: Aksiyon = { ...a, id, createdBy: a.createdBy ?? getCurrentUser(), createdAt: a.createdAt ?? now() };
          const aksiyonlar = [...s.aksiyonlar, newAksiyon];
          const projeler = recalcProjeProgress(s.projeler, aksiyonlar, newAksiyon.projeId);
          syncToSupabase(() => supabaseAdapter.createAksiyon({ ...newAksiyon }));
          // Also sync parent proje progress
          const updatedProje = projeler.find((p) => p.id === newAksiyon.projeId);
          if (updatedProje) syncToSupabase(() => supabaseAdapter.updateProje(updatedProje.id, { progress: updatedProje.progress, status: updatedProje.status }));
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
          const aksiyon = aksiyonlar.find((a) => a.id === id);
          const projeler = aksiyon
            ? recalcProjeProgress(s.projeler, aksiyonlar, aksiyon.projeId)
            : s.projeler;
          syncToSupabase(() => supabaseAdapter.updateAksiyon(id, data));
          // Also sync parent proje progress
          if (aksiyon) {
            const updatedProje = projeler.find((p) => p.id === aksiyon.projeId);
            if (updatedProje) syncToSupabase(() => supabaseAdapter.updateProje(updatedProje.id, { progress: updatedProje.progress, status: updatedProje.status }));
          }
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
        syncToSupabase(() => supabaseAdapter.deleteAksiyon(id));
        if (aksiyon) {
          const updatedProje = projeler.find((p) => p.id === aksiyon.projeId);
          if (updatedProje) syncToSupabase(() => supabaseAdapter.updateProje(updatedProje.id, { progress: updatedProje.progress, status: updatedProje.status }));
        }
        return true;
      },

      // Tag Definition CRUD
      addTagDefinition: (tag) => {
        const newTag: TagDefinition = { ...tag, id: uid() };
        set((s) => ({ tagDefinitions: [...s.tagDefinitions, newTag] }));
        syncToSupabase(async () => {
          const created = await supabaseAdapter.createTagDefinition(tag);
          // Update local ID with Supabase-generated UUID
          set((s) => ({ tagDefinitions: s.tagDefinitions.map((t) => t.id === newTag.id ? { ...t, id: created.id } : t) }));
        });
        return newTag;
      },
      updateTagDefinition: (id, data) => {
        set((s) => ({
          tagDefinitions: s.tagDefinitions.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        }));
        syncToSupabase(() => supabaseAdapter.updateTagDefinition(id, data));
      },
      deleteTagDefinition: (id) => {
        set((s) => ({
          tagDefinitions: s.tagDefinitions.filter((t) => t.id !== id),
        }));
        syncToSupabase(() => supabaseAdapter.deleteTagDefinition(id));
      },
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
      name: "tyro-data-store-v7",
      skipHydration: true,
      partialize: (state) => ({
        projeler: state.projeler,
        aksiyonlar: state.aksiyonlar,
        tagDefinitions: state.tagDefinitions,
        // users excluded from persist — always fetched fresh from Supabase
      }),
    }
  )
);

// Manual hydrate — prevents infinite loop with useSyncExternalStore
if (typeof window !== "undefined") {
  useDataStore.persist.rehydrate();

  // If Supabase mode: fetch fresh data from DB on startup
  if (isSupabaseMode) {
    Promise.all([
      supabaseAdapter.fetchProjeler(),
      supabaseAdapter.fetchAksiyonlar(),
      supabaseAdapter.fetchTagDefinitions(),
      supabaseAdapter.fetchUsers(),
    ]).then(([projeler, aksiyonlar, tagDefinitions, users]) => {
      console.log(`[Supabase] Loaded ${projeler.length} projeler, ${aksiyonlar.length} aksiyonlar, ${tagDefinitions.length} tags, ${users.length} users`);
      useDataStore.setState({ projeler, aksiyonlar, tagDefinitions, users });
    }).catch((err) => {
      console.error("[Supabase] Initial fetch failed, using cached data:", err?.message || err?.code || JSON.stringify(err));
    });
  }
}
