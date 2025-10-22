import { NextResponse } from "next/server"

// Use globalThis to persist data across hot reloads in development
const getAnalysisStorage = () => {
  if (typeof globalThis !== 'undefined') {
    if (!globalThis.__analysisResults) {
      globalThis.__analysisResults = new Map<string, any>()
    }
    return globalThis.__analysisResults
  }
  return new Map<string, any>()
}

export async function GET() {
  try {
    const analysisResults = getAnalysisStorage()
    
    // Get debug information about stored analysis results
    const debugInfo = {
      totalStored: analysisResults.size,
      storedIds: Array.from(analysisResults.keys()),
      storedResults: Array.from(analysisResults.entries()).map(([id, data]) => ({
        id,
        patientName: data.patientData?.name || data.patientData?.firstName + ' ' + data.patientData?.lastName,
        hasAnalysisResults: !!data.analysisResults,
        confidence: data.analysisResults?.confidence,
        financialImpact: data.analysisResults?.financialImpact,
        storedAt: data.storedAt,
        processedAt: data.processedAt
      }))
    }
    
    console.log("🔍 Debug info for stored optimization results:", debugInfo)
    
    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
  } catch (error) {
    console.error("❌ Error getting debug info:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const analysisResults = getAnalysisStorage()
    const count = analysisResults.size
    
    analysisResults.clear()
    
    console.log(`🗑️ Cleared ${count} stored optimization results`)
    
    return NextResponse.json({
      success: true,
      message: `Cleared ${count} stored optimization results`
    })
  } catch (error) {
    console.error("❌ Error clearing stored results:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
