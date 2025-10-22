import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { jobId, statType } = await request.json()

    if (!jobId || !statType) {
      return NextResponse.json(
        { error: 'Job ID and stat type are required' },
        { status: 400 }
      )
    }

    if (!['views', 'applications', 'saves'].includes(statType)) {
      return NextResponse.json(
        { error: 'Invalid stat type. Must be views, applications, or saves' },
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

    console.log(`Incrementing ${statType} for job:`, jobId)

    // Map stat type to database column
    const columnMap = {
      views: 'views_count',
      applications: 'applications_count', 
      saves: 'saved_count'
    }

    const column = columnMap[statType as keyof typeof columnMap]

    // First get the current count
    const { data: currentData, error: fetchError } = await supabase
      .from('job_postings')
      .select(`${column}`)
      .eq('id', jobId)
      .single()

    if (fetchError) {
      console.error(`Error fetching current ${statType}:`, fetchError)
      return NextResponse.json(
        { error: `Failed to fetch current ${statType}: ` + fetchError.message },
        { status: 500 }
      )
    }

    const currentCount = currentData[column] || 0

    // Increment the count
    const { data, error } = await supabase
      .from('job_postings')
      .update({ 
        [column]: currentCount + 1
      })
      .eq('id', jobId)
      .select(`${column}`)
      .single()

    if (error) {
      console.error(`Error incrementing ${statType}:`, error)
      return NextResponse.json(
        { error: `Failed to increment ${statType}: ` + error.message },
        { status: 500 }
      )
    }

    console.log(`${statType} incremented successfully:`, data)

    return NextResponse.json({
      success: true,
      [statType]: data[column],
      message: `${statType} incremented successfully`
    })
    
  } catch (error: any) {
    console.error('Stat increment error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
