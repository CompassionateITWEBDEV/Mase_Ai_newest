"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Heart,
  Users,
  Calendar,
  Bell,
  Settings,
  Search,
  Menu,
  X,
  Home,
  FileText,
  BarChart3,
  Shield,
  DollarSign,
  Activity,
  Star,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Plus,
  RefreshCw,
  MoreHorizontal,
  UserPlus,
  CalendarIcon,
  GraduationCap,
  MessageSquare,
  Truck,
  CreditCard,
  Target,
  Globe,
  Crown,
} from "lucide-react"

export default function EnhancedDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeModule, setActiveModule] = useState("dashboard")
  const [notifications, setNotifications] = useState(12)

  const dashboardModules = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      badge: null,
      plan: "starter",
    },
    {
      id: "staff",
      name: "Staff Management",
      icon: <Users className="h-5 w-5" />,
      badge: null,
      plan: "starter",
    },
    {
      id: "scheduling",
      name: "Scheduling",
      icon: <CalendarIcon className="h-5 w-5" />,
      badge: "3",
      plan: "starter",
    },
    {
      id: "applications",
      name: "Applications",
      icon: <FileText className="h-5 w-5" />,
      badge: "7",
      plan: "starter",
    },
    {
      id: "training",
      name: "Training & Certification",
      icon: <GraduationCap className="h-5 w-5" />,
      badge: null,
      plan: "starter",
    },
    {
      id: "communications",
      name: "Communications",
      icon: <MessageSquare className="h-5 w-5" />,
      badge: "2",
      plan: "starter",
    },
    {
      id: "analytics",
      name: "Analytics & Reports",
      icon: <BarChart3 className="h-5 w-5" />,
      badge: null,
      plan: "professional",
      premium: true,
    },
    {
      id: "quality",
      name: "Quality Assurance",
      icon: <Shield className="h-5 w-5" />,
      badge: null,
      plan: "professional",
      premium: true,
    },
    {
      id: "financial",
      name: "Financial Dashboard",
      icon: <DollarSign className="h-5 w-5" />,
      badge: null,
      plan: "professional",
      premium: true,
    },
    {
      id: "supplies",
      name: "Supply Management",
      icon: <Truck className="h-5 w-5" />,
      badge: null,
      plan: "professional",
      premium: true,
    },
    {
      id: "billing",
      name: "Advanced Billing",
      icon: <CreditCard className="h-5 w-5" />,
      badge: null,
      plan: "enterprise",
      premium: true,
    },
    {
      id: "predictive",
      name: "Predictive Analytics",
      icon: <Target className="h-5 w-5" />,
      badge: null,
      plan: "enterprise",
      premium: true,
    },
    {
      id: "integrations",
      name: "Integrations",
      icon: <Globe className="h-5 w-5" />,
      badge: null,
      plan: "enterprise",
      premium: true,
    },
    {
      id: "admin",
      name: "Admin Panel",
      icon: <Settings className="h-5 w-5" />,
      badge: null,
      plan: "enterprise",
      premium: true,
    },
  ]

  const quickStats = [
    {
      title: "Active Staff",
      value: "247",
      change: "+12%",
      trend: "up",
      icon: <Users className="h-6 w-6 text-blue-600" />,
    },
    {
      title: "Scheduled Visits",
      value: "1,429",
      change: "+8%",
      trend: "up",
      icon: <Calendar className="h-6 w-6 text-green-600" />,
    },
    {
      title: "Patient Satisfaction",
      value: "94.2%",
      change: "+2.1%",
      trend: "up",
      icon: <Star className="h-6 w-6 text-yellow-600" />,
    },
    {
      title: "Revenue",
      value: "$847K",
      change: "+15%",
      trend: "up",
      icon: <DollarSign className="h-6 w-6 text-purple-600" />,
    },
  ]

  const recentActivities = [
    {
      id: 1,
      type: "staff",
      message: "New nurse Sarah Johnson completed onboarding",
      time: "2 hours ago",
      icon: <UserPlus className="h-4 w-4 text-green-600" />,
    },
    {
      id: 2,
      type: "alert",
      message: "Quality assurance review required for Patient #1247",
      time: "4 hours ago",
      icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
    },
    {
      id: 3,
      type: "success",
      message: "Monthly compliance report submitted successfully",
      time: "6 hours ago",
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
    },
    {
      id: 4,
      type: "billing",
      message: "Invoice #INV-2024-0156 processed - $12,450",
      time: "8 hours ago",
      icon: <DollarSign className="h-4 w-4 text-blue-600" />,
    },
  ]

  const upcomingTasks = [
    {
      id: 1,
      title: "Staff Performance Reviews",
      dueDate: "Due Tomorrow",
      priority: "high",
      assignee: "HR Team",
    },
    {
      id: 2,
      title: "Monthly Quality Audit",
      dueDate: "Due in 3 days",
      priority: "medium",
      assignee: "Quality Team",
    },
    {
      id: 3,
      title: "Training Session: HIPAA Updates",
      dueDate: "Due in 1 week",
      priority: "low",
      assignee: "Training Dept",
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-80" : "w-16"} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">HealthStaff Pro</h1>
                  <p className="text-xs text-gray-500">Healthcare Intelligence</p>
                </div>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* User Profile */}
        {sidebarOpen && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/professional-woman-diverse.png" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">Sarah Johnson</p>
                <p className="text-sm text-gray-500 truncate">Administrator</p>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <Crown className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {dashboardModules.map((module) => (
              <Button
                key={module.id}
                variant={activeModule === module.id ? "secondary" : "ghost"}
                className={`w-full justify-start h-10 ${
                  !sidebarOpen ? "px-2" : "px-3"
                } ${module.premium ? "relative" : ""}`}
                onClick={() => setActiveModule(module.id)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="flex-shrink-0">{module.icon}</div>
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left truncate">{module.name}</span>
                      <div className="flex items-center space-x-1">
                        {module.premium && <Crown className="h-3 w-3 text-yellow-500" />}
                        {module.badge && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {module.badge}
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Subscription Status */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900 text-sm">Professional Plan</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-blue-700">
                    <span>Users: 25/200</span>
                    <span>12.5%</span>
                  </div>
                  <Progress value={12.5} className="h-1" />
                </div>
                <Button size="sm" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-xs">
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                <Activity className="h-3 w-3 mr-1" />
                All Systems Operational
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                    {notifications}
                  </Badge>
                )}
              </Button>

              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="h-5 w-5" />
              </Button>

              {/* Profile */}
              <Avatar className="h-8 w-8">
                <AvatarImage src="/professional-woman-diverse.png" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickStats.map((stat, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className={`text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                          {stat.change} from last month
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-full">{stat.icon}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activities */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Activities</CardTitle>
                    <Button variant="ghost" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                        <div className="flex-shrink-0 p-2 bg-white rounded-full border">{activity.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" className="w-full bg-transparent">
                      View All Activities
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <CardDescription>Items requiring your attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingTasks.map((task) => (
                      <div key={task.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <Badge
                            variant={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{task.dueDate}</p>
                        <p className="text-xs text-gray-600">Assigned to: {task.assignee}</p>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used tools and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[
                    { name: "Add Staff", icon: <UserPlus className="h-5 w-5" />, color: "blue" },
                    { name: "Schedule Visit", icon: <Calendar className="h-5 w-5" />, color: "green" },
                    { name: "Generate Report", icon: <FileText className="h-5 w-5" />, color: "purple" },
                    { name: "Send Message", icon: <MessageSquare className="h-5 w-5" />, color: "orange" },
                    { name: "View Analytics", icon: <BarChart3 className="h-5 w-5" />, color: "red" },
                    { name: "Manage Billing", icon: <CreditCard className="h-5 w-5" />, color: "indigo" },
                  ].map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-20 flex-col space-y-2 hover:shadow-md transition-shadow bg-transparent"
                    >
                      <div className={`p-2 rounded-full bg-${action.color}-100`}>{action.icon}</div>
                      <span className="text-xs">{action.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
