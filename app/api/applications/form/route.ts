import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

/**
 * Whitelist of columns that exist in the `application_forms` table.
 * Keep this in sync with your Supabase schema.
 */
const APPLICATION_FORM_COLUMNS = new Set<string>([
  "first_name",
  "middle_initial",
  "last_name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "zip_code",
  "date_of_birth",
  "ssn",
  "desired_position",
  "employment_type",
  "availability",
  "years_experience",
  "work_history",
  "specialties",
  "high_school",
  "hs_grad_year",
  "college",
  "degree",
  "major",
  "college_grad_year",
  "license",
  "license_state",
  "license_expiry",
  "license_number",
  "cpr",
  "cpr_certification",
  "other_certs",
  "other_certifications",
  "hipaa_training",
  "hipaa_details",
  "conflict_interest",
  "conflict_details",
  "relationship_conflict",
  "relationship_details",
  "conviction_history",
  "conviction_details",
  "registry_history",
  "background_consent",
  "tb_test_status",
  "tb_test_date",
  "tb_history_details",
  "tb_test",
  "infection_training",
  "infection_details",
  "physical_accommodation",
  "physical_details",
  "physical_limitations",
  "hep_b_vaccination",
  "flu_vaccination",
  "flu_vaccine",
  "covid_vaccine",
  "immunization_details",
  "immunization_records",
  "reference_1_name",
  "reference_1_relationship",
  "reference_1_company",
  "reference_1_phone",
  "reference_1_email",
  "reference_2_name",
  "reference_2_relationship",
  "reference_2_company",
  "reference_2_phone",
  "reference_2_email",
  "reference_3_name",
  "reference_3_relationship",
  "reference_3_company",
  "reference_3_phone",
  "reference_3_email",
  "reference1_name",
  "reference1_phone",
  "reference1_relationship",
  "reference2_name",
  "reference2_phone",
  "reference2_relationship",
  "reference3_name",
  "reference3_phone",
  "reference3_relationship",
  "emergency_name",
  "emergency_relationship",
  "emergency_phone",
  "emergency_email",
  "emergency_address",
  "emergency_contact_name",
  "emergency_contact_phone",
  "emergency_contact_relationship",
  "terms_agreed",
  "employment_at_will",
  "drug_testing_consent",
  "drug_test_consent",
  "additional_info",
])

/**
 * Alias map to resolve client/server naming drift.
 * LEFT side = incoming (after snake-casing), RIGHT side = actual DB column.
 * Edit the right-hand side to match your real schema.
 */
const CANONICAL_ALIAS: Record<string, string> = {
  // prefer a single column for each pair
  license: "license_number",
  cpr: "cpr_certification",
  other_certs: "other_certifications",
  // background_consent: "background_check_consent", // Removed - use background_consent directly
  drug_testing_consent: "drug_test_consent",
  flu_vaccine: "flu_vaccination",
  immunization_records: "immunization_details",

  // unify reference styles
  reference1_name: "reference_1_name",
  reference1_phone: "reference_1_phone",
  reference1_relationship: "reference_1_relationship",
  reference2_name: "reference_2_name",
  reference2_phone: "reference_2_phone",
  reference2_relationship: "reference_2_relationship",
  reference3_name: "reference_3_name",
  reference3_phone: "reference_3_phone",
  reference3_relationship: "reference_3_relationship",

  // unify emergency styles
  emergency_contact_name: "emergency_name",
  emergency_contact_phone: "emergency_phone",
  emergency_contact_relationship: "emergency_relationship",
}

/** normalize "true/false", "on/off", "1/0", "yes/no", "y/n" → boolean */
const normalizeBoolean = (val: string) => {
  const s = val.toLowerCase()
  if (["true", "on", "1", "yes", "y"].includes(s)) return true
  if (["false", "off", "0", "no", "n"].includes(s)) return false
  return null
}

/** general normalization: empty → null; tolerant boolean parsing */
const normalizeValue = (input: unknown): unknown => {
  if (input === null || input === undefined) return null
  if (typeof input === "boolean") return input
  if (typeof input === "number") return input
  if (typeof input === "string") {
    const trimmed = input.trim()
    if (trimmed.length === 0) return null
    const bool = normalizeBoolean(trimmed)
    if (bool !== null) return bool
    return trimmed
  }
  return input
}

/** lowerCamel / kebab / spaced → snake_case */
const toSnakeCase = (value: string) =>
  value
    .replace(/[\s-]+/g, "_")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()

/** parse *_year columns to integers; handle physical_accommodation string to boolean; pass through others */
const convertForColumn = (column: string, value: unknown) => {
  if (value === null || value === undefined) return null
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value
  if (typeof value === "string") {
    if (column.endsWith("_year")) {
      const parsed = parseInt(value, 10)
      return Number.isNaN(parsed) ? null : parsed
    }
    // Handle physical_accommodation: convert string values to boolean
    // The database column is BOOLEAN, so we need to convert:
    // "yes" → false (can perform without accommodation)
    // "accommodation" → true (can perform with accommodation)
    // "no" → false (cannot perform - stored as false, details in physical_details)
    if (column === "physical_accommodation") {
      const lowerValue = value.toLowerCase().trim()
      if (lowerValue === "accommodation" || lowerValue === "with-accommodation") {
        return true // Accommodation needed
      } else if (lowerValue === "yes") {
        return false // Can perform without accommodation
      } else if (lowerValue === "no") {
        return false // Cannot perform (also false, but physical_details will have details)
      } else {
        // If it's already a boolean string, convert it
        const bool = normalizeBoolean(value)
        return bool !== null ? bool : false
      }
    }
    return value
  }
  return value
}

export async function POST(request: NextRequest) {
  try {
    // Expecting JSON (sent by your client in the "detailed form" step)
    const body = await request.json()
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 })
    }

    const { job_application_id, ...rawFormValues } = body as Record<string, unknown>
    if (!job_application_id || typeof job_application_id !== "string") {
      console.error("Missing job_application_id. Received body keys:", Object.keys(body))
      return NextResponse.json(
        { success: false, error: "Missing required field: job_application_id" },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration")
      return NextResponse.json(
        { success: false, error: "Supabase configuration is missing. Please contact support." },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Ensure the application exists
    const { data: jobApp, error: jobAppError } = await supabase
      .from("job_applications")
      .select("id")
      .eq("id", job_application_id)
      .maybeSingle()

    if (jobAppError || !jobApp) {
      console.error("Job application not found:", jobAppError)
      return NextResponse.json({ success: false, error: "Job application not found" }, { status: 404 })
    }

    // Build payload for application_forms
    const payload: Record<string, unknown> = {}
    const additionalNotes: string[] = []

    for (const [rawKey, rawValue] of Object.entries(rawFormValues)) {
      // 1) normalize to snake_case
      let columnName = toSnakeCase(rawKey)

      // 2) alias to canonical column (if configured)
      if (CANONICAL_ALIAS[columnName]) {
        columnName = CANONICAL_ALIAS[columnName]
      }

      // 3) normalize value (trim/booleans)
      const normalized = normalizeValue(rawValue)
      if (normalized === null) continue

      // 4) keep only allowed columns; unknowns → additional_info
      if (APPLICATION_FORM_COLUMNS.has(columnName)) {
        payload[columnName] = convertForColumn(columnName, normalized)
        // Log background_consent specifically for debugging
        if (columnName === 'background_consent') {
          console.log('✅ Background consent being saved:', {
            rawKey,
            columnName,
            rawValue,
            normalized,
            finalValue: payload[columnName],
            type: typeof payload[columnName]
          })
        }
      } else {
        additionalNotes.push(`${rawKey}: ${normalized}`)
      }
    }

    // Merge unknowns into a readable notes blob
    if (additionalNotes.length) {
      const existingInfo =
        typeof payload["additional_info"] === "string" ? (payload["additional_info"] as string) : ""
      payload["additional_info"] = [existingInfo, additionalNotes.join("\n")]
        .filter(Boolean)
        .join("\n")
    }

    /**
     * UPSERT so retries/edits are idempotent.
     * Require a unique index on application_forms.job_application_id:
     *   CREATE UNIQUE INDEX application_forms_job_application_id_key
     *   ON application_forms(job_application_id);
     */
    const { data: formRecord, error: upsertError } = await supabase
      .from("application_forms")
      .upsert(
        { job_application_id, ...payload },
        { onConflict: "job_application_id" }
      )
      .select("id")
      .maybeSingle()

    if (upsertError || !formRecord?.id) {
      console.error("Upsert error (application_forms):", upsertError)
      return NextResponse.json(
        { success: false, error: upsertError?.message || "Failed to save application form" },
        { status: 500 },
      )
    }

    console.log("Application form saved successfully:", formRecord.id)

    return NextResponse.json({
      success: true,
      message: "Application form saved successfully",
      form_id: formRecord.id,
    })
  } catch (error: any) {
    console.error("Application form save error:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 },
    )
  }
}
