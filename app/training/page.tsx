"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Play, CheckCircle, Clock, Award } from "lucide-react"
import Link from "next/link"
import { Video, Users, Target, Trophy } from "lucide-react"

export default function TrainingCenter() {
  const [selectedRole, setSelectedRole] = useState("RN")

  const roles = [
    { id: "RN", name: "Registered Nurse", color: "bg-blue-500" },
    { id: "PT", name: "Physical Therapist", color: "bg-green-500" },
    { id: "ST", name: "Speech Therapist", color: "bg-purple-500" },
    { id: "HHA", name: "Home Health Aide", color: "bg-orange-500" },
    { id: "MSW", name: "Master of Social Work", color: "bg-red-500" },
    { id: "OT", name: "Occupational Therapist", color: "bg-indigo-500" },
  ]

  const trainingModules = {
    RN: [
      {
        id: 1,
        title: "HIPAA Privacy and Security",
        description: "Understanding patient privacy rights and security requirements",
        duration: "45 minutes",
        status: "completed",
        progress: 100,
        required: true,
        dueDate: "2024-01-15",
      },
      {
        id: 2,
        title: "Medication Administration",
        description: "Safe medication practices and documentation",
        duration: "60 minutes",
        status: "in-progress",
        progress: 65,
        required: true,
        dueDate: "2024-01-20",
      },
      {
        id: 3,
        title: "Infection Control",
        description: "Standard precautions and infection prevention",
        duration: "30 minutes",
        status: "not-started",
        progress: 0,
        required: true,
        dueDate: "2024-01-25",
      },
      {
        id: 4,
        title: "Emergency Procedures",
        description: "Emergency response and CPR protocols",
        duration: "90 minutes",
        status: "not-started",
        progress: 0,
        required: true,
        dueDate: "2024-02-01",
      },
      {
        id: 5,
        title: "Documentation Standards",
        description: "Proper documentation and record keeping",
        duration: "40 minutes",
        status: "not-started",
        progress: 0,
        required: false,
        dueDate: "2024-02-10",
      },
    ],
    PT: [
      {
        id: 1,
        title: "HIPAA Privacy and Security",
        description: "Understanding patient privacy rights and security requirements",
        duration: "45 minutes",
        status: "completed",
        progress: 100,
        required: true,
        dueDate: "2024-01-15",
      },
      {
        id: 2,
        title: "Physical Therapy Assessment",
        description: "Comprehensive patient assessment techniques",
        duration: "75 minutes",
        status: "in-progress",
        progress: 40,
        required: true,
        dueDate: "2024-01-22",
      },
      {
        id: 3,
        title: "Therapeutic Exercise",
        description: "Exercise prescription and progression",
        duration: "60 minutes",
        status: "not-started",
        progress: 0,
        required: true,
        dueDate: "2024-01-28",
      },
      {
        id: 4,
        title: "Manual Therapy Techniques",
        description: "Hands-on treatment approaches",
        duration: "90 minutes",
        status: "not-started",
        progress: 0,
        required: true,
        dueDate: "2024-02-05",
      },
    ],
    HHA: [
      {
        id: 1,
        title: "HIPAA Privacy and Security",
        description: "Understanding patient privacy rights and security requirements",
        duration: "45 minutes",
        status: "completed",
        progress: 100,
        required: true,
        dueDate: "2024-01-15",
      },
      {
        id: 2,
        title: "Personal Care Skills",
        description: "Bathing, grooming, and personal hygiene assistance",
        duration: "50 minutes",
        status: "completed",
        progress: 100,
        required: true,
        dueDate: "2024-01-18",
      },
      {
        id: 3,
        title: "Vital Signs Monitoring",
        description: "Taking and recording vital signs",
        duration: "35 minutes",
        status: "in-progress",
        progress: 80,
        required: true,
        dueDate: "2024-01-25",
      },
      {
        id: 4,
        title: "Communication Skills",
        description: "Effective communication with patients and families",
        duration: "40 minutes",
        status: "not-started",
        progress: 0,
        required: true,
        dueDate: "2024-02-01",
      },
    ],
  }

  const interactiveModules = {
    RN: [
      {
        id: 1,
        title: "Interactive HIPAA Simulation",
        type: "simulation",
        duration: "30 minutes",
        description: "Practice HIPAA scenarios in a virtual environment",
        completionRate: 95,
        icon: Users,
      },
      {
        id: 2,
        title: "Medication Safety Video Series",
        type: "video",
        duration: "45 minutes",
        description: "Watch and learn proper medication administration",
        completionRate: 88,
        icon: Video,
      },
      {
        id: 3,
        title: "Competency Assessment Quiz",
        type: "assessment",
        duration: "20 minutes",
        description: "Test your knowledge with interactive questions",
        completionRate: 92,
        icon: Target,
      },
    ],
  }

  const learningPaths = [
    {
      id: "new-rn",
      title: "New RN Onboarding Path",
      description: "Complete learning path for new registered nurses",
      modules: 8,
      estimatedTime: "6 hours",
      completionRate: 78,
    },
    {
      id: "advanced-pt",
      title: "Advanced PT Techniques",
      description: "Advanced training for experienced physical therapists",
      modules: 5,
      estimatedTime: "4 hours",
      completionRate: 85,
    },
  ]

  const currentModules = trainingModules[selectedRole as keyof typeof trainingModules] || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "in-progress":
        return <Play className="h-5 w-5 text-blue-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      default:
        return <Badge variant="secondary">Not Started</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Training Center</h1>
              <p className="text-gray-600">In-Service Education and Training</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="training" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="training">Training Modules</TabsTrigger>
            <TabsTrigger value="interactive">Interactive Learning</TabsTrigger>
            <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="training" className="space-y-6">
            {/* Role Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Staff Role</CardTitle>
                <CardDescription>Choose a role to view specific training requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {roles.map((role) => (
                    <Button
                      key={role.id}
                      variant={selectedRole === role.id ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <div className={`w-8 h-8 rounded-full ${role.color}`}></div>
                      <div className="text-center">
                        <div className="font-medium text-sm">{role.id}</div>
                        <div className="text-xs text-gray-500">{role.name}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Training Modules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentModules.map((module) => (
                <Card key={module.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(module.status)}
                        <div>
                          <CardTitle className="text-lg">{module.title}</CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                        </div>
                      </div>
                      {module.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {module.duration}
                      </span>
                      <span>Due: {module.dueDate}</span>
                    </div>

                    {module.status !== "not-started" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {getStatusBadge(module.status)}
                      <Button size="sm" variant={module.status === "completed" ? "outline" : "default"}>
                        {module.status === "completed"
                          ? "Review"
                          : module.status === "in-progress"
                            ? "Continue"
                            : "Start"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="interactive" className="space-y-6">
            {/* Learning Paths */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Paths</CardTitle>
                <CardDescription>Structured learning sequences for different roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {learningPaths.map((path) => (
                    <div key={path.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{path.title}</h3>
                        <Badge className="bg-purple-100 text-purple-800">{path.completionRate}% avg</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{path.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span>{path.modules} modules</span>
                        <span>{path.estimatedTime}</span>
                      </div>
                      <Progress value={path.completionRate} className="h-2 mb-3" />
                      <Button size="sm" className="w-full">
                        Start Learning Path
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Interactive Modules */}
            <Card>
              <CardHeader>
                <CardTitle>Interactive Training Modules</CardTitle>
                <CardDescription>Engaging multimedia training experiences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {interactiveModules.RN?.map((module) => (
                    <div key={module.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <module.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{module.title}</h3>
                          <p className="text-sm text-gray-600">{module.type}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span>{module.duration}</span>
                        <span>{module.completionRate}% completion</span>
                      </div>
                      <Button size="sm" className="w-full">
                        Launch Module
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gamification Elements */}
            <Card>
              <CardHeader>
                <CardTitle>Training Achievements</CardTitle>
                <CardDescription>Earn badges and track your learning progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: "Quick Learner", description: "Complete 5 modules in one day", earned: true },
                    { name: "Safety Expert", description: "Perfect score on safety training", earned: true },
                    { name: "Team Player", description: "Help 3 colleagues with training", earned: false },
                    { name: "Master Trainer", description: "Complete all advanced modules", earned: false },
                  ].map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-4 text-center border rounded-lg ${
                        achievement.earned ? "bg-yellow-50 border-yellow-200" : "bg-gray-50"
                      }`}
                    >
                      <Trophy
                        className={`h-8 w-8 mx-auto mb-2 ${achievement.earned ? "text-yellow-500" : "text-gray-400"}`}
                      />
                      <h4 className="font-medium text-sm">{achievement.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                      {achievement.earned && <Badge className="mt-2 bg-yellow-100 text-yellow-800">Earned</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overall Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Training Progress</CardTitle>
                  <CardDescription>Your completion status across all roles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {roles.map((role) => {
                    const modules = trainingModules[role.id as keyof typeof trainingModules] || []
                    const completed = modules.filter((m) => m.status === "completed").length
                    const total = modules.length
                    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

                    return (
                      <div key={role.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{role.name}</span>
                          <span>
                            {completed}/{total} modules
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                  <CardDescription>Training modules due soon</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.values(trainingModules)
                      .flat()
                      .filter((m) => m.status !== "completed")
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .slice(0, 5)
                      .map((module) => (
                        <div
                          key={`${module.id}-deadline`}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{module.title}</p>
                            <p className="text-xs text-gray-600">Due: {module.dueDate}</p>
                          </div>
                          <Badge
                            variant={
                              new Date(module.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {Math.ceil((new Date(module.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Completed Certificates */}
              {Object.values(trainingModules)
                .flat()
                .filter((m) => m.status === "completed")
                .map((module) => (
                  <Card key={`${module.id}-cert`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Award className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                      <h3 className="font-semibold mb-2">{module.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">Completed on {module.dueDate}</p>
                      <Button variant="outline" size="sm">
                        Download Certificate
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
