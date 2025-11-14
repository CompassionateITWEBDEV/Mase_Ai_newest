import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

/**
 * Creates a Supabase client for server-side operations.
 * Important: Don't put this client in a global variable when using Fluid compute.
 * Always create a new client within each function.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

/**
 * Creates a Supabase admin client with service role key.
 * This bypasses RLS policies and should only be used in secure server-side contexts.
 * Use this for operations that need to bypass RLS (like system-level inserts/updates).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not set")
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
  }

  if (!supabaseServiceKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not set")
    console.error("Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file")
    console.error("Get it from: Supabase Dashboard > Settings > API > Service Role Key")
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable. See ENV_SETUP_REFERRALS.md for setup instructions.")
  }

  console.log("Creating admin client with service role")
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
