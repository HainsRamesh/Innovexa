export const DEV_AUTH_BYPASS_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

export const DEV_AUTH_BYPASS_TEST_EMAIL = "test@zynovexa.com";
export const DEV_AUTH_BYPASS_TEST_OTP = "88888888";

const STORAGE_KEY = "dev_auth_bypass_verified";

export function isDevBypassVerified(): boolean {
  if (!DEV_AUTH_BYPASS_ENABLED) return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setDevBypassVerified(verified: boolean) {
  if (!DEV_AUTH_BYPASS_ENABLED) return;
  try {
    if (verified) localStorage.setItem(STORAGE_KEY, "true");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

export function clearDevBypassVerified() {
  setDevBypassVerified(false);
}
