"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  Star,
  TrendingUp,
  User,
  AlertTriangle,
} from "lucide-react"

export function PersonalizedDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")

  const personalMetrics = {
    tasksCompleted: 12,
    interviewsConducted: 8,
    completionRate: 95,
    performanceRating: 4.8,
    applicationsReviewed: 23,
    documentsVerified: 15,
  }

  const myTasks = [
    {
      id: 1,
      title: "Review Sarah Johnson's Application",
      dueDate: "Today",
      priority: "high",
      type: "application",
    },
    {
      id: 2,
      title: "Conduct Training Session - HIPAA",
      dueDate: "Tomorrow",
      priority: "medium",
      type: "training",
    },
    {
      id: 3,
      title: "Update Policy Documents",
      dueDate: "Next Week",
      priority: "low",
      type: "documentation",
    },
    {
      id: 4,
      title: "Performance Review - Michael Chen",
      dueDate: "Friday",
      priority: "medium",
      type: "evaluation",
    },
  ]

  const mySchedule = [
    {
      id: 1,
      title: "Interview - Michael Chen",
      time: "Today, 2:00 PM",
      type: "interview",
      color: "bg-blue-500",
    },
    {
      id: 2,
      title: "Team Meeting",
      time: "Tomorrow, 10:00 AM",
      type: "meeting",
      color: "bg-green-500",
    },
    {
      id: 3,
      title: "Training Workshop",
      time: "Friday, 1:00 PM",
      type: "training",
      color: "bg-purple-500",
    },
    {
      id: 4,
      title: "Document Review Session",
      time: "Monday, 9:00 AM",
      type: "review",
      color: "bg-orange-500",
    },
  ]

  const recentAchievements = [
    {
      id: 1,
      title: "Perfect Attendance",
      description: "No missed days this month",
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      id: 2,
      title: "Top Performer",
      description: "Highest application review rate",
      icon: Star,
      color: "text-yellow-500",
    },
    {
      id: 3,
      title: "Training Expert",
      description: "Completed advanced HR certification",
      icon: FileText,
      color: "text-blue-500",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 border-red-200"
      case "medium":
        return "bg-yellow-50 border-yellow-200"
      case "low":
        return "bg-green-50 border-green-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      {/* Personal Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{personalMetrics.tasksCompleted}</div>
            <div className="text-sm text-gray-600">Tasks Completed</div>
            <div className="text-xs text-gray-500">This week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{personalMetrics.interviewsConducted}</div>
            <div className="text-sm text-gray-600">Interviews Conducted</div>
            <div className="text-xs text-gray-500">This month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{personalMetrics.completionRate}%</div>
            <div className="text-sm text-gray-600">Task Completion Rate</div>
            <div className="text-xs text-gray-500">Last 30 days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{personalMetrics.performanceRating}</div>
            <div className="text-sm text-gray-600">Performance Rating</div>
            <div className="text-xs text-gray-500">Current quarter</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Personal Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              My Tasks
            </CardTitle>
            <CardDescription>Items assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 border rounded ${getPriorityColor(task.priority)}`}
                >
                  <div>
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-gray-600">Due: {task.dueDate}</p>
                  </div>
                  <Badge variant={getPriorityBadge(task.priority) as any}>{task.priority}</Badge>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4 bg-transparent" variant="outline">
              View All Tasks
            </Button>
          </CardContent>
        </Card>

        {/* My Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              My Schedule
            </CardTitle>
            <CardDescription>Upcoming appointments and meetings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mySchedule.map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-3 border rounded">
                  <div className={`w-2 h-8 ${event.color} rounded`}></div>
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-gray-600">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4 bg-transparent" variant="outline">
              View Full Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Weekly Progress
            </CardTitle>
            <CardDescription>Your performance this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Applications Reviewed</span>
                  <span>{personalMetrics.applicationsReviewed}/25</span>
                </div>
                <Progress value={(personalMetrics.applicationsReviewed / 25) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Documents Verified</span>
                  <span>{personalMetrics.documentsVerified}/20</span>
                </div>
                <Progress value={(personalMetrics.documentsVerified / 20) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Training Sessions</span>
                  <span>3/4</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <achievement.icon className={`h-5 w-5 ${achievement.color}`} />
                  <div>
                    <p className="font-medium text-sm">{achievement.title}</p>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Create New Report
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <User className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals and Objectives */}
      <Card>
        <CardHeader>
          <CardTitle>Goals & Objectives</CardTitle>
          <CardDescription>Track your professional development goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Current Quarter Goals</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Complete HR Certification</span>
                    <span>80%</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Process 100 Applications</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Conduct 20 Interviews</span>
                    <span>40%</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Professional Development</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Advanced Excel Training - Completed</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span>Leadership Workshop - In Progress</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>Compliance Training - Overdue</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
