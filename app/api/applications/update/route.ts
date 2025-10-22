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

    console.log('Updating application:', id)

    const { data: updatedApplication, error: updateError } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        job_posting:job_postings(
          id,
          title,
          description,
          job_type,
          salary_min,
          salary_max,
          salary_type,
          city,
          state,
          employer:employers(
            company_name
          )
        )
      `)
      .single()

    if (updateError) {
      console.error('Update error (application):', updateError)
      return NextResponse.json(
        { error: 'Failed to update application: ' + updateError.message },
        { status: 500 }
      )
    }

    // Transform the data to include company name
    const transformedApplication = {
      ...updatedApplication,
      job_posting: updatedApplication.job_posting ? {
        ...updatedApplication.job_posting,
        company_name: updatedApplication.job_posting.employer?.company_name || 'Unknown Company',
        location: `${updatedApplication.job_posting.city}, ${updatedApplication.job_posting.state}`
      } : null
    }

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully!',
      application: transformedApplication,
    })
    
  } catch (error: any) {
    console.error('Application update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
