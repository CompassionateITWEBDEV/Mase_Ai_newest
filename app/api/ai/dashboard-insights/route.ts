import { type NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { doctorId, stats } = body

    const systemPrompt = `You are an expert AI Performance Analyst for healthcare professionals. 
Your role is to analyze doctor performance metrics and provide actionable insights.

CAPABILITIES:
- Identify performance trends
- Provide evidence-based recommendations
- Recognize strengths and areas for improvement
- Calculate performance scores
- Offer motivational and constructive feedback

GUIDELINES:
- Be supportive and constructive
- Focus on actionable improvements
- Celebrate achievements
- Provide specific, measurable recommendations
- Use positive, professional language

Format your response as structured JSON.`

    const prompt = `Analyze this doctor's performance metrics and provide comprehensive insights:

PERFORMANCE METRICS:
- Today's Consultations: ${stats.consultations || 0}
- Today's Earnings: $${stats.earnings || 0}
- Average Response Time: ${stats.avgResponseTime || 0} seconds
- Average Rating: ${stats.avgRating || 0}/5

ANALYSIS REQUIREMENTS:
1. Performance Summary (2-3 sentence overview)
2. Key Trends (array of {metric, direction: 'up'|'down', insight})
3. Recommendations (array of specific actionable suggestions)
4. Strengths (array of positive attributes)
5. Improvements (array of growth opportunities)
6. Performance Score (0-100 based on all metrics)
7. Score Interpretation (brief explanation of the score)

Consider:
- Response time efficiency (faster is better)
- Patient satisfaction (rating)
- Productivity (consultations completed)
- Revenue generation

Format as JSON with keys: performanceSummary, trends, recommendations, strengths, improvements, performanceScore, scoreInterpretation`

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      // No API key - return fallback
      return NextResponse.json({
        success: false,
        error: 'AI service not configured'
      }, { status: 503 })
    }

    try {
      // Call OpenAI API directly (same method as facility portal)
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // Fast and reliable
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.5,
        }),
      })

      if (!openaiResponse.ok) {
        // OpenAI API error - fail silently
        return NextResponse.json({
          success: false,
          error: 'AI service temporarily unavailable'
        }, { status: 503 })
      }

      const data = await openaiResponse.json()
      const text = data.choices[0]?.message?.content || ""

      // Parse AI response
      let insights
      try {
        insights = JSON.parse(text)
      } catch {
        // Fallback if JSON parsing fails
        insights = {
          performanceSummary: text,
          trends: [],
          recommendations: ['Continue providing excellent patient care'],
          strengths: ['Dedicated healthcare professional'],
          improvements: [],
          performanceScore: 75,
          scoreInterpretation: 'Good performance overall'
        }
      }

      return NextResponse.json({
        success: true,
        insights
      })
    } catch (error: any) {
      // Network or parsing error - fail silently
      return NextResponse.json({
        success: false,
        error: 'AI service temporarily unavailable'
      }, { status: 503 })
    }
  } catch (error: any) {
    // Request parsing error - fail silently
    return NextResponse.json(
      { 
        success: false,
        error: 'Invalid request'
      },
      { status: 400 }
    )
  }
}

