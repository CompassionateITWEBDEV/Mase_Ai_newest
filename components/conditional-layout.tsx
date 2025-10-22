"use client"

import { usePathname } from "next/navigation"
import type React from "react"
import { CompactNavigation } from "@/components/compact-navigation"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Pages that should not show the admin navigation
  const cleanLayoutPages = ["/application"]
  const shouldShowNavigation = !cleanLayoutPages.includes(pathname)

  if (shouldShowNavigation) {
    return (
      <div className="flex min-h-screen">
        <CompactNavigation />
        <main className="flex-1 bg-gray-50 lg:ml-56 min-w-0">{children}</main>
      </div>
    )
  }

  return (
    <main className="flex-1 bg-gray-50 min-w-0">{children}</main>
  )
}
