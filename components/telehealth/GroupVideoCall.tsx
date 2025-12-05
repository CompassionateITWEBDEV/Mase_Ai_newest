"use client"

import { useEffect, useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  Loader2, AlertCircle, User, Users, MessageSquare, Send, X, Monitor, MonitorOff,
  Clock, Timer, Plus, Minus
} from 'lucide-react'

interface Participant {
  id: string
  name: string
  peerId?: string
  stream?: MediaStream
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: Date
}

interface ParticipantState {
  peerId: string
  userId: string
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
}

interface GroupVideoCallProps {
  consultationId: string
  currentUserId: string
  currentUserName: string
  participants: Participant[]
  callId?: string
  onCallEnd: () => void
  onConnected?: () => void
  // New props for meeting management
  meetingDuration?: number // Duration in minutes
  isHost?: boolean // Is this user the host/organizer
  meetingId?: string // Database meeting ID
  meetingTitle?: string // Meeting title for display
}

export function GroupVideoCall({
  consultationId,
  currentUserId,
  currentUserName,
  participants,
  callId,
  onCallEnd,
  onConnected,
  meetingDuration = 0, // 0 means no limit
  isHost = false,
  meetingId,
  meetingTitle
}: GroupVideoCallProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [peerLoaded, setPeerLoaded] = useState(false)
  const [participantStreams, setParticipantStreams] = useState<Map<string, MediaStream>>(new Map())
  const [participantsWithPeerIds, setParticipantsWithPeerIds] = useState<Map<string, string>>(new Map()) // userId -> peerId mapping
  
  // Chat states
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Screen sharing state
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const screenStreamRef = useRef<MediaStream | null>(null)
  
  // Video refresh key - increment to force video elements to remount
  const [videoRefreshKey, setVideoRefreshKey] = useState(0)
  
  // Participant states (audio/video enabled/disabled)
  const [participantStates, setParticipantStates] = useState<Map<string, ParticipantState>>(new Map())
  
  // Meeting duration dialog states
  const [showDurationDialog, setShowDurationDialog] = useState(false)
  const [remainingTime, setRemainingTime] = useState(meetingDuration * 60) // Convert to seconds
  const [hasShownWarning, setHasShownWarning] = useState(false)
  const [extendMinutes, setExtendMinutes] = useState(15)

  // Reset remaining time when meetingDuration prop changes
  useEffect(() => {
    if (meetingDuration > 0) {
      setRemainingTime(meetingDuration * 60)
      console.log(`⏰ [GROUP] Meeting duration set: ${meetingDuration} minutes`)
    }
  }, [meetingDuration])

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const peerRef = useRef<any>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, any>>(new Map())
  const isMountedRef = useRef<boolean>(true) // Track if component is mounted
  const failedConnectionsRef = useRef<Set<string>>(new Set()) // Track failed connections
  const chatEndRef = useRef<HTMLDivElement>(null)
  const dataConnectionsRef = useRef<Map<string, any>>(new Map()) // Track data connections for chat

  // Calculate connected participants and presenter mode
  const connectedParticipants = useMemo(() => {
    return participants.filter(p => {
      const participantPeerId = participantsWithPeerIds.get(p.id)
      return participantPeerId && participantStreams.has(participantPeerId)
    })
  }, [participants, participantsWithPeerIds, participantStreams])

  const presenterPeerId = useMemo(() => {
    if (isScreenSharing) return peerRef.current?.id
    return Array.from(participantStates.entries()).find(([_, state]) => state.isScreenSharing)?.[0]
  }, [isScreenSharing, participantStates])

  const isPresenterMode = !!presenterPeerId

  const totalParticipants = connectedParticipants.length + 1 // including self

  // Helper function to safely play video without AbortError spam
  const safePlayVideo = async (videoElement: HTMLVideoElement, context: string = '') => {
    try {
      // Check if video is already playing
      if (videoElement.readyState >= 2 && !videoElement.paused) {
        return // Already playing
      }
      await videoElement.play()
    } catch (err: any) {
      // Only log non-AbortError issues
      if (err.name !== 'AbortError') {
        console.error(`❌ [GROUP] ${context} video play error:`, err.name, err.message)
      }
      // AbortError is expected when rapidly switching streams, ignore it
    }
  }

  // Load PeerJS from CDN
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Peer) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'
      script.async = true
      script.onload = () => {
        console.log('✅ [GROUP] PeerJS loaded from CDN')
        setPeerLoaded(true)
      }
      script.onerror = () => {
        console.error('❌ [GROUP] Failed to load PeerJS')
        setError('Failed to load video library')
      }
      document.body.appendChild(script)
    } else {
      setPeerLoaded(true)
    }
  }, [])

  // Call duration timer and meeting duration tracking
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
        
        // Track remaining time if meeting has a duration limit
        if (meetingDuration > 0) {
          setRemainingTime(prev => {
            const newTime = prev - 1
            
            // Show warning dialog 5 minutes before end (only for host)
            if (isHost && newTime === 300 && !hasShownWarning) { // 5 minutes = 300 seconds
              setShowDurationDialog(true)
              setHasShownWarning(true)
            }
            
            // Auto-end call when time runs out
            if (newTime <= 0) {
              console.log('⏰ [GROUP] Meeting time has ended')
              endCall()
            }
            
            return Math.max(0, newTime)
          })
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isConnected, meetingDuration, isHost, hasShownWarning])

  // Format remaining time for display
  const formatRemainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Extend meeting duration
  const extendMeeting = async (additionalMinutes: number) => {
    setRemainingTime(prev => prev + (additionalMinutes * 60))
    setShowDurationDialog(false)
    setHasShownWarning(false)
    
    // Update in database if meetingId exists
    if (meetingId) {
      try {
        await fetch('/api/communications/meetings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: meetingId,
            duration_minutes: Math.ceil((callDuration + remainingTime + additionalMinutes * 60) / 60)
          })
        })
        console.log('✅ [GROUP] Meeting duration extended in database')
      } catch (err) {
        console.error('Error updating meeting duration:', err)
      }
    }
  }

  // Save meeting to database when it ends
  const saveMeetingRecord = async () => {
    if (!meetingId) return
    
    try {
      await fetch('/api/communications/meetings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: meetingId,
          status: 'completed',
          actual_duration: Math.ceil(callDuration / 60),
          end_time: new Date().toISOString()
        })
      })
      console.log('✅ [GROUP] Meeting record saved')
    } catch (err) {
      console.error('Error saving meeting record:', err)
    }
  }

  // Ensure local video element always has the stream attached
  // BUT don't overwrite if we're screen sharing!
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      // Don't reset to camera if we're screen sharing - keep the screen stream!
      if (isScreenSharing && screenStreamRef.current) {
        console.log('🖥️ [GROUP] Keeping screen share stream (not resetting to camera)')
        return
      }
      
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        console.log('🎥 [GROUP] Attaching local stream to video element')
        localVideoRef.current.srcObject = localStreamRef.current
        safePlayVideo(localVideoRef.current, 'Local video')
      }
    }
  }, [isPresenterMode, isScreenSharing]) // Include isScreenSharing in deps

  // Initialize PeerJS and connect to all participants
  useEffect(() => {
    if (!peerLoaded) return

    console.log('🚀 [GROUP] GroupVideoCall initializing...')
    console.log('  - consultationId:', consultationId)
    console.log('  - currentUserId:', currentUserId)
    console.log('  - currentUserName:', currentUserName)
    console.log('  - participants:', participants.length)
    console.log('  - meetingDuration:', meetingDuration, 'minutes')
    console.log('  - isHost:', isHost)
    console.log('  - meetingTitle:', meetingTitle)

    let mounted = true
    isMountedRef.current = true // Set mounted ref

    const initializeGroupCall = async () => {
      try {
        console.log('🎥 [GROUP] Requesting camera and microphone...')
        
        // Get local media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        })

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop())
          return
        }

        localStreamRef.current = stream

        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
          safePlayVideo(localVideoRef.current, 'Initial local video')
        }

        console.log('✅ [GROUP] Got local media stream')

        // Initialize PeerJS
        const Peer = (window as any).Peer
        
        // Destroy any existing peer first
        if (peerRef.current) {
          console.log('🧹 [GROUP] Destroying existing peer...')
          try {
            peerRef.current.destroy()
          } catch (e) {
            console.log('Could not destroy previous peer')
          }
          peerRef.current = null
        }
        
        // Generate unique peer ID
        const myPeerId = `group-${currentUserId}-${Date.now()}`
        console.log(`🔗 [GROUP] Creating peer with ID: ${myPeerId}`)
        
        const peer = new Peer(myPeerId, {
          debug: 0, // Disable debug to suppress error messages
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
              }
            ]
          }
        })

        peerRef.current = peer

        peer.on('open', async (id: string) => {
          console.log('✅ [GROUP] Peer connection opened. My ID:', id)
          
          // Store our peer ID - use meeting room OR legacy call-based approach
          const isMeetingRoom = consultationId.startsWith('meeting-')
          
          try {
            if (isMeetingRoom) {
              // Meeting room style - register with room ID
              console.log(`🏠 [GROUP] Registering in meeting room: ${consultationId}`)
              await fetch('/api/communications/calls/participants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  meetingRoomId: consultationId,
                  oderId: currentUserId,
                  peerId: id,
                  userName: currentUserName
                })
              })
              console.log(`✅ [GROUP] Registered in meeting room`)
            } else if (callId) {
              // Legacy call-based registration
              await fetch('/api/communications/calls/participants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callId,
                  oderId: currentUserId,
                  peerId: id
                })
              })
              console.log(`✅ [GROUP] Stored my peer ID in database`)
            }
          } catch (err) {
            console.error('Failed to register peer:', err)
          }

          // Poll for other participants' peer IDs and connect to them
          console.log(`🔍 [GROUP] Starting to poll for participants...`)
          pollAndConnectToParticipants(peer, stream)
          
          setIsConnected(true)
          if (onConnected) onConnected()
        })

        // Handle incoming calls from other participants
        peer.on('call', (call: any) => {
          console.log('📞 [GROUP] Incoming call from:', call.peer)
          call.answer(stream)
          handleIncomingCall(call)
        })

        // Handle incoming data connections (for chat)
        peer.on('connection', (conn: any) => {
          console.log('💬 [GROUP] Data connection from:', conn.peer)
          setupDataConnection(conn)
        })

        peer.on('error', (err: any) => {
          // Use console.log for expected errors, console.error only for critical ones
          const isCriticalError = err.type === 'browser-incompatible' || err.type === 'server-error'
          
          if (isCriticalError) {
            console.error('❌ [GROUP] Critical peer error:', err.type, err.message || err)
          } else {
            console.log('⚠️ [GROUP] Peer event:', err.type, '-', err.message || 'No message')
          }
          
          // Handle different error types
          if (err.type === 'browser-incompatible') {
            setError('Your browser does not support video calls.')
          } else if (err.type === 'peer-unavailable') {
            console.log('⚠️ [GROUP] Peer unavailable - participant may have left or not ready yet')
            // Don't show error - this is normal when someone leaves or hasn't joined yet
          } else if (err.type === 'network' || err.type === 'disconnected') {
            console.log('⚠️ [GROUP] Network issue, attempting to reconnect...')
            if (!peer.destroyed && mounted) {
              setTimeout(() => {
                try {
                  peer.reconnect()
                } catch (e) {
                  console.log('Could not reconnect peer')
                }
              }, 1000)
            }
          } else if (err.type === 'unavailable-id') {
            console.log('⚠️ [GROUP] Peer ID taken - previous connection may still be active')
            // This is usually not critical for group calls
          } else if (err.type === 'server-error') {
            setError('Connection server error. Please try again.')
          } else if (err.message && err.message.includes('Could not connect to peer')) {
            console.log('⚠️ [GROUP] Could not connect - peer may have left the call')
            // Don't show error - participant probably left
          }
        })
        
        peer.on('disconnected', () => {
          console.log('⚠️ [GROUP] Disconnected from server, attempting to reconnect...')
          if (!peer.destroyed && mounted) {
            // Wait a bit before reconnecting
            setTimeout(() => {
              try {
                if (!peer.destroyed && mounted) {
                  peer.reconnect()
                  console.log('✅ [GROUP] Reconnection attempted')
                }
              } catch (e) {
                console.log('Could not reconnect peer:', e)
              }
            }, 1000)
          }
        })
        
        peer.on('close', () => {
          console.log('❌ [GROUP] Peer connection closed')
        })

      } catch (err: any) {
        console.error('❌ [GROUP] Media error:', err)
        setError('Could not access camera/microphone. Please allow permissions.')
      }
    }

    const pollAndConnectToParticipants = async (peer: any, stream: MediaStream) => {
      let pollCount = 0
      const isMeetingRoom = consultationId.startsWith('meeting-')
      
      // Poll every 2 seconds for new participants
      const pollInterval = setInterval(async () => {
        // Stop polling if component unmounted
        if ((!callId && !isMeetingRoom) || !mounted || !isMountedRef.current) {
          console.log('🛑 [GROUP] Stopping poll - component unmounted or call ended')
          clearInterval(pollInterval)
          return
        }
        
        pollCount++
        console.log(`🔍 [GROUP] Polling attempt #${pollCount}... (${isMeetingRoom ? 'meeting room' : 'call'})`)
        
        // Check if peer is still valid and connected
        if (!peer || peer.destroyed || peer.disconnected) {
          console.log('⚠️ [GROUP] Peer is disconnected or destroyed, attempting reconnect...')
          if (peer && !peer.destroyed && mounted) {
            try {
              peer.reconnect()
            } catch (e) {
              console.error('Failed to reconnect peer:', e)
            }
          }
          return
        }

        try {
          // Use meeting room endpoint OR legacy call endpoint
          const endpoint = isMeetingRoom 
            ? `/api/communications/calls/participants?meetingRoomId=${consultationId}`
            : `/api/communications/calls/participants?callId=${callId}`
          
          const res = await fetch(endpoint)
          const data = await res.json()
          
          console.log(`📊 [GROUP] Found ${data.participants?.length || 0} participants`)
          
          if (data.success && data.participants) {
            // Update participants with peer IDs mapping
            const peerIdMap = new Map<string, string>()
            data.participants.forEach((p: any) => {
              if (p.user_id && p.peer_id) {
                peerIdMap.set(p.user_id, p.peer_id)
              }
            })
            setParticipantsWithPeerIds(peerIdMap)
            console.log(`📝 [GROUP] Peer ID mapping: ${peerIdMap.size} peers`)
            
            for (const participant of data.participants) {
              // Skip ourselves
              if (participant.user_id === currentUserId) {
                continue
              }
              
              // Check if we have a peer ID
              if (!participant.peer_id) {
                console.log(`⏳ [GROUP] Waiting for peer ID from ${participant.name || participant.user_id}...`)
                continue
              }
              
              // Check if already connected
              if (peerConnectionsRef.current.has(participant.peer_id)) {
                continue
              }
              
              // Skip if we've failed to connect to this peer multiple times
              if (failedConnectionsRef.current.has(participant.peer_id)) {
                continue
              }
              
              // Connect to this participant
              if (peer && !peer.destroyed && !peer.disconnected && mounted && isMountedRef.current) {
                console.log(`📞 [GROUP] 🎯 Calling participant: ${participant.name || participant.user_id} (${participant.peer_id})`)
                try {
                  const call = peer.call(participant.peer_id, stream)
                  if (call) {
                    peerConnectionsRef.current.set(participant.peer_id, call)
                    handleOutgoingCall(call, participant)
                    console.log(`✅ [GROUP] Call initiated to ${participant.name || participant.user_id}`)
                    
                    // Also establish data connection for chat
                    if (!dataConnectionsRef.current.has(participant.peer_id)) {
                      const dataConn = peer.connect(participant.peer_id, { reliable: true })
                      setupDataConnection(dataConn)
                      console.log(`💬 [GROUP] Data connection initiated to ${participant.name}`)
                    }
                  } else {
                    console.error(`❌ [GROUP] Call returned null for ${participant.name}`)
                  }
                } catch (err: any) {
                  // Silently handle connection errors (participant may have left)
                  const errorMsg = err?.message || err?.toString() || ''
                  if (errorMsg.includes('Could not connect') || errorMsg.includes('peer')) {
                    console.log(`⚠️ [GROUP] Could not connect to ${participant.name} (may have left or not ready)`)
                    // Mark this peer as failed so we don't keep trying
                    failedConnectionsRef.current.add(participant.peer_id)
                  } else {
                    console.error(`❌ [GROUP] Error calling ${participant.name}:`, err.message)
                  }
                }
              } else {
                console.log('⚠️ [GROUP] Cannot call - peer not ready or component unmounting')
              }
            }
          } else {
            console.log('⚠️ [GROUP] No participants data received')
          }
        } catch (err) {
          console.error('❌ [GROUP] Error polling participants:', err)
        }
      }, 2000)

      // Cleanup - clear interval when component unmounts
      return () => {
        console.log('🧹 [GROUP] Cleaning up polling interval')
        clearInterval(pollInterval)
      }
    }

    const setupDataConnection = (conn: any) => {
      dataConnectionsRef.current.set(conn.peer, conn)
      
      conn.on('open', () => {
        console.log('✅ [GROUP] Data connection opened with:', conn.peer)
        
        // Send initial state when connection opens
        const stateMessage = {
          type: 'state',
          userId: currentUserId,
          peerId: peerRef.current?.id,
          isVideoEnabled,
          isAudioEnabled,
          isScreenSharing
        }
        try {
          conn.send(JSON.stringify(stateMessage))
          console.log(`📡 [GROUP] Initial state sent to: ${conn.peer}`)
        } catch (e) {
          console.error(`❌ [GROUP] Failed to send initial state:`, e)
        }
      })
      
      conn.on('data', (data: any) => {
        try {
          const parsed = JSON.parse(data)
          
          // Handle different message types
          if (parsed.type === 'state') {
            // Update participant state
            console.log(`📡 [GROUP] Received state from ${parsed.peerId}:`, parsed)
            setParticipantStates(prev => {
              const newMap = new Map(prev)
              newMap.set(parsed.peerId, {
                peerId: parsed.peerId,
                userId: parsed.userId,
                isAudioEnabled: parsed.isAudioEnabled,
                isVideoEnabled: parsed.isVideoEnabled,
                isScreenSharing: parsed.isScreenSharing ?? false
              })
              return newMap
            })
          } else if (parsed.type === 'track-update') {
            // Handle track update notification (screen share/camera switch)
            console.log(`🔄 [GROUP] Track update notification from ${parsed.peerId}`)
            console.log(`🔄 [GROUP] Timestamp: ${parsed.timestamp}`)
            
            // Force React to re-render video elements by incrementing the key
            setVideoRefreshKey(prev => prev + 1)
            console.log(`🔄 [GROUP] Incrementing videoRefreshKey to force re-render`)
            
            // Force video element to refresh by removing and re-adding the stream
            const videoElement = remoteVideoRefs.current.get(parsed.peerId)
            const peerConnection = peerConnectionsRef.current.get(parsed.peerId)
            
            if (peerConnection && peerConnection.peerConnection) {
              console.log(`🔄 [GROUP] Forcing stream refresh for ${parsed.peerId}`)
              
              // Try getting from receivers
              const receivers = peerConnection.peerConnection.getReceivers()
              console.log(`🔄 [GROUP] Receivers count: ${receivers.length}`)
              
              const videoReceiver = receivers.find((r: any) => r.track?.kind === 'video')
              const audioReceiver = receivers.find((r: any) => r.track?.kind === 'audio')
              
              if (videoReceiver && videoReceiver.track) {
                console.log(`🔄 [GROUP] Video track id: ${videoReceiver.track.id}`)
                console.log(`🔄 [GROUP] Video track label: ${videoReceiver.track.label}`)
                console.log(`🔄 [GROUP] Video track readyState: ${videoReceiver.track.readyState}`)
                
                // Create a COMPLETELY new MediaStream with the tracks
                const freshStream = new MediaStream()
                freshStream.addTrack(videoReceiver.track)
                if (audioReceiver && audioReceiver.track) {
                  freshStream.addTrack(audioReceiver.track)
                }
                
                // Update stream in state
                setParticipantStreams(prev => {
                  const newMap = new Map(prev)
                  newMap.set(parsed.peerId, freshStream)
                  return newMap
                })
                
                // Force video element to completely reload
                if (videoElement) {
                  console.log(`🔄 [GROUP] Forcing video element reload for ${parsed.peerId}`)
                  
                  // Complete detach and reattach
                  videoElement.pause()
                  videoElement.srcObject = null
                  videoElement.load()
                  
                  // Reattach after a delay
                  setTimeout(() => {
                    videoElement.srcObject = freshStream
                    videoElement.play().catch((e) => {
                      console.log('Play error (usually safe to ignore):', e.name)
                    })
                    console.log(`✅ [GROUP] Video reloaded for ${parsed.peerId}`)
                  }, 200)
                }
              } else {
                console.error(`❌ [GROUP] No video receiver found for ${parsed.peerId}`)
              }
            } else {
              console.error(`❌ [GROUP] No peer connection found for ${parsed.peerId}`)
            }
          } else {
            // Handle chat message
            const message: ChatMessage = parsed
            console.log('💬 [GROUP] Received message from:', message.senderName, message.message)
            
            // Add received message to chat
            setChatMessages(prev => [...prev, message])
            
            // If chat is closed, increment unread count
            if (!isChatOpen) {
              setUnreadCount(prev => prev + 1)
            }
          }
        } catch (e) {
          console.error('Error parsing data message:', e)
        }
      })
      
      conn.on('close', () => {
        console.log('❌ [GROUP] Data connection closed with:', conn.peer)
        dataConnectionsRef.current.delete(conn.peer)
      })
      
      conn.on('error', (err: any) => {
        console.error('❌ [GROUP] Data connection error with:', conn.peer, err)
        dataConnectionsRef.current.delete(conn.peer)
      })
    }

    const handleIncomingCall = (call: any) => {
      console.log(`📞 [GROUP] Setting up handlers for incoming call from: ${call.peer}`)
      
      // ✅ IMPORTANT: Store the call in peerConnectionsRef so we can use it for screen share!
      peerConnectionsRef.current.set(call.peer, call)
      console.log(`📞 [GROUP] Stored incoming call. Total connections: ${peerConnectionsRef.current.size}`)
      
      call.on('stream', (remoteStream: MediaStream) => {
        console.log(`✅ [GROUP] 🎥 Received stream from: ${call.peer}`)
        console.log(`📹 Stream has ${remoteStream.getVideoTracks().length} video tracks`)
        console.log(`🎤 Stream has ${remoteStream.getAudioTracks().length} audio tracks`)
        
        // Remove from failed connections (successfully connected)
        failedConnectionsRef.current.delete(call.peer)
        
        setParticipantStreams(prev => {
          const newMap = new Map(prev)
          newMap.set(call.peer, remoteStream)
          console.log(`✅ [GROUP] Stream stored. Total streams: ${newMap.size}`)
          return newMap
        })
        
        // Listen for track changes (screen share, camera switch)
        try {
          if (call.peerConnection) {
            call.peerConnection.ontrack = (event: RTCTrackEvent) => {
              console.log(`🔄 [GROUP] Track changed from ${call.peer}:`, event.track.kind)
              if (event.streams && event.streams[0]) {
                const newStream = event.streams[0]
                console.log(`📹 [GROUP] Updating stream for ${call.peer} due to track change`)
                setParticipantStreams(prev => {
                  const newMap = new Map(prev)
                  newMap.set(call.peer, newStream)
                  return newMap
                })
              }
            }
          }
        } catch (err) {
          console.error('❌ [GROUP] Error setting up track listener:', err)
        }
      })

      call.on('close', () => {
        console.log(`👋 [GROUP] Participant left: ${call.peer}`)
        // Remove their stream from display
        setParticipantStreams(prev => {
          const newMap = new Map(prev)
          newMap.delete(call.peer)
          console.log(`✅ [GROUP] Stream removed. Remaining streams: ${newMap.size}`)
          return newMap
        })
        // Also remove from peerConnections
        peerConnectionsRef.current.delete(call.peer)
        console.log(`✅ [GROUP] Peer connection removed. Remaining: ${peerConnectionsRef.current.size}`)
      })
      
      call.on('error', (err: any) => {
        console.error(`❌ [GROUP] Call error with ${call.peer}:`, err)
        // Remove stream on error too
        setParticipantStreams(prev => {
          const newMap = new Map(prev)
          newMap.delete(call.peer)
          return newMap
        })
        // Also remove from peerConnections
        peerConnectionsRef.current.delete(call.peer)
      })
    }

    const handleOutgoingCall = (call: any, participant: any) => {
      console.log(`📞 [GROUP] Setting up handlers for outgoing call to: ${participant.name}`)
      
      call.on('stream', (remoteStream: MediaStream) => {
        console.log(`✅ [GROUP] 🎥 Received stream from: ${participant.name}`)
        console.log(`📹 Stream has ${remoteStream.getVideoTracks().length} video tracks`)
        console.log(`🎤 Stream has ${remoteStream.getAudioTracks().length} audio tracks`)
        
        // Remove from failed connections (successfully connected)
        failedConnectionsRef.current.delete(call.peer)
        
        setParticipantStreams(prev => {
          const newMap = new Map(prev)
          newMap.set(call.peer, remoteStream)
          console.log(`✅ [GROUP] Stream stored. Total streams: ${newMap.size}`)
          return newMap
        })
        
        // Listen for track changes (screen share, camera switch)
        try {
          if (call.peerConnection) {
            call.peerConnection.ontrack = (event: RTCTrackEvent) => {
              console.log(`🔄 [GROUP] Track changed from ${participant.name}:`, event.track.kind)
              if (event.streams && event.streams[0]) {
                const newStream = event.streams[0]
                console.log(`📹 [GROUP] Updating stream for ${participant.name} due to track change`)
                setParticipantStreams(prev => {
                  const newMap = new Map(prev)
                  newMap.set(call.peer, newStream)
                  return newMap
                })
              }
            }
          }
        } catch (err) {
          console.error('❌ [GROUP] Error setting up track listener:', err)
        }
      })

      call.on('close', () => {
        console.log(`👋 [GROUP] Participant left: ${participant.name}`)
        peerConnectionsRef.current.delete(call.peer)
        // Remove their stream from display
        setParticipantStreams(prev => {
          const newMap = new Map(prev)
          newMap.delete(call.peer)
          console.log(`✅ [GROUP] Stream removed. Remaining streams: ${newMap.size}`)
          return newMap
        })
      })
      
      call.on('error', (err: any) => {
        console.error(`❌ [GROUP] Call error with ${participant.name}:`, err)
        peerConnectionsRef.current.delete(call.peer)
        // Remove stream on error too
        setParticipantStreams(prev => {
          const newMap = new Map(prev)
          newMap.delete(call.peer)
          return newMap
        })
      })
    }

    initializeGroupCall()

    // Cleanup
    return () => {
      mounted = false
      isMountedRef.current = false // Update ref too
      console.log('🧹 [GROUP] Cleaning up...')
      
      // Remove from meeting room if this was a meeting
      if (consultationId.startsWith('meeting-')) {
        fetch(`/api/communications/calls/participants?meetingRoomId=${consultationId}&oderId=${currentUserId}`, {
          method: 'DELETE'
        }).catch(err => console.log('Cleanup error:', err))
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      peerConnectionsRef.current.forEach(call => call.close())
      if (peerRef.current) {
        peerRef.current.destroy()
      }
    }
  }, [peerLoaded, consultationId, currentUserId, callId, participants])

  // Update video elements when streams change
  useEffect(() => {
    participantStreams.forEach((stream, peerId) => {
      const videoElement = remoteVideoRefs.current.get(peerId)
      if (videoElement && videoElement.srcObject !== stream) {
        console.log(`🎥 [GROUP] Attaching stream for peer: ${peerId}`)
        videoElement.srcObject = stream
        safePlayVideo(videoElement, `Stream attachment [${peerId}]`)
      }
    })
  }, [participantStreams])
  
  // Re-attach streams when presenter mode changes (layout switch)
  useEffect(() => {
    // Force re-attachment of all streams when layout changes
    const timer = setTimeout(() => {
      participantStreams.forEach((stream, peerId) => {
        const videoElement = remoteVideoRefs.current.get(peerId)
        if (videoElement) {
          console.log(`🔄 [GROUP] Re-attaching stream after layout change: ${peerId}`)
          videoElement.srcObject = stream
          safePlayVideo(videoElement, `Layout change [${peerId}]`)
        }
      })
    }, 100) // Small delay to ensure DOM is updated
    
    return () => clearTimeout(timer)
  }, [isPresenterMode, participantStreams])

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        const newState = !isVideoEnabled
        videoTrack.enabled = newState
        setIsVideoEnabled(newState)
        
        // Broadcast state change to all peers
        broadcastState({ isVideoEnabled: newState, isAudioEnabled })
      }
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        const newState = !isAudioEnabled
        audioTrack.enabled = newState
        setIsAudioEnabled(newState)
        
        // Broadcast state change to all peers
        broadcastState({ isVideoEnabled, isAudioEnabled: newState })
      }
    }
  }

  const broadcastState = (state: { isVideoEnabled: boolean, isAudioEnabled: boolean, isScreenSharing?: boolean }) => {
    const stateMessage = {
      type: 'state',
      userId: currentUserId,
      peerId: peerRef.current?.id,
      isVideoEnabled: state.isVideoEnabled,
      isAudioEnabled: state.isAudioEnabled,
      isScreenSharing: state.isScreenSharing ?? isScreenSharing
    }
    
    let successCount = 0
    let failCount = 0
    
    // Broadcast to all connected peers
    dataConnectionsRef.current.forEach((conn, peerId) => {
      try {
        if (conn.open) {
          conn.send(JSON.stringify(stateMessage))
          successCount++
          console.log(`📡 [GROUP] State sent to: ${peerId}`, state)
        } else {
          failCount++
          console.log(`⚠️ [GROUP] Connection not open for: ${peerId}`)
        }
      } catch (e) {
        failCount++
        console.error(`❌ [GROUP] Failed to send state to ${peerId}:`, e)
      }
    })
    
    console.log(`📊 [GROUP] Broadcast complete: ${successCount} sent, ${failCount} failed out of ${dataConnectionsRef.current.size} connections`)
  }

  const broadcastTrackUpdate = () => {
    const trackUpdateMessage = {
      type: 'track-update',
      userId: currentUserId,
      peerId: peerRef.current?.id,
      timestamp: Date.now()
    }
    
    let successCount = 0
    
    // Notify all connected peers about track change
    dataConnectionsRef.current.forEach((conn, peerId) => {
      try {
        if (conn.open) {
          conn.send(JSON.stringify(trackUpdateMessage))
          successCount++
          console.log(`🔄 [GROUP] Track update sent to: ${peerId}`)
        }
      } catch (e) {
        console.error(`❌ [GROUP] Failed to send track update to ${peerId}:`, e)
      }
    })
    
    console.log(`🔄 [GROUP] Track update broadcast to ${successCount} peers`)
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare()
    } else {
      await startScreenShare()
    }
  }

  const startScreenShare = async () => {
    try {
      console.log('🖥️ [GROUP] Starting screen share...')
      console.log(`🖥️ [GROUP] Total peer connections: ${peerConnectionsRef.current.size}`)
      
      // Get screen capture
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // @ts-ignore - cursor and displaySurface are valid but not in type definitions
          cursor: 'always',
          displaySurface: 'monitor',
        } as MediaTrackConstraints,
        audio: true, // Include system audio if available
      })
      
      // Get the video track
      const screenVideoTrack = screenStream.getVideoTracks()[0]
      console.log(`🖥️ [GROUP] Got screen track:`, screenVideoTrack.label)
      console.log(`🖥️ [GROUP] Screen track id:`, screenVideoTrack.id)
      console.log(`🖥️ [GROUP] Screen track readyState:`, screenVideoTrack.readyState)
      
      // Replace video track in all peer connections - wait for all to complete
      const replacePromises: Promise<void>[] = []
      
      peerConnectionsRef.current.forEach((call, peerId) => {
        const promise = (async () => {
          try {
            console.log(`🖥️ [GROUP] Processing peer: ${peerId}`)
            
            if (!call.peerConnection) {
              console.error(`❌ [GROUP] No peerConnection for ${peerId}`)
              return
            }
            
            const senders = call.peerConnection.getSenders()
            console.log(`🖥️ [GROUP] Senders for ${peerId}:`, senders.length)
            
            const sender = senders.find((s: any) => s.track?.kind === 'video')
            
            if (sender) {
              // Log what we're replacing
              console.log(`🖥️ [GROUP] Current sender track:`, sender.track?.label)
              console.log(`🖥️ [GROUP] Replacing with screen track:`, screenVideoTrack.label)
              
              // Replace the track and WAIT for it
              await sender.replaceTrack(screenVideoTrack)
              console.log(`🖥️ [GROUP] ✅ replaceTrack succeeded for: ${peerId}`)
            } else {
              console.error(`❌ [GROUP] No video sender found for ${peerId}`)
              // List all senders
              senders.forEach((s: any, i: number) => {
                console.log(`  Sender ${i}: kind=${s.track?.kind}, label=${s.track?.label}`)
              })
            }
          } catch (err) {
            console.error(`❌ [GROUP] Error replacing track for ${peerId}:`, err)
          }
        })()
        replacePromises.push(promise)
      })
      
      // Wait for all track replacements to complete
      await Promise.all(replacePromises)
      console.log(`🖥️ [GROUP] All track replacements completed (${replacePromises.length} peers)`)
      
      // Store screen stream FIRST
      screenStreamRef.current = screenStream
      
      // Update local video display
      if (localVideoRef.current) {
        console.log('🖥️ [GROUP] Setting local video to screen stream')
        localVideoRef.current.srcObject = screenStream
        await safePlayVideo(localVideoRef.current, 'Screen share')
        console.log('🖥️ [GROUP] Local video srcObject set to screen:', localVideoRef.current.srcObject?.id)
      } else {
        console.error('❌ [GROUP] localVideoRef.current is null!')
      }
      
      // Handle when user stops sharing via browser button
      screenVideoTrack.onended = () => {
        console.log('🖥️ [GROUP] Screen share stopped by user')
        stopScreenShare()
      }
      
      // Set state AFTER video is attached
      setIsScreenSharing(true)
      
      // Wait a moment for all connections to be ready, then broadcast
      setTimeout(() => {
        broadcastState({ isVideoEnabled, isAudioEnabled, isScreenSharing: true })
        console.log('📡 [GROUP] Screen sharing state broadcast to all participants')
        
        // Send track update after more delay to ensure tracks are fully replaced
        // WebRTC needs time to propagate the track change
        setTimeout(() => {
          broadcastTrackUpdate()
          console.log('🔄 [GROUP] Track update broadcast sent')
          
          // Send again after another delay for reliability
          setTimeout(() => {
            broadcastTrackUpdate()
            console.log('🔄 [GROUP] Track update broadcast sent (retry)')
          }, 500)
        }, 500)
      }, 300)
      
      console.log('✅ [GROUP] Screen sharing started')
    } catch (err: any) {
      console.error('❌ [GROUP] Screen share error:', err)
      if (err.name === 'NotAllowedError') {
        setError('Screen sharing permission denied')
      } else if (err.name === 'NotFoundError') {
        setError('No screen available to share')
      } else {
        setError('Could not start screen sharing')
      }
    }
  }

  const stopScreenShare = async () => {
    try {
      console.log('🖥️ [GROUP] Stopping screen share...')
      
      // Stop screen stream
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop())
        screenStreamRef.current = null
      }
      
      // Get camera back
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      
      // Get the video track
      const cameraVideoTrack = cameraStream.getVideoTracks()[0]
      console.log(`📹 [GROUP] Got camera track:`, cameraVideoTrack.label)
      console.log(`📹 [GROUP] Total peer connections: ${peerConnectionsRef.current.size}`)
      
      // Replace with camera track in all peer connections - wait for all
      const replacePromises: Promise<void>[] = []
      
      peerConnectionsRef.current.forEach((call, peerId) => {
        const promise = (async () => {
          try {
            if (!call.peerConnection) {
              console.error(`❌ [GROUP] No peerConnection for ${peerId}`)
              return
            }
            
            const sender = call.peerConnection.getSenders()
              .find((s: any) => s.track?.kind === 'video')
            
            if (sender) {
              await sender.replaceTrack(cameraVideoTrack)
              console.log(`📹 [GROUP] ✅ Camera track sent to: ${peerId}`)
            }
          } catch (err) {
            console.error(`❌ [GROUP] Error replacing track for ${peerId}:`, err)
          }
        })()
        replacePromises.push(promise)
      })
      
      // Wait for all replacements
      await Promise.all(replacePromises)
      console.log(`📹 [GROUP] Camera track sent to ${replacePromises.length} peers`)
      
      // Update local video display
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream
        safePlayVideo(localVideoRef.current, 'Camera after screen share')
      }
      
      // Update local stream reference
      localStreamRef.current = cameraStream
      
      // Apply current audio/video states
      const audioTrack = cameraStream.getAudioTracks()[0]
      const videoTrack = cameraStream.getVideoTracks()[0]
      if (audioTrack) audioTrack.enabled = isAudioEnabled
      if (videoTrack) videoTrack.enabled = isVideoEnabled
      
      // Set state AFTER video is attached and playing
      setIsScreenSharing(false)
      
      // Broadcast screen sharing stopped
      broadcastState({ isVideoEnabled, isAudioEnabled, isScreenSharing: false })
      
      // Notify peers to refresh their stream - with delay and retry
      setTimeout(() => {
        broadcastTrackUpdate()
        console.log('🔄 [GROUP] Camera track update broadcast sent')
        
        // Retry for reliability
        setTimeout(() => {
          broadcastTrackUpdate()
          console.log('🔄 [GROUP] Camera track update broadcast sent (retry)')
        }, 500)
      }, 300)
      
      console.log('✅ [GROUP] Switched back to camera')
    } catch (err) {
      console.error('❌ [GROUP] Error stopping screen share:', err)
      setError('Could not switch back to camera')
    }
  }

  const endCall = async () => {
    console.log('📞 [GROUP] Leaving call...')
    
    // Save meeting record to database (for host)
    if (isHost) {
      await saveMeetingRecord()
    }
    
    // Remove from meeting room if this was a meeting
    if (consultationId.startsWith('meeting-')) {
      try {
        await fetch(`/api/communications/calls/participants?meetingRoomId=${consultationId}&oderId=${currentUserId}`, {
          method: 'DELETE'
        })
        console.log('🚪 [GROUP] Left meeting room')
      } catch (err) {
        console.log('Error leaving meeting room:', err)
      }
    }
    
    // Stop trying to connect to others
    isMountedRef.current = false
    
    // Close all peer connections
    peerConnectionsRef.current.forEach((call, peerId) => {
      try {
        console.log(`📞 [GROUP] Closing connection to ${peerId}`)
        call.close()
      } catch (e) {
        console.log('Error closing call:', e)
      }
    })
    peerConnectionsRef.current.clear()
    
    // Close all data connections
    dataConnectionsRef.current.forEach((conn, peerId) => {
      try {
        console.log(`💬 [GROUP] Closing data connection to ${peerId}`)
        conn.close()
      } catch (e) {
        console.log('Error closing data connection:', e)
      }
    })
    dataConnectionsRef.current.clear()
    
    // Clear failed connections tracking
    failedConnectionsRef.current.clear()
    
    // Destroy peer
    if (peerRef.current) {
      try {
        console.log('📞 [GROUP] Destroying peer...')
        peerRef.current.destroy()
      } catch (e) {
        console.log('Error destroying peer:', e)
      }
    }
    
    // Stop local media
    if (localStreamRef.current) {
      console.log('📞 [GROUP] Stopping local media...')
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    
    // Stop screen share if active
    if (screenStreamRef.current) {
      console.log('🖥️ [GROUP] Stopping screen share...')
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
    }
    
    // Clear streams
    setParticipantStreams(new Map())
    
    // Notify parent to close the call UI
    onCallEnd()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Chat functions
  const sendMessage = () => {
    if (!newMessage.trim()) return
    
    const message: ChatMessage = {
      id: `${Date.now()}-${currentUserId}`,
      senderId: currentUserId,
      senderName: currentUserName,
      message: newMessage.trim(),
      timestamp: new Date()
    }
    
    // Add to local messages
    setChatMessages(prev => [...prev, message])
    setNewMessage('')
    
    // Broadcast message to all connected peers via data connections
    let sentCount = 0
    dataConnectionsRef.current.forEach((conn, peerId) => {
      try {
        if (conn.open) {
          conn.send(JSON.stringify(message))
          sentCount++
          console.log(`💬 [GROUP] Message sent to: ${peerId}`)
        } else {
          console.log(`⚠️ [GROUP] Data connection not open for: ${peerId}`)
        }
      } catch (e) {
        console.error(`❌ [GROUP] Failed to send message to ${peerId}:`, e)
      }
    })
    
    console.log(`💬 [GROUP] Message broadcast to ${sentCount} participants`)
    
    // Scroll to bottom
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
    if (!isChatOpen) {
      setUnreadCount(0) // Clear unread when opening
    }
  }

  // Auto-scroll chat
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else if (chatMessages.length > 0) {
      // Increment unread if chat is closed
      const lastMessage = chatMessages[chatMessages.length - 1]
      if (lastMessage.senderId !== currentUserId) {
        setUnreadCount(prev => prev + 1)
      }
    }
  }, [chatMessages, isChatOpen, currentUserId])

  // Calculate responsive grid layout
  const getGridCols = () => {
    if (totalParticipants === 1) return 'grid-cols-1'
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2'
    if (totalParticipants === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    if (totalParticipants === 4) return 'grid-cols-1 sm:grid-cols-2'
    if (totalParticipants <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  }
  const gridCols = getGridCols()

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex flex-col relative overflow-hidden">
      {/* Header - Modern Glass Design */}
      <div className="bg-gray-800/70 backdrop-blur-xl px-4 md:px-6 py-3 md:py-4 flex justify-between items-center border-b border-gray-700/50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base md:text-lg tracking-tight">Group Video Call</h3>
            <p className="text-xs md:text-sm text-gray-400 flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 md:px-4 py-1.5 text-xs font-medium shadow-lg border-0">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
            Live
          </Badge>
          {/* Show remaining time if meeting has duration limit */}
          {meetingDuration > 0 && (
            <div className={`px-3 py-1.5 rounded-lg border ${
              remainingTime <= 300 
                ? 'bg-red-500/20 border-red-400/50 text-red-300' 
                : 'bg-orange-500/20 border-orange-400/30 text-orange-300'
            }`}>
              <span className="text-xs md:text-sm font-mono font-medium flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {formatRemainingTime(remainingTime)} left
              </span>
            </div>
          )}
          <div className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-600/30">
            <span className="text-white text-xs md:text-sm font-mono font-medium">
              {formatDuration(callDuration)}
            </span>
          </div>
          {/* Host badge */}
          {isHost && (
            <Badge className="bg-purple-500/80 text-white px-2 py-1 text-xs border-0">
              Host
            </Badge>
          )}
        </div>
      </div>

      {/* Error Alert - Modern Design */}
      {error && (
        <div className="absolute top-20 left-3 right-3 md:left-6 md:right-6 z-20 bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl flex items-center shadow-2xl backdrop-blur-sm border border-red-400/30 animate-in slide-in-from-top duration-300">
          <div className="bg-white/20 rounded-full p-2 mr-3">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="ml-3 hover:bg-white/20 rounded-full p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Video Grid - Responsive with Better Spacing */}
      <div className="flex-1 p-3 md:p-5 overflow-auto">
        {isPresenterMode ? (
          /* Presenter Mode Layout - Modern Design */
          <div className="h-full flex flex-col gap-3 md:gap-4">
            {/* Main Presenter View (Large) */}
            <div className="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl md:rounded-2xl relative overflow-hidden shadow-2xl border border-gray-700/50">
              {isScreenSharing ? (
                /* You are presenting */
                <>
                  {/* Always show video when screen sharing, regardless of camera state */}
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm md:text-base">
                            {currentUserName?.charAt(0)?.toUpperCase() || 'Y'}
                          </span>
                        </div>
                        <span className="text-white font-semibold text-sm md:text-lg">
                          {currentUserName} (You) - Presenting
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {!isAudioEnabled && (
                          <div className="bg-red-500/80 rounded-full p-2">
                            <MicOff className="h-4 w-4 md:h-5 md:w-5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 shadow-lg">
                    <Monitor className="h-4 w-4" />
                    <span>Presenting</span>
                  </div>
                </>
              ) : (
                /* Someone else is presenting */
                connectedParticipants.map((participant) => {
                  const participantPeerId = participantsWithPeerIds.get(participant.id)
                  const participantState = participantPeerId ? participantStates.get(participantPeerId) : null
                  
                  if (participantPeerId === presenterPeerId) {
                    const isParticipantAudioEnabled = participantState?.isAudioEnabled ?? true
                    const isParticipantVideoEnabled = participantState?.isVideoEnabled ?? true
                    
                    return (
                      <div key={`presenter-${participant.id}`} className="w-full h-full">
                        <video
                          key={`video-presenter-${participantPeerId}-${videoRefreshKey}`}
                          ref={el => {
                            if (el && participantPeerId) {
                              remoteVideoRefs.current.set(participantPeerId, el)
                              // Immediately attach stream if available
                              const stream = participantStreams.get(participantPeerId)
                              if (stream && el.srcObject !== stream) {
                                el.srcObject = stream
                                safePlayVideo(el, 'Presenter large view')
                              }
                            }
                          }}
                          autoPlay
                          playsInline
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 md:p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm md:text-base">
                                  {participant.name?.charAt(0)?.toUpperCase() || 'P'}
                                </span>
                              </div>
                              <span className="text-white font-semibold text-sm md:text-lg">
                                {participant.name} - Presenting
                              </span>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              {!isParticipantAudioEnabled && (
                                <div className="bg-red-500/80 rounded-full p-2">
                                  <MicOff className="h-4 w-4 md:h-5 md:w-5 text-white" />
                                </div>
                              )}
                              {!isParticipantVideoEnabled && (
                                <div className="bg-red-500/80 rounded-full p-2">
                                  <VideoOff className="h-4 w-4 md:h-5 md:w-5 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 shadow-lg">
                          <Monitor className="h-4 w-4" />
                          <span>Presenting</span>
                        </div>
                      </div>
                    )
                  }
                  return null
                })
              )}
            </div>

            {/* Thumbnail Strip (Small participant tiles) - Modern Design */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {/* Your thumbnail (if not presenting) */}
              {!isScreenSharing && (
                <div className="flex-shrink-0 w-36 h-24 md:w-44 md:h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl relative overflow-hidden shadow-lg border-2 border-blue-500/50 hover:border-blue-400 transition-all duration-300 group">
                  {isVideoEnabled ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {currentUserName?.charAt(0)?.toUpperCase() || 'Y'}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-2 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-medium truncate">You</span>
                      <div className="flex gap-1">
                        {!isAudioEnabled && <MicOff className="h-3 w-3 text-red-400" />}
                        {!isVideoEnabled && <VideoOff className="h-3 w-3 text-red-400" />}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-1.5 left-1.5 bg-blue-500 px-1.5 py-0.5 rounded text-[10px] font-medium text-white">
                    You
                  </div>
                </div>
              )}

              {/* Other participants thumbnails */}
              {connectedParticipants.map((participant) => {
                const participantPeerId = participantsWithPeerIds.get(participant.id)
                const participantState = participantPeerId ? participantStates.get(participantPeerId) : null
                const isParticipantAudioEnabled = participantState?.isAudioEnabled ?? true
                const isParticipantVideoEnabled = participantState?.isVideoEnabled ?? true
                const isParticipantScreenSharing = participantState?.isScreenSharing ?? false
                
                // Skip the presenter (already shown large)
                if (participantPeerId === presenterPeerId) return null
                
                return (
                  <div 
                    key={`thumbnail-${participant.id}`}
                    className="flex-shrink-0 w-36 h-24 md:w-44 md:h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl relative overflow-hidden shadow-lg border border-gray-700/50 hover:border-gray-600 transition-all duration-300 group"
                  >
                    <video
                      key={`video-thumbnail-${participantPeerId}-${videoRefreshKey}`}
                      ref={el => {
                        if (el && participantPeerId) {
                          remoteVideoRefs.current.set(participantPeerId, el)
                          // Immediately attach stream if available
                          const stream = participantStreams.get(participantPeerId)
                          if (stream && el.srcObject !== stream) {
                            el.srcObject = stream
                            safePlayVideo(el, 'Thumbnail')
                          }
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-2 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-medium truncate">{participant.name}</span>
                        <div className="flex gap-1">
                          {!isParticipantAudioEnabled && <MicOff className="h-3 w-3 text-red-400" />}
                          {!isParticipantVideoEnabled && <VideoOff className="h-3 w-3 text-red-400" />}
                        </div>
                      </div>
                    </div>
                    {isParticipantScreenSharing && (
                      <div className="absolute top-1.5 right-1.5 bg-green-500 px-1.5 py-0.5 rounded text-[10px] font-medium text-white flex items-center gap-0.5">
                        <Monitor className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Normal Grid Layout (No one presenting) - Modern Design */
          <div className={`grid ${gridCols} gap-3 md:gap-4 h-full auto-rows-fr`}>
            {/* Your Video */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl md:rounded-2xl relative overflow-hidden min-h-[200px] md:min-h-[240px] shadow-xl border-2 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group">
              {isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800">
                  <div className="text-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto ring-4 ring-white/10">
                      <span className="text-3xl md:text-4xl font-bold text-white">
                        {currentUserName?.charAt(0)?.toUpperCase() || 'Y'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {/* Name Label - Modern Design */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-xs md:text-sm font-bold text-white">
                        {currentUserName?.charAt(0)?.toUpperCase() || 'Y'}
                      </span>
                    </div>
                    <span className="text-white font-medium text-xs md:text-sm truncate">
                      {currentUserName} (You)
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {!isAudioEnabled && (
                      <div className="bg-red-500/80 rounded-full p-1.5">
                        <MicOff className="h-3 w-3 md:h-4 md:w-4 text-white" />
                      </div>
                    )}
                    {!isVideoEnabled && (
                      <div className="bg-red-500/80 rounded-full p-1.5">
                        <VideoOff className="h-3 w-3 md:h-4 md:w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Host Badge - Modern */}
              <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-gradient-to-r from-blue-500 to-blue-600 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs font-medium text-white shadow-lg">
                You
              </div>
              {/* Screen Sharing Indicator */}
              {isScreenSharing && (
                <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-gradient-to-r from-green-500 to-emerald-600 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 shadow-lg">
                  <Monitor className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Presenting</span>
                </div>
              )}
            </div>

            {/* Other Participants - Modern Design */}
            {connectedParticipants.map((participant, index) => {
              // Get the peer ID for this participant from our mapping
              const participantPeerId = participantsWithPeerIds.get(participant.id)
              
              // We already filtered, so this should always be true
              const hasStream = participantPeerId && participantStreams.has(participantPeerId)
              
              // Get participant state (audio/video enabled)
              const participantState = participantPeerId ? participantStates.get(participantPeerId) : null
              const isParticipantAudioEnabled = participantState?.isAudioEnabled ?? true
              const isParticipantVideoEnabled = participantState?.isVideoEnabled ?? true
              const isParticipantScreenSharing = participantState?.isScreenSharing ?? false
              
              // Generate a gradient color based on participant index
              const gradients = [
                'from-purple-600 via-purple-700 to-pink-800',
                'from-green-600 via-green-700 to-teal-800',
                'from-orange-600 via-orange-700 to-red-800',
                'from-cyan-600 via-cyan-700 to-blue-800',
                'from-pink-600 via-pink-700 to-rose-800',
              ]
              const gradient = gradients[index % gradients.length]
              
              return (
                <div 
                  key={`grid-${participant.id}`}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl md:rounded-2xl relative overflow-hidden min-h-[200px] md:min-h-[240px] shadow-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300 group"
                >
                  {/* Video - Always show since we filtered */}
                  <video
                    key={`video-grid-${participantPeerId}-${videoRefreshKey}`}
                    ref={el => {
                      if (el && participantPeerId) {
                        remoteVideoRefs.current.set(participantPeerId, el)
                        // Immediately attach stream if available
                        const stream = participantStreams.get(participantPeerId)
                        if (stream && el.srcObject !== stream) {
                          el.srcObject = stream
                          safePlayVideo(el, 'Grid view')
                        }
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  
                  {/* Name Label - Modern Design */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center`}>
                          <span className="text-xs md:text-sm font-bold text-white">
                            {participant.name?.charAt(0)?.toUpperCase() || 'P'}
                          </span>
                        </div>
                        <span className="text-white font-medium text-xs md:text-sm truncate">
                          {participant.name}
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {!isParticipantAudioEnabled && (
                          <div className="bg-red-500/80 rounded-full p-1.5">
                            <MicOff className="h-3 w-3 md:h-4 md:w-4 text-white" />
                          </div>
                        )}
                        {!isParticipantVideoEnabled && (
                          <div className="bg-red-500/80 rounded-full p-1.5">
                            <VideoOff className="h-3 w-3 md:h-4 md:w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Status Badge - Modern */}
                  {isParticipantScreenSharing ? (
                    <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-gradient-to-r from-green-500 to-emerald-600 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 shadow-lg">
                      <Monitor className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Presenting</span>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-green-500/80 px-2 py-1 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 shadow-md">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      <span className="hidden sm:inline">Live</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Control Bar - Modern Glass Design */}
      <div className="bg-gray-800/80 backdrop-blur-xl p-4 md:p-5 flex items-center justify-center gap-3 md:gap-5 border-t border-gray-700/50 shadow-2xl">
        {/* Video Toggle */}
        <div className="relative group">
          <Button
            size="lg"
            variant={isVideoEnabled ? "secondary" : "destructive"}
            onClick={toggleVideo}
            className={`rounded-full h-14 w-14 md:h-16 md:w-16 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
              isVideoEnabled 
                ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                : 'bg-red-500 hover:bg-red-600 border border-red-400'
            }`}
          >
            {isVideoEnabled ? <Video className="h-6 w-6 md:h-7 md:w-7" /> : <VideoOff className="h-6 w-6 md:h-7 md:w-7" />}
          </Button>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          </span>
        </div>

        {/* Audio Toggle */}
        <div className="relative group">
          <Button
            size="lg"
            variant={isAudioEnabled ? "secondary" : "destructive"}
            onClick={toggleAudio}
            className={`rounded-full h-14 w-14 md:h-16 md:w-16 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
              isAudioEnabled 
                ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                : 'bg-red-500 hover:bg-red-600 border border-red-400'
            }`}
          >
            {isAudioEnabled ? <Mic className="h-6 w-6 md:h-7 md:w-7" /> : <MicOff className="h-6 w-6 md:h-7 md:w-7" />}
          </Button>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isAudioEnabled ? "Mute" : "Unmute"}
          </span>
        </div>

        {/* Screen Share Toggle */}
        <div className="relative group">
          <Button
            size="lg"
            variant={isScreenSharing ? "default" : "secondary"}
            onClick={toggleScreenShare}
            className={`rounded-full h-14 w-14 md:h-16 md:w-16 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
              isScreenSharing 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border border-green-400' 
                : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
            }`}
          >
            {isScreenSharing ? <MonitorOff className="h-6 w-6 md:h-7 md:w-7" /> : <Monitor className="h-6 w-6 md:h-7 md:w-7" />}
          </Button>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isScreenSharing ? "Stop sharing" : "Share screen"}
          </span>
        </div>

        {/* Chat Toggle */}
        <div className="relative group">
          <Button
            size="lg"
            variant="secondary"
            onClick={toggleChat}
            className="rounded-full h-14 w-14 md:h-16 md:w-16 bg-gray-700 hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-gray-600 relative"
          >
            <MessageSquare className="h-6 w-6 md:h-7 md:w-7" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </Button>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat
          </span>
        </div>

        {/* End Call */}
        <div className="relative group">
          <Button
            size="lg"
            variant="destructive"
            onClick={endCall}
            className="rounded-full h-16 w-16 md:h-18 md:w-18 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-red-400 ml-2"
          >
            <PhoneOff className="h-7 w-7 md:h-8 md:w-8" />
          </Button>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            End call
          </span>
        </div>
      </div>

      {/* Chat Panel - Modern Slide-in Design */}
      {isChatOpen && (
        <div className="absolute top-0 right-0 h-full w-full sm:w-[400px] bg-gradient-to-b from-gray-800 to-gray-900 border-l border-gray-700/50 flex flex-col z-30 shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Chat Header - Glass Design */}
          <div className="bg-gray-900/80 backdrop-blur-xl px-5 py-4 flex items-center justify-between border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Meeting Chat</h3>
                <p className="text-xs text-gray-400">{chatMessages.length} messages</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleChat}
              className="h-10 w-10 p-0 hover:bg-gray-700/50 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </Button>
          </div>

          {/* Messages Area - Modern Style */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-10 w-10 opacity-50" />
                </div>
                <p className="font-medium">No messages yet</p>
                <p className="text-xs mt-1 text-gray-600">Send a message to start the conversation</p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isOwn = msg.senderId === currentUserId
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
                  >
                    <div className={`max-w-[85%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      {!isOwn && (
                        <div className="flex items-center gap-2 mb-1.5 px-1">
                          <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">
                              {msg.senderName?.charAt(0)?.toUpperCase() || 'P'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-medium">{msg.senderName}</p>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-md ${
                          isOwn
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                            : 'bg-gray-700/80 text-gray-100 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                        <p className={`text-[10px] mt-2 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input - Modern Design */}
          <div className="p-4 border-t border-gray-700/50 bg-gray-900/80 backdrop-blur-xl">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-600/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm placeholder:text-gray-500 transition-all"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl px-5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Duration Warning Dialog - Only for Host */}
      {showDurationDialog && isHost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-700/50 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center">
                <Timer className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Meeting Time Alert</h3>
                <p className="text-gray-400 text-sm">5 minutes remaining</p>
              </div>
            </div>

            {/* Content */}
            <div className="bg-gray-700/30 rounded-xl p-4 mb-6">
              <p className="text-gray-300 text-sm mb-3">
                {meetingTitle ? `"${meetingTitle}"` : 'This meeting'} is about to end. Would you like to extend the meeting or end it now?
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Time elapsed:</span>
                <span className="text-white font-mono font-semibold">{formatDuration(callDuration)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-400">Time remaining:</span>
                <span className="text-orange-400 font-mono font-semibold">{formatRemainingTime(remainingTime)}</span>
              </div>
            </div>

            {/* Extend Options */}
            <div className="mb-6">
              <label className="text-gray-400 text-sm mb-2 block">Extend meeting by:</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExtendMinutes(prev => Math.max(5, prev - 5))}
                  className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex-1 bg-gray-700/50 rounded-lg py-3 text-center">
                  <span className="text-2xl font-bold text-white">{extendMinutes}</span>
                  <span className="text-gray-400 text-sm ml-1">minutes</span>
                </div>
                <button
                  onClick={() => setExtendMinutes(prev => Math.min(60, prev + 5))}
                  className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => endCall()}
                variant="outline"
                className="flex-1 bg-transparent border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                End Meeting
              </Button>
              <Button
                onClick={() => extendMeeting(extendMinutes)}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Clock className="h-4 w-4 mr-2" />
                Extend +{extendMinutes}m
              </Button>
            </div>

            {/* Dismiss option */}
            <button
              onClick={() => setShowDurationDialog(false)}
              className="w-full mt-3 text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Remind me later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

