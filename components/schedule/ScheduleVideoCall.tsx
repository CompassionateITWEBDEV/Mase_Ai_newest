"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MessageSquare,
  Users,
  X,
  Send,
  Clock,
  CheckCircle,
  User,
} from "lucide-react"

interface Staff {
  id: string
  name: string
  email?: string
  role?: string
  avatar?: string
}

interface Participant {
  id: string
  name: string
  peerId?: string
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: Date
}

interface ScheduleVideoCallProps {
  meetingId: string
  meetingTitle: string
  participants: Participant[]
  durationMinutes?: number
  onEndCall: () => void
}

// Declare global Peer type
declare global {
  interface Window {
    Peer: any
  }
}

export function ScheduleVideoCall({
  meetingId,
  meetingTitle,
  participants,
  durationMinutes = 0,
  onEndCall,
}: ScheduleVideoCallProps) {
  // Lobby state - staff selection like Google Meet
  const [isInLobby, setIsInLobby] = useState(true)
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const [isPreviewVideoEnabled, setIsPreviewVideoEnabled] = useState(true)
  const [isPreviewAudioEnabled, setIsPreviewAudioEnabled] = useState(true)
  const previewVideoRef = useRef<HTMLVideoElement>(null)

  // PeerJS loaded state
  const [peerLoaded, setPeerLoaded] = useState(false)
  
  // Video/Audio state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  
  // UI state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  
  // Call duration
  const [callDuration, setCallDuration] = useState(0)
  
  // Remote participants with streams
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, MediaStream>>(new Map())
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenShareRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const peerRef = useRef<any>(null)
  const connectionsRef = useRef<Map<string, any>>(new Map())
  const dataConnectionsRef = useRef<Map<string, any>>(new Map())
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch staff list for lobby - from DATABASE
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoadingStaff(true)
        
        let staffData: Staff[] = []
        
        // Try main staff list endpoint first
        try {
          const res = await fetch('/api/staff/list')
          const data = await res.json()
          console.log('[SCHEDULE] Staff list response:', data)
          
          if (data.success && data.staff?.length > 0) {
            staffData = data.staff.map((s: any) => ({
              id: s.id,
              name: s.name || s.full_name || 'Unknown',
              email: s.email || '',
              role: s.role || s.position || 'Staff',
            }))
          }
        } catch (e) {
          console.log('[SCHEDULE] Staff list endpoint failed:', e)
        }
        
        // Try care-team endpoint if no staff found
        if (staffData.length === 0) {
          try {
            const res = await fetch('/api/staff/care-team')
            const data = await res.json()
            console.log('[SCHEDULE] Care team response:', data)
            
            if (data.success && data.careTeam?.length > 0) {
              staffData = data.careTeam.map((s: any) => ({
                id: s.id,
                name: s.name || s.full_name || 'Unknown',
                email: s.email || '',
                role: s.role || s.position || 'Staff',
              }))
            }
          } catch (e) {
            console.log('[SCHEDULE] Care team endpoint failed:', e)
          }
        }
        
        // Try communications staff endpoint
        if (staffData.length === 0) {
          try {
            const res = await fetch('/api/communications/staff')
            const data = await res.json()
            console.log('[SCHEDULE] Communications staff response:', data)
            
            if (data.success && data.staff?.length > 0) {
              staffData = data.staff.map((s: any) => ({
                id: s.id,
                name: s.name || s.full_name || 'Unknown',
                email: s.email || '',
                role: s.role || s.position || 'Staff',
              }))
            }
          } catch (e) {
            console.log('[SCHEDULE] Communications staff endpoint failed:', e)
          }
        }
        
        // If still no staff, show message (don't use sample data - user wants database)
        if (staffData.length === 0) {
          console.warn('[SCHEDULE] No staff found in database')
        }
        
        setStaffList(staffData)
        
        // Check if user already selected in localStorage
        const storedUser = localStorage.getItem("communicationsUser")
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser)
            const found = staffData.find(s => s.id === user.id)
            if (found) {
              setSelectedStaff(found)
            }
          } catch (e) {}
        }
      } catch (error) {
        console.error("[SCHEDULE] Error fetching staff:", error)
      } finally {
        setIsLoadingStaff(false)
      }
    }

    fetchStaff()
  }, [])

  // Initialize camera preview in lobby
  useEffect(() => {
    if (!isInLobby) return

    const initPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        setPreviewStream(stream)
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error("Error accessing camera for preview:", error)
        setIsPreviewVideoEnabled(false)
      }
    }

    initPreview()

    return () => {
      // Cleanup preview stream when leaving lobby (but keep if joining call)
    }
  }, [isInLobby])

  // Toggle preview video
  const togglePreviewVideo = () => {
    if (previewStream) {
      const videoTrack = previewStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsPreviewVideoEnabled(videoTrack.enabled)
      }
    }
  }

  // Toggle preview audio
  const togglePreviewAudio = () => {
    if (previewStream) {
      const audioTrack = previewStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsPreviewAudioEnabled(audioTrack.enabled)
      }
    }
  }

  // Handle staff selection
  const handleSelectStaff = (staff: Staff) => {
    setSelectedStaff(staff)
    // Save to localStorage
    localStorage.setItem("communicationsUser", JSON.stringify(staff))
  }

  // Join the meeting
  const handleJoinMeeting = () => {
    if (!selectedStaff) return
    
    // Transfer preview stream to call
    localStreamRef.current = previewStream
    setIsVideoEnabled(isPreviewVideoEnabled)
    setIsAudioEnabled(isPreviewAudioEnabled)
    
    setIsInLobby(false)
  }

  // Load PeerJS from CDN when joining call
  useEffect(() => {
    if (isInLobby) return
    
    if (typeof window !== 'undefined' && !window.Peer) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'
      script.async = true
      script.onload = () => {
        console.log('✅ [SCHEDULE] PeerJS loaded from CDN')
        setPeerLoaded(true)
      }
      script.onerror = () => {
        console.error('❌ [SCHEDULE] Failed to load PeerJS from CDN')
      }
      document.head.appendChild(script)
    } else if (typeof window !== 'undefined' && window.Peer) {
      setPeerLoaded(true)
    }
  }, [isInLobby])

  // Initialize PeerJS after it's loaded
  useEffect(() => {
    if (isInLobby || !peerLoaded || !selectedStaff) return

    // Set up video element
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }

    initializePeer()

    return () => {
      // Cleanup
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      localStreamRef.current?.getTracks().forEach(track => track.stop())
      screenStreamRef.current?.getTracks().forEach(track => track.stop())
      peerRef.current?.destroy()
      
      // Leave meeting room
      if (selectedStaff) {
        fetch(`/api/communications/calls/participants?meetingRoomId=schedule-${meetingId}&oderId=${selectedStaff.id}`, {
          method: 'DELETE'
        }).catch(console.error)
      }
    }
  }, [isInLobby, peerLoaded, meetingId, selectedStaff])

  // Initialize PeerJS
  const initializePeer = () => {
    if (!window.Peer || !selectedStaff) {
      console.error('❌ [SCHEDULE] PeerJS not available or no staff selected')
      return
    }
    
    const Peer = window.Peer
    const peerId = `schedule-${meetingId}-${selectedStaff.id}-${Date.now()}`
    
    console.log('🔗 [SCHEDULE] Creating peer:', peerId)
    
    const peer = new Peer(peerId, {
      debug: 0,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    })

    peer.on("open", async (id: string) => {
      console.log("📞 [SCHEDULE] Peer connected:", id)
      peerRef.current = peer
      setIsConnecting(false)
      setIsConnected(true)
      
      // Register in meeting room
      await registerInMeetingRoom(id)
      
      // Start polling for other participants
      startPolling()
    })

    peer.on("call", (call: any) => {
      console.log("📞 [SCHEDULE] Incoming call from:", call.peer)
      call.answer(localStreamRef.current || undefined)
      
      call.on("stream", (remoteStream: MediaStream) => {
        console.log("📞 [SCHEDULE] Got remote stream from:", call.peer)
        setRemoteParticipants(prev => new Map(prev).set(call.peer, remoteStream))
      })
      
      call.on("close", () => {
        setRemoteParticipants(prev => {
          const newMap = new Map(prev)
          newMap.delete(call.peer)
          return newMap
        })
      })
      
      connectionsRef.current.set(call.peer, call)
    })

    peer.on("connection", (conn: any) => {
      console.log("📞 [SCHEDULE] Data connection from:", conn.peer)
      setupDataConnection(conn)
    })

    peer.on("error", (error: any) => {
      console.error("📞 [SCHEDULE] Peer error:", error.type, error)
      
      // Handle specific error types
      if (error.type === 'peer-unavailable') {
        // Remote peer disconnected, remove from connections
        console.log('📞 [SCHEDULE] Remote peer unavailable, will retry on next poll')
      } else if (error.type === 'network' || error.type === 'server-error') {
        // Network issue, try to reconnect
        console.log('📞 [SCHEDULE] Network error, attempting reconnection...')
        setIsConnecting(true)
        setTimeout(() => {
          if (!peerRef.current?.disconnected) {
            initializePeer()
          }
        }, 3000)
      }
    })

    peer.on("disconnected", () => {
      console.log("📞 [SCHEDULE] Peer disconnected, attempting reconnect...")
      setIsConnecting(true)
      // Try to reconnect
      peer.reconnect()
    })

    peer.on("close", () => {
      console.log("📞 [SCHEDULE] Peer connection closed")
      setIsConnected(false)
    })
  }

  // Register in meeting room
  const registerInMeetingRoom = async (peerId: string) => {
    if (!selectedStaff) return
    
    try {
      const res = await fetch("/api/communications/calls/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingRoomId: `schedule-${meetingId}`,
          oderId: selectedStaff.id,
          peerId: peerId,
          userName: selectedStaff.name, // Include name for display
        }),
      })
      const data = await res.json()
      console.log('✅ [SCHEDULE] Registered in meeting room:', data)
    } catch (error) {
      console.error("Error registering in meeting room:", error)
    }
  }

  // Start polling for participants
  const startPolling = () => {
    if (pollIntervalRef.current) return
    
    // Poll immediately first
    pollForParticipants()
    
    // Then poll every 2 seconds
    pollIntervalRef.current = setInterval(pollForParticipants, 2000)
  }

  // Poll for participants
  const pollForParticipants = async () => {
    try {
      const res = await fetch(`/api/communications/calls/participants?meetingRoomId=schedule-${meetingId}`)
      const data = await res.json()
      
      console.log('🔍 [SCHEDULE] Poll result:', data)
      
      if (data.success && data.participants) {
        const myPeerId = peerRef.current?.id
        
        for (const participant of data.participants) {
          // API returns peer_id (snake_case), handle both formats
          const remotePeerId = participant.peer_id || participant.peerId
          
          if (remotePeerId && remotePeerId !== myPeerId && !connectionsRef.current.has(remotePeerId)) {
            console.log('📞 [SCHEDULE] Found new participant:', remotePeerId)
            connectToParticipant(remotePeerId)
          }
        }
      }
    } catch (error) {
      console.error("Error polling participants:", error)
    }
  }

  // Connect to a participant
  const connectToParticipant = (remotePeerId: string) => {
    if (!peerRef.current || connectionsRef.current.has(remotePeerId)) return

    console.log("📞 [SCHEDULE] Connecting to:", remotePeerId)
    
    // Media call
    if (localStreamRef.current) {
      const call = peerRef.current.call(remotePeerId, localStreamRef.current)
      
      call.on("stream", (remoteStream: MediaStream) => {
        console.log("📞 [SCHEDULE] Got stream from:", remotePeerId)
        setRemoteParticipants(prev => new Map(prev).set(remotePeerId, remoteStream))
      })
      
      call.on("close", () => {
        setRemoteParticipants(prev => {
          const newMap = new Map(prev)
          newMap.delete(remotePeerId)
          return newMap
        })
        connectionsRef.current.delete(remotePeerId)
      })
      
      connectionsRef.current.set(remotePeerId, call)
    }
    
    // Data connection for chat
    const dataConn = peerRef.current.connect(remotePeerId)
    setupDataConnection(dataConn)
  }

  // Setup data connection for chat
  const setupDataConnection = (conn: any) => {
    conn.on("open", () => {
      console.log("📞 [SCHEDULE] Data connection open:", conn.peer)
      dataConnectionsRef.current.set(conn.peer, conn)
    })

    conn.on("data", (data: any) => {
      if (data.type === "chat") {
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          senderId: data.senderId,
          senderName: data.senderName,
          message: data.message,
          timestamp: new Date(data.timestamp),
        }])
      }
    })
    
    conn.on("close", () => {
      dataConnectionsRef.current.delete(conn.peer)
    })
  }

  // Call duration timer
  useEffect(() => {
    if (isInLobby || !isConnected) return

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isInLobby, isConnected])

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  // Start screen share
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false, // Audio can cause echo
      })
      
      screenStreamRef.current = screenStream
      setIsScreenSharing(true)
      
      console.log('🖥️ [SCHEDULE] Screen share started')
      
      // Set srcObject and play - use timeout to ensure state is updated
      setTimeout(() => {
        if (screenShareRef.current && screenStream) {
          screenShareRef.current.srcObject = screenStream
          screenShareRef.current.play().catch(e => console.log('Screen play error:', e))
        }
      }, 100)
      
      // Replace video track in all connections to share screen with others
      const videoTrack = screenStream.getVideoTracks()[0]
      connectionsRef.current.forEach((call) => {
        const sender = call.peerConnection?.getSenders().find((s: RTCRtpSender) => s.track?.kind === "video")
        if (sender) {
          sender.replaceTrack(videoTrack)
          console.log('🖥️ [SCHEDULE] Replaced video track for peer')
        }
      })
      
      // Handle screen share end (when user clicks "Stop sharing" in browser)
      videoTrack.onended = () => {
        console.log('🖥️ [SCHEDULE] Screen share ended by user')
        stopScreenShare()
      }
    } catch (error) {
      console.error("Error starting screen share:", error)
      setIsScreenSharing(false)
    }
  }

  // Stop screen share
  const stopScreenShare = () => {
    console.log('🖥️ [SCHEDULE] Stopping screen share')
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
    }
    
    // First set the state
    setIsScreenSharing(false)
    
    // Wait for React to re-render, then restore camera
    setTimeout(() => {
      if (localStreamRef.current && localVideoRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0]
        
        // Make sure track is enabled
        if (videoTrack) {
          videoTrack.enabled = true
        }
        
        // Force refresh of local video
        localVideoRef.current.srcObject = null
        setTimeout(() => {
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current
            localVideoRef.current.play().catch(e => console.log('Local video play error:', e))
          }
        }, 50)
        
        // Restore video track to all peer connections
        connectionsRef.current.forEach((call) => {
          const sender = call.peerConnection?.getSenders().find((s: RTCRtpSender) => s.track?.kind === "video")
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack)
            console.log('🖥️ [SCHEDULE] Restored camera track for peer')
          }
        })
      }
    }, 100)
  }

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedStaff) return

    const messageData = {
      type: "chat",
      senderId: selectedStaff.id,
      senderName: selectedStaff.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }

    // Add to local messages
    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      senderId: selectedStaff.id,
      senderName: selectedStaff.name,
      message: newMessage.trim(),
      timestamp: new Date(),
    }])

    // Send to all peers
    dataConnectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send(messageData)
      }
    })

    setNewMessage("")
  }

  // Handle end call
  const handleEndCall = () => {
    // Stop all streams
    localStreamRef.current?.getTracks().forEach(track => track.stop())
    screenStreamRef.current?.getTracks().forEach(track => track.stop())
    previewStream?.getTracks().forEach(track => track.stop())
    
    // Clear interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }
    
    // Destroy peer
    peerRef.current?.destroy()
    
    onEndCall()
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Get initials
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  // All participants including remote
  const allParticipants = [
    { id: selectedStaff?.id || "", name: selectedStaff?.name || "You", isLocal: true },
    ...Array.from(remoteParticipants.keys()).map((peerId, i) => ({
      id: peerId,
      name: participants[i]?.name || `Participant ${i + 1}`,
      isLocal: false,
    })),
  ]

  // ============================================
  // LOBBY VIEW - Staff Selection (Like Google Meet)
  // ============================================
  if (isInLobby) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-6">
          {/* Camera Preview */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Video className="h-5 w-5" />
                Camera Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                {isPreviewVideoEnabled ? (
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                    <div className="text-center">
                      <VideoOff className="h-16 w-16 text-white/60 mx-auto mb-2" />
                      <p className="text-white/60">Camera is off</p>
                    </div>
                  </div>
                )}
                
                {selectedStaff && (
                  <div className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                    {selectedStaff.name}
                  </div>
                )}
              </div>
              
              {/* Preview Controls */}
              <div className="flex justify-center gap-3">
                <Button
                  variant={isPreviewAudioEnabled ? "secondary" : "destructive"}
                  size="lg"
                  className="rounded-full h-12 w-12"
                  onClick={togglePreviewAudio}
                >
                  {isPreviewAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button
                  variant={isPreviewVideoEnabled ? "secondary" : "destructive"}
                  size="lg"
                  className="rounded-full h-12 w-12"
                  onClick={togglePreviewVideo}
                >
                  {isPreviewVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Info & Staff Selection */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white">{meetingTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Staff Selection */}
              <div>
                <label className="text-white font-medium mb-2 block flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Select who you are:
                </label>
                
                {isLoadingStaff ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-400">Loading staff from database...</span>
                  </div>
                ) : staffList.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No staff found in database</p>
                    <p className="text-sm mt-1">Please add staff members first</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[250px] pr-3">
                    <div className="space-y-2">
                      {staffList.map((staff) => (
                        <button
                          key={staff.id}
                          onClick={() => handleSelectStaff(staff)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                            selectedStaff?.id === staff.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                          }`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`${
                              selectedStaff?.id === staff.id 
                                ? "bg-blue-700 text-white" 
                                : "bg-gray-600 text-white"
                            }`}>
                              {getInitials(staff.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{staff.name}</p>
                            <p className={`text-sm ${
                              selectedStaff?.id === staff.id ? "text-blue-200" : "text-gray-400"
                            }`}>
                              {staff.role || staff.email || "Staff"}
                            </p>
                          </div>
                          {selectedStaff?.id === staff.id && (
                            <CheckCircle className="h-5 w-5" />
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Participants in meeting */}
              {participants.length > 0 && (
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">Invited participants:</p>
                  <div className="flex flex-wrap gap-2">
                    {participants.slice(0, 5).map((p, i) => (
                      <Badge key={i} variant="secondary" className="bg-gray-700 text-gray-200">
                        {p.name}
                      </Badge>
                    ))}
                    {participants.length > 5 && (
                      <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                        +{participants.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Join Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={onEndCall}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedStaff}
                  onClick={handleJoinMeeting}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Meeting
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ============================================
  // VIDEO CALL VIEW
  // ============================================
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-lg">{meetingTitle}</h2>
          <Badge variant="outline" className="text-green-400 border-green-400">
            {isConnecting ? "Connecting..." : "Connected"}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatDuration(callDuration)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-white">
            <Users className="h-4 w-4" />
            <span>{allParticipants.length}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Screen Share View - Main content when sharing */}
          {isScreenSharing && screenStreamRef.current && (
            <div className="flex-1 bg-black rounded-lg overflow-hidden relative mb-4 min-h-[400px]">
              <video
                ref={screenShareRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2">
                <Badge className="bg-red-500">Screen Sharing</Badge>
              </div>
              {/* Small self-view when screen sharing */}
              <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                {isVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                    <span className="text-white text-xs">{selectedStaff?.name || "You"}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participants Grid - Full size when not sharing, thumbnails when sharing */}
          <div className={`grid gap-4 ${isScreenSharing ? 'flex-none' : 'flex-1'} ${
            isScreenSharing ? "grid-cols-4 h-32" :
            allParticipants.length === 1 ? "grid-cols-1" :
            allParticipants.length === 2 ? "grid-cols-2" :
            allParticipants.length <= 4 ? "grid-cols-2" :
            allParticipants.length <= 6 ? "grid-cols-3" :
            "grid-cols-4"
          }`}>
            {/* Local Video - hidden when screen sharing (shown in PIP) */}
            {!isScreenSharing && (
            <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
              {isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl bg-white/20 text-white">
                      {selectedStaff ? getInitials(selectedStaff.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="bg-black/60 text-white px-2 py-1 rounded text-sm">
                  You ({selectedStaff?.name}) {!isAudioEnabled && "🔇"}
                </span>
              </div>
            </div>
            )}

            {/* Remote Participants */}
            {Array.from(remoteParticipants.entries()).map(([peerId, stream], index) => (
              <div key={peerId} className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
                <video
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  ref={(el) => {
                    if (el && el.srcObject !== stream) {
                      el.srcObject = stream
                    }
                  }}
                />
                <div className="absolute bottom-3 left-3">
                  <span className="bg-black/60 text-white px-2 py-1 rounded text-sm">
                    {participants[index]?.name || `Participant ${index + 1}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-center text-sm">No messages yet</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${
                        msg.senderId === selectedStaff?.id
                          ? "ml-auto bg-blue-600"
                          : "bg-gray-700"
                      } p-3 rounded-lg max-w-[85%]`}
                    >
                      {msg.senderId !== selectedStaff?.id && (
                        <p className="text-xs text-gray-400 mb-1">{msg.senderName}</p>
                      )}
                      <p className="text-white text-sm">{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-gray-700 border-gray-600 text-white"
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button size="icon" onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Participants Sidebar */}
        {isParticipantsOpen && (
          <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Participants ({allParticipants.length})</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsParticipantsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {allParticipants.map((p, i) => (
                  <div
                    key={p.id || i}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {getInitials(p.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        {p.name} {p.isLocal && "(You)"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-4 bg-gray-800/80 backdrop-blur">
        <div className="flex items-center justify-center gap-3">
          <Button
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full h-14 w-14"
            onClick={toggleAudio}
          >
            {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>
          
          <Button
            variant={isVideoEnabled ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full h-14 w-14"
            onClick={toggleVideo}
          >
            {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>
          
          <Button
            variant={isScreenSharing ? "destructive" : "secondary"}
            size="lg"
            className="rounded-full h-14 w-14"
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          >
            <Monitor className="h-6 w-6" />
          </Button>
          
          <Button
            variant={isChatOpen ? "default" : "secondary"}
            size="lg"
            className="rounded-full h-14 w-14"
            onClick={() => {
              setIsChatOpen(!isChatOpen)
              setIsParticipantsOpen(false)
            }}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
          
          <Button
            variant={isParticipantsOpen ? "default" : "secondary"}
            size="lg"
            className="rounded-full h-14 w-14"
            onClick={() => {
              setIsParticipantsOpen(!isParticipantsOpen)
              setIsChatOpen(false)
            }}
          >
            <Users className="h-6 w-6" />
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full h-14 w-14 ml-4"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}

