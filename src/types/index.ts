// ===== Domain Model: Proje → Aksiyon (2 seviye) =====

export type EntityStatus = "On Track" | "Achieved" | "Behind" | "At Risk" | "Not Started" | "Cancelled" | "On Hold";
export type Source = "Türkiye" | "Kurumsal" | "International";
export type ProjectStatus = "active" | "planned" | "completed" | "delayed";
export type Priority = "critical" | "high" | "medium" | "low";

// ===== RBAC =====
export type UserRole = "Admin" | "Proje Lideri" | "Kullanıcı";

export interface CrudPermission {
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface PagePermissions {
  kpi: boolean;
  projeler: boolean;
  aksiyonlar: boolean;
  gantt: boolean;
  wbs: boolean;
  stratejikKokpit: boolean;
  kullanicilar: boolean;
  ayarlar: boolean;
  guvenlik: boolean;
}

export interface RolePermissions {
  pages: PagePermissions;
  proje: CrudPermission;
  aksiyon: CrudPermission;
  editOnlyOwn: boolean;
  viewOnlyOwn: boolean;
}

// ===== Proje (genişletilmiş — eski Proje alanları eklendi) =====
export interface Proje {
  id: string;
  name: string;
  description?: string;
  source: Source;
  status: EntityStatus;
  owner: string;
  participants: string[];
  department: string;
  progress: number;
  startDate: string;
  endDate: string;
  reviewDate?: string;
  tags?: string[];             // Etiketler — filtreleme & kategorizasyon
  parentObjectiveId?: string;  // Ana proje ID — null ise bağımsız/ana proje
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  completedAt?: string;
}

// ===== Tag Tanımı — parametrik etiketler (ad + renk) =====
export interface TagDefinition {
  id: string;
  name: string;
  color: string; // hex "#D4A017"
}

// ===== Aksiyon (eski Görev — direkt hedefe bağlı) =====
export interface Aksiyon {
  id: string;
  projeId: string;
  name: string;
  description?: string;
  owner: string;
  status: EntityStatus;
  progress: number;
  startDate: string;
  endDate: string;
  sortOrder?: number;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  completedAt?: string;
}

// ===== Backward compatibility aliases =====
/** @deprecated Use Aksiyon instead */
export type Gorev = Aksiyon;
/** @deprecated Proje seviyesi kaldırıldı */
export type Proje = Proje;

// ===== Legacy types (used by existing mock-data files) =====

export interface Project {
  id: string;
  name: string;
  department: string;
  status: ProjectStatus;
  progress: number;
  owner: string;
  deadline: string;
  description?: string;
  priority?: Priority;
}

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  assigneeInitials: string;
  deadline?: string;
  progress?: number;
  tags?: string[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  cards: KanbanCard[];
}

export interface TreeNode {
  id: string;
  name: string;
  type: "plan" | "proje" | "aksiyon" | "proje" | "gorev";
  progress?: number;
  status?: string;
  children?: TreeNode[];
}

export interface GanttTask {
  id: number;
  text: string;
  start: Date;
  end: Date;
  progress: number;
  type?: string;
  parent?: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  color: string;
}

export interface ChartDataPoint {
  month: string;
  budget: number;
  spend: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export interface SearchItem {
  id: string;
  name: string;
  sub: string;
  category: "objectives" | "actions" | "users" | "pages";
}
