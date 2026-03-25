import {
  turkiyeHedefler,
  kurumsalHedefler,
  internationalHedefler,
} from "@/lib/mock-data/cascade-data";
import type { CascadeHedef } from "@/lib/mock-data/cascade-data";
import type { Hedef, Aksiyon, EntityStatus, Source, TagDefinition } from "@/types";
import { getDepartmentByUser } from "@/config/departments";
import { TAG_COLOR_PALETTE } from "@/config/tagColors";

function mapStatus(s: string): EntityStatus {
  const valid: EntityStatus[] = ["On Track", "Achieved", "Behind", "At Risk", "Not Started"];
  return (valid.includes(s as EntityStatus) ? s : "Not Started") as EntityStatus;
}

function computeReviewDate(endDate: string): string {
  try {
    const d = new Date(endDate);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  } catch {
    return endDate;
  }
}

// Add "Cenk Şayli" as participant to some hedefler for workspace demo
const CURRENT_USER = "Cenk Şayli";
function buildParticipants(leader: string, hedefId: string): string[] {
  const base = [leader];
  // Add current user to ~40% of hedefler using deterministic hash
  const hash = hedefId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  if (hash % 5 < 2 && leader !== CURRENT_USER) {
    base.push(CURRENT_USER);
  }
  return base;
}

// Deterministic tag assignment based on hedef name keywords
function assignTags(_name: string, _source: Source, progress: number, status: string): string[] {
  // Her hedefe durumuna göre tek bir aşama tag'i ata
  if (status === "Not Started" || progress === 0) return ["Ön Çalışma"];
  if (status === "Achieved" || progress >= 80) return ["Uygulama"];
  return ["Geliştirme"];
}

function flattenHedefler(hedefler: CascadeHedef[], source: Source): Hedef[] {
  return hedefler.map((h) => {
    // Compute progress as average of all tasks across all projects
    const allTasks = h.projects.flatMap((p) => p.tasks);
    const totalTasks = allTasks.length;
    const achievedTasks = allTasks.filter((t) => t.status === "Achieved").length;
    const progress = totalTasks > 0 ? Math.round((achievedTasks / totalTasks) * 100) : 0;

    // Use the first project's leader for department, or fall back to hedef leader
    const primaryLeader = h.projects[0]?.leader || h.leader;

    return {
      id: h.id,
      name: h.name,
      source,
      status: mapStatus(h.status),
      owner: h.leader,
      participants: buildParticipants(primaryLeader, h.id),
      department: getDepartmentByUser(primaryLeader)?.name ?? source,
      progress,
      startDate: h.startDate,
      endDate: h.endDate,
      reviewDate: computeReviewDate(h.endDate),
      tags: assignTags(h.name, source, progress, mapStatus(h.status)),
      createdBy: h.leader,
      createdAt: h.startDate,
    };
  });
}

function flattenAksiyonlar(hedefler: CascadeHedef[]): Aksiyon[] {
  const result: Aksiyon[] = [];
  let sortOrder = 0;
  for (const h of hedefler) {
    for (const p of h.projects) {
      for (const t of p.tasks) {
        const aksiyonStatus = mapStatus(t.status);
        result.push({
          id: t.id,
          hedefId: h.id,
          name: t.name,
          owner: p.leader || h.leader,
          progress: t.progress,
          status: aksiyonStatus,
          startDate: t.startDate,
          endDate: t.endDate,
          sortOrder: sortOrder++,
          createdBy: h.leader,
          createdAt: t.startDate,
          completedAt: aksiyonStatus === "Achieved" ? t.endDate : undefined,
        });
      }
    }
  }
  return result;
}

const allSources: [CascadeHedef[], Source][] = [
  [turkiyeHedefler, "Türkiye"],
  [kurumsalHedefler, "Kurumsal"],
  [internationalHedefler, "International"],
];

export function getInitialHedefler(): Hedef[] {
  const all = allSources.flatMap(([h, s]) => flattenHedefler(h, s));

  // Assign parentObjectiveId for T-Alignment — realistic multi-group hierarchy
  const bySource = new Map<string, Hedef[]>();
  for (const h of all) {
    const list = bySource.get(h.source) ?? [];
    list.push(h);
    bySource.set(h.source, list);
  }

  for (const [, hedefler] of bySource) {
    if (hedefler.length < 4) continue;

    // Create multiple parent groups per source
    // Group 1: hedefler[0] is parent, [1],[2],[3] are children
    hedefler[1].parentObjectiveId = hedefler[0].id;
    hedefler[2].parentObjectiveId = hedefler[0].id;
    if (hedefler.length > 3) hedefler[3].parentObjectiveId = hedefler[0].id;

    // Group 2: if enough hedefler, hedefler[4] is second parent, [5],[6] children
    if (hedefler.length > 6) {
      hedefler[5].parentObjectiveId = hedefler[4].id;
      hedefler[6].parentObjectiveId = hedefler[4].id;
    }

    // Group 3: if many, hedefler[7] parent, [8],[9] children
    if (hedefler.length > 9) {
      hedefler[8].parentObjectiveId = hedefler[7].id;
      hedefler[9].parentObjectiveId = hedefler[7].id;
    }
    // Remaining hedefler stay standalone (no parent)
  }

  return all;
}

export function getInitialAksiyonlar(): Aksiyon[] {
  return allSources.flatMap(([h]) => flattenAksiyonlar(h));
}

// ===== Parametrik Tag Tanımları =====
const INITIAL_TAG_NAMES = [
  "Ön Çalışma", "Geliştirme", "Uygulama",
];

export function getInitialTagDefinitions(): TagDefinition[] {
  return INITIAL_TAG_NAMES.map((name, i) => ({
    id: `tag-${i + 1}`,
    name,
    color: TAG_COLOR_PALETTE[i % TAG_COLOR_PALETTE.length],
  }));
}
