import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Updating job posting:', id)

    // If status is changing to 'active', set posted_date
    if (updates.status === 'active' && !updates.posted_date) {
      updates.posted_date = new Date().toISOString()
    }

    // If status is changing to 'filled', set filled_date
    if (updates.status === 'filled' && !updates.filled_date) {
      updates.filled_date = new Date().toISOString()
    }

    const { data: updatedJob, error: updateError } = await supabase
      .from('job_postings')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        employer:employers(
          company_name,
          city,
          state
        )
      `)
      .single()

    if (updateError) {
      console.error('Update error (job posting):', updateError)
      return NextResponse.json(
        { error: 'Failed to update job posting: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Job posting updated successfully!',
      job: updatedJob,
    })
    
  } catch (error: any) {
    console.error('Job update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

