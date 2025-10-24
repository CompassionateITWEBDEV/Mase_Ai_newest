"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Calendar, Clock, Gift, Briefcase, AlertCircle } from "lucide-react"

interface JobOfferModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
  onOfferSuccess: () => void
}

export default function JobOfferModal({ 
  isOpen, 
  onClose, 
  application, 
  onOfferSuccess 
}: JobOfferModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    offerSalary: '',
    salaryType: 'yearly',
    offerStartDate: '',
    offerExpiryDate: '',
    benefits: '',
    workSchedule: '',
    offerNotes: ''
  })

  // Set default values when modal opens
  useEffect(() => {
    if (isOpen && application) {
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
      
      setFormData({
        offerSalary: application.job_posting?.salary_min ? 
          `$${application.job_posting.salary_min.toLocaleString()} - $${application.job_posting.salary_max?.toLocaleString() || application.job_posting.salary_min.toLocaleString()}` : '',
        salaryType: application.job_posting?.salary_type || 'yearly',
        offerStartDate: nextWeek.toISOString().split('T')[0],
        offerExpiryDate: twoWeeksFromNow.toISOString().split('T')[0],
        benefits: application.job_posting?.benefits || '',
        workSchedule: application.job_posting?.job_type === 'full-time' ? 'Monday-Friday, 9 AM - 5 PM' : 
                     application.job_posting?.job_type === 'part-time' ? 'Part-time, flexible schedule' : '',
        offerNotes: ''
      })
      setErrors({})
    }
  }, [isOpen, application])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.offerSalary.trim()) {
      newErrors.offerSalary = 'Salary is required'
    }
    
    if (!formData.offerStartDate) {
      newErrors.offerStartDate = 'Start date is required'
    } else {
      const startDate = new Date(formData.offerStartDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (startDate < today) {
        newErrors.offerStartDate = 'Start date cannot be in the past'
      }
    }
    
    if (!formData.offerExpiryDate) {
      newErrors.offerExpiryDate = 'Expiry date is required'
    } else {
      const expiryDate = new Date(formData.offerExpiryDate)
      const startDate = new Date(formData.offerStartDate)
      if (expiryDate <= startDate) {
        newErrors.offerExpiryDate = 'Expiry date must be after start date'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/applications/send-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          offerSalary: formData.offerSalary,
          offerStartDate: formData.offerStartDate,
          offerExpiryDate: formData.offerExpiryDate,
          benefits: formData.benefits,
          workSchedule: formData.workSchedule,
          offerNotes: formData.offerNotes,
          isCandidatePool: application.is_candidate_pool || false,
          candidateId: application.applicant_id,
          employerId: application.employer_id,
          jobTitle: application.job_posting?.title || 'Direct Offer'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send offer')
      }

      const data = await response.json()
      if (data.success) {
        alert('Job offer sent successfully!')
        onOfferSuccess()
        onClose()
      }
    } catch (error: any) {
      console.error('Error sending offer:', error)
      alert(`Failed to send offer: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Send Job Offer
          </DialogTitle>
          <DialogDescription>
            Send a job offer to {application?.applicant?.full_name || 'Unknown Applicant'} 
            for the position of {application?.job_posting?.title || 'Unknown Position'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="offerSalary" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Offer Salary *
            </Label>
            <div className="flex gap-2">
              <Input
                id="offerSalary"
                placeholder="e.g., $75,000 - $85,000"
                value={formData.offerSalary}
                onChange={(e) => setFormData(prev => ({ ...prev, offerSalary: e.target.value }))}
                className={errors.offerSalary ? 'border-red-500' : ''}
                required
              />
              <Select
                value={formData.salaryType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, salaryType: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yearly">per year</SelectItem>
                  <SelectItem value="monthly">per month</SelectItem>
                  <SelectItem value="hourly">per hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.offerSalary && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.offerSalary}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offerStartDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date *
              </Label>
              <Input
                id="offerStartDate"
                type="date"
                value={formData.offerStartDate}
                onChange={(e) => setFormData(prev => ({ ...prev, offerStartDate: e.target.value }))}
                className={errors.offerStartDate ? 'border-red-500' : ''}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              {errors.offerStartDate && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.offerStartDate}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="offerExpiryDate" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Offer Expiry Date *
              </Label>
              <Input
                id="offerExpiryDate"
                type="date"
                value={formData.offerExpiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, offerExpiryDate: e.target.value }))}
                className={errors.offerExpiryDate ? 'border-red-500' : ''}
                min={formData.offerStartDate || new Date().toISOString().split('T')[0]}
                required
              />
              {errors.offerExpiryDate && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.offerExpiryDate}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefits" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Benefits & Perks
            </Label>
            <Textarea
              id="benefits"
              placeholder="e.g., Health insurance, 401k, paid time off, flexible schedule..."
              value={formData.benefits}
              onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workSchedule" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Work Schedule
            </Label>
            <Input
              id="workSchedule"
              placeholder="e.g., Monday-Friday, 9 AM - 5 PM, Remote/Hybrid"
              value={formData.workSchedule}
              onChange={(e) => setFormData(prev => ({ ...prev, workSchedule: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offerNotes" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Additional Notes
            </Label>
            <Textarea
              id="offerNotes"
              placeholder="Any additional information, next steps, or special instructions for the candidate..."
              value={formData.offerNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, offerNotes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? 'Sending Offer...' : 'Send Job Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
