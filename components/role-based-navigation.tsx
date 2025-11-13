"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Home,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  BarChart3,
  Building2,
  UserCheck,
  ClipboardList,
  Briefcase,
  GraduationCap,
  Shield,
  Activity,
  Phone,
  Mail,
  Stethoscope,
  MapPin,
  Zap,
  Target,
  TrendingUp,
  Globe,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  Plus,
  Star,
  Inbox,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Menu,
  X,
} from "lucide-react"

interface NavigationItem {
  name: string
  href: string
  icon: any
  badge?: string
  isNew?: boolean
  description?: string
}

interface NavigationSection {
  name: string
  items: NavigationItem[]
  roles?: string[]
  collapsible?: boolean
}

const navigationSections: NavigationSection[] = [
  {
    name: "Dashboard",
    items: [
      { name: "Overview", href: "/", icon: Home, description: "Main dashboard overview" },
      { name: "Analytics", href: "/analytics", icon: BarChart3, description: "Performance analytics" },
      { name: "Activity Log", href: "/activity-log", icon: Activity, description: "System activity tracking" },
    ],
  },
  {
    name: "Referral Management",
    items: [
      {
        name: "Referral Dashboard",
        href: "/referral-dashboard",
        icon: Inbox,
        badge: "Live",
        description: "Real-time referral monitoring",
      },
      {
        name: "Michigan Referral Hub",
        href: "/michigan-referral-hub",
        icon: MapPin,
        isNew: true,
        description: "Michigan health systems integration",
      },
      {
        name: "Referral Management",
        href: "/referral-management",
        icon: FileText,
        description: "Manage referral pipeline",
      },
      { name: "Referral Intake", href: "/referral-intake", icon: Plus, description: "New referral submission" },
      { name: "Email Integration", href: "/email-integration", icon: Mail, description: "Email referral processing" },
      { name: "Referral Testing", href: "/referral-testing", icon: Target, description: "Test referral automation" },
      {
        name: "Referral Configuration",
        href: "/referral-configuration",
        icon: Settings,
        description: "Configure referral rules",
      },
      {
        name: "Automated Outreach",
        href: "/automated-outreach",
        icon: Zap,
        isNew: true,
        description: "Automated facility outreach campaigns",
      },
    ],
  },
  {
    name: "Patient Care",
    items: [
      { name: "Patient Tracking", href: "/patient-tracking", icon: Users, description: "Patient management dashboard" },
      {
        name: "Patient Portal",
        href: "/patient-portal",
        icon: Stethoscope,
        description: "Patient self-service portal",
      },
      {
        name: "Care Team Management",
        href: "/care-team-management",
        icon: Users,
        description: "Manage patient care teams",
      },
      { name: "Patient Reviews", href: "/patient-reviews", icon: Star, description: "Patient feedback management" },
      { name: "Nurse Scanner", href: "/nurse-scanner", icon: Package, description: "Medication scanning system" },
      { name: "Wound Care Supplies", href: "/wound-care-supplies", icon: Package, description: "Supply management" },
    ],
  },
  {
    name: "Quality & Compliance",
    items: [
      { name: "OASIS QA", href: "/oasis-qa", icon: Shield, description: "OASIS quality assurance" },
      { name: "OASIS Upload", href: "/oasis-upload", icon: FileText, description: "OASIS data upload" },
      { name: "Survey Ready", href: "/survey-ready", icon: CheckCircle, description: "Survey readiness dashboard" },
      { name: "Quality Management", href: "/quality", icon: Shield, description: "Quality assurance tools" },
      { name: "Complaints", href: "/complaints", icon: AlertTriangle, description: "Complaint management" },
    ],
  },
  {
    name: "Staff Management",
    items: [
      { name: "Applications", href: "/applications", icon: UserCheck, description: "Staff applications" },
      { name: "Staff Dashboard", href: "/staff-dashboard", icon: Users, description: "Staff management" },
      { name: "Staff Performance", href: "/staff-performance", icon: TrendingUp, description: "Performance tracking" },
      {
        name: "Staff Competency",
        href: "/staff-competency",
        icon: GraduationCap,
        description: "Competency evaluations",
      },
      { name: "Self Evaluation", href: "/self-evaluation", icon: ClipboardList, description: "Staff self-assessments" },
      { name: "Competency Reviews", href: "/competency-reviews", icon: Eye, description: "Review competencies" },
      {
        name: "Continuing Education",
        href: "/continuing-education",
        icon: GraduationCap,
        description: "CE management",
      },
      { name: "In-Service Training", href: "/in-service", icon: GraduationCap, description: "Training programs" },
    ],
  },
  {
    name: "Operations",
    items: [
      { name: "Schedule", href: "/schedule", icon: Calendar, description: "Staff scheduling" },
      { name: "Communications", href: "/communications", icon: MessageSquare, description: "Team communications" },
      { name: "HR Files", href: "/hr-files", icon: FileText, description: "HR document management" },
      { name: "Leave Requests", href: "/leave-requests", icon: Calendar, description: "Time-off management" },
      { name: "Workflows", href: "/workflows", icon: Zap, description: "Process automation" },
      { name: "Documents", href: "/documents", icon: FileText, description: "Document management" },
      { name: "Training", href: "/training", icon: GraduationCap, description: "Training materials" },
    ],
  },
  {
    name: "Financial",
    items: [
      {
        name: "Financial Dashboard",
        href: "/financial-dashboard",
        icon: DollarSign,
        description: "Financial overview",
      },
      { name: "Billing Center", href: "/billing-center", icon: DollarSign, description: "Billing management" },
      { name: "Billing Automation", href: "/billing-automation", icon: Zap, description: "Automated billing" },
      { name: "Payroll", href: "/payroll", icon: DollarSign, description: "Payroll management" },
      {
        name: "Predictive Analytics",
        href: "/predictive-analytics",
        icon: TrendingUp,
        description: "Financial forecasting",
      },
    ],
  },
  {
    name: "Marketing & Growth",
    items: [
      {
        name: "Marketing Dashboard",
        href: "/marketing-dashboard",
        icon: TrendingUp,
        description: "Marketing analytics",
      },
      { name: "Facility Portal", href: "/facility-portal", icon: Building2, description: "Facility partnerships" },
      { name: "Physicians", href: "/physicians", icon: Stethoscope, description: "Physician network" },
      { name: "Alert Reports", href: "/alert-reports", icon: Bell, description: "Marketing alerts" },
    ],
  },
  {
    name: "Technology",
    items: [
      { name: "Integrations", href: "/integrations", icon: Globe, description: "System integrations" },
      { name: "Fax Management", href: "/fax-management", icon: FileText, description: "Digital fax system" },
      { name: "GPS Analytics", href: "/gps-analytics", icon: MapPin, description: "Location analytics" },
      { name: "Route Optimization", href: "/route-optimization", icon: MapPin, description: "Route planning" },
      { name: "Fleet Management", href: "/fleet-management", icon: MapPin, description: "Vehicle management" },
      { name: "Voice Test", href: "/voice-test", icon: Phone, description: "Voice AI testing" },
      { name: "Video Test", href: "/video-test", icon: Phone, description: "Video conferencing test" },
    ],
  },
  {
    name: "Specialized Portals",
    items: [
      { name: "Doctor Portal", href: "/doctor-portal", icon: Stethoscope, description: "Physician portal" },
      {
        name: "Patient Portal Enhanced",
        href: "/patient-portal-enhanced",
        icon: Users,
        description: "Enhanced patient portal",
      },
      { name: "Employer Dashboard", href: "/employer-dashboard", icon: Briefcase, description: "Employer services" },
      {
        name: "Applicant Dashboard",
        href: "/applicant-dashboard",
        icon: UserCheck,
        description: "Job applicant portal",
      },
      { name: "Jobs Portal", href: "/jobs", icon: Briefcase, description: "Job listings" },
    ],
  },
  {
    name: "Administration",
    items: [
      { name: "Admin Users", href: "/admin/users", icon: Users, description: "User management" },
      { name: "Signatures", href: "/signatures", icon: Edit, description: "Digital signatures" },
      { name: "Invite Users", href: "/invite", icon: Plus, description: "User invitations" },
      {
        name: "Performance Analytics",
        href: "/performance-analytics",
        icon: BarChart3,
        description: "System performance",
      },
      { name: "Order Management", href: "/order-management", icon: Package, description: "Order processing" },
    ],
    roles: ["Admin", "QA Director"],
  },
]

const quickActions = [
  { name: "New Referral", href: "/referral-intake", icon: Plus, color: "bg-blue-500" },
  { name: "Patient Search", href: "/patient-tracking", icon: Search, color: "bg-green-500" },
  { name: "Schedule Visit", href: "/schedule", icon: Calendar, color: "bg-purple-500" },
  { name: "Michigan Hub", href: "/michigan-referral-hub", icon: MapPin, color: "bg-red-500", isNew: true },
]

interface RoleBasedNavigationProps {
  userRole?: string
  userName?: string
}

export function RoleBasedNavigation({ userRole = "QA Director", userName = "Admin User" }: RoleBasedNavigationProps) {
  const pathname = usePathname()
  const [collapsedSections, setCollapsedSections] = useState<string[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleSection = (sectionName: string) => {
    setCollapsedSections((prev) =>
      prev.includes(sectionName) ? prev.filter((name) => name !== sectionName) : [...prev, sectionName],
    )
  }

  const filteredSections = navigationSections.filter((section) => !section.roles || section.roles.includes(userRole))

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-40 h-full w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900 truncate">M.A.S.E. Pro</h2>
                <p className="text-xs text-gray-500 truncate">{userName}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Link key={action.name} href={action.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs h-8 relative bg-transparent"
                  >
                    <div className={`w-2 h-2 rounded-full ${action.color} mr-2 flex-shrink-0`} />
                    <span className="truncate">{action.name}</span>
                    {action.isNew && (
                      <Badge className="ml-1 px-1 py-0 text-xs bg-red-500 text-white flex-shrink-0">NEW</Badge>
                    )}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {filteredSections.map((section) => (
                <div key={section.name}>
                  {section.collapsible ? (
                    <Collapsible
                      open={!collapsedSections.includes(section.name)}
                      onOpenChange={() => toggleSection(section.name)}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{section.name}</h3>
                        {collapsedSections.includes(section.name) ? (
                          <ChevronRight className="h-3 w-3 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-3 w-3 flex-shrink-0" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-1">
                        {section.items.map((item) => (
                          <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                            <Button
                              variant={pathname === item.href ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start text-sm h-9 relative"
                            >
                              <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                              <span className="truncate flex-1 text-left">{item.name}</span>
                              {item.badge && (
                                <Badge className="ml-2 px-1 py-0 text-xs flex-shrink-0">{item.badge}</Badge>
                              )}
                              {item.isNew && (
                                <Badge className="ml-2 px-1 py-0 text-xs bg-red-500 text-white flex-shrink-0">
                                  NEW
                                </Badge>
                              )}
                            </Button>
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <>
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{section.name}</h3>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                            <Button
                              variant={pathname === item.href ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start text-sm h-9 relative"
                            >
                              <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                              <span className="truncate flex-1 text-left">{item.name}</span>
                              {item.badge && (
                                <Badge className="ml-2 px-1 py-0 text-xs flex-shrink-0">{item.badge}</Badge>
                              )}
                              {item.isNew && (
                                <Badge className="ml-2 px-1 py-0 text-xs bg-red-500 text-white flex-shrink-0">
                                  NEW
                                </Badge>
                              )}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>v2.1.0</span>
              <Badge variant="outline" className="text-xs">
                {userRole}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
