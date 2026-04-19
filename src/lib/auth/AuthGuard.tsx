import type { ReactNode } from "react";
import { useEffect } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { Navigate } from "react-router-dom";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";
import { applyUser } from "@/hooks/useMsalLogin";

export function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { accounts, inProgress } = useMsal();
  const mockLoggedIn = useUIStore((s) => s.mockLoggedIn);
  const users = useDataStore((s) => s.users);

  // Auto-resolve user after page refresh.
  // MSAL account persists in localStorage but app state resets.
  useEffect(() => {
    if (!isAuthenticated || mockLoggedIn || accounts.length === 0) return;
    if (inProgress !== InteractionStatus.None) return;
    if (users.length === 0) return; // Wait for DB users to load
    const email = accounts[0].username.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase() === email);
    if (user) {
      // applyUser also sets the Supabase session context (RLS) for us
      applyUser(user);
    }
  }, [isAuthenticated, mockLoggedIn, accounts, users, inProgress]);

  // Wait for MSAL to finish initializing
  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tyro-navy-dark via-tyro-navy to-tyro-navy-light">
        <div className="text-white/50 text-sm animate-pulse">Giriş yapılıyor…</div>
      </div>
    );
  }

  // Not authenticated → login page
  if (!isAuthenticated && !mockLoggedIn) return <Navigate to="/login" replace />;

  // Authenticated but user not yet resolved from DB
  if (isAuthenticated && !mockLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tyro-navy-dark via-tyro-navy to-tyro-navy-light">
        <div className="text-white/50 text-sm animate-pulse">Giriş yapılıyor…</div>
      </div>
    );
  }

  return <>{children}</>;
}
