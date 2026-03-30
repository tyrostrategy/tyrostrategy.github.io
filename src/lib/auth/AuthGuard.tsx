import type { ReactNode } from "react";
import { useEffect } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Navigate } from "react-router-dom";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";

const isMockAuth = import.meta.env.VITE_MOCK_AUTH === "true" || !import.meta.env.VITE_AZURE_CLIENT_ID;

export function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();
  const mockLoggedIn = useUIStore((s) => s.mockLoggedIn);
  const users = useDataStore((s) => s.users);

  // Real MSAL mode: auto-resolve user after page refresh.
  // MSAL account persists in localStorage but mockLoggedIn resets to false.
  // We re-establish the session by matching the MSAL email to the DB user.
  useEffect(() => {
    if (isMockAuth || !isAuthenticated || mockLoggedIn || accounts.length === 0) return;
    if (users.length === 0) return; // Wait for DB users to load
    const email = accounts[0].username.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase() === email);
    if (user) {
      useUIStore.getState().setMockUserName(user.displayName);
      useUIStore.getState().setMockUserRole(user.role);
      if (user.locale) useUIStore.getState().setLocale(user.locale as "tr" | "en");
      useUIStore.getState().setMockLoggedIn(true);
    }
  }, [isAuthenticated, mockLoggedIn, accounts, users]);

  // Mock mode
  if (isMockAuth) {
    return mockLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
  }

  // Real MSAL mode: allow MSAL auth OR demo bypass (mockLoggedIn)
  if (!isAuthenticated && !mockLoggedIn) return <Navigate to="/login" replace />;
  if (isAuthenticated && !mockLoggedIn) {
    // Resolving user from MSAL session (brief loading after page refresh)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tyro-navy-dark via-tyro-navy to-tyro-navy-light">
        <div className="text-white/50 text-sm animate-pulse">Giriş yapılıyor…</div>
      </div>
    );
  }
  return <>{children}</>;
}
