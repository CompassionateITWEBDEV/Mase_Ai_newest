"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"

export function AvailabilityToggle() {
  const [isAvailable, setIsAvailable] = useState(false)

  const handleToggle = () => {
    setIsAvailable(!isAvailable)
    // Implement availability update logic here
    console.log("Availability changed to:", !isAvailable)
  }

  return (
    <div className="flex items-center space-x-2">
      <p>Availability:</p>
      <Switch id="available" checked={isAvailable} onCheckedChange={handleToggle} />
    </div>
  )
}
