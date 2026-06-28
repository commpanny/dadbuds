const ADMIN_TOKEN_STORAGE_KEY = "dadbuds_admin_token";

export function getConfiguredAdminToken() {
  return "";
}

export function getStoredAdminToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? "";
}

export function getAdminToken() {
  return getStoredAdminToken();
}

export function saveAdminToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token.trim());
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}
