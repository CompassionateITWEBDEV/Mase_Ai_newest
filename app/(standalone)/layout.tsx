import type React from "react"
import type { Metadata } from "next"
import "../globals.css"

export const metadata: Metadata = {
  title: "Job Application - Compassionate Home Health Services",
  description: "Apply for a position at Compassionate Home Health Services",
}

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
