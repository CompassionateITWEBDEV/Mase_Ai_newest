"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  Loader2, AlertCircle 
} from 'lucide-react'

interface PeerJSVideoCallProps {
  consultationId: string
  participantName: string
  participantRole: 'nurse' | 'doctor' | 'caller' | 'callee'
  remoteName?: string // Name of the person on the other end
  callId?: string // Database call ID for storing peer IDs
  callerId?: string // User ID of the caller (for group call polling)
  isGroupCall?: boolean // Whether this is a group call
  participants?: any[] // List of all participants for group calls
  onCallEnd: () => void
  onConnected?: () => void // Called when video connection is established
}

export function PeerJSVideoCall({
  consultationId,
  participantName,
  participantRole,
  remoteName,
  callId,
  callerId,
  isGroupCall = false,
  participants = [],
  onCallEnd,
  onConnected
}: PeerJSVideoCallProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [peerLoaded, setPeerLoaded] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<any>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const callRef = useRef<any>(null)
  const isConnectedRef = useRef<boolean>(false)

  // Load PeerJS from CDN
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Peer) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'
      script.async = true
      script.onload = () => {
        console.log('✅ [PEER] PeerJS loaded from CDN')
        setPeerLoaded(true)
      }
      script.onerror = () => {
        console.error('❌ [PEER] Failed to load PeerJS')
        setError('Failed to load video library')
        setIsConnecting(false)
      }
      document.body.appendChild(script)
    } else {
      setPeerLoaded(true)
    }
  }, [])

  // Call duration timer
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

  // Apply remote stream when video element is ready
  useEffect(() => {
    if (isConnected && remoteStreamRef.current && remoteVideoRef.current) {
      console.log('🎥 [PEER] Applying remote stream to video element')
      remoteVideoRef.current.srcObject = remoteStreamRef.current
      
      // Force video to play (ignore AbortError)
      const playPromise = remoteVideoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          if (err.name !== 'AbortError') {
            console.error('❌ [PEER] Error playing remote video:', err)
          }
        })
      }
    }
  }, [isConnected])

  // Apply local stream when video element is ready (important for grid layout changes)
  useEffect(() => {
    const safePlay = (video: HTMLVideoElement, name: string) => {
      if (!video) return
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          // Ignore AbortError - it's expected when video is interrupted
          if (err.name !== 'AbortError') {
            console.error(`❌ [PEER] Error playing ${name} video:`, err)
          }
        })
      }
    }

    const applyStreams = () => {
      if (localStreamRef.current && localVideoRef.current) {
        if (localVideoRef.current.srcObject !== localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current
        }
        safePlay(localVideoRef.current, 'local')
      }
      if (remoteStreamRef.current && remoteVideoRef.current) {
        if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current
        }
        safePlay(remoteVideoRef.current, 'remote')
      }
    }
    
    // Apply after a short delay to let DOM settle
    const timeout = setTimeout(applyStreams, 50)
    
    return () => clearTimeout(timeout)
  }, [isConnected, isGroupCall, participants.length])

  // Initialize PeerJS
  useEffect(() => {
    if (!peerLoaded) return

    let mounted = true

    const initializePeer = async () => {
      try {
        console.log('🎥 [PEER] Requesting camera and microphone...')
        
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
          console.log('✅ [PEER] Local video element updated')
          
          // Force local video to play
          localVideoRef.current.play().catch(err => {
            console.error('❌ [PEER] Error playing local video:', err)
          })
        }

        console.log('✅ [PEER] Got local media stream')

        // Initialize PeerJS (using free public server)
        const Peer = (window as any).Peer
        
        // Destroy any existing peer first
        if (peerRef.current) {
          console.log('🧹 [PEER] Destroying existing peer...')
          try {
            peerRef.current.destroy()
          } catch (e) {
            console.log('Could not destroy previous peer')
          }
          peerRef.current = null
        }
        
        // Generate a short unique ID to avoid conflicts
        const uniqueId = `${participantRole}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
        console.log(`🔗 [PEER] Creating peer with ID: ${uniqueId}`)
        
        const peer = new Peer(uniqueId, {
          debug: 2, // More verbose logging
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              // Free TURN servers for better NAT traversal
              {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
              },
              {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
              }
            ]
          }
        })

        peerRef.current = peer

        peer.on('open', async (id: string) => {
          console.log('✅ [PEER] Peer connection opened. My ID:', id)
          setIsConnecting(false)

          const isCaller = participantRole === 'doctor' || participantRole === 'caller'
          
          // Store our peer ID in the database
          if (callId || callerId) {
            try {
              if (isCaller && callerId) {
                // For CALLER in group calls: Update ALL their outgoing calls with their peer ID
                // This ensures ALL callees can find the caller's peer ID
                console.log(`📞 [CALLER] Storing peer ID in ALL outgoing calls for caller: ${callerId}`)
                await fetch('/api/communications/calls/update-all', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ callerId, callerPeerId: id })
                })
                console.log(`✅ [PEER] Stored caller peer ID (${id}) in ALL outgoing calls`)
              } else if (callId) {
                // For CALLEE or direct calls: Update specific call
                const body = isCaller 
                  ? { callId, callerPeerId: id }
                  : { callId, calleePeerId: id }
                
                await fetch('/api/communications/calls', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body)
                })
                console.log(`✅ [PEER] Stored my peer ID (${id}) in database as ${isCaller ? 'caller' : 'callee'}`)
              }
            } catch (err) {
              console.error('Failed to store peer ID:', err)
            }
          }

          // Now poll for the OTHER person's peer ID - AGGRESSIVE polling
          let pollCount = 0
          const maxPolls = 60 // Poll for up to 60 seconds
          
          const pollForRemotePeer = async () => {
            if (isConnectedRef.current) {
              console.log(`✅ [${participantRole.toUpperCase()}] Stopping poll - connected`)
              return
            }
            
            if (!callId && !callerId) {
              console.log(`❌ [${participantRole.toUpperCase()}] No callId or callerId to poll`)
              return
            }
            
            pollCount++
            console.log(`🔍 [${participantRole.toUpperCase()}] Poll attempt ${pollCount}/${maxPolls}...`)
            
            if (pollCount > maxPolls) {
              console.log(`❌ [${participantRole.toUpperCase()}] Max polls reached, giving up`)
              setError('Could not connect. Please try again.')
              return
            }
            
            try {
              // For callers (especially in group calls), also poll by callerId to find ANY accepted call
              let url = `/api/communications/calls?callId=${callId}`
              if (isCaller && callerId) {
                url = `/api/communications/calls?callerId=${callerId}`
                if (callId) {
                  url += `&callId=${callId}`
                }
              }
              
              console.log(`🔍 [${participantRole.toUpperCase()}] Polling URL: ${url}`)
              const res = await fetch(url)
              const data = await res.json()
              
              // For group calls, check acceptedCall first (any call that was accepted)
              const callData = data.acceptedCall || data.call
              
              console.log(`📦 [${participantRole.toUpperCase()}] Call data:`, {
                caller_peer_id: callData?.caller_peer_id,
                callee_peer_id: callData?.callee_peer_id,
                status: callData?.status,
                from_accepted_call: !!data.acceptedCall
              })
              
              // Get the other side's peer ID
              const remotePeerId = isCaller 
                ? callData?.callee_peer_id 
                : callData?.caller_peer_id
              
              if (remotePeerId && !isConnectedRef.current) {
                console.log(`📞 [${participantRole.toUpperCase()}] 🎯 Found remote peer: ${remotePeerId}`)
                console.log(`📞 [${participantRole.toUpperCase()}] Attempting to call...`)
                tryCallDoctor(peer, stream, remotePeerId)
                
                // Continue polling in case first call fails
                setTimeout(pollForRemotePeer, 2000)
              } else {
                // Retry after 500ms for faster connection
                if (!isConnectedRef.current) {
                  setTimeout(pollForRemotePeer, 500)
                }
              }
            } catch (err) {
              console.error('Error polling for remote peer:', err)
              setTimeout(pollForRemotePeer, 1000)
            }
          }

          // Start polling immediately
          pollForRemotePeer()
        })

        // Handle incoming calls
        peer.on('call', (call: any) => {
          console.log('📞 [PEER] Incoming call from:', call.peer)
          console.log('📞 [PEER] Answering call with stream:', stream.getTracks())
          call.answer(stream)
          console.log('✅ [PEER] Call answered, setting up handlers...')
          handleCall(call)
        })

        peer.on('connection', (conn: any) => {
          console.log('🔗 [PEER] Data connection from:', conn.peer)
        })

        peer.on('error', (err: any) => {
          console.error('❌ [PEER] Error:', err.type, err.message || err)
          
          // Handle different error types
          if (err.type === 'peer-unavailable') {
            console.log('⚠️ [PEER] Peer unavailable - other person may not be ready yet')
          } else if (err.type === 'unavailable-id') {
            console.log('⚠️ [PEER] Peer ID taken - previous connection may still be active')
            // The connection might work anyway if we're receiving calls
          } else if (err.type === 'browser-incompatible') {
            setError('Your browser does not support video calls.')
          } else if (err.type === 'disconnected' || err.type === 'network') {
            console.log('⚠️ [PEER] Network issue, attempting to reconnect...')
            if (!peer.destroyed) {
              try {
                peer.reconnect()
              } catch (e) {
                console.log('Could not reconnect peer')
              }
            }
          } else {
            console.log('⚠️ [PEER] Error type:', err.type)
          }
        })
        
        peer.on('disconnected', () => {
          console.log('⚠️ [PEER] Disconnected from server, attempting to reconnect...')
          if (!peer.destroyed) {
            try {
              peer.reconnect()
            } catch (e) {
              console.log('Could not reconnect peer')
            }
          }
        })

      } catch (err: any) {
        console.error('❌ [PEER] Media error:', err)
        setError('Could not access camera/microphone. Please allow permissions.')
        setIsConnecting(false)
      }
    }

    const tryCallDoctor = (peer: any, stream: MediaStream, targetPeerId: string, retryCount = 0) => {
      // Skip if already connected
      if (isConnectedRef.current) {
        console.log('✅ [PEER] Already connected, skipping call attempt')
        return
      }
      
      console.log(`📞 [PEER] 📱 CALLING ${targetPeerId} (attempt ${retryCount + 1})...`)
      
      // Check if peer is still connected
      if (!peer || peer.disconnected || peer.destroyed) {
        console.log('⚠️ [PEER] Peer is disconnected or destroyed')
        return
      }
      
      try {
        console.log(`📞 [PEER] Making call with stream tracks:`, stream.getTracks().map(t => t.kind))
        const call = peer.call(targetPeerId, stream)
        
        if (call) {
          console.log('📞 [PEER] ✅ Call object created, waiting for stream...')
          handleCall(call)
        } else {
          console.log('⚠️ [PEER] Call object is null/undefined')
        }
      } catch (err: any) {
        console.error('❌ [PEER] Error making call:', err.message || err)
      }
    }

    const handleCall = (call: any) => {
      callRef.current = call

      call.on('stream', (remoteStream: MediaStream) => {
        console.log('✅ [PEER] Received remote stream')
        console.log('📹 [PEER] Remote stream tracks:', remoteStream.getTracks())
        console.log('📹 [PEER] Video tracks:', remoteStream.getVideoTracks())
        console.log('📹 [PEER] Audio tracks:', remoteStream.getAudioTracks())
        
        // Store the remote stream in ref
        remoteStreamRef.current = remoteStream
        
        // Set connected state to trigger video element render
        setIsConnected(true)
        isConnectedRef.current = true
        setError(null)
        
        // Notify parent that video is connected
        if (onConnected) {
          console.log('📞 [PEER] Calling onConnected callback')
          onConnected()
        }
      })

      call.on('close', () => {
        console.log('📞 [PEER] Call ended')
        setIsConnected(false)
        remoteStreamRef.current = null
      })

      call.on('error', (err: any) => {
        console.error('❌ [PEER] Call error:', err)
        setError('Call connection failed')
      })
    }

    initializePeer()

    // Cleanup
    return () => {
      mounted = false
      console.log('🧹 [PEER] Cleaning up...')
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (callRef.current) {
        callRef.current.close()
      }
      if (peerRef.current) {
        peerRef.current.destroy()
      }
    }
  }, [consultationId, participantRole, peerLoaded, callId])

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled
        setIsVideoEnabled(!isVideoEnabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled
        setIsAudioEnabled(!isAudioEnabled)
      }
    }
  }

  const endCall = () => {
    console.log('📞 [PEER] Ending call...')
    if (callRef.current) {
      callRef.current.close()
    }
    if (peerRef.current) {
      peerRef.current.destroy()
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    onCallEnd()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full w-full bg-gradient-to-b from-gray-900 to-black flex flex-col relative overflow-hidden">
      {/* Floating Header - shows on top of video */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge 
              className={`${isConnected ? "bg-green-500 text-white" : "bg-yellow-500 text-black"} px-3 py-1`}
            >
              {isConnecting ? "Connecting..." : isConnected ? "● Live" : "Waiting"}
            </Badge>
            {isConnected && (
              <span className="text-white font-mono text-lg bg-black/50 px-3 py-1 rounded">
                {formatDuration(callDuration)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium bg-black/50 px-3 py-1 rounded">
              {remoteName || 'Video Call'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="absolute top-16 left-4 right-4 z-20 bg-red-500/90 text-white p-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Main Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Full Screen) or Group Grid */}
        <div className="absolute inset-0">
          {isConnecting ? (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="text-center text-white">
                <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-blue-400" />
                <p className="text-xl font-medium">Connecting to {remoteName || 'other participant'}...</p>
                <p className="text-sm text-gray-400 mt-2">Setting up secure connection</p>
              </div>
            </div>
          ) : !isConnected ? (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
                  <span className="text-5xl text-white font-bold">
                    {remoteName ? remoteName.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <p className="text-xl font-medium">Waiting for {remoteName || 'participant'}...</p>
                <p className="text-sm text-gray-400 mt-2">They will appear here when connected</p>
                <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-blue-400" />
              </div>
            </div>
          ) : isGroupCall && participants.length > 0 ? (
            /* Group Call Grid Layout */
            <div className="h-full p-4 grid gap-3 grid-cols-2">
              {/* Remote Video */}
              <div className="bg-gray-800 rounded-xl relative overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={false}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <span className="text-white font-medium">{remoteName}</span>
                </div>
              </div>
              
              {/* Your Video */}
              <div className="bg-gray-800 rounded-xl relative overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {participantName?.charAt(0)?.toUpperCase() || 'Y'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <span className="text-white font-medium">{participantName} (You)</span>
                </div>
                <div className="absolute top-2 left-2 bg-blue-600 px-2 py-0.5 rounded text-xs text-white">
                  You
                </div>
              </div>

              {/* Other Participants (placeholder for additional group members) */}
              {participants.slice(1).map((p: any, i: number) => (
                <div key={p.id || i} className="bg-gray-800 rounded-xl relative overflow-hidden flex items-center justify-center">
                  <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${
                    ['from-purple-600 to-purple-800', 'from-green-600 to-green-800', 'from-orange-600 to-orange-800'][i % 3]
                  }`}>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {p.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <span className="text-white font-medium">{p.name}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Direct Call Layout */
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Local Video (Picture-in-Picture) - Only for direct calls */}
        {(!isGroupCall || participants.length === 0) && (
          <div className="absolute bottom-24 right-4 z-10">
            <div className="w-40 h-28 md:w-48 md:h-36 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl bg-gray-800">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <VideoOff className="h-8 w-8 text-white/50" />
                </div>
              )}
              <div className="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 rounded text-white text-xs">
                You
              </div>
            </div>
          </div>
        )}

        {/* Remote Name Label - when connected (direct calls only) */}
        {isConnected && remoteName && !isGroupCall && (
          <div className="absolute bottom-24 left-4 z-10">
            <div className="bg-black/60 px-3 py-1.5 rounded-lg">
              <span className="text-white font-medium">{remoteName}</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent pt-8 pb-6">
        <div className="flex items-center justify-center space-x-6">
          <Button
            size="lg"
            variant={isVideoEnabled ? "secondary" : "destructive"}
            onClick={toggleVideo}
            className={`rounded-full h-14 w-14 ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : ''}`}
          >
            {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>

          <Button
            size="lg"
            variant={isAudioEnabled ? "secondary" : "destructive"}
            onClick={toggleAudio}
            className={`rounded-full h-14 w-14 ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : ''}`}
          >
            {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={endCall}
            className="rounded-full h-16 w-16 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
        </div>
      </div>
    </div>
  )
}

