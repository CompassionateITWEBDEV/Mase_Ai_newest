import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')
    const action = searchParams.get('action')

    console.log('🔍 Debug tracking request:', { invitationId, action })

    if (!invitationId) {
      return NextResponse.json({ 
        error: 'Missing invitation ID',
        debug: 'Add ?id=your-invitation-id to test'
      })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get the invitation record
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (fetchError) {
      return NextResponse.json({
        error: 'Invitation not found',
        details: fetchError,
        invitationId
      })
    }

    // If action is provided, simulate the tracking
    if (action) {
      const updateData: any = {}
      
      if (action === 'open') {
        updateData.opened_at = new Date().toISOString()
      } else if (action === 'click') {
        updateData.clicked_at = new Date().toISOString()
      }

      const { data: updatedInvitation, error: updateError } = await supabase
        .from('invitations')
        .update(updateData)
        .eq('id', invitationId)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({
          error: 'Failed to update invitation',
          details: updateError,
          invitationId,
          action
        })
      }

      return NextResponse.json({
        success: true,
        message: `Successfully tracked ${action}`,
        invitationId,
        action,
        before: invitation,
        after: updatedInvitation
      })
    }

    // Return invitation details
    return NextResponse.json({
      success: true,
      invitation,
      invitationId,
      message: 'Invitation found. Add ?action=open or ?action=click to test tracking'
    })

  } catch (error: any) {
    console.error('Debug tracking error:', error)
    return NextResponse.json({
      error: 'Debug tracking failed',
      details: error.message,
      stack: error.stack
    })
  }
}
