"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Phone,
  Mail,
  Stethoscope,
  MapPin,
  Zap,
  Target,
  TrendingUp,
  Globe,
  ChevronDown,
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
  Heart,
  Navigation,
  FileCheck,
  Brain,
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
  icon: any
  color: string
}

const navigationSections: NavigationSection[] = [
  {
    name: "Referral Hub",
    icon: Navigation,
    color: "text-cyan-400",
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
    icon: Heart,
    color: "text-red-400",
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
    icon: Shield,
    color: "text-green-400",
    items: [
      { name: "OASIS QA", href: "/oasis-qa", icon: Shield, description: "OASIS quality assurance" },
      { name: "OASIS Upload", href: "/oasis-upload", icon: FileText, description: "OASIS data upload" },
      { name: "Survey Ready", href: "/survey-ready", icon: CheckCircle, description: "Survey readiness dashboard" },
      { name: "Quality Management", href: "/quality", icon: Shield, description: "Quality assurance tools" },
      { name: "Complaints", href: "/complaints", icon: AlertTriangle, description: "Complaint management" },
      { name: "Surveyor Login", href: "/survey-login", icon: FileCheck, description: "Login for surveyors" },
    ],
  },
  {
    name: "Staff Management",
    icon: Users,
    color: "text-purple-400",
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
      { name: "Evaluations", href: "/evaluations", icon: ClipboardList, description: "Staff evaluations" },
    ],
  },
  {
    name: "Operations",
    icon: Settings,
    color: "text-orange-400",
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
    icon: DollarSign,
    color: "text-emerald-400",
    items: [
      {
        name: "Financial Dashboard",
        href: "/financial-dashboard",
        icon: DollarSign,
        description: "Financial overview",
      },
      { name: "Billing Center", href: "/billing-center", icon: DollarSign, description: "Billing management" },
      { name: "Advanced Billing", href: "/advanced-billing", icon: Zap, description: "Advanced billing features" },
      { name: "Billing Automation", href: "/billing-automation", icon: Zap, description: "Automated billing" },
      { name: "Payroll", href: "/payroll", icon: DollarSign, description: "Payroll management" },
      {
        name: "Predictive Analytics",
        href: "/predictive-analytics",
        icon: TrendingUp,
        description: "Financial forecasting",
      },
      {
        name: "Predictive Marketing",
        href: "/predictive-marketing",
        icon: TrendingUp,
        description: "Marketing predictions",
      },
    ],
  },
  {
    name: "Marketing & Growth",
    icon: TrendingUp,
    color: "text-pink-400",
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
    icon: Globe,
    color: "text-indigo-400",
    items: [
      { name: "Integrations", href: "/integrations", icon: Globe, description: "System integrations" },
      {
        name: "Integration Testing",
        href: "/integration-testing",
        icon: CheckCircle,
        badge: "Test",
        description: "Test all system integrations",
      },
      {
        name: "ADR Management",
        href: "/integrations/axxess-setup",
        icon: FileText,
        isNew: true,
        description: "Manage Additional Development Requests",
      },
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
    icon: Briefcase,
    color: "text-cyan-400",
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
    icon: Settings,
    color: "text-gray-400",
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
      { name: "Activity Log", href: "/activity-log", icon: FileText, description: "System activity log" },
      { name: "Comprehensive QA", href: "/comprehensive-qa", icon: Shield, description: "Comprehensive QA system" },
    ],
  },
]

interface CompactNavigationProps {
  userRole?: string
  userName?: string
}

export function CompactNavigation({ userRole = "Neural Director", userName = "AI Admin" }: CompactNavigationProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden glass-morphism"
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

      <div
        className={`fixed left-0 top-0 z-40 h-full w-56 transform glass-morphism border-r border-white/10 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 p-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 neural-node">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-sm neural-text truncate">Mase AI Neural Hub</h2>
                <p className="text-xs text-gray-400 truncate">{userName}</p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 p-3 border-b border-white/10">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Neural Commands</h3>
            <div className="grid grid-cols-2 gap-1">
              {quickActions.map((action, index) => (
                <Link key={action.name} href={action.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs h-7 relative quantum-border hover:scale-105 transition-all duration-300 bg-transparent"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`w-2 h-2 rounded-full ${action.color} mr-1 flex-shrink-0`} />
                    <span className="truncate text-xs text-gray-300">{action.name}</span>
                    {action.isNew && (
                      <Badge className="ml-1 px-1 py-0 text-xs bg-orange-500/20 text-orange-400 border-orange-400/50 flex-shrink-0">
                        NEW
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 p-3 border-b border-white/10">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant={pathname === "/" ? "secondary" : "ghost"}
                size="sm"
                className={`w-full justify-start text-sm h-8 ${pathname === "/" ? "glass-morphism border-orange-400/50 text-orange-400" : "hover:glass-morphism"}`}
              >
                <Home className="h-4 w-4 mr-2" />
                Neural Hub
              </Button>
            </Link>
            <Link href="/analytics" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant={pathname === "/analytics" ? "secondary" : "ghost"}
                size="sm"
                className={`w-full justify-start text-sm h-8 mt-1 ${pathname === "/analytics" ? "glass-morphism border-cyan-400/50 text-cyan-400" : "hover:glass-morphism"}`}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                AI Analytics
              </Button>
            </Link>
          </div>

          <ScrollArea className="flex-1 custom-scrollbar">
            <div className="p-3 space-y-1">
              {navigationSections.map((section, index) => (
                <DropdownMenu key={section.name}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between text-sm h-8 hover:glass-morphism neural-node"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center">
                        <section.icon className={`h-4 w-4 mr-2 ${section.color}`} />
                        <span className="truncate text-gray-300">{section.name}</span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    className="w-64 max-h-96 overflow-y-auto glass-morphism border-white/10"
                  >
                    <DropdownMenuLabel className="text-xs font-medium text-gray-400 uppercase">
                      {section.name}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {section.items.map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center w-full px-2 py-2 text-sm cursor-pointer rounded-md transition-all duration-200 ${
                            pathname === item.href
                              ? "glass-morphism border-orange-400/50 text-orange-400"
                              : "hover:glass-morphism text-gray-300 hover:text-white"
                          }`}
                        >
                          <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="truncate font-medium">{item.name}</span>
                              <div className="flex items-center space-x-1 ml-2">
                                {item.badge && (
                                  <Badge className="px-1 py-0 text-xs glass-morphism border-cyan-400/50 text-cyan-400">
                                    {item.badge}
                                  </Badge>
                                )}
                                {item.isNew && (
                                  <Badge className="px-1 py-0 text-xs bg-orange-500/20 text-orange-400 border-orange-400/50">
                                    NEW
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
                            )}
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </div>
          </ScrollArea>

          <div className="flex-shrink-0 p-3 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Neural v3.0</span>
              <Badge
                variant="outline"
                className="text-xs px-1 py-0 glass-morphism border-purple-400/50 text-purple-400"
              >
                {userRole}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const quickActions = [
  { name: "New Referral", href: "/referral-intake", icon: Plus, color: "bg-cyan-500" },
  { name: "AI Search", href: "/patient-tracking", icon: Search, color: "bg-green-500" },
  { name: "Neural Schedule", href: "/schedule", icon: Calendar, color: "bg-purple-500" },
  { name: "Quantum Hub", href: "/michigan-referral-hub", icon: MapPin, color: "bg-orange-500", isNew: true },
]
