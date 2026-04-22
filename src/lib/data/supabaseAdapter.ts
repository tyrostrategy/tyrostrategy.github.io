/**
 * SupabaseAdapter — Implements DataService for Supabase PostgreSQL backend.
 * Maps snake_case DB columns to camelCase app types.
 */
import { supabase } from "@/lib/supabase";
import type { DataService } from "./dataService";
import type { Proje, Aksiyon, TagDefinition, EntityStatus, Source, AppUser, AppSetting, UserRole } from "@/types";

// ===== DB → App mappers =====

interface DbProje {
  id: string;
  name: string;
  description: string | null;
  source: string;
  status: string;
  owner: string;
  department: string;
  progress: number;
  start_date: string;
  end_date: string;
  review_date: string | null;
  parent_proje_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface DbAksiyon {
  id: string;
  proje_id: string;
  name: string;
  description: string | null;
  owner: string;
  progress: number;
  status: string;
  start_date: string;
  end_date: string;
  sort_order: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface DbTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

function dbToProje(row: DbProje, tags: string[] = [], participants: string[] = []): Proje {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    source: row.source as Source,
    status: row.status as EntityStatus,
    owner: row.owner,
    participants,
    department: row.department,
    progress: row.progress,
    startDate: row.start_date,
    endDate: row.end_date,
    reviewDate: row.review_date ?? undefined,
    tags,
    parentObjectiveId: row.parent_proje_id ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedBy: (row as DbProje & { updated_by?: string }).updated_by ?? undefined,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
  };
}

function projeToDb(data: Partial<Proje>): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  if (data.name !== undefined) map.name = data.name;
  if (data.description !== undefined) map.description = data.description;
  if (data.source !== undefined) map.source = data.source;
  if (data.status !== undefined) map.status = data.status;
  if (data.owner !== undefined) map.owner = data.owner;
  if (data.department !== undefined) map.department = data.department;
  if (data.progress !== undefined) map.progress = data.progress;
  if (data.startDate !== undefined) map.start_date = data.startDate;
  if (data.endDate !== undefined) map.end_date = data.endDate;
  if (data.reviewDate !== undefined) map.review_date = data.reviewDate;
  if (data.parentObjectiveId !== undefined) map.parent_proje_id = data.parentObjectiveId;
  if (data.completedAt !== undefined) map.completed_at = data.completedAt;
  // Audit columns — createdAt/updatedAt mirror local timestamps so a
  // fetch-after-write shows the same value the user has in memory.
  // (The DB trigger `update_updated_at` will re-bump updated_at on any
  //  real UPDATE, which is fine — sub-second drift self-heals.)
  if (data.createdBy !== undefined) map.created_by = data.createdBy;
  if (data.createdAt !== undefined) map.created_at = data.createdAt;
  if (data.updatedBy !== undefined) map.updated_by = data.updatedBy;
  if (data.updatedAt !== undefined) map.updated_at = data.updatedAt;
  return map;
}

function dbToAksiyon(row: DbAksiyon): Aksiyon {
  return {
    id: row.id,
    projeId: row.proje_id,
    name: row.name,
    description: row.description ?? undefined,
    owner: row.owner,
    progress: row.progress,
    status: row.status as EntityStatus,
    startDate: row.start_date,
    endDate: row.end_date,
    sortOrder: row.sort_order ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedBy: (row as DbAksiyon & { updated_by?: string }).updated_by ?? undefined,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
  };
}

function aksiyonToDb(data: Partial<Aksiyon>): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  if (data.name !== undefined) map.name = data.name;
  if (data.description !== undefined) map.description = data.description;
  if (data.projeId !== undefined) map.proje_id = data.projeId;
  if (data.owner !== undefined) map.owner = data.owner;
  if (data.progress !== undefined) map.progress = data.progress;
  if (data.status !== undefined) map.status = data.status;
  if (data.startDate !== undefined) map.start_date = data.startDate;
  if (data.endDate !== undefined) map.end_date = data.endDate;
  if (data.sortOrder !== undefined) map.sort_order = data.sortOrder;
  if (data.completedAt !== undefined) map.completed_at = data.completedAt;
  // Same audit columns as projeler (see projeToDb for the trigger note).
  if (data.createdBy !== undefined) map.created_by = data.createdBy;
  if (data.createdAt !== undefined) map.created_at = data.createdAt;
  if (data.updatedBy !== undefined) map.updated_by = data.updatedBy;
  if (data.updatedAt !== undefined) map.updated_at = data.updatedAt;
  return map;
}

function dbToTag(row: DbTag): TagDefinition {
  return { id: row.id, name: row.name, color: row.color };
}

interface DbUser {
  id: string;
  email: string;
  display_name: string;
  department: string | null;
  role: string;
  locale: string | null;
  title: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DbAppSetting {
  key: string;
  value: unknown;
}

interface DbRolePermission {
  role: string;
  permissions: Record<string, unknown>;
}

// ===== ID Generation =====
function generateId(prefix: "P" | "A", existingIds: string[]): string {
  const yy = String(new Date().getFullYear()).slice(-2);
  const yearPrefix = `${prefix}${yy}-`;
  let max = 0;
  for (const id of existingIds) {
    if (id.startsWith(yearPrefix)) {
      const n = parseInt(id.slice(yearPrefix.length), 10);
      if (n > max) max = n;
    }
  }
  return `${yearPrefix}${String(max + 1).padStart(4, "0")}`;
}

// ===== Adapter =====

// ===== Report Template types & mapper =====

interface DbReportTemplate {
  id: string;
  name: string;
  owner_email: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AppReportTemplate {
  id: string;
  name: string;
  ownerEmail: string;
  sourceFilter: string;
  statusFilters: string[];
  deptFilter: string;
  sections: Record<string, boolean>;
  datePreset: string;
  dateFrom: string;
  dateTo: string;
  updatedAt: string;
}

export type ReportTemplateInput = Omit<AppReportTemplate, "id" | "updatedAt">;

function dbToTemplate(row: DbReportTemplate): AppReportTemplate {
  const c = (row.config ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    name: row.name,
    ownerEmail: row.owner_email,
    sourceFilter: (c.sourceFilter as string) ?? "all",
    statusFilters: (c.statusFilters as string[]) ?? [],
    deptFilter: (c.deptFilter as string) ?? "all",
    sections: (c.sections as Record<string, boolean>) ?? {},
    datePreset: (c.datePreset as string) ?? "all",
    dateFrom: (c.dateFrom as string) ?? "",
    dateTo: (c.dateTo as string) ?? "",
    updatedAt: row.updated_at,
  };
}

export const supabaseAdapter: DataService = {
  // ── Projeler ──

  async fetchProjeler(): Promise<Proje[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from("projeler").select("*").order("start_date");
    if (error) throw error;

    // Fetch tags for all projeler
    const { data: tagLinks } = await supabase.from("proje_tags").select("proje_id, tag_id");
    const { data: tagDefs } = await supabase.from("tag_definitions").select("id, name");
    const tagNameMap = new Map((tagDefs ?? []).map((t: DbTag) => [t.id, t.name]));
    const projeTagsMap = new Map<string, string[]>();
    for (const link of tagLinks ?? []) {
      const arr = projeTagsMap.get(link.proje_id) ?? [];
      const tagName = tagNameMap.get(link.tag_id);
      if (tagName) arr.push(tagName);
      projeTagsMap.set(link.proje_id, arr);
    }

    // Fetch participants (defensive — may have different column names)
    const projeParticipantsMap = new Map<string, string[]>();
    try {
      const { data: partLinks } = await supabase.from("proje_participants").select("*");
      for (const link of partLinks ?? []) {
        const projeId = link.proje_id;
        const userName = link.user_email || link.user_name || link.display_name || "";
        if (projeId && userName) {
          const arr = projeParticipantsMap.get(projeId) ?? [];
          arr.push(userName);
          projeParticipantsMap.set(projeId, arr);
        }
      }
    } catch { /* participants optional */ }

    return (data as DbProje[]).map((row) =>
      dbToProje(row, projeTagsMap.get(row.id) ?? [], projeParticipantsMap.get(row.id) ?? [])
    );
  },

  async fetchProje(id: string): Promise<Proje | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from("projeler").select("*").eq("id", id).single();
    if (error || !data) return null;
    return dbToProje(data as DbProje);
  },

  async createProje(input: Omit<Proje, "id">): Promise<Proje> {
    if (!supabase) throw new Error("Supabase not configured");
    // Get existing IDs for ID generation
    const { data: existing } = await supabase.from("projeler").select("id");
    const id = generateId("P", (existing ?? []).map((r: { id: string }) => r.id));
    const dbData = { id, ...projeToDb(input as Partial<Proje>), owner: input.owner, created_by: input.createdBy };
    const { data, error } = await supabase.from("projeler").insert(dbData).select().single();
    if (error) throw error;

    // Handle tags
    if (input.tags?.length) {
      const { data: tagDefs } = await supabase.from("tag_definitions").select("id, name");
      const tagIdMap = new Map((tagDefs ?? []).map((t: DbTag) => [t.name, t.id]));
      const tagInserts = input.tags.filter((t) => tagIdMap.has(t)).map((t) => ({ proje_id: id, tag_id: tagIdMap.get(t)! }));
      if (tagInserts.length) await supabase.from("proje_tags").insert(tagInserts);
    }

    // Handle participants
    const participants = input.participants ?? [];
    if (participants.length) {
      const partInserts = participants.map((name) => ({ proje_id: id, user_email: name }));
      await supabase.from("proje_participants").insert(partInserts);
    }

    return dbToProje(data as DbProje, input.tags ?? [], participants);
  },

  async updateProje(id: string, data: Partial<Proje>): Promise<Proje> {
    if (!supabase) throw new Error("Supabase not configured");
    const dbData = projeToDb(data);
    const { data: updated, error } = await supabase.from("projeler").update(dbData).eq("id", id).select().single();
    if (error) throw error;

    // Update tags if provided — delete then re-insert with rollback on failure
    if (data.tags) {
      const { data: oldTags } = await supabase.from("proje_tags").select("*").eq("proje_id", id);
      await supabase.from("proje_tags").delete().eq("proje_id", id);
      try {
        const { data: tagDefs } = await supabase.from("tag_definitions").select("id, name");
        const tagIdMap = new Map((tagDefs ?? []).map((t: DbTag) => [t.name, t.id]));
        const tagInserts = data.tags.filter((t) => tagIdMap.has(t)).map((t) => ({ proje_id: id, tag_id: tagIdMap.get(t)! }));
        if (tagInserts.length) await supabase.from("proje_tags").insert(tagInserts);
      } catch (tagErr) {
        // Rollback: restore old tags if insert failed
        if (oldTags?.length) await supabase.from("proje_tags").insert(oldTags).catch(() => {});
        console.error("[Supabase] Tag update failed, rolled back:", tagErr);
      }
    }

    // Update participants if provided — delete then re-insert with rollback on failure
    if (data.participants !== undefined) {
      const { data: oldParts } = await supabase.from("proje_participants").select("*").eq("proje_id", id);
      await supabase.from("proje_participants").delete().eq("proje_id", id);
      try {
        if (data.participants.length) {
          const partInserts = data.participants.map((name) => ({ proje_id: id, user_email: name }));
          await supabase.from("proje_participants").insert(partInserts);
        }
      } catch (partErr) {
        // Rollback: restore old participants if insert failed
        if (oldParts?.length) await supabase.from("proje_participants").insert(oldParts).catch(() => {});
        console.error("[Supabase] Participant update failed, rolled back:", partErr);
      }
    }

    return dbToProje(updated as DbProje, data.tags, data.participants);
  },

  async deleteProje(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("projeler").delete().eq("id", id);
    return !error;
  },

  // ── Aksiyonlar ──

  async fetchAksiyonlar(): Promise<Aksiyon[]> {
    if (!supabase) return [];
    // Supabase `db-max-rows` default 1000 — .range() bunu aşamıyor. 50 kullanıcılı
    // app'te aksiyon sayısı 10-20 binlere çıkabilir, o yüzden batch (sayfalı)
    // fetch yapıyoruz: 1000'lik dilimlerle, boş dönene kadar.
    const BATCH = 1000;
    const all: DbAksiyon[] = [];
    for (let offset = 0; ; offset += BATCH) {
      const { data, error } = await supabase
        .from("aksiyonlar")
        .select("*")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at")
        .range(offset, offset + BATCH - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all.push(...(data as DbAksiyon[]));
      if (data.length < BATCH) break;
    }
    return all.map(dbToAksiyon);
  },

  async fetchAksiyonlarByProje(projeId: string): Promise<Aksiyon[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from("aksiyonlar").select("*").eq("proje_id", projeId).order("sort_order", { ascending: true, nullsFirst: false }).order("created_at");
    if (error) throw error;
    return (data as DbAksiyon[]).map(dbToAksiyon);
  },

  async createAksiyon(input: Omit<Aksiyon, "id">): Promise<Aksiyon> {
    if (!supabase) throw new Error("Supabase not configured");
    const { data: existing } = await supabase.from("aksiyonlar").select("id");
    const id = generateId("A", (existing ?? []).map((r: { id: string }) => r.id));
    const dbData = { id, ...aksiyonToDb(input as Partial<Aksiyon>), proje_id: input.projeId, owner: input.owner, created_by: input.createdBy };
    const { data, error } = await supabase.from("aksiyonlar").insert(dbData).select().single();
    if (error) throw error;
    return dbToAksiyon(data as DbAksiyon);
  },

  async updateAksiyon(id: string, data: Partial<Aksiyon>): Promise<Aksiyon> {
    if (!supabase) throw new Error("Supabase not configured");
    const dbData = aksiyonToDb(data);
    const { data: updated, error } = await supabase.from("aksiyonlar").update(dbData).eq("id", id).select().single();
    if (error) throw error;
    return dbToAksiyon(updated as DbAksiyon);
  },

  async deleteAksiyon(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("aksiyonlar").delete().eq("id", id);
    return !error;
  },

  // ── Tag Definitions ──

  async fetchTagDefinitions(): Promise<TagDefinition[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from("tag_definitions").select("*");
    if (error) throw error;
    return (data as DbTag[]).map(dbToTag);
  },

  async createTagDefinition(input: Omit<TagDefinition, "id">): Promise<TagDefinition> {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.from("tag_definitions").insert(input).select().single();
    if (error) throw error;
    return dbToTag(data as DbTag);
  },

  async updateTagDefinition(id: string, data: Partial<TagDefinition>): Promise<TagDefinition> {
    if (!supabase) throw new Error("Supabase not configured");
    const { data: updated, error } = await supabase.from("tag_definitions").update(data).eq("id", id).select().single();
    if (error) throw error;
    return dbToTag(updated as DbTag);
  },

  async deleteTagDefinition(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("tag_definitions").delete().eq("id", id);
    return !error;
  },

  // ── Users ──

  async fetchUsers(): Promise<AppUser[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from("users").select("*").order("display_name");
    if (error) { console.error("[Supabase] fetchUsers:", error); return []; }
    return (data || []).map((row: DbUser) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      department: row.department ?? "",
      role: (row.role as UserRole) ?? "Kullanıcı",
      locale: row.locale ?? "tr",
      title: row.title ?? undefined,
      isActive: row.is_active ?? true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async createUser(user: Omit<AppUser, "id" | "updatedAt"> & { id?: string; createdAt?: string }): Promise<AppUser | null> {
    if (!supabase) return null;
    const row: Record<string, unknown> = {
      email: user.email,
      display_name: user.displayName,
      department: user.department,
      role: user.role,
      locale: user.locale,
      title: user.title ?? null,
      is_active: user.isActive ?? true,
    };
    // Pass through client-generated id + createdAt when the store
    // already enriched them, so DB and local cache agree on the
    // canonical row identity + creation time.
    if (user.id) row.id = user.id;
    if (user.createdAt) row.created_at = user.createdAt;
    const { data, error } = await supabase.from("users").insert(row).select().single();
    if (error) { console.error("[Supabase] createUser:", error); return null; }
    return { id: data.id, email: data.email, displayName: data.display_name, department: data.department ?? "", role: data.role, locale: data.locale ?? "tr", title: data.title ?? undefined, isActive: data.is_active ?? true, createdAt: data.created_at, updatedAt: data.updated_at };
  },

  async updateUser(id: string, data: Partial<AppUser>): Promise<void> {
    if (!supabase) return;
    const row: Record<string, unknown> = {};
    if (data.email !== undefined) row.email = data.email;
    if (data.displayName !== undefined) row.display_name = data.displayName;
    if (data.department !== undefined) row.department = data.department;
    if (data.role !== undefined) row.role = data.role;
    if (data.locale !== undefined) row.locale = data.locale;
    if (data.title !== undefined) row.title = data.title;
    if (data.isActive !== undefined) row.is_active = data.isActive;
    const { error, count } = await supabase.from("users").update(row).eq("id", id).select();
    if (error) {
      console.error("[Supabase] updateUser error:", error.code, error.message, error.details);
      throw error;
    }
    if (count === 0) {
      console.warn("[Supabase] updateUser: 0 rows updated — RLS may be blocking or id not found:", id);
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("users").delete().eq("id", id);
    return !error;
  },

  // ── App Settings ──

  async fetchAppSettings(): Promise<AppSetting[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from("app_settings").select("key, value");
    if (error) { console.error("[Supabase] fetchAppSettings:", error); return []; }
    return (data || []).map((row: DbAppSetting) => ({ key: row.key, value: row.value }));
  },

  async upsertAppSetting(key: string, value: unknown): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
    if (error) console.error("[Supabase] upsertAppSetting:", error);
  },

  // ── Report Templates ──

  async fetchReportTemplates(ownerEmail: string): Promise<AppReportTemplate[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("report_templates")
      .select("*")
      .eq("owner_email", ownerEmail)
      .order("created_at", { ascending: false });
    if (error) { console.error("[Supabase] fetchReportTemplates:", error); return []; }
    return (data || []).map(dbToTemplate);
  },

  async createReportTemplate(input: ReportTemplateInput): Promise<AppReportTemplate> {
    const { name, ownerEmail, ...config } = input;
    const { data, error } = await supabase!
      .from("report_templates")
      .insert({ name, owner_email: ownerEmail, config })
      .select()
      .single();
    if (error) throw error;
    return dbToTemplate(data as DbReportTemplate);
  },

  async updateReportTemplate(id: string, input: Omit<ReportTemplateInput, "ownerEmail">): Promise<void> {
    if (!supabase) return;
    const { name, ...config } = input;
    const { error } = await supabase
      .from("report_templates")
      .update({ name, config })
      .eq("id", id);
    if (error) console.error("[Supabase] updateReportTemplate:", error);
  },

  async deleteReportTemplate(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("report_templates").delete().eq("id", id);
    if (error) console.error("[Supabase] deleteReportTemplate:", error);
  },

  // ── Role Permissions ──

  async fetchRolePermissions(): Promise<{ role: string; permissions: Record<string, unknown> }[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from("role_permissions").select("role, permissions");
    if (error) { console.error("[Supabase] fetchRolePermissions:", error); return []; }
    return (data || []).map((row: DbRolePermission) => ({ role: row.role, permissions: row.permissions }));
  },

  async upsertRolePermissions(role: string, permissions: Record<string, unknown>): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from("role_permissions").upsert({ role, permissions }, { onConflict: "role" });
    if (error) console.error("[Supabase] upsertRolePermissions:", error);
  },
};
