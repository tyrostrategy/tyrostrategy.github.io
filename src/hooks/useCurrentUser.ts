import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";
import { departments } from "@/config/departments";
import type { UserRole } from "@/types";

interface CurrentUser {
  name: string;
  email: string;
  department: string;
  title: string;
  initials: string;
  role: UserRole;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Fallback: search hardcoded departments config */
function findInDepts(userName: string): { email: string; department: string; title: string } {
  const normalized = userName.toLowerCase().trim();
  for (const dept of departments) {
    const user = dept.users.find((u) => u.name.toLowerCase().trim() === normalized);
    if (user) return { email: user.email, department: dept.name, title: user.title };
  }
  return { email: "", department: "Bilinmiyor", title: "" };
}

export function useCurrentUser(): CurrentUser {
  const mockUserName = useUIStore((s) => s.mockUserName);
  const mockUserRole = useUIStore((s) => s.mockUserRole) as UserRole;
  const dbUsers = useDataStore((s) => s.users);

  const name = mockUserName;
  const initials = getInitials(name);

  const validRoles: UserRole[] = ["Admin", "Proje Lideri", "Kullanıcı", "Management"];
  // localStorage-cached role — used ONLY as a fallback when the DB
  // row can't be resolved yet (cold boot before Supabase fetch lands).
  const cachedRole: UserRole = validRoles.includes(mockUserRole) ? mockUserRole : "Kullanıcı";

  // DB is the single source of truth. If the admin changes this user's
  // role in one browser, the Supabase fetch on this browser will land
  // and dbUsers gets refreshed → useCurrentUser reads the new role
  // immediately, no re-login needed. Previously we were reading role
  // from uiStore.mockUserRole which is a write-once-on-login cache in
  // localStorage — it would keep an old role indefinitely until the
  // user manually logged out + back in.
  const dbUser = dbUsers.find(
    (u) => u.displayName.toLowerCase().trim() === name.toLowerCase().trim(),
  );
  if (dbUser) {
    const dbRole = validRoles.includes(dbUser.role as UserRole)
      ? (dbUser.role as UserRole)
      : cachedRole;
    return {
      name,
      email: dbUser.email,
      department: dbUser.department || "Bilinmiyor",
      title: dbUser.title ?? "",
      initials,
      role: dbRole,
    };
  }

  // No DB row match yet (cold boot / offline) — use the cached values.
  const fallback = findInDepts(name);
  return { name, email: fallback.email, department: fallback.department, title: fallback.title, initials, role: cachedRole };
}
