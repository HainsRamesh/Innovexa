/**
 * DEV-only authentication bypass for local testing.
 * 
 * SECURITY WARNING: This module is DISABLED in production builds.
 * The bypass only works when BOTH conditions are met:
 * 1. import.meta.env.DEV is true (Vite dev mode)
 * 2. VITE_DEV_AUTH_BYPASS is explicitly set to "true"
 * 
 * In production builds, DEV_AUTH_BYPASS_ENABLED is always false
 * regardless of environment variable values.
 */

// CRITICAL: Only enable in development mode AND with explicit flag
// Production builds will have import.meta.env.DEV === false
export const DEV_AUTH_BYPASS_ENABLED = 
  import.meta.env.DEV === true && 
  import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

// Log bypass status on module load (dev only)
if (import.meta.env.DEV) {
  console.log("[DevAuthBypass] Status:", {
    dev_mode: import.meta.env.DEV,
    bypass_flag: import.meta.env.VITE_DEV_AUTH_BYPASS,
    enabled: DEV_AUTH_BYPASS_ENABLED,
  });
}

export const DEV_AUTH_BYPASS_TEST_EMAIL = "test@zynovexa.com";
export const DEV_AUTH_BYPASS_TEST_OTP = "88888888";

const STORAGE_KEY = "dev_auth_bypass_verified";

/**
 * Check if the dev bypass has been verified in this session.
 * Always returns false in production.
 */
export function isDevBypassVerified(): boolean {
  // Double-check we're in dev mode
  if (!DEV_AUTH_BYPASS_ENABLED) return false;
  
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Set the dev bypass verification status.
 * No-op in production.
 */
export function setDevBypassVerified(verified: boolean): void {
  // Refuse to set in production
  if (!DEV_AUTH_BYPASS_ENABLED) return;
  
  try {
    if (verified) {
      localStorage.setItem(STORAGE_KEY, "true");
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage access denied - no-op
  }
}

/**
 * Clear the dev bypass verification flag.
 * Should be called on sign-out.
 */
export function clearDevBypassVerified(): void {
  setDevBypassVerified(false);
}

/**
 * Validate that the bypass is being used safely.
 * Returns warnings if misconfigurations are detected.
 */
export function validateBypassSafety(): string[] {
  const warnings: string[] = [];
  
  if (!import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === "true") {
    warnings.push("CRITICAL: DEV_AUTH_BYPASS flag is set in production! This has no effect but indicates a configuration error.");
  }
  
  if (DEV_AUTH_BYPASS_ENABLED && isDevBypassVerified()) {
    warnings.push("Dev auth bypass is active - authentication is being skipped.");
  }
  
  return warnings;
}
