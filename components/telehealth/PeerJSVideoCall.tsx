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
  participantRole: 'nurse' | 'doctor'
  onCallEnd: () => void
}

export function PeerJSVideoCall({
  consultationId,
  participantName,
  participantRole,
  onCallEnd
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
      
      // Force video to play
      remoteVideoRef.current.play().catch(err => {
        console.error('❌ [PEER] Error playing remote video:', err)
      })
    }
  }, [isConnected])

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
        console.log('📹 [PEER] Local stream tracks:', stream.getTracks())
        console.log('📹 [PEER] Video tracks:', stream.getVideoTracks())
        console.log('📹 [PEER] Audio tracks:', stream.getAudioTracks())

        // Create peer ID based on role and consultation (NO TIMESTAMP!)
        // This ensures both parties can find each other
        const peerId = `${participantRole}-${consultationId}`
        
        console.log(`🔗 [PEER] Creating peer with ID: ${peerId}`)
        
        // Initialize PeerJS (using free public server)
        const Peer = (window as any).Peer
        const peer = new Peer(peerId, {
          debug: 2
        })

        peerRef.current = peer

        peer.on('open', (id: string) => {
          console.log('✅ [PEER] Peer connection opened. My ID:', id)
          setIsConnecting(false)

          // If doctor, wait for nurse to call
          // If nurse, call the doctor
          if (participantRole === 'nurse') {
            // Wait a bit then try to connect to doctor
            console.log('📞 [NURSE] Waiting 2 seconds before calling doctor...')
            setTimeout(() => {
              const doctorPeerId = `doctor-${consultationId}`
              console.log('📞 [NURSE] Attempting to call doctor:', doctorPeerId)
              
              // Try to call with the base doctor ID
              tryCallDoctor(peer, stream, doctorPeerId)
            }, 2000)
          } else {
            console.log('👨‍⚕️ [DOCTOR] Ready to receive calls')
          }
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
          console.error('❌ [PEER] Error:', err)
          if (err.type === 'peer-unavailable') {
            console.log('⚠️ [PEER] Peer unavailable, will retry...')
            // Don't show error for unavailable peer, just keep trying
          } else {
            setError(`Connection error: ${err.type}`)
          }
        })

      } catch (err: any) {
        console.error('❌ [PEER] Media error:', err)
        setError('Could not access camera/microphone. Please allow permissions.')
        setIsConnecting(false)
      }
    }

    const tryCallDoctor = (peer: any, stream: MediaStream, doctorPeerId: string, retryCount = 0) => {
      console.log(`📞 [NURSE] Attempt ${retryCount + 1}: Calling doctor...`)
      
      const call = peer.call(doctorPeerId, stream)
      
      if (call) {
        console.log('📞 [NURSE] Call initiated to:', doctorPeerId)
        handleCall(call)
        
        // Set a timeout to retry if no stream received within 5 seconds
        const streamTimeout = setTimeout(() => {
          if (!isConnectedRef.current && retryCount < 10) {
            console.log('⚠️ [NURSE] No stream received, retrying...')
            call.close()
            tryCallDoctor(peer, stream, doctorPeerId, retryCount + 1)
          }
        }, 5000)
        
        // Clear timeout if connection succeeds
        call.on('stream', () => {
          clearTimeout(streamTimeout)
        })
      } else {
        console.log('⚠️ [NURSE] Call failed, retrying in 2 seconds...')
        if (retryCount < 10) {
          setTimeout(() => tryCallDoctor(peer, stream, doctorPeerId, retryCount + 1), 2000)
        } else {
          setError('Could not connect to doctor. Please try again.')
        }
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
  }, [consultationId, participantRole, peerLoaded])

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
    <div className="h-screen w-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant={isConnected ? "default" : "secondary"} 
                 className={isConnected ? "bg-green-500" : ""}>
            {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Waiting"}
          </Badge>
          {isConnected && (
            <span className="text-white text-sm">
              {formatDuration(callDuration)}
            </span>
          )}
        </div>
        <div className="text-white text-sm">
          {participantName} ({participantRole})
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500 text-white p-3 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0">
          {isConnecting ? (
            <div className="h-full flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-lg">Connecting to {participantRole === 'doctor' ? 'nurse' : 'doctor'}...</p>
                <p className="text-sm text-gray-400 mt-2">Please allow camera and microphone access</p>
              </div>
            </div>
          ) : !isConnected ? (
            <div className="h-full flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">
                  {participantRole === 'doctor' ? '👩‍⚕️' : '👨‍⚕️'}
                </div>
                <p className="text-lg">Waiting for {participantRole === 'doctor' ? 'nurse' : 'doctor'} to join...</p>
                <p className="text-sm text-gray-400 mt-2">
                  {participantRole === 'doctor' 
                    ? 'The nurse will connect shortly' 
                    : 'Attempting to connect to doctor...'}
                </p>
              </div>
            </div>
          ) : (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover bg-black"
            />
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <Card className="absolute top-4 right-4 w-64 h-48 overflow-hidden border-2 border-white">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="h-12 w-12 text-white" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-xs">
            You
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6">
        <div className="flex items-center justify-center space-x-4">
          <Button
            size="lg"
            variant={isVideoEnabled ? "default" : "destructive"}
            onClick={toggleVideo}
            className="rounded-full h-14 w-14"
          >
            {isVideoEnabled ? <Video /> : <VideoOff />}
          </Button>

          <Button
            size="lg"
            variant={isAudioEnabled ? "default" : "destructive"}
            onClick={toggleAudio}
            className="rounded-full h-14 w-14"
          >
            {isAudioEnabled ? <Mic /> : <MicOff />}
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={endCall}
            className="rounded-full h-16 w-16"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="text-center mt-4 text-gray-400 text-xs">
          Free P2P Video Call • No API Keys Required
        </div>
      </div>
    </div>
  )
}

