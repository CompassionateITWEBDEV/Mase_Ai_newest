import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profession = searchParams.get('profession')
    const experience = searchParams.get('experience')
    const location = searchParams.get('location')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Fetching candidate pool...', { profession, experience, location })

    let query = supabase
      .from('applicants')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        profession,
        experience_level,
        education_level,
        certifications,
        city,
        state,
        zip_code,
        profile_views,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by is_active if the column exists (optional)
    // This will be handled by the RLS policy after running the SQL script

    // Filter by profession if specified
    if (profession) {
      query = query.ilike('profession', `%${profession}%`)
    }

    // Filter by experience level if specified
    if (experience) {
      query = query.eq('experience_level', experience)
    }

    // Filter by location if specified
    if (location) {
      query = query.or(`city.ilike.%${location}%,state.ilike.%${location}%`)
    }

    const { data: candidates, error } = await query

    if (error) {
      console.error('Error fetching candidate pool:', error)
      return NextResponse.json(
        { error: 'Failed to fetch candidates: ' + error.message },
        { status: 500 }
      )
    }

    console.log(`Found ${candidates?.length || 0} candidates`)

    // Transform the data
    const transformedCandidates = candidates?.map(candidate => ({
      ...candidate,
      full_name: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
      location: `${candidate.city || 'Unknown'}, ${candidate.state || 'Unknown'}`,
      profile_completion: calculateProfileCompletion(candidate),
      profile_views: candidate.profile_views || 0
    }))

    return NextResponse.json({
      success: true,
      candidates: transformedCandidates,
      count: transformedCandidates?.length || 0,
    })
    
  } catch (error: any) {
    console.error('Candidate pool fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate profile completion
function calculateProfileCompletion(candidate: any): number {
  const fields = [
    'first_name',
    'last_name', 
    'email',
    'phone',
    'profession',
    'experience_level',
    'education_level',
    'city',
    'state'
  ]
  
  const completedFields = fields.filter(field => {
    const value = candidate[field]
    return value && typeof value === 'string' && value.trim() !== ''
  })
  
  return Math.round((completedFields.length / fields.length) * 100)
}
