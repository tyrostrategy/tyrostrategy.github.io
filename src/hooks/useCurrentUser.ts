import { useUIStore } from "@/stores/uiStore";
import { departments } from "@/config/departments";
import type { UserRole } from "@/types";

interface CurrentUser {
  name: string;
  email: string;
  department: string;
  initials: string;
  role: UserRole;
}

function findUserDepartment(userName: string): string {
  const normalized = userName.toLowerCase().trim();
  for (const dept of departments) {
    if (dept.users.some((u) => u.name.toLowerCase().trim() === normalized)) {
      return dept.name;
    }
  }
  return "Bilinmiyor";
}

function findUserEmail(userName: string): string {
  const normalized = userName.toLowerCase().trim();
  for (const dept of departments) {
    const user = dept.users.find((u) => u.name.toLowerCase().trim() === normalized);
    if (user) return user.email;
  }
  return "";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function useCurrentUser(): CurrentUser {
  const mockUserName = useUIStore((s) => s.mockUserName);
  const mockUserRole = useUIStore((s) => s.mockUserRole) as UserRole;

  const name = mockUserName;
  const email = findUserEmail(name);
  const department = findUserDepartment(name);
  const initials = getInitials(name);

  // Mock modda login'de seçilen rolü kullan
  const validRoles: UserRole[] = ["Admin", "Proje Lideri", "Kullanıcı", "Management"];
  const role: UserRole = validRoles.includes(mockUserRole) ? mockUserRole : "Kullanıcı";

  return { name, email, department, initials, role };
}
