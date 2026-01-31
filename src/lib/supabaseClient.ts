import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Required env vars – fail immediately if missing or mismatched
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

const EXPECTED_PROJECT_REF = "iehuqvjappjdgmfjzkoa";

if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) {
  throw new Error(
    "Missing Supabase env vars. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) are set."
  );
}

// Ensure the URL contains the expected project ref
if (!SUPABASE_URL.includes(EXPECTED_PROJECT_REF)) {
  throw new Error(
    `VITE_SUPABASE_URL does not match expected project "${EXPECTED_PROJECT_REF}". Current value: "${SUPABASE_URL}"`
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function decodeJwt(token?: string): Record<string, any> | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = atob(parts[1]);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
