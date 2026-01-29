import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Use env vars with fallback to known project values (these are public/publishable)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://rnbpkpirnmhjehutqlzn.supabase.co";
const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnBrcGlybm1oamVodXRxbHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNjM0NTAsImV4cCI6MjA4MTkzOTQ1MH0.GqlE6OaYv2D5p-1wYe-6upic8T1djqyct5UQcvxu26Q";

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
