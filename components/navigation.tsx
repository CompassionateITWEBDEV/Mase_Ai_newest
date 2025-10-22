import { Settings, User, Star } from "lucide-react"

import type { MainNavItem, SidebarNavItem } from "@/types"

interface DashboardConfig {
  mainNav: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: "Documentation",
      href: "/docs",
    },
    {
      title: "Support",
      href: "/support",
      disabled: true,
    },
  ],
  sidebarNav: [
    {
      title: "Account",
      href: "/account",
      icon: User,
    },
    {
      title: "Star Rating Dashboard",
      href: "/employer-dashboard",
      icon: Star,
    },
    {
      title: "Comprehensive Chart QA",
      href: "/comprehensive-qa",
      icon: Settings,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ],
}
