"use client"

import { Button } from "@/components/ui/button"

interface PatientPortalProps {
  onEmergencyRequest: () => void
}

export function PatientPortal({ onEmergencyRequest }: PatientPortalProps) {
  return (
    <div className="p-4">
      <h3 className="font-semibold">Patient Portal</h3>
      <Button onClick={onEmergencyRequest}>Emergency Request</Button>
      {/* Implement other UI elements here */}
    </div>
  )
}
