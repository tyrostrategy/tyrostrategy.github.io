import type { Configuration, PopupRequest } from "@azure/msal-browser";

// Multi-tenant: "common" authority allows both Tiryaki and Sunrise tenant users to sign in.
// The Azure App Registration must be configured as "Accounts in any organizational directory".
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "placeholder",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: typeof window !== "undefined" ? window.location.origin + window.location.pathname : "http://localhost:5173",
    postLogoutRedirectUri: "/",
    navigateToLoginRequestUrl: false,
  },
  cache: {
    // sessionStorage (per-tab): tokens evaporate when the tab closes, so an
    // XSS window is bounded and the token never lingers on disk. Users get a
    // one-click silent SSO re-login when re-opening the tab (Microsoft's
    // session cookie is still on login.microsoftonline.com).
    // Trade-off accepted for defense-in-depth on an enterprise internal app.
    cacheLocation: "sessionStorage",
    // Fallback cookie still helps IE/legacy edge cases during the redirect
    // handshake — harmless on modern browsers.
    storeAuthStateInCookie: true,
  },
};

export const loginRequest: PopupRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
  prompt: "select_account",
};
