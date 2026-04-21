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
import { departments } from "@/config/departments";
import { isSupabaseMode } from "@/lib/supabaseMode";

/**
 * Fire-and-forget Supabase sync — doesn't block UI.
 *
 * Exponential backoff with jitter on failure:
 *   - initial call fails → retry 1 after ~2s
 *   - retry 1 fails → retry 2 after ~8s
 *   - retry 2 fails → retry 3 after ~32s
 *   - retry 3 fails → give up, show toast
 *
 * Each delay has ±30% random jitter so 50 concurrent users' retries don't
 * synchronize on the same wall-clock second (thundering herd). Critical for
 * surviving short Supabase outages without saturating the free-tier quota.
 */
function syncToSupabase(fn: () => Promise<unknown>, attempt = 0): void {
  if (!isSupabaseMode) return;
  fn().catch((err) => {
    if (attempt >= 3) {
      console.error("[Supabase Sync] Failed after 3 retries:", err);
      toast.error(i18n.t("toast.syncFailed"));
      return;
    }
    // 2s, 8s, 32s base + ±30% jitter
    const base = 2000 * Math.pow(4, attempt);
    const delay = base * (0.7 + Math.random() * 0.6);
    setTimeout(() => syncToSupabase(fn, attempt + 1), delay);
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
  getAksiyonlarByProjeId: (projeId: string) => Aksiyon[];
  getTagColor: (tagName: string) => string;
  getTagDefinitionByName: (tagName: string) => TagDefinition | undefined;

  // Data consistency
  fixDataConsistency: () => void;
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
  if (diff > behindT) return "High Risk";
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

// In Supabase mode the DB is the source of truth — start EMPTY so the
// user never sees mock seeds leak through while the initial fetch is
// in flight (or if it fails). Mock mode keeps its seed data so the
// developer loop still renders something useful offline.
const INITIAL_DATA = isSupabaseMode
  ? { projeler: [], aksiyonlar: [], tagDefinitions: [] }
  : { ...getInitialData(), tagDefinitions: getInitialTagDefinitions() };

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      ...INITIAL_DATA,
      users: [],

      // Users CRUD
      addUser: (u) =>
        set((s) => {
          const newUser = { ...u, id: uid(), createdAt: now() } as AppUser;
          // Sync the enriched newUser so the DB row mirrors the local
          // one (same createdAt instead of the DB's own server-time
          // default, which would drift across browsers).
          syncToSupabase(() => supabaseAdapter.createUser(newUser));
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
          // Pick up the pre-transition row so we can detect a status
          // change from not-Achieved → Achieved (fills completedAt) or
          // vice versa (clears it). The enriched payload is synced to
          // DB too — otherwise completedAt updated locally but stayed
          // NULL in Postgres.
          const before = s.projeler.find((h) => h.id === id);
          const syncData: Partial<Proje> = {
            ...data,
            // Audit trail: stamp every write with who/when. Client sets
            // them so the local cache matches; the DB's update_updated_at
            // trigger may re-bump updated_at — sub-second drift heals on
            // next fetch.
            updatedBy: data.updatedBy ?? getCurrentUser(),
            updatedAt: data.updatedAt ?? now(),
          };
          if (before) {
            if (data.status === "Achieved" && before.status !== "Achieved") {
              syncData.completedAt = new Date().toISOString();
            } else if (data.status && data.status !== "Achieved" && before.status === "Achieved") {
              syncData.completedAt = undefined;
            }
          }
          const projeler = s.projeler.map((h) => {
            if (h.id !== id) return h;
            return { ...h, ...syncData };
          });
          syncToSupabase(() => supabaseAdapter.updateProje(id, syncData));
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
          // Also sync parent proje progress + completedAt drift (recalc
          // may set/clear completedAt on the parent row).
          const updatedProje = projeler.find((p) => p.id === newAksiyon.projeId);
          const prevProje = s.projeler.find((p) => p.id === newAksiyon.projeId);
          if (updatedProje) {
            const parentSync: Partial<Proje> = { progress: updatedProje.progress, status: updatedProje.status };
            if (prevProje && updatedProje.completedAt !== prevProje.completedAt) {
              parentSync.completedAt = updatedProje.completedAt;
            }
            syncToSupabase(() => supabaseAdapter.updateProje(updatedProje.id, parentSync));
          }
          return { aksiyonlar, projeler };
        }),
      updateAksiyon: (id, data) =>
        set((s) => {
          // Same completedAt-on-Achieved logic + DB sync as updateProje,
          // plus the updatedBy / updatedAt audit stamp.
          const before = s.aksiyonlar.find((a) => a.id === id);
          const syncData: Partial<Aksiyon> = {
            ...data,
            updatedBy: data.updatedBy ?? getCurrentUser(),
            updatedAt: data.updatedAt ?? now(),
          };
          if (before) {
            if (data.status === "Achieved" && before.status !== "Achieved") {
              syncData.completedAt = new Date().toISOString();
            } else if (data.status && data.status !== "Achieved" && before.status === "Achieved") {
              syncData.completedAt = undefined;
            }
          }
          const aksiyonlar = s.aksiyonlar.map((a) => {
            if (a.id !== id) return a;
            return { ...a, ...syncData };
          });
          const aksiyon = aksiyonlar.find((a) => a.id === id);
          const projeler = aksiyon
            ? recalcProjeProgress(s.projeler, aksiyonlar, aksiyon.projeId)
            : s.projeler;
          syncToSupabase(() => supabaseAdapter.updateAksiyon(id, syncData));
          // Also sync parent proje progress + completedAt if parent auto-flipped
          if (aksiyon) {
            const updatedProje = projeler.find((p) => p.id === aksiyon.projeId);
            const prevProje = s.projeler.find((p) => p.id === aksiyon.projeId);
            if (updatedProje) {
              const parentSync: Partial<Proje> = {
                progress: updatedProje.progress,
                status: updatedProje.status,
              };
              if (prevProje && updatedProje.completedAt !== prevProje.completedAt) {
                parentSync.completedAt = updatedProje.completedAt;
              }
              syncToSupabase(() => supabaseAdapter.updateProje(updatedProje.id, parentSync));
            }
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
          const prevProje = state.projeler.find((p) => p.id === aksiyon.projeId);
          if (updatedProje) {
            const parentSync: Partial<Proje> = { progress: updatedProje.progress, status: updatedProje.status };
            if (prevProje && updatedProje.completedAt !== prevProje.completedAt) {
              parentSync.completedAt = updatedProje.completedAt;
            }
            syncToSupabase(() => supabaseAdapter.updateProje(updatedProje.id, parentSync));
          }
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
      renameTag: (oldName, newName) => {
        const state = get();
        const tagDef = state.tagDefinitions.find((t) => t.name === oldName);
        // Collect the projeler whose tag array needs rewriting BEFORE we
        // mutate state, so we can also push the new arrays to Postgres.
        // Previously only the tag_definitions row was synced; each
        // proje_tags link kept pointing at the old name in DB and the
        // rename silently drifted.
        const affected = state.projeler
          .filter((h) => h.tags?.includes(oldName))
          .map((h) => ({
            id: h.id,
            nextTags: (h.tags ?? []).map((t) => (t === oldName ? newName : t)),
          }));
        set((s) => ({
          tagDefinitions: s.tagDefinitions.map((t) =>
            t.name === oldName ? { ...t, name: newName } : t,
          ),
          projeler: s.projeler.map((h) =>
            h.tags?.includes(oldName)
              ? { ...h, tags: h.tags.map((t) => (t === oldName ? newName : t)) }
              : h,
          ),
        }));
        if (tagDef) {
          syncToSupabase(() => supabaseAdapter.updateTagDefinition(tagDef.id, { name: newName }));
        }
        // Mirror the tag array change to DB for every affected proje.
        // supabaseAdapter.updateProje re-inserts the proje_tags rows to
        // match the new array (see its tag-rollback block).
        for (const entry of affected) {
          syncToSupabase(() =>
            supabaseAdapter.updateProje(entry.id, { tags: entry.nextTags }),
          );
        }
      },

      // Selectors
      getProjeById: (id) => get().projeler.find((h) => h.id === id),
      getAksiyonById: (id) => get().aksiyonlar.find((a) => a.id === id),
      getAksiyonlarByProjeId: (projeId) =>
        get().aksiyonlar
          .filter((a) => a.projeId === projeId)
          .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)),
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

      // One-time data consistency fix
      fixDataConsistency: () => {
        const state = get();
        const now = Date.now();
        const affectedProjeIds = new Set<string>();

        // Step 1: Fix aksiyonlar
        const fixedAksiyonlar = state.aksiyonlar.map((a) => {
          const original = a;
          let updated = { ...a };

          if (a.status === "Achieved" && a.progress < 100) {
            updated.progress = 100;
            if (!updated.completedAt) updated.completedAt = new Date().toISOString();
          } else if (a.status === "Not Started" && a.progress > 0) {
            updated.progress = 0;
          } else if (
            (a.status === "On Track" || a.status === "At Risk" || a.status === "High Risk") &&
            a.progress === 0
          ) {
            // Calculate expected progress from timeline
            const startMs = a.startDate ? new Date(a.startDate).getTime() : 0;
            const endMs = a.endDate ? new Date(a.endDate).getTime() : 0;
            const totalDuration = endMs - startMs;
            let expected = 50; // fallback
            if (totalDuration > 0) {
              expected = Math.min(95, Math.max(0, ((now - startMs) / totalDuration) * 100));
            }
            if (a.status === "On Track") updated.progress = Math.max(15, Math.round(expected));
            else if (a.status === "At Risk") updated.progress = Math.max(10, Math.round(expected * 0.7));
            else if (a.status === "High Risk") updated.progress = Math.max(10, Math.round(expected * 0.5));
          }

          if (updated.progress !== original.progress || updated.completedAt !== original.completedAt) {
            affectedProjeIds.add(a.projeId);
            // Sync each changed aksiyon to Supabase
            syncToSupabase(() => supabaseAdapter.updateAksiyon(a.id, { progress: updated.progress, status: updated.status, completedAt: updated.completedAt }));
          }
          return updated;
        });

        // Step 2: Recalculate affected projeler
        let fixedProjeler = [...state.projeler];
        for (const projeId of affectedProjeIds) {
          fixedProjeler = recalcProjeProgress(fixedProjeler, fixedAksiyonlar, projeId);
          const updatedProje = fixedProjeler.find((p) => p.id === projeId);
          if (updatedProje) {
            syncToSupabase(() => supabaseAdapter.updateProje(updatedProje.id, { progress: updatedProje.progress, status: updatedProje.status, completedAt: updatedProje.completedAt }));
          }
        }

        set({ aksiyonlar: fixedAksiyonlar, projeler: fixedProjeler });
        console.log(`[fixDataConsistency] Fixed ${affectedProjeIds.size} projeler, checked ${fixedAksiyonlar.length} aksiyonlar`);
      },
    }),
    {
      // v8 — version bump on purpose. Prior v7 stores on users' browsers
      // carry mock-seeded projeler/aksiyonlar from a time when the app
      // started with `getInitialData()`. Renaming the key makes Zustand
      // ignore the old cache so nobody sees stale mock rows anymore;
      // the Supabase fetch on startup fills the empty store.
      name: "tyro-data-store-v8",
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

/** Build mock AppUser list from departments config */
function buildMockUsers(): AppUser[] {
  const now = new Date().toISOString();
  return departments.flatMap((dept) =>
    dept.users.map((u, i) => ({
      id: `mock-${dept.id}-${i}`,
      displayName: u.name,
      email: u.email,
      department: dept.name,
      role: u.role,
      title: u.title,
      locale: "tr" as const,
      createdAt: now,
      updatedAt: now,
    } as AppUser))
  );
}

// Manual hydrate — prevents infinite loop with useSyncExternalStore
if (typeof window !== "undefined") {
  useDataStore.persist.rehydrate();

  if (isSupabaseMode) {
    // Supabase mode: fetch fresh data from DB on startup
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
  } else {
    // Mock mode: populate users from departments config so KullanicilarPage works
    useDataStore.setState({ users: buildMockUsers() });
  }
}
