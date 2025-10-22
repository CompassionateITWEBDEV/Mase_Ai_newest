import nodemailer from 'nodemailer'

// Create a transporter for Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'mase2025ai@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password' // Use App Password, not regular password
    }
  })
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'mase2025ai@gmail.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const sendInvitationEmail = async (
  recipientEmail: string,
  recipientName: string,
  subject: string,
  body: string
) => {
  // Convert plain text to HTML
  const htmlBody = body
    .replace(/\n/g, '<br>')
    .replace(/\*\s/g, '• ')
    .replace(/✓/g, '✅')
    .replace(/\[APPLICATION_LINK\]/g, `<a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/application" style="color: #2563eb; text-decoration: underline;">Apply Now</a>`)

  return sendEmail({
    to: recipientEmail,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Serenity Rehabilitation Center</h1>
          <p style="color: #e2e8f0; margin: 5px 0 0 0; font-size: 16px;">Healthcare Excellence</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          ${htmlBody}
        </div>
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
          <p>This email was sent from our automated invitation system.</p>
          <p>If you did not expect this email, please ignore it.</p>
        </div>
      </div>
    `,
    text: body
  })
}
