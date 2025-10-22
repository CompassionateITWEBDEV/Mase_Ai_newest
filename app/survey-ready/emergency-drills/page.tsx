"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Users,
  Phone,
  Shield,
  FileText,
  Play,
  Download,
  Edit,
  MapPin,
} from "lucide-react"
import Link from "next/link"

export default function EmergencyDrillsManagement() {
  const [selectedDrill, setSelectedDrill] = useState<any>(null)
  const [isSchedulingDrill, setIsSchedulingDrill] = useState(false)

  const emergencyData = {
    nextDrillDue: "2024-03-15",
    daysUntilDue: 28,
    drillsCompleted: 4,
    drillsRequired: 4,
    staffTrained: 98,
    totalStaff: 156,
    lastDrillDate: "2023-12-15",
    complianceRate: 100,
    drillTypes: [
      { type: "Fire Evacuation", frequency: "Quarterly", lastCompleted: "2023-12-15", nextDue: "2024-03-15" },
      { type: "Severe Weather", frequency: "Bi-annually", lastCompleted: "2023-09-20", nextDue: "2024-03-20" },
      { type: "Medical Emergency", frequency: "Quarterly", lastCompleted: "2023-11-10", nextDue: "2024-02-10" },
      { type: "Security Threat", frequency: "Annually", lastCompleted: "2023-06-15", nextDue: "2024-06-15" },
    ],
    completedDrills: [
      {
        id: 1,
        type: "Fire Evacuation",
        date: "2023-12-15",
        time: "10:30 AM",
        duration: "8 minutes",
        participants: 45,
        coordinator: "Sarah Johnson, RN",
        status: "completed",
        score: 92,
        issues: 2,
        improvements: [
          "Evacuation time exceeded target by 1 minute",
          "Two staff members were not at designated assembly point",
        ],
        strengths: [
          "All patients safely evacuated",
          "Emergency equipment properly secured",
          "Clear communication maintained",
        ],
      },
      {
        id: 2,
        type: "Medical Emergency",
        date: "2023-11-10",
        time: "2:15 PM",
        duration: "12 minutes",
        participants: 38,
        coordinator: "Dr. Martinez",
        status: "completed",
        score: 88,
        issues: 3,
        improvements: [
          "Response time to emergency was 3 minutes (target: 2 minutes)",
          "Missing emergency medication from crash cart",
          "Communication with EMS could be improved",
        ],
        strengths: [
          "Excellent teamwork and coordination",
          "Proper patient stabilization techniques",
          "Family notification handled well",
        ],
      },
      {
        id: 3,
        type: "Severe Weather",
        date: "2023-09-20",
        time: "11:00 AM",
        duration: "15 minutes",
        participants: 52,
        coordinator: "Michael Chen, PT",
        status: "completed",
        score: 95,
        issues: 1,
        improvements: ["Need backup communication system during power outage"],
        strengths: [
          "All patients moved to safe areas quickly",
          "Emergency supplies readily available",
          "Staff remained calm and followed procedures",
          "Excellent coordination with local authorities",
        ],
      },
    ],
    upcomingDrills: [
      {
        id: 4,
        type: "Medical Emergency",
        scheduledDate: "2024-02-10",
        scheduledTime: "10:00 AM",
        coordinator: "Dr. Martinez",
        status: "scheduled",
        participants: 40,
        scenario: "Cardiac arrest in patient room",
      },
      {
        id: 5,
        type: "Fire Evacuation",
        scheduledDate: "2024-03-15",
        scheduledTime: "2:30 PM",
        coordinator: "Sarah Johnson, RN",
        status: "scheduled",
        participants: 48,
        scenario: "Kitchen fire with smoke in patient areas",
      },
    ],
    emergencyContacts: [
      { role: "Fire Department", number: "911", backup: "(248) 555-0100" },
      { role: "Police Department", number: "911", backup: "(248) 555-0200" },
      { role: "EMS/Ambulance", number: "911", backup: "(248) 555-0300" },
      { role: "Hospital", number: "(248) 555-0400", backup: "(248) 555-0401" },
      { role: "Poison Control", number: "1-800-222-1222", backup: "" },
      { role: "Utility Company", number: "(248) 555-0500", backup: "" },
    ],
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  const runMockDrill = async (drillId: number) => {
    // Simulate running a mock drill
    console.log(`Running mock drill ${drillId}`)
    // In a real implementation, this would start a drill simulation
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/survey-ready">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Survey Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Emergency Preparedness & Drills</h1>
                <p className="text-gray-600">Emergency response planning and drill management</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Emergency Contacts
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Drill
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="drills">Drill History</TabsTrigger>
            <TabsTrigger value="schedule">Schedule & Planning</TabsTrigger>
            <TabsTrigger value="contacts">Emergency Contacts</TabsTrigger>
            <TabsTrigger value="plans">Emergency Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Emergency Preparedness Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{emergencyData.daysUntilDue}</p>
                      <p className="text-gray-600 text-sm">Days Until Next Drill</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">
                        {emergencyData.drillsCompleted}/{emergencyData.drillsRequired}
                      </p>
                      <p className="text-gray-600 text-sm">Drills Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{emergencyData.staffTrained}%</p>
                      <p className="text-gray-600 text-sm">Staff Trained</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{emergencyData.complianceRate}%</p>
                      <p className="text-gray-600 text-sm">Compliance Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Drill Schedule Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Drill Schedule & Requirements</CardTitle>
                <CardDescription>Required emergency drills and their frequencies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emergencyData.drillTypes.map((drill, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{drill.type}</h3>
                          <p className="text-sm text-gray-600">Frequency: {drill.frequency}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Last: {drill.lastCompleted}</p>
                        <p className="text-sm text-gray-600">Next Due: {drill.nextDue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Drill Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Drill Performance</CardTitle>
                  <CardDescription>Latest drill results and scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {emergencyData.completedDrills.slice(0, 3).map((drill) => (
                      <div key={drill.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{drill.type}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-bold ${getScoreColor(drill.score)}`}>{drill.score}%</span>
                            <Badge className={getStatusColor(drill.status)}>{drill.status}</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <span>Date: {drill.date}</span>
                          <span>Duration: {drill.duration}</span>
                          <span>Participants: {drill.participants}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Drills</CardTitle>
                  <CardDescription>Scheduled emergency drills</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {emergencyData.upcomingDrills.map((drill) => (
                      <div key={drill.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{drill.type}</h4>
                          <Badge className={getStatusColor(drill.status)}>{drill.status}</Badge>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <p>
                            Date: {drill.scheduledDate} at {drill.scheduledTime}
                          </p>
                          <p>Coordinator: {drill.coordinator}</p>
                          <p>Expected Participants: {drill.participants}</p>
                          <p>Scenario: {drill.scenario}</p>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => runMockDrill(drill.id)}>
                            <Play className="h-3 w-3 mr-1" />
                            Run Mock
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="drills" className="space-y-6">
            {/* Drill History */}
            <Card>
              <CardHeader>
                <CardTitle>Drill History & Results</CardTitle>
                <CardDescription>Completed emergency drills and performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {emergencyData.completedDrills.map((drill) => (
                    <Card key={drill.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-lg">{drill.type} Drill</h3>
                            <p className="text-sm text-gray-600">
                              {drill.date} at {drill.time} • Duration: {drill.duration}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getScoreColor(drill.score)}`}>{drill.score}%</div>
                            <p className="text-sm text-gray-600">Overall Score</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Coordinator</p>
                            <p className="text-sm">{drill.coordinator}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Participants</p>
                            <p className="text-sm">{drill.participants} staff members</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Issues Identified</p>
                            <p className="text-sm">{drill.issues} items</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm text-red-700 mb-2">Areas for Improvement</h4>
                            <ul className="space-y-1">
                              {drill.improvements.map((improvement, index) => (
                                <li key={index} className="text-sm text-red-600 flex items-start">
                                  <AlertTriangle className="h-3 w-3 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {improvement}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-green-700 mb-2">Strengths</h4>
                            <ul className="space-y-1">
                              {drill.strengths.map((strength, index) => (
                                <li key={index} className="text-sm text-green-600 flex items-start">
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex space-x-2 mt-4 pt-4 border-t">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Full Report
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export Results
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            {/* Drill Scheduling */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Drill Scheduling & Planning</CardTitle>
                    <CardDescription>Schedule and manage emergency drills</CardDescription>
                  </div>
                  <Dialog open={isSchedulingDrill} onOpenChange={setIsSchedulingDrill}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule New Drill
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Schedule Emergency Drill</DialogTitle>
                        <DialogDescription>Plan and schedule a new emergency drill</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="drill-type">Drill Type</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select drill type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fire">Fire Evacuation</SelectItem>
                                <SelectItem value="medical">Medical Emergency</SelectItem>
                                <SelectItem value="weather">Severe Weather</SelectItem>
                                <SelectItem value="security">Security Threat</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="drill-coordinator">Coordinator</Label>
                            <Input id="drill-coordinator" placeholder="Staff member name" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="drill-date">Date</Label>
                            <Input type="date" id="drill-date" />
                          </div>
                          <div>
                            <Label htmlFor="drill-time">Time</Label>
                            <Input type="time" id="drill-time" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="drill-scenario">Scenario Description</Label>
                          <Textarea
                            id="drill-scenario"
                            placeholder="Describe the emergency scenario for the drill..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="expected-participants">Expected Participants</Label>
                          <Input type="number" id="expected-participants" placeholder="Number of staff" />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsSchedulingDrill(false)}>
                            Cancel
                          </Button>
                          <Button onClick={() => setIsSchedulingDrill(false)}>Schedule Drill</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Calendar View */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Upcoming Scheduled Drills</h4>
                      <div className="space-y-3">
                        {emergencyData.upcomingDrills.map((drill) => (
                          <div key={drill.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">{drill.type}</h5>
                              <Badge className={getStatusColor(drill.status)}>{drill.status}</Badge>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                {drill.scheduledDate} at {drill.scheduledTime}
                              </p>
                              <p className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                {drill.participants} expected participants
                              </p>
                              <p className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                Coordinator: {drill.coordinator}
                              </p>
                            </div>
                            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                              <strong>Scenario:</strong> {drill.scenario}
                            </div>
                            <div className="flex space-x-2 mt-3">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline">
                                <Play className="h-4 w-4 mr-2" />
                                Start Drill
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Drill Requirements Calendar</h4>
                      <div className="space-y-3">
                        {emergencyData.drillTypes.map((drill, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{drill.type}</span>
                              <span className="text-xs text-gray-500">{drill.frequency}</span>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>Last Completed:</span>
                                <span className="font-medium">{drill.lastCompleted}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Next Due:</span>
                                <span className="font-medium text-orange-600">{drill.nextDue}</span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress
                                value={Math.max(
                                  0,
                                  100 -
                                    Math.floor(
                                      (new Date(drill.nextDue).getTime() - new Date().getTime()) /
                                        (1000 * 60 * 60 * 24),
                                    ),
                                )}
                                className="h-1"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact Directory</CardTitle>
                <CardDescription>Essential emergency contact information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emergencyData.emergencyContacts.map((contact, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{contact.role}</h4>
                        <Phone className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Primary:</span>
                          <span className="text-sm font-medium">{contact.number}</span>
                        </div>
                        {contact.backup && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Backup:</span>
                            <span className="text-sm font-medium">{contact.backup}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Internal Emergency Team */}
            <Card>
              <CardHeader>
                <CardTitle>Internal Emergency Response Team</CardTitle>
                <CardDescription>Key staff members for emergency situations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      role: "Emergency Coordinator",
                      name: "Sarah Johnson, RN",
                      phone: "(248) 555-0123",
                      backup: "Michael Chen, PT",
                    },
                    { role: "Medical Director", name: "Dr. Martinez", phone: "(248) 555-0124", backup: "Dr. Wilson" },
                    {
                      role: "Safety Officer",
                      name: "Emily Davis, OT",
                      phone: "(248) 555-0125",
                      backup: "Robert Wilson",
                    },
                    {
                      role: "Communications Lead",
                      name: "Lisa Garcia, MSW",
                      phone: "(248) 555-0126",
                      backup: "Jennifer Adams",
                    },
                    {
                      role: "Facilities Manager",
                      name: "David Thompson",
                      phone: "(248) 555-0127",
                      backup: "Mark Johnson",
                    },
                    { role: "HR Director", name: "Amanda Foster", phone: "(248) 555-0128", backup: "Patricia Brown" },
                  ].map((member, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium text-sm">{member.role}</h4>
                          <p className="text-sm text-gray-600">{member.name}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">{member.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Backup:</span>
                          <span className="font-medium">{member.backup}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            {/* Emergency Plans */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Response Plans</CardTitle>
                <CardDescription>Comprehensive emergency procedures and protocols</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: "Fire Emergency Plan",
                      description: "Evacuation procedures and fire safety protocols",
                      lastUpdated: "2024-01-01",
                      sections: ["Evacuation Routes", "Assembly Points", "Fire Suppression", "Communication"],
                    },
                    {
                      title: "Medical Emergency Plan",
                      description: "Response to medical emergencies and cardiac events",
                      lastUpdated: "2024-01-01",
                      sections: ["Initial Response", "CPR Procedures", "EMS Coordination", "Family Notification"],
                    },
                    {
                      title: "Severe Weather Plan",
                      description: "Tornado, severe storm, and weather emergency procedures",
                      lastUpdated: "2023-12-15",
                      sections: ["Weather Monitoring", "Shelter Areas", "Communication", "Recovery"],
                    },
                    {
                      title: "Security Threat Plan",
                      description: "Response to security threats and lockdown procedures",
                      lastUpdated: "2023-11-01",
                      sections: ["Threat Assessment", "Lockdown Procedures", "Law Enforcement", "All Clear"],
                    },
                    {
                      title: "Power Outage Plan",
                      description: "Procedures for extended power outages",
                      lastUpdated: "2024-01-01",
                      sections: ["Backup Power", "Patient Care", "Communication", "Restoration"],
                    },
                    {
                      title: "Infectious Disease Plan",
                      description: "Response to infectious disease outbreaks",
                      lastUpdated: "2023-10-15",
                      sections: ["Isolation Procedures", "PPE Requirements", "Reporting", "Contact Tracing"],
                    },
                  ].map((plan, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{plan.title}</h4>
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Last Updated:</span>
                            <span className="font-medium">{plan.lastUpdated}</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Sections:</p>
                            <div className="flex flex-wrap gap-1">
                              {plan.sections.map((section, sIndex) => (
                                <Badge key={sIndex} variant="outline" className="text-xs">
                                  {section}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            <FileText className="h-3 w-3 mr-1" />
                            View Plan
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Floor Plans and Maps */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Maps & Floor Plans</CardTitle>
                <CardDescription>Evacuation routes and emergency equipment locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "Main Floor Evacuation Plan", type: "Floor Plan", updated: "2024-01-01" },
                    { name: "Second Floor Evacuation Plan", type: "Floor Plan", updated: "2024-01-01" },
                    { name: "Fire Extinguisher Locations", type: "Equipment Map", updated: "2023-12-15" },
                    { name: "AED and Emergency Equipment", type: "Equipment Map", updated: "2024-01-01" },
                  ].map((map, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{map.name}</h4>
                        <MapPin className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{map.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Updated:</span>
                          <span className="font-medium">{map.updated}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
