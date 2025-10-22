import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get basic metrics
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*')
      .gte('sent_at', startDate.toISOString())

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError)
      return NextResponse.json(
        { error: 'Failed to fetch invitation data' },
        { status: 500 }
      )
    }

    // Calculate metrics
    const totalSent = invitations?.length || 0
    const opened = invitations?.filter(inv => inv.opened_at)?.length || 0
    const clicked = invitations?.filter(inv => inv.clicked_at)?.length || 0
    const applied = invitations?.filter(inv => inv.applied_at)?.length || 0

    const openRate = totalSent > 0 ? (opened / totalSent) * 100 : 0
    const clickRate = totalSent > 0 ? (clicked / totalSent) * 100 : 0
    const conversionRate = totalSent > 0 ? (applied / totalSent) * 100 : 0

    // Get metrics by template type
    const templateMetrics = {}
    const templateTypes = [...new Set(invitations?.map(inv => inv.template_type) || [])]

    for (const templateType of templateTypes) {
      const templateInvitations = invitations?.filter(inv => inv.template_type === templateType) || []
      const templateSent = templateInvitations.length
      const templateOpened = templateInvitations.filter(inv => inv.opened_at).length
      const templateClicked = templateInvitations.filter(inv => inv.clicked_at).length
      const templateApplied = templateInvitations.filter(inv => inv.applied_at).length

      templateMetrics[templateType] = {
        sent: templateSent,
        opened: templateOpened,
        clicked: templateClicked,
        applied: templateApplied,
        openRate: templateSent > 0 ? (templateOpened / templateSent) * 100 : 0,
        clickRate: templateSent > 0 ? (templateClicked / templateSent) * 100 : 0,
        conversionRate: templateSent > 0 ? (templateApplied / templateSent) * 100 : 0
      }
    }

    // Get daily metrics for the last 30 days
    const dailyMetrics = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayInvitations = invitations?.filter(inv => 
        inv.sent_at?.startsWith(dateStr)
      ) || []

      dailyMetrics.push({
        date: dateStr,
        sent: dayInvitations.length,
        opened: dayInvitations.filter(inv => inv.opened_at?.startsWith(dateStr)).length,
        applied: dayInvitations.filter(inv => inv.applied_at?.startsWith(dateStr)).length
      })
    }

    // Get top positions
    const positionCounts = {}
    invitations?.forEach(inv => {
      positionCounts[inv.position] = (positionCounts[inv.position] || 0) + 1
    })

    const topPositions = Object.entries(positionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([position, count]) => ({ position, count }))

    return NextResponse.json({
      success: true,
      metrics: {
        totalSent,
        opened,
        clicked,
        applied,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      templateMetrics,
      dailyMetrics,
      topPositions,
      period: `${days} days`
    })

  } catch (error: any) {
    console.error('Invitation analytics API error:', error)
    
    // Return default analytics data instead of error
    return NextResponse.json({
      success: true,
      metrics: {
        totalSent: 0,
        opened: 0,
        clicked: 0,
        applied: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0
      },
      templateMetrics: {},
      dailyMetrics: [],
      topPositions: [],
      period: `${days} days`,
      error: error.message
    })
  }
}
