"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Volume2, TestTube, CheckCircle, XCircle } from "lucide-react"

export default function VoiceTestPage() {
  const [testResults, setTestResults] = useState<
    Array<{
      command: string
      expected: string
      actual?: string
      status: "pending" | "success" | "failed"
    }>
  >([])
  const [isRunningTests, setIsRunningTests] = useState(false)

  const testCommands = [
    { command: "navigate to dashboard", expected: "Navigate to main dashboard" },
    { command: "show patients", expected: "Navigate to patient tracking" },
    { command: "open oasis qa", expected: "Navigate to OASIS QA" },
    { command: "create new complaint", expected: "Navigate to complaints" },
    { command: "search for john doe", expected: "Search functionality" },
    { command: "show status", expected: "Status information" },
    { command: "help", expected: "Help information" },
  ]

  const runVoiceCommandTest = async (command: string) => {
    try {
      const response = await fetch("/api/ai/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          currentPage: "/voice-test",
          userRole: "staff",
          context: {
            timestamp: new Date().toISOString(),
            confidence: 95,
          },
        }),
      })

      const data = await response.json()
      return {
        success: data.success,
        response: data.response,
        action: data.action,
        path: data.path,
      }
    } catch (error) {
      console.error("Test error:", error)
      return {
        success: false,
        response: "Test failed with error",
        error: error,
      }
    }
  }

  const runAllTests = async () => {
    setIsRunningTests(true)
    const results = []

    for (const test of testCommands) {
      const result = await runVoiceCommandTest(test.command)
      results.push({
        command: test.command,
        expected: test.expected,
        actual: result.response,
        status: result.success ? "success" : ("failed" as const),
      })
    }

    setTestResults(results)
    setIsRunningTests(false)
  }

  const testSpeechRecognition = () => {
    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      return "✅ Speech Recognition Supported"
    }
    return "❌ Speech Recognition Not Supported"
  }

  const testSpeechSynthesis = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      return "✅ Speech Synthesis Supported"
    }
    return "❌ Speech Synthesis Not Supported"
  }

  const testMicrophonePermission = async () => {
    try {
      if (typeof window === "undefined") return "❌ Microphone Access Denied"
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      return "✅ Microphone Access Granted"
    } catch (error) {
      return "❌ Microphone Access Denied"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <TestTube className="h-6 w-6" />
        <h1 className="text-3xl font-bold">AI Voice Assistant Test Suite</h1>
      </div>

      {/* Browser Compatibility Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5" />
            <span>Browser Compatibility</span>
          </CardTitle>
          <CardDescription>Check if your browser supports voice features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Speech Recognition</h3>
              <p className="text-sm text-gray-600">{testSpeechRecognition()}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Speech Synthesis</h3>
              <p className="text-sm text-gray-600">{testSpeechSynthesis()}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Microphone Access</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const result = await testMicrophonePermission()
                  alert(result)
                }}
              >
                Test Microphone
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Command Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="h-5 w-5" />
            <span>Voice Command Tests</span>
          </CardTitle>
          <CardDescription>Test various voice commands to ensure they work correctly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runAllTests} disabled={isRunningTests} className="w-full">
            {isRunningTests ? "Running Tests..." : "Run All Voice Command Tests"}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Test Results:</h3>
              {testResults.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">"{result.command}"</span>
                    <Badge variant={result.status === "success" ? "default" : "destructive"}>
                      {result.status === "success" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {result.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Expected:</strong> {result.expected}
                    </p>
                    <p>
                      <strong>Actual:</strong> {result.actual}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Test Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Test Commands</CardTitle>
          <CardDescription>Try these commands with the AI Voice Assistant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testCommands.map((test, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">"{test.command}"</code>
                <p className="text-xs text-gray-600 mt-1">{test.expected}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click the blue AI Assistant button in the bottom-right corner</li>
            <li>Click "Talk" to start voice recognition</li>
            <li>Speak one of the test commands clearly</li>
            <li>Wait for the AI to respond</li>
            <li>Check if the expected action occurs</li>
          </ol>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Tips for Better Recognition:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Speak clearly and at a normal pace</li>
              <li>• Use Chrome or Edge browser for best results</li>
              <li>• Ensure microphone permissions are granted</li>
              <li>• Minimize background noise</li>
              <li>• Wait for the "Listening..." indicator before speaking</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
