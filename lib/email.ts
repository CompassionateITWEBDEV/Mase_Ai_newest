import nodemailer from 'nodemailer'

// Create a transporter - supports multiple email services
const createTransporter = () => {
  // Prioritize cloud-friendly services for production
  if (process.env.EMAIL_SERVICE === 'sendgrid' || process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    })
  } else if (process.env.EMAIL_SERVICE === 'resend') {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
      }
    })
  } else if (process.env.EMAIL_SERVICE === 'mailgun') {
    return nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILGUN_SMTP_USER,
        pass: process.env.MAILGUN_SMTP_PASS
      }
    })
  } else {
    // Fallback to Gmail with better configuration for cloud platforms
    return nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'mase2025ai@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000      // 60 seconds
    })
  }
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const sendEmail = async (options: EmailOptions, retryCount = 0) => {
  const maxRetries = 3
  const retryDelay = 2000 // 2 seconds

  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'mase2025ai@gmail.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    }

    console.log(`Attempting to send email to: ${options.to} (attempt ${retryCount + 1}/${maxRetries + 1})`)
    console.log('Using email service:', process.env.EMAIL_SERVICE || 'gmail')
    console.log('From email:', process.env.EMAIL_USER || 'mase2025ai@gmail.com')
    console.log('API Key present:', !!process.env.SENDGRID_API_KEY)
    
    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    
    // Check if we should retry
    if (retryCount < maxRetries && error instanceof Error) {
      const isRetryableError = error.message.includes('ETIMEDOUT') || 
                              error.message.includes('ECONNREFUSED') ||
                              error.message.includes('ENOTFOUND') ||
                              error.message.includes('ECONNRESET')
      
      if (isRetryableError) {
        console.log(`Retrying email send in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return sendEmail(options, retryCount + 1)
      }
    }
    
    // Provide more specific error messages
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Connection timeout - try using SendGrid or Resend for better cloud compatibility'
      } else if (error.message.includes('EAUTH')) {
        errorMessage = 'Authentication failed - check your email service credentials'
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused - email service may be down'
      } else if (error.message.includes('domain is not verified')) {
        errorMessage = 'Domain not verified - please verify your domain in Resend dashboard or use SendGrid'
      } else if (error.message.includes('EMESSAGE')) {
        errorMessage = 'Email service error - check your domain verification and API key'
      } else {
        errorMessage = error.message
      }
    }
    
    return { success: false, error: errorMessage }
  }
}

export const sendInvitationEmail = async (
  recipientEmail: string,
  recipientName: string,
  subject: string,
  body: string,
  invitationId?: string
) => {
  // Use Vercel URL in production, localhost in development
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.NODE_ENV === 'production' 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000')
  
  // Create tracking URLs
  const applicationUrl = invitationId 
    ? `${baseUrl}/api/invitations/track?action=click&id=${invitationId}&redirect=${encodeURIComponent(`${baseUrl}/application`)}`
    : `${baseUrl}/application`
  
  // Convert plain text to HTML with tracking
  const htmlBody = body
    .replace(/\n/g, '<br>')
    .replace(/\*\s/g, '• ')
    .replace(/✓/g, '✅')
    .replace(/\[APPLICATION_LINK\]/g, `<a href="${applicationUrl}" style="color: #2563eb; text-decoration: underline;">Apply Now</a>`)

  // Add tracking pixel for email opens
  const trackingPixel = invitationId 
    ? `<img src="${baseUrl}/api/invitations/track?action=open&id=${invitationId}" width="1" height="1" style="display:none;" />`
    : ''

  return sendEmail({
    to: recipientEmail,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Serenity Rehabilitation Center</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 16px;">Healthcare Excellence</p>
          </div>
          <div style="line-height: 1.6; color: #374151;">
            ${htmlBody}
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This message was sent to you by Serenity Rehabilitation Center.</p>
            <p>If you did not expect this message, please disregard it.</p>
          </div>
        </div>
        ${trackingPixel}
      </div>
    `,
    text: body
  })
}
