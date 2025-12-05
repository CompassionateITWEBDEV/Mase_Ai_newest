"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { GroupVideoCall } from "@/components/telehealth/GroupVideoCall"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  LogIn,
  Timer,
  User,
  ArrowLeft,
  Copy,
  Share2,
} from "lucide-react"

interface Meeting {
  id: string
  title: string
  description?: string
  agenda?: string
  date: string
  time: string
  duration: string
  durationMinutes: number
  type: string
  organizer: string
  organizerId: string
  participants: Array<{ id: string; name: string; email?: string }>
  participantNames: string[]
  status: string
}

interface StaffMember {
  id: string
  name: string
  role?: string
  email?: string
  department?: string
}

export default function MeetingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const meetingId = params.meetingId as string

  // States
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [isLoadingMeeting, setIsLoadingMeeting] = useState(true)
  const [meetingError, setMeetingError] = useState<string | null>(null)
  
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  
  const [joinedCall, setJoinedCall] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)

  // Fetch meeting details
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setIsLoadingMeeting(true)
        setMeetingError(null)
        
        const res = await fetch(`/api/communications/meetings?meetingId=${meetingId}`)
        const data = await res.json()
        
        if (data.success && data.meeting) {
          setMeeting(data.meeting)
        } else if (data.meetings) {
          // Find in meetings list
          const found = data.meetings.find((m: any) => m.id === meetingId || m.id === `sample-${meetingId}`)
          if (found) {
            setMeeting(found)
          } else {
            setMeetingError("Meeting not found")
          }
        } else {
          setMeetingError("Meeting not found")
        }
      } catch (error) {
        console.error("Error fetching meeting:", error)
        setMeetingError("Failed to load meeting details")
      } finally {
        setIsLoadingMeeting(false)
      }
    }

    if (meetingId) {
      fetchMeeting()
    }
  }, [meetingId])

  // Fetch staff members
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
            role: s.role_id || s.role || s.credentials || s.department || "Staff",
            email: s.email,
            department: s.department,
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

  // Get camera preview
  useEffect(() => {
    const getPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoEnabled,
          audio: isAudioEnabled,
        })
        setPreviewStream(stream)
      } catch (err) {
        console.log("Could not get camera preview:", err)
      }
    }

    if (!joinedCall) {
      getPreview()
    }

    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isVideoEnabled, isAudioEnabled, joinedCall])

  // Check if selected staff is authorized
  const checkAuthorization = (staff: StaffMember) => {
    if (!meeting) return false
    
    // For sample/demo meetings, allow ALL staff to join
    // This makes testing easier since sample meetings don't have real participant IDs
    if (meeting.id.startsWith("sample-")) {
      return true
    }
    
    // Check if staff is the organizer (by ID or name)
    if (meeting.organizerId === staff.id || meeting.organizer === staff.name) {
      return true
    }
    
    // Check if staff is in the participants list (by ID or name)
    const isInvitedById = meeting.participants?.some(p => p.id === staff.id)
    const isInvitedByName = meeting.participants?.some(p => 
      p.name?.toLowerCase() === staff.name?.toLowerCase()
    )
    
    // Also check participantNames array for backward compatibility
    const isInvitedByNameList = meeting.participantNames?.some(name => 
      name?.toLowerCase() === staff.name?.toLowerCase()
    )
    
    return isInvitedById || isInvitedByName || isInvitedByNameList
  }

  // Handle staff selection
  const handleSelectStaff = (staff: StaffMember) => {
    setSelectedStaff(staff)
    setAuthError(null)
    
    const authorized = checkAuthorization(staff)
    setIsAuthorized(authorized)
    
    if (!authorized) {
      setAuthError(`${staff.name} is not invited to this meeting`)
    }
  }

  // Join the meeting
  const handleJoinMeeting = () => {
    if (!selectedStaff || !isAuthorized) return
    
    // Stop preview stream
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop())
      setPreviewStream(null)
    }
    
    setJoinedCall(true)
    
    toast({
      title: "Joining Meeting",
      description: `Connecting to ${meeting?.title}...`,
    })
  }

  // Leave meeting
  const handleLeaveMeeting = () => {
    setJoinedCall(false)
    setSelectedStaff(null)
    setIsAuthorized(false)
    router.push("/communications")
  }

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Loading state
  if (isLoadingMeeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Loading Meeting</h2>
            <p className="text-gray-400">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Meeting not found
  if (meetingError || !meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/30 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Meeting Not Found</h2>
            <p className="text-gray-400 mb-6">{meetingError || "This meeting link is invalid or has expired."}</p>
            <Button 
              onClick={() => router.push("/communications")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Communications
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If joined call, show video call
  if (joinedCall && selectedStaff) {
    const isHost = meeting.organizerId === selectedStaff.id
    const meetingSessionId = `meeting-${meeting.id}`
    
    // Get other participants (excluding self)
    const otherParticipants = meeting.participants?.filter(p => p.id !== selectedStaff.id) || []

    return (
      <div className="h-screen w-screen">
        <GroupVideoCall
          consultationId={meetingSessionId}
          currentUserId={selectedStaff.id}
          currentUserName={selectedStaff.name}
          participants={otherParticipants}
          meetingDuration={meeting.durationMinutes || 30}
          isHost={isHost}
          meetingId={meeting.id}
          meetingTitle={meeting.title}
          onConnected={() => {
            console.log("✅ Connected to meeting")
          }}
          onCallEnd={handleLeaveMeeting}
        />
      </div>
    )
  }

  // Pre-join lobby
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Camera Preview */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Camera Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative">
              {previewStream && isVideoEnabled ? (
                <video
                  autoPlay
                  playsInline
                  muted
                  ref={(video) => {
                    if (video && previewStream) {
                      video.srcObject = previewStream
                    }
                  }}
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <VideoOff className="h-16 w-16 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-500">Camera is off</p>
                  </div>
                </div>
              )}
              
              {/* Controls overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                <Button
                  variant={isVideoEnabled ? "secondary" : "destructive"}
                  size="icon"
                  className="rounded-full w-12 h-12"
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                <Button
                  variant={isAudioEnabled ? "secondary" : "destructive"}
                  size="icon"
                  className="rounded-full w-12 h-12"
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                >
                  {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* Meeting Info */}
            <div className="mt-4 p-4 bg-gray-700/30 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white text-lg">{meeting.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-600"
                  onClick={() => {
                    const url = `${window.location.origin}/meeting/${meeting.id}`
                    navigator.clipboard.writeText(url)
                    toast({
                      title: "Link Copied!",
                      description: "Share this link with participants",
                    })
                  }}
                >
                  <Copy className="h-4 w-4 mr-1.5" />
                  Copy Link
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {meeting.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {meeting.time}
                </span>
                <span className="flex items-center gap-1.5">
                  <Timer className="h-4 w-4 text-orange-400" />
                  {meeting.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-gray-400" />
                  {meeting.participants?.length || 0} invited
                </span>
              </div>
              {meeting.organizer && (
                <p className="text-xs text-gray-400 mt-2">Organized by {meeting.organizer}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Staff Selection */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Select Your Profile
            </CardTitle>
            <CardDescription className="text-gray-400">
              Choose your staff profile to join this meeting
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStaff ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                <p className="text-sm text-gray-400 mt-2">Loading staff members...</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[280px] pr-2">
                  <div className="space-y-2">
                    {staffMembers.map((staff) => {
                      const isSelected = selectedStaff?.id === staff.id
                      const wouldBeAuthorized = checkAuthorization(staff)
                      
                      return (
                        <div
                          key={staff.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? wouldBeAuthorized
                                ? "bg-green-500/20 border-green-500"
                                : "bg-red-500/20 border-red-500"
                              : "bg-gray-700/30 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500"
                          }`}
                          onClick={() => handleSelectStaff(staff)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`${
                              isSelected 
                                ? wouldBeAuthorized ? "bg-green-600" : "bg-red-600"
                                : "bg-blue-600"
                            } text-white`}>
                              {getInitials(staff.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-white">{staff.name}</p>
                            <p className="text-xs text-gray-400">{staff.role || staff.department || "Staff"}</p>
                          </div>
                          {isSelected && (
                            wouldBeAuthorized ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )
                          )}
                          {!isSelected && wouldBeAuthorized && (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">Invited</Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>

                {/* Authorization Status */}
                {selectedStaff && (
                  <div className={`mt-4 p-3 rounded-xl ${
                    isAuthorized 
                      ? "bg-green-500/20 border border-green-500/30" 
                      : "bg-red-500/20 border border-red-500/30"
                  }`}>
                    <div className="flex items-center gap-2">
                      {isAuthorized ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-green-400 font-medium">Ready to Join</p>
                            <p className="text-green-400/70 text-sm">
                              {selectedStaff.name} is authorized to join this meeting
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="text-red-400 font-medium">Not Authorized</p>
                            <p className="text-red-400/70 text-sm">{authError}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Join Button */}
                <Button
                  className={`w-full mt-4 h-12 text-lg font-semibold ${
                    isAuthorized && selectedStaff
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      : "bg-gray-600 cursor-not-allowed"
                  }`}
                  disabled={!isAuthorized || !selectedStaff}
                  onClick={handleJoinMeeting}
                >
                  <Video className="h-5 w-5 mr-2" />
                  {selectedStaff 
                    ? isAuthorized 
                      ? "Join Meeting" 
                      : "Not Invited"
                    : "Select Your Profile"
                  }
                </Button>

                {/* Invited Participants */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  {meeting.id.startsWith("sample-") ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-500/20 text-green-400 text-xs">Demo Meeting</Badge>
                        <p className="text-xs text-gray-400">All staff can join this demo meeting</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400 mb-2">Invited Participants:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {meeting.participants?.length > 0 ? (
                          meeting.participants.map((p, i) => (
                            <Badge key={i} variant="outline" className="bg-gray-700/30 text-gray-300 text-xs">
                              {p.name}
                            </Badge>
                          ))
                        ) : meeting.participantNames?.length > 0 ? (
                          meeting.participantNames.map((name, i) => (
                            <Badge key={i} variant="outline" className="bg-gray-700/30 text-gray-300 text-xs">
                              {name}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500">No participants listed</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

