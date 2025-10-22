import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { applicantId } = await request.json()

    if (!applicantId) {
      return NextResponse.json(
        { error: 'Applicant ID is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Incrementing profile views for applicant:', applicantId)

    // Increment the profile_views count
    const { data, error } = await supabase
      .from('applicants')
      .update({ 
        profile_views: supabase.raw('profile_views + 1')
      })
      .eq('id', applicantId)
      .select('profile_views')
      .single()

    if (error) {
      console.error('Error incrementing profile views:', error)
      return NextResponse.json(
        { error: 'Failed to increment profile views: ' + error.message },
        { status: 500 }
      )
    }

    console.log('Profile views incremented successfully:', data)

    return NextResponse.json({
      success: true,
      profileViews: data.profile_views,
      message: 'Profile views incremented successfully'
    })
    
  } catch (error: any) {
    console.error('Profile views increment error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
