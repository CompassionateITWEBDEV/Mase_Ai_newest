"use client"
import ClientAIVoiceAssistant from "@/components/ClientAIVoiceAssistant"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  DollarSign,
  TrendingUp,
  Bell,
  FileText,
  Shield,
  Zap,
  Brain,
  Activity,
  Clock,
  CheckCircle,
  BarChart3,
  Settings,
  Eye,
  Inbox,
  Stethoscope,
  UserCheck,
  CreditCard,
  Database,
  Workflow,
  Lightbulb,
  MessageSquare,
  Target,
  Smartphone,
  Clipboard,
  AlertTriangle,
  RefreshCw,
  Cpu,
} from "lucide-react"
import NextLink from "next/link"
import { testDatabaseConnection } from "@/lib/database-test"

interface DashboardStats {
  totalPatients: number
  activeStaff: number
  pendingReferrals: number
  monthlyRevenue: number
  qualityScore: number
  complianceRate: number
  aiInsights: number
  automatedTasks: number
}

interface RecentActivity {
  id: string
  type: "referral" | "patient" | "staff" | "quality" | "billing"
  title: string
  description: string
  timestamp: string
  priority: "low" | "medium" | "high"
  status: "completed" | "pending"
}

interface AIInsight {
  id: string
  category: "financial" | "quality" | "staffing" | "compliance"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  confidence: number
  recommendation: string
  actionRequired: boolean
}

export default function MASEDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 247,
    activeStaff: 89,
    pendingReferrals: 12,
    monthlyRevenue: 1247500,
    qualityScore: 94.2,
    complianceRate: 97.8,
    aiInsights: 23,
    automatedTasks: 156,
  })

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "referral",
      title: "New Hospital Referral",
      description: "Margaret Anderson - CHF, requires immediate assessment",
      timestamp: "2 minutes ago",
      priority: "high",
      status: "pending",
    },
    {
      id: "2",
      type: "quality",
      title: "Chart QA Completed",
      description: "Robert Thompson - 94% quality score, 2 minor issues",
      timestamp: "15 minutes ago",
      priority: "medium",
      status: "completed",
    },
    {
      id: "3",
      type: "staff",
      title: "Staff Competency Review",
      description: "Sarah Johnson, RN - Annual review due in 3 days",
      timestamp: "1 hour ago",
      priority: "medium",
      status: "pending",
    },
    {
      id: "4",
      type: "billing",
      title: "Insurance Authorization",
      description: "Dorothy Williams - Medicare auth approved for PT/OT",
      timestamp: "2 hours ago",
      priority: "low",
      status: "completed",
    },
  ])

  const [aiInsights] = useState<AIInsight[]>([
    {
      id: "1",
      category: "financial",
      title: "Revenue Optimization Opportunity",
      description: "OASIS scoring optimization could increase episode reimbursement by $127 per patient",
      impact: "high",
      confidence: 94,
      recommendation: "Review M1800 functional scoring for 12 active patients",
      actionRequired: true,
    },
    {
      id: "2",
      category: "quality",
      title: "Documentation Pattern Detected",
      description: "3 patients showing similar medication reconciliation gaps",
      impact: "medium",
      confidence: 87,
      recommendation: "Implement automated medication verification workflow",
      actionRequired: true,
    },
    {
      id: "3",
      category: "staffing",
      title: "Workload Distribution Alert",
      description: "RN caseloads are 15% above optimal efficiency threshold",
      impact: "medium",
      confidence: 91,
      recommendation: "Consider hiring additional RN or redistributing cases",
      actionRequired: false,
    },
  ])

  const [dbStatus, setDbStatus] = useState<{ connected: boolean; lastCheck: Date | null; loading: boolean }>({
    connected: true, // Start optimistic
    lastCheck: null,
    loading: false,
  })

  const [axxessStatus, setAxxessStatus] = useState<{
    connected: boolean
    lastSync: Date | null
    syncInProgress: boolean
  }>({
    connected: true,
    lastSync: new Date(),
    syncInProgress: false,
  })

  useEffect(() => {
    const checkDatabaseConnection = async () => {
      if (dbStatus.loading) return // Prevent multiple simultaneous checks

      setDbStatus((prev) => ({ ...prev, loading: true }))

      try {
        const result = await testDatabaseConnection()
        setDbStatus({
          connected: result.connection,
          lastCheck: new Date(),
          loading: false,
        })
      } catch (error) {
        console.error("Database connection check failed:", error)
        setDbStatus({
          connected: false,
          lastCheck: new Date(),
          loading: false,
        })
      }
    }

    // Initial check after 2 seconds to let page load first
    const initialTimeout = setTimeout(checkDatabaseConnection, 2000)

    const interval = setInterval(checkDatabaseConnection, 300000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [dbStatus.loading])

  useEffect(() => {
    const checkAxxessSync = async () => {
      try {
        const response = await fetch("/api/axxess/sync-status")
        if (response.ok) {
          const data = await response.json()
          setAxxessStatus({
            connected: data.connected,
            lastSync: data.lastSync ? new Date(data.lastSync) : null,
            syncInProgress: data.syncInProgress || false,
          })
        }
      } catch (error) {
        console.error("Axxess sync check failed:", error)
      }
    }

    checkAxxessSync()
    const interval = setInterval(checkAxxessSync, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "referral":
        return <Users className="h-4 w-4" />
      case "patient":
        return <Stethoscope className="h-4 w-4" />
      case "staff":
        return <UserCheck className="h-4 w-4" />
      case "quality":
        return <Shield className="h-4 w-4" />
      case "billing":
        return <CreditCard className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400 bg-red-500/10"
      case "medium":
        return "text-yellow-400 bg-yellow-500/10"
      case "low":
        return "text-green-400 bg-green-500/10"
      default:
        return "text-gray-400 bg-gray-500/10"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-400"
      case "medium":
        return "text-yellow-400"
      case "low":
        return "text-green-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div className="min-h-screen neural-bg">
      {/* Header */}
      <div className="glass-morphism border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-8">
            <div className="flex items-center space-x-4">
              <div className="neural-node w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-cyan-500 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold neural-text">Mase AI Neural Hub</h1>
                <p className="ai-subtitle text-lg">Advanced Healthcare Intelligence & Automation Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant="outline"
                className={`glass-morphism ${dbStatus.connected ? "border-green-400/50 text-green-400" : "border-red-400/50 text-red-400"}`}
              >
                <Activity className="h-4 w-4 mr-1" />
                {dbStatus.connected ? "Neural Network Active" : "Connection Issues"}
              </Badge>
              <Badge variant="outline" className="glass-morphism border-cyan-400/50 text-cyan-400 pulse-glow">
                <Cpu className="h-3 w-3 mr-1" />
                AI Core Online
              </Badge>
              <NextLink href="/system-status">
                <Button
                  size="sm"
                  className="glass-morphism border-orange-400/50 text-orange-400 hover:bg-orange-500/20"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  System Status
                </Button>
              </NextLink>
            </div>
          </div>
        </div>
      </div>

      {axxessStatus.syncInProgress && (
        <div className="glass-morphism border-l-4 border-cyan-400 bg-cyan-500/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex py-4">
              <RefreshCw className="h-5 w-5 text-cyan-400 animate-spin" />
              <div className="ml-3">
                <p className="text-sm text-cyan-300">
                  <span className="neural-text">Neural Sync Active:</span> Synchronizing with AxxessWeb... Last sync:{" "}
                  {axxessStatus.lastSync?.toLocaleTimeString() || "Never"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!dbStatus.connected && !dbStatus.loading && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Database connection issues detected. Some features may not work properly.{" "}
                  <NextLink href="/system-status" className="font-medium underline">
                    Check system status
                  </NextLink>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="holographic-card neural-node float-animation">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl ai-glow">
                  <Users className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Neural Patients</p>
                  <p className="text-3xl font-bold neural-text">{stats.totalPatients}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-green-400">+12% quantum efficiency</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="holographic-card neural-node float-animation" style={{ animationDelay: "0.5s" }}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl ai-glow">
                  <UserCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Active Neural Staff</p>
                  <p className="text-3xl font-bold neural-text">{stats.activeStaff}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-green-400">97% neural utilization</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="holographic-card neural-node float-animation" style={{ animationDelay: "1s" }}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl ai-glow">
                  <Inbox className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Quantum Referrals</p>
                  <p className="text-3xl font-bold neural-text">{stats.pendingReferrals}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 text-orange-400 mr-1" />
                  <span className="text-orange-400">Avg 2.3 hrs AI processing</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="holographic-card neural-node float-animation" style={{ animationDelay: "1.5s" }}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl ai-glow">
                  <DollarSign className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Neural Revenue</p>
                  <p className="text-3xl font-bold neural-text">${(stats.monthlyRevenue / 1000000).toFixed(1)}M</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-green-400">+8.5% AI optimization</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights & Quality Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="holographic-card">
            <CardHeader>
              <CardTitle className="flex items-center neural-text">
                <Brain className="h-5 w-5 mr-2 text-orange-400" />
                Neural Intelligence Matrix
              </CardTitle>
              <CardDescription className="ai-subtitle">
                Real-time AI insights and quantum recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <div
                    key={insight.id}
                    className="quantum-border p-4 rounded-lg neural-node"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={`glass-morphism ${getImpactColor(insight.impact)} border-current`}
                        >
                          {insight.impact.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="glass-morphism border-cyan-400/50 text-cyan-400">
                          {insight.confidence}% neural confidence
                        </Badge>
                      </div>
                      {insight.actionRequired && (
                        <Badge className="glass-morphism bg-red-500/20 text-red-400 border-red-400/50">
                          Action Required
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-300 mb-2">{insight.description}</p>
                    <p className="text-sm text-cyan-400 font-medium">{insight.recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="holographic-card">
            <CardHeader>
              <CardTitle className="flex items-center neural-text">
                <Shield className="h-5 w-5 mr-2 text-green-400" />
                Quantum Quality Matrix
              </CardTitle>
              <CardDescription className="ai-subtitle">Real-time quality metrics and neural compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Neural Quality Score</span>
                    <span className="text-sm font-bold text-green-400">{stats.qualityScore}%</span>
                  </div>
                  <Progress
                    value={stats.qualityScore}
                    className="h-3 bg-gray-800 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">AI Compliance Rate</span>
                    <span className="text-sm font-bold text-cyan-400">{stats.complianceRate}%</span>
                  </div>
                  <Progress
                    value={stats.complianceRate}
                    className="h-3 bg-gray-800 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-blue-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 quantum-border rounded-lg neural-node">
                    <div className="text-3xl font-bold neural-text">{stats.aiInsights}</div>
                    <div className="text-xs text-cyan-400">Neural Insights</div>
                  </div>
                  <div className="text-center p-4 quantum-border rounded-lg neural-node">
                    <div className="text-3xl font-bold neural-text">{stats.automatedTasks}</div>
                    <div className="text-xs text-green-400">Quantum Tasks</div>
                  </div>
                </div>

                <NextLink href="/comprehensive-qa">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-cyan-500 hover:from-orange-600 hover:to-cyan-600 text-white font-semibold ai-glow">
                    <FileText className="h-4 w-4 mr-2" />
                    Launch Neural Chart QA
                  </Button>
                </NextLink>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="holographic-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center neural-text">
              <Zap className="h-5 w-5 mr-2 text-orange-400" />
              Neural Command Center
            </CardTitle>
            <CardDescription className="ai-subtitle">Quantum-powered tools and AI workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                { href: "/referral-management", icon: Users, label: "Referrals", color: "from-blue-500 to-cyan-500" },
                {
                  href: "/patient-tracking",
                  icon: Stethoscope,
                  label: "Patients",
                  color: "from-green-500 to-emerald-500",
                },
                { href: "/staff-dashboard", icon: UserCheck, label: "Staff", color: "from-purple-500 to-pink-500" },
                { href: "/comprehensive-qa", icon: FileText, label: "Neural QA", color: "from-orange-500 to-red-500" },
                { href: "/billing-center", icon: CreditCard, label: "Billing", color: "from-yellow-500 to-orange-500" },
                { href: "/analytics", icon: BarChart3, label: "Analytics", color: "from-indigo-500 to-purple-500" },
                { href: "/integrations", icon: Database, label: "Integrations", color: "from-teal-500 to-cyan-500" },
                { href: "/workflows", icon: Workflow, label: "Workflows", color: "from-rose-500 to-pink-500" },
              ].map((action, index) => (
                <NextLink key={action.href} href={action.href}>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 quantum-border hover:scale-105 transition-all duration-300 neural-node bg-transparent"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} bg-opacity-20`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs text-gray-300">{action.label}</span>
                  </Button>
                </NextLink>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & AI Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-purple-600" />
                  Recent Activity
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`p-2 rounded-full ${getPriorityColor(activity.priority)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                        <Badge className={getStatusColor(activity.status)} variant="outline">
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                AI-Powered Features
              </CardTitle>
              <CardDescription>Intelligent automation and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <NextLink href="/predictive-analytics">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Predictive Analytics</h4>
                        <p className="text-sm text-gray-600">Forecast patient outcomes and resource needs</p>
                      </div>
                    </div>
                  </div>
                </NextLink>

                <NextLink href="/comprehensive-qa">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer border-blue-200 bg-blue-50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900">Complete Chart QA</h4>
                        <p className="text-sm text-blue-700">Comprehensive patient chart quality assurance</p>
                        <Badge className="mt-1 bg-blue-200 text-blue-800 text-xs">NEW</Badge>
                      </div>
                    </div>
                  </div>
                </NextLink>

                <NextLink href="/automated-outreach">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Automated Outreach</h4>
                        <p className="text-sm text-gray-600">Intelligent patient and facility communication</p>
                      </div>
                    </div>
                  </div>
                </NextLink>

                <NextLink href="/ai-competency">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded">
                        <Brain className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">AI Competency Reviews</h4>
                        <p className="text-sm text-gray-600">Automated staff performance evaluation</p>
                      </div>
                    </div>
                  </div>
                </NextLink>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <NextLink href="/financial-dashboard" className="text-center p-3 hover:bg-gray-50 rounded">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">Financial Dashboard</p>
              </NextLink>
              <NextLink
                href="/comprehensive-qa"
                className="text-center p-3 hover:bg-blue-50 rounded border border-blue-200"
              >
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium text-blue-600">Complete Chart QA</p>
              </NextLink>
              <NextLink href="/marketing-dashboard" className="text-center p-3 hover:bg-gray-50 rounded">
                <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium">Marketing</p>
              </NextLink>
              <NextLink href="/integrations" className="text-center p-3 hover:bg-gray-50 rounded">
                <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Integrations</p>
              </NextLink>
              <NextLink href="/survey-ready" className="text-center p-3 hover:bg-gray-50 rounded">
                <Clipboard className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-medium">Survey Ready</p>
              </NextLink>
              <NextLink href="/mobile-billing" className="text-center p-3 hover:bg-gray-50 rounded">
                <Smartphone className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                <p className="text-sm font-medium">Mobile Billing</p>
              </NextLink>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add your AI Voice Assistant here */}
      <ClientAIVoiceAssistant />
    </div>
  )
}
