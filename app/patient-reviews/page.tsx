"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Heart, User, MessageSquare, ThumbsUp, Search, Plus, Award, TrendingUp, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Review {
  id: string
  patient_name: string
  staff_name: string
  staff_role?: string
  rating: number
  comment?: string
  service_type?: string
  service_date?: string
  verified: boolean
  helpful_count: number
  created_at: string
}

export default function PatientReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRating, setFilterRating] = useState("All Ratings")
  const [filterStaff, setFilterStaff] = useState("All Staff")
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    fiveStarReviews: 0,
    fourStarReviews: 0,
    threeStarReviews: 0,
    twoStarReviews: 0,
    oneStarReviews: 0,
  })
  const [topRatedStaff, setTopRatedStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [availableStaff, setAvailableStaff] = useState<any[]>([])
  const { toast } = useToast()

  // Review form state
  const [formData, setFormData] = useState({
    patientName: "",
    staffId: "",
    staffName: "",
    staffRole: "",
    rating: 0,
    comment: "",
    serviceType: "",
    serviceDate: "",
    verified: false,
  })

  // Fetch reviews from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/patient-reviews")
        const data = await response.json()
        if (data.success) {
          setReviews(data.reviews || [])
          setReviewStats(data.stats || {
            totalReviews: 0,
            averageRating: 0,
            fiveStarReviews: 0,
            fourStarReviews: 0,
            threeStarReviews: 0,
            twoStarReviews: 0,
            oneStarReviews: 0,
          })
          setTopRatedStaff(data.topRatedStaff || [])
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
        toast({
          title: "Error",
          description: "Failed to load reviews",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    const loadStaff = async () => {
      try {
        const response = await fetch("/api/staff/list")
        const data = await response.json()
        if (data.success && data.staff) {
          setAvailableStaff(data.staff)
        }
      } catch (error) {
        console.error("Error fetching staff:", error)
      }
    }

    loadData()
    loadStaff()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/patient-reviews")
      const data = await response.json()
      if (data.success) {
        setReviews(data.reviews || [])
        setReviewStats(data.stats || {
          totalReviews: 0,
          averageRating: 0,
          fiveStarReviews: 0,
          fourStarReviews: 0,
          threeStarReviews: 0,
          twoStarReviews: 0,
          oneStarReviews: 0,
        })
        setTopRatedStaff(data.topRatedStaff || [])
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/patient-reviews/${reviewId}/helpful`, {
        method: "POST",
      })
      const data = await response.json()
      if (data.success) {
        // Update local state
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? { ...review, helpful_count: data.helpfulCount }
              : review
          )
        )
      }
    } catch (error) {
      console.error("Error marking helpful:", error)
    }
  }

  const handleSubmitReview = async () => {
    if (!formData.patientName || !formData.staffName || !formData.rating) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/patient-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: formData.patientName,
          staffId: formData.staffId || null,
          staffName: formData.staffName,
          staffRole: formData.staffRole,
          rating: formData.rating,
          comment: formData.comment,
          serviceType: formData.serviceType,
          serviceDate: formData.serviceDate,
          verified: formData.verified,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Review submitted successfully!",
        })
        setShowReviewForm(false)
        setFormData({
          patientName: "",
          staffId: "",
          staffName: "",
          staffRole: "",
          rating: 0,
          comment: "",
          serviceType: "",
          serviceDate: "",
          verified: false,
        })
        fetchReviews()
      } else {
        throw new Error(data.error || "Failed to submit review")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.comment && review.comment.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesRating = filterRating === "All Ratings" || review.rating.toString() === filterRating
    const matchesStaff = filterStaff === "All Staff" || review.staff_name === filterStaff

    return matchesSearch && matchesRating && matchesStaff
  })

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  const getPercentage = (count: number) => {
    if (reviewStats.totalReviews === 0) return 0
    return Math.round((count / reviewStats.totalReviews) * 100)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Compassionate Home Health Services</h1>
                  <p className="text-sm text-gray-600">Patient Reviews</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={() => setShowReviewForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Write Review
              </Button>
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && reviews.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading reviews...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Patient Reviews & Testimonials</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Read what our patients and their families have to say about the exceptional care provided by our healthcare
                professionals.
              </p>
            </div>

        {/* Review Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{reviewStats.totalReviews}</p>
              <p className="text-sm text-gray-600">Total Reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{reviewStats.averageRating}</p>
              <p className="text-sm text-gray-600">Average Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{getPercentage(reviewStats.fiveStarReviews)}%</p>
              <p className="text-sm text-gray-600">5-Star Reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {reviewStats.totalReviews > 0
                  ? Math.round(
                      ((reviewStats.fourStarReviews + reviewStats.fiveStarReviews) / reviewStats.totalReviews) * 100
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-gray-600">Satisfaction Rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Reviews Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Reviews ({filteredReviews.length})</CardTitle>
                <CardDescription>Verified reviews from patients and their families</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search reviews..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Ratings">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStaff} onValueChange={setFilterStaff}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by Staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Staff">All Staff</SelectItem>
                      {Array.from(new Set(reviews.map((r) => r.staff_name))).map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reviews List */}
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading reviews...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredReviews.length > 0 ? (
                      filteredReviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-6 bg-white">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{review.patient_name}</h3>
                                <p className="text-sm text-gray-600">
                                  Care provided by <span className="font-medium">{review.staff_name}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  {review.staff_role || ""} {review.staff_role && review.service_type ? "•" : ""} {review.service_type || ""}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-1 mb-1">{renderStars(review.rating)}</div>
                              <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
                              {review.verified && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>

                          {review.comment && (
                            <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-500"
                                onClick={() => handleMarkHelpful(review.id)}
                              >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                Helpful ({review.helpful_count || 0})
                              </Button>
                            </div>
                            <div className="flex items-center space-x-2">
                              {review.service_type && (
                                <Badge variant="outline" className="text-xs">
                                  {review.service_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
                        <p className="text-gray-600 mb-4">
                          {reviews.length === 0
                            ? "No reviews have been submitted yet. Be the first to share your experience!"
                            : "Try adjusting your search criteria or browse all reviews."}
                        </p>
                        {reviews.length === 0 && (
                          <Button onClick={() => setShowReviewForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Write the First Review
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Breakdown</CardTitle>
                <CardDescription>Distribution of patient ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { stars: 5, count: reviewStats.fiveStarReviews },
                    { stars: 4, count: reviewStats.fourStarReviews },
                    { stars: 3, count: reviewStats.threeStarReviews },
                    { stars: 2, count: reviewStats.twoStarReviews },
                    { stars: 1, count: reviewStats.oneStarReviews },
                  ].map((item) => (
                    <div key={item.stars} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 w-16">
                        <span className="text-sm">{item.stars}</span>
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${getPercentage(item.count)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{getPercentage(item.count)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Rated Staff */}
            <Card>
              <CardHeader>
                <CardTitle>Top Rated Staff</CardTitle>
                <CardDescription>Our highest-rated healthcare professionals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topRatedStaff.map((staff, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{staff.name}</h4>
                        <p className="text-xs text-gray-600">{staff.role}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs">{staff.rating}</span>
                          <span className="text-xs text-gray-500">({staff.reviews} reviews)</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Write a Review CTA */}
            <Card>
              <CardHeader>
                <CardTitle>Share Your Experience</CardTitle>
                <CardDescription>Help others by sharing your healthcare experience</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Your feedback helps us maintain the highest standards of care and helps other patients make informed
                  decisions.
                </p>
                <Button className="w-full" onClick={() => setShowReviewForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Write a Review
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

            {/* Review Form Modal */}
            {showReviewForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle>Write a Review</CardTitle>
                    <CardDescription>Share your experience with our healthcare services</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="patientName">Your Name *</Label>
                        <Input
                          id="patientName"
                          placeholder="Enter your name"
                          value={formData.patientName}
                          onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="serviceDate">Date of Service</Label>
                        <Input
                          id="serviceDate"
                          type="date"
                          value={formData.serviceDate}
                          onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="staffMember">Healthcare Professional *</Label>
                        <Select
                          value={formData.staffId}
                          onValueChange={(value) => {
                            const staff = availableStaff.find((s) => s.id === value)
                            setFormData({
                              ...formData,
                              staffId: value,
                              staffName: staff?.name || "",
                              staffRole: staff?.credentials || staff?.department || "",
                            })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select staff member" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStaff.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.name} - {staff.credentials || staff.department || "Healthcare Provider"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="serviceType">Type of Service</Label>
                        <Select
                          value={formData.serviceType}
                          onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Home Health Care">Home Health Care</SelectItem>
                            <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                            <SelectItem value="Personal Care">Personal Care</SelectItem>
                            <SelectItem value="Wound Care">Wound Care</SelectItem>
                            <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
                            <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
                            <SelectItem value="Skilled Nursing">Skilled Nursing</SelectItem>
                            <SelectItem value="Medication Management">Medication Management</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Overall Rating *</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            className="focus:outline-none"
                            onClick={() => setFormData({ ...formData, rating })}
                          >
                            <Star
                              className={`h-8 w-8 transition-colors ${
                                rating <= formData.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      {formData.rating > 0 && (
                        <p className="text-sm text-gray-600 mt-2">{formData.rating} out of 5 stars</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="reviewComment">Your Review</Label>
                      <Textarea
                        id="reviewComment"
                        placeholder="Share your experience with the care you received..."
                        rows={6}
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Please be specific about the care you received and how it helped you.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="verified"
                        className="rounded"
                        checked={formData.verified}
                        onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                      />
                      <Label htmlFor="verified" className="text-sm">
                        I confirm that I received care from this healthcare professional
                      </Label>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        className="flex-1"
                        onClick={handleSubmitReview}
                        disabled={submitting || !formData.patientName || !formData.staffName || !formData.rating}
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Review"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => {
                          setShowReviewForm(false)
                          setFormData({
                            patientName: "",
                            staffId: "",
                            staffName: "",
                            staffRole: "",
                            rating: 0,
                            comment: "",
                            serviceType: "",
                            serviceDate: "",
                            verified: false,
                          })
                        }}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-bold">Compassionate Home Health Services</h3>
              </div>
              <p className="text-gray-400">
                Connecting healthcare professionals with meaningful opportunities across Michigan.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Patients</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/patient-reviews" className="hover:text-white">
                    Read Reviews
                  </Link>
                </li>
                <li>
                  <Link href="/patient-reviews" className="hover:text-white">
                    Write Review
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Professionals</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/jobs" className="hover:text-white">
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white">
                    Create Profile
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Compassionate Home Health Services Staffing. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
