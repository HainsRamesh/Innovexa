import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Hardcoded credentials for project iehuqvjappjdgmfjzkoa
// (bypasses auto-managed .env which points to a different project)
const SUPABASE_URL = "https://iehuqvjappjdgmfjzkoa.supabase.co";
const SUPABASE_PUBLIC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllaHVxdmphcHBqZGdtZmp6a29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTc0MDQsImV4cCI6MjA4MzI3MzQwNH0.WZkpMP9Eq4JIpe4coMko_3iVRdQUbn2l-YX5SDVYRnU";

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
