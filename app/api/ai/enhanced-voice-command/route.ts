import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { transcript, conversationHistory, userRole, currentPage, conversationMode } = await request.json()

    const systemPrompt = `You are MASE AI, an intelligent healthcare staffing assistant. You have access to a comprehensive healthcare management system with the following capabilities:

NAVIGATION COMMANDS:
- Dashboard: "/" 
- Patient Tracking: "/patient-tracking"
- Staff Dashboard: "/staff-dashboard" 
- Referral Management: "/referral-management"
- Billing Center: "/billing-center"
- Analytics: "/analytics"
- Quality Assurance: "/comprehensive-qa"
- Schedule: "/schedule"
- Integrations: "/integrations"
- Communications: "/communications"
- Training: "/training"
- Complaints: "/complaints"

USER CONTEXT:
- Role: ${userRole}
- Current Page: ${currentPage}
- Conversation Mode: ${conversationMode ? "Active" : "Inactive"}

CONVERSATION HISTORY:
${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n")}

INSTRUCTIONS:
1. Respond naturally and conversationally like ChatGPT
2. Provide detailed, helpful responses about healthcare operations
3. Suggest specific actions when appropriate
4. Use context from conversation history
5. Be proactive in offering assistance
6. If navigation is needed, specify the exact path
7. Maintain professional healthcare context
8. Ask follow-up questions when helpful

Current user input: "${transcript}"`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: systemPrompt,
      maxTokens: 300,
    })

    // Extract navigation action if mentioned
    let action = "none"
    const lowerResponse = text.toLowerCase()

    if (lowerResponse.includes("dashboard") || lowerResponse.includes("main page")) {
      action = "/"
    } else if (lowerResponse.includes("patient tracking")) {
      action = "/patient-tracking"
    } else if (lowerResponse.includes("staff dashboard")) {
      action = "/staff-dashboard"
    } else if (lowerResponse.includes("referral")) {
      action = "/referral-management"
    } else if (lowerResponse.includes("billing")) {
      action = "/billing-center"
    } else if (lowerResponse.includes("analytics")) {
      action = "/analytics"
    } else if (lowerResponse.includes("quality") || lowerResponse.includes("qa")) {
      action = "/comprehensive-qa"
    } else if (lowerResponse.includes("schedule")) {
      action = "/schedule"
    } else if (lowerResponse.includes("integration")) {
      action = "/integrations"
    } else if (lowerResponse.includes("communication")) {
      action = "/communications"
    } else if (lowerResponse.includes("training")) {
      action = "/training"
    } else if (lowerResponse.includes("complaint")) {
      action = "/complaints"
    }

    return NextResponse.json({
      success: true,
      response: text,
      action,
      transcript,
      conversationMode,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Enhanced voice command processing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process voice command",
        response:
          "I apologize, but I'm experiencing technical difficulties. Please try speaking your request again, or you can navigate manually using the menu.",
      },
      { status: 500 },
    )
  }
}
