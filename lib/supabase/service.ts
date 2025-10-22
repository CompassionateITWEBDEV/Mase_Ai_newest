import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client with service role key for server-side operations
 * that need to bypass Row Level Security (RLS) policies.
 *
 * IMPORTANT: Only use this in API routes, never in client components!
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
