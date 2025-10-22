import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { 
      recipientName, 
      recipientEmail, 
      position, 
      templateType, 
      personalMessage,
      scheduledFor 
    } = await request.json()

    if (!recipientName || !recipientEmail || !position || !templateType) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientName, recipientEmail, position, templateType' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get the email template
    const { data: template, error: templateError } = await supabase
      .from('invitation_templates')
      .select('*')
      .eq('template_type', templateType)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      console.error('Template error:', templateError)
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      )
    }

    // Replace template variables
    const applicationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/application`
    let emailSubject = template.subject.replace(/\[Name\]/g, recipientName)
    let emailBody = template.body
      .replace(/\[Name\]/g, recipientName)
      .replace(/\[First_Name\]/g, recipientName.split(' ')[0])
      .replace(/\[Position\]/g, position)
      .replace(/\[APPLICATION_LINK\]/g, applicationLink)
      .replace(/\[Company_Name\]/g, 'Serenity Rehabilitation Center')
      .replace(/\[Contact_Phone\]/g, '(248) 555-0123')
      .replace(/\[Contact_Email\]/g, 'hr@serenityrehab.com')
      .replace(/\[Date\]/g, new Date().toLocaleDateString())

    // Add personal message if provided
    if (personalMessage) {
      emailBody += `\n\nPersonal Note:\n${personalMessage}`
    }

    // Send the actual email
    console.log('Sending invitation email to:', recipientEmail)
    const emailResult = await sendInvitationEmail(
      recipientEmail,
      recipientName,
      emailSubject,
      emailBody
    )

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send email: ' + emailResult.error },
        { status: 500 }
      )
    }

    console.log('Email sent successfully:', emailResult.messageId)

    // Insert invitation record
    const { data: invitation, error: insertError } = await supabase
      .from('invitations')
      .insert({
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        position: position,
        template_type: templateType,
        subject: emailSubject,
        email_body: emailBody,
        personal_message: personalMessage,
        sent_by: null, // TODO: Get from auth context
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting invitation:', insertError)
      return NextResponse.json(
        { error: 'Failed to save invitation record' },
        { status: 500 }
      )
    }

    // TODO: In production, actually send the email here
    // For now, we'll just log it and return success

    return NextResponse.json({
      success: true,
      invitation: invitation,
      message: 'Invitation sent successfully!'
    })

  } catch (error: any) {
    console.error('Send invitation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
