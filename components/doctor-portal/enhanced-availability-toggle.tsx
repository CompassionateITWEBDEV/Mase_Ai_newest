"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Activity, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function EnhancedAvailabilityToggle() {
  const { toast } = useToast()
  const [isAvailable, setIsAvailable] = useState(false)
  const [availabilityMode, setAvailabilityMode] = useState("immediate")
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Get doctor ID from localStorage and load availability status
  useEffect(() => {
    const loadDoctorData = async () => {
      try {
        const storedUser = localStorage.getItem('currentUser')
        if (!storedUser) {
          console.warn('⚠️ [AVAILABILITY] No user in localStorage')
          setIsLoading(false)
          return
        }

        const user = JSON.parse(storedUser)
        if (user.accountType !== 'doctor') {
          console.warn('⚠️ [AVAILABILITY] User is not a doctor')
          setIsLoading(false)
          return
        }

        setDoctorId(user.id)
        console.log('✅ [AVAILABILITY] Doctor ID loaded:', user.id)

        // Fetch current availability status from database
        const response = await fetch(`/api/doctors/availability?doctorId=${user.id}`)
        const data = await response.json()

        if (data.success) {
          console.log('✅ [AVAILABILITY] Loaded from database:', data.availability)
          setIsAvailable(data.availability.isAvailable)
          setAvailabilityMode(data.availability.availabilityMode)
        }
      } catch (error) {
        console.error('❌ [AVAILABILITY] Error loading:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDoctorData()
  }, [])

  // Update availability in database
  const updateAvailability = async (newIsAvailable: boolean, newMode?: string) => {
    if (!doctorId) {
      toast({
        title: "Error",
        description: "Please login first",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)

    try {
      console.log('🔄 [AVAILABILITY] Updating to:', newIsAvailable, newMode)

      const response = await fetch('/api/doctors/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          isAvailable: newIsAvailable,
          availabilityMode: newMode || availabilityMode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update availability')
      }

      console.log('✅ [AVAILABILITY] Updated successfully')

      toast({
        title: "Availability Updated",
        description: `You are now ${newIsAvailable ? 'available' : 'offline'} for consultations`,
      })

    } catch (error: any) {
      console.error('❌ [AVAILABILITY] Error updating:', error)
      
      // Revert state on error
      setIsAvailable(!newIsAvailable)
      
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update availability",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = () => {
    const newValue = !isAvailable
    setIsAvailable(newValue)
    updateAvailability(newValue)
  }

  const handleModeChange = (newMode: string) => {
    setAvailabilityMode(newMode)
    if (isAvailable) {
      updateAvailability(isAvailable, newMode)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading availability status...</span>
        </CardContent>
      </Card>
    )
  }

  if (!doctorId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-600">
          <p>Please login to manage your availability</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Availability Status
              {isSaving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            </span>
            <Badge
              variant={isAvailable ? "default" : "secondary"}
              className={isAvailable ? "bg-green-500 hover:bg-green-600" : "bg-gray-500"}
            >
              {isAvailable ? "Available" : "Offline"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Online Status</h3>
              <p className="text-sm text-gray-600">
                {isAvailable
                  ? "You're available for urgent telehealth consultations"
                  : "You're currently offline and won't receive consultation requests"}
              </p>
            </div>
            <Switch
              id="available"
              checked={isAvailable}
              onCheckedChange={handleToggle}
              disabled={isSaving}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {isAvailable && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium">Availability Mode</label>
                <Select 
                  value={availabilityMode} 
                  onValueChange={handleModeChange}
                  disabled={isSaving}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate - Accept consultations now</SelectItem>
                    <SelectItem value="scheduled">Scheduled - Only pre-scheduled appointments</SelectItem>
                    <SelectItem value="both">Both - Immediate and scheduled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">How you want to receive consultation requests</p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium">Active and ready for consultations</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
