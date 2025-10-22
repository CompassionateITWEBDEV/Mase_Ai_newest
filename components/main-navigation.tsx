import { Activity, BarChart3, AlertTriangle, TrendingUp } from "lucide-react"

const MainNavigation = () => {
  const navigationItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "DashboardIcon",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: "SettingsIcon",
    },
    {
      title: "Monitoring",
      items: [
        {
          title: "System Health",
          href: "/monitoring",
          icon: Activity,
        },
        {
          title: "Performance Metrics",
          href: "/monitoring?tab=performance",
          icon: BarChart3,
        },
        {
          title: "Alert Management",
          href: "/monitoring?tab=alerts",
          icon: AlertTriangle,
        },
        {
          title: "API Analytics",
          href: "/monitoring?tab=analytics",
          icon: TrendingUp,
        },
      ],
    },
    // /** rest of code here **/
  ]

  return <nav>{/* Navigation code here */}</nav>
}

export default MainNavigation
