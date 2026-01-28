/**
 * Production-safe CORS headers for Supabase Edge Functions.
 * 
 * SECURITY: In production, restrict origins to your actual domains.
 * The wildcard (*) should only be used in development.
 */

// Allowed origins for CORS
// Add your production domains here
const ALLOWED_ORIGINS = [
  'https://spark-nexus-solutions.lovable.app',
  'https://id-preview--25a821f5-b8a4-4adc-832e-b2dbd4c57058.lovable.app',
];

// Development origins (only used in dev mode)
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const isDev = Deno.env.get('ENVIRONMENT') !== 'production';
  
  // Check if origin is allowed
  const allowedOrigins = isDev 
    ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS]
    : ALLOWED_ORIGINS;
  
  const isAllowed = allowedOrigins.includes(origin) || 
    (isDev && origin.includes('lovable.app'));
  
  // Return appropriate headers
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
  };
}

// Legacy export for backward compatibility during migration
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
