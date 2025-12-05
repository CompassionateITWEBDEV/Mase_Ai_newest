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
import { ScheduleVideoCall } from "@/components/schedule/ScheduleVideoCall"

export default function Schedule() {
  // Hydration fix - only render dynamic content after client mount
  const [mounted, setMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState("month") // month, week, day
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showNewEventDialog, setShowNewEventDialog] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Video Call State - Schedule page has its own video call functionality
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [activeMeeting, setActiveMeeting] = useState<any>(null)

  // Hydration fix - set mounted and currentDate after client loads
  useEffect(() => {
    setMounted(true)
    setCurrentDate(new Date())
  }, [])

  // Generate dynamic sample events based on current date
  const generateSampleEvents = () => {
    const today = new Date()
    const getDateString = (daysOffset: number) => {
      const date = new Date(today)
      date.setDate(today.getDate() + daysOffset)
      return date.toISOString().split("T")[0]
    }

    return [
      {
        id: "sample-1",
        title: "Weekly Team Standup",
        date: getDateString(1),
        time: "09:00",
        endTime: "09:30",
        type: "meeting",
        location: "Video Conference",
        attendees: ["Dr. Wilson", "Sarah Johnson", "Michael Chen", "Emily Davis"],
        description: "Weekly team sync and project updates",
        meetingLink: "/meeting/standup-1",
        recurring: "weekly",
        priority: "medium",
      },
      {
        id: "sample-2",
        title: "HIPAA Compliance Training",
        date: getDateString(2),
        time: "14:00",
        endTime: "15:00",
        type: "training",
        location: "Conference Room A",
        attendees: ["All Staff"],
        description: "Annual HIPAA compliance training session",
        meetingLink: "/meeting/hipaa-training",
        recurring: "none",
        priority: "high",
      },
      {
        id: "sample-3",
        title: "Performance Review - Sarah Johnson",
        date: getDateString(3),
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
        id: "sample-4",
        title: "Staff Shift Planning",
        date: getDateString(4),
        time: "15:30",
        endTime: "16:30",
        type: "planning",
        location: "Video Conference",
        attendees: ["Scheduling Manager", "Team Leads"],
        description: "Plan upcoming shift schedules and coverage",
        meetingLink: "/meeting/shift-planning",
        recurring: "biweekly",
        priority: "medium",
      },
      {
        id: "sample-5",
        title: "New Employee Orientation",
        date: getDateString(5),
        time: "09:00",
        endTime: "12:00",
        type: "orientation",
        location: "Training Room",
        attendees: ["HR Manager", "New Hires"],
        description: "Orientation for new healthcare staff members",
        meetingLink: "/meeting/orientation",
        recurring: "none",
        priority: "high",
      },
      {
        id: "sample-6",
        title: "Patient Care Review",
        date: getDateString(0), // Today
        time: "11:00",
        endTime: "12:00",
        type: "meeting",
        location: "Video Conference",
        attendees: ["Dr. Wilson", "Care Team"],
        description: "Weekly patient care coordination meeting",
        meetingLink: "/meeting/care-review",
        recurring: "weekly",
        priority: "high",
      },
      {
        id: "sample-7",
        title: "Staff Meeting",
        date: getDateString(7),
        time: "10:00",
        endTime: "11:00",
        type: "meeting",
        location: "Main Conference Room",
        attendees: ["All Staff"],
        description: "Monthly all-hands staff meeting",
        meetingLink: "/meeting/staff-meeting",
        recurring: "monthly",
        priority: "medium",
      },
    ]
  }

  // Fetch events from API
  const fetchEvents = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/communications/meetings?upcoming=true")
      const data = await res.json()
      
      if (data.success && data.meetings && data.meetings.length > 0) {
        // Convert meetings to calendar events format
        const calendarEvents = data.meetings.map((meeting: any) => ({
          id: meeting.id,
          title: meeting.title,
          date: meeting.date,
          time: convertTo24Hour(meeting.time),
          endTime: calculateEndTime(meeting.time, meeting.durationMinutes || 30),
          type: meeting.type || "meeting",
          location: "Video Conference",
          attendees: meeting.participantNames || [],
          description: meeting.agenda || meeting.description || "",
          meetingLink: meeting.meetingLink,
          recurring: "none",
          priority: meeting.type === "urgent" ? "high" : "medium",
        }))
        setEvents([...calendarEvents, ...generateSampleEvents()])
      } else {
        setEvents(generateSampleEvents())
      }
    } catch (error) {
      console.error("Error fetching events:", error)
      setEvents(generateSampleEvents())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  // Handle event creation success
  const handleEventCreated = () => {
    setShowEventDialog(false)
    fetchEvents() // Refresh events list
  }

  // Navigation handlers
  const goToPrevious = () => {
    if (!currentDate) return
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    if (!currentDate) return
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Event click handler
  const handleEventClick = (event: any) => {
    setSelectedEvent(event)
    // Event Detail Dialog now uses selectedEvent state directly
  }

  // Get display title based on view mode
  const getDisplayTitle = () => {
    if (!currentDate) return ""
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    } else if (viewMode === "week") {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    } else {
      return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    }
  }

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

  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (time: string) => {
    if (!time) return "09:00"
    // If already in 24-hour format
    if (!time.includes("AM") && !time.includes("PM")) {
      return time.includes(":") ? time : "09:00"
    }
    const [timePart, period] = time.split(" ")
    const [hours, minutes] = timePart.split(":")
    let hour = parseInt(hours)
    if (period === "PM" && hour !== 12) hour += 12
    if (period === "AM" && hour === 12) hour = 0
    return `${hour.toString().padStart(2, "0")}:${minutes}`
  }

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const time24 = convertTo24Hour(startTime)
    const [hours, minutes] = time24.split(":").map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHour = Math.floor(totalMinutes / 60) % 24
    const endMinute = totalMinutes % 60
    return `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`
  }

  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const copyMeetingLink = (link: string) => {
    const fullLink = link.startsWith("http") ? link : `${window.location.origin}${link}`
    navigator.clipboard.writeText(fullLink)
    alert("Meeting link copied!")
  }

  const sendCalendarInvite = (event: any) => {
    console.log("Sending calendar invite for:", event.title)
    // In real app, this would generate and send calendar invites
    alert(`Calendar invite for "${event.title}" would be sent`)
  }

  // Handle joining a meeting - shows video call directly on Schedule page
  const handleJoinMeeting = (event: any) => {
    console.log("🎥 [SCHEDULE] Joining meeting:", event)
    
    // Set active meeting data
    setActiveMeeting({
      id: event.id,
      title: event.title,
      meetingLink: event.meetingLink,
      durationMinutes: event.durationMinutes || 0, // 0 means no time limit
      participants: event.attendees || [],
      type: event.type,
    })
    
    // Show video call
    setShowVideoCall(true)
    
    // Close event dialog if open
    setSelectedEvent(null)
  }

  // Handle ending/closing the video call
  const handleEndCall = () => {
    console.log("🔴 [SCHEDULE] Ending call")
    setShowVideoCall(false)
    setActiveMeeting(null)
  }

  // If video call is active, show full screen video call - using Schedule's OWN component
  if (showVideoCall && activeMeeting) {
    return (
      <ScheduleVideoCall
        meetingId={activeMeeting.id}
        meetingTitle={activeMeeting.title || "Meeting"}
        participants={activeMeeting.participants?.map((p: any, i: number) => 
          typeof p === 'string' 
            ? { id: `participant-${i}`, name: p } 
            : { id: p.id || `participant-${i}`, name: p.name || p }
        ) || []}
        durationMinutes={activeMeeting.durationMinutes || 0}
        onEndCall={handleEndCall}
      />
    )
  }

  // Show loading until hydrated to prevent mismatch
  if (!mounted || !currentDate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    )
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Create New Event
                    </DialogTitle>
                    <DialogDescription>Schedule a new meeting, appointment, or event. Events will be saved to the database.</DialogDescription>
                  </DialogHeader>
                  <EventForm onSave={handleEventCreated} onCancel={() => setShowEventDialog(false)} />
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
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={goToPrevious}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h2 className="text-lg font-semibold min-w-[200px] text-center">
                        {getDisplayTitle()}
                      </h2>
                      <Button variant="outline" size="sm" onClick={goToNext}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday}>
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
                    <Button variant="outline" size="sm" onClick={() => setShowNewEventDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Grid */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading calendar...</span>
                  </div>
                ) : (
                  <CalendarGrid 
                    events={events} 
                    viewMode={viewMode} 
                    currentDate={currentDate} 
                    onEventClick={handleEventClick}
                    onJoinMeeting={handleJoinMeeting}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Event Detail Dialog */}
          <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedEvent?.type === "meeting" && <Video className="h-5 w-5 text-blue-600" />}
                  {selectedEvent?.type === "training" && <Users className="h-5 w-5 text-green-600" />}
                  {selectedEvent?.type === "evaluation" && <Clock className="h-5 w-5 text-purple-600" />}
                  {selectedEvent?.title}
                </DialogTitle>
                <DialogDescription>Event Details</DialogDescription>
              </DialogHeader>
              {selectedEvent && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Date</Label>
                      <p className="font-medium">{new Date(selectedEvent.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Time</Label>
                      <p className="font-medium">{formatTime(selectedEvent.time)} - {formatTime(selectedEvent.endTime)}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Location</Label>
                    <p className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selectedEvent.location}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Description</Label>
                    <p className="text-gray-700">{selectedEvent.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Attendees</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedEvent.attendees?.map((attendee: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{attendee}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Badge className={getPriorityColor(selectedEvent.priority)}>{selectedEvent.priority}</Badge>
                    <Badge variant="outline">{selectedEvent.type}</Badge>
                    {selectedEvent.recurring !== "none" && (
                      <Badge variant="outline">🔄 {selectedEvent.recurring}</Badge>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    {selectedEvent.meetingLink && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => copyMeetingLink(selectedEvent.meetingLink)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                        <Button size="sm" onClick={() => handleJoinMeeting(selectedEvent)}>
                          <Video className="h-4 w-4 mr-2" />
                          Join Meeting
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <TabsContent value="upcoming" className="space-y-6">
            <UpcomingEventsTab events={events} isLoading={isLoading} onJoinMeeting={handleJoinMeeting} />
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

// Upcoming Events Tab Component
function UpcomingEventsTab({ events, isLoading, onJoinMeeting }: { events: any[]; isLoading: boolean; onJoinMeeting: (event: any) => void }) {
  const [filterType, setFilterType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filter events to only show upcoming ones
  const upcomingEvents = events
    .filter((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= today
    })
    .filter((event) => {
      if (filterType !== "all" && event.type !== filterType) return false
      if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime())

  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === now.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting": return "bg-blue-50 border-blue-200 hover:bg-blue-100"
      case "training": return "bg-green-50 border-green-200 hover:bg-green-100"
      case "evaluation": return "bg-purple-50 border-purple-200 hover:bg-purple-100"
      case "planning": return "bg-orange-50 border-orange-200 hover:bg-orange-100"
      case "orientation": return "bg-cyan-50 border-cyan-200 hover:bg-cyan-100"
      default: return "bg-gray-50 border-gray-200 hover:bg-gray-100"
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "meeting": return <Video className="h-5 w-5 text-blue-600" />
      case "training": return <Users className="h-5 w-5 text-green-600" />
      case "evaluation": return <Clock className="h-5 w-5 text-purple-600" />
      case "planning": return <Calendar className="h-5 w-5 text-orange-600" />
      case "orientation": return <Users className="h-5 w-5 text-cyan-600" />
      default: return <Calendar className="h-5 w-5 text-gray-600" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge className="bg-red-100 text-red-700">High</Badge>
      case "medium": return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>
      case "low": return <Badge className="bg-green-100 text-green-700">Low</Badge>
      default: return null
    }
  }

  const copyMeetingLink = (link: string) => {
    const fullLink = link.startsWith("http") ? link : `${window.location.origin}${link}`
    navigator.clipboard.writeText(fullLink)
    alert("Meeting link copied to clipboard!")
  }

  const handleJoinMeeting = (event: any) => {
    // Call parent's join meeting handler to show video call directly on Schedule page
    onJoinMeeting(event)
  }

  // Group events by date
  const groupedEvents = upcomingEvents.reduce((groups: any, event) => {
    const date = event.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
    return groups
  }, {})

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Your scheduled meetings and appointments</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {/* Type filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="meeting">Meetings</option>
                <option value="training">Training</option>
                <option value="evaluation">Evaluations</option>
                <option value="planning">Planning</option>
                <option value="orientation">Orientation</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading events...</span>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Events</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterType !== "all" 
                  ? "No events match your filters. Try adjusting your search."
                  : "You don't have any scheduled events coming up."}
              </p>
              <Button onClick={() => window.location.href = "/communications"}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule a Meeting
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([date, dateEvents]: [string, any]) => (
                <div key={date}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-20 text-center">
                      <div className="text-xs text-gray-500 uppercase">{formatDate(date)}</div>
                      <div className="text-2xl font-bold text-gray-900">{new Date(date).getDate()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-3 ml-24">
                    {dateEvents.map((event: any) => (
                      <div 
                        key={event.id} 
                        className={`p-4 border rounded-xl transition-all duration-200 ${getEventTypeColor(event.type)}`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              {getEventIcon(event.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                {getPriorityBadge(event.priority)}
                                <Badge variant="outline" className="text-xs">{event.type}</Badge>
                                {event.recurring && event.recurring !== "none" && (
                                  <Badge variant="outline" className="text-xs">🔄 {event.recurring}</Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatTime(event.time)} - {formatTime(event.endTime)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </span>
                                {event.attendees && event.attendees.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {event.attendees.length} attendee{event.attendees.length !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
                            {event.meetingLink && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyMeetingLink(event.meetingLink)}
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy Link
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => handleJoinMeeting(event)}
                                >
                                  <Video className="h-4 w-4 mr-1" />
                                  Join
                                </Button>
                              </>
                            )}
                            {!event.meetingLink && (
                              <Button size="sm" variant="outline">
                                <Bell className="h-4 w-4 mr-1" />
                                Set Reminder
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick stats */}
      {!isLoading && upcomingEvents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {upcomingEvents.filter(e => e.type === "meeting").length}
              </div>
              <div className="text-sm text-blue-700">Meetings</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {upcomingEvents.filter(e => e.type === "training").length}
              </div>
              <div className="text-sm text-green-700">Training Sessions</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {upcomingEvents.filter(e => e.type === "evaluation").length}
              </div>
              <div className="text-sm text-purple-700">Evaluations</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {upcomingEvents.filter(e => formatDate(e.date) === "Today").length}
              </div>
              <div className="text-sm text-orange-700">Today's Events</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Calendar Grid Component
function CalendarGrid({ events, viewMode, currentDate, onEventClick, onJoinMeeting }: { events: any[]; viewMode: string; currentDate: Date; onEventClick?: (event: any) => void; onJoinMeeting?: (event: any) => void }) {
  if (viewMode === "month") {
    return <MonthView events={events} currentDate={currentDate} onEventClick={onEventClick} />
  } else if (viewMode === "week") {
    return <WeekView events={events} currentDate={currentDate} onEventClick={onEventClick} />
  } else {
    return <DayView events={events} currentDate={currentDate} onEventClick={onEventClick} onJoinMeeting={onJoinMeeting} />
  }
}

// Month View Component
function MonthView({ events, currentDate, onEventClick }: { events: any[]; currentDate: Date; onEventClick?: (event: any) => void }) {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)
  const today = new Date()
  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    )
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((event) => event.date === dateStr)
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "meeting": return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "training": return "bg-green-100 text-green-800 hover:bg-green-200"
      case "evaluation": return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      case "planning": return "bg-orange-100 text-orange-800 hover:bg-orange-200"
      case "orientation": return "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  return (
    <div className="p-4">
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty days */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-28 p-1 bg-gray-50 rounded"></div>
        ))}

        {/* Days with events */}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day)
          return (
            <div 
              key={day} 
              className={`h-28 p-1.5 border rounded-lg transition-all hover:shadow-md ${
                isToday(day) 
                  ? "bg-blue-50 border-blue-300" 
                  : "bg-white border-gray-200 hover:border-blue-200"
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${isToday(day) ? "text-blue-600" : "text-gray-700"}`}>
                {isToday(day) ? (
                  <span className="flex items-center gap-1">
                    {day}
                    <span className="text-xs font-normal text-blue-500">Today</span>
                  </span>
                ) : day}
              </div>
              <div className="space-y-1 overflow-hidden">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className={`text-xs p-1 rounded truncate cursor-pointer transition-colors ${getEventColor(event.type)}`}
                    title={`${event.title} - ${event.time}`}
                  >
                    <span className="font-medium">{event.time?.slice(0, 5)}</span> {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Week View Component
function WeekView({ events, currentDate, onEventClick }: { events: any[]; currentDate: Date; onEventClick?: (event: any) => void }) {
  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - currentDate.getDay())
  const today = new Date()

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    return day
  })

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return events.filter((event) => event.date === dateStr)
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "meeting": return "bg-blue-100 text-blue-800 border-blue-200"
      case "training": return "bg-green-100 text-green-800 border-green-200"
      case "evaluation": return "bg-purple-100 text-purple-800 border-purple-200"
      case "planning": return "bg-orange-100 text-orange-800 border-orange-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="p-4">
      {/* Week header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day, idx) => (
          <div 
            key={idx} 
            className={`p-3 text-center rounded-lg ${
              isToday(day) ? "bg-blue-100 border-2 border-blue-400" : "bg-gray-50"
            }`}
          >
            <div className="text-xs text-gray-500 uppercase">
              {day.toLocaleDateString("en-US", { weekday: "short" })}
            </div>
            <div className={`text-lg font-semibold ${isToday(day) ? "text-blue-600" : "text-gray-900"}`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Events grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, idx) => {
          const dayEvents = getEventsForDay(day)
          return (
            <div key={idx} className="min-h-[300px] bg-gray-50 rounded-lg p-2">
              {dayEvents.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4">No events</div>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={`p-2 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getEventColor(event.type)}`}
                    >
                      <div className="text-xs font-semibold">{event.time?.slice(0, 5)}</div>
                      <div className="text-sm font-medium truncate">{event.title}</div>
                      <div className="text-xs truncate">{event.location}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Day View Component
function DayView({ events, currentDate, onEventClick, onJoinMeeting }: { events: any[]; currentDate: Date; onEventClick?: (event: any) => void; onJoinMeeting?: (event: any) => void }) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7 AM to 6 PM
  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`
  const dayEvents = events.filter((event) => event.date === dateStr)

  const getEventColor = (type: string) => {
    switch (type) {
      case "meeting": return "bg-blue-100 text-blue-800 border-l-4 border-blue-500"
      case "training": return "bg-green-100 text-green-800 border-l-4 border-green-500"
      case "evaluation": return "bg-purple-100 text-purple-800 border-l-4 border-purple-500"
      case "planning": return "bg-orange-100 text-orange-800 border-l-4 border-orange-500"
      default: return "bg-gray-100 text-gray-800 border-l-4 border-gray-500"
    }
  }

  const getEventsForHour = (hour: number) => {
    return dayEvents.filter((event) => {
      const eventHour = parseInt(event.time?.split(":")[0] || "0")
      return eventHour === hour
    })
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-6">
        {/* Time slots with events */}
        <div className="col-span-2 space-y-1">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(hour)
            return (
              <div key={hour} className="flex items-stretch min-h-[60px] border-b border-gray-100">
                <div className="w-20 py-2 text-sm text-gray-500 font-medium">
                  {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                </div>
                <div className="flex-1 py-1 px-2">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={`p-2 rounded cursor-pointer hover:shadow-md transition-shadow ${getEventColor(event.type)}`}
                    >
                      <div className="font-medium text-sm">{event.title}</div>
                      <div className="text-xs">{event.time} - {event.endTime} • {event.location}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Events summary */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            <div className="text-sm text-gray-600 mb-4">
              {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""} scheduled
            </div>
            
            {dayEvents.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No events for this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className={`p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getEventColor(event.type)}`}
                  >
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-xs mt-1">
                      {event.time} - {event.endTime}
                    </p>
                    <p className="text-xs">{event.location}</p>
                    {event.meetingLink && onJoinMeeting && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2 w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          onJoinMeeting(event)
                        }}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Meeting
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Event Form Component
function EventForm({ onSave, onCancel }: { onSave: () => void; onCancel?: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    endTime: "",
    type: "meeting",
    location: "Video Conference",
    attendees: [] as string[],
    description: "",
    recurring: "none",
    priority: "medium",
  })
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Get today's date for min date validation
  const today = new Date().toISOString().split("T")[0]

  // Load current user
  useEffect(() => {
    const userData = localStorage.getItem('currentStaff')
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  // Fetch staff members from database
  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoadingStaff(true)
      try {
        let staffData: any[] = []
        
        // Try staff list API
        try {
          const res = await fetch("/api/staff/list")
          const data = await res.json()
          if (data.staff && data.staff.length > 0) {
            staffData = data.staff
          }
        } catch (err) {
          console.log("Staff list API failed")
        }
        
        // Fallback to care team API
        if (staffData.length === 0) {
          try {
            const res2 = await fetch("/api/staff/care-team")
            const data2 = await res2.json()
            if (data2.staff && data2.staff.length > 0) {
              staffData = data2.staff
            }
          } catch (err) {
            console.log("Care team API failed")
          }
        }
        
        if (staffData.length > 0) {
          const formattedStaff = staffData.map((s: any) => ({
            id: s.id,
            name: s.name || s.full_name || "Unknown",
            role: s.role_id || s.role || s.department || "Staff",
            email: s.email || "",
          }))
          setStaffMembers(formattedStaff)
        } else {
          // Fallback sample staff
          setStaffMembers([
            { id: "sample-1", name: "Dr. Wilson", role: "Doctor", email: "wilson@example.com" },
            { id: "sample-2", name: "Sarah Johnson", role: "Nurse", email: "sarah@example.com" },
            { id: "sample-3", name: "Michael Chen", role: "Caregiver", email: "michael@example.com" },
            { id: "sample-4", name: "Emily Davis", role: "Admin", email: "emily@example.com" },
          ])
        }
      } catch (error) {
        console.error("Error fetching staff:", error)
      } finally {
        setIsLoadingStaff(false)
      }
    }
    fetchStaff()
  }, [])

  const eventTypes = [
    { value: "meeting", label: "Meeting", icon: "🎥" },
    { value: "training", label: "Training", icon: "📚" },
    { value: "evaluation", label: "Evaluation", icon: "📋" },
    { value: "planning", label: "Planning", icon: "📊" },
    { value: "orientation", label: "Orientation", icon: "👋" },
  ]

  // Calculate duration in minutes from start and end time
  const calculateDuration = () => {
    if (!formData.time || !formData.endTime) return 30
    const [startHour, startMin] = formData.time.split(":").map(Number)
    const [endHour, endMin] = formData.endTime.split(":").map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    return Math.max(endMinutes - startMinutes, 15)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validation
    if (!formData.title.trim()) {
      setError("Please enter an event title")
      return
    }
    if (!formData.date) {
      setError("Please select a date")
      return
    }
    if (!formData.time) {
      setError("Please select a start time")
      return
    }

    setIsSubmitting(true)
    
    try {
      // Prepare meeting data for API
      const meetingData = {
        title: formData.title,
        description: formData.description,
        agenda: formData.description,
        organizerId: currentUser?.id || staffMembers[0]?.id || null,
        date: formData.date,
        time: formData.time,
        durationMinutes: calculateDuration(),
        meetingType: formData.type,
        isRecurring: formData.recurring !== "none",
        recurrencePattern: formData.recurring !== "none" ? formData.recurring : null,
        participantIds: formData.attendees,
      }

      console.log("Creating event with data:", meetingData)

      const res = await fetch("/api/communications/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meetingData),
      })

      const data = await res.json()

      if (data.success) {
        alert(`Event "${formData.title}" created successfully!`)
        onSave()
      } else {
        throw new Error(data.error || "Failed to create event")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      setError(error instanceof Error ? error.message : "Failed to create event")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleAttendee = (staffId: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(staffId)
        ? prev.attendees.filter(id => id !== staffId)
        : [...prev.attendees, staffId]
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <Label htmlFor="title">Event Title <span className="text-red-500">*</span></Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter event title"
            className="mt-1"
          />
        </div>

        {/* Date */}
        <div>
          <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
          <Input
            id="date"
            type="date"
            min={today}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="mt-1"
          />
        </div>

        {/* Event Type */}
        <div>
          <Label htmlFor="type">Event Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Time */}
        <div>
          <Label htmlFor="time">Start Time <span className="text-red-500">*</span></Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="mt-1"
          />
        </div>

        {/* End Time */}
        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="mt-1"
          />
          {formData.time && formData.endTime && (
            <p className="text-xs text-gray-500 mt-1">Duration: {calculateDuration()} minutes</p>
          )}
        </div>

        {/* Location */}
        <div className="md:col-span-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Conference room, video link, etc."
            className="mt-1"
          />
        </div>

        {/* Attendees */}
        <div className="md:col-span-2">
          <Label>Attendees ({formData.attendees.length} selected)</Label>
          {isLoadingStaff ? (
            <div className="mt-2 p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading staff...</p>
            </div>
          ) : (
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {staffMembers.map((member) => (
                <div 
                  key={member.id} 
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    formData.attendees.includes(member.id) 
                      ? "bg-blue-100 border border-blue-300" 
                      : "bg-white border border-gray-200 hover:bg-gray-100"
                  }`}
                  onClick={() => toggleAttendee(member.id)}
                >
                  <input
                    type="checkbox"
                    checked={formData.attendees.includes(member.id)}
                    onChange={() => {}}
                    className="rounded text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{member.name}</div>
                    <div className="text-xs text-gray-500">{member.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Label htmlFor="description">Description / Agenda</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Event description and agenda..."
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Recurring & Priority */}
        <div>
          <Label htmlFor="recurring">Recurring</Label>
          <Select value={formData.recurring} onValueChange={(value) => setFormData({ ...formData, recurring: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">🔘 No Repeat</SelectItem>
              <SelectItem value="daily">📅 Daily</SelectItem>
              <SelectItem value="weekly">📆 Weekly</SelectItem>
              <SelectItem value="biweekly">📅 Bi-weekly</SelectItem>
              <SelectItem value="monthly">🗓️ Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">🟢 Low</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="high">🔴 High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Create Event
            </>
          )}
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
