import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Singleton Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null

function getServiceClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  }
  return supabaseClient
}

// =====================================================
// POST: Upload exercise video
// =====================================================
export async function POST(request: NextRequest) {
  console.log('[Video Upload API] POST request received')
  try {
    const supabase = getServiceClient()
    const formData = await request.formData()
    
    const file = formData.get('video') as File
    const exerciseName = formData.get('exerciseName') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP4, WebM, MOV, and AVI are supported.' },
        { status: 400 }
      )
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 100MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      )
    }

    // Generate unique file path
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileExt = file.name.split('.').pop()
    const sanitizedName = (exerciseName || 'exercise').replace(/[^a-zA-Z0-9-]/g, '_')
    const filePath = `pt-exercises/${sanitizedName}_${timestamp}_${randomStr}.${fileExt}`

    console.log('[Video Upload API] Uploading to:', filePath)

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('exercise-videos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('[Video Upload API] Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload video: ' + uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('exercise-videos')
      .getPublicUrl(filePath)

    console.log('[Video Upload API] Upload successful:', urlData.publicUrl)

    return NextResponse.json({
      success: true,
      videoUrl: urlData.publicUrl,
      filePath: filePath,
      fileName: file.name,
      fileSize: file.size,
      message: 'Video uploaded successfully'
    })

  } catch (error) {
    console.error('[Video Upload API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to upload video: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

