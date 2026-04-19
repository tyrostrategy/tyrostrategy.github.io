import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "@/lib/auth/msalConfig";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";
import { setSupabaseUserContext } from "@/lib/supabase/client";

/** Detect mobile / tablet browsers where popups are unreliable */
function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent,
  );
}

/** Wait for users to appear in the store (Supabase may still be loading) */
function waitForUsers(maxMs = 5000): Promise<typeof useDataStore.getState extends () => infer R ? R["users"] : never> {
  return new Promise((resolve) => {
    const current = useDataStore.getState().users;
    if (current.length > 0) return resolve(current);
    const unsub = useDataStore.subscribe((s) => {
      if (s.users.length > 0) { unsub(); resolve(s.users); }
    });
    setTimeout(() => { unsub(); resolve(useDataStore.getState().users); }, maxMs);
  });
}

export function resolveUser(email: string, users: { email: string; displayName: string; role: string; locale?: string }[]) {
  return users.find((u) => u.email.toLowerCase() === email);
}

export function applyUser(user: { email?: string; displayName: string; role: string; locale?: string }) {
  const ui = useUIStore.getState();
  ui.setMockUserName(user.displayName);
  ui.setMockUserRole(user.role);
  if (user.locale) ui.setLocale(user.locale as "tr" | "en");
  ui.setMockLoggedIn(true);
  // Tell Supabase who we are — RLS policies (migration 006) use this
  if (user.email) {
    void setSupabaseUserContext(user.email);
  }
}

export function useMsalLogin() {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. If MSAL already has a cached account, try silent token acquisition first.
      const cachedAccounts = instance.getAllAccounts();
      let email: string | null = null;

      if (cachedAccounts.length > 0) {
        try {
          const silent = await instance.acquireTokenSilent({
            ...loginRequest,
            account: cachedAccounts[0],
          });
          email = (silent.account.username || "").toLowerCase().trim();
        } catch (silentErr) {
          if (!(silentErr instanceof InteractionRequiredAuthError)) {
            console.warn("[MSAL] Silent acquisition failed, falling back to interactive", silentErr);
          }
        }
      }

      // 2. If silent didn't work, use redirect on mobile, popup on desktop
      if (!email) {
        if (isMobile()) {
          // Redirect flow — page will reload after auth, AuthGuard handles the rest
          await instance.loginRedirect(loginRequest);
          return; // page navigates away
        }
        const result = await instance.loginPopup(loginRequest);
        email = (result.account.username || "").toLowerCase().trim();
      }

      // 3. Wait for users to load from Supabase (may still be loading)
      const users = await waitForUsers();
      const user = resolveUser(email, users);

      if (!user) {
        setError(`Bu hesap sisteme tanımlanmamış: ${email}`);
        // Clear MSAL session — use redirect on mobile
        if (isMobile()) {
          await instance.logoutRedirect({ onRedirectNavigate: () => false }).catch(() => {});
        } else {
          await instance.logoutPopup({ onRedirectNavigate: () => false }).catch(() => {});
        }
        setLoading(false);
        return;
      }

      applyUser(user);
      navigate("/workspace");
    } catch (err: unknown) {
      const msalErr = err as { errorCode?: string; name?: string; message?: string };
      // Ignore user-cancelled interactions
      if (
        msalErr?.errorCode === "user_cancelled" ||
        msalErr?.errorCode === "popup_window_error"
      ) {
        // User closed the popup — no error to show
      } else if (msalErr?.errorCode === "interaction_in_progress") {
        console.warn("[MSAL] Interaction in progress, retrying silently...");
        setError("Giriş işlemi devam ediyor, lütfen bekleyin…");
        setTimeout(() => setError(null), 2000);
      } else {
        setError("Microsoft girişi başarısız. Lütfen tekrar deneyin.");
        console.error("[MSAL] login error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
