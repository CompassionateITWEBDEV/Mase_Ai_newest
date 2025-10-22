"use client"

import React from "react"

import type {} from "react"

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
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Video,
  Calendar,
  MessageSquare,
  Phone,
  Users,
  Clock,
  Send,
  Plus,
  Share2,
  Monitor,
  Mic,
  MicOff,
  VideoOff,
  PhoneCall,
  Copy,
  User,
  Settings,
} from "lucide-react"
import NextLink from "next/link"

export default function Communications() {
  const [activeTab, setActiveTab] = useState("messages")
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  // Mock data for conversations
  const conversations = [
    {
      id: 1,
      type: "direct",
      name: "Dr. Wilson",
      role: "Medical Director",
      lastMessage: "Can we schedule a meeting to discuss the new protocols?",
      timestamp: "2 hours ago",
      unread: 2,
      online: true,
      avatar: "DW",
    },
    {
      id: 2,
      type: "group",
      name: "Nursing Team",
      participants: ["Sarah Johnson", "Michael Chen", "Emily Davis", "Lisa Garcia"],
      lastMessage: "Training materials have been updated",
      timestamp: "4 hours ago",
      unread: 0,
      avatar: "NT",
    },
    {
      id: 3,
      type: "direct",
      name: "Sarah Johnson",
      role: "Registered Nurse",
      lastMessage: "I've completed the HIPAA training module",
      timestamp: "1 day ago",
      unread: 1,
      online: false,
      avatar: "SJ",
    },
    {
      id: 4,
      type: "group",
      name: "Management Team",
      participants: ["Dr. Wilson", "HR Manager", "Quality Director"],
      lastMessage: "Monthly review meeting scheduled for Friday",
      timestamp: "2 days ago",
      unread: 0,
      avatar: "MT",
    },
  ]

  // Mock data for scheduled meetings
  const scheduledMeetings = [
    {
      id: 1,
      title: "Weekly Team Standup",
      date: "2024-01-15",
      time: "09:00 AM",
      duration: "30 minutes",
      participants: ["Dr. Wilson", "Sarah Johnson", "Michael Chen", "Emily Davis"],
      type: "recurring",
      meetingLink: "https://meet.irishtriplets.com/weekly-standup",
      status: "scheduled",
      agenda: "Review weekly goals, discuss patient assignments, address any concerns",
    },
    {
      id: 2,
      title: "HIPAA Compliance Training",
      date: "2024-01-16",
      time: "02:00 PM",
      duration: "60 minutes",
      participants: ["All Staff"],
      type: "training",
      meetingLink: "https://meet.irishtriplets.com/hipaa-training",
      status: "scheduled",
      agenda: "Annual HIPAA compliance training and Q&A session",
    },
    {
      id: 3,
      title: "Performance Review - Sarah Johnson",
      date: "2024-01-17",
      time: "10:00 AM",
      duration: "45 minutes",
      participants: ["Dr. Wilson", "Sarah Johnson", "HR Manager"],
      type: "evaluation",
      meetingLink: "https://meet.irishtriplets.com/performance-review-sj",
      status: "scheduled",
      agenda: "Annual performance evaluation and goal setting",
    },
  ]

  // Mock data for messages
  const messages = [
    {
      id: 1,
      sender: "Dr. Wilson",
      content: "Can we schedule a meeting to discuss the new protocols?",
      timestamp: "2024-01-15 14:30",
      type: "text",
    },
    {
      id: 2,
      sender: "You",
      content: "Sure, I'm available tomorrow afternoon. Would 2 PM work?",
      timestamp: "2024-01-15 14:35",
      type: "text",
    },
    {
      id: 3,
      sender: "Dr. Wilson",
      content: "Perfect. I'll send a calendar invite with the video meeting link.",
      timestamp: "2024-01-15 14:37",
      type: "text",
    },
    {
      id: 4,
      sender: "Dr. Wilson",
      content: "Meeting scheduled: Protocol Review - Jan 16, 2 PM",
      timestamp: "2024-01-15 14:38",
      type: "meeting_invite",
      meetingData: {
        title: "Protocol Review Meeting",
        date: "2024-01-16",
        time: "2:00 PM",
        link: "https://meet.irishtriplets.com/protocol-review",
      },
    },
  ]

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage)
      setNewMessage("")
    }
  }

  const handleScheduleMeeting = (meetingData: any) => {
    console.log("Scheduling meeting:", meetingData)
    setShowScheduleDialog(false)
  }

  const handleStartVideoCall = () => {
    setShowVideoCall(true)
  }

  const handleJoinMeeting = (meetingLink: string) => {
    console.log("Joining meeting:", meetingLink)
    setShowVideoCall(true)
  }

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link)
    // Show toast notification
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <NextLink href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </NextLink>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Communications</h1>
                <p className="text-gray-600">Messages, video calls, and meeting scheduling</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleStartVideoCall}>
                <Video className="h-4 w-4 mr-2" />
                Start Video Call
              </Button>
              <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Schedule New Meeting</DialogTitle>
                    <DialogDescription>Create a video meeting and send invites to participants</DialogDescription>
                  </DialogHeader>
                  <ScheduleMeetingForm onSchedule={handleScheduleMeeting} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="assignments">Task Assignments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Conversations List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Conversations</span>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      New Chat
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                          selectedConversation?.id === conversation.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{conversation.avatar}</span>
                            </div>
                            {conversation.type === "direct" && conversation.online && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">{conversation.name}</p>
                              <div className="flex items-center space-x-2">
                                {conversation.unread > 0 && (
                                  <Badge className="bg-red-500 text-white text-xs">{conversation.unread}</Badge>
                                )}
                                <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                              </div>
                            </div>
                            {conversation.role && <p className="text-xs text-gray-500">{conversation.role}</p>}
                            <p className="text-sm text-gray-600 truncate mt-1">{conversation.lastMessage}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Chat Area */}
              <Card className="lg:col-span-2">
                {selectedConversation ? (
                  <>
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{selectedConversation.avatar}</span>
                          </div>
                          <div>
                            <h3 className="font-medium">{selectedConversation.name}</h3>
                            {selectedConversation.role && (
                              <p className="text-sm text-gray-500">{selectedConversation.role}</p>
                            )}
                            {selectedConversation.type === "group" && (
                              <p className="text-sm text-gray-500">
                                {selectedConversation.participants.length} participants
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={handleStartVideoCall}>
                            <Video className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col h-96">
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender === "You" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender === "You" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              {message.type === "meeting_invite" ? (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium">Meeting Invitation</span>
                                  </div>
                                  <div className="text-sm">
                                    <p className="font-medium">{message.meetingData?.title}</p>
                                    <p>
                                      {message.meetingData?.date} at {message.meetingData?.time}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={message.sender === "You" ? "secondary" : "default"}
                                    onClick={() => handleJoinMeeting(message.meetingData?.link || "")}
                                  >
                                    Join Meeting
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-sm">{message.content}</p>
                              )}
                              <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Message Input */}
                      <div className="border-t p-4">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                            className="flex-1"
                          />
                          <Button onClick={handleSendMessage}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Select a conversation to start messaging</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="meetings" className="space-y-6">
            {/* Upcoming Meetings */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
                <CardDescription>Scheduled video conferences and team meetings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduledMeetings.map((meeting) => (
                    <div key={meeting.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Video className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{meeting.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {meeting.date}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {meeting.time} ({meeting.duration})
                              </span>
                              <span className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {Array.isArray(meeting.participants)
                                  ? meeting.participants.length
                                  : meeting.participants}{" "}
                                participants
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{meeting.agenda}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              meeting.type === "training"
                                ? "bg-green-100 text-green-800"
                                : meeting.type === "evaluation"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                            }
                          >
                            {meeting.type}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => copyMeetingLink(meeting.meetingLink)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </Button>
                          <Button size="sm" onClick={() => handleJoinMeeting(meeting.meetingLink)}>
                            <Video className="h-4 w-4 mr-2" />
                            Join
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Video className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Start Instant Meeting</h3>
                  <p className="text-sm text-gray-600 mb-4">Begin a video call immediately</p>
                  <Button onClick={handleStartVideoCall} className="w-full">
                    Start Now
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Schedule Meeting</h3>
                  <p className="text-sm text-gray-600 mb-4">Plan a future video conference</p>
                  <Button variant="outline" onClick={() => setShowScheduleDialog(true)} className="w-full">
                    Schedule
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Share2 className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Join by Link</h3>
                  <p className="text-sm text-gray-600 mb-4">Enter a meeting ID or link</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    Join Meeting
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <TaskAssignments />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <CommunicationSettings />
          </TabsContent>
        </Tabs>

        {/* Video Call Modal */}
        {showVideoCall && (
          <VideoCallInterface
            isOpen={showVideoCall}
            onClose={() => setShowVideoCall(false)}
            isVideoEnabled={isVideoEnabled}
            setIsVideoEnabled={setIsVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            setIsAudioEnabled={setIsAudioEnabled}
            isScreenSharing={isScreenSharing}
            setIsScreenSharing={setIsScreenSharing}
          />
        )}
      </main>
    </div>
  )
}

// Schedule Meeting Form Component
function ScheduleMeetingForm({ onSchedule }: { onSchedule: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    duration: "30",
    participants: [] as string[],
    agenda: "",
    recurring: false,
    sendInvites: true,
  })

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
    const meetingData = {
      ...formData,
      meetingLink: `https://meet.irishtriplets.com/${Date.now()}`,
    }
    onSchedule(meetingData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="title">Meeting Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter meeting title"
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
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="duration">Duration</Label>
          <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Participants</Label>
          <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
            {staffMembers.map((member) => (
              <div key={member} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={member}
                  checked={formData.participants.includes(member)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        participants: [...formData.participants, member],
                      })
                    } else {
                      setFormData({
                        ...formData,
                        participants: formData.participants.filter((p) => p !== member),
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
          <Label htmlFor="agenda">Agenda</Label>
          <Textarea
            id="agenda"
            value={formData.agenda}
            onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
            placeholder="Meeting agenda and topics to discuss..."
            rows={3}
          />
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="recurring"
              checked={formData.recurring}
              onCheckedChange={(checked) => setFormData({ ...formData, recurring: checked })}
            />
            <Label htmlFor="recurring">Recurring meeting</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="sendInvites"
              checked={formData.sendInvites}
              onCheckedChange={(checked) => setFormData({ ...formData, sendInvites: checked })}
            />
            <Label htmlFor="sendInvites">Send calendar invites to participants</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>
    </form>
  )
}

// Enhanced Video Call Interface Component
function VideoCallInterface({
  isOpen,
  onClose,
  isVideoEnabled,
  setIsVideoEnabled,
  isAudioEnabled,
  setIsAudioEnabled,
  isScreenSharing,
  setIsScreenSharing,
}: {
  isOpen: boolean
  onClose: () => void
  isVideoEnabled: boolean
  setIsVideoEnabled: (enabled: boolean) => void
  isAudioEnabled: boolean
  setIsAudioEnabled: (enabled: boolean) => void
  isScreenSharing: boolean
  setIsScreenSharing: (sharing: boolean) => void
}) {
  const [participants, setParticipants] = useState([
    { id: 1, name: "You", isHost: true, videoEnabled: isVideoEnabled, audioEnabled: isAudioEnabled },
    { id: 2, name: "Dr. Wilson", isHost: false, videoEnabled: true, audioEnabled: true, isPresenting: false },
    { id: 3, name: "Sarah Johnson", isHost: false, videoEnabled: true, audioEnabled: false, isPresenting: false },
    { id: 4, name: "Michael Chen", isHost: false, videoEnabled: false, audioEnabled: true, isPresenting: false },
  ])
  const [showParticipants, setShowParticipants] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "Dr. Wilson", message: "Good morning everyone!", timestamp: "09:01" },
    { id: 2, sender: "Sarah Johnson", message: "Ready to discuss the new protocols", timestamp: "09:02" },
  ])
  const [newChatMessage, setNewChatMessage] = useState("")
  const [callDuration, setCallDuration] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState("excellent")

  // Simulate call duration timer
  React.useEffect(() => {
    if (isOpen) {
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isOpen])

  // Update your participant when video/audio changes
  React.useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === 1 ? { ...p, videoEnabled: isVideoEnabled, audioEnabled: isAudioEnabled } : p)),
    )
  }, [isVideoEnabled, isAudioEnabled])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        // In a real app, this would use navigator.mediaDevices.getDisplayMedia()
        console.log("Starting screen share...")
        setIsScreenSharing(true)
        // Simulate screen sharing setup
        setTimeout(() => {
          console.log("Screen sharing started successfully")
        }, 1000)
      } catch (error) {
        console.error("Failed to start screen sharing:", error)
      }
    } else {
      setIsScreenSharing(false)
      console.log("Screen sharing stopped")
    }
  }

  const sendChatMessage = () => {
    if (newChatMessage.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        sender: "You",
        message: newChatMessage,
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      }
      setChatMessages([...chatMessages, newMessage])
      setNewChatMessage("")
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    console.log(isRecording ? "Recording stopped" : "Recording started")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg w-full max-w-7xl h-5/6 flex flex-col text-white">
        {/* Video Call Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${connectionQuality === "excellent" ? "bg-green-500" : connectionQuality === "good" ? "bg-yellow-500" : "bg-red-500"}`}
              ></div>
              <span className="text-sm">Connection: {connectionQuality}</span>
            </div>
            <div className="text-sm">Duration: {formatDuration(callDuration)}</div>
            {isRecording && (
              <div className="flex items-center space-x-1 text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Recording</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <h3 className="font-medium">Healthcare Team Meeting</h3>
            <Badge className="bg-blue-600">{participants.length} participants</Badge>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-white hover:bg-gray-700">
            ✕
          </Button>
        </div>

        <div className="flex-1 flex">
          {/* Main Video Area */}
          <div className="flex-1 p-4">
            {isScreenSharing ? (
              /* Screen Share View */
              <div className="h-full bg-gray-800 rounded-lg relative">
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded text-sm">
                  Dr. Wilson is presenting
                </div>
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="h-24 w-24 mx-auto mb-4 text-gray-400" />
                    <p className="text-xl mb-2">Screen Sharing Active</p>
                    <p className="text-gray-400">Viewing Dr. Wilson's screen</p>
                    <div className="mt-6 p-4 bg-gray-700 rounded-lg max-w-md mx-auto">
                      <h3 className="font-medium mb-2">Patient Care Protocol Updates</h3>
                      <div className="space-y-2 text-sm text-left">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Updated HIPAA compliance procedures</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span>New medication administration guidelines</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Emergency response protocol changes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participant thumbnails during screen share */}
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  {participants.slice(0, 3).map((participant) => (
                    <div key={participant.id} className="w-24 h-16 bg-gray-700 rounded relative">
                      <div className="w-full h-full flex items-center justify-center">
                        {participant.videoEnabled ? (
                          <User className="h-6 w-6 text-gray-400" />
                        ) : (
                          <VideoOff className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="absolute bottom-1 left-1 text-xs bg-black bg-opacity-50 px-1 rounded">
                        {participant.name === "You" ? "You" : participant.name.split(" ")[0]}
                      </div>
                      {!participant.audioEnabled && (
                        <div className="absolute top-1 right-1">
                          <MicOff className="h-3 w-3 text-red-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Regular Video Grid */
              <div className="grid grid-cols-2 gap-4 h-full">
                {/* Your Video (Main) */}
                <div className="bg-gray-800 rounded-lg relative flex items-center justify-center">
                  {isVideoEnabled ? (
                    <div className="text-center">
                      <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-16 w-16 text-white" />
                      </div>
                      <p className="text-lg">You</p>
                      <div className="mt-2 flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-300">Speaking</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <VideoOff className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg">Camera Off</p>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    You {participants.find((p) => p.id === 1)?.isHost && "(Host)"}
                  </div>
                  {!isAudioEnabled && (
                    <div className="absolute top-4 right-4">
                      <MicOff className="h-5 w-5 text-red-400" />
                    </div>
                  )}
                </div>

                {/* Other Participants */}
                <div className="grid grid-cols-1 gap-2">
                  {participants.slice(1).map((participant) => (
                    <div
                      key={participant.id}
                      className="bg-gray-800 rounded-lg relative flex items-center justify-center h-32"
                    >
                      <div className="text-center">
                        {participant.videoEnabled ? (
                          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <User className="h-8 w-8 text-white" />
                          </div>
                        ) : (
                          <VideoOff className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        )}
                        <p className="text-sm">{participant.name.split(" ")[0]}</p>
                      </div>
                      <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 px-1 rounded">
                        {participant.name}
                      </div>
                      {!participant.audioEnabled && (
                        <div className="absolute top-2 right-2">
                          <MicOff className="h-4 w-4 text-red-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side Panel for Chat/Participants */}
          {(showChat || showParticipants) && (
            <div className="w-80 bg-gray-800 border-l border-gray-700">
              {showChat && (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="font-medium">Meeting Chat</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span className="font-medium">{msg.sender}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-700">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type a message..."
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Button size="sm" onClick={sendChatMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {showParticipants && (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="font-medium">Participants ({participants.length})</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{participant.name}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            {participant.isHost && <Badge className="bg-yellow-600 text-xs">Host</Badge>}
                            <span className={participant.audioEnabled ? "text-green-400" : "text-red-400"}>
                              {participant.audioEnabled ? "🎤" : "🔇"}
                            </span>
                            <span className={participant.videoEnabled ? "text-green-400" : "text-red-400"}>
                              {participant.videoEnabled ? "📹" : "📹❌"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Video Call Controls */}
        <div className="p-4 bg-gray-800 rounded-b-lg">
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center space-x-3">
              <Button
                variant={isAudioEnabled ? "default" : "destructive"}
                size="lg"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className="relative"
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>

              <Button
                variant={isVideoEnabled ? "default" : "destructive"}
                size="lg"
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              >
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>

              <Button
                variant={isScreenSharing ? "default" : "outline"}
                size="lg"
                onClick={handleScreenShare}
                className={isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <Monitor className="h-5 w-5" />
                {isScreenSharing && <span className="ml-2 text-sm">Stop Sharing</span>}
              </Button>
            </div>

            {/* Center Controls */}
            <div className="flex items-center space-x-3">
              <Button
                variant={showParticipants ? "default" : "outline"}
                size="lg"
                onClick={() => {
                  setShowParticipants(!showParticipants)
                  setShowChat(false)
                }}
              >
                <Users className="h-5 w-5" />
                <span className="ml-2 text-sm">{participants.length}</span>
              </Button>

              <Button
                variant={showChat ? "default" : "outline"}
                size="lg"
                onClick={() => {
                  setShowChat(!showChat)
                  setShowParticipants(false)
                }}
              >
                <MessageSquare className="h-5 w-5" />
                {chatMessages.length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs">{chatMessages.length}</Badge>
                )}
              </Button>

              <Button variant={isRecording ? "destructive" : "outline"} size="lg" onClick={toggleRecording}>
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${isRecording ? "bg-white animate-pulse" : "bg-red-500"}`}
                ></div>
                {isRecording ? "Stop" : "Record"}
              </Button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="lg" title="Settings">
                <Settings className="h-5 w-5" />
              </Button>

              <Button variant="destructive" size="lg" onClick={onClose}>
                <PhoneCall className="h-5 w-5" />
                <span className="ml-2">End Call</span>
              </Button>
            </div>
          </div>

          {/* Call Quality Indicator */}
          <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Audio: Good</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Video: HD</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Network: 45ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Task Assignments Component
function TaskAssignments() {
  const assignments = [
    {
      id: 1,
      title: "Complete HIPAA Training Module",
      assignedTo: "Sarah Johnson",
      assignedBy: "Dr. Wilson",
      dueDate: "2024-01-20",
      priority: "high",
      status: "in-progress",
      description: "Complete the annual HIPAA privacy and security training module",
    },
    {
      id: 2,
      title: "Review Patient Care Protocols",
      assignedTo: "Michael Chen",
      assignedBy: "Quality Director",
      dueDate: "2024-01-18",
      priority: "medium",
      status: "pending",
      description: "Review updated patient care protocols and provide feedback",
    },
    {
      id: 3,
      title: "Prepare Monthly Report",
      assignedTo: "Emily Davis",
      assignedBy: "HR Manager",
      dueDate: "2024-01-25",
      priority: "low",
      status: "completed",
      description: "Compile monthly performance metrics and compliance data",
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task Assignments</CardTitle>
              <CardDescription>Manage and track team assignments</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Assignment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{assignment.title}</h3>
                    <p className="text-sm text-gray-600">
                      Assigned to: <span className="font-medium">{assignment.assignedTo}</span> by{" "}
                      {assignment.assignedBy}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={
                        assignment.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : assignment.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }
                    >
                      {assignment.priority}
                    </Badge>
                    <Badge
                      className={
                        assignment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : assignment.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }
                    >
                      {assignment.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Due: {assignment.dueDate}</span>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Communication Settings Component
function CommunicationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    meetingReminders: true,
    taskAssignments: true,
    messagePreview: true,
    onlineStatus: true,
    autoJoinMeetings: false,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Configure how you receive communications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-gray-600">Browser push notifications</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">SMS Notifications</Label>
                <p className="text-sm text-gray-600">Text message alerts</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Meeting Reminders</Label>
                <p className="text-sm text-gray-600">Reminders for scheduled meetings</p>
              </div>
              <Switch
                checked={settings.meetingReminders}
                onCheckedChange={(checked) => setSettings({ ...settings, meetingReminders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Task Assignments</Label>
                <p className="text-sm text-gray-600">Notifications for new task assignments</p>
              </div>
              <Switch
                checked={settings.taskAssignments}
                onCheckedChange={(checked) => setSettings({ ...settings, taskAssignments: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control your privacy and availability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Message Preview</Label>
                <p className="text-sm text-gray-600">Show message content in notifications</p>
              </div>
              <Switch
                checked={settings.messagePreview}
                onCheckedChange={(checked) => setSettings({ ...settings, messagePreview: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Online Status</Label>
                <p className="text-sm text-gray-600">Show when you're online to others</p>
              </div>
              <Switch
                checked={settings.onlineStatus}
                onCheckedChange={(checked) => setSettings({ ...settings, onlineStatus: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Auto-join Meetings</Label>
                <p className="text-sm text-gray-600">Automatically join scheduled meetings</p>
              </div>
              <Switch
                checked={settings.autoJoinMeetings}
                onCheckedChange={(checked) => setSettings({ ...settings, autoJoinMeetings: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  )
}
