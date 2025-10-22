import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicantId = searchParams.get('applicant_id')

    if (!applicantId) {
      return NextResponse.json(
        { error: 'Missing applicant_id' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Fetch recent activities from multiple sources
    const activities = []

    // 1. Recent job applications
    const { data: applications, error: appError } = await supabase
      .from('job_applications')
      .select(`
        id,
        applied_date,
        status,
        job_posting:job_postings(
          title,
          company_name
        )
      `)
      .eq('applicant_id', applicantId)
      .order('applied_date', { ascending: false })
      .limit(5)

    if (!appError && applications) {
      applications.forEach(app => {
        const timeAgo = getTimeAgo(new Date(app.applied_date))
        activities.push({
          id: `app_${app.id}`,
          type: 'application',
          message: `Applied for ${app.job_posting?.title || 'position'} at ${app.job_posting?.company_name || 'company'}`,
          time: timeAgo,
          timestamp: new Date(app.applied_date),
          icon: '📝'
        })
      })
    }

    // 2. Recent saved jobs
    const { data: savedJobs, error: savedError } = await supabase
      .from('saved_jobs')
      .select(`
        id,
        saved_date,
        job_posting:job_postings(
          title,
          company_name
        )
      `)
      .eq('applicant_id', applicantId)
      .order('saved_date', { ascending: false })
      .limit(3)

    if (!savedError && savedJobs) {
      savedJobs.forEach(saved => {
        const timeAgo = getTimeAgo(new Date(saved.saved_date))
        activities.push({
          id: `saved_${saved.id}`,
          type: 'saved',
          message: `Saved ${saved.job_posting?.title || 'position'} at ${saved.job_posting?.company_name || 'company'}`,
          time: timeAgo,
          timestamp: new Date(saved.saved_date),
          icon: '⭐'
        })
      })
    }

    // 3. Profile views (if we have this data)
    const { data: profileViews, error: viewsError } = await supabase
      .from('applicants')
      .select('profile_views, updated_at')
      .eq('id', applicantId)
      .single()

    if (!viewsError && profileViews && profileViews.profile_views > 0) {
      const timeAgo = getTimeAgo(new Date(profileViews.updated_at))
      activities.push({
        id: 'profile_view',
        type: 'profile_view',
        message: `Your profile was viewed by employers`,
        time: timeAgo,
        timestamp: new Date(profileViews.updated_at),
        icon: '👁️'
      })
    }

    // 4. Document uploads
    const { data: documents, error: docError } = await supabase
      .from('applicant_documents')
      .select('id, uploaded_date, document_type, file_name')
      .eq('applicant_id', applicantId)
      .order('uploaded_date', { ascending: false })
      .limit(3)

    if (!docError && documents) {
      documents.forEach(doc => {
        const timeAgo = getTimeAgo(new Date(doc.uploaded_date))
        activities.push({
          id: `doc_${doc.id}`,
          type: 'document',
          message: `Uploaded ${doc.document_type.replace('_', ' ')} document`,
          time: timeAgo,
          timestamp: new Date(doc.uploaded_date),
          icon: '📄'
        })
      })
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Return only the 10 most recent activities
    return NextResponse.json({ 
      success: true, 
      activities: activities.slice(0, 10) 
    })

  } catch (error: any) {
    console.error('Recent activities API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000)
    return `${months} month${months > 1 ? 's' : ''} ago`
  } else {
    const years = Math.floor(diffInSeconds / 31536000)
    return `${years} year${years > 1 ? 's' : ''} ago`
  }
}
