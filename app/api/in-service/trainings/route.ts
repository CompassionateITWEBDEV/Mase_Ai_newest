import { type NextRequest, NextResponse } from "next/server"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Configure runtime for Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Singleton clients for better connection management
let serviceClient: SupabaseClient | null = null
let anonClient: SupabaseClient | null = null

// Helper to get service role client (bypasses RLS)
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase service role credentials")
  }

  if (!serviceClient) {
    serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return serviceClient
}

// Helper to get regular client (respects RLS)
function getClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase anon credentials")
  }

  if (!anonClient) {
    anonClient = createClient(supabaseUrl, supabaseAnonKey)
  }

  return anonClient
}

export async function GET(request: NextRequest) {
  try {
    console.log("=== GET /api/in-service/trainings - START ===")
    console.log("Request URL:", request.url)
    
    // Use service role client to bypass RLS for GET requests (admin endpoint)
    // This ensures trainings are always visible regardless of RLS policies
    let supabase = getServiceClient()
    console.log("Supabase client created (service role), URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING")
    console.log("Service key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING")

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const role = searchParams.get("role")
    const mandatory = searchParams.get("mandatory")
    const trainingId = searchParams.get("trainingId")
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100 // Default limit to 100
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0
    
    console.log("Query params:", { category, role, mandatory, trainingId, limit, offset })

    // Build query - don't filter by status, show all trainings
    // Add pagination to prevent timeouts
    let query = supabase.from("in_service_trainings").select("*").limit(limit).range(offset, offset + limit - 1)
    console.log("Initial query built with pagination:", { limit, offset })

    // Apply filters
    if (trainingId) {
      query = query.eq("id", trainingId)
      console.log("Applied trainingId filter:", trainingId)
    }

    if (category && category !== "all") {
      query = query.eq("category", category)
      console.log("Applied category filter:", category)
    }

    if (mandatory !== null) {
      const isMandatory = mandatory === "true"
      query = query.eq("mandatory", isMandatory)
      console.log("Applied mandatory filter:", isMandatory)
    }

    console.log("Executing query...")
    const { data: trainings, error } = await query.order("created_at", { ascending: false })
    console.log("Query executed. Results:", { 
      count: trainings?.length || 0, 
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.code
    })

    if (error) {
      console.error("❌ ERROR fetching trainings:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2)
      })
      
      // Check if table doesn't exist
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.error("❌ Table does not exist!")
        return NextResponse.json({ 
          success: false,
          error: "Database table 'in_service_trainings' does not exist. Please run the migration script: scripts/060-create-in-service-training-tables.sql",
          code: error.code,
          hint: "Run the SQL script in your Supabase SQL editor",
          trainings: [], // Return empty array so frontend doesn't break
        }, { status: 200 }) // Return 200 so frontend can show the error message
      }
      
      console.error("❌ Returning error response")
      return NextResponse.json({ 
        success: false,
        error: "Failed to fetch trainings: " + error.message,
        code: error.code,
        trainings: [],
      }, { status: 500 })
    }
    
    console.log(`✅ Fetched ${trainings?.length || 0} trainings from database`)
    
    // Log sample training if found
    if (trainings && trainings.length > 0) {
      console.log("Sample training:", {
        id: trainings[0].id,
        title: trainings[0].title,
        category: trainings[0].category,
        status: trainings[0].status
      })
    }

    // Get enrollments and completions counts efficiently (only 2 queries total)
    const trainingIds = (trainings || []).map((t: any) => t.id)
    console.log(`Calculating counts for ${trainingIds.length} trainings`)
    
    let enrollmentsCount: Record<string, number> = {}
    let completionsCount: Record<string, number> = {}
    
    if (trainingIds.length > 0 && trainingIds.length <= 200) {
      // Only fetch counts if reasonable number of trainings (prevent timeout)
      console.log("Fetching enrollment and completion counts...")
      
      // Use Promise.allSettled for parallel queries with proper error handling
      const [enrollmentsResult, completionsResult] = await Promise.allSettled([
        supabase
          .from("in_service_enrollments")
          .select("id, training_id, status")
          .in("training_id", trainingIds),
        supabase
          .from("in_service_completions")
          .select("training_id, enrollment_id")
          .in("training_id", trainingIds)
      ])

      // Handle enrollments result
      if (enrollmentsResult.status === "fulfilled" && !enrollmentsResult.value.error) {
        const enrollments = enrollmentsResult.value.data
        if (enrollments) {
          // Count ALL enrollments (regardless of status) for enrolledCount
          enrollmentsCount = enrollments.reduce((acc: Record<string, number>, e: any) => {
            acc[e.training_id] = (acc[e.training_id] || 0) + 1
            return acc
          }, {})
          console.log(`✅ Counted enrollments for ${Object.keys(enrollmentsCount).length} trainings`)
        }
      } else {
        console.warn("⚠️ Error fetching enrollments:", enrollmentsResult.status === "rejected" ? enrollmentsResult.reason : enrollmentsResult.value.error)
      }

      // Handle completions result
      if (completionsResult.status === "fulfilled" && !completionsResult.value.error) {
        const completions = completionsResult.value.data
        const enrollments = enrollmentsResult.status === "fulfilled" ? enrollmentsResult.value.data : null
        
        if (completions && enrollments) {
          // Get enrollment IDs that have completion records
          const enrollmentIdsWithCompletions = new Set(
            completions.map((c: any) => c.enrollment_id).filter(Boolean)
          )
          
          // Count completions from completions table (these have certificates)
          completionsCount = completions.reduce((acc: Record<string, number>, c: any) => {
            acc[c.training_id] = (acc[c.training_id] || 0) + 1
            return acc
          }, {})
          
          // Also count enrollments with status='completed' that DON'T have completion records
          enrollments
            .filter((e: any) => 
              e.status === 'completed' && 
              !enrollmentIdsWithCompletions.has(e.id)
            )
            .forEach((e: any) => {
              completionsCount[e.training_id] = (completionsCount[e.training_id] || 0) + 1
            })
          
          console.log(`✅ Counted completions for ${Object.keys(completionsCount).length} trainings (from both sources, no double counting)`)
        }
      } else {
        console.warn("⚠️ Error fetching completions:", completionsResult.status === "rejected" ? completionsResult.reason : completionsResult.value.error)
      }
    } else if (trainingIds.length > 200) {
      console.warn(`⚠️ Too many trainings (${trainingIds.length}) - skipping count queries to prevent timeout`)
    }

    // Filter by role if specified
    let filteredTrainings = trainings || []
    if (role && role !== "all") {
      filteredTrainings = filteredTrainings.filter(
        (t) => t.target_roles.includes(role) || t.target_roles.includes("All")
      )
    }

    // Transform data to match frontend expectations
    console.log("Transforming trainings data...")
    const transformedTrainings = filteredTrainings.map((t) => {
      try {
        const transformed = {
          id: t.id,
          training_code: t.training_code,
          title: t.title,
          category: t.category,
          type: t.type,
          duration: t.duration,
          ceuHours: parseFloat(t.ceu_hours?.toString() || "0"),
          description: t.description,
          targetRoles: Array.isArray(t.target_roles) ? t.target_roles : (t.target_roles ? [t.target_roles] : []),
          difficulty: t.difficulty,
          prerequisites: t.prerequisites || [],
          accreditation: t.accreditation,
          expiryMonths: t.expiry_months,
          mandatory: t.mandatory || false,
          dueDate: t.due_date,
          status: t.status || "active",
          enrolledCount: enrollmentsCount[t.id] || t.enrolled_count || 0,
          completedCount: completionsCount[t.id] || t.completed_count || 0,
          averageScore: parseFloat(t.average_score?.toString() || "0"),
          modules: Array.isArray(t.modules) ? t.modules : (t.modules ? [t.modules] : []),
          quiz: t.quiz_config || { questions: 10, passingScore: 80, attempts: 3 },
          createdDate: t.created_at,
          lastUpdated: t.updated_at,
        }
        return transformed
      } catch (transformError: any) {
        console.error("❌ Error transforming training:", t.id, transformError.message)
        return null
      }
    }).filter((t): t is NonNullable<typeof t> => t !== null)
    
    console.log(`✅ Transformed ${transformedTrainings.length} trainings`)

    // Calculate summary statistics
    const summary = {
      totalTrainings: transformedTrainings.length,
      activeTrainings: transformedTrainings.filter((t) => t.status === "active").length,
      mandatoryTrainings: transformedTrainings.filter((t) => t.mandatory).length,
      totalEnrolled: transformedTrainings.reduce((sum, t) => sum + t.enrolledCount, 0),
      totalCompleted: transformedTrainings.reduce((sum, t) => sum + t.completedCount, 0),
      averageCompletionRate:
        transformedTrainings.length > 0
          ? Math.round(
              (transformedTrainings.reduce(
                (sum, t) => sum + (t.enrolledCount > 0 ? (t.completedCount / t.enrolledCount) * 100 : 0),
                0,
              ) /
                transformedTrainings.length) *
                10,
            ) / 10
          : 0,
    }

    const jsonResponse = NextResponse.json({
      success: true,
      trainings: transformedTrainings || [],
      total: transformedTrainings?.length || 0,
      summary,
      timestamp: new Date().toISOString(),
    })

    // Disable caching for fresh data
    jsonResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    jsonResponse.headers.set('CDN-Cache-Control', 'no-store')
    jsonResponse.headers.set('Vercel-CDN-Cache-Control', 'no-store')
    
    console.log("=== GET /api/in-service/trainings - SUCCESS ===")
    console.log(`Returning ${transformedTrainings.length} trainings`)
    
    return jsonResponse
  } catch (error: any) {
    console.error("=== GET /api/in-service/trainings - EXCEPTION ===")
    console.error("Error:", error.message)
    console.error("Stack:", error.stack)
    console.error("Full error:", JSON.stringify(error, null, 2))
    
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch trainings: " + (error.message || "Unknown error"),
      trainings: [],
      total: 0,
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for admin operations
    const supabase = getServiceClient()

    const trainingData = await request.json()

    // Validate required fields
    const requiredFields = ["title", "category", "duration", "ceuHours", "description", "targetRoles"]
    for (const field of requiredFields) {
      if (!trainingData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Generate training code if not provided
    const trainingCode = trainingData.training_code || `IS-${Date.now()}`

    // Prepare data for database
    const dbData = {
      training_code: trainingCode,
      title: trainingData.title,
      category: trainingData.category,
      type: trainingData.type || "online_course",
      duration: parseInt(trainingData.duration),
      ceu_hours: parseFloat(trainingData.ceuHours),
      description: trainingData.description,
      target_roles: Array.isArray(trainingData.targetRoles) ? trainingData.targetRoles : [trainingData.targetRoles],
      difficulty: trainingData.difficulty || "Basic",
      prerequisites: trainingData.prerequisites || [],
      accreditation: trainingData.accreditation || null,
      expiry_months: trainingData.expiryMonths || null,
      mandatory: trainingData.mandatory || false,
      due_date: trainingData.dueDate || null,
      status: trainingData.status || "draft",
      modules: trainingData.modules || [],
      quiz_config: trainingData.quiz || {
        questions: 10,
        passingScore: 80,
        attempts: 3,
      },
      enrolled_count: 0,
      completed_count: 0,
      average_score: 0,
    }

    console.log("Attempting to insert training:", { 
      training_code: dbData.training_code, 
      title: dbData.title,
      modules_count: Array.isArray(dbData.modules) ? dbData.modules.length : 0,
    })
    
    // Optimize modules data to prevent timeout with large video files
    if (Array.isArray(dbData.modules) && dbData.modules.length > 0) {
      console.log("Modules to save:", dbData.modules.map((m: any) => ({
        id: m.id,
        title: m.title,
        duration: m.duration,
        fileName: m.fileName,
        fileUrl: m.fileUrl ? (
          m.fileUrl.startsWith('http') 
            ? `${m.fileUrl.substring(0, 80)}... (Storage URL)` 
            : m.fileUrl.length > 100 
              ? `${m.fileUrl.substring(0, 100)}... (Base64)` 
              : m.fileUrl
        ) : "MISSING",
        storageType: m.fileUrl?.startsWith('http') ? 'Storage' : m.fileUrl?.startsWith('data:') ? 'Base64' : 'None',
      })))
      
      // Log storage vs base64 usage
      const storageCount = dbData.modules.filter((m: any) => m.fileUrl?.startsWith('http')).length
      const base64Count = dbData.modules.filter((m: any) => m.fileUrl?.startsWith('data:')).length
      console.log(`📊 Storage usage: ${storageCount} storage URLs, ${base64Count} base64 files`)
      
      // Optimize modules: Only check base64 files (storage URLs are small and fast)
      dbData.modules = dbData.modules.map((m: any) => {
        const module = { ...m }
        // Only log warnings for base64 files (storage URLs won't cause timeout)
        if (module.fileUrl && module.fileUrl.startsWith('data:')) {
          const base64Size = module.fileUrl.length
          if (base64Size > 10 * 1024 * 1024) { // > 10MB base64
            console.warn(`⚠️ Large base64 file: ${module.fileName} (${Math.round(base64Size / 1024 / 1024)}MB base64)`)
            console.warn(`💡 Consider using Supabase Storage for faster uploads`)
          }
        } else if (module.fileUrl && module.fileUrl.startsWith('http')) {
          console.log(`✓ Using storage URL for: ${module.fileName} (fast, no timeout risk)`)
        }
        return module
      })
    }
    
    // Check for very large base64 video files that might cause timeout
    // Note: Storage URLs won't cause timeout, so we only check base64
    let hasLargeVideos = false
    if (Array.isArray(dbData.modules)) {
      for (const module of dbData.modules) {
        // Only check base64 videos (storage URLs are safe)
        if (module.fileUrl && module.fileUrl.startsWith('data:video/')) {
          const base64Size = module.fileUrl.length
          if (base64Size > 50 * 1024 * 1024) { // > 50MB base64 (~37MB actual video)
            hasLargeVideos = true
            console.warn(`⚠️ Large base64 video detected: ${module.fileName} (${Math.round(base64Size / 1024 / 1024)}MB base64)`)
            console.warn(`⚠️ This may cause timeout. Videos should use Supabase Storage.`)
          }
        }
      }
    }
    
    // Insert training with optimized query
    // Note: For very large videos, consider using Supabase Storage instead of base64
    const { data: newTraining, error } = await supabase
      .from("in_service_trainings")
      .insert(dbData)
      .select()
      .single()

    if (error) {
      console.error("Error creating training:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      
      // Check if table doesn't exist
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ 
          error: "Database table 'in_service_trainings' does not exist. Please run the migration script: scripts/060-create-in-service-training-tables.sql",
          code: error.code,
          hint: "Run the SQL script in your Supabase SQL editor",
        }, { status: 500 })
      }
      
      // Handle timeout errors specifically
      if (error.code === "57014" || error.message?.includes("timeout") || error.message?.includes("canceling statement")) {
        const errorMessage = hasLargeVideos
          ? "Training creation timed out. Large video files (>50MB) may cause timeouts. Please try:\n1. Compress videos to <50MB\n2. Use shorter videos\n3. Split into multiple smaller modules\n4. Consider using Supabase Storage for large videos"
          : "Training creation timed out. The database operation took too long. Please try:\n1. Reduce the number of modules\n2. Use smaller file sizes\n3. Try again in a moment"
        
        return NextResponse.json({ 
          error: errorMessage,
          code: error.code,
          details: "Statement timeout - operation exceeded database timeout limit",
          hint: "Reduce file sizes or number of modules",
          timeout: true,
        }, { status: 504 }) // 504 Gateway Timeout
      }
      
      return NextResponse.json({ 
        error: "Failed to create training: " + error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }, { status: 500 })
    }
    
    console.log("Training created successfully:", newTraining.id)
    console.log("Saved modules:", {
      count: Array.isArray(newTraining.modules) ? newTraining.modules.length : 0,
      modules: Array.isArray(newTraining.modules) ? newTraining.modules.map((m: any) => ({
        title: m.title,
        fileUrl: m.fileUrl ? "SET" : "MISSING",
        fileName: m.fileName,
      })) : []
    })

    // Transform response
    const transformedTraining = {
      id: newTraining.id,
      training_code: newTraining.training_code,
      title: newTraining.title,
      category: newTraining.category,
      type: newTraining.type,
      duration: newTraining.duration,
      ceuHours: parseFloat(newTraining.ceu_hours.toString()),
      description: newTraining.description,
      targetRoles: newTraining.target_roles || [],
      difficulty: newTraining.difficulty,
      prerequisites: newTraining.prerequisites || [],
      accreditation: newTraining.accreditation,
      expiryMonths: newTraining.expiry_months,
      mandatory: newTraining.mandatory,
      dueDate: newTraining.due_date,
      status: newTraining.status,
      enrolledCount: newTraining.enrolled_count || 0,
      completedCount: newTraining.completed_count || 0,
      averageScore: parseFloat(newTraining.average_score?.toString() || "0"),
      modules: Array.isArray(newTraining.modules) ? newTraining.modules : (newTraining.modules ? [newTraining.modules] : []),
      quiz: newTraining.quiz_config || { questions: 10, passingScore: 80, attempts: 3 },
      createdDate: newTraining.created_at,
      lastUpdated: newTraining.updated_at,
    }

    return NextResponse.json({
      success: true,
      training: transformedTraining,
      message: "Training created successfully",
    })
  } catch (error) {
    console.error("Error creating training:", error)
    return NextResponse.json({ error: "Failed to create training" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for admin operations
    const supabase = getServiceClient()

    const { trainingId, ...updateData } = await request.json()

    if (!trainingId) {
      return NextResponse.json({ error: "Training ID required" }, { status: 400 })
    }

    // Transform frontend data to database format
    const dbUpdateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updateData.title) dbUpdateData.title = updateData.title
    if (updateData.category) dbUpdateData.category = updateData.category
    if (updateData.type) dbUpdateData.type = updateData.type
    if (updateData.duration) dbUpdateData.duration = parseInt(updateData.duration)
    if (updateData.ceuHours) dbUpdateData.ceu_hours = parseFloat(updateData.ceuHours)
    if (updateData.description) dbUpdateData.description = updateData.description
    if (updateData.targetRoles) dbUpdateData.target_roles = Array.isArray(updateData.targetRoles) ? updateData.targetRoles : [updateData.targetRoles]
    if (updateData.difficulty) dbUpdateData.difficulty = updateData.difficulty
    if (updateData.prerequisites) dbUpdateData.prerequisites = updateData.prerequisites
    if (updateData.accreditation !== undefined) dbUpdateData.accreditation = updateData.accreditation
    if (updateData.expiryMonths !== undefined) dbUpdateData.expiry_months = updateData.expiryMonths
    if (updateData.mandatory !== undefined) dbUpdateData.mandatory = updateData.mandatory
    if (updateData.dueDate !== undefined) dbUpdateData.due_date = updateData.dueDate
    if (updateData.status) dbUpdateData.status = updateData.status
    if (updateData.modules) dbUpdateData.modules = updateData.modules
    if (updateData.quiz) dbUpdateData.quiz_config = updateData.quiz

    const { data: updatedTraining, error } = await supabase
      .from("in_service_trainings")
      .update(dbUpdateData)
      .eq("id", trainingId)
      .select()
      .single()

    if (error) {
      console.error("Error updating training:", error)
      return NextResponse.json({ error: "Failed to update training: " + error.message }, { status: 500 })
    }

    // Transform response
    const transformedTraining = {
      id: updatedTraining.id,
      training_code: updatedTraining.training_code,
      title: updatedTraining.title,
      category: updatedTraining.category,
      type: updatedTraining.type,
      duration: updatedTraining.duration,
      ceuHours: parseFloat(updatedTraining.ceu_hours.toString()),
      description: updatedTraining.description,
      targetRoles: updatedTraining.target_roles || [],
      difficulty: updatedTraining.difficulty,
      prerequisites: updatedTraining.prerequisites || [],
      accreditation: updatedTraining.accreditation,
      expiryMonths: updatedTraining.expiry_months,
      mandatory: updatedTraining.mandatory,
      dueDate: updatedTraining.due_date,
      status: updatedTraining.status,
      enrolledCount: updatedTraining.enrolled_count || 0,
      completedCount: updatedTraining.completed_count || 0,
      averageScore: parseFloat(updatedTraining.average_score?.toString() || "0"),
      modules: updatedTraining.modules || [],
      quiz: updatedTraining.quiz_config || { questions: 10, passingScore: 80, attempts: 3 },
      createdDate: updatedTraining.created_at,
      lastUpdated: updatedTraining.updated_at,
    }

    return NextResponse.json({
      success: true,
      training: transformedTraining,
      message: "Training updated successfully",
    })
  } catch (error) {
    console.error("Error updating training:", error)
    return NextResponse.json({ error: "Failed to update training" }, { status: 500 })
  }
}
