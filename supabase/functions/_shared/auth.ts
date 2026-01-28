/**
 * Shared authentication utilities for Edge Functions.
 * Implements zero-trust authentication patterns.
 */

import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthResult {
  user: User | null;
  error: string | null;
  client: SupabaseClient | null;
}

/**
 * Validate JWT and return authenticated user.
 * This is the primary authentication method for all edge functions.
 * 
 * @param request - The incoming request
 * @returns AuthResult with user, error, and supabase client
 */
export async function authenticateRequest(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header', client: null };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return { user: null, error: 'Server misconfiguration', client: null };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.error('JWT validation failed:', userError);
      return { user: null, error: 'Invalid or expired token', client: supabase };
    }

    return { user: userData.user, error: null, client: supabase };
  } catch (err) {
    console.error('Authentication error:', err);
    return { user: null, error: 'Authentication failed', client: null };
  }
}

/**
 * Check if user has a specific role.
 * Uses the user_roles table to verify role membership.
 */
export async function hasRole(
  supabase: SupabaseClient,
  userId: string,
  role: 'admin' | 'innovator' | 'enterprise' | 'investor'
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();

  if (error) {
    console.error('Role check error:', error);
    return false;
  }

  return !!data;
}

/**
 * Verify user owns a specific resource.
 * Prevents unauthorized access to other users' data.
 */
export function verifyOwnership(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}
