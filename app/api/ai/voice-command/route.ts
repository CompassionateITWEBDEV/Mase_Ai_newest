import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { transcript, currentPage, userRole, availableCommands } = await request.json()

    // Simple command processing logic
    const processCommand = (transcript: string) => {
      const lowerTranscript = transcript.toLowerCase()

      // Navigation commands
      if (lowerTranscript.includes("dashboard") || lowerTranscript.includes("home")) {
        return { action: "/", response: "Navigating to dashboard" }
      }

      if (
        lowerTranscript.includes("patient") &&
        (lowerTranscript.includes("show") || lowerTranscript.includes("open"))
      ) {
        return { action: "/patient-portal", response: "Opening patient portal" }
      }

      if (lowerTranscript.includes("oasis") || lowerTranscript.includes("quality")) {
        if (userRole === "admin" || userRole === "qa") {
          return { action: "/oasis-qa", response: "Opening OASIS Quality Assurance" }
        } else {
          return { action: "none", response: "You don't have permission to access OASIS QA" }
        }
      }

      if (lowerTranscript.includes("schedule") || lowerTranscript.includes("calendar")) {
        return { action: "/schedule", response: "Opening schedule" }
      }

      if (lowerTranscript.includes("complaint") || lowerTranscript.includes("report")) {
        return { action: "/complaints", response: "Opening complaints system" }
      }

      if (lowerTranscript.includes("training") || lowerTranscript.includes("education")) {
        return { action: "/training", response: "Opening training center" }
      }

      if (lowerTranscript.includes("analytics") || lowerTranscript.includes("reports")) {
        if (userRole === "admin" || userRole === "manager") {
          return { action: "/analytics", response: "Opening analytics dashboard" }
        } else {
          return { action: "none", response: "You don't have permission to access analytics" }
        }
      }

      if (lowerTranscript.includes("financial") || lowerTranscript.includes("finance")) {
        if (userRole === "admin" || userRole === "finance") {
          return { action: "/financial-dashboard", response: "Opening financial dashboard" }
        } else {
          return { action: "none", response: "You don't have permission to access financial data" }
        }
      }

      // Help commands
      if (lowerTranscript.includes("help") || lowerTranscript.includes("what can you do")) {
        return {
          action: "none",
          response:
            "I can help you navigate. Try saying: 'go to dashboard', 'show patients', 'open OASIS QA', 'show schedule', or 'create complaint'",
        }
      }

      // Status commands
      if (lowerTranscript.includes("status") || lowerTranscript.includes("where am i")) {
        return {
          action: "none",
          response: `You are currently on the ${currentPage} page. Your role is ${userRole}.`,
        }
      }

      // Search commands
      if (lowerTranscript.includes("search") || lowerTranscript.includes("find")) {
        const searchTerm = lowerTranscript.replace(/search|find|for/g, "").trim()
        return {
          action: "none",
          response: `I would search for "${searchTerm}" but search functionality is not yet implemented.`,
        }
      }

      // Default response
      return {
        action: "none",
        response: "I didn't understand that command. Try saying 'help' for available commands.",
      }
    }

    const result = processCommand(transcript)

    return NextResponse.json({
      success: true,
      action: result.action,
      response: result.response,
      transcript,
      currentPage,
      userRole,
    })
  } catch (error) {
    console.error("Voice command processing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process voice command",
        response: "Sorry, I encountered an error processing your command.",
      },
      { status: 500 },
    )
  }
}
