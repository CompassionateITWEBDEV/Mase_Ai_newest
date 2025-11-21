"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  consultationId: string
  doctorName: string
  ratedBy: 'doctor' | 'nurse'
  onRatingSubmitted?: () => void
}

export function RatingDialog({
  open,
  onOpenChange,
  consultationId,
  doctorName,
  ratedBy,
  onRatingSubmitted
}: RatingDialogProps) {
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/telehealth/consultation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId,
          action: 'rate',
          rating,
          feedback: feedback.trim() || null,
          ratedBy
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Thank You!",
          description: "Your rating has been submitted successfully.",
        })
        
        onOpenChange(false)
        if (onRatingSubmitted) {
          onRatingSubmitted()
        }
      } else {
        throw new Error(data.error || 'Failed to submit rating')
      }
    } catch (error: any) {
      console.error('Rating submission error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onOpenChange(false)
    if (onRatingSubmitted) {
      onRatingSubmitted()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {ratedBy === 'doctor' ? 'Rate Your Consultation' : 'Rate the Doctor'}
          </DialogTitle>
          <DialogDescription>
            {ratedBy === 'doctor' 
              ? `How was your consultation with the nurse?`
              : `How helpful was Dr. ${doctorName}?`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center space-y-3">
            <p className="text-sm text-gray-600">Select your rating:</p>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm font-medium">
                {rating === 1 && '⭐ Poor'}
                {rating === 2 && '⭐⭐ Fair'}
                {rating === 3 && '⭐⭐⭐ Good'}
                {rating === 4 && '⭐⭐⭐⭐ Very Good'}
                {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
              </p>
            )}
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <label htmlFor="feedback" className="text-sm font-medium">
              Additional Feedback (Optional)
            </label>
            <Textarea
              id="feedback"
              placeholder="Share your experience with this consultation..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

