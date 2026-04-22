import type { TFunction } from "i18next";
import type { EntityStatus, Source, UserRole } from "@/types";

/** Role → i18n key mapping */
const ROLE_I18N_KEY: Record<UserRole, string> = {
  Admin: "roles.admin",
  "Proje Lideri": "roles.projectLeader",
  Kullanıcı: "roles.user",
};

/** Get a translated role label */
export function getRoleLabel(role: UserRole, t: TFunction): string {
  return t(ROLE_I18N_KEY[role] ?? role);
}

/** Status → Türkçe etiket (static fallback for backward compat) */
export const STATUS_LABEL: Record<EntityStatus, string> = {
  "On Track": "Yolunda",
  "Achieved": "Tamamlandı",
  "High Risk": "Yüksek Riskte",
  "At Risk": "Riskte",
  "Not Started": "Başlanmadı",
  "Cancelled": "İptal",
  "On Hold": "Askıda",
};

/** Status key → i18n key mapping */
const STATUS_I18N_KEY: Record<EntityStatus, string> = {
  "On Track": "status.onTrack",
  "Achieved": "status.achieved",
  "High Risk": "status.behind",
  "At Risk": "status.atRisk",
  "Not Started": "status.notStarted",
  "Cancelled": "status.cancelled",
  "On Hold": "status.onHold",
};

/** Get a translated status label */
export function getStatusLabel(status: EntityStatus, t: TFunction): string {
  return t(STATUS_I18N_KEY[status] ?? status);
}

/** Get translated status options for form selects */
export function getStatusOptions(t: TFunction): { key: EntityStatus; label: string }[] {
  return [
    { key: "On Track", label: t("status.onTrack") },
    { key: "At Risk", label: t("status.atRisk") },
    { key: "High Risk", label: t("status.behind") },
    { key: "Achieved", label: t("status.achieved") },
    { key: "Not Started", label: t("status.notStarted") },
    { key: "On Hold", label: t("status.onHold") },
    { key: "Cancelled", label: t("status.cancelled") },
  ];
}

/** Get translated source options for form selects */
export function getSourceOptions(_t: TFunction): { key: Source; label: string }[] {
  return [
    { key: "Türkiye", label: "Türkiye" },
    { key: "Kurumsal", label: "Kurumsal" },
    { key: "International", label: "International" },
    { key: "LALE", label: "LALE" },
    { key: "Organik", label: "Organik" },
  ];
}

/** Status → nokta/badge renk class'ı */
export const STATUS_DOT_COLOR: Record<EntityStatus, string> = {
  "On Track": "bg-emerald-500",
  "Achieved": "bg-blue-500",
  "High Risk": "bg-red-500",
  "At Risk": "bg-amber-500",
  "Not Started": "bg-slate-400",
  "Cancelled": "bg-gray-400",
  "On Hold": "bg-violet-500",
};

/** Form select'leri için status seçenekleri (static fallback) */
export const STATUS_OPTIONS: { key: EntityStatus; label: string }[] = [
  { key: "On Track", label: "Yolunda" },
  { key: "At Risk", label: "Riskte" },
  { key: "High Risk", label: "Yüksek Riskte" },
  { key: "Achieved", label: "Tamamlandı" },
  { key: "Not Started", label: "Başlanmadı" },
  { key: "On Hold", label: "Askıda" },
  { key: "Cancelled", label: "İptal" },
];

/** Form select'leri için kaynak seçenekleri (static fallback) */
export const SOURCE_OPTIONS: { key: Source; label: string }[] = [
  { key: "Türkiye", label: "Türkiye" },
  { key: "Kurumsal", label: "Kurumsal" },
  { key: "International", label: "International" },
  { key: "LALE", label: "LALE" },
  { key: "Organik", label: "Organik" },
];
