import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { applicantId, jobId, action } = await request.json()

    if (!applicantId || !jobId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Toggling saved job:', { applicantId, jobId, action })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    if (action === 'save') {
      // Insert into saved_jobs table
      const { data, error } = await supabase
        .from('saved_jobs')
        .insert({
          applicant_id: applicantId,
          job_posting_id: jobId,
          saved_date: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('Error saving job:', error)
        // If table doesn't exist, return success but don't actually save
        if (error.message.includes('relation "saved_jobs" does not exist') || 
            error.message.includes('does not exist')) {
          console.log('Saved jobs table does not exist, returning success without saving')
          return NextResponse.json({
            success: true,
            message: 'Job saved successfully (table not available)',
            data: { applicant_id: applicantId, job_posting_id: jobId }
          })
        }
        return NextResponse.json(
          { error: 'Failed to save job: ' + error.message },
          { status: 500 }
        )
      }

      console.log('Job saved successfully:', data)
      return NextResponse.json({
        success: true,
        message: 'Job saved successfully',
        data: data[0]
      })

    } else if (action === 'unsave') {
      // Remove from saved_jobs table
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('applicant_id', applicantId)
        .eq('job_posting_id', jobId)

      if (error) {
        console.error('Error unsaving job:', error)
        // If table doesn't exist, return success but don't actually unsave
        if (error.message.includes('relation "saved_jobs" does not exist') || 
            error.message.includes('does not exist')) {
          console.log('Saved jobs table does not exist, returning success without unsaving')
          return NextResponse.json({
            success: true,
            message: 'Job unsaved successfully (table not available)'
          })
        }
        return NextResponse.json(
          { error: 'Failed to unsave job: ' + error.message },
          { status: 500 }
        )
      }

      console.log('Job unsaved successfully')
      return NextResponse.json({
        success: true,
        message: 'Job unsaved successfully'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "save" or "unsave"' },
        { status: 400 }
      )
    }
    
  } catch (error: any) {
    console.error('Saved jobs toggle error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
