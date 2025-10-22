import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Test basic connection
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .limit(5)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      })
    }

    // Calculate basic metrics
    const totalSent = invitations?.length || 0
    const opened = invitations?.filter(inv => inv.opened_at)?.length || 0
    const clicked = invitations?.filter(inv => inv.clicked_at)?.length || 0
    const applied = invitations?.filter(inv => inv.applied_at)?.length || 0

    const openRate = totalSent > 0 ? (opened / totalSent) * 100 : 0
    const clickRate = totalSent > 0 ? (clicked / totalSent) * 100 : 0
    const conversionRate = totalSent > 0 ? (applied / totalSent) * 100 : 0

    return NextResponse.json({
      success: true,
      test: 'Analytics API working',
      data: {
        totalSent,
        opened,
        clicked,
        applied,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      rawData: invitations
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}
