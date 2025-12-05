
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
  ClipboardList,
  Timer,
  XCircle,
  Trash2,
  Bell,
  Mail,
  Shield,
  Volume2,
} from "lucide-react"
import NextLink from "next/link"
import { PeerJSVideoCall } from "@/components/telehealth/PeerJSVideoCall"
import { GroupVideoCall } from "@/components/telehealth/GroupVideoCall"

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

  // Meeting management state
  const [activeMeeting, setActiveMeeting] = useState<{
    id?: string
    title?: string
    duration?: number // in minutes
    isHost?: boolean
  } | null>(null)

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

  const handleJoinMeeting = (meetingLink: string, meeting?: any) => {
    console.log('🎥 [MEETING] Joining meeting:', meeting, 'Link:', meetingLink)
    
    // If it's a relative URL to the meeting page, navigate there
    if (meetingLink.startsWith("/meeting/")) {
      window.location.href = meetingLink
      return
    }
    
    // If it's an external URL (not our app), open in new tab
    if (meetingLink.startsWith("http") && !meetingLink.includes(window.location.host)) {
      window.open(meetingLink, "_blank")
      return
    }
    
    // For legacy meeting links or direct join, show video call interface
    // Parse duration from meeting data
    let durationMinutes = meeting?.durationMinutes || 30 // default 30 minutes
    if (!meeting?.durationMinutes && meeting?.duration) {
      const match = meeting.duration.match(/(\d+)/)
      if (match) durationMinutes = parseInt(match[1])
    }
    
    // Determine if current user is the host (organizer)
    const isHost = meeting?.organizer === currentUser?.name || 
                   meeting?.organizerId === currentUser?.id ||
                   meeting?.organizerId === currentUser?.staffId
    
    console.log('📋 [MEETING] Duration:', durationMinutes, 'minutes, isHost:', isHost)
    
    // Set active meeting info
    setActiveMeeting({
      id: meeting?.id,
      title: meeting?.title || "Meeting",
      duration: durationMinutes,
      isHost: isHost
    })
    
    // Get participants for the meeting - handle both array of objects and array of strings
    let participantList: any[] = []
    if (meeting?.participants && Array.isArray(meeting.participants)) {
      participantList = meeting.participants.map((p: any) => {
        if (typeof p === 'string') {
          return { id: p, name: p }
        }
        return {
          id: p.id || p,
          name: p.name || p,
          email: p.email
        }
      }).filter((p: any) => p.id && p.id !== currentUser?.id) // Exclude self
    }
    
    console.log('👥 [MEETING] Participants:', participantList)
    
    // Use meeting ID as session ID so ALL participants join the SAME room
    // This ensures everyone joining the same scheduled meeting connects together
    const meetingSessionId = meeting?.id 
      ? `meeting-${meeting.id}`
      : `meeting-${meetingLink.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`
    
    console.log('🔗 [MEETING] Session ID:', meetingSessionId)
    
    // Set the session ID so we can join directly
    setActivePeerSessionId(meetingSessionId)
    
    // Mark as callee accepted to SKIP RINGING and go directly to call
    setIsCalleeAccepted(true)
    
    setCallInfo({
      type: "group",
      participants: participantList,
      conversationName: meeting?.title || "Meeting",
    })
    setShowVideoCall(true)
  }

  const copyMeetingLink = (link: string, meetingId?: string) => {
    // Generate proper meeting URL
    let meetingUrl = link
    if (link.startsWith("/meeting/")) {
      // Already a relative path, make it absolute
      meetingUrl = `${window.location.origin}${link}`
    } else if (!link.startsWith("http")) {
      // Generate meeting page URL from meeting ID
      const id = meetingId || link.replace("meeting-", "")
      meetingUrl = `${window.location.origin}/meeting/${id}`
    }
    
    navigator.clipboard.writeText(meetingUrl)
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      Schedule New Meeting
                    </DialogTitle>
                    <DialogDescription>
                      Create a video meeting and send invites to participants
                    </DialogDescription>
                  </DialogHeader>
                  <ScheduleMeetingForm 
                    onSchedule={handleScheduleMeeting} 
                    onCancel={() => setShowScheduleDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-gray-100/80 rounded-xl">
            <TabsTrigger 
              value="messages" 
              className="flex items-center justify-center gap-2 py-2.5 px-2 md:px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger 
              value="meetings"
              className="flex items-center justify-center gap-2 py-2.5 px-2 md:px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Meetings</span>
            </TabsTrigger>
            <TabsTrigger 
              value="assignments"
              className="flex items-center justify-center gap-2 py-2.5 px-2 md:px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="flex items-center justify-center gap-2 py-2.5 px-2 md:px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
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
            {/* Quick Actions - Top Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Video className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Start Instant Meeting</h3>
                  <p className="text-sm text-blue-100 mb-4">Begin a video call immediately</p>
                  <Button 
                    onClick={() => handleStartVideoCall("group")} 
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                  >
                    Start Now
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Schedule Meeting</h3>
                  <p className="text-sm text-green-100 mb-4">Plan a future video conference</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowScheduleDialog(true)} 
                    className="w-full bg-white text-green-600 hover:bg-green-50 border-0 font-semibold"
                  >
                    Schedule
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] sm:col-span-2 lg:col-span-1">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Share2 className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Join by Link</h3>
                  <p className="text-sm text-purple-100 mb-4">Enter a meeting ID or link</p>
                  <Button 
                    variant="outline" 
                    className="w-full bg-white text-purple-600 hover:bg-purple-50 border-0 font-semibold"
                  >
                    Join Meeting
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Meetings */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Video className="h-4 w-4 text-blue-600" />
                      </div>
                      Upcoming Meetings
                    </CardTitle>
                    <CardDescription className="mt-1">Scheduled video conferences and team meetings</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={fetchMeetings} className="gap-2">
                      <RefreshCw className={`h-4 w-4 ${isLoadingMeetings ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                    <Button size="sm" onClick={() => setShowScheduleDialog(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">New Meeting</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                {isLoadingMeetings ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500">Loading meetings...</p>
                  </div>
                ) : scheduledMeetings.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">No Upcoming Meetings</h3>
                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">Schedule a meeting to collaborate with your team members.</p>
                    <Button onClick={() => setShowScheduleDialog(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Schedule Meeting
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledMeetings.map((meeting, index) => (
                      <div 
                        key={meeting.id} 
                        className="p-4 md:p-5 bg-gradient-to-r from-white to-gray-50 border rounded-xl hover:shadow-lg transition-all duration-300 hover:border-blue-200"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              meeting.type === "training"
                                ? "bg-gradient-to-br from-green-400 to-green-600"
                                : meeting.type === "evaluation"
                                  ? "bg-gradient-to-br from-purple-400 to-purple-600"
                                  : "bg-gradient-to-br from-blue-400 to-blue-600"
                            }`}>
                              <Video className="h-7 w-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-900 text-lg truncate">{meeting.title}</h3>
                                {(meeting.organizerId === currentUser?.id || meeting.organizerId === currentUser?.staffId || meeting.organizer === currentUser?.name) && (
                                  <Badge className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5">Host</Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-2">
                                <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  {meeting.date}
                                </span>
                                <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  {meeting.time}
                                </span>
                                <span className="flex items-center gap-1.5 bg-orange-100 px-2.5 py-1 rounded-lg text-orange-700">
                                  <Timer className="h-4 w-4" />
                                  {meeting.duration || `${meeting.durationMinutes || 30} min`}
                                </span>
                                <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                                  <Users className="h-4 w-4 text-gray-500" />
                                  {Array.isArray(meeting.participants)
                                    ? meeting.participants.length
                                    : meeting.participants} attendees
                                </span>
                              </div>
                              {meeting.organizer && (
                                <p className="text-xs text-gray-400 mt-1.5">Organized by {meeting.organizer}</p>
                              )}
                              {meeting.agenda && (
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{meeting.agenda}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              className={`font-medium px-3 py-1 ${
                                meeting.type === "training"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : meeting.type === "evaluation"
                                    ? "bg-purple-100 text-purple-700 border-purple-200"
                                    : "bg-blue-100 text-blue-700 border-blue-200"
                              }`}
                            >
                              {meeting.type}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => copyMeetingLink(meeting.meetingLink, meeting.id)}
                              className="gap-2 hidden sm:flex"
                            >
                              <Copy className="h-4 w-4" />
                              Copy
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleJoinMeeting(meeting.meetingLink, meeting)}
                              className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                            >
                              <Video className="h-4 w-4" />
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
              setActiveMeeting(null)
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
            // Meeting management props
            activeMeeting={activeMeeting}
            onMeetingEnd={() => {
              setActiveMeeting(null)
            }}
            onCallEnded={() => {
              setActiveCallId(null)
              setActivePeerSessionId(null)
              setIncomingCall(null)
              setIsCalleeAccepted(false)
              setActiveMeeting(null)
            }}
          />
        )}
      </main>
    </div>
  )
}

// Schedule Meeting Form Component
function ScheduleMeetingForm({ onSchedule, onCancel }: { onSchedule: (data: any) => void; onCancel?: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "30",
    meetingType: "general",
    participants: [] as string[],
    agenda: "",
    recurring: false,
    sendInvites: true,
  })
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch staff members from database
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoadingStaff(true)
        
        // Try fetching from staff list API
        let staffData: any[] = []
        
        try {
          const res = await fetch("/api/staff/list")
          const data = await res.json()
          console.log("Staff list response:", data)
          
          if (data.staff && data.staff.length > 0) {
            staffData = data.staff
          }
        } catch (err) {
          console.log("Staff list API failed, trying alternative...")
        }
        
        // If no staff from list, try the care-team endpoint
        if (staffData.length === 0) {
          try {
            const res2 = await fetch("/api/staff/care-team")
            const data2 = await res2.json()
            console.log("Care team response:", data2)
            
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
            role: s.role_id || s.role || s.credentials || s.department || "Staff",
            email: s.email,
          }))
          console.log("Formatted staff:", formattedStaff)
          setStaffMembers(formattedStaff)
        } else {
          console.log("No staff found from API, using fallback")
          // Fallback to sample staff if APIs return empty
          setStaffMembers([
            { id: "sample-1", name: "Dr. Wilson", role: "Doctor" },
            { id: "sample-2", name: "Sarah Johnson", role: "Nurse" },
            { id: "sample-3", name: "Michael Chen", role: "Caregiver" },
            { id: "sample-4", name: "Emily Davis", role: "Admin" },
            { id: "sample-5", name: "Lisa Garcia", role: "Nurse" },
          ])
        }
      } catch (error) {
        console.error("Error fetching staff:", error)
        // Fallback to sample staff if all APIs fail
        setStaffMembers([
          { id: "sample-1", name: "Dr. Wilson", role: "Doctor" },
          { id: "sample-2", name: "Sarah Johnson", role: "Nurse" },
          { id: "sample-3", name: "Michael Chen", role: "Caregiver" },
          { id: "sample-4", name: "Emily Davis", role: "Admin" },
          { id: "sample-5", name: "Lisa Garcia", role: "Nurse" },
        ])
      } finally {
        setIsLoadingStaff(false)
      }
    }
    fetchStaff()
  }, [])

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0]

  // Filter staff based on search
  const filteredStaff = staffMembers.filter(
    (staff) =>
      staff.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.date || !formData.time) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Map form data to API expected format
      const meetingData = {
        title: formData.title,
        description: formData.description,
        agenda: formData.agenda,
        date: formData.date,
        time: formData.time,
        durationMinutes: parseInt(formData.duration),
        meetingType: formData.meetingType,
        isRecurring: formData.recurring,
        participantIds: formData.participants,
        meetingLink: `https://meet.irishtriplets.com/${Date.now()}`,
      }
      
      await onSchedule(meetingData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleParticipant = (staffId: string) => {
    if (formData.participants.includes(staffId)) {
      setFormData({
        ...formData,
        participants: formData.participants.filter((p) => p !== staffId),
      })
    } else {
      setFormData({
        ...formData,
        participants: [...formData.participants, staffId],
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Meeting Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium flex items-center gap-1">
          Meeting Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter meeting title"
          className="h-11"
          required
        />
      </div>

      {/* Date and Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-medium flex items-center gap-1">
            Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="date"
            type="date"
            min={today}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time" className="text-sm font-medium flex items-center gap-1">
            Time <span className="text-red-500">*</span>
          </Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="h-11"
            required
          />
        </div>
      </div>

      {/* Duration and Type Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-sm font-medium">Duration</Label>
          <Select 
            value={formData.duration} 
            onValueChange={(value) => setFormData({ ...formData, duration: value })}
          >
            <SelectTrigger className="h-11">
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

        <div className="space-y-2">
          <Label htmlFor="meetingType" className="text-sm font-medium">Meeting Type</Label>
          <Select 
            value={formData.meetingType} 
            onValueChange={(value) => setFormData({ ...formData, meetingType: value })}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  General Meeting
                </div>
              </SelectItem>
              <SelectItem value="training">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Training Session
                </div>
              </SelectItem>
              <SelectItem value="evaluation">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  Performance Evaluation
                </div>
              </SelectItem>
              <SelectItem value="urgent">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Urgent Meeting
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Participants ({formData.participants.length} selected)
        </Label>
        <div className="border rounded-lg p-3 bg-gray-50/50">
          <Input
            placeholder="Search staff members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3 h-9"
          />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {isLoadingStaff ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading staff...</span>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">
                No staff members found
              </div>
            ) : (
              filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  onClick={() => toggleParticipant(staff.id)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    formData.participants.includes(staff.id)
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      formData.participants.includes(staff.id) ? "bg-blue-500" : "bg-gray-400"
                    }`}>
                      {staff.name?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{staff.name}</p>
                      {staff.role && (
                        <p className="text-xs text-gray-500">{staff.role}</p>
                      )}
                    </div>
                  </div>
                  {formData.participants.includes(staff.id) && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief meeting description"
          className="h-11"
        />
      </div>

      {/* Agenda */}
      <div className="space-y-2">
        <Label htmlFor="agenda" className="text-sm font-medium">Agenda</Label>
        <Textarea
          id="agenda"
          value={formData.agenda}
          onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
          placeholder="Meeting agenda and topics to discuss..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Options */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <Label htmlFor="recurring" className="text-sm font-medium cursor-pointer">
                Recurring meeting
              </Label>
              <p className="text-xs text-gray-500">Repeat this meeting weekly</p>
            </div>
          </div>
          <Switch
            id="recurring"
            checked={formData.recurring}
            onCheckedChange={(checked) => setFormData({ ...formData, recurring: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Send className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <Label htmlFor="sendInvites" className="text-sm font-medium cursor-pointer">
                Send calendar invites
              </Label>
              <p className="text-xs text-gray-500">Notify participants by email</p>
            </div>
          </div>
          <Switch
            id="sendInvites"
            checked={formData.sendInvites}
            onCheckedChange={(checked) => setFormData({ ...formData, sendInvites: checked })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.title || !formData.date || !formData.time}
          className="w-full sm:w-auto gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scheduling...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4" />
              Schedule Meeting
            </>
          )}
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
  // Meeting management props
  activeMeeting,
  onMeetingEnd,
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
  // Meeting management props
  activeMeeting?: {
    id?: string
    title?: string
    duration?: number
    isHost?: boolean
  } | null
  onMeetingEnd?: () => void
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
      // Use latest values of isCalleeAccepted and activePeerSessionId
      initializeCall()
    }
    return () => {
      cleanupMedia()
    }
  }, [isOpen, isCalleeAccepted, activePeerSessionId])

  const initializeCall = async () => {
    console.log('🚀 [INIT] Starting call initialization...')
    console.log('  - isCalleeAccepted:', isCalleeAccepted)
    console.log('  - activePeerSessionId:', activePeerSessionId)
    console.log('  - callInfo:', callInfo)
    
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

      // If joining a scheduled meeting OR callee accepted an incoming call
      // Go DIRECTLY to PeerJS (no ringing)
      if (isCalleeAccepted && activePeerSessionId) {
        console.log('✅ [JOIN] Joining meeting directly, no ringing...')
        console.log('  - Session ID:', activePeerSessionId)
        playConnectedSound()
        setCallSessionId(activePeerSessionId)
        setUsePeerJSCall(true)
        setCallState("connected")
        return
      }

      // CALLER: Start PeerJS IMMEDIATELY so peer ID is in database
      // This works for BOTH direct and group calls!
      const usingPeerJS = activePeerSessionId ? true : false
      if (usingPeerJS && activePeerSessionId) {
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
                  <Button onClick={initializeCall} variant="outline">
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
                {callInfo?.type === "group" ? (
                  /* GROUP VIDEO CALL - Multi-party mesh network */
                  <GroupVideoCall
                    consultationId={activePeerSessionId || callSessionId}
                    currentUserId={currentUser?.id || ""}
                    currentUserName={currentUser?.name || "User"}
                    participants={callInfo?.participants || []}
                    callId={activeCallId || undefined}
                    // Meeting management props
                    meetingDuration={activeMeeting?.duration || 0}
                    isHost={activeMeeting?.isHost || false}
                    meetingId={activeMeeting?.id}
                    meetingTitle={activeMeeting?.title || callInfo?.conversationName}
                    onConnected={() => {
                      console.log('✅ [VIDEO] Group video connected!')
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
                      // Call the meeting end callback
                      onMeetingEnd?.()
                      setUsePeerJSCall(false)
                      handleEndCall()
                    }}
                  />
                ) : (
                  /* DIRECT CALL - 1-on-1 PeerJS */
                  <PeerJSVideoCall
                    consultationId={activePeerSessionId || callSessionId}
                    participantName={currentUser?.name || "User"}
                    participantRole={isCalleeAccepted ? "callee" : "caller"}
                    remoteName={isCalleeAccepted ? (incomingCall?.caller?.name || callInfo?.conversationName) : (callInfo?.participants?.[0]?.name || callInfo?.conversationName || "Unknown")}
                    callId={activeCallId || undefined}
                    callerId={!isCalleeAccepted ? currentUser?.id : undefined}
                    isGroupCall={false}
                    participants={[]}
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
                )}
                {/* Ringing overlay for caller in direct calls */}
                {(callState as string) === "ringing" && !incomingCall && callInfo?.type === "direct" && (
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
                {/* Ringing overlay for caller in group calls */}
                {(callState as string) === "ringing" && !incomingCall && callInfo?.type === "group" && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
                    <div className="animate-pulse mb-4">
                      <Users className="h-16 w-16 text-blue-400" />
                    </div>
                    <p className="text-white text-xl mb-2">Calling {callInfo?.participants?.length || 0} member{callInfo?.participants?.length !== 1 ? 's' : ''}...</p>
                    <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-md">
                      {callInfo?.participants?.slice(0, 5).map((p: any, i: number) => (
                        <div key={i} className="bg-gray-800/60 px-3 py-1 rounded-full text-sm text-white">
                          {p.name}
                        </div>
                      ))}
                      {(callInfo?.participants?.length || 0) > 5 && (
                        <div className="bg-gray-800/60 px-3 py-1 rounded-full text-sm text-white">
                          +{(callInfo?.participants?.length || 0) - 5} more
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-6">Waiting for them to answer...</p>
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
                      Cancel Call
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
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // New task form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    dueDate: "",
  })

  // Fetch current user
  useEffect(() => {
    const userData = localStorage.getItem('currentStaff')
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  // Fetch staff members for assignment
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoadingStaff(true)
        let staffData: any[] = []
        
        try {
          const res = await fetch("/api/staff/list")
          const data = await res.json()
          if (data.staff && data.staff.length > 0) {
            staffData = data.staff
          }
        } catch (err) {
          console.log("Staff list API failed")
        }
        
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
          }))
          setStaffMembers(formattedStaff)
        } else {
          // Fallback sample staff
          setStaffMembers([
            { id: "sample-1", name: "Dr. Wilson", role: "Doctor" },
            { id: "sample-2", name: "Sarah Johnson", role: "Nurse" },
            { id: "sample-3", name: "Michael Chen", role: "Caregiver" },
            { id: "sample-4", name: "Emily Davis", role: "Admin" },
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

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const statusParam = filterStatus !== "all" ? `?status=${filterStatus}` : ""
      const res = await fetch(`/api/communications/tasks${statusParam}`, { cache: "no-store" })
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

  useEffect(() => {
    fetchTasks()
  }, [filterStatus])

  const createTask = async () => {
    if (!newTask.title || !newTask.assignedTo) {
      toast({
        title: "Missing Fields",
        description: "Please fill in the title and assignee",
        variant: "destructive",
      })
      return
    }

    setIsCreatingTask(true)
    try {
      const res = await fetch("/api/communications/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          assignedTo: newTask.assignedTo,
          assignedBy: currentUser?.id || null,
          dueDate: newTask.dueDate || null,
          priority: newTask.priority,
        }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast({
          title: "Task Created",
          description: `"${newTask.title}" has been assigned`,
        })
        setShowNewTaskDialog(false)
        setNewTask({ title: "", description: "", assignedTo: "", priority: "medium", dueDate: "" })
        await fetchTasks()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      })
    } finally {
      setIsCreatingTask(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await fetch("/api/communications/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      })
      toast({
        title: "Task Updated",
        description: `Status changed to ${newStatus.replace("_", " ")}`,
      })
      await fetchTasks()
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
    }
  }

  const deleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Delete task "${taskTitle}"?`)) return
    
    try {
      await fetch(`/api/communications/tasks?id=${taskId}`, {
        method: "DELETE",
      })
      toast({
        title: "Task Deleted",
        description: `"${taskTitle}" has been removed`,
      })
      await fetchTasks()
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200"
      case "in_progress": 
      case "in-progress": return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending": return "bg-gray-100 text-gray-800 border-gray-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
      case "urgent": return "bg-red-100 text-red-800 border-red-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
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

  // Get today's date for min date validation
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                Task Assignments
              </CardTitle>
              <CardDescription className="mt-1">Manage and track team assignments</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <Button size="sm" variant="outline" onClick={fetchTasks}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => setShowNewTaskDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600" />
              <p className="text-sm text-gray-500 mt-3">Loading tasks...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">No Tasks Found</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                {filterStatus !== "all" 
                  ? `No ${filterStatus.replace("_", " ")} tasks. Try a different filter.`
                  : "Create a new task to assign to team members."}
              </p>
              <Button onClick={() => setShowNewTaskDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className={`p-5 border rounded-xl transition-all duration-200 hover:shadow-lg ${
                    assignment.status === "completed" 
                      ? "bg-green-50/50 border-green-200" 
                      : "bg-white hover:border-blue-200"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                            {getInitials(assignment.assignedTo || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold ${assignment.status === "completed" ? "line-through text-gray-500" : "text-gray-900"}`}>
                              {assignment.title}
                            </h3>
                            <Badge className={`${getPriorityColor(assignment.priority)} text-xs px-2 py-0.5`}>
                              {assignment.priority}
                            </Badge>
                            <Badge className={`${getStatusColor(assignment.status)} text-xs px-2 py-0.5`}>
                              {assignment.status?.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Assigned to <span className="font-medium text-gray-900">{assignment.assignedTo}</span>
                            {assignment.assignedBy && (
                              <span className="text-gray-500"> • by {assignment.assignedBy}</span>
                            )}
                          </p>
                          {assignment.description && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{assignment.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {assignment.dueDate && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                          new Date(assignment.dueDate) < new Date() && assignment.status !== "completed"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {assignment.status === "pending" && (
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => updateTaskStatus(assignment.id, "in_progress")}
                          >
                            Start
                          </Button>
                        )}
                        {(assignment.status === "in_progress" || assignment.status === "in-progress") && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => updateTaskStatus(assignment.id, "completed")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                        {assignment.status === "completed" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateTaskStatus(assignment.id, "pending")}
                          >
                            Reopen
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteTask(assignment.id, assignment.title)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Task Dialog */}
      <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Create New Task
            </DialogTitle>
            <DialogDescription>
              Assign a task to a team member
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Task Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                placeholder="Enter task description..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
              />
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Assign To <span className="text-red-500">*</span>
              </label>
              {isLoadingStaff ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-600" />
                </div>
              ) : (
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a team member...</option>
                  {staffMembers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Priority & Due Date Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Due Date</label>
                <Input
                  type="date"
                  min={today}
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createTask} 
              disabled={isCreatingTask || !newTask.title || !newTask.assignedTo}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingTask ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Communication Settings Component
function CommunicationSettings() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const [settings, setSettings] = useState({
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    meetingReminders: true,
    taskAssignments: true,
    reminderTime: "15", // minutes before meeting
    
    // Privacy Settings
    messagePreview: true,
    onlineStatus: true,
    readReceipts: true,
    typingIndicator: true,
    
    // Meeting Settings
    autoJoinMeetings: false,
    muteOnJoin: false,
    cameraOffOnJoin: false,
    enableVirtualBackground: false,
    
    // Audio/Video Settings
    preferredMicrophone: "default",
    preferredCamera: "default",
    preferredSpeaker: "default",
    echoCancellation: true,
    noiseSuppression: true,
    
    // Do Not Disturb
    doNotDisturb: false,
    dndStartTime: "22:00",
    dndEndTime: "07:00",
    allowUrgentCalls: true,
  })

  const [devices, setDevices] = useState<{
    microphones: MediaDeviceInfo[]
    cameras: MediaDeviceInfo[]
    speakers: MediaDeviceInfo[]
  }>({
    microphones: [],
    cameras: [],
    speakers: [],
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('communicationSettings')
        if (saved) {
          const parsed = JSON.parse(saved)
          setSettings(prev => ({ ...prev, ...parsed }))
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Load available media devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
          .then(stream => stream.getTracks().forEach(track => track.stop()))
          .catch(() => {})
        
        const deviceList = await navigator.mediaDevices.enumerateDevices()
        setDevices({
          microphones: deviceList.filter(d => d.kind === 'audioinput'),
          cameras: deviceList.filter(d => d.kind === 'videoinput'),
          speakers: deviceList.filter(d => d.kind === 'audiooutput'),
        })
      } catch (error) {
        console.error('Error loading devices:', error)
      }
    }
    loadDevices()
  }, [])

  // Update setting and mark as changed
  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem('communicationSettings', JSON.stringify(settings))
      
      // Optionally save to database via API
      try {
        const currentStaff = localStorage.getItem('currentStaff')
        if (currentStaff) {
          const staffData = JSON.parse(currentStaff)
          await fetch('/api/communications/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              staffId: staffData.id,
              settings: settings
            })
          })
        }
      } catch (apiError) {
        // Continue even if API fails - localStorage is the primary store
        console.log('API save skipped - using localStorage')
      }
      
      setHasChanges(false)
      toast({
        title: "Settings Saved",
        description: "Your communication preferences have been updated",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Reset to defaults
  const resetToDefaults = () => {
    if (!confirm('Reset all settings to default values?')) return
    
    setSettings({
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      meetingReminders: true,
      taskAssignments: true,
      reminderTime: "15",
      messagePreview: true,
      onlineStatus: true,
      readReceipts: true,
      typingIndicator: true,
      autoJoinMeetings: false,
      muteOnJoin: false,
      cameraOffOnJoin: false,
      enableVirtualBackground: false,
      preferredMicrophone: "default",
      preferredCamera: "default",
      preferredSpeaker: "default",
      echoCancellation: true,
      noiseSuppression: true,
      doNotDisturb: false,
      dndStartTime: "22:00",
      dndEndTime: "07:00",
      allowUrgentCalls: true,
    })
    setHasChanges(true)
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults. Click Save to apply.",
    })
  }

  // Test notification
  const testNotification = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Test Notification', {
            body: 'Your notifications are working correctly!',
            icon: '/favicon.ico'
          })
          toast({
            title: "Notification Sent",
            description: "Check if you received the test notification",
          })
        } else {
          toast({
            title: "Permission Denied",
            description: "Please enable notifications in your browser settings",
            variant: "destructive",
          })
        }
      })
    } else {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Communication Settings</h2>
          <p className="text-sm text-gray-600">Manage your notification, privacy, and meeting preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Unsaved changes
            </span>
          )}
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={isSaving || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Notification Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure how you receive communications</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid gap-5">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <Label className="text-base font-medium">Push Notifications</Label>
                  <p className="text-sm text-gray-500">Browser push notifications</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={testNotification}>
                  Test
                </Button>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <Label className="text-base font-medium">SMS Notifications</Label>
                  <p className="text-sm text-gray-500">Text message alerts for urgent items</p>
                </div>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <Label className="text-base font-medium">Meeting Reminders</Label>
                  <p className="text-sm text-gray-500">Get reminded before scheduled meetings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={settings.reminderTime}
                  onChange={(e) => updateSetting('reminderTime', e.target.value)}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-white"
                  disabled={!settings.meetingReminders}
                >
                  <option value="5">5 min</option>
                  <option value="10">10 min</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                </select>
                <Switch
                  checked={settings.meetingReminders}
                  onCheckedChange={(checked) => updateSetting('meetingReminders', checked)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <Label className="text-base font-medium">Task Assignments</Label>
                  <p className="text-sm text-gray-500">Notifications for new task assignments</p>
                </div>
              </div>
              <Switch
                checked={settings.taskAssignments}
                onCheckedChange={(checked) => updateSetting('taskAssignments', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Privacy Settings
          </CardTitle>
          <CardDescription>Control your privacy and availability</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid gap-5">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-medium">Message Preview</Label>
                <p className="text-sm text-gray-500">Show message content in notifications</p>
              </div>
              <Switch
                checked={settings.messagePreview}
                onCheckedChange={(checked) => updateSetting('messagePreview', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-medium">Online Status</Label>
                <p className="text-sm text-gray-500">Show when you're online to others</p>
              </div>
              <Switch
                checked={settings.onlineStatus}
                onCheckedChange={(checked) => updateSetting('onlineStatus', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-medium">Read Receipts</Label>
                <p className="text-sm text-gray-500">Let others know when you've read their messages</p>
              </div>
              <Switch
                checked={settings.readReceipts}
                onCheckedChange={(checked) => updateSetting('readReceipts', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-medium">Typing Indicator</Label>
                <p className="text-sm text-gray-500">Show when you're typing a message</p>
              </div>
              <Switch
                checked={settings.typingIndicator}
                onCheckedChange={(checked) => updateSetting('typingIndicator', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Do Not Disturb */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <MoonIcon className="h-5 w-5 text-red-600" />
            Do Not Disturb
          </CardTitle>
          <CardDescription>Set quiet hours when you don't want to be disturbed</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-base font-medium">Enable Do Not Disturb</Label>
              <p className="text-sm text-gray-500">Silence all notifications during set hours</p>
            </div>
            <Switch
              checked={settings.doNotDisturb}
              onCheckedChange={(checked) => updateSetting('doNotDisturb', checked)}
            />
          </div>

          {settings.doNotDisturb && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Time</Label>
                <Input
                  type="time"
                  value={settings.dndStartTime}
                  onChange={(e) => updateSetting('dndStartTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">End Time</Label>
                <Input
                  type="time"
                  value={settings.dndEndTime}
                  onChange={(e) => updateSetting('dndEndTime', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-base font-medium">Allow Urgent Calls</Label>
              <p className="text-sm text-gray-500">Still receive urgent/emergency calls during DND</p>
            </div>
            <Switch
              checked={settings.allowUrgentCalls}
              onCheckedChange={(checked) => updateSetting('allowUrgentCalls', checked)}
              disabled={!settings.doNotDisturb}
            />
          </div>
        </CardContent>
      </Card>

      {/* Meeting Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-purple-600" />
            Meeting Settings
          </CardTitle>
          <CardDescription>Configure default meeting behavior</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid gap-5">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-medium">Auto-join Meetings</Label>
                <p className="text-sm text-gray-500">Automatically join when meeting starts</p>
              </div>
              <Switch
                checked={settings.autoJoinMeetings}
                onCheckedChange={(checked) => updateSetting('autoJoinMeetings', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-medium">Mute on Join</Label>
                <p className="text-sm text-gray-500">Start meetings with microphone muted</p>
              </div>
              <Switch
                checked={settings.muteOnJoin}
                onCheckedChange={(checked) => updateSetting('muteOnJoin', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-base font-medium">Camera Off on Join</Label>
                <p className="text-sm text-gray-500">Start meetings with camera off</p>
              </div>
              <Switch
                checked={settings.cameraOffOnJoin}
                onCheckedChange={(checked) => updateSetting('cameraOffOnJoin', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio/Video Device Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-cyan-600" />
            Audio & Video Devices
          </CardTitle>
          <CardDescription>Select your preferred input/output devices</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Microphone
              </Label>
              <select
                value={settings.preferredMicrophone}
                onChange={(e) => updateSetting('preferredMicrophone', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">System Default</option>
                {devices.microphones.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Video className="h-4 w-4" />
                Camera
              </Label>
              <select
                value={settings.preferredCamera}
                onChange={(e) => updateSetting('preferredCamera', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">System Default</option>
                {devices.cameras.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Speaker
              </Label>
              <select
                value={settings.preferredSpeaker}
                onChange={(e) => updateSetting('preferredSpeaker', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">System Default</option>
                {devices.speakers.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium mb-3">Audio Processing</h4>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Echo Cancellation</Label>
                    <p className="text-xs text-gray-500">Reduce echo during calls</p>
                  </div>
                  <Switch
                    checked={settings.echoCancellation}
                    onCheckedChange={(checked) => updateSetting('echoCancellation', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Noise Suppression</Label>
                    <p className="text-xs text-gray-500">Filter background noise</p>
                  </div>
                  <Switch
                    checked={settings.noiseSuppression}
                    onCheckedChange={(checked) => updateSetting('noiseSuppression', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Button */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg sticky bottom-4">
        <p className="text-sm text-gray-600">
          {hasChanges ? "You have unsaved changes" : "All changes saved"}
        </p>
        <Button 
          onClick={saveSettings} 
          disabled={isSaving || !hasChanges}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Moon icon component
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
}
