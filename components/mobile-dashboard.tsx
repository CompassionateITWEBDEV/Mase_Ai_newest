"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, Calendar, MessageSquare, Bell, Menu, X, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

export function MobileDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const quickStats = [
    { label: "Applications", value: "23", color: "text-blue-600" },
    { label: "Pending", value: "8", color: "text-yellow-600" },
    { label: "Completed", value: "15", color: "text-green-600" },
    { label: "Alerts", value: "3", color: "text-red-600" },
  ]

  const recentActivity = [
    {
      id: 1,
      title: "New Application",
      description: "Sarah Johnson - RN",
      time: "2h ago",
      icon: Users,
      color: "text-blue-500",
    },
    {
      id: 2,
      title: "Document Verified",
      description: "Michael Chen - License",
      time: "4h ago",
      icon: FileText,
      color: "text-green-500",
    },
    {
      id: 3,
      title: "Interview Scheduled",
      description: "Emily Davis - OT",
      time: "6h ago",
      icon: Calendar,
      color: "text-purple-500",
    },
  ]

  const quickActions = [
    { title: "Applications", href: "/applications", icon: Users, color: "bg-blue-500" },
    { title: "Documents", href: "/documents", icon: FileText, color: "bg-green-500" },
    { title: "Training", href: "/training", icon: Calendar, color: "bg-purple-500" },
    { title: "Messages", href: "/messages", icon: MessageSquare, color: "bg-orange-500" },
  ]

  const alerts = [
    {
      id: 1,
      title: "License Expiring",
      description: "3 licenses expire this month",
      priority: "high",
      icon: AlertTriangle,
    },
    {
      id: 2,
      title: "Training Due",
      description: "HIPAA training for 5 staff",
      priority: "medium",
      icon: Clock,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">M.A.S.E</h1>
              <p className="text-xs text-gray-600">Medical Administrative Staffing Excellence</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t bg-white">
            <div className="px-4 py-2 space-y-1">
              <Link href="/applications">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Applications
                </Button>
              </Link>
              <Link href="/documents">
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </Button>
              </Link>
              <Link href="/training">
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Training
                </Button>
              </Link>
              <Link href="/complaints">
                <Button variant="ghost" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  HR Complaints
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          {quickStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-3 text-center">
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                <alert.icon className="h-4 w-4 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-gray-600">{alert.description}</p>
                </div>
                <Badge variant={alert.priority === "high" ? "destructive" : "default"} className="text-xs">
                  {alert.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-2`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium">{action.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <activity.icon className={`h-4 w-4 ${activity.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-gray-600">{activity.description}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3 p-2 border rounded">
              <div className="w-2 h-8 bg-blue-500 rounded"></div>
              <div>
                <p className="text-sm font-medium">Interview - Michael Chen</p>
                <p className="text-xs text-gray-600">2:00 PM</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 border rounded">
              <div className="w-2 h-8 bg-green-500 rounded"></div>
              <div>
                <p className="text-sm font-medium">Team Meeting</p>
                <p className="text-xs text-gray-600">4:00 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
