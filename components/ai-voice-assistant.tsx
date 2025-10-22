"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Minimize2, Zap } from "lucide-react"

interface AIVoiceAssistantProps {
  userRole?: string
}

export function AIVoiceAssistant({ userRole = "staff" }: AIVoiceAssistantProps) {
  const router = useRouter()
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [conversationMode, setConversationMode] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
  >([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [speechRate, setSpeechRate] = useState(0.9)
  const [speechPitch, setSpeechPitch] = useState(1.0)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<any>(null)

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const SpeechSynthesis = window.speechSynthesis

      if (SpeechRecognition && SpeechSynthesis) {
        setIsSupported(true)

        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = conversationMode
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"
        recognitionRef.current.maxAlternatives = 3

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            setTranscript(finalTranscript)
            processEnhancedVoiceCommand(finalTranscript)
          } else {
            setTranscript(interimTranscript)
          }
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
          if (conversationMode && !isProcessing) {
            setTimeout(() => startListening(), 1000)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          setIsListening(false)
        }

        synthRef.current = SpeechSynthesis

        const loadVoices = () => {
          const voices = synthRef.current.getVoices()
          setAvailableVoices(voices)
          // Select a preferred voice (female, English)
          const preferredVoice =
            voices.find((voice) => voice.lang.startsWith("en") && voice.name.toLowerCase().includes("female")) ||
            voices.find((voice) => voice.lang.startsWith("en")) ||
            voices[0]
          setSelectedVoice(preferredVoice)
        }

        loadVoices()
        synthRef.current.onvoiceschanged = loadVoices
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationMode, isProcessing])

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        setIsListening(false)
        if (conversationMode) {
          recognitionRef.current.start()
        }
      }
    }
  }, [conversationMode])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      if (!conversationMode) {
        setTranscript("")
        setResponse("")
      }
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const speak = (text: string, interrupt = false) => {
    if (synthRef.current) {
      if (interrupt) {
        synthRef.current.cancel()
      }

      if (!isSpeaking || interrupt) {
        setIsSpeaking(true)
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = speechRate
        utterance.pitch = speechPitch
        utterance.volume = 0.8

        if (selectedVoice) {
          utterance.voice = selectedVoice
        }

        utterance.onend = () => {
          setIsSpeaking(false)
        }

        utterance.onerror = () => {
          setIsSpeaking(false)
        }

        synthRef.current.speak(utterance)
      }
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  const processEnhancedVoiceCommand = async (command: string) => {
    setIsProcessing(true)
    const lowerCommand = command.toLowerCase()

    // Add to conversation history
    const userMessage = { role: "user" as const, content: command, timestamp: new Date() }
    setConversationHistory((prev) => [...prev, userMessage])

    try {
      // Call enhanced AI processing endpoint
      const response = await fetch("/api/ai/enhanced-voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: command,
          conversationHistory: conversationHistory.slice(-5), // Last 5 messages for context
          userRole,
          currentPage: window.location.pathname,
          conversationMode,
        }),
      })

      const data = await response.json()

      const assistantMessage = { role: "assistant" as const, content: data.response, timestamp: new Date() }
      setConversationHistory((prev) => [...prev, assistantMessage])

      setResponse(data.response)
      speak(data.response, true)

      // Handle navigation if provided
      if (data.action && data.action !== "none") {
        setTimeout(() => {
          router.push(data.action)
        }, 2000)
      }
    } catch (error) {
      const errorResponse = "I'm sorry, I encountered an error processing your request. Please try again."
      setResponse(errorResponse)
      speak(errorResponse, true)
    }

    setIsProcessing(false)
  }

  const toggleConversationMode = () => {
    setConversationMode((prev) => !prev)
    if (!conversationMode) {
      setConversationHistory([])
      speak(
        "Conversation mode activated. I'm now listening continuously and ready for natural conversation.",
        true
      )
      startListening()
    } else {
      speak("Conversation mode deactivated.", true)
      stopListening()
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isMinimized ? (
        <div className="flex flex-col space-y-2">
          {conversationMode && (
            <Badge className="bg-green-500 text-white animate-pulse">
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
          <Button
            onClick={() => setIsMinimized(false)}
            className={`rounded-full w-12 h-12 shadow-lg ${
              conversationMode ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <MessageSquare className="h-5 w-5 text-white" />
          </Button>
        </div>
      ) : (
        <Card className="w-96 shadow-xl border-2 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-sm">AI Assistant</span>
                <Badge variant="outline" className="text-xs">
                  {userRole}
                </Badge>
                {conversationMode && (
                  <Badge className="bg-green-500 text-white text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                )}
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)} className="h-6 w-6 p-0">
                  <Minimize2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-center space-x-2">
                <Button
                  onClick={isListening ? stopListening : startListening}
                  variant={isListening ? "destructive" : "default"}
                  size="sm"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                  {isProcessing ? "Processing..." : isListening ? "Stop" : "Talk"}
                </Button>

                <Button
                  onClick={
                    isSpeaking
                      ? stopSpeaking
                      : () => speak("Hello! I'm your enhanced AI assistant with natural conversation capabilities.")
                  }
                  variant={isSpeaking ? "destructive" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  {isSpeaking ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                  {isSpeaking ? "Stop" : "Test"}
                </Button>

                <Button
                  onClick={toggleConversationMode}
                  variant={conversationMode ? "secondary" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  {conversationMode ? "Convo Off" : "Convo Mode"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Conversation Mode</span>
                <Button onClick={toggleConversationMode} variant={conversationMode ? "default" : "outline"} size="sm">
                  <Zap className="h-3 w-3 mr-1" />
                  {conversationMode ? "On" : "Off"}
                </Button>
              </div>

              {transcript && (
                <div className="p-2 bg-gray-50 rounded text-sm max-h-20 overflow-y-auto">
                  <strong>You:</strong> {transcript}
                </div>
              )}

              {response && (
                <div className="p-2 bg-blue-50 rounded text-sm max-h-32 overflow-y-auto">
                  <strong>Assistant:</strong> {response}
                </div>
              )}

              {conversationMode && conversationHistory.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  <div className="text-xs font-medium text-gray-600">Recent Conversation:</div>
                  {conversationHistory.slice(-3).map((msg, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-1 rounded ${msg.role === "user" ? "bg-gray-100" : "bg-blue-100"}`}
                    >
                      <strong>{msg.role === "user" ? "You" : "AI"}:</strong> {msg.content.substring(0, 50)}...
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500 text-center">
                {conversationMode
                  ? "I'm listening continuously. Speak naturally!"
                  : "Try: 'Show me patient tracking', 'What's my schedule?', 'Help with billing'"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
