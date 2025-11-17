import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// POST - Mark a review as helpful
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: "Review ID is required" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get current helpful count
    const { data: review, error: fetchError } = await supabase
      .from("patient_reviews")
      .select("helpful_count")
      .eq("id", reviewId)
      .single()

    if (fetchError || !review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      )
    }

    // Increment helpful count
    const { data: updatedReview, error: updateError } = await supabase
      .from("patient_reviews")
      .update({
        helpful_count: (review.helpful_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating helpful count:", updateError)
      return NextResponse.json(
        { success: false, error: updateError.message || "Failed to update helpful count" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      helpfulCount: updatedReview.helpful_count,
    })
  } catch (error: any) {
    console.error("Error in POST helpful:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark as helpful" },
      { status: 500 }
    )
  }
}



