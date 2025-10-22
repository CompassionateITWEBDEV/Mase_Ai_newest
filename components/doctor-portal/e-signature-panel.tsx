"use client"

import { Button } from "@/components/ui/button"

interface ESignaturePanelProps {
  encounterNote: string
  onSign: () => void
}

export function ESignaturePanel({ encounterNote, onSign }: ESignaturePanelProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">Encounter Note</h3>
      <p>{encounterNote}</p>
      <Button onClick={onSign}>E-Sign</Button>
    </div>
  )
}
