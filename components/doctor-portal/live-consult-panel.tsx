"use client"

import { Button } from "@/components/ui/button"

interface LiveConsultPanelProps {
  nurseName: string
  patientInitials: string
  reasonForConsult: string
  onAccept: () => void
  onReject: () => void
}

export function LiveConsultPanel({
  nurseName,
  patientInitials,
  reasonForConsult,
  onAccept,
  onReject,
}: LiveConsultPanelProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">Live Consult Request</h3>
      <p>Nurse: {nurseName}</p>
      <p>Patient: {patientInitials}</p>
      <p>Reason: {reasonForConsult}</p>
      <div className="flex space-x-2 mt-4">
        <Button onClick={onAccept}>Accept</Button>
        <Button variant="outline" onClick={onReject}>
          Reject
        </Button>
      </div>
    </div>
  )
}
