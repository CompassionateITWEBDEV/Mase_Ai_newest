import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, candidateName, personalMessage } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (typeof window !== 'undefined' 
        ? window.location.origin 
        : 'http://localhost:3000')
    const applicationLink = `${baseUrl}/application`

    const name = candidateName || 'Candidate'
    const firstName = name.split(' ')[0]

    // Create email subject
    const subject = `${firstName}, Join Our Healthcare Team - Apply Now!`

    // Create email body with HTML template
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">M.A.S.E AI Intelligence</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 16px;">Healthcare Recruitment</p>
          </div>
          
          <div style="line-height: 1.6; color: #374151;">
            <p>Hello ${firstName},</p>
            
            <p>We hope this message finds you well. We are actively recruiting talented healthcare professionals to join our team.</p>
            
            ${personalMessage ? `
            <div style="background-color: #eff6ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-style: italic; color: #1e40af;">${personalMessage}</p>
            </div>
            ` : ''}
            
            <p>We invite you to apply for our open positions. Our application process is quick and straightforward.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${applicationLink}" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Apply Now
              </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Or copy and paste this link into your browser:<br>
              <a href="${applicationLink}" style="color: #2563eb; word-break: break-all;">${applicationLink}</a>
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <strong>What positions are we hiring for?</strong><br>
                • Registered Nurses (RN)<br>
                • Physical Therapists (PT)<br>
                • Occupational Therapists (OT)<br>
                • Speech Therapists (ST)<br>
                • Home Health Aides (HHA)<br>
                • Master of Social Work (MSW)
              </p>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This message was sent to you by M.A.S.E AI Intelligence.</p>
            <p>If you did not expect this message, please disregard it.</p>
          </div>
        </div>
      </div>
    `

    // Send email using SendGrid (via lib/email.ts which handles SendGrid automatically)
    console.log('Sending application link email to:', email)
    const emailResult = await sendEmail({
      to: email,
      subject: subject,
      html: emailBody,
      text: `Hello ${firstName},

We hope this message finds you well. We are actively recruiting talented healthcare professionals to join our team.

${personalMessage ? `Personal Message: ${personalMessage}\n\n` : ''}We invite you to apply for our open positions. Our application process is quick and straightforward.

Apply now: ${applicationLink}

What positions are we hiring for?
• Registered Nurses (RN)
• Physical Therapists (PT)
• Occupational Therapists (OT)
• Speech Therapists (ST)
• Home Health Aides (HHA)
• Master of Social Work (MSW)

This message was sent to you by M.A.S.E AI Intelligence.
If you did not expect this message, please disregard it.`
    })

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error)
      return NextResponse.json(
        { 
          success: false, 
          error: emailResult.error || 'Failed to send email' 
        },
        { status: 500 }
      )
    }

    console.log('✅ Application link email sent successfully to:', email)

    return NextResponse.json({
      success: true,
      message: 'Application link sent successfully',
      messageId: emailResult.messageId
    })

  } catch (error: any) {
    console.error('Send application link API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

