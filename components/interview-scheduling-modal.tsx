"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Video, Phone, User } from "lucide-react"

interface InterviewSchedulingModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (interviewData: any) => void
  applications?: any[]
  jobs?: any[]
  employerId?: string
  editMode?: boolean
  initialData?: any
}

export default function InterviewSchedulingModal({
  isOpen,
  onClose,
  onSchedule,
  applications = [],
  jobs = [],
  employerId,
  editMode = false,
  initialData
}: InterviewSchedulingModalProps) {
  const [formData, setFormData] = useState({
    job_posting_id: '',
    applicant_id: '',
    interview_date: '',
    interview_time: '',
    interview_type: 'video',
    interview_location: '',
    meeting_link: '',
    interview_notes: '',
    duration_minutes: 60,
    interviewer_name: '',
    interviewer_email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [availableApplicants, setAvailableApplicants] = useState<any[]>([])

  // Reset form when modal opens or pre-fill for edit mode
  useEffect(() => {
    if (isOpen) {
      if (editMode && initialData) {
        // Pre-fill form with existing interview data
        const interviewDate = new Date(initialData.interview_date)
        setFormData({
          job_posting_id: initialData.job_posting_id || '',
          applicant_id: initialData.applicant_id || '',
          interview_date: interviewDate.toISOString().split('T')[0],
          interview_time: interviewDate.toTimeString().slice(0, 5), // Extract HH:MM
          interview_type: initialData.interview_type || 'video',
          interview_location: initialData.interview_location || '',
          meeting_link: initialData.meeting_link || '',
          interview_notes: initialData.interview_notes || '',
          duration_minutes: initialData.duration_minutes || 60,
          interviewer_name: initialData.interviewer_name || '',
          interviewer_email: initialData.interviewer_email || ''
        })
      } else {
        // Reset form for new interview
        setFormData({
          job_posting_id: '',
          applicant_id: '',
          interview_date: '',
          interview_time: '',
          interview_type: 'video',
          interview_location: '',
          meeting_link: '',
          interview_notes: '',
          duration_minutes: 60,
          interviewer_name: '',
          interviewer_email: ''
        })
      }
      setSelectedJob(null)
      setAvailableApplicants([])
    }
  }, [isOpen, editMode, initialData])

  // Filter applicants when job is selected
  useEffect(() => {
    if (formData.job_posting_id && applications.length > 0) {
      const jobApplicants = applications.filter(app => 
        app.job_posting_id === formData.job_posting_id
      )
      setAvailableApplicants(jobApplicants)
      
      // Find the selected job
      const job = jobs.find(j => j.id === formData.job_posting_id)
      setSelectedJob(job)
    } else {
      setAvailableApplicants([])
      setSelectedJob(null)
    }
  }, [formData.job_posting_id, applications, jobs])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.job_posting_id || !formData.applicant_id || !formData.interview_date || !formData.interview_time) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      // Combine date and time
      const interviewDateTime = new Date(`${formData.interview_date}T${formData.interview_time}`)
      
      const interviewData: any = {
        ...formData,
        employer_id: employerId,
        interview_date: interviewDateTime.toISOString(),
        duration_minutes: parseInt(formData.duration_minutes.toString())
      }

      // Add interview_id if in edit mode
      if (editMode && initialData) {
        interviewData.interview_id = initialData.id
      }

      // Remove empty fields
      Object.keys(interviewData).forEach(key => {
        if (interviewData[key as keyof typeof interviewData] === '') {
          delete interviewData[key as keyof typeof interviewData]
        }
      })

      console.log('📝 Modal sending interview data:', interviewData)
      await onSchedule(interviewData)
      onClose()
    } catch (error: any) {
      console.error('❌ Modal error scheduling interview:', error)
      alert(error.message || 'Failed to schedule interview. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getMinDate = () => {
    const today = new Date()
    today.setDate(today.getDate() + 1) // Minimum tomorrow
    return today.toISOString().split('T')[0]
  }

  const getMinTime = () => {
    if (formData.interview_date === new Date().toISOString().split('T')[0]) {
      const now = new Date()
      const hour = now.getHours() + 1 // At least 1 hour from now
      return `${hour.toString().padStart(2, '0')}:00`
    }
    return '09:00'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {editMode ? 'Edit Interview' : 'Schedule Interview'}
          </DialogTitle>
          <DialogDescription>
            {editMode ? 'Update interview details' : 'Schedule an interview with a qualified applicant'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Selection */}
          <div className="space-y-2">
            <Label htmlFor="job_posting_id">Job Posting *</Label>
            <Select
              value={formData.job_posting_id}
              onValueChange={(value) => handleInputChange('job_posting_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a job posting" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title} - {job.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Applicant Selection */}
          <div className="space-y-2">
            <Label htmlFor="applicant_id">Applicant *</Label>
            <Select
              value={formData.applicant_id}
              onValueChange={(value) => handleInputChange('applicant_id', value)}
              disabled={!formData.job_posting_id}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.job_posting_id ? "Select an applicant" : "First select a job posting"} />
              </SelectTrigger>
              <SelectContent>
                {availableApplicants.map((application) => (
                  <SelectItem key={application.id} value={application.applicant_id || application.id}>
                    {application.applicant?.first_name} {application.applicant?.last_name} - {application.applicant?.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.job_posting_id && availableApplicants.length === 0 && (
              <p className="text-sm text-gray-500">No applicants found for this job posting</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interview_date">Interview Date *</Label>
              <Input
                id="interview_date"
                type="date"
                value={formData.interview_date}
                onChange={(e) => handleInputChange('interview_date', e.target.value)}
                min={getMinDate()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interview_time">Interview Time *</Label>
              <Input
                id="interview_time"
                type="time"
                value={formData.interview_time}
                onChange={(e) => handleInputChange('interview_time', e.target.value)}
                min={getMinTime()}
                required
              />
            </div>
          </div>

          {/* Interview Type */}
          <div className="space-y-2">
            <Label htmlFor="interview_type">Interview Type *</Label>
            <Select
              value={formData.interview_type}
              onValueChange={(value) => handleInputChange('interview_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video Call
                  </div>
                </SelectItem>
                <SelectItem value="phone">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Call
                  </div>
                </SelectItem>
                <SelectItem value="in-person">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    In-Person
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location or Meeting Link */}
          {formData.interview_type === 'in-person' && (
            <div className="space-y-2">
              <Label htmlFor="interview_location">Interview Location *</Label>
              <Input
                id="interview_location"
                placeholder="e.g., 123 Main St, City, State"
                value={formData.interview_location}
                onChange={(e) => handleInputChange('interview_location', e.target.value)}
                required
              />
            </div>
          )}

          {formData.interview_type === 'video' && (
            <div className="space-y-2">
              <Label htmlFor="meeting_link">Meeting Link</Label>
              <Input
                id="meeting_link"
                placeholder="e.g., https://meet.google.com/abc-defg-hij"
                value={formData.meeting_link}
                onChange={(e) => handleInputChange('meeting_link', e.target.value)}
              />
            </div>
          )}

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
            <Select
              value={formData.duration_minutes.toString()}
              onValueChange={(value) => handleInputChange('duration_minutes', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interviewer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interviewer_name">Interviewer Name</Label>
              <Input
                id="interviewer_name"
                placeholder="e.g., John Smith"
                value={formData.interviewer_name}
                onChange={(e) => handleInputChange('interviewer_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interviewer_email">Interviewer Email</Label>
              <Input
                id="interviewer_email"
                type="email"
                placeholder="e.g., john@company.com"
                value={formData.interviewer_email}
                onChange={(e) => handleInputChange('interviewer_email', e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="interview_notes">Interview Notes</Label>
            <Textarea
              id="interview_notes"
              placeholder="Any special instructions or notes for the interview..."
              value={formData.interview_notes}
              onChange={(e) => handleInputChange('interview_notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Interview
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}