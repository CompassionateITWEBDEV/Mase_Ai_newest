import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { 
      applicationId, 
      offerSalary, 
      offerStartDate, 
      offerExpiryDate, 
      offerNotes, 
      benefits,
      workSchedule 
    } = await request.json()

    if (!applicationId || !offerSalary || !offerStartDate || !offerExpiryDate) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, offerSalary, offerStartDate, offerExpiryDate' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Update application status to offer_received
    const { data: updatedApplication, error: updateError } = await supabase
      .from('job_applications')
      .update({
        status: 'offer_received',
        offer_salary: offerSalary,
        offer_start_date: offerStartDate,
        offer_expiry_date: offerExpiryDate,
        offer_notes: offerNotes,
        offer_benefits: benefits,
        offer_work_schedule: workSchedule,
        offer_sent_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select(`
        *,
        applicant:applicants(
          first_name,
          last_name,
          email,
          phone
        ),
        job_posting:job_postings(
          title,
          company_name
        )
      `)
      .single()

    if (updateError) {
      console.error('Error sending offer:', updateError)
      return NextResponse.json(
        { error: 'Failed to send offer: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: 'Job offer sent successfully'
    })

  } catch (error: any) {
    console.error('Send offer API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
