import { createServerSupabaseClient } from "@/lib/supabase-client"

interface LogEntry {
  id?: string
  service: string
  action: string
  status: "success" | "error" | "warning" | "info"
  message?: string
  metadata?: Record<string, any>
  user_id?: string
  created_at?: string
}

class Logger {
  private supabaseClient: ReturnType<typeof createServerSupabaseClient> | null = null

  private get isRemoteLoggingEnabled() {
    if (process.env.NODE_ENV === "test") {
      return false
    }

    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  }

  private getSupabaseClient() {
    if (!this.isRemoteLoggingEnabled) {
      return null
    }

    if (!this.supabaseClient) {
      try {
        this.supabaseClient = createServerSupabaseClient()
      } catch (error) {
        console.error("Failed to initialise Supabase client for logging:", error)
        return null
      }
    }

    return this.supabaseClient
  }

  async log(
    service: string,
    action: string,
    status: "success" | "error" | "warning" | "info",
    message?: string,
    metadata?: Record<string, any>,
    userId?: string,
  ): Promise<void> {
    try {
      const logEntry: LogEntry = {
        service,
        action,
        status,
        message,
        metadata,
        user_id: userId,
        created_at: new Date().toISOString(),
      }

      const supabase = this.getSupabaseClient()

      if (supabase) {
        // Try to insert into logs table, create if doesn't exist
        const { error } = await supabase.from("system_logs").insert([logEntry])

        if (error) {
          // If table doesn't exist, create it
          if (error.code === "42P01") {
            await this.createLogsTable(supabase)
            // Retry the insert
            await supabase.from("system_logs").insert([logEntry])
          } else {
            console.error("Failed to log to database:", error)
          }
        }
      }

      // Also log to console for development
      console.log(`[${status.toUpperCase()}] ${service}:${action}`, message || "", metadata || "")
    } catch (error) {
      console.error("Logger error:", error)
      // Fallback to console logging
      console.log(`[${status.toUpperCase()}] ${service}:${action}`, message || "", metadata || "")
    }
  }

  private async createLogsTable(supabaseClient: ReturnType<typeof createServerSupabaseClient>): Promise<void> {
    try {
      const { error } = await supabaseClient.rpc("create_logs_table", {})
      if (error) {
        console.error("Failed to create logs table:", error)
      }
    } catch (error) {
      console.error("Error creating logs table:", error)
    }
  }

  // Convenience methods
  async info(service: string, action: string, message?: string, metadata?: Record<string, any>): Promise<void> {
    return this.log(service, action, "info", message, metadata)
  }

  async success(service: string, action: string, message?: string, metadata?: Record<string, any>): Promise<void> {
    return this.log(service, action, "success", message, metadata)
  }

  async warning(service: string, action: string, message?: string, metadata?: Record<string, any>): Promise<void> {
    return this.log(service, action, "warning", message, metadata)
  }

  async error(service: string, action: string, message?: string, metadata?: Record<string, any>): Promise<void> {
    return this.log(service, action, "error", message, metadata)
  }
}

export const logger = new Logger()
