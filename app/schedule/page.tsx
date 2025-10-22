"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Video,
  MapPin,
  Bell,
  Copy,
  Mail,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState("month") // month, week, day
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)

  // Mock data for calendar events
  const events = [
    {
      id: 1,
      title: "Weekly Team Standup",
      date: "2024-01-15",
      time: "09:00",
      endTime: "09:30",
      type: "meeting",
      location: "Video Conference",
      attendees: ["Dr. Wilson", "Sarah Johnson", "Michael Chen", "Emily Davis"],
      description: "Weekly team sync and project updates",
      meetingLink: "https://meet.irishtriplets.com/weekly-standup",
      recurring: "weekly",
      priority: "medium",
    },
    {
      id: 2,
      title: "HIPAA Compliance Training",
      date: "2024-01-16",
      time: "14:00",
      endTime: "15:00",
      type: "training",
      location: "Conference Room A",
      attendees: ["All Staff"],
      description: "Annual HIPAA compliance training session",
      meetingLink: "https://meet.irishtriplets.com/hipaa-training",
      recurring: "none",
      priority: "high",
    },
    {
      id: 3,
      title: "Performance Review - Sarah Johnson",
      date: "2024-01-17",
      time: "10:00",
      endTime: "10:45",
      type: "evaluation",
      location: "Manager's Office",
      attendees: ["Dr. Wilson", "Sarah Johnson", "HR Manager"],
      description: "Annual performance evaluation and goal setting",
      meetingLink: null,
      recurring: "none",
      priority: "high",
    },
    {
      id: 4,
      title: "Staff Shift Planning",
      date: "2024-01-18",
      time: "15:30",
      endTime: "16:30",
      type: "planning",
      location: "Video Conference",
      attendees: ["Scheduling Manager", "Team Leads"],
      description: "Plan upcoming shift schedules and coverage",
      meetingLink: "https://meet.irishtriplets.com/shift-planning",
      recurring: "biweekly",
      priority: "medium",
    },
    {
      id: 5,
      title: "New Employee Orientation",
      date: "2024-01-19",
      time: "09:00",
      endTime: "12:00",
      type: "orientation",
      location: "Training Room",
      attendees: ["HR Manager", "New Hires"],
      description: "Orientation for new healthcare staff members",
      meetingLink: "https://meet.irishtriplets.com/orientation",
      recurring: "none",
      priority: "high",
    },
  ]

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "training":
        return "bg-green-100 text-green-800 border-green-200"
      case "evaluation":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "planning":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "orientation":
        return "bg-pink-100 text-pink-800 border-pink-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link)
    // Show toast notification
  }

  const sendCalendarInvite = (event: any) => {
    console.log("Sending calendar invite for:", event.title)
    // In real app, this would generate and send calendar invites
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
                <h1 className="text-2xl font-bold text-gray-900">Schedule & Calendar</h1>
                <p className="text-gray-600">Manage meetings, appointments, and team schedules</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>Schedule a new meeting, appointment, or event</DialogDescription>
                  </DialogHeader>
                  <EventForm onSave={() => setShowEventDialog(false)} />
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="staff-schedule">Staff Schedule</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            {/* Calendar Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h2 className="text-lg font-medium">
                        {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </h2>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm">
                      Today
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={viewMode} onValueChange={setViewMode}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="day">Day</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Grid */}
            <Card>
              <CardContent className="p-0">
                <CalendarGrid events={events} viewMode={viewMode} currentDate={currentDate} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            {/* Upcoming Events List */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Your scheduled meetings and appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events
                    .sort(
                      (a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime(),
                    )
                    .map((event) => (
                      <div key={event.id} className={`p-4 border rounded-lg ${getEventTypeColor(event.type)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white bg-opacity-50 rounded-lg flex items-center justify-center">
                              {event.type === "meeting" && <Video className="h-6 w-6" />}
                              {event.type === "training" && <Users className="h-6 w-6" />}
                              {event.type === "evaluation" && <Clock className="h-6 w-6" />}
                              {event.type === "planning" && <Calendar className="h-6 w-6" />}
                              {event.type === "orientation" && <Users className="h-6 w-6" />}
                            </div>
                            <div>
                              <h3 className="font-medium">{event.title}</h3>
                              <div className="flex items-center space-x-4 text-sm mt-1">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {event.date}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {formatTime(event.time)} - {formatTime(event.endTime)}
                                </span>
                                <span className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {event.location}
                                </span>
                              </div>
                              <p className="text-sm mt-2">{event.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(event.priority)}>{event.priority}</Badge>
                            {event.meetingLink && (
                              <Button size="sm" variant="outline" onClick={() => copyMeetingLink(event.meetingLink!)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => sendCalendarInvite(event)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Invite
                            </Button>
                            {event.meetingLink && (
                              <Button size="sm">
                                <Video className="h-4 w-4 mr-2" />
                                Join
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff-schedule" className="space-y-6">
            <StaffScheduleView />
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <AvailabilityManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Calendar Grid Component
function CalendarGrid({ events, viewMode, currentDate }: { events: any[]; viewMode: string; currentDate: Date }) {
  if (viewMode === "month") {
    return <MonthView events={events} currentDate={currentDate} />
  } else if (viewMode === "week") {
    return <WeekView events={events} currentDate={currentDate} />
  } else {
    return <DayView events={events} currentDate={currentDate} />
  }
}

// Month View Component
function MonthView({ events, currentDate }: { events: any[]; currentDate: Date }) {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((event) => event.date === dateStr)
  }

  return (
    <div className="p-4">
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty days */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-24 p-1"></div>
        ))}

        {/* Days with events */}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day)
          return (
            <div key={day} className="h-24 p-1 border border-gray-200 rounded">
              <div className="text-sm font-medium mb-1">{day}</div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded truncate ${
                      event.type === "meeting"
                        ? "bg-blue-100 text-blue-800"
                        : event.type === "training"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Week View Component
function WeekView({ events, currentDate }: { events: any[]; currentDate: Date }) {
  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    return day
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="p-4">
      <div className="grid grid-cols-8 gap-1">
        {/* Time column */}
        <div className="space-y-12">
          <div className="h-8"></div>
          {hours.map((hour) => (
            <div key={hour} className="text-xs text-gray-500 h-12 flex items-start">
              {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
            </div>
          ))}
        </div>

        {/* Days columns */}
        {weekDays.map((day, dayIndex) => (
          <div key={dayIndex} className="space-y-1">
            <div className="h-8 text-center text-sm font-medium">
              {day.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" })}
            </div>
            <div className="space-y-1">
              {hours.map((hour) => (
                <div key={hour} className="h-12 border-t border-gray-100"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Day View Component
function DayView({ events, currentDate }: { events: any[]; currentDate: Date }) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const dayEvents = events.filter((event) => event.date === currentDate.toISOString().split("T")[0])

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Time slots */}
        <div className="space-y-1">
          {hours.map((hour) => (
            <div key={hour} className="flex items-center h-16 border-b border-gray-100">
              <div className="w-16 text-sm text-gray-500">
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
              <div className="flex-1 ml-4">{/* Events for this hour would be positioned here */}</div>
            </div>
          ))}
        </div>

        {/* Events list */}
        <div className="space-y-4">
          <h3 className="font-medium">Events for {currentDate.toLocaleDateString()}</h3>
          {dayEvents.map((event) => (
            <div key={event.id} className="p-3 border rounded-lg">
              <h4 className="font-medium">{event.title}</h4>
              <p className="text-sm text-gray-600">
                {event.time} - {event.endTime}
              </p>
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge
                  className={`text-xs ${
                    event.type === "meeting"
                      ? "bg-blue-100 text-blue-800"
                      : event.type === "training"
                        ? "bg-green-100 text-green-800"
                        : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {event.type}
                </Badge>
                {event.meetingLink && (
                  <Button size="sm" variant="outline">
                    <Video className="h-4 w-4 mr-2" />
                    Join
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Event Form Component
function EventForm({ onSave }: { onSave: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    endTime: "",
    type: "meeting",
    location: "",
    attendees: [] as string[],
    description: "",
    meetingLink: "",
    recurring: "none",
    priority: "medium",
    sendInvites: true,
  })

  const eventTypes = [
    { value: "meeting", label: "Meeting" },
    { value: "training", label: "Training" },
    { value: "evaluation", label: "Evaluation" },
    { value: "planning", label: "Planning" },
    { value: "orientation", label: "Orientation" },
  ]

  const staffMembers = [
    "Dr. Wilson",
    "Sarah Johnson",
    "Michael Chen",
    "Emily Davis",
    "Lisa Garcia",
    "HR Manager",
    "Quality Director",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating event:", formData)
    onSave()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter event title"
            required
          />
        </div>

        <div>
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="type">Event Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="time">Start Time *</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="endTime">End Time *</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Conference room, video link, etc."
          />
        </div>

        <div className="md:col-span-2">
          <Label>Attendees</Label>
          <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
            {staffMembers.map((member) => (
              <div key={member} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={member}
                  checked={formData.attendees.includes(member)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        attendees: [...formData.attendees, member],
                      })
                    } else {
                      setFormData({
                        ...formData,
                        attendees: formData.attendees.filter((p) => p !== member),
                      })
                    }
                  }}
                  className="rounded"
                />
                <Label htmlFor={member} className="text-sm">
                  {member}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Event description and agenda..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="recurring">Recurring</Label>
          <Select value={formData.recurring} onValueChange={(value) => setFormData({ ...formData, recurring: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Repeat</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          <Calendar className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>
    </form>
  )
}

// Staff Schedule View Component
function StaffScheduleView() {
  const staffSchedules = [
    {
      name: "Dr. Wilson",
      role: "Medical Director",
      schedule: [
        { day: "Monday", shifts: [{ start: "08:00", end: "17:00", type: "office" }] },
        { day: "Tuesday", shifts: [{ start: "08:00", end: "17:00", type: "office" }] },
        { day: "Wednesday", shifts: [{ start: "08:00", end: "17:00", type: "office" }] },
        { day: "Thursday", shifts: [{ start: "08:00", end: "17:00", type: "office" }] },
        { day: "Friday", shifts: [{ start: "08:00", end: "15:00", type: "office" }] },
      ],
    },
    {
      name: "Sarah Johnson",
      role: "Registered Nurse",
      schedule: [
        { day: "Monday", shifts: [{ start: "07:00", end: "19:00", type: "field" }] },
        { day: "Tuesday", shifts: [{ start: "07:00", end: "19:00", type: "field" }] },
        { day: "Wednesday", shifts: [{ start: "07:00", end: "19:00", type: "field" }] },
        { day: "Thursday", shifts: [] },
        { day: "Friday", shifts: [{ start: "07:00", end: "19:00", type: "field" }] },
      ],
    },
    {
      name: "Michael Chen",
      role: "Physical Therapist",
      schedule: [
        { day: "Monday", shifts: [{ start: "09:00", end: "17:00", type: "field" }] },
        { day: "Tuesday", shifts: [{ start: "09:00", end: "17:00", type: "field" }] },
        { day: "Wednesday", shifts: [{ start: "09:00", end: "17:00", type: "field" }] },
        { day: "Thursday", shifts: [{ start: "09:00", end: "17:00", type: "field" }] },
        { day: "Friday", shifts: [] },
      ],
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Schedule Overview</CardTitle>
        <CardDescription>Weekly schedule for all team members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {staffSchedules.map((staff) => (
            <div key={staff.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">{staff.name}</h3>
                  <p className="text-sm text-gray-600">{staff.role}</p>
                </div>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Schedule
                </Button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {staff.schedule.map((day) => (
                  <div key={day.day} className="text-center">
                    <div className="text-sm font-medium mb-2">{day.day.slice(0, 3)}</div>
                    <div className="space-y-1">
                      {day.shifts.length > 0 ? (
                        day.shifts.map((shift, index) => (
                          <div
                            key={index}
                            className={`text-xs p-2 rounded ${
                              shift.type === "office" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {shift.start} - {shift.end}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs p-2 bg-gray-100 text-gray-600 rounded">Off</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Availability Manager Component
function AvailabilityManager() {
  const [selectedStaff, setSelectedStaff] = useState("all")

  const availabilityData = [
    {
      name: "Dr. Wilson",
      status: "available",
      nextUnavailable: "2024-01-20 (Vacation)",
      workingHours: "8:00 AM - 5:00 PM",
      timezone: "EST",
    },
    {
      name: "Sarah Johnson",
      status: "busy",
      currentActivity: "Patient Visit",
      nextAvailable: "2:00 PM",
      workingHours: "7:00 AM - 7:00 PM",
      timezone: "EST",
    },
    {
      name: "Michael Chen",
      status: "available",
      nextUnavailable: "4:00 PM (End of shift)",
      workingHours: "9:00 AM - 5:00 PM",
      timezone: "EST",
    },
    {
      name: "Emily Davis",
      status: "off",
      reason: "Scheduled Day Off",
      nextAvailable: "Tomorrow 8:00 AM",
      workingHours: "8:00 AM - 4:00 PM",
      timezone: "EST",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "busy":
        return "bg-yellow-100 text-yellow-800"
      case "off":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Availability</CardTitle>
              <CardDescription>Real-time availability status for all staff members</CardDescription>
            </div>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="available">Available Only</SelectItem>
                <SelectItem value="busy">Busy Only</SelectItem>
                <SelectItem value="off">Off Duty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availabilityData.map((person) => (
              <div key={person.name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{person.name}</h3>
                  <Badge className={getStatusColor(person.status)}>{person.status}</Badge>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Working Hours: {person.workingHours}</span>
                  </div>
                  {person.currentActivity && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Current: {person.currentActivity}</span>
                    </div>
                  )}
                  {person.nextAvailable && (
                    <div className="flex items-center">
                      <Bell className="h-4 w-4 mr-2" />
                      <span>Next Available: {person.nextAvailable}</span>
                    </div>
                  )}
                  {person.nextUnavailable && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Next Unavailable: {person.nextUnavailable}</span>
                    </div>
                  )}
                  {person.reason && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{person.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Schedule Coverage</h3>
            <p className="text-sm text-gray-600 mb-4">Ensure adequate staff coverage</p>
            <Button variant="outline" className="w-full bg-transparent">
              View Coverage
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Set Availability</h3>
            <p className="text-sm text-gray-600 mb-4">Update your availability status</p>
            <Button variant="outline" className="w-full bg-transparent">
              Update Status
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Request Time Off</h3>
            <p className="text-sm text-gray-600 mb-4">Submit time off requests</p>
            <Button variant="outline" className="w-full bg-transparent">
              Request Leave
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
