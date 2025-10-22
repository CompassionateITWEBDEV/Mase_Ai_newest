import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type SupabaseClient = ReturnType<typeof createClient<Database>>

let cachedSupabaseClient: SupabaseClient | null = null

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
  }
  return url
}

function getSupabaseAnonKey() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
  }
  return anonKey
}

function ensureSupabaseClient(): SupabaseClient {
  if (!cachedSupabaseClient) {
    cachedSupabaseClient = createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return cachedSupabaseClient
}

function assertServerEnvironment() {
  if (typeof window !== "undefined") {
    throw new Error("Service role client can only be created on the server")
  }
}

function getServiceRoleKey() {
  assertServerEnvironment()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
  }
  return serviceRoleKey
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = ensureSupabaseClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === "function" ? value.bind(client) : value
  },
  set(_target, prop, value, receiver) {
    const client = ensureSupabaseClient()
    Reflect.set(client, prop, value, receiver)
    return true
  },
  has(_target, prop) {
    const client = ensureSupabaseClient()
    return prop in client
  },
  ownKeys() {
    const client = ensureSupabaseClient()
    return Reflect.ownKeys(client)
  },
  getOwnPropertyDescriptor(_target, prop) {
    const client = ensureSupabaseClient()
    const descriptor = Object.getOwnPropertyDescriptor(client, prop)
    return descriptor ? { ...descriptor, configurable: true } : undefined
  },
})

export function getSupabaseClient() {
  return ensureSupabaseClient()
}

// Service role client for admin/server operations
export function createServerSupabaseClient() {
  return createClient<Database>(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export default supabase
