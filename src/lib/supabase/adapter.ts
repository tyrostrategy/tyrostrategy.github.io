/**
 * Supabase Data Adapter
 * Maps Supabase DB rows to app types and provides CRUD operations.
 * When VITE_DATA_PROVIDER=supabase, dataStore uses this instead of mock-adapter.
 */
import { supabase } from "./client";
import type { Proje, Aksiyon, TagDefinition, EntityStatus, Source } from "@/types";

// ============================================
// DB Row → App Type mappers
// ============================================
function dbToProje(row: Record<string, unknown>): Proje {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    source: row.source as Source,
    status: row.status as EntityStatus,
    progress: row.progress as number,
    owner: row.owner as string,
    department: (row.department as string) || "",
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    reviewDate: (row.review_date as string) || "",
    parentObjectiveId: (row.parent_proje_id as string) || undefined,
    completedAt: (row.completed_at as string) || undefined,
    tags: [], // filled separately from proje_tags join
    participants: [], // filled separately from proje_participants join
    createdBy: (row.created_by as string) || "",
    createdAt: (row.created_at as string) || "",
  };
}

function projeToDb(p: Partial<Proje>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.name !== undefined) row.name = p.name;
  if (p.description !== undefined) row.description = p.description;
  if (p.source !== undefined) row.source = p.source;
  if (p.status !== undefined) row.status = p.status;
  if (p.progress !== undefined) row.progress = p.progress;
  if (p.owner !== undefined) row.owner = p.owner;
  if (p.department !== undefined) row.department = p.department;
  if (p.startDate !== undefined) row.start_date = p.startDate;
  if (p.endDate !== undefined) row.end_date = p.endDate;
  if (p.reviewDate !== undefined) row.review_date = p.reviewDate;
  if (p.parentObjectiveId !== undefined) row.parent_proje_id = p.parentObjectiveId || null;
  if (p.completedAt !== undefined) row.completed_at = p.completedAt || null;
  if (p.createdBy !== undefined) row.created_by = p.createdBy;
  return row;
}

function dbToAksiyon(row: Record<string, unknown>): Aksiyon {
  return {
    id: row.id as string,
    projeId: row.proje_id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    owner: row.owner as string,
    progress: row.progress as number,
    status: row.status as EntityStatus,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    sortOrder: (row.sort_order as number) || 0,
    completedAt: (row.completed_at as string) || undefined,
    createdBy: (row.created_by as string) || "",
    createdAt: (row.created_at as string) || "",
  };
}

function aksiyonToDb(a: Partial<Aksiyon>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (a.id !== undefined) row.id = a.id;
  if (a.projeId !== undefined) row.proje_id = a.projeId;
  if (a.name !== undefined) row.name = a.name;
  if (a.description !== undefined) row.description = a.description;
  if (a.owner !== undefined) row.owner = a.owner;
  if (a.progress !== undefined) row.progress = a.progress;
  if (a.status !== undefined) row.status = a.status;
  if (a.startDate !== undefined) row.start_date = a.startDate;
  if (a.endDate !== undefined) row.end_date = a.endDate;
  if (a.sortOrder !== undefined) row.sort_order = a.sortOrder;
  if (a.completedAt !== undefined) row.completed_at = a.completedAt || null;
  if (a.createdBy !== undefined) row.created_by = a.createdBy;
  return row;
}

// ============================================
// CRUD Operations
// ============================================

export async function fetchProjeler(): Promise<Proje[]> {
  if (!supabase) return [];

  const { data: rows, error } = await supabase
    .from("projeler")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) { console.error("[Supabase] fetchProjeler:", error); return []; }

  const projeler = (rows || []).map(dbToProje);

  // Fetch tags for all projeler
  const { data: tagRows } = await supabase
    .from("proje_tags")
    .select("proje_id, tag_definitions(name)");

  if (tagRows) {
    const tagMap = new Map<string, string[]>();
    for (const row of tagRows) {
      const pid = row.proje_id as string;
      const tagName = (row.tag_definitions as Record<string, unknown>)?.name as string;
      if (tagName) {
        const list = tagMap.get(pid) || [];
        list.push(tagName);
        tagMap.set(pid, list);
      }
    }
    for (const p of projeler) p.tags = tagMap.get(p.id) || [];
  }

  // Fetch participants for all projeler
  const { data: partRows } = await supabase
    .from("proje_participants")
    .select("proje_id, user_email");

  if (partRows) {
    const partMap = new Map<string, string[]>();
    for (const row of partRows) {
      const pid = row.proje_id as string;
      const email = row.user_email as string;
      const list = partMap.get(pid) || [];
      list.push(email);
      partMap.set(pid, list);
    }
    for (const p of projeler) p.participants = partMap.get(p.id) || [];
  }

  return projeler;
}

export async function fetchAksiyonlar(): Promise<Aksiyon[]> {
  if (!supabase) return [];

  const { data: rows, error } = await supabase
    .from("aksiyonlar")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) { console.error("[Supabase] fetchAksiyonlar:", error); return []; }
  return (rows || []).map(dbToAksiyon);
}

export async function fetchTagDefinitions(): Promise<TagDefinition[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tag_definitions")
    .select("*")
    .order("name");

  if (error) { console.error("[Supabase] fetchTags:", error); return []; }
  return (data || []).map((r) => ({ id: r.id, name: r.name, color: r.color }));
}

// ---- Proje CRUD ----

export async function insertProje(proje: Proje): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from("projeler").insert(projeToDb(proje));
  if (error) { console.error("[Supabase] insertProje:", error); return false; }

  // Insert tags
  if (proje.tags?.length) {
    const { data: tagDefs } = await supabase.from("tag_definitions").select("id, name");
    const tagIdMap = new Map((tagDefs || []).map((t) => [t.name, t.id]));
    const tagRows = proje.tags
      .map((t) => ({ proje_id: proje.id, tag_id: tagIdMap.get(t) }))
      .filter((r) => r.tag_id);
    if (tagRows.length) await supabase.from("proje_tags").insert(tagRows);
  }

  // Insert participants
  if (proje.participants?.length) {
    const partRows = proje.participants.map((email) => ({ proje_id: proje.id, user_email: email }));
    await supabase.from("proje_participants").insert(partRows);
  }

  return true;
}

export async function updateProje(id: string, data: Partial<Proje>): Promise<boolean> {
  if (!supabase) return false;

  const dbData = projeToDb(data);
  if (Object.keys(dbData).length > 0) {
    const { error } = await supabase.from("projeler").update(dbData).eq("id", id);
    if (error) { console.error("[Supabase] updateProje:", error); return false; }
  }

  // Update tags if provided
  if (data.tags !== undefined) {
    await supabase.from("proje_tags").delete().eq("proje_id", id);
    if (data.tags.length) {
      const { data: tagDefs } = await supabase.from("tag_definitions").select("id, name");
      const tagIdMap = new Map((tagDefs || []).map((t) => [t.name, t.id]));
      const tagRows = data.tags
        .map((t) => ({ proje_id: id, tag_id: tagIdMap.get(t) }))
        .filter((r) => r.tag_id);
      if (tagRows.length) await supabase.from("proje_tags").insert(tagRows);
    }
  }

  // Update participants if provided
  if (data.participants !== undefined) {
    await supabase.from("proje_participants").delete().eq("proje_id", id);
    if (data.participants.length) {
      const partRows = data.participants.map((email) => ({ proje_id: id, user_email: email }));
      await supabase.from("proje_participants").insert(partRows);
    }
  }

  return true;
}

export async function deleteProje(id: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from("projeler").delete().eq("id", id);
  if (error) { console.error("[Supabase] deleteProje:", error); return false; }
  return true;
}

// ---- Aksiyon CRUD ----

export async function insertAksiyon(aksiyon: Aksiyon): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from("aksiyonlar").insert(aksiyonToDb(aksiyon));
  if (error) { console.error("[Supabase] insertAksiyon:", error); return false; }
  return true;
}

export async function updateAksiyon(id: string, data: Partial<Aksiyon>): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from("aksiyonlar").update(aksiyonToDb(data)).eq("id", id);
  if (error) { console.error("[Supabase] updateAksiyon:", error); return false; }
  return true;
}

export async function deleteAksiyon(id: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from("aksiyonlar").delete().eq("id", id);
  if (error) { console.error("[Supabase] deleteAksiyon:", error); return false; }
  return true;
}

// ---- Tag Definitions CRUD ----

export async function insertTag(tag: TagDefinition): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from("tag_definitions").insert({ id: tag.id, name: tag.name, color: tag.color });
  if (error) { console.error("[Supabase] insertTag:", error); return false; }
  return true;
}

export async function updateTag(id: string, data: Partial<TagDefinition>): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from("tag_definitions").update(data).eq("id", id);
  if (error) { console.error("[Supabase] updateTag:", error); return false; }
  return true;
}

export async function deleteTag(id: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from("tag_definitions").delete().eq("id", id);
  if (error) { console.error("[Supabase] deleteTag:", error); return false; }
  return true;
}
