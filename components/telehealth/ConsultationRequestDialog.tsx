"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Stethoscope, Loader2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ConsultationRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId?: string
  patientName: string
  nurseId: string
  nurseName: string
  onConsultationCreated: (consultationId: string) => void
}

export function ConsultationRequestDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  nurseId,
  nurseName,
  onConsultationCreated
}: ConsultationRequestDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [newSymptom, setNewSymptom] = useState('')

  const [formData, setFormData] = useState({
    reasonForConsult: '',
    urgencyLevel: 'medium',
    chiefComplaint: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    respiratoryRate: ''
  })

  const handleAddSymptom = () => {
    if (newSymptom.trim() && !symptoms.includes(newSymptom.trim())) {
      setSymptoms([...symptoms, newSymptom.trim()])
      setNewSymptom('')
    }
  }

  const handleRemoveSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter(s => s !== symptom))
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.reasonForConsult.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for consultation",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare vital signs
      const vitalSigns: any = {}
      if (formData.bloodPressure) vitalSigns.bloodPressure = formData.bloodPressure
      if (formData.heartRate) vitalSigns.heartRate = parseInt(formData.heartRate)
      if (formData.temperature) vitalSigns.temperature = parseFloat(formData.temperature)
      if (formData.oxygenSaturation) vitalSigns.oxygenSaturation = parseInt(formData.oxygenSaturation)
      if (formData.respiratoryRate) vitalSigns.respiratoryRate = parseInt(formData.respiratoryRate)

      // Create consultation request
      const response = await fetch('/api/telehealth/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patientName,
          patientInitials: patientName.split(' ').map(n => n[0]).join('.') + '.',
          nurseId,
          nurseName,
          reasonForConsult: formData.reasonForConsult,
          urgencyLevel: formData.urgencyLevel,
          symptoms,
          vitalSigns,
          chiefComplaint: formData.chiefComplaint || formData.reasonForConsult,
          estimatedDuration: 15,
          compensationAmount: formData.urgencyLevel === 'critical' ? 200 : formData.urgencyLevel === 'high' ? 150 : 125
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Doctor consultation requested. Waiting for doctor to accept...",
        })
        onConsultationCreated(data.consultation.id)
        onOpenChange(false)
        
        // Reset form
        setFormData({
          reasonForConsult: '',
          urgencyLevel: 'medium',
          chiefComplaint: '',
          bloodPressure: '',
          heartRate: '',
          temperature: '',
          oxygenSaturation: '',
          respiratoryRate: ''
        })
        setSymptoms([])
      } else {
        throw new Error(data.error || 'Failed to create consultation')
      }
    } catch (error: any) {
      console.error('Submit error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to request consultation",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Request Doctor Consultation
          </DialogTitle>
          <DialogDescription>
            Request an emergency video consultation with an available doctor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Patient: {patientName}</p>
            <p className="text-xs text-blue-700">Nurse: {nurseName}</p>
          </div>

          {/* Urgency Level */}
          <div className="space-y-2">
            <Label htmlFor="urgency">Urgency Level *</Label>
            <Select 
              value={formData.urgencyLevel}
              onValueChange={(value) => setFormData({...formData, urgencyLevel: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Low - Routine consultation
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    Medium - Needs attention
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    High - Urgent care needed
                  </div>
                </SelectItem>
                <SelectItem value="critical">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    Critical - Emergency
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason for Consultation */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Consultation *</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Patient experiencing chest pain and shortness of breath"
              value={formData.reasonForConsult}
              onChange={(e) => setFormData({...formData, reasonForConsult: e.target.value})}
              rows={3}
            />
          </div>

          {/* Chief Complaint */}
          <div className="space-y-2">
            <Label htmlFor="complaint">Chief Complaint</Label>
            <Input
              id="complaint"
              placeholder="e.g., Acute chest pain"
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({...formData, chiefComplaint: e.target.value})}
            />
          </div>

          {/* Symptoms */}
          <div className="space-y-2">
            <Label>Symptoms</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add symptom (e.g., Chest pain)"
                value={newSymptom}
                onChange={(e) => setNewSymptom(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSymptom())}
              />
              <Button type="button" onClick={handleAddSymptom} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {symptoms.map((symptom, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {symptom}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveSymptom(symptom)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Vital Signs */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Vital Signs</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="bp" className="text-xs">Blood Pressure</Label>
                <Input
                  id="bp"
                  placeholder="e.g., 120/80"
                  value={formData.bloodPressure}
                  onChange={(e) => setFormData({...formData, bloodPressure: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hr" className="text-xs">Heart Rate (bpm)</Label>
                <Input
                  id="hr"
                  type="number"
                  placeholder="e.g., 72"
                  value={formData.heartRate}
                  onChange={(e) => setFormData({...formData, heartRate: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="temp" className="text-xs">Temperature (°F)</Label>
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 98.6"
                  value={formData.temperature}
                  onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="o2" className="text-xs">O2 Saturation (%)</Label>
                <Input
                  id="o2"
                  type="number"
                  placeholder="e.g., 98"
                  value={formData.oxygenSaturation}
                  onChange={(e) => setFormData({...formData, oxygenSaturation: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Warning for critical */}
          {formData.urgencyLevel === 'critical' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Critical Urgency</p>
                <p className="text-xs text-red-700">
                  For life-threatening emergencies, call 911 immediately. This consultation is for urgent medical guidance.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={getUrgencyColor(formData.urgencyLevel)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <Stethoscope className="h-4 w-4 mr-2" />
                Request Consultation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

