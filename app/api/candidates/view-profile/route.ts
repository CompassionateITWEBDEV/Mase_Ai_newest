import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { candidateId } = await request.json()

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Use service role key if available (bypasses RLS), otherwise use anon key
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Incrementing profile views for candidate:', candidateId)

    // First get the current view count
    const { data: currentData, error: fetchError } = await supabase
      .from('applicants')
      .select('profile_views')
      .eq('id', candidateId)
      .single()

    if (fetchError) {
      console.error('Error fetching current profile views:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch current profile views: ' + fetchError.message },
        { status: 500 }
      )
    }

    const currentViews = currentData.profile_views || 0

    // Increment the view count
    const { data, error } = await supabase
      .from('applicants')
      .update({
        profile_views: currentViews + 1
      })
      .eq('id', candidateId)
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
      profile_views: data.profile_views,
      message: 'Profile view tracked successfully'
    })

  } catch (error: any) {
    console.error('Profile view tracking error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

