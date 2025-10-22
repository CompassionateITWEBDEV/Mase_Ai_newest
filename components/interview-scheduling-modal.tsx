"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, User, FileText } from "lucide-react"

interface InterviewSchedulingModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
  onScheduleSuccess: () => void
}

export default function InterviewSchedulingModal({ 
  isOpen, 
  onClose, 
  application, 
  onScheduleSuccess 
}: InterviewSchedulingModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    interviewDate: '',
    interviewTime: '',
    location: '',
    notes: '',
    interviewer: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.interviewDate || !formData.interviewTime) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/applications/schedule-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          interviewDate: formData.interviewDate,
          interviewTime: formData.interviewTime,
          location: formData.location,
          notes: formData.notes,
          interviewer: formData.interviewer
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to schedule interview')
      }

      const data = await response.json()
      if (data.success) {
        alert('Interview scheduled successfully!')
        onScheduleSuccess()
        onClose()
        setFormData({
          interviewDate: '',
          interviewTime: '',
          location: '',
          notes: '',
          interviewer: ''
        })
      }
    } catch (error: any) {
      console.error('Error scheduling interview:', error)
      alert(`Failed to schedule interview: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Interview
          </DialogTitle>
          <DialogDescription>
            Schedule an interview for {application?.applicant?.full_name || 'Unknown Applicant'} 
            for the position of {application?.job_posting?.title || 'Unknown Position'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interviewDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Interview Date *
              </Label>
              <Input
                id="interviewDate"
                type="date"
                value={formData.interviewDate}
                onChange={(e) => setFormData(prev => ({ ...prev, interviewDate: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interviewTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Interview Time *
              </Label>
              <Input
                id="interviewTime"
                type="time"
                value={formData.interviewTime}
                onChange={(e) => setFormData(prev => ({ ...prev, interviewTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., Main Office, Conference Room A, or Video Call Link"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interviewer" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Interviewer
            </Label>
            <Input
              id="interviewer"
              placeholder="e.g., John Smith, HR Manager"
              value={formData.interviewer}
              onChange={(e) => setFormData(prev => ({ ...prev, interviewer: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions, preparation requirements, or additional information for the candidate..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? 'Scheduling...' : 'Schedule Interview'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
