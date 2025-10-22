"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Users,
  MessageSquare,
  Camera,
  Wifi,
  Signal,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Play,
  Square,
  MoreVertical,
  Maximize,
} from "lucide-react"
import Link from "next/link"

export default function VideoTestPage() {
  const [activeTab, setActiveTab] = useState("setup")
  const [isCallActive, setIsCallActive] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [networkQuality, setNetworkQuality] = useState("excellent")
  const [participants] = useState([
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "Medical Director",
      videoEnabled: true,
      audioEnabled: true,
      quality: "excellent",
    },
    { id: 2, name: "Michael Chen", role: "HR Manager", videoEnabled: true, audioEnabled: false, quality: "good" },
    {
      id: 3,
      name: "Emily Davis",
      role: "Training Coordinator",
      videoEnabled: false,
      audioEnabled: true,
      quality: "fair",
    },
    { id: 4, name: "You", role: "Administrator", videoEnabled: true, audioEnabled: true, quality: "excellent" },
  ])

  // Simulate call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isCallActive])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-green-500"
      case "good":
        return "text-yellow-500"
      case "fair":
        return "text-orange-500"
      case "poor":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case "excellent":
        return <CheckCircle className="h-4 w-4" />
      case "good":
        return <CheckCircle className="h-4 w-4" />
      case "fair":
        return <AlertTriangle className="h-4 w-4" />
      case "poor":
        return <XCircle className="h-4 w-4" />
      default:
        return <Signal className="h-4 w-4" />
    }
  }

  const startCall = () => {
    setIsCallActive(true)
    setCallDuration(0)
    setActiveTab("call")
  }

  const endCall = () => {
    setIsCallActive(false)
    setCallDuration(0)
    setScreenSharing(false)
    setIsRecording(false)
    setActiveTab("setup")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Video Conferencing Test Center</h1>
              <p className="text-gray-600">Test and optimize your video call experience</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">Pre-Call Setup</TabsTrigger>
            <TabsTrigger value="call" disabled={!isCallActive}>
              Active Call
            </TabsTrigger>
            <TabsTrigger value="features">Feature Demo</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            {/* Device Testing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Camera className="h-5 w-5 mr-2" />
                    Camera & Microphone Test
                  </CardTitle>
                  <CardDescription>Test your audio and video devices before joining a call</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Video Preview */}
                  <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative z-10 text-center text-white">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera className="h-10 w-10" />
                      </div>
                      <p className="text-lg font-medium">Camera Preview</p>
                      <p className="text-sm opacity-80">Your video feed will appear here</p>
                    </div>
                    {videoEnabled && (
                      <div className="absolute bottom-4 left-4">
                        <Badge className="bg-green-500">Camera Active</Badge>
                      </div>
                    )}
                  </div>

                  {/* Audio Level Indicator */}
                  <div className="space-y-2">
                    <Label>Microphone Level</Label>
                    <div className="flex items-center space-x-2">
                      <Mic className="h-4 w-4 text-gray-500" />
                      <Progress value={audioEnabled ? 75 : 0} className="flex-1" />
                      <span className="text-sm text-gray-500">75%</span>
                    </div>
                  </div>

                  {/* Device Controls */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch checked={videoEnabled} onCheckedChange={setVideoEnabled} id="video-toggle" />
                      <Label htmlFor="video-toggle">Enable Video</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} id="audio-toggle" />
                      <Label htmlFor="audio-toggle">Enable Audio</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wifi className="h-5 w-5 mr-2" />
                    Network Quality Test
                  </CardTitle>
                  <CardDescription>Check your internet connection for optimal call quality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Network Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">45 Mbps</div>
                      <div className="text-sm text-green-700">Download Speed</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">12 Mbps</div>
                      <div className="text-sm text-blue-700">Upload Speed</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">23 ms</div>
                      <div className="text-sm text-purple-700">Latency</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-2xl font-bold text-orange-600">0.1%</div>
                      <div className="text-sm text-orange-700">Packet Loss</div>
                    </div>
                  </div>

                  {/* Quality Assessment */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-800">Excellent Connection Quality</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Your connection is optimal for HD video calls with screen sharing.
                    </p>
                  </div>

                  {/* Recommended Settings */}
                  <div className="space-y-2">
                    <Label>Recommended Video Quality</Label>
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">1080p HD</Badge>
                      <Badge variant="outline">60 FPS</Badge>
                      <Badge variant="outline">Stereo Audio</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Start Call Button */}
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Ready to Start Your Test Call?</h3>
                <p className="text-gray-600 mb-4">
                  All systems are ready. Click below to start a simulated video conference.
                </p>
                <Button onClick={startCall} size="lg" className="bg-green-600 hover:bg-green-700">
                  <Video className="h-5 w-5 mr-2" />
                  Start Test Call
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="call" className="space-y-6">
            {/* Call Interface */}
            <Card>
              <CardContent className="p-0">
                {/* Video Grid */}
                <div className="relative">
                  {screenSharing ? (
                    // Screen Sharing View
                    <div className="aspect-video bg-gray-900 rounded-t-lg flex items-center justify-center relative">
                      <div className="text-center text-white">
                        <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">Screen Sharing Active</h3>
                        <p className="text-gray-300">Showing: Healthcare Training Protocol Document</p>
                      </div>

                      {/* Presenter Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-blue-600">Dr. Sarah Johnson is presenting</Badge>
                      </div>

                      {/* Participant Thumbnails */}
                      <div className="absolute bottom-4 right-4 flex space-x-2">
                        {participants.slice(0, 3).map((participant) => (
                          <div
                            key={participant.id}
                            className="w-20 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center relative"
                          >
                            <div className="text-white text-xs font-medium text-center">
                              {participant.name.split(" ")[0]}
                            </div>
                            {!participant.videoEnabled && (
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <VideoOff className="h-4 w-4 text-white" />
                              </div>
                            )}
                            {!participant.audioEnabled && (
                              <div className="absolute bottom-1 left-1">
                                <MicOff className="h-3 w-3 text-red-400" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Regular Video Grid
                    <div className="grid grid-cols-2 gap-2 p-4 bg-gray-900 rounded-t-lg">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center relative"
                        >
                          <div className="text-center text-white">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-lg font-semibold">
                                {participant.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{participant.name}</p>
                            <p className="text-xs opacity-75">{participant.role}</p>
                          </div>

                          {/* Video/Audio Status Indicators */}
                          <div className="absolute bottom-2 left-2 flex space-x-1">
                            {!participant.videoEnabled && (
                              <div className="bg-red-500 rounded-full p-1">
                                <VideoOff className="h-3 w-3 text-white" />
                              </div>
                            )}
                            {!participant.audioEnabled && (
                              <div className="bg-red-500 rounded-full p-1">
                                <MicOff className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Connection Quality */}
                          <div className="absolute bottom-2 right-2">
                            <div className={`flex items-center space-x-1 ${getQualityColor(participant.quality)}`}>
                              {getQualityIcon(participant.quality)}
                            </div>
                          </div>

                          {/* Speaking Indicator */}
                          {participant.audioEnabled && participant.id === 1 && (
                            <div className="absolute inset-0 border-2 border-green-400 rounded-lg animate-pulse"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Call Controls */}
                  <div className="bg-gray-800 p-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      {/* Left Controls */}
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-white text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(callDuration)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-white text-sm">
                          <Users className="h-4 w-4" />
                          <span>{participants.length}</span>
                        </div>
                        {isRecording && (
                          <div className="flex items-center space-x-1 text-red-400 text-sm">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span>Recording</span>
                          </div>
                        )}
                      </div>

                      {/* Center Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={audioEnabled ? "secondary" : "destructive"}
                          size="sm"
                          onClick={() => setAudioEnabled(!audioEnabled)}
                        >
                          {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </Button>

                        <Button
                          variant={videoEnabled ? "secondary" : "destructive"}
                          size="sm"
                          onClick={() => setVideoEnabled(!videoEnabled)}
                        >
                          {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                        </Button>

                        <Button
                          variant={screenSharing ? "default" : "secondary"}
                          size="sm"
                          onClick={() => setScreenSharing(!screenSharing)}
                        >
                          {screenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                        </Button>

                        <Button
                          variant={isRecording ? "default" : "secondary"}
                          size="sm"
                          onClick={() => setIsRecording(!isRecording)}
                        >
                          {isRecording ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>

                        <Button variant="destructive" size="sm" onClick={endCall}>
                          <PhoneOff className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Right Controls */}
                      <div className="flex items-center space-x-2">
                        <Button variant="secondary" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">Excellent</div>
                  <div className="text-sm text-gray-600">Connection Quality</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">1080p</div>
                  <div className="text-sm text-gray-600">Video Quality</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">18ms</div>
                  <div className="text-sm text-gray-600">Latency</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">2.1 MB/s</div>
                  <div className="text-sm text-gray-600">Bandwidth Usage</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            {/* Feature Demonstrations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Screen Sharing Demo</CardTitle>
                  <CardDescription>Test screen sharing capabilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Monitor className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-medium">Screen Share Preview</p>
                      <p className="text-sm">Your screen content will appear here</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1 bg-transparent">
                      <Monitor className="h-4 w-4 mr-2" />
                      Share Entire Screen
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent">
                      <Maximize className="h-4 w-4 mr-2" />
                      Share Application
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Virtual Backgrounds</CardTitle>
                  <CardDescription>Test background replacement features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600 rounded cursor-pointer hover:ring-2 hover:ring-blue-300">
                      <div className="h-full flex items-center justify-center text-white text-xs font-medium">
                        Office
                      </div>
                    </div>
                    <div className="aspect-video bg-gradient-to-br from-green-400 to-green-600 rounded cursor-pointer hover:ring-2 hover:ring-green-300">
                      <div className="h-full flex items-center justify-center text-white text-xs font-medium">
                        Nature
                      </div>
                    </div>
                    <div className="aspect-video bg-gradient-to-br from-purple-400 to-purple-600 rounded cursor-pointer hover:ring-2 hover:ring-purple-300">
                      <div className="h-full flex items-center justify-center text-white text-xs font-medium">
                        Abstract
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Custom Background
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audio Settings</CardTitle>
                  <CardDescription>Configure audio preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Microphone</Label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Default - Built-in Microphone</option>
                      <option>USB Headset Microphone</option>
                      <option>Bluetooth Headphones</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Speakers</Label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Default - Built-in Speakers</option>
                      <option>USB Headset</option>
                      <option>Bluetooth Headphones</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Noise Cancellation</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Echo Cancellation</Label>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recording & Chat</CardTitle>
                  <CardDescription>Test recording and messaging features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Play className="h-4 w-4 mr-2" />
                      Start Local Recording
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open Chat Panel
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-2">Chat Messages</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Dr. Johnson:</span>
                        <span className="text-gray-500">10:30 AM</span>
                      </div>
                      <p className="text-gray-700">Welcome everyone to the training session!</p>
                      <div className="flex justify-between">
                        <span className="font-medium">Michael:</span>
                        <span className="text-gray-500">10:31 AM</span>
                      </div>
                      <p className="text-gray-700">Thanks for organizing this.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-6">
            {/* System Diagnostics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>Monitor system resources during video calls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Usage</span>
                        <span>23%</span>
                      </div>
                      <Progress value={23} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>GPU Usage</span>
                        <span>18%</span>
                      </div>
                      <Progress value={18} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Network Usage</span>
                        <span>2.1 MB/s</span>
                      </div>
                      <Progress value={35} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connection Statistics</CardTitle>
                  <CardDescription>Real-time network performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Bandwidth</div>
                      <div className="font-semibold">45.2 Mbps ↓ / 12.1 Mbps ↑</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Latency</div>
                      <div className="font-semibold">18ms</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Jitter</div>
                      <div className="font-semibold">2.1ms</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Packet Loss</div>
                      <div className="font-semibold">0.1%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Video Codec</div>
                      <div className="font-semibold">H.264</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Audio Codec</div>
                      <div className="font-semibold">Opus</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Troubleshooting Guide</CardTitle>
                  <CardDescription>Common issues and solutions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-green-800">All Systems Optimal</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Your system is performing excellently for video conferencing. No issues detected.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium mb-2">Poor Video Quality?</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Check your internet connection</li>
                          <li>• Close unnecessary applications</li>
                          <li>• Reduce video resolution</li>
                          <li>• Ensure good lighting</li>
                        </ul>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium mb-2">Audio Issues?</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Check microphone permissions</li>
                          <li>• Test different audio devices</li>
                          <li>• Enable noise cancellation</li>
                          <li>• Adjust microphone levels</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
