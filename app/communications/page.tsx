"use client"

import React, { useState, useEffect, useCallback } from "react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
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
  RefreshCw,
  Loader2,
  Search,
  Check,
  UserCircle,
  LogIn,
} from "lucide-react"
import NextLink from "next/link"
import { PeerJSVideoCall } from "@/components/telehealth/PeerJSVideoCall"

export default function Communications() {
  const { toast } = useToast()
  
  // Hydration fix - only render after mounted on client
  const [mounted, setMounted] = useState(false)
  
  const [activeTab, setActiveTab] = useState("messages")
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callInfo, setCallInfo] = useState<{
    type: "direct" | "group"
    participants: any[]
    conversationName: string
  } | null>(null)

  // State for real data
  const [conversations, setConversations] = useState<any[]>([])
  const [scheduledMeetings, setScheduledMeetings] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // New Chat dialog state
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [showUserSelectDialog, setShowUserSelectDialog] = useState(false)
  const [availableStaff, setAvailableStaff] = useState<any[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(false)
  const [staffSearchQuery, setStaffSearchQuery] = useState("")
  const [selectedStaffForChat, setSelectedStaffForChat] = useState<any[]>([])
  const [newGroupName, setNewGroupName] = useState("")
  const [chatType, setChatType] = useState<"direct" | "group">("direct")
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  
  // Incoming call state
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [showIncomingCallDialog, setShowIncomingCallDialog] = useState(false)
  const [activeCallId, setActiveCallId] = useState<string | null>(null)
  const [activePeerSessionId, setActivePeerSessionId] = useState<string | null>(null)
  const [isCalleeAccepted, setIsCalleeAccepted] = useState(false) // Track if this user accepted an incoming call
  const incomingRingtoneRef = React.useRef<NodeJS.Timeout | null>(null)
  const incomingAudioContextRef = React.useRef<AudioContext | null>(null)

  // Set mounted after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get current user from localStorage or show selection
  useEffect(() => {
    const storedUser = localStorage.getItem("communicationsUser")
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Error parsing current user:", e)
        setShowUserSelectDialog(true)
      }
    } else {
      // Show user select dialog if no user is set
      setShowUserSelectDialog(true)
    }
  }, [])

  // Fetch available staff for user selection and new chat
  const fetchAvailableStaff = useCallback(async () => {
    try {
      setIsLoadingStaff(true)
      const excludeParam = currentUser?.id ? `?exclude=${currentUser.id}` : ""
      const res = await fetch(`/api/communications/staff${excludeParam}`, { cache: "no-store" })
      const data = await res.json()
      
      if (data.success) {
        setAvailableStaff(data.staff || [])
      }
    } catch (error) {
      console.error("Error fetching staff:", error)
    } finally {
      setIsLoadingStaff(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    fetchAvailableStaff()
  }, [fetchAvailableStaff])

  // Poll for incoming calls
  useEffect(() => {
    if (!currentUser?.id) return

    const checkIncomingCalls = async () => {
      try {
        const res = await fetch(`/api/communications/calls?userId=${currentUser.id}`, { cache: "no-store" })
        const data = await res.json()
        
        if (data.incomingCalls && data.incomingCalls.length > 0) {
          const call = data.incomingCalls[0] // Get the first incoming call
          if (!incomingCall || incomingCall.id !== call.id) {
            console.log('📞 Incoming call from:', call.caller?.name)
            setIncomingCall(call)
            setShowIncomingCallDialog(true)
            // Start ringing sound
            playIncomingRingtone()
          }
        } else if (incomingCall) {
          // Call was cancelled or ended by caller
          stopIncomingRingtone()
          setIncomingCall(null)
          setShowIncomingCallDialog(false)
        }
      } catch (error) {
        console.error('Error checking incoming calls:', error)
      }
    }

    // Check immediately
    checkIncomingCalls()
    
    // Poll every 2 seconds
    const pollInterval = setInterval(checkIncomingCalls, 2000)

    return () => {
      clearInterval(pollInterval)
      stopIncomingRingtone()
    }
  }, [currentUser?.id, incomingCall])

  // Incoming call ringtone - DISABLED (no sound)
  const playIncomingRingtone = () => {
    // Ringtone disabled - no sound
    console.log('📞 Incoming call (ringtone disabled)')
  }

  const stopIncomingRingtone = () => {
    // Ringtone disabled - nothing to stop
    if (incomingRingtoneRef.current) {
      clearInterval(incomingRingtoneRef.current)
      incomingRingtoneRef.current = null
    }
    if (incomingAudioContextRef.current) {
      try { incomingAudioContextRef.current.close() } catch (e) {}
      incomingAudioContextRef.current = null
    }
  }

  // Handle accepting incoming call - goes directly to PeerJS video
  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return
    
    try {
      stopIncomingRingtone()
      
      // Update call status to accepted in DB
      const res = await fetch('/api/communications/calls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: incomingCall.id,
          action: 'accept',
          userId: currentUser?.id
        })
      })
      
      const data = await res.json()
      
      if (data.call) {
        const isGroupCall = incomingCall.call_type === 'group'
        console.log(`✅ [CALLEE] ${isGroupCall ? 'Group' : 'Direct'} call accepted, connecting to PeerJS...`)
        
        // For group calls, fetch all participants in this call session
        let allParticipants = [incomingCall.caller]
        if (isGroupCall && incomingCall.peer_session_id) {
          try {
            const participantsRes = await fetch(`/api/communications/calls/participants?peerSessionId=${incomingCall.peer_session_id}`)
            const participantsData = await participantsRes.json()
            if (participantsData.participants) {
              // Include all participants except current user
              allParticipants = participantsData.participants.filter((p: any) => p.id !== currentUser?.id)
              console.log('📞 [CALLEE] Found group participants:', allParticipants.map((p: any) => p.name))
            }
          } catch (err) {
            console.error('Error fetching group participants:', err)
          }
        }
        
        // Set up for PeerJS connection (skip ringing UI)
        setActivePeerSessionId(incomingCall.peer_session_id)
        setActiveCallId(incomingCall.id)
        setIsCalleeAccepted(true) // Mark this as callee accepting - will skip ringing
        setCallInfo({
          type: isGroupCall ? 'group' : 'direct',
          participants: allParticipants,
          conversationName: isGroupCall 
            ? (incomingCall.conversation_name || 'Group Call') 
            : (incomingCall.caller?.name || 'Incoming Call')
        })
        
        // Close the incoming call dialog
        setShowIncomingCallDialog(false)
        
        // Open video call - VideoCallInterface will go directly to PeerJS
        setShowVideoCall(true)
        
        toast({
          title: isGroupCall ? "Joining Call" : "Call Connected",
          description: isGroupCall 
            ? "Connecting to group call..." 
            : `Connecting with ${incomingCall.caller?.name}...`,
        })
      }
    } catch (error) {
      console.error('Error accepting call:', error)
      toast({
        title: "Error",
        description: "Failed to accept call",
        variant: "destructive"
      })
    }
  }

  // Handle rejecting incoming call
  const handleRejectIncomingCall = async () => {
    if (!incomingCall) return
    
    try {
      stopIncomingRingtone()
      
      await fetch('/api/communications/calls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: incomingCall.id,
          action: 'reject',
          userId: currentUser?.id
        })
      })
      
      setShowIncomingCallDialog(false)
      setIncomingCall(null)
      
      toast({
        title: "Call Declined",
        description: `You declined the call from ${incomingCall.caller?.name}`,
      })
    } catch (error) {
      console.error('Error rejecting call:', error)
    }
  }

  // Handle user selection (login as)
  const handleSelectUser = (staff: any) => {
    const userData = {
      id: staff.id,
      staffId: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
    }
    localStorage.setItem("communicationsUser", JSON.stringify(userData))
    setCurrentUser(userData)
    setShowUserSelectDialog(false)
    toast({
      title: "Logged In",
      description: `You are now messaging as ${staff.name}`,
    })
  }

  // Handle creating new conversation
  const handleCreateConversation = async () => {
    if (selectedStaffForChat.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one person to chat with",
        variant: "destructive",
      })
      return
    }

    if (chatType === "group" && !newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive",
      })
      return
    }

    setIsCreatingChat(true)
    try {
      const participantIds = [currentUser.id, ...selectedStaffForChat.map((s: any) => s.id)]

      const res = await fetch("/api/communications/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: chatType,
          name: chatType === "group" ? newGroupName : null,
          createdBy: currentUser.id,
          participantIds,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: data.existing ? "Chat Found" : "Chat Created",
          description: data.existing 
            ? "Opened existing conversation" 
            : `New ${chatType} chat created successfully`,
        })
        setShowNewChatDialog(false)
        setSelectedStaffForChat([])
        setNewGroupName("")
        setChatType("direct")
        await fetchConversations()
        
        // Auto-select the new conversation
        if (data.conversation) {
          setSelectedConversation(formatConversation(data.conversation))
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      })
    } finally {
      setIsCreatingChat(false)
    }
  }

  // Format conversation for display
  const formatConversation = (conv: any): any => {
    if (!conv.participants) return conv

    const otherParticipants = conv.participants.filter(
      (p: any) => p.staff?.id !== currentUser?.id
    )

    if (conv.type === "direct" && otherParticipants.length > 0) {
      const other = otherParticipants[0].staff
      return {
        ...conv,
        name: other?.name || "Unknown",
        avatar: getInitials(other?.name || "U"),
        role: other?.role || other?.credentials,
      }
    }

    return {
      ...conv,
      avatar: getInitials(conv.name || "Group"),
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Filter staff for search
  const filteredStaff = availableStaff.filter((staff) =>
    staff.name?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    staff.email?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    staff.role?.toLowerCase().includes(staffSearchQuery.toLowerCase())
  )

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUser?.id) {
      setIsLoadingConversations(false)
      return
    }

    try {
      setIsLoadingConversations(true)
      const staffId = currentUser.id
      const url = `/api/communications/conversations?staffId=${encodeURIComponent(staffId)}`
      
      const res = await fetch(url, { cache: "no-store" })
      const data = await res.json()
      
      if (data.success) {
        // Format conversations for display
        const formattedConvs = (data.conversations || []).map((conv: any) => formatConversation(conv))
        setConversations(formattedConvs)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [currentUser?.id])

  // Fetch meetings
  const fetchMeetings = async () => {
    try {
      setIsLoadingMeetings(true)
      const res = await fetch("/api/communications/meetings?upcoming=true", { cache: "no-store" })
      const data = await res.json()
      
      if (data.success) {
        setScheduledMeetings(data.meetings || [])
      }
    } catch (error) {
      console.error("Error fetching meetings:", error)
    } finally {
      setIsLoadingMeetings(false)
    }
  }

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true)
      const res = await fetch(`/api/communications/messages?conversationId=${conversationId}`, { cache: "no-store" })
      const data = await res.json()
      
      if (data.success) {
        setMessages(data.messages || getSampleMessages())
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      setMessages(getSampleMessages())
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Load data on mount and when user changes
  useEffect(() => {
    if (currentUser?.id) {
      fetchConversations()
      fetchMeetings()
    }
  }, [currentUser?.id, fetchConversations])

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id)
      // Mark conversation as read
      if (currentUser?.id && !selectedConversation.id.startsWith("sample")) {
        fetch("/api/communications/conversations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: selectedConversation.id,
            staffId: currentUser.id,
          }),
        }).catch(console.error)
      }
    }
  }, [selectedConversation?.id, currentUser?.id])

  // Sample messages for demo
  const getSampleMessages = () => [
    {
      id: 1,
      sender: { name: "Dr. Wilson" },
      content: "Can we schedule a meeting to discuss the new protocols?",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      message_type: "text",
    },
    {
      id: 2,
      sender: { name: "You" },
      content: "Sure, I'm available tomorrow afternoon. Would 2 PM work?",
      created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      message_type: "text",
    },
    {
      id: 3,
      sender: { name: "Dr. Wilson" },
      content: "Perfect. I'll send a calendar invite with the video meeting link.",
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      message_type: "text",
    },
  ]

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser?.id) return

    const messageContent = newMessage
    setIsSendingMessage(true)
    setNewMessage("")

    try {
      // For demo/sample conversations, add message locally only
      const newMsg = {
        id: Date.now(),
        sender: { name: currentUser.name || "You" },
        sender_id: currentUser.id,
        content: messageContent,
        created_at: new Date().toISOString(),
        message_type: "text",
      }
      setMessages((prev) => [...prev, newMsg])

      // If we have a real conversation, send to API
      if (selectedConversation.id && !selectedConversation.id.startsWith("sample")) {
        const res = await fetch("/api/communications/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: selectedConversation.id,
            senderId: currentUser.id,
            content: messageContent,
          }),
        })

        const data = await res.json()
        if (!data.success) {
          throw new Error(data.error)
        }

        // Refresh conversations to update last message
        fetchConversations()
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
      // Restore message on error
      setNewMessage(messageContent)
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Switch user handler
  const handleSwitchUser = () => {
    localStorage.removeItem("communicationsUser")
    setCurrentUser(null)
    setConversations([])
    setSelectedConversation(null)
    setMessages([])
    setShowUserSelectDialog(true)
  }

  const handleScheduleMeeting = async (meetingData: any) => {
    try {
      const staffId = currentUser?.staffId || currentUser?.id
      
      const res = await fetch("/api/communications/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...meetingData,
          organizerId: staffId,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: "Meeting Scheduled",
          description: `${meetingData.title} has been scheduled.`,
        })
        setShowScheduleDialog(false)
        await fetchMeetings()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      })
    }
  }

  // Start video call - can be direct (from conversation) or group (from header)
  const handleStartVideoCall = async (callType?: "direct" | "group", specificParticipants?: any[]) => {
    let participants: any[] = []
    let convName = "Call"
    let convType: "direct" | "group" = "group"
    
    if (selectedConversation) {
      // Called from a conversation - use conversation context
      const otherParticipants = selectedConversation.participants?.filter(
        (p: any) => p.staff?.id !== currentUser?.id
      ) || []
      
      participants = otherParticipants.map((p: any) => ({
        id: p.staff?.id || p.id,
        name: p.staff?.name || p.name || "Unknown",
        email: p.staff?.email || p.email,
      }))
      convName = selectedConversation.name || "Call"
      convType = selectedConversation.type || "direct"
    } else if (callType === "group" || specificParticipants) {
      participants = specificParticipants || []
      convName = "Team Meeting"
      convType = "group"
    } else {
      convName = "Video Meeting"
      convType = "group"
    }

    // Reset callee flag - this is an outgoing call
    setIsCalleeAccepted(false)

    // Create call sessions for all participants (works for both direct and group)
    if (participants.length > 0 && currentUser?.id) {
      try {
        // Generate a shared group session ID for group calls
        const groupSessionId = convType === "group" 
          ? `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          : undefined

        // Create a call session for each participant
        for (const participant of participants) {
          console.log('📞 Creating call to:', participant.name)
          const res = await fetch('/api/communications/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callerId: currentUser.id,
              calleeId: participant.id,
              conversationId: selectedConversation?.id,
              callType: convType,
              groupSessionId: groupSessionId // Share the same session for group calls
            })
          })
          
          const data = await res.json()
          
          if (data.call && !activeCallId) {
            // Store the first call ID for reference
            setActiveCallId(data.call.id)
            setActivePeerSessionId(groupSessionId || data.peerSessionId)
            console.log('📞 Call created:', data.call.id, 'Session:', groupSessionId || data.peerSessionId)
          }
        }
        
      } catch (error) {
        console.error('Error creating call:', error)
      }
    }

    setCallInfo({
      type: convType,
      participants,
      conversationName: convName,
    })
    setShowVideoCall(true)
  }

  // Start direct call to a specific person
  const handleStartDirectCall = async (person: any) => {
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "Please select your profile first",
        variant: "destructive"
      })
      return
    }

    // Reset callee flag - this is an outgoing call
    setIsCalleeAccepted(false)

    try {
      console.log('📞 Creating direct call to:', person.name)
      const res = await fetch('/api/communications/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerId: currentUser.id,
          calleeId: person.id,
          callType: 'direct'
        })
      })
      
      const data = await res.json()
      
      if (data.call) {
        setActiveCallId(data.call.id)
        setActivePeerSessionId(data.peerSessionId)
        console.log('📞 Direct call created:', data.call.id)
      }
    } catch (error) {
      console.error('Error creating direct call:', error)
    }

    setCallInfo({
      type: "direct",
      participants: [person],
      conversationName: person.name,
    })
    setShowVideoCall(true)
  }

  const handleJoinMeeting = (meetingLink: string) => {
    // Open meeting link in new tab or show video call interface
    if (meetingLink.startsWith("http")) {
      window.open(meetingLink, "_blank")
    } else {
      setCallInfo({
        type: "group",
        participants: [],
        conversationName: "Meeting",
      })
      setShowVideoCall(true)
    }
  }

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast({
      title: "Link Copied",
      description: "Meeting link copied to clipboard",
    })
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-500 mt-4">Loading Communications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Incoming Call Dialog */}
      <Dialog open={showIncomingCallDialog} onOpenChange={(open) => {
        if (!open) {
          handleRejectIncomingCall()
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Incoming Video Call</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            {/* Animated Avatar */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25"></div>
              <div className="absolute inset-2 bg-green-500 rounded-full animate-pulse opacity-50"></div>
              <Avatar className="relative w-24 h-24 border-4 border-green-500">
                <AvatarFallback className={`text-white text-3xl ${incomingCall?.call_type === 'group' ? 'bg-gradient-to-br from-blue-400 to-cyan-600' : 'bg-gradient-to-br from-green-400 to-green-600'}`}>
                  {incomingCall?.call_type === 'group' ? (
                    <Users className="h-10 w-10" />
                  ) : (
                    getInitials(incomingCall?.caller?.name || "?")
                  )}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {incomingCall?.call_type === 'group' 
                ? 'Group Call' 
                : (incomingCall?.caller?.name || "Unknown")}
            </h2>
            <p className="text-gray-500 mb-2">
              {incomingCall?.call_type === 'group' 
                ? `Started by ${incomingCall?.caller?.name}` 
                : (incomingCall?.caller?.department || "Staff Member")}
            </p>
            <div className="flex items-center justify-center gap-2 text-green-600 mb-8">
              <Phone className="h-5 w-5 animate-bounce" />
              <span className="text-lg font-medium">
                {incomingCall?.call_type === 'group' ? 'Incoming Group Call...' : 'Incoming Video Call...'}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-6">
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16"
                onClick={handleRejectIncomingCall}
              >
                <PhoneCall className="h-7 w-7 rotate-[135deg]" />
              </Button>
              <Button
                size="lg"
                className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
                onClick={handleAcceptIncomingCall}
              >
                <Video className="h-7 w-7" />
              </Button>
            </div>
            
            <div className="flex justify-center gap-8 mt-6 text-sm text-gray-500">
              <span>Decline</span>
              <span>Join</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Selection Dialog */}
      <Dialog open={showUserSelectDialog} onOpenChange={setShowUserSelectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Select Your Profile
            </DialogTitle>
            <DialogDescription>
              Choose your staff profile to access your messages and conversations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingStaff ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <p className="text-sm text-gray-500 mt-2">Loading staff members from database...</p>
              </div>
            ) : availableStaff.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Staff Members Found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  No active staff members were found in the database. 
                  Please ensure the staff table is set up and has active members.
                </p>
                <Button variant="outline" size="sm" onClick={fetchAvailableStaff}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {availableStaff.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => handleSelectUser(staff)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(staff.name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{staff.name}</p>
                        <p className="text-sm text-gray-500">{staff.role || staff.email}</p>
                        {staff.department && (
                          <p className="text-xs text-gray-400">{staff.department}</p>
                        )}
                      </div>
                      <Check className="h-5 w-5 text-gray-300" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Select people to start a conversation with
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Chat Type Selection */}
            <div className="flex gap-2">
              <Button
                variant={chatType === "direct" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setChatType("direct")
                  setSelectedStaffForChat([])
                }}
                className="flex-1"
              >
                <User className="h-4 w-4 mr-2" />
                Direct Message
              </Button>
              <Button
                variant={chatType === "group" ? "default" : "outline"}
                size="sm"
                onClick={() => setChatType("group")}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                Group Chat
              </Button>
            </div>

            {/* Group Name (for group chats) */}
            {chatType === "group" && (
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="Enter group name..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
            )}

            {/* Staff Search */}
            <div>
              <Label>Select {chatType === "direct" ? "Person" : "Members"}</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or role..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Selected Staff */}
            {selectedStaffForChat.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedStaffForChat.map((staff) => (
                  <Badge
                    key={staff.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() =>
                      setSelectedStaffForChat((prev) =>
                        prev.filter((s) => s.id !== staff.id)
                      )
                    }
                  >
                    {staff.name} ✕
                  </Badge>
                ))}
              </div>
            )}

            {/* Staff List */}
            <ScrollArea className="h-[200px] border rounded-lg">
              <div className="p-2 space-y-1">
                {isLoadingStaff ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : filteredStaff.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No staff found</div>
                ) : (
                  filteredStaff.map((staff) => {
                    const isSelected = selectedStaffForChat.some((s) => s.id === staff.id)
                    const isDisabled = chatType === "direct" && selectedStaffForChat.length > 0 && !isSelected

                    return (
                      <div
                        key={staff.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-100 border border-blue-300"
                            : isDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          if (isDisabled) return
                          if (isSelected) {
                            setSelectedStaffForChat((prev) =>
                              prev.filter((s) => s.id !== staff.id)
                            )
                          } else {
                            if (chatType === "direct") {
                              setSelectedStaffForChat([staff])
                            } else {
                              setSelectedStaffForChat((prev) => [...prev, staff])
                            }
                          }
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                            {getInitials(staff.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{staff.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {staff.role || staff.email}
                          </p>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>

            {/* Create Button */}
            <Button
              className="w-full"
              onClick={handleCreateConversation}
              disabled={
                isCreatingChat ||
                selectedStaffForChat.length === 0 ||
                (chatType === "group" && !newGroupName.trim())
              }
            >
              {isCreatingChat ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              {chatType === "direct" ? "Start Chat" : "Create Group"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <div className="flex items-center space-x-3">
              {/* Current User Display */}
              {currentUser && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {getInitials(currentUser.name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.role || "Staff"}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwitchUser}
                    className="ml-2 text-xs"
                  >
                    Switch
                  </Button>
                </div>
              )}
              <Button onClick={() => handleStartVideoCall("group")}>
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
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => fetchConversations()}>
                        <RefreshCw className={`h-4 w-4 ${isLoadingConversations ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedStaffForChat([])
                          setNewGroupName("")
                          setChatType("direct")
                          setStaffSearchQuery("")
                          setShowNewChatDialog(true)
                        }}
                        disabled={!currentUser}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Chat
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingConversations ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                      <p className="text-sm text-gray-500 mt-2">Loading conversations...</p>
                    </div>
                  ) : !currentUser ? (
                    <div className="p-4 text-center text-gray-500">
                      <UserCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select your profile to view conversations</p>
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setShowUserSelectDialog(true)}
                      >
                        Select Profile
                      </Button>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="mt-2"
                        onClick={() => setShowNewChatDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Start a Chat
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conversation) => {
                        const avatar = conversation.avatar || conversation.name?.substring(0, 2).toUpperCase() || "?"
                        const timestamp = conversation.timestamp || (conversation.lastMessageTime 
                          ? new Date(conversation.lastMessageTime).toLocaleDateString() 
                          : "")
                        
                        return (
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
                                  <span className="text-sm font-medium text-blue-600">{avatar}</span>
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
                                    <span className="text-xs text-gray-500">{timestamp}</span>
                                  </div>
                                </div>
                                {conversation.role && <p className="text-xs text-gray-500">{conversation.role}</p>}
                                {conversation.type === "group" && conversation.participants && (
                                  <p className="text-xs text-gray-500">
                                    {Array.isArray(conversation.participants) 
                                      ? `${conversation.participants.length} participants`
                                      : conversation.participants}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600 truncate mt-1">{conversation.lastMessage}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleStartVideoCall()}
                            title={selectedConversation?.type === "direct" ? "Video Call" : "Group Video Call"}
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStartVideoCall()}
                            title="Voice Call"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" title="Participants">
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col h-96">
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {isLoadingMessages ? (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <p>No messages yet. Start a conversation!</p>
                          </div>
                        ) : (
                          messages.map((message) => {
                            const senderName = message.sender?.name || message.sender || "Unknown"
                            const isYou = senderName === "You" || message.sender_id === currentUser?.id
                            const timestamp = message.created_at || message.timestamp
                            const messageType = message.message_type || message.type || "text"
                            
                            return (
                              <div
                                key={message.id}
                                className={`flex ${isYou ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    isYou ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                                  }`}
                                >
                                  {!isYou && (
                                    <p className="text-xs font-medium mb-1 opacity-80">{senderName}</p>
                                  )}
                                  {messageType === "meeting_invite" ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4" />
                                        <span className="font-medium">Meeting Invitation</span>
                                      </div>
                                      <div className="text-sm">
                                        <p className="font-medium">{message.metadata?.title || message.meetingData?.title}</p>
                                        <p>
                                          {message.metadata?.date || message.meetingData?.date} at {message.metadata?.time || message.meetingData?.time}
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant={isYou ? "secondary" : "default"}
                                        onClick={() => handleJoinMeeting(message.metadata?.link || message.meetingData?.link || "")}
                                      >
                                        Join Meeting
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className="text-sm">{message.content}</p>
                                  )}
                                  <p className="text-xs mt-1 opacity-70">
                                    {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </p>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="border-t p-4">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && !isSendingMessage && handleSendMessage()}
                            className="flex-1"
                            disabled={isSendingMessage}
                          />
                          <Button onClick={handleSendMessage} disabled={isSendingMessage || !newMessage.trim()}>
                            {isSendingMessage ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Meetings</CardTitle>
                    <CardDescription>Scheduled video conferences and team meetings</CardDescription>
                  </div>
                  <Button size="sm" variant="ghost" onClick={fetchMeetings}>
                    <RefreshCw className={`h-4 w-4 ${isLoadingMeetings ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingMeetings ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    <p className="text-sm text-gray-500 mt-2">Loading meetings...</p>
                  </div>
                ) : scheduledMeetings.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">No Upcoming Meetings</h3>
                    <p className="text-gray-600 mb-4">Schedule a meeting to see it here.</p>
                    <Button onClick={() => setShowScheduleDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Meeting
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledMeetings.map((meeting) => (
                      <div key={meeting.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
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
                              {meeting.agenda && <p className="text-sm text-gray-600 mt-2">{meeting.agenda}</p>}
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
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Video className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Start Instant Meeting</h3>
                  <p className="text-sm text-gray-600 mb-4">Begin a video call immediately</p>
                  <Button onClick={() => handleStartVideoCall("group")} className="w-full">
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
            onClose={() => {
              setShowVideoCall(false)
              setCallInfo(null)
              setIsCalleeAccepted(false)
            }}
            isVideoEnabled={isVideoEnabled}
            setIsVideoEnabled={setIsVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            setIsAudioEnabled={setIsAudioEnabled}
            isScreenSharing={isScreenSharing}
            setIsScreenSharing={setIsScreenSharing}
            callInfo={callInfo}
            currentUser={currentUser}
            activeCallId={activeCallId}
            activePeerSessionId={activePeerSessionId}
            incomingCall={incomingCall}
            isCalleeAccepted={isCalleeAccepted}
            onCallEnded={() => {
              setActiveCallId(null)
              setActivePeerSessionId(null)
              setIncomingCall(null)
              setIsCalleeAccepted(false)
            }}
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

// Enhanced Video Call Interface Component with Real Media
function VideoCallInterface({
  isOpen,
  onClose,
  isVideoEnabled,
  setIsVideoEnabled,
  isAudioEnabled,
  setIsAudioEnabled,
  isScreenSharing,
  setIsScreenSharing,
  callInfo,
  currentUser,
  activeCallId,
  activePeerSessionId,
  incomingCall,
  onCallEnded,
  isCalleeAccepted, // True when callee accepted an incoming call - skip ringing
}: {
  isOpen: boolean
  onClose: () => void
  isVideoEnabled: boolean
  setIsVideoEnabled: (enabled: boolean) => void
  isAudioEnabled: boolean
  setIsAudioEnabled: (enabled: boolean) => void
  isScreenSharing: boolean
  setIsScreenSharing: (sharing: boolean) => void
  callInfo: {
    type: "direct" | "group"
    participants: any[]
    conversationName: string
  } | null
  currentUser: any
  activeCallId?: string | null
  activePeerSessionId?: string | null
  incomingCall?: any
  onCallEnded?: () => void
  isCalleeAccepted?: boolean
}) {
  const { toast } = useToast()
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const screenRef = React.useRef<HTMLVideoElement>(null)
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null)
  const localStreamRef = React.useRef<MediaStream | null>(null)
  const screenStreamRef = React.useRef<MediaStream | null>(null)

  const isDirectCall = callInfo?.type === "direct"
  const callParticipants = callInfo?.participants || []

  // Build participants list based on call info
  const [participants, setParticipants] = useState(() => {
    const baseParticipants = [
      { id: 1, name: currentUser?.name || "You", isHost: true, videoEnabled: isVideoEnabled, audioEnabled: isAudioEnabled },
    ]
    
    if (callInfo?.participants && callInfo.participants.length > 0) {
      // Add actual participants from the call
      callInfo.participants.forEach((p, index) => {
        baseParticipants.push({
          id: index + 2,
          name: p.name || "Unknown",
          isHost: false,
          videoEnabled: true,
          audioEnabled: true,
        })
      })
    } else {
      // Default simulated participants for demo
      baseParticipants.push(
        { id: 2, name: "Dr. Wilson", isHost: false, videoEnabled: true, audioEnabled: true },
        { id: 3, name: "Sarah Johnson", isHost: false, videoEnabled: true, audioEnabled: false },
        { id: 4, name: "Michael Chen", isHost: false, videoEnabled: false, audioEnabled: true },
      )
    }
    
    return baseParticipants
  })
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
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [callState, setCallState] = useState<"calling" | "ringing" | "connected" | "ended">("calling")
  const [usePeerJSCall, setUsePeerJSCall] = useState(false)
  const [callSessionId, setCallSessionId] = useState<string>("")
  const ringtoneIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const callStatusPollRef = React.useRef<NodeJS.Timeout | null>(null)
  const activeAudioContextRef = React.useRef<AudioContext | null>(null)

  // Ringtone sound generator - DISABLED (no sound)
  const playRingtone = React.useCallback(() => {
    // Ringtone disabled - no sound
  }, [])

  const stopRingtone = React.useCallback(() => {
    console.log('🔕 Stopping ringtone IMMEDIATELY')
    
    // Clear the interval
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current)
      ringtoneIntervalRef.current = null
    }
    
    // IMMEDIATELY close any playing audio
    if (activeAudioContextRef.current) {
      try {
        activeAudioContextRef.current.close()
      } catch (e) {}
      activeAudioContextRef.current = null
    }
  }, [])

  // Play connected sound - DISABLED (no sound)
  const playConnectedSound = React.useCallback(() => {
    // Sound disabled
  }, [])

  // Initialize media stream when component opens
  React.useEffect(() => {
    if (isOpen) {
      initializeCall()
    }
    return () => {
      cleanupMedia()
    }
  }, [isOpen])

  const initializeCall = async () => {
    setIsInitializing(true)
    setMediaError(null)
    setCallState("calling")
    setCallDuration(0)
    setUsePeerJSCall(false)
    setCallSessionId("")

    try {
      // First, get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      })
      localStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setIsInitializing(false)

      // If callee accepted an incoming call, go DIRECTLY to PeerJS (no ringing)
      if (isCalleeAccepted && activePeerSessionId) {
        console.log('✅ [CALLEE] Skipping ringing, going directly to PeerJS...')
        playConnectedSound()
        setCallSessionId(activePeerSessionId)
        setUsePeerJSCall(true)
        setCallState("connected")
        return
      }

      // CALLER: Start PeerJS IMMEDIATELY so peer ID is in database
      // This works for BOTH direct and group calls!
      const usingPeerJS = activePeerSessionId ? true : false
      if (usingPeerJS) {
        console.log(`📞 [CALLER] Starting PeerJS for ${isDirectCall ? 'direct' : 'group'} call...`)
        setCallSessionId(activePeerSessionId)
        setUsePeerJSCall(true) // Start PeerJS right away!
      }
      
      // Show ringing state
      setCallState("ringing")

      // Show toast
      toast({
        title: isDirectCall ? "Calling..." : "Calling group members...",
        description: isDirectCall 
          ? `Waiting for ${callParticipants[0]?.name || "..."} to answer` 
          : `Waiting for ${callParticipants.length} member(s) to answer...`,
      })

      // Poll for call acceptance (both direct and group)
      if (activeCallId && activePeerSessionId) {
        console.log('📞 [CALLER] Starting to poll for call acceptance...')
        callStatusPollRef.current = setInterval(async () => {
          try {
            const res = await fetch(`/api/communications/calls?callId=${activeCallId}`)
            const data = await res.json()
            
            if (data.call?.status === 'accepted') {
              console.log('✅ [CALLER] Call accepted!')
              // Stop polling
              if (callStatusPollRef.current) {
                clearInterval(callStatusPollRef.current)
                callStatusPollRef.current = null
              }
              // Stop ringtone
              stopRingtone()
              playConnectedSound()
              // Update state to connected (PeerJS already running)
              setCallState("connected")
              toast({
                title: "Call Connected",
                description: `${callParticipants[0]?.name || "User"} answered!`,
              })
            } else if (data.call?.status === 'rejected' || data.call?.status === 'ended' || data.call?.status === 'missed') {
              console.log('❌ [CALLER] Call was declined or ended')
              if (callStatusPollRef.current) {
                clearInterval(callStatusPollRef.current)
                callStatusPollRef.current = null
              }
              stopRingtone()
              toast({
                title: "Call Ended",
                description: data.call?.status === 'rejected' ? "Call was declined" : "Call ended",
                variant: "destructive",
              })
              handleEndCall()
            }
          } catch (error) {
            console.error('Error polling call status:', error)
          }
        }, 2000) // Poll every 2 seconds
      }

    } catch (error: any) {
      console.error("Error accessing media devices:", error)
      
      // Provide specific error messages based on error type
      let errorMessage = "Could not access camera/microphone"
      let errorDescription = "Please check permissions and try again."
      
      if (error.name === 'NotReadableError' || error.message?.includes('Device in use')) {
        errorMessage = "Camera/Microphone is being used by another app"
        errorDescription = "Please close other video apps (Zoom, Teams, Discord, etc.) and try again."
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Permission denied"
        errorDescription = "Please allow camera and microphone access in your browser settings."
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = "No camera/microphone found"
        errorDescription = "Please connect a camera and microphone to use video calls."
      }
      
      setMediaError(errorMessage)
      setCallState("ended")
      toast({
        title: "Media Access Error",
        description: errorDescription,
        variant: "destructive",
      })
      setIsInitializing(false)
    }
  }

  const cleanupMedia = () => {
    console.log('🧹 Cleaning up media and stopping ringtone...')
    
    // Stop ringtone FIRST
    stopRingtone()
    
    // Stop call status polling
    if (callStatusPollRef.current) {
      clearInterval(callStatusPollRef.current)
      callStatusPollRef.current = null
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
    }
    
    setCallDuration(0)
    setCallState("calling")
    setUsePeerJSCall(false)
    setCallSessionId("")
  }

  // Stop ringtone when call connects OR when PeerJS video starts
  React.useEffect(() => {
    if (callState === "connected" || callState === "ended" || usePeerJSCall) {
      stopRingtone()
    }
  }, [callState, usePeerJSCall, stopRingtone])

  // Call duration timer - only counts when connected
  React.useEffect(() => {
    if (isOpen && callState === "connected") {
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isOpen, callState])

  // Update your participant when video/audio changes
  React.useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === 1 ? { ...p, videoEnabled: isVideoEnabled, audioEnabled: isAudioEnabled } : p)),
    )
  }, [isVideoEnabled, isAudioEnabled])

  // Toggle video track
  React.useEffect(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = isVideoEnabled
      } else if (isVideoEnabled) {
        // Need to add video track
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            const newVideoTrack = stream.getVideoTracks()[0]
            localStreamRef.current?.addTrack(newVideoTrack)
            if (videoRef.current && localStreamRef.current) {
              videoRef.current.srcObject = localStreamRef.current
            }
          })
          .catch(console.error)
      }
    }
  }, [isVideoEnabled])

  // Toggle audio track
  React.useEffect(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = isAudioEnabled
      }
    }
  }, [isAudioEnabled])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        })
        screenStreamRef.current = stream
        if (screenRef.current) {
          screenRef.current.srcObject = stream
        }
        setIsScreenSharing(true)
        
        // Listen for when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          screenStreamRef.current = null
        }

        toast({
          title: "Screen Sharing",
          description: "You are now sharing your screen",
        })
      } catch (error: any) {
        console.error("Failed to start screen sharing:", error)
        if (error.name !== "AbortError") {
          toast({
            title: "Screen Share Error",
            description: "Could not start screen sharing",
            variant: "destructive",
          })
        }
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop())
        screenStreamRef.current = null
      }
      setIsScreenSharing(false)
      toast({
        title: "Screen Sharing Stopped",
        description: "You have stopped sharing your screen",
      })
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
    toast({
      title: isRecording ? "Recording Stopped" : "Recording Started",
      description: isRecording ? "Recording has been saved" : "This meeting is being recorded",
    })
  }

  const handleEndCall = async () => {
    cleanupMedia()
    
    // End call in database if there's an active call
    if (activeCallId) {
      try {
        await fetch('/api/communications/calls', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callId: activeCallId,
            action: 'end'
          })
        })
        console.log('📞 Call ended in database')
      } catch (error) {
        console.error('Error ending call in database:', error)
      }
    }
    
    // Notify parent
    if (onCallEnded) {
      onCallEnded()
    }
    
    onClose()
    toast({
      title: "Call Ended",
      description: `Call duration: ${formatDuration(callDuration)}`,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg w-full max-w-7xl h-5/6 flex flex-col text-white">
        {/* Video Call Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-t-lg">
          <div className="flex items-center space-x-4">
            {callState === "connected" ? (
              <>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${connectionQuality === "excellent" ? "bg-green-500 animate-pulse" : connectionQuality === "good" ? "bg-yellow-500" : "bg-red-500"}`}
                  ></div>
                  <span className="text-sm">Connected</span>
                </div>
                <div className="text-sm font-mono bg-gray-700 px-2 py-1 rounded">
                  {formatDuration(callDuration)}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-sm">{callState === "ringing" ? "Ringing..." : "Connecting..."}</span>
              </div>
            )}
            {isRecording && callState === "connected" && (
              <div className="flex items-center space-x-1 text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">REC</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <h3 className="font-medium">
              {isDirectCall 
                ? `${callParticipants[0]?.name || "..."}`
                : callInfo?.conversationName || "Team Meeting"
              }
            </h3>
            {isDirectCall ? (
              <Badge className={callState === "connected" ? "bg-green-600" : "bg-yellow-600"}>
                {callState === "connected" ? "In Call" : "Calling"}
              </Badge>
            ) : (
              <Badge className="bg-blue-600">{participants.length} in meeting</Badge>
            )}
          </div>
          <Button variant="ghost" onClick={handleEndCall} className="text-white hover:bg-gray-700">
            ✕
          </Button>
        </div>

        <div className="flex-1 flex">
          {/* Main Video Area */}
          <div className="flex-1 p-4">
            {isInitializing ? (
              /* Initializing - Getting Camera/Mic */
              <div className="h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-xl mb-2">Setting up call...</p>
                  <p className="text-gray-400">Accessing camera and microphone</p>
                </div>
              </div>
            ) : callState === "calling" || callState === "ringing" ? (
              /* Calling/Ringing State */
              <div className="h-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Animated background rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-72 h-72 border-2 border-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                  <div className="absolute w-56 h-56 border-2 border-blue-500/30 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                  <div className="absolute w-40 h-40 border-2 border-blue-500/40 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                </div>

                <div className="text-center z-10 max-w-lg">
                  {isDirectCall ? (
                    <>
                      {/* Direct Call - Show person being called */}
                      <div className="w-40 h-40 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30 animate-pulse">
                        <User className="h-20 w-20 text-white" />
                      </div>
                      <p className="text-3xl font-semibold mb-2">{callParticipants[0]?.name || "Unknown"}</p>
                      <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                        <Phone className="h-5 w-5 animate-bounce" />
                        <p className="text-xl">{callState === "ringing" ? "Ringing..." : "Calling..."}</p>
                      </div>
                      <p className="text-gray-400 mb-6">Waiting for {callParticipants[0]?.name || "them"} to answer</p>

                      {/* Your video preview */}
                      <div className="w-48 h-36 mx-auto bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 mb-4">
                        {isVideoEnabled && localStreamRef.current ? (
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-700">
                            <VideoOff className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-8">Your camera preview</p>

                      {/* Caller just sees waiting - call auto-connects when callee accepts */}
                      <div className="flex items-center justify-center gap-4">
                        <Button 
                          variant="destructive" 
                          size="lg"
                          onClick={handleEndCall}
                        >
                          <PhoneCall className="h-5 w-5 mr-2" />
                          Cancel Call
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-4">Call will connect automatically when {callParticipants[0]?.name || "they"} answers</p>
                    </>
                  ) : (
                    <>
                      {/* Group Call - Show participants being called */}
                      <div className="w-40 h-40 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30 animate-pulse">
                        <Users className="h-20 w-20 text-white" />
                      </div>
                      <p className="text-3xl font-semibold mb-2">{callInfo?.conversationName || "Group Call"}</p>
                      <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                        <Phone className="h-5 w-5 animate-bounce" />
                        <p className="text-xl">Calling {callParticipants.length} member{callParticipants.length !== 1 ? 's' : ''}...</p>
                      </div>
                      
                      {/* Show who's being called */}
                      {callParticipants.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                          {callParticipants.slice(0, 5).map((p: any, i: number) => (
                            <div key={i} className="bg-gray-800/60 px-3 py-1 rounded-full text-sm">
                              {p.name}
                            </div>
                          ))}
                          {callParticipants.length > 5 && (
                            <div className="bg-gray-800/60 px-3 py-1 rounded-full text-sm">
                              +{callParticipants.length - 5} more
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-gray-400 mb-6">Waiting for them to answer...</p>

                      {/* Your video preview */}
                      <div className="w-48 h-36 mx-auto bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 mb-4">
                        {isVideoEnabled && localStreamRef.current ? (
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-700">
                            <VideoOff className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-6">Your camera preview</p>

                      {/* Action buttons */}
                      <div className="flex items-center justify-center gap-4">
                        <Button 
                          variant="destructive" 
                          size="lg"
                          onClick={handleEndCall}
                        >
                          <PhoneCall className="h-5 w-5 mr-2" />
                          Cancel Call
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-4">Call will start when someone answers</p>
                    </>
                  )}
                </div>
              </div>
            ) : mediaError ? (
              /* Error State */
              <div className="h-full bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center max-w-md">
                  <VideoOff className="h-16 w-16 mx-auto mb-4 text-red-400" />
                  <p className="text-xl mb-2 text-red-400">Media Access Error</p>
                  <p className="text-gray-400 mb-4">{mediaError}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Please ensure you have granted camera and microphone permissions in your browser settings.
                  </p>
                  <Button onClick={initializeMedia} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Connection
                  </Button>
                </div>
              </div>
            ) : isScreenSharing ? (
              /* Screen Share View */
              <div className="h-full bg-gray-800 rounded-lg relative overflow-hidden">
                <div className="absolute top-4 left-4 bg-blue-600 px-3 py-1 rounded text-sm z-10 flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  You are sharing your screen
                </div>
                <video
                  ref={screenRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />

                {/* Your video thumbnail during screen share */}
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-600 z-10">
                  {isVideoEnabled ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <VideoOff className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 text-xs bg-black bg-opacity-50 px-1 rounded">
                    You
                  </div>
                  {!isAudioEnabled && (
                    <div className="absolute top-1 right-1">
                      <MicOff className="h-3 w-3 text-red-400" />
                    </div>
                  )}
                </div>
              </div>
            ) : usePeerJSCall ? (
              /* REAL VIDEO CALL with PeerJS - Shows during ringing (caller) and connected (both) */
              <div className="h-full w-full relative">
                <PeerJSVideoCall
                  consultationId={activePeerSessionId || callSessionId}
                  participantName={currentUser?.name || "User"}
                  participantRole={isCalleeAccepted ? "callee" : "caller"}
                  remoteName={isCalleeAccepted ? (incomingCall?.caller?.name || callInfo?.conversationName) : (callInfo?.participants?.[0]?.name || callInfo?.conversationName || "Unknown")}
                  callId={activeCallId || undefined}
                  callerId={!isCalleeAccepted ? currentUser?.id : undefined}
                  isGroupCall={callInfo?.type === "group"}
                  participants={callInfo?.participants || []}
                  onConnected={() => {
                    // Video connected! Stop ringing and update state
                    console.log('✅ [VIDEO] PeerJS video connected!')
                    stopRingtone()
                    setCallState("connected")
                  }}
                  onCallEnd={async () => {
                    // End call in database
                    if (activeCallId) {
                      try {
                        await fetch('/api/communications/calls', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            callId: activeCallId,
                            action: 'end'
                          })
                        })
                      } catch (error) {
                        console.error('Error ending call:', error)
                      }
                    }
                    setUsePeerJSCall(false)
                    handleEndCall()
                  }}
                />
                {/* Ringing overlay for caller */}
                {callState === "ringing" && !incomingCall && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
                    <div className="animate-pulse mb-4">
                      <Phone className="h-16 w-16 text-green-400" />
                    </div>
                    <p className="text-white text-xl mb-2">Calling {callInfo?.participants?.[0]?.name || "..."}...</p>
                    <p className="text-gray-400 text-sm mb-6">Waiting for answer</p>
                    <Button
                      variant="destructive"
                      size="lg"
                      className="rounded-full"
                      onClick={() => {
                        stopRingtone()
                        handleEndCall()
                      }}
                    >
                      <PhoneCall className="h-5 w-5 mr-2 rotate-[135deg]" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ) : callState === "connected" && isDirectCall ? (
              /* DIRECT CALL CONNECTED (1-on-1) - Fallback UI */
              <div className="h-full grid grid-cols-2 gap-4">
                {/* Remote Person Video */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg relative overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      {/* Remote user avatar with speaking indicator */}
                      <div className="relative">
                        <div className="w-36 h-36 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/30">
                          <User className="h-20 w-20 text-white" />
                        </div>
                        {/* Speaking animation bars */}
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-1 rounded-full">
                          <div className="w-1.5 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-5 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
                          <div className="w-1.5 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                          <div className="w-1.5 h-6 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                          <div className="w-1.5 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                        </div>
                      </div>
                      <p className="text-2xl font-semibold mt-8">{callParticipants[0]?.name || "Connected"}</p>
                      <p className="text-gray-400 mt-1">Remote Camera</p>
                    </div>
                  </div>
                  {/* Remote user info badge */}
                  <div className="absolute bottom-4 left-4 text-sm bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">{callParticipants[0]?.name || "Remote"}</span>
                    <Mic className="h-4 w-4 text-green-400" />
                  </div>
                  {/* Call duration on remote side */}
                  <div className="absolute top-4 left-4 text-sm bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-mono">{formatDuration(callDuration)}</span>
                  </div>
                </div>

                {/* Your Video (Equal Size) */}
                <div className="bg-gray-800 rounded-lg relative overflow-hidden">
                  {isVideoEnabled ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                      <div className="text-center">
                        <div className="w-36 h-36 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30">
                          <User className="h-20 w-20 text-white" />
                        </div>
                        <p className="text-2xl font-semibold mt-8">You</p>
                        <p className="text-gray-400 mt-1">Camera Off</p>
                      </div>
                    </div>
                  )}
                  {/* Your info badge */}
                  <div className="absolute bottom-4 left-4 text-sm bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                    <span className="font-medium">You</span>
                    {isVideoEnabled && <Video className="h-4 w-4 text-green-400" />}
                  </div>
                  {/* Your media status */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {isVideoEnabled ? (
                      <div className="bg-green-500/80 backdrop-blur-sm p-2 rounded-lg">
                        <Video className="h-5 w-5 text-white" />
                      </div>
                    ) : (
                      <div className="bg-red-500/80 backdrop-blur-sm p-2 rounded-lg">
                        <VideoOff className="h-5 w-5 text-white" />
                      </div>
                    )}
                    {isAudioEnabled ? (
                      <div className="bg-green-500/80 backdrop-blur-sm p-2 rounded-lg">
                        <Mic className="h-5 w-5 text-white" />
                      </div>
                    ) : (
                      <div className="bg-red-500/80 backdrop-blur-sm p-2 rounded-lg">
                        <MicOff className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : callState === "connected" ? (
              /* GROUP CALL - Grid layout with all participants */
              <div className="h-full bg-gray-900 rounded-lg relative overflow-hidden flex flex-col">
                {/* Meeting Header */}
                <div className="bg-gray-800/90 backdrop-blur-sm px-4 py-3 flex justify-between items-center border-b border-gray-700">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{callInfo?.conversationName || "Group Call"}</h3>
                    <p className="text-xs text-gray-400">
                      {(callInfo?.participants?.length || 0) + 1} participants in call
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Live
                    </div>
                    <span className="text-white font-mono bg-black/40 px-2 py-1 rounded">
                      {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Participants Grid */}
                <div className="flex-1 p-4 overflow-auto">
                  <div className={`grid gap-3 h-full ${
                    (callInfo?.participants?.length || 0) === 0 ? 'grid-cols-1' :
                    (callInfo?.participants?.length || 0) === 1 ? 'grid-cols-2' :
                    (callInfo?.participants?.length || 0) <= 3 ? 'grid-cols-2' :
                    'grid-cols-3'
                  }`}>
                    {/* Your Video (Host) */}
                    <div className="bg-gray-800 rounded-xl relative overflow-hidden min-h-[200px]">
                      {isVideoEnabled ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
                          <div className="text-center">
                            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-3xl font-bold text-white">
                                {currentUser?.name?.charAt(0)?.toUpperCase() || 'Y'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Name Label */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium text-sm">
                            {currentUser?.name || 'You'} (You)
                          </span>
                          <div className="flex gap-1">
                            {!isAudioEnabled && <MicOff className="h-4 w-4 text-red-400" />}
                            {!isVideoEnabled && <VideoOff className="h-4 w-4 text-red-400" />}
                          </div>
                        </div>
                      </div>
                      {/* Host Badge */}
                      <div className="absolute top-2 left-2 bg-blue-600 px-2 py-0.5 rounded text-xs text-white">
                        Host
                      </div>
                    </div>

                    {/* Other Participants */}
                    {callInfo?.participants?.map((participant: any, index: number) => {
                      const colors = [
                        "from-purple-600 to-purple-800",
                        "from-green-600 to-green-800",
                        "from-orange-600 to-orange-800",
                        "from-pink-600 to-pink-800",
                        "from-cyan-600 to-cyan-800",
                        "from-indigo-600 to-indigo-800",
                      ]
                      return (
                        <div 
                          key={participant.id || index} 
                          className="bg-gray-800 rounded-xl relative overflow-hidden min-h-[200px]"
                        >
                          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${colors[index % colors.length]}`}>
                            <div className="text-center">
                              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-3xl font-bold text-white">
                                  {participant.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Name Label */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium text-sm">
                                {participant.name || `Participant ${index + 1}`}
                              </span>
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Connected" />
                              </div>
                            </div>
                          </div>
                          {/* Status Badge */}
                          <div className="absolute top-2 right-2 bg-green-600/80 px-2 py-0.5 rounded text-xs text-white flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            In Call
                          </div>
                        </div>
                      )
                    })}

                    {/* Empty state if no other participants */}
                    {(!callInfo?.participants || callInfo.participants.length === 0) && (
                      <div className="bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center min-h-[200px]">
                        <div className="text-center text-gray-400">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Waiting for participants...</p>
                          <p className="text-xs mt-1">Share the meeting link to invite others</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Group Call Controls */}
                <div className="bg-gray-800/90 backdrop-blur-sm p-4 flex items-center justify-center gap-4 border-t border-gray-700">
                  <Button
                    variant={isAudioEnabled ? "default" : "destructive"}
                    size="lg"
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                    className="rounded-full w-14 h-14"
                    title={isAudioEnabled ? "Mute" : "Unmute"}
                  >
                    {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                  </Button>

                  <Button
                    variant={isVideoEnabled ? "default" : "destructive"}
                    size="lg"
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                    className="rounded-full w-14 h-14"
                    title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                  >
                    {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                  </Button>

                  <Button
                    variant={isScreenSharing ? "default" : "outline"}
                    size="lg"
                    onClick={handleScreenShare}
                    className={`rounded-full w-14 h-14 ${isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                    title={isScreenSharing ? "Stop sharing" : "Share screen"}
                  >
                    <Monitor className="h-6 w-6" />
                  </Button>

                  <Button
                    variant={showChat ? "default" : "outline"}
                    size="lg"
                    onClick={() => {
                      setShowChat(!showChat)
                      setShowParticipants(false)
                    }}
                    className="rounded-full w-14 h-14"
                    title="Chat"
                  >
                    <MessageSquare className="h-6 w-6" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleEndCall}
                    className="rounded-full w-14 h-14"
                    title="Leave meeting"
                  >
                    <PhoneCall className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Fallback - Call ended or unknown state */
              <div className="h-full bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PhoneCall className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-xl">Call Ended</p>
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

        {/* Enhanced Video Call Controls - Hide when using PeerJS (PeerJS has its own controls) */}
        {!usePeerJSCall && (
        <div className="p-4 bg-gray-800 rounded-b-lg">
          {callState === "connected" ? (
            <>
              <div className="flex items-center justify-between">
                {/* Left Controls */}
                <div className="flex items-center space-x-3">
                  <Button
                    variant={isAudioEnabled ? "default" : "destructive"}
                    size="lg"
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                    className="relative"
                    title={isAudioEnabled ? "Mute" : "Unmute"}
                  >
                    {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>

                  <Button
                    variant={isVideoEnabled ? "default" : "destructive"}
                    size="lg"
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                    title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                  >
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>

                  {!isDirectCall && (
                    <Button
                      variant={isScreenSharing ? "default" : "outline"}
                      size="lg"
                      onClick={handleScreenShare}
                      className={isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : ""}
                      title={isScreenSharing ? "Stop sharing" : "Share screen"}
                    >
                      <Monitor className="h-5 w-5" />
                      {isScreenSharing && <span className="ml-2 text-sm">Stop</span>}
                    </Button>
                  )}
                </div>

                {/* Center Controls */}
                <div className="flex items-center space-x-3">
                  {!isDirectCall && (
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
                  )}

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

                  {!isDirectCall && (
                    <Button variant={isRecording ? "destructive" : "outline"} size="lg" onClick={toggleRecording}>
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${isRecording ? "bg-white animate-pulse" : "bg-red-500"}`}
                      ></div>
                      {isRecording ? "Stop" : "Record"}
                    </Button>
                  )}
                </div>

                {/* Right Controls */}
                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="lg" title="Settings">
                    <Settings className="h-5 w-5" />
                  </Button>

                  <Button variant="destructive" size="lg" onClick={handleEndCall}>
                    <PhoneCall className="h-5 w-5" />
                    <span className="ml-2">{isDirectCall ? "End Call" : "Leave"}</span>
                  </Button>
                </div>
              </div>

              {/* Call Quality Indicator - Only show when connected */}
              <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isAudioEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Audio: {isAudioEnabled ? 'On' : 'Muted'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isVideoEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Video: {isVideoEnabled ? 'HD' : 'Off'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Connection: Excellent</span>
                </div>
              </div>
            </>
          ) : (
            /* Controls during calling/ringing state */
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant={isAudioEnabled ? "outline" : "destructive"}
                size="lg"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>

              <Button
                variant={isVideoEnabled ? "outline" : "destructive"}
                size="lg"
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              >
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>

              <Button variant="destructive" size="lg" onClick={handleEndCall}>
                <PhoneCall className="h-5 w-5" />
                <span className="ml-2">Cancel</span>
              </Button>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}

// Task Assignments Component
function TaskAssignments() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/communications/tasks", { cache: "no-store" })
      const data = await res.json()
      
      if (data.success) {
        setAssignments(data.tasks || [])
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await fetch("/api/communications/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      })
      await fetchTasks()
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task Assignments</CardTitle>
              <CardDescription>Manage and track team assignments</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost" onClick={fetchTasks}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => setShowNewTaskDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-sm text-gray-500 mt-2">Loading tasks...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">No Tasks Assigned</h3>
              <p className="text-gray-600 mb-4">Create a new task to assign to team members.</p>
              <Button onClick={() => setShowNewTaskDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
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
                          assignment.priority === "high" || assignment.priority === "urgent"
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
                            : assignment.status === "in_progress" || assignment.status === "in-progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {assignment.status?.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  {assignment.description && (
                    <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Due: {assignment.dueDate || "Not set"}
                    </span>
                    <div className="flex space-x-2">
                      {assignment.status !== "completed" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateTaskStatus(assignment.id, assignment.status === "pending" ? "in_progress" : "completed")}
                        >
                          {assignment.status === "pending" ? "Start" : "Complete"}
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
