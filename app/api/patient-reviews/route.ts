import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// GET - Fetch all published patient reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staff_id")
    const rating = searchParams.get("rating")
    const status = searchParams.get("status") || "published"

    const supabase = createServiceClient()

    let query = supabase
      .from("patient_reviews")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })

    if (staffId) {
      query = query.eq("staff_id", staffId)
    }

    if (rating) {
      query = query.eq("rating", parseInt(rating))
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error("Error fetching reviews:", error)
      return NextResponse.json(
        { success: false, error: error.message || "Failed to fetch reviews" },
        { status: 500 }
      )
    }

    // Calculate statistics
    const stats = {
      totalReviews: reviews?.length || 0,
      averageRating: 0,
      fiveStarReviews: 0,
      fourStarReviews: 0,
      threeStarReviews: 0,
      twoStarReviews: 0,
      oneStarReviews: 0,
    }

    if (reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      stats.averageRating = parseFloat((totalRating / reviews.length).toFixed(1))
      stats.fiveStarReviews = reviews.filter((r) => r.rating === 5).length
      stats.fourStarReviews = reviews.filter((r) => r.rating === 4).length
      stats.threeStarReviews = reviews.filter((r) => r.rating === 3).length
      stats.twoStarReviews = reviews.filter((r) => r.rating === 2).length
      stats.oneStarReviews = reviews.filter((r) => r.rating === 1).length
    }

    // Get top rated staff
    const staffRatings = new Map<string, { name: string; role: string; ratings: number[]; count: number }>()

    reviews?.forEach((review) => {
      if (review.staff_id && review.staff_name) {
        const key = review.staff_id
        if (!staffRatings.has(key)) {
          staffRatings.set(key, {
            name: review.staff_name,
            role: review.staff_role || "",
            ratings: [],
            count: 0,
          })
        }
        const staff = staffRatings.get(key)!
        staff.ratings.push(review.rating)
        staff.count++
      }
    })

    const topRatedStaff = Array.from(staffRatings.values())
      .map((staff) => ({
        name: staff.name,
        role: staff.role,
        rating: parseFloat((staff.ratings.reduce((a, b) => a + b, 0) / staff.ratings.length).toFixed(1)),
        reviews: staff.count,
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
      stats,
      topRatedStaff,
    })
  } catch (error: any) {
    console.error("Error in GET patient reviews:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

// POST - Create a new patient review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      patientName,
      staffId,
      staffName,
      staffRole,
      visitId,
      rating,
      comment,
      serviceType,
      serviceDate,
      verified,
    } = body

    if (!patientName || !staffName || !rating) {
      return NextResponse.json(
        { success: false, error: "Patient name, staff name, and rating are required" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Check if patient already reviewed this staff for this visit
    if (visitId) {
      const { data: existingReview } = await supabase
        .from("patient_reviews")
        .select("id")
        .eq("visit_id", visitId)
        .maybeSingle()

      if (existingReview) {
        return NextResponse.json(
          { success: false, error: "You have already reviewed this visit" },
          { status: 400 }
        )
      }
    }

    const { data: newReview, error } = await supabase
      .from("patient_reviews")
      .insert({
        patient_id: patientId || null,
        patient_name: patientName,
        staff_id: staffId || null,
        staff_name: staffName,
        staff_role: staffRole || null,
        visit_id: visitId || null,
        rating: parseInt(rating),
        comment: comment || null,
        service_type: serviceType || null,
        service_date: serviceDate || null,
        verified: verified || false,
        status: "published", // Auto-publish for now, can be changed to 'pending' for moderation
        helpful_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating review:", error)
      return NextResponse.json(
        { success: false, error: error.message || "Failed to create review" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
      review: newReview,
    })
  } catch (error: any) {
    console.error("Error in POST patient reviews:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create review" },
      { status: 500 }
    )
  }
}








