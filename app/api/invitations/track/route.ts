import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')
    const action = searchParams.get('action') // 'open' or 'click'
    const redirectUrl = searchParams.get('redirect')

    if (!invitationId || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Update the invitation record based on the action
    const updateData: any = {}
    
    if (action === 'open') {
      updateData.opened_at = new Date().toISOString()
      console.log(`📧 Email opened for invitation ${invitationId}`)
    } else if (action === 'click') {
      updateData.clicked_at = new Date().toISOString()
      console.log(`🔗 Link clicked for invitation ${invitationId}`)
    }

    const { error } = await supabase
      .from('invitations')
      .update(updateData)
      .eq('id', invitationId)

    if (error) {
      console.error('Error updating invitation:', error)
      return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 })
    }

    // If it's a click action and there's a redirect URL, redirect to it
    if (action === 'click' && redirectUrl) {
      return NextResponse.redirect(redirectUrl)
    }

    // For open actions, return a 1x1 transparent pixel
    if (action === 'open') {
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      )
      return new NextResponse(pixel, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Track invitation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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