import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { 
      recipients, // Array of {name, email, position?}
      templateType, 
      personalMessage 
    } = await request.json()

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (!templateType) {
      return NextResponse.json(
        { error: 'Template type is required' },
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

    const applicationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/application`
    const invitations = []
    const errors = []

    console.log('Processing bulk invitations for', recipients.length, 'recipients')
    console.log('Recipients:', recipients)
    
    let processedCount = 0
    let successCount = 0
    
    // Process each recipient
    for (const recipient of recipients) {
      processedCount++
      console.log(`Processing recipient ${processedCount}/${recipients.length}:`, recipient.email)
      try {
        const { name, email, position = 'Healthcare Professional' } = recipient

        if (!name || !email) {
          errors.push({ email, error: 'Name and email are required' })
          continue
        }

        // Replace template variables
        let emailSubject = template.subject.replace(/\[Name\]/g, name)
        let emailBody = template.body
          .replace(/\[Name\]/g, name)
          .replace(/\[First_Name\]/g, name.split(' ')[0])
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

        // Insert invitation record first to get ID for tracking
        const { data: invitation, error: insertError } = await supabase
          .from('invitations')
          .insert({
            recipient_name: name,
            recipient_email: email,
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
          console.error('Failed to insert invitation for', email, ':', insertError)
          errors.push({ 
            email, 
            error: 'Failed to save invitation record' 
          })
          continue
        }

        // Send the actual email with tracking
        console.log('Sending bulk invitation to:', email)
        const emailResult = await sendInvitationEmail(
          email,
          name,
          emailSubject,
          emailBody,
          invitation.id
        )

        if (!emailResult.success) {
          console.error('Failed to send email to', email, ':', emailResult.error)
          errors.push({ 
            email, 
            error: 'Failed to send email: ' + emailResult.error 
          })
          continue
        } else {
          console.log('✅ Email sent successfully to', email)
          successCount++
        }

        console.log('Email sent successfully to', email, ':', emailResult.messageId)

      } catch (error) {
        console.error('Error processing recipient:', recipient, error)
        errors.push({ 
          email: recipient.email, 
          error: 'Failed to process recipient' 
        })
      }
    }
    
    console.log(`📊 Final stats: Processed ${processedCount}, Success ${successCount}, Errors ${errors.length}`)

    return NextResponse.json({
      success: true,
      totalSent: successCount,
      errors: errors,
      message: `Bulk invitations sent! ${successCount} sent successfully, ${errors.length} failed.`
    })

  } catch (error: any) {
    console.error('Bulk send invitation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
