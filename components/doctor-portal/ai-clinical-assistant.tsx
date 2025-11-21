"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Brain, Sparkles, AlertTriangle, FileText, Pill, Activity, Loader2, Send, Lightbulb } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AIClinicalAssistantProps {
  consultation?: any
  patientData?: any
  onSuggestionApply?: (suggestion: string) => void
}

export function AIClinicalAssistant({ consultation, patientData, onSuggestionApply }: AIClinicalAssistantProps) {
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
  const [userQuery, setUserQuery] = useState("")
  const [isChatting, setIsChatting] = useState(false)

  // Auto-analyze consultation when it loads
  useEffect(() => {
    if (consultation && !aiSuggestions) {
      analyzeConsultation()
    }
  }, [consultation])

  const analyzeConsultation = async () => {
    if (!consultation) return
    
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/ai/clinical-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          consultation,
          patientData
        })
      })

      const data = await response.json()
      if (data.success) {
        setAiSuggestions(data.analysis)
        toast({
          title: "AI Analysis Complete",
          description: "Clinical suggestions are ready",
        })
      } else {
        // API error - show user-friendly message
        toast({
          title: "AI Temporarily Unavailable",
          description: "OpenAI service is experiencing issues. Please try again later.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('AI Analysis error:', error)
      toast({
        title: "AI Temporarily Unavailable",
        description: "OpenAI service is experiencing issues. Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const askAI = async () => {
    if (!userQuery.trim()) return

    setIsChatting(true)
    const newMessage = { role: 'user', content: userQuery }
    setChatMessages(prev => [...prev, newMessage])
    setUserQuery("")

    try {
      const response = await fetch('/api/ai/clinical-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          query: userQuery,
          consultation,
          patientData,
          chatHistory: chatMessages
        })
      })

      const data = await response.json()
      if (data.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'I apologize, but the AI service is temporarily unavailable. Please try again in a few moments.' 
        }])
      }
    } catch (error) {
      console.error('AI Chat error:', error)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but the AI service is temporarily unavailable. Please try again in a few moments.' 
      }])
    } finally {
      setIsChatting(false)
    }
  }

  const getUrgencyColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      {/* AI Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            AI Clinical Assistant
            <Badge className="ml-2 bg-purple-600">Powered by GPT-4</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* AI Analysis Results */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-purple-600" />
            <p className="text-sm text-gray-600">Analyzing consultation with AI...</p>
          </CardContent>
        </Card>
      )}

      {aiSuggestions && (
        <>
          {/* Triage Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <AlertTriangle className="h-4 w-4 mr-2" />
                AI Triage Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Suggested Urgency:</span>
                <Badge className={getUrgencyColor(aiSuggestions.suggestedUrgency)}>
                  {aiSuggestions.suggestedUrgency?.toUpperCase()}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Risk Factors:</p>
                <ul className="space-y-1">
                  {aiSuggestions.riskFactors?.map((risk: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Lightbulb className="h-4 w-4 mr-2 text-yellow-600" />
                Clinical Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Differential Diagnoses:</p>
                <div className="space-y-2">
                  {aiSuggestions.differentialDiagnoses?.map((diagnosis: any, idx: number) => (
                    <div key={idx} className="p-2 bg-blue-50 rounded text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{diagnosis.condition}</span>
                        <Badge variant="outline">{diagnosis.likelihood}</Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{diagnosis.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Recommended Actions:</p>
                <ul className="space-y-1">
                  {aiSuggestions.recommendedActions?.map((action: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Medication Suggestions */}
          {aiSuggestions.medicationSuggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Pill className="h-4 w-4 mr-2 text-blue-600" />
                  Medication Considerations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiSuggestions.medicationSuggestions.map((med: any, idx: number) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                    <p className="font-medium">{med.medication}</p>
                    <p className="text-xs text-gray-600">{med.indication}</p>
                    {med.warning && (
                      <p className="text-xs text-red-600 mt-1 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {med.warning}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Documentation Draft */}
          {aiSuggestions.documentationDraft && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <FileText className="h-4 w-4 mr-2 text-green-600" />
                  AI-Generated Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded text-sm font-mono whitespace-pre-wrap">
                  {aiSuggestions.documentationDraft}
                </div>
                <Button 
                  size="sm" 
                  className="mt-3"
                  onClick={() => onSuggestionApply?.(aiSuggestions.documentationDraft)}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Apply to Notes
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
            Ask AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="h-48 w-full rounded border p-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-8">
                <Brain className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Ask me anything about this consultation</p>
                <p className="text-xs mt-1">e.g., "What tests should I order?" or "Any drug interactions?"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-2 rounded text-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-2 rounded">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask AI a question..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  askAI()
                }
              }}
              className="min-h-[60px]"
              disabled={isChatting}
            />
            <Button 
              onClick={askAI} 
              disabled={!userQuery.trim() || isChatting}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={analyzeConsultation}
            disabled={isAnalyzing}
          >
            <Activity className="h-4 w-4 mr-2" />
            Re-analyze Consultation
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => setUserQuery("What are the key risk factors for this patient?")}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Identify Risk Factors
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => setUserQuery("Suggest appropriate diagnostic tests")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Suggest Diagnostic Tests
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

