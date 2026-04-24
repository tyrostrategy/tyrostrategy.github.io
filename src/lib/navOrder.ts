import type { RolePermissions } from "@/types";

type PageKey = keyof RolePermissions["pages"];

/**
 * Canonical Sidebar ordering — the single place any route ↔ pageKey
 * pair lives for "first accessible page" routing decisions.
 *
 * Mirrors src/components/layout/Sidebar.tsx getNavSections(). If you
 * add a new route to Sidebar, add it here in the same position so
 * login / root-redirect / fallback pick it up correctly.
 */
export const NAV_ORDER: { path: string; pageKey: PageKey }[] = [
  // Ana Menü
  { path: "/workspace",        pageKey: "anasayfa" },
  { path: "/stratejik-kokpit", pageKey: "stratejikKokpit" },
  { path: "/projeler",         pageKey: "projeler" },
  { path: "/aksiyonlar",       pageKey: "aksiyonlar" },
  // Görünümler
  { path: "/dashboard",        pageKey: "kpi" },
  { path: "/strategy-map",     pageKey: "tMap" },
  { path: "/t-alignment",      pageKey: "tAlignment" },
  { path: "/gantt",            pageKey: "gantt" },
  // Sistem
  { path: "/kullanicilar",     pageKey: "kullanicilar" },
  { path: "/guvenlik",         pageKey: "guvenlik" },
  { path: "/veri-yonetimi",    pageKey: "ayarlar" },
  { path: "/ayarlar",          pageKey: "ayarlar" },
];

/**
 * Returns the first Sidebar path the user has permission to open.
 * Used as the post-login landing target and as the fallback when a
 * protected route blocks navigation (e.g. user tried to open /workspace
 * but has no `anasayfa` permission).
 *
 * Routing öncelik sırası (user kararı 2026-04-23):
 *   1. Anasayfa (`/workspace`) — yetki varsa buraya in
 *   2. Raporlar (`/dashboard`) — Anasayfa yoksa buraya in
 *   3. Sidebar sırasındaki ilk erişilebilir sayfa — diğerleri de yoksa
 *   4. /profil — hiçbir list sayfasına yetki yoksa son çare
 *
 * /profil her zaman erişilebilir (permission gate yok).
 */
export function getFirstAccessiblePath(canAccess: (key: PageKey) => boolean): string {
  // 1. Anasayfa öncelikli
  if (canAccess("anasayfa")) return "/workspace";
  // 2. Raporlar ikinci öncelik
  if (canAccess("kpi")) return "/dashboard";
  // 3. Sidebar sırasında diğer erişilebilir sayfa
  for (const { path, pageKey } of NAV_ORDER) {
    if (canAccess(pageKey)) return path;
  }
  // 4. Son çare
  return "/profil";
}
