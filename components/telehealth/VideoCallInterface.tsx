"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Clock,
  Wifi,
  AlertCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface VideoCallInterfaceProps {
  sessionId: string
  token: string
  participantName: string
  participantRole: 'nurse' | 'doctor'
  onCallEnd: () => void
  usingMockSession?: boolean
}

export function VideoCallInterface({
  sessionId,
  token,
  participantName,
  participantRole,
  onCallEnd,
  usingMockSession = false
}: VideoCallInterfaceProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remoteParticipants, setRemoteParticipants] = useState<number>(0)

  const publisherRef = useRef<HTMLDivElement>(null)
  const subscriberRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<any>(null)
  const publisherObjRef = useRef<any>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  // Call duration timer
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

  // Initialize video call
  useEffect(() => {
    let mounted = true

    const initializeCall = async () => {
      try {
        if (usingMockSession) {
          // Mock implementation for development
          console.log('🎥 Mock Video Session Started')
          console.log('Session ID:', sessionId)
          console.log('Token:', token)
          console.log('Participant:', participantName, participantRole)

          // Simulate getting user media
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true
            })

            if (mounted && publisherRef.current) {
              localStreamRef.current = stream
              const videoElement = document.createElement('video')
              videoElement.srcObject = stream
              videoElement.autoplay = true
              videoElement.muted = true
              videoElement.style.width = '100%'
              videoElement.style.height = '100%'
              videoElement.style.objectFit = 'cover'
              publisherRef.current.appendChild(videoElement)

              setIsConnected(true)
              setRemoteParticipants(1) // Simulate remote participant

              // Simulate remote video
              if (subscriberRef.current) {
                const remoteVideo = document.createElement('div')
                remoteVideo.className = 'w-full h-full bg-gray-800 flex items-center justify-center text-white'
                remoteVideo.innerHTML = `
                  <div class="text-center">
                    <div class="text-6xl mb-4">👨‍⚕️</div>
                    <div class="text-xl font-semibold">${participantRole === 'nurse' ? 'Doctor' : 'Nurse'}</div>
                    <div class="text-sm text-gray-400 mt-2">Mock Video Session</div>
                    <div class="text-xs text-gray-500 mt-4">Configure Vonage API for real video</div>
                  </div>
                `
                subscriberRef.current.appendChild(remoteVideo)
              }
            }
          } catch (mediaError) {
            console.error('Media access error:', mediaError)
            setError('Could not access camera/microphone. Please grant permissions.')
          }
        } else {
          // Real Vonage implementation
          try {
            const OT = (await import('@vonage/video-client')).default

            // Initialize session
            const session = OT.initSession(
              process.env.NEXT_PUBLIC_VONAGE_VIDEO_API_KEY!,
              sessionId
            )

            sessionRef.current = session

            // Connect to session
            session.connect(token, (error: any) => {
              if (error) {
                console.error('Connection error:', error)
                setError('Failed to connect to video session')
                return
              }

              if (!mounted) return

              // Create publisher
              const publisher = OT.initPublisher(
                publisherRef.current!,
                {
                  insertMode: 'append',
                  width: '100%',
                  height: '100%',
                  name: participantName,
                  publishAudio: true,
                  publishVideo: true,
                  style: {
                    buttonDisplayMode: 'off'
                  }
                },
                (err: any) => {
                  if (err) {
                    console.error('Publisher error:', err)
                    setError('Failed to initialize camera')
                  }
                }
              )

              publisherObjRef.current = publisher

              // Publish to session
              session.publish(publisher, (err: any) => {
                if (err) {
                  console.error('Publish error:', err)
                  setError('Failed to publish video')
                } else {
                  setIsConnected(true)
                }
              })
            })

            // Subscribe to remote streams
            session.on('streamCreated', (event: any) => {
              if (!mounted) return

              const subscriber = session.subscribe(
                event.stream,
                subscriberRef.current!,
                {
                  insertMode: 'append',
                  width: '100%',
                  height: '100%',
                  style: {
                    buttonDisplayMode: 'off'
                  }
                },
                (err: any) => {
                  if (err) {
                    console.error('Subscribe error:', err)
                  } else {
                    setRemoteParticipants(prev => prev + 1)
                  }
                }
              )
            })

            // Handle stream destroyed
            session.on('streamDestroyed', (event: any) => {
              setRemoteParticipants(prev => Math.max(0, prev - 1))
            })

            // Monitor connection quality
            session.on('connectionCreated', () => {
              setConnectionQuality('excellent')
            })

          } catch (vonageError) {
            console.error('Vonage initialization error:', vonageError)
            setError('Failed to initialize video call')
          }
        }
      } catch (error) {
        console.error('Initialize call error:', error)
        setError('Failed to start video call')
      }
    }

    initializeCall()

    // Cleanup
    return () => {
      mounted = false
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (publisherObjRef.current) {
        publisherObjRef.current.destroy()
      }
      if (sessionRef.current) {
        sessionRef.current.disconnect()
      }
    }
  }, [sessionId, token, participantName, participantRole, usingMockSession])

  const toggleVideo = () => {
    if (usingMockSession) {
      setIsVideoEnabled(!isVideoEnabled)
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = !isVideoEnabled
        })
      }
    } else if (publisherObjRef.current) {
      publisherObjRef.current.publishVideo(!isVideoEnabled)
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  const toggleAudio = () => {
    if (usingMockSession) {
      setIsAudioEnabled(!isAudioEnabled)
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !isAudioEnabled
        })
      }
    } else if (publisherObjRef.current) {
      publisherObjRef.current.publishAudio(!isAudioEnabled)
      setIsAudioEnabled(!isAudioEnabled)
    }
  }

  const toggleScreenShare = async () => {
    // Screen sharing implementation
    setIsScreenSharing(!isScreenSharing)
  }

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (publisherObjRef.current) {
      publisherObjRef.current.destroy()
    }
    if (sessionRef.current) {
      sessionRef.current.disconnect()
    }
    onCallEnd()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Error Alert */}
      {error && (
        <Alert className="absolute top-4 left-4 right-4 z-50 bg-red-500 text-white border-red-600">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Mock Session Warning */}
      {usingMockSession && (
        <Alert className="absolute top-4 left-4 right-4 z-50 bg-yellow-500 text-black border-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Mock Video Session - Configure Vonage API keys for production video calls
          </AlertDescription>
        </Alert>
      )}

      {/* Remote participant (main view) */}
      <div ref={subscriberRef} className="w-full h-full bg-gray-900" />

      {/* Local video (picture-in-picture) */}
      <div className="absolute bottom-24 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-2xl bg-gray-800">
        <div ref={publisherRef} className="w-full h-full" />
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <VideoOff className="h-8 w-8 text-white" />
          </div>
        )}
      </div>

      {/* Top bar - Call info */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <Badge variant="destructive" className="animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-2" />
              LIVE
            </Badge>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatDuration(callDuration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{remoteParticipants + 1} participants</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className={`h-4 w-4 ${
              connectionQuality === 'excellent' ? 'text-green-500' :
              connectionQuality === 'good' ? 'text-yellow-500' :
              connectionQuality === 'fair' ? 'text-orange-500' :
              'text-red-500'
            }`} />
            <span className="text-sm capitalize">{connectionQuality}</span>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant={isVideoEnabled ? "default" : "destructive"}
            onClick={toggleVideo}
            className="rounded-full w-14 h-14 bg-gray-700 hover:bg-gray-600"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            size="lg"
            variant={isAudioEnabled ? "default" : "destructive"}
            onClick={toggleAudio}
            className="rounded-full w-14 h-14 bg-gray-700 hover:bg-gray-600"
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            size="lg"
            variant={isScreenSharing ? "default" : "secondary"}
            onClick={toggleScreenShare}
            className="rounded-full w-14 h-14 bg-gray-700 hover:bg-gray-600"
          >
            {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={endCall}
            className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>

        <div className="text-center mt-4 text-white text-sm">
          {participantRole === 'nurse' ? 'Consulting with Doctor' : 'Consulting with Nurse'}
        </div>
      </div>
    </div>
  )
}

