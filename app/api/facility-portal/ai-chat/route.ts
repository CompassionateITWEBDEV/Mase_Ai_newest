import { type NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// System prompt with M.A.S.E. context
const SYSTEM_PROMPT = `You are a helpful AI assistant for M.A.S.E. (Mid-Michigan Advanced Solutions for Excellence), a home health care agency based in Genesee County, Michigan.

**YOUR ROLE:**
- Help hospital case managers with referral questions
- Provide information about services, insurance, and procedures
- Be friendly, professional, and accurate
- Keep responses concise but informative

**M.A.S.E. INFORMATION:**

**Services Offered:**
- Skilled Nursing Care (RN/LPN visits)
- Physical Therapy (PT)
- Occupational Therapy (OT)
- Speech Therapy (ST)
- Medical Social Work
- Home Health Aide services
- Wound Care (specialized)
- IV Therapy
- Medication Management
- Chronic Disease Management

**Coverage Area:**
- Genesee County (Flint, Burton, Grand Blanc, Fenton, Davison)
- Surrounding mid-Michigan areas
- 24/7 on-call services available

**Insurance Accepted:**
- Medicare (all parts A, B, C)
- Medicaid
- Humana
- Blue Cross Blue Shield
- United Healthcare
- Aetna
- Cigna
- Priority Health
- Most major commercial insurances

**Referral Process:**
- Submit through online portal (fastest)
- All referrals go to "Pending" for manual review
- Review time: typically 2 hours
- Status updates in real-time
- Required: Patient initials, diagnosis, insurance, services needed

**Contact Information:**
- Main Line: (555) 123-4567
- Urgent/STAT: Press 1
- DME Supplies: (555) 123-4568
- Email: intake@mase-homehealth.com
- Available: 24/7 for urgent matters

**DME Supplies:**
- Partners: Parachute Health, Verse Medical
- Available: Wound care, mobility aids, diabetic supplies, respiratory equipment
- Approval: Usually within 2 hours
- Delivery: 2-3 business days

**Key Features:**
- Document upload for referrals (medical records, insurance cards)
- Secure HIPAA-compliant messaging
- Real-time referral tracking
- Automated DME ordering

**IMPORTANT GUIDELINES:**
- Always be helpful and professional
- If you don't know something specific, direct them to call (555) 123-4567
- For urgent medical situations, always recommend calling immediately
- Use patient initials only (HIPAA compliance)
- Keep responses under 200 words when possible

Answer questions accurately based on this information. If asked about something outside your knowledge, politely say you'll need to connect them with the team.`

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.warn("⚠️ OpenAI API key not configured, using fallback responses")
      const fallbackResponse = getFallbackResponse(message)
      return NextResponse.json({ 
        response: fallbackResponse,
        fallback: true 
      })
    }

    // Build messages array with conversation history
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT }
    ]

    // Add conversation history if provided (last 5 messages for context)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-5)
      recentHistory.forEach((msg: any) => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        })
      })
    }

    // Add current message
    messages.push({ role: "user", content: message })

    // Call OpenAI API directly (like quiz generator does)
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Fast and cost-effective
        messages: messages,
        max_tokens: 300, // Keep responses concise
        temperature: 0.7, // Balanced creativity/accuracy
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      console.error("OpenAI API Error:", errorData)
      
      // Use fallback if OpenAI fails
      const fallbackResponse = getFallbackResponse(message)
      return NextResponse.json({ 
        response: fallbackResponse,
        fallback: true 
      })
    }

    const data = await openaiResponse.json()
    const response = data.choices[0]?.message?.content || 
      "I apologize, but I'm having trouble generating a response. Please try again or contact our team at (555) 123-4567."

    return NextResponse.json({ 
      response,
      model: data.model,
      usage: data.usage 
    })

  } catch (error: any) {
    console.error("AI Chat Error:", error)

    // Fallback responses if everything fails
    const fallbackResponse = getFallbackResponse(
      await request.json().then(data => data.message).catch(() => "")
    )
    
    return NextResponse.json({ 
      response: fallbackResponse || "I'm here to help! Please contact our team at (555) 123-4567 for immediate assistance.",
      fallback: true 
    })
  }
}

// Fallback responses if OpenAI is unavailable or not configured
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("refer") || lowerMessage.includes("referral")) {
    return "To submit a referral:\n\n1. Go to the 'Live Referral Submission' tab\n2. Fill in patient initials, diagnosis, and insurance\n3. Select services needed\n4. Click 'Submit Referral'\n\nThe referral will go to 'Pending' status and our team will review it within 2 hours. For urgent referrals, call (555) 123-4567 and press 1."
  }
  
  if (lowerMessage.includes("insurance") || lowerMessage.includes("coverage")) {
    return "We accept:\n• Medicare (all parts A, B, C)\n• Medicaid\n• Humana\n• Blue Cross Blue Shield\n• United Healthcare\n• Aetna\n• Cigna\n• Priority Health\n• Most major commercial insurances\n\nFor specific coverage questions, please contact our verification team at (555) 123-4567."
  }
  
  if (lowerMessage.includes("dme") || lowerMessage.includes("supplies")) {
    return "We can arrange DME supplies through our partnerships with Parachute Health and Verse Medical.\n\nTo order:\n1. Find an approved referral in 'Referral Tracker'\n2. Click the package icon (📦)\n3. Or go to 'DME Orders' tab\n\nOrders are typically approved within 2 hours and delivered within 2-3 business days."
  }
  
  if (lowerMessage.includes("status") || lowerMessage.includes("track")) {
    return "You can track all referrals in the 'Referral Tracker' tab:\n\n• 🟡 Pending - Awaiting review\n• 🟢 Approved - Ready for admission\n• 🔴 Denied - Needs more information\n\nStatus updates are provided in real-time, and you'll receive notifications for any changes."
  }
  
  if (lowerMessage.includes("upload") || lowerMessage.includes("document")) {
    return "To upload documents:\n\n1. Go to 'Referral Tracker' tab\n2. Find the referral\n3. Click the Upload (📤) button\n4. Select files (PDF, images, documents)\n5. Choose document type\n6. Click 'Upload'\n\nAccepted types: PDF, DOC, DOCX, JPG, PNG (max 10MB per file)"
  }
  
  if (lowerMessage.includes("contact") || lowerMessage.includes("phone") || lowerMessage.includes("call")) {
    return "Contact Information:\n\n📞 Main Line: (555) 123-4567\n🚨 Urgent/STAT: Press 1\n📦 DME Supplies: (555) 123-4568\n📧 Email: intake@mase-homehealth.com\n\nWe're available 24/7 for urgent matters. You can also use the secure messaging system in this portal."
  }

  if (lowerMessage.includes("service") || lowerMessage.includes("offer")) {
    return "M.A.S.E. offers:\n\n• Skilled Nursing (RN/LPN)\n• Physical Therapy\n• Occupational Therapy\n• Speech Therapy\n• Medical Social Work\n• Home Health Aide\n• Wound Care\n• IV Therapy\n• Medication Management\n• Chronic Disease Management\n\nWe serve Genesee County and surrounding mid-Michigan areas 24/7."
  }

  return "I'm here to help with:\n\n• 📝 Referral submission\n• 💳 Insurance coverage\n• 📦 DME supply ordering\n• 🏥 Services & care\n• 📞 Contact information\n\nWhat specific question can I help you with? For immediate assistance, call (555) 123-4567."
}
