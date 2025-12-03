"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
  const [staff, setStaff] = useState<any[]>([])
  const [shiftsByStaff, setShiftsByStaff] = useState<Record<string, any[]>>({})
  const [cancelRequests, setCancelRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [targetStaff, setTargetStaff] = useState<any | null>(null)
  const [newShift, setNewShift] = useState({ day_of_week: 0, start_time: "08:00", end_time: "17:00", shift_type: "office", location: "", notes: "", facility: "", unit: "" })
  const [editingShift, setEditingShift] = useState<any | null>(null)
  const [pickerShifts, setPickerShifts] = useState<any[]>([])
  const [currentUserDepartment, setCurrentUserDepartment] = useState<string | null>(null)

  const formatFacilityUnit = (locationValue?: string) => {
    const raw = String(locationValue || '')
    const beforeComma = raw.split(',')[0] || ''
    const [facility, unit] = beforeComma.split(' | ')
    return [facility, unit].filter(Boolean).join(' — ')
  }

  // Limit display and selection to Monday–Friday only
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday"]
  // Full week names for displaying details (e.g., pending requests referencing any dow)
  const fullWeekDays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        
        // Get current user's department first
        let userDepartment: string | null = null
        try {
          const storedUser = localStorage.getItem('currentUser')
          if (storedUser) {
            const user = JSON.parse(storedUser)
            // If user has staffId, fetch their staff record to get department
            if (user.staffId || user.id) {
              const staffId = user.staffId || user.id
              const userStaffRes = await fetch(`/api/staff/list`, { cache: 'no-store' })
              const userStaffData = await userStaffRes.json()
              if (userStaffData.success && userStaffData.staff) {
                const currentUserStaff = userStaffData.staff.find((s: any) => 
                  s.id === staffId || s.email === user.email
                )
                if (currentUserStaff && currentUserStaff.department) {
                  userDepartment = currentUserStaff.department
                  setCurrentUserDepartment(currentUserStaff.department)
                }
              }
            }
          }
        } catch (e) {
          console.error('Error getting current user department:', e)
        }
        
        const staffRes = await fetch('/api/staff/list', { cache: 'no-store' })
        const staffData = await staffRes.json()
        let staffList = staffData.success ? staffData.staff : []
        
        // Filter by current user's department if available
        if (userDepartment) {
          staffList = staffList.filter((s: any) => s.department === userDepartment)
        }
        
        setStaff(staffList)
        // fetch shifts per staff
        const entries: Record<string, any[]> = {}
        await Promise.all((staffList || []).map(async (s: any) => {
          const r = await fetch(`/api/staff/shifts?staff_id=${encodeURIComponent(s.id)}`, { cache: 'no-store' })
          const d = await r.json()
          entries[s.id] = d.success ? (d.shifts || []) : []
        }))
        setShiftsByStaff(entries)
        // Fetch all staff from patient_care_team table and add them as separate staff entries
        try {
          const careTeamRes = await fetch('/api/staff/care-team?active_only=true', { cache: 'no-store' })
          const careTeamData = await careTeamRes.json()
          if (careTeamData.success && careTeamData.careTeam) {
            // Get unique staff members from care team
            const careTeamStaffMap = new Map<string, any>()
            careTeamData.careTeam.forEach((ct: any) => {
              if (ct.staff && ct.staff.id) {
                const staffId = ct.staff.id
                if (!careTeamStaffMap.has(staffId)) {
                  // Check if this staff is already in the main staff list
                  const existsInMainList = staffList.find((s: any) => s.id === staffId)
                  if (!existsInMainList) {
                    // Add as new staff member from care team
                    careTeamStaffMap.set(staffId, {
                      id: staffId,
                      name: ct.staff.name || 'Unknown',
                      department: ct.staff.department || ct.role || 'Care Team',
                      email: ct.staff.email,
                      phone_number: ct.staff.phone,
                      credentials: ct.staff.credentials,
                      role: ct.role,
                      specialty: ct.specialty,
                      isPrimary: ct.isPrimary,
                      isAssignedStaff: ct.isAssignedStaff,
                    })
                  }
                }
              }
            })
            // Add care team staff to the list
            const careTeamStaffList = Array.from(careTeamStaffMap.values())
            const combinedStaffList = [...staffList, ...careTeamStaffList]
            setStaff(combinedStaffList)
            // Fetch shifts for care team staff
            const careTeamShiftEntries: Record<string, any[]> = {}
            await Promise.all(careTeamStaffList.map(async (s: any) => {
              const r = await fetch(`/api/staff/shifts?staff_id=${encodeURIComponent(s.id)}`, { cache: 'no-store' })
              const d = await r.json()
              careTeamShiftEntries[s.id] = d.success ? (d.shifts || []) : []
            }))
            setShiftsByStaff(prev => ({ ...prev, ...careTeamShiftEntries }))
          }
        } catch (e) {
          console.error('Error fetching care team staff:', e)
        }
        // load pending cancellation requests
        try {
          const reqRes = await fetch('/api/staff/cancel-requests?status=pending', { cache: 'no-store' })
          if (reqRes.ok) {
            const reqData = await reqRes.json()
            setCancelRequests(reqData.success ? (reqData.requests || []) : [])
          } else {
            console.error('Failed to load cancel requests', reqRes.status)
            setCancelRequests([])
          }
        } catch (e) {
          console.error('Cancel requests load error', e)
          setCancelRequests([])
        }
      } finally {
        setIsLoading(false)
      }
    }
    init()
    // poll pending requests periodically
    const interval = setInterval(async () => {
      try {
        const reqRes = await fetch('/api/staff/cancel-requests?status=pending', { cache: 'no-store' })
        if (reqRes.ok) {
          const reqData = await reqRes.json()
          setCancelRequests(reqData.success ? (reqData.requests || []) : [])
        }
      } catch {}
    }, 10000)
    return () => clearInterval(interval)
  }, [currentUserDepartment])

  const openAddShift = (s: any) => {
    setTargetStaff(s)
    setNewShift({ day_of_week: 0, start_time: "08:00", end_time: "17:00", shift_type: "office", location: "", notes: "", facility: "", unit: "" })
    setIsDialogOpen(true)
  }

  const openEditShift = (s: any, shift: any) => {
    setTargetStaff(s)
    const [facilityPart, unitPart] = (shift.location || '').split(' | ')
    setEditingShift(shift)
    setNewShift({
      day_of_week: shift.day_of_week,
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_type || 'office',
      location: shift.location || '',
      notes: shift.notes || '',
      facility: facilityPart || '',
      unit: unitPart || ''
    })
    setIsEditOpen(true)
  }

  const openEditSchedule = (s: any) => {
    setTargetStaff(s)
    const list = (shiftsByStaff[s.id] || []).filter((sh) => sh.day_of_week >= 0 && sh.day_of_week <= 4)
    if (list.length === 0) {
      openAddShift(s)
      return
    }
    if (list.length === 1) {
      openEditShift(s, list[0])
      return
    }
    setPickerShifts(list)
    setIsPickerOpen(true)
  }

  const saveShift = async () => {
    if (!targetStaff) return
    const composedLocation = [newShift.facility, newShift.unit].filter(Boolean).join(' | ')
    const res = await fetch('/api/staff/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff_id: targetStaff.id, day_of_week: newShift.day_of_week, start_time: newShift.start_time, end_time: newShift.end_time, shift_type: newShift.shift_type, location: composedLocation, notes: newShift.notes })
    })
    const data = await res.json()
    if (data.success) {
      const r = await fetch(`/api/staff/shifts?staff_id=${encodeURIComponent(targetStaff.id)}`, { cache: 'no-store' })
      const d = await r.json()
      setShiftsByStaff(prev => ({ ...prev, [targetStaff.id]: d.success ? (d.shifts || []) : [] }))
      setIsDialogOpen(false)
    } else {
      alert(data.error || 'Failed to save shift')
    }
  }

  const updateShift = async () => {
    if (!targetStaff || !editingShift) return
    const composedLocation = [newShift.facility, newShift.unit].filter(Boolean).join(' | ')
    const res = await fetch('/api/staff/shifts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingShift.id, day_of_week: newShift.day_of_week, start_time: newShift.start_time, end_time: newShift.end_time, shift_type: newShift.shift_type, location: composedLocation, notes: newShift.notes })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.error || 'Failed to update shift')
      return
    }
    const data = await res.json()
    if (data.success) {
      const r = await fetch(`/api/staff/shifts?staff_id=${encodeURIComponent(targetStaff.id)}`, { cache: 'no-store' })
      const d = await r.json()
      setShiftsByStaff(prev => ({ ...prev, [targetStaff.id]: d.success ? (d.shifts || []) : [] }))
      setIsEditOpen(false)
      setEditingShift(null)
    } else {
      alert(data.error || 'Failed to update shift')
    }
  }

  const deleteShift = async () => {
    if (!targetStaff || !editingShift) return
    const res = await fetch(`/api/staff/shifts?id=${encodeURIComponent(editingShift.id)}`, { method: 'DELETE', cache: 'no-store' })
    const data = await res.json()
    if (data.success) {
      const r = await fetch(`/api/staff/shifts?staff_id=${encodeURIComponent(targetStaff.id)}`, { cache: 'no-store' })
      const d = await r.json()
      setShiftsByStaff(prev => ({ ...prev, [targetStaff.id]: d.success ? (d.shifts || []) : [] }))
      setIsEditOpen(false)
      setEditingShift(null)
    } else {
      alert(data.error || 'Failed to delete shift')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Schedule Overview</CardTitle>
        <CardDescription>
          {currentUserDepartment 
            ? `Weekly schedule for ${currentUserDepartment} team members`
            : 'Weekly schedule for team members'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Pending cancellation requests */}
          {cancelRequests.length > 0 && (
            <div className="p-4 border rounded-lg">
              <div className="font-medium mb-3">Pending Cancellation Requests</div>
              <div className="space-y-2">
                {cancelRequests.map((r) => {
                  const st = staff.find((x) => x.id === r.staff_id)
                  const staffShifts = shiftsByStaff[r.staff_id] || []
                  const sh = staffShifts.find((x: any) => x.id === r.shift_id)
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="text-sm font-medium">{st?.name || r.staff_id}</div>
                        {sh && (
                          <div className="text-xs text-gray-700">
                            {fullWeekDays[sh.day_of_week] || `Day ${sh.day_of_week}`} • {sh.start_time} - {sh.end_time}
                            {sh.location && <span> — {formatFacilityUnit(sh.location)}</span>}
                          </div>
                        )}
                        {r.reason && <div className="text-xs text-gray-600">Reason: {r.reason}</div>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={async () => {
                          const res = await fetch('/api/staff/cancel-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, action: 'approve' }) })
                          if (!res.ok) { console.error('Approve HTTP error', res.status); alert('Failed to approve'); return }
                          const d = await res.json().catch(() => ({}))
                          if (!d.success) { alert(d.error || 'Failed to approve'); return }
                          // refresh
                          try {
                            const reqRes2 = await fetch('/api/staff/cancel-requests?status=pending', { cache: 'no-store' })
                            const reqData2 = reqRes2.ok ? await reqRes2.json() : { success: false }
                            setCancelRequests(reqData2.success ? (reqData2.requests || []) : [])
                          } catch {}
                          // also refresh shifts for that staff
                          const rsh = await fetch(`/api/staff/shifts?staff_id=${encodeURIComponent(r.staff_id)}`, { cache: 'no-store' })
                          const dd = rsh.ok ? await rsh.json() : { success: false }
                          setShiftsByStaff(prev => ({ ...prev, [r.staff_id]: dd.success ? (dd.shifts || []) : [] }))
                        }}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={async () => {
                          const res = await fetch('/api/staff/cancel-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, action: 'decline' }) })
                          if (!res.ok) { console.error('Decline HTTP error', res.status); alert('Failed to decline'); return }
                          const d = await res.json().catch(() => ({}))
                          if (!d.success) { alert(d.error || 'Failed to decline'); return }
                          try {
                            const reqRes2 = await fetch('/api/staff/cancel-requests?status=pending', { cache: 'no-store' })
                            const reqData2 = reqRes2.ok ? await reqRes2.json() : { success: false }
                            setCancelRequests(reqData2.success ? (reqData2.requests || []) : [])
                          } catch {}
                        }}>Decline</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {isLoading && <div className="p-4 text-sm text-gray-500">Loading staff schedules...</div>}
          {staff.map((s) => {
            return (
              <div key={s.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">{s.name}</h3>
                    <p className="text-sm text-gray-600">{s.department || 'Staff'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openAddShift(s)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Shift
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditSchedule(s)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Schedule
                    </Button>
                  </div>
                </div>
                {/* Schedule Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {days.map((day, idx) => {
                    const dayShifts = (shiftsByStaff[s.id] || []).filter((sh) => sh.day_of_week === idx)
                    return (
                      <div key={day} className="text-center">
                        <div className="text-sm font-medium mb-2">{day.slice(0, 3)}</div>
                        <div className="space-y-1">
                          {dayShifts.length > 0 ? (
                            dayShifts.map((shift) => (
                              <div key={shift.id} onClick={() => openEditShift(s, shift)} className={`cursor-pointer text-xs p-2 rounded ${shift.shift_type === 'office' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                {shift.start_time} - {shift.end_time}
                                {shift.location && (
                                  <div className="text-[10px] text-gray-700 mt-0.5">
                                    {formatFacilityUnit(shift.location)}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-xs p-2 bg-gray-100 text-gray-600 rounded">Off</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Shift {targetStaff ? `for ${targetStaff.name}` : ''}</DialogTitle>
            <DialogDescription>Create a new shift for the selected staff member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Day</Label>
              <Select value={String(newShift.day_of_week)} onValueChange={(v) => setNewShift({ ...newShift, day_of_week: Number.parseInt(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Facility</Label>
                <Input value={newShift.facility} onChange={(e) => setNewShift({ ...newShift, facility: e.target.value })} placeholder="e.g., Sunrise Senior Living" />
              </div>
              <div>
                <Label>Unit / Department</Label>
                <Input value={newShift.unit} onChange={(e) => setNewShift({ ...newShift, unit: e.target.value })} placeholder="e.g., ICU" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={newShift.start_time} onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={newShift.end_time} onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={newShift.shift_type} onValueChange={(v) => setNewShift({ ...newShift, shift_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="field">Field</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={newShift.notes} onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveShift}>Save Shift</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit shift dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Shift {targetStaff ? `for ${targetStaff.name}` : ''}</DialogTitle>
            <DialogDescription>Update or delete this shift</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Day</Label>
              <Select value={String(newShift.day_of_week)} onValueChange={(v) => setNewShift({ ...newShift, day_of_week: Number.parseInt(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Facility</Label>
                <Input value={newShift.facility} onChange={(e) => setNewShift({ ...newShift, facility: e.target.value })} placeholder="e.g., Sunrise Senior Living" />
              </div>
              <div>
                <Label>Unit / Department</Label>
                <Input value={newShift.unit} onChange={(e) => setNewShift({ ...newShift, unit: e.target.value })} placeholder="e.g., ICU" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={newShift.start_time} onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={newShift.end_time} onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={newShift.shift_type} onValueChange={(v) => setNewShift({ ...newShift, shift_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="field">Field</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={newShift.notes} onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })} />
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="destructive" onClick={deleteShift}>Delete</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={updateShift}>Save Changes</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Picker dialog: choose a day that has a shift */}
      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select a day to edit {targetStaff ? `for ${targetStaff.name}` : ''}</DialogTitle>
            <DialogDescription>Only days with existing shifts are shown</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {pickerShifts.map((sh) => (
              <div key={sh.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="text-sm font-medium">{days[sh.day_of_week]}</div>
                  <div className="text-xs text-gray-600">{sh.start_time} - {sh.end_time}</div>
                  {sh.location && <div className="text-[10px] text-gray-600">{formatFacilityUnit(sh.location)}</div>}
                </div>
                <Button size="sm" onClick={() => { if (targetStaff) { setIsPickerOpen(false); openEditShift(targetStaff, sh) } }}>Edit</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// Availability Manager Component
function AvailabilityManager() {
  const [selectedStaff, setSelectedStaff] = useState("all")
  const [availabilityData, setAvailabilityData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserDepartment, setCurrentUserDepartment] = useState<string | null>(null)
  const [showCoverageDialog, setShowCoverageDialog] = useState(false)
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false)
  const [userAvailability, setUserAvailability] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Days mapping
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  // Format time helper
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Calculate availability status
  const calculateAvailability = async (staff: any, shifts: any[]) => {
    const now = new Date()
    const currentDay = days[now.getDay() === 0 ? 6 : now.getDay() - 1] // Convert Sunday=0 to Sunday=6
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    
    // Get today's shift
    const todayShift = shifts.find((s: any) => s.day_of_week === (now.getDay() === 0 ? 6 : now.getDay() - 1))
    
    // Get real-time status
    let realTimeStatus = 'offline'
    let currentActivity = null
    try {
      const statusRes = await fetch(`/api/gps/staff-location?staff_id=${encodeURIComponent(staff.id)}`, { cache: 'no-store' })
      const statusData = await statusRes.json()
      if (statusData.success) {
        realTimeStatus = statusData.status || 'offline'
        if (statusData.currentVisit) {
          currentActivity = `Patient Visit: ${statusData.currentVisit.patient_name}`
        } else if (statusData.status === 'driving') {
          currentActivity = 'Driving'
        } else if (statusData.status === 'active') {
          currentActivity = 'Active'
        }
      }
    } catch (e) {
      console.error(`Error fetching status for ${staff.id}:`, e)
    }

    // Determine availability
    let status = 'off'
    let workingHours = 'Not scheduled'
    let nextAvailable = null
    let nextUnavailable = null
    let reason = null

    if (!todayShift) {
      // No shift today - check next shift
      const sortedShifts = [...shifts].sort((a, b) => a.day_of_week - b.day_of_week)
      const nextShift = sortedShifts.find((s: any) => s.day_of_week > (now.getDay() === 0 ? 6 : now.getDay() - 1)) || sortedShifts[0]
      if (nextShift) {
        const nextDayIndex = nextShift.day_of_week
        const nextDayName = days[nextDayIndex]
        nextAvailable = `${nextDayName} ${formatTime(nextShift.start_time)}`
      }
      reason = 'No shift scheduled today'
    } else {
      // Has shift today
      const startTime = todayShift.start_time
      const endTime = todayShift.end_time
      workingHours = `${formatTime(startTime)} - ${formatTime(endTime)}`
      
      // Check if currently within working hours
      if (currentTime >= startTime && currentTime <= endTime) {
        // Within working hours
        if (realTimeStatus === 'on_visit' || realTimeStatus === 'driving') {
          status = 'busy'
          if (realTimeStatus === 'on_visit' && currentActivity) {
            // Calculate next available (estimate visit end in 30-60 min)
            const visitStart = new Date()
            const estimatedEnd = new Date(visitStart.getTime() + 45 * 60000) // 45 min estimate
            nextAvailable = estimatedEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          } else if (realTimeStatus === 'driving') {
            // Estimate arrival in 15-30 min
            const estimatedArrival = new Date(now.getTime() + 20 * 60000)
            nextAvailable = estimatedArrival.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          }
        } else if (realTimeStatus === 'active' || realTimeStatus === 'offline') {
          status = 'available'
        }
        
        // Next unavailable is end of shift
        nextUnavailable = `${formatTime(endTime)} (End of shift)`
      } else if (currentTime < startTime) {
        // Before shift starts
        status = 'off'
        nextAvailable = `${formatTime(startTime)}`
        reason = 'Shift not started'
      } else {
        // After shift ended
        status = 'off'
        const sortedShifts = [...shifts].sort((a, b) => a.day_of_week - b.day_of_week)
        const nextShift = sortedShifts.find((s: any) => s.day_of_week > (now.getDay() === 0 ? 6 : now.getDay() - 1)) || sortedShifts[0]
        if (nextShift) {
          const nextDayIndex = nextShift.day_of_week
          const nextDayName = days[nextDayIndex]
          nextAvailable = `${nextDayName} ${formatTime(nextShift.start_time)}`
        }
        reason = 'Shift ended'
      }
    }

    return {
      id: staff.id,
      name: staff.name,
      status,
      workingHours,
      currentActivity,
      nextAvailable,
      nextUnavailable,
      reason,
      department: staff.department || 'Staff',
      credentials: staff.credentials,
    }
  }

  // Fetch availability data
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true)
        
        // Get current user's department and ID
        let userDepartment: string | null = null
        try {
          const storedUser = localStorage.getItem('currentUser')
          if (storedUser) {
            const user = JSON.parse(storedUser)
            if (user.staffId || user.id) {
              const staffId = user.staffId || user.id
              setCurrentUserId(staffId)
              const userStaffRes = await fetch(`/api/staff/list`, { cache: 'no-store' })
              const userStaffData = await userStaffRes.json()
              if (userStaffData.success && userStaffData.staff) {
                const currentUserStaff = userStaffData.staff.find((s: any) => 
                  s.id === staffId || s.email === user.email
                )
                if (currentUserStaff) {
                  setCurrentUserId(currentUserStaff.id)
                  if (currentUserStaff.department) {
                    userDepartment = currentUserStaff.department
                    setCurrentUserDepartment(currentUserStaff.department)
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Error getting current user department:', e)
        }

        // Fetch all staff
        const staffRes = await fetch('/api/staff/list', { cache: 'no-store' })
        const staffData = await staffRes.json()
        let staffList = staffData.success ? staffData.staff : []
        
        // Filter by department if available
        if (userDepartment) {
          staffList = staffList.filter((s: any) => s.department === userDepartment)
        }

        // Fetch all staff from patient_care_team table and add them as separate staff entries
        try {
          const careTeamRes = await fetch('/api/staff/care-team?active_only=true', { cache: 'no-store' })
          const careTeamData = await careTeamRes.json()
          if (careTeamData.success && careTeamData.careTeam) {
            // Get unique staff members from care team
            const careTeamStaffMap = new Map<string, any>()
            careTeamData.careTeam.forEach((ct: any) => {
              if (ct.staff && ct.staff.id) {
                const staffId = ct.staff.id
                if (!careTeamStaffMap.has(staffId)) {
                  // Check if this staff is already in the main staff list
                  const existsInMainList = staffList.find((s: any) => s.id === staffId)
                  if (!existsInMainList) {
                    // Add as new staff member from care team
                    careTeamStaffMap.set(staffId, {
                      id: staffId,
                      name: ct.staff.name || 'Unknown',
                      department: ct.staff.department || ct.role || 'Care Team',
                      email: ct.staff.email,
                      phone_number: ct.staff.phone,
                      credentials: ct.staff.credentials,
                      role: ct.role,
                      specialty: ct.specialty,
                      isPrimary: ct.isPrimary,
                      isAssignedStaff: ct.isAssignedStaff,
                    })
                  }
                }
              }
            })
            // Add care team staff to the list
            const careTeamStaffList = Array.from(careTeamStaffMap.values())
            staffList = [...staffList, ...careTeamStaffList]
          }
        } catch (e) {
          console.error('Error fetching care team staff:', e)
        }

        // Fetch shifts and calculate availability for each staff
        const availabilityPromises = staffList.map(async (staff: any) => {
          try {
            // Fetch shifts
            const shiftsRes = await fetch(`/api/staff/shifts?staff_id=${encodeURIComponent(staff.id)}`, { cache: 'no-store' })
            const shiftsData = await shiftsRes.json()
            const shifts = shiftsData.success ? (shiftsData.shifts || []) : []
            
            // Calculate availability
            return await calculateAvailability(staff, shifts)
          } catch (e) {
            console.error(`Error calculating availability for ${staff.id}:`, e)
            return {
              id: staff.id,
              name: staff.name,
              status: 'off',
              workingHours: 'Unknown',
              department: staff.department || 'Staff',
              reason: 'Error loading schedule',
            }
          }
        })

        const availability = await Promise.all(availabilityPromises)
        setAvailabilityData(availability)
      } catch (e) {
        console.error('Error fetching availability:', e)
        setAvailabilityData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailability()
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchAvailability, 30000)
    return () => clearInterval(interval)
  }, [currentUserDepartment])

  // Filter availability data
  const filteredData = availabilityData.filter((person) => {
    if (selectedStaff === "all") return true
    return person.status === selectedStaff
  })

  // Calculate coverage statistics
  const coverageStats = {
    total: availabilityData.length,
    available: availabilityData.filter(p => p.status === 'available').length,
    busy: availabilityData.filter(p => p.status === 'busy').length,
    off: availabilityData.filter(p => p.status === 'off').length,
    coveragePercent: availabilityData.length > 0 
      ? Math.round(((availabilityData.filter(p => p.status === 'available' || p.status === 'busy').length) / availabilityData.length) * 100)
      : 0
  }

  // Get current user's shifts for availability dialog
  const fetchUserShifts = async () => {
    if (!currentUserId) return
    try {
      const res = await fetch(`/api/staff/shifts?staff_id=${encodeURIComponent(currentUserId)}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setUserAvailability(data.shifts || [])
      }
    } catch (e) {
      console.error('Error fetching user shifts:', e)
    }
  }

  // Save user availability
  const saveUserShift = async (shiftData: any) => {
    if (!currentUserId) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/staff/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...shiftData, staff_id: currentUserId })
      })
      const data = await res.json()
      if (data.success) {
        await fetchUserShifts()
      }
    } catch (e) {
      console.error('Error saving shift:', e)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete user shift
  const deleteUserShift = async (shiftId: string) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/staff/shifts?id=${encodeURIComponent(shiftId)}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        await fetchUserShifts()
      }
    } catch (e) {
      console.error('Error deleting shift:', e)
    } finally {
      setIsSaving(false)
    }
  }

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
          {isLoading ? (
            <div className="p-4 text-sm text-gray-500 text-center">Loading availability data...</div>
          ) : filteredData.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">No staff members found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredData.map((person) => (
                <div key={person.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{person.name}</h3>
                      {person.department && (
                        <p className="text-xs text-gray-500">{person.department}</p>
                      )}
                    </div>
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
          )}
        </CardContent>
      </Card>

      {/* Coverage Summary Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{coverageStats.coveragePercent}%</p>
                <p className="text-xs text-gray-600">Coverage</p>
              </div>
              <div className="h-10 w-px bg-gray-300" />
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                  <span>{coverageStats.available} Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                  <span>{coverageStats.busy} Busy</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400 mr-2" />
                  <span>{coverageStats.off} Off</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{coverageStats.total}</span> total staff
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Schedule Coverage</h3>
            <p className="text-sm text-gray-600 mb-4">View detailed coverage by department</p>
            <Button 
              variant="outline" 
              className="w-full bg-transparent"
              onClick={() => setShowCoverageDialog(true)}
            >
              View Coverage
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Bell className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Set Availability</h3>
            <p className="text-sm text-gray-600 mb-4">Manage your weekly schedule</p>
            <Button 
              variant="outline" 
              className="w-full bg-transparent"
              onClick={() => {
                fetchUserShifts()
                setShowAvailabilityDialog(true)
              }}
            >
              Update Schedule
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Request Time Off</h3>
            <p className="text-sm text-gray-600 mb-4">Submit time off requests</p>
            <Link href="/leave-requests">
              <Button 
                variant="outline" 
                className="w-full bg-transparent"
              >
                Request Leave
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Coverage Dialog */}
      <Dialog open={showCoverageDialog} onOpenChange={setShowCoverageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Coverage Details</DialogTitle>
            <DialogDescription>Staff availability breakdown by status and department</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Overall Coverage */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Overall Coverage</span>
                <span className="text-2xl font-bold text-blue-600">{coverageStats.coveragePercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${coverageStats.coveragePercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {coverageStats.available + coverageStats.busy} of {coverageStats.total} staff members are currently working
              </p>
            </div>

            {/* By Department */}
            <div>
              <h4 className="font-medium mb-3">Coverage by Department</h4>
              <div className="space-y-3">
                {Object.entries(
                  availabilityData.reduce((acc: any, person) => {
                    const dept = person.department || 'Other'
                    if (!acc[dept]) acc[dept] = { total: 0, available: 0, busy: 0, off: 0 }
                    acc[dept].total++
                    acc[dept][person.status]++
                    return acc
                  }, {})
                ).map(([dept, stats]: [string, any]) => (
                  <div key={dept} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{dept}</span>
                    <div className="flex items-center space-x-3 text-sm">
                      <Badge className="bg-green-100 text-green-800">{stats.available} avail</Badge>
                      <Badge className="bg-yellow-100 text-yellow-800">{stats.busy} busy</Badge>
                      <Badge className="bg-gray-100 text-gray-800">{stats.off} off</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Staff List */}
            <div>
              <h4 className="font-medium mb-3">Currently Available Staff</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {availabilityData.filter(p => p.status === 'available').length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No staff currently available</p>
                ) : (
                  availabilityData.filter(p => p.status === 'available').map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{person.name}</p>
                        <p className="text-xs text-gray-600">{person.department}</p>
                      </div>
                      <p className="text-xs text-gray-500">{person.workingHours}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Availability Dialog */}
      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Your Availability</DialogTitle>
            <DialogDescription>Set your weekly working schedule</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!currentUserId ? (
              <div className="p-4 text-center text-gray-500">
                Please log in to manage your availability
              </div>
            ) : (
              <>
                {/* Current Schedule */}
                <div>
                  <h4 className="font-medium mb-3">Your Current Schedule</h4>
                  {userAvailability.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No shifts scheduled. Add your availability below.</p>
                  ) : (
                    <div className="space-y-2">
                      {userAvailability.map((shift: any) => (
                        <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{days[shift.day_of_week]}</p>
                            <p className="text-sm text-gray-600">
                              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => deleteUserShift(shift.id)}
                            disabled={isSaving}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New Shift */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Add Availability</h4>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    saveUserShift({
                      day_of_week: Number(formData.get('day')),
                      start_time: formData.get('start'),
                      end_time: formData.get('end'),
                      shift_type: 'field'
                    })
                    e.currentTarget.reset()
                  }} className="grid grid-cols-4 gap-3">
                    <Select name="day" defaultValue="0">
                      <SelectTrigger>
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((day, index) => (
                          <SelectItem key={day} value={String(index)}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input 
                      type="time" 
                      name="start" 
                      defaultValue="09:00"
                      className="border rounded px-3 py-2 text-sm"
                      required
                    />
                    <input 
                      type="time" 
                      name="end" 
                      defaultValue="17:00"
                      className="border rounded px-3 py-2 text-sm"
                      required
                    />
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Add'}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
