"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DollarSign, Calendar, Clock, Gift, Briefcase } from "lucide-react"

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
  const [formData, setFormData] = useState({
    offerSalary: '',
    offerStartDate: '',
    offerExpiryDate: '',
    benefits: '',
    workSchedule: '',
    offerNotes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.offerSalary || !formData.offerStartDate || !formData.offerExpiryDate) {
      alert('Please fill in all required fields')
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
          offerNotes: formData.offerNotes
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
        setFormData({
          offerSalary: '',
          offerStartDate: '',
          offerExpiryDate: '',
          benefits: '',
          workSchedule: '',
          offerNotes: ''
        })
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
            <Input
              id="offerSalary"
              placeholder="e.g., $75,000 - $85,000 per year"
              value={formData.offerSalary}
              onChange={(e) => setFormData(prev => ({ ...prev, offerSalary: e.target.value }))}
              required
            />
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
                required
              />
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
                required
              />
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
