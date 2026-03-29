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
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
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
  if (data.completedAt !== undefined) map.completed_at = data.completedAt;
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
        const userName = link.user_name || link.display_name || "";
        if (projeId && userName) {
          const arr = projeParticipantsMap.get(projeId) ?? [];
          arr.push(userName);
          projeParticipantsMap.set(projeId, arr);
        }
      }
    } catch { /* participants optional */ }

    return (data as DbProje[]).map((row) =>
      dbToProje(row, projeTagsMap.get(row.id) ?? [], projeParticipantsMap.get(row.id) ?? [row.owner])
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

    return dbToProje(data as DbProje, input.tags ?? [], input.participants ?? [input.owner]);
  },

  async updateProje(id: string, data: Partial<Proje>): Promise<Proje> {
    if (!supabase) throw new Error("Supabase not configured");
    const dbData = projeToDb(data);
    const { data: updated, error } = await supabase.from("projeler").update(dbData).eq("id", id).select().single();
    if (error) throw error;

    // Update tags if provided
    if (data.tags) {
      await supabase.from("proje_tags").delete().eq("proje_id", id);
      const { data: tagDefs } = await supabase.from("tag_definitions").select("id, name");
      const tagIdMap = new Map((tagDefs ?? []).map((t: DbTag) => [t.name, t.id]));
      const tagInserts = data.tags.filter((t) => tagIdMap.has(t)).map((t) => ({ proje_id: id, tag_id: tagIdMap.get(t)! }));
      if (tagInserts.length) await supabase.from("proje_tags").insert(tagInserts);
    }

    return dbToProje(updated as DbProje, data.tags);
  },

  async deleteProje(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("projeler").delete().eq("id", id);
    return !error;
  },

  // ── Aksiyonlar ──

  async fetchAksiyonlar(): Promise<Aksiyon[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from("aksiyonlar").select("*").order("created_at");
    if (error) throw error;
    return (data as DbAksiyon[]).map(dbToAksiyon);
  },

  async fetchAksiyonlarByProje(projeId: string): Promise<Aksiyon[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from("aksiyonlar").select("*").eq("proje_id", projeId).order("created_at");
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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async createUser(user: Omit<AppUser, "id" | "createdAt" | "updatedAt">): Promise<AppUser | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from("users").insert({
      email: user.email,
      display_name: user.displayName,
      department: user.department,
      role: user.role,
      locale: user.locale,
    }).select().single();
    if (error) { console.error("[Supabase] createUser:", error); return null; }
    return { id: data.id, email: data.email, displayName: data.display_name, department: data.department ?? "", role: data.role, locale: data.locale ?? "tr", createdAt: data.created_at, updatedAt: data.updated_at };
  },

  async updateUser(id: string, data: Partial<AppUser>): Promise<void> {
    if (!supabase) return;
    const row: Record<string, unknown> = {};
    if (data.email !== undefined) row.email = data.email;
    if (data.displayName !== undefined) row.display_name = data.displayName;
    if (data.department !== undefined) row.department = data.department;
    if (data.role !== undefined) row.role = data.role;
    if (data.locale !== undefined) row.locale = data.locale;
    const { error } = await supabase.from("users").update(row).eq("id", id);
    if (error) console.error("[Supabase] updateUser:", error);
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
