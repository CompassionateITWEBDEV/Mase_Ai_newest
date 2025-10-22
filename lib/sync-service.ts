import { logger } from "./logger"

type Integration = "axxess" | "availity" | "extendedcare"

/**
 * Triggers a synchronization job for the given integration.
 * In a real implementation this would enqueue work for a background processor.
 */
export async function triggerSync(integration: Integration) {
  await logger.log(integration, "sync", "success")
  return { status: "queued" }
}
