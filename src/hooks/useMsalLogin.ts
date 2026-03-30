import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "@/lib/auth/msalConfig";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";

export function useMsalLogin() {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await instance.loginPopup(loginRequest);
      const email = (result.account.username || "").toLowerCase().trim();

      // Look up the user by email in the DB / mock store
      const users = useDataStore.getState().users;
      const user = users.find((u) => u.email.toLowerCase() === email);

      if (!user) {
        setError(`Bu hesap sisteme tanımlanmamış: ${email}`);
        // Sign out of MSAL so the account doesn't linger
        await instance
          .logoutPopup({ onRedirectNavigate: () => false })
          .catch(() => {});
        setLoading(false);
        return;
      }

      // Store the resolved user in uiStore (same mechanism used by mock mode)
      useUIStore.getState().setMockUserName(user.displayName);
      useUIStore.getState().setMockUserRole(user.role);
      if (user.locale) {
        useUIStore.getState().setLocale(user.locale as "tr" | "en");
      }
      useUIStore.getState().setMockLoggedIn(true);
      navigate("/workspace");
    } catch (err: unknown) {
      const msalErr = err as { errorCode?: string; name?: string };
      // Ignore user-cancelled popup
      if (
        msalErr?.errorCode !== "user_cancelled" &&
        msalErr?.errorCode !== "popup_window_error" &&
        msalErr?.name !== "BrowserAuthError"
      ) {
        setError("Microsoft girişi başarısız. Lütfen tekrar deneyin.");
        console.error("[MSAL] loginPopup error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
