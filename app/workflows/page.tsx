"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Play,
  Pause,
  Settings,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  FileText,
} from "lucide-react"
import Link from "next/link"

export default function WorkflowAutomation() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null)

  const workflows = [
    {
      id: "WF-001",
      name: "New Employee Onboarding",
      description: "Automated workflow for new hire documentation and training",
      status: "active",
      trigger: "Application Approved",
      steps: 8,
      completionRate: 94,
      lastRun: "2024-01-15",
      category: "onboarding",
    },
    {
      id: "WF-002",
      name: "Document Expiration Alerts",
      description: "Notify staff and HR when licenses and certifications expire",
      status: "active",
      trigger: "30 days before expiration",
      steps: 4,
      completionRate: 98,
      lastRun: "2024-01-14",
      category: "compliance",
    },
    {
      id: "WF-003",
      name: "Performance Review Cycle",
      description: "Automated scheduling and reminders for annual reviews",
      status: "paused",
      trigger: "Annual review date",
      steps: 6,
      completionRate: 87,
      lastRun: "2024-01-10",
      category: "evaluation",
    },
    {
      id: "WF-004",
      name: "Training Assignment",
      description: "Automatically assign required training based on role",
      status: "active",
      trigger: "Role assignment",
      steps: 5,
      completionRate: 91,
      lastRun: "2024-01-13",
      category: "training",
    },
  ]

  const workflowTemplates = [
    {
      id: "TEMP-001",
      name: "Employee Onboarding",
      description: "Complete onboarding process for new hires",
      category: "HR",
      steps: [
        "Send welcome email",
        "Create employee file",
        "Assign training modules",
        "Schedule orientation",
        "Setup system access",
      ],
    },
    {
      id: "TEMP-002",
      name: "Document Review",
      description: "Automated document verification process",
      category: "Compliance",
      steps: ["Document uploaded", "Initial review", "Verification check", "Approval/rejection", "Notification sent"],
    },
    {
      id: "TEMP-003",
      name: "Leave Request Processing",
      description: "Streamlined leave request approval workflow",
      category: "HR",
      steps: [
        "Request submitted",
        "Manager notification",
        "Approval/denial",
        "Calendar update",
        "Employee notification",
      ],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "onboarding":
        return <Users className="h-4 w-4" />
      case "compliance":
        return <FileText className="h-4 w-4" />
      case "evaluation":
        return <CheckCircle className="h-4 w-4" />
      case "training":
        return <Play className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Workflow Automation</h1>
                <p className="text-gray-600">Automate HR processes and improve efficiency</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="workflows" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-6">
            {/* Workflow Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Play className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-gray-600 text-sm">Active Workflows</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">847</p>
                      <p className="text-gray-600 text-sm">Tasks Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">23</p>
                      <p className="text-gray-600 text-sm">Pending Tasks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-gray-600 text-sm">Failed Tasks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workflows List */}
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getCategoryIcon(workflow.category)}
                        </div>
                        <div>
                          <h3 className="font-medium">{workflow.name}</h3>
                          <p className="text-sm text-gray-600">{workflow.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>Trigger: {workflow.trigger}</span>
                            <span>Steps: {workflow.steps}</span>
                            <span>Last run: {workflow.lastRun}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{workflow.completionRate}%</p>
                          <p className="text-xs text-gray-500">Success rate</p>
                        </div>
                        <Badge className={getStatusColor(workflow.status)}>{workflow.status}</Badge>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            {workflow.status === "active" ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSelectedWorkflow(workflow)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {/* Workflow Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Templates</CardTitle>
                <CardDescription>Pre-built workflows for common HR processes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workflowTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline">{template.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{template.description}</p>
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-2">Steps:</p>
                            <div className="space-y-1">
                              {template.steps.slice(0, 3).map((step, index) => (
                                <div key={index} className="flex items-center text-xs text-gray-600">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                                  {step}
                                </div>
                              ))}
                              {template.steps.length > 3 && (
                                <div className="text-xs text-gray-500">+{template.steps.length - 3} more steps</div>
                              )}
                            </div>
                          </div>
                          <Button size="sm" className="w-full">
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            {/* Workflow Builder */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Builder</CardTitle>
                <CardDescription>Create custom workflows for your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workflow-name">Workflow Name</Label>
                    <Input id="workflow-name" placeholder="Enter workflow name" />
                  </div>
                  <div>
                    <Label htmlFor="workflow-category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="evaluation">Evaluation</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="hr">HR Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="workflow-description">Description</Label>
                  <Textarea id="workflow-description" placeholder="Describe what this workflow does..." />
                </div>

                <div>
                  <Label htmlFor="workflow-trigger">Trigger Event</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="application-approved">Application Approved</SelectItem>
                      <SelectItem value="document-uploaded">Document Uploaded</SelectItem>
                      <SelectItem value="training-completed">Training Completed</SelectItem>
                      <SelectItem value="evaluation-due">Evaluation Due</SelectItem>
                      <SelectItem value="license-expiring">License Expiring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Workflow Steps Builder */}
                <div>
                  <Label className="text-base font-medium">Workflow Steps</Label>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        1
                      </div>
                      <div className="flex-1">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="send-email">Send Email</SelectItem>
                            <SelectItem value="create-task">Create Task</SelectItem>
                            <SelectItem value="assign-training">Assign Training</SelectItem>
                            <SelectItem value="schedule-meeting">Schedule Meeting</SelectItem>
                            <SelectItem value="update-status">Update Status</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        2
                      </div>
                      <div className="flex-1">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="send-email">Send Email</SelectItem>
                            <SelectItem value="create-task">Create Task</SelectItem>
                            <SelectItem value="assign-training">Assign Training</SelectItem>
                            <SelectItem value="schedule-meeting">Schedule Meeting</SelectItem>
                            <SelectItem value="update-status">Update Status</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>

                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </div>
                </div>

                {/* Workflow Settings */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-medium">Workflow Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-start">Auto-start workflow</Label>
                        <p className="text-sm text-gray-600">Automatically start when trigger occurs</p>
                      </div>
                      <Switch id="auto-start" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="send-notifications">Send notifications</Label>
                        <p className="text-sm text-gray-600">Notify users of workflow progress</p>
                      </div>
                      <Switch id="send-notifications" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline">Save as Draft</Button>
                  <Button>Create Workflow</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Workflow Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Performance</CardTitle>
                  <CardDescription>Success rates and completion times</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflows.map((workflow) => (
                      <div key={workflow.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{workflow.name}</span>
                          <span>{workflow.completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${workflow.completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Distribution</CardTitle>
                  <CardDescription>Breakdown of automated tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { category: "Email Notifications", count: 234, color: "bg-blue-500" },
                      { category: "Document Processing", count: 189, color: "bg-green-500" },
                      { category: "Training Assignments", count: 156, color: "bg-purple-500" },
                      { category: "Status Updates", count: 123, color: "bg-orange-500" },
                      { category: "Reminders", count: 98, color: "bg-red-500" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-sm">{item.category}</span>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Time Savings */}
            <Card>
              <CardHeader>
                <CardTitle>Time Savings Analysis</CardTitle>
                <CardDescription>Estimated time saved through automation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">127</div>
                    <div className="text-sm text-gray-600">Hours Saved</div>
                    <div className="text-xs text-green-600">This month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">$3,200</div>
                    <div className="text-sm text-gray-600">Cost Savings</div>
                    <div className="text-xs text-blue-600">Estimated value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">94%</div>
                    <div className="text-sm text-gray-600">Efficiency Gain</div>
                    <div className="text-xs text-purple-600">vs manual process</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Workflow Detail Modal */}
        {selectedWorkflow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedWorkflow.name}</h2>
                    <p className="text-gray-600">{selectedWorkflow.description}</p>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedWorkflow(null)}>
                    ×
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Workflow Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <p className="text-sm">{selectedWorkflow.status}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Trigger</Label>
                    <p className="text-sm">{selectedWorkflow.trigger}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Steps</Label>
                    <p className="text-sm">{selectedWorkflow.steps}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Success Rate</Label>
                    <p className="text-sm">{selectedWorkflow.completionRate}%</p>
                  </div>
                </div>

                {/* Recent Executions */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Recent Executions</h3>
                  <div className="space-y-2">
                    {[
                      { date: "2024-01-15 10:30", status: "completed", duration: "2m 15s" },
                      { date: "2024-01-14 14:20", status: "completed", duration: "1m 45s" },
                      { date: "2024-01-13 09:15", status: "failed", duration: "0m 30s" },
                    ].map((execution, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{execution.date}</span>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={execution.status === "completed" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {execution.status}
                          </Badge>
                          <span className="text-xs text-gray-500">{execution.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline">Edit Workflow</Button>
                  <Button variant="outline">View Logs</Button>
                  <Button>Run Now</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
