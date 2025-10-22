import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { invitationId, action, applicationId } = await request.json()

    if (!invitationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: invitationId, action' },
        { status: 400 }
      )
    }

    if (!['opened', 'clicked', 'applied'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be opened, clicked, or applied' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Prepare update data based on action
    const updateData: any = {
      status: action,
      updated_at: new Date().toISOString()
    }

    if (action === 'opened') {
      updateData.opened_at = new Date().toISOString()
    } else if (action === 'clicked') {
      updateData.clicked_at = new Date().toISOString()
    } else if (action === 'applied' && applicationId) {
      updateData.applied_at = new Date().toISOString()
      updateData.application_id = applicationId
    }

    const { data: updatedInvitation, error } = await supabase
      .from('invitations')
      .update(updateData)
      .eq('id', invitationId)
      .select()
      .single()

    if (error) {
      console.error('Error tracking invitation:', error)
      return NextResponse.json(
        { error: 'Failed to track invitation action' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: updatedInvitation,
      message: `Invitation ${action} tracked successfully`
    })

  } catch (error: any) {
    console.error('Track invitation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
