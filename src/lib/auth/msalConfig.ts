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
    // localStorage survives page refresh; sessionStorage is cleared on tab close
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
};

export const loginRequest: PopupRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
  prompt: "select_account",
};
