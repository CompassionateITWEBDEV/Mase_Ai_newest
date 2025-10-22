"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  Info,
  Shield,
  Eye,
  Clock,
  Heart,
  Activity,
  Zap,
  CheckCircle,
  X,
} from "lucide-react"

interface DrugInteraction {
  drug1: string
  drug2: string
  severity: "minor" | "moderate" | "major" | "contraindicated"
  description: string
  clinicalEffect: string
  mechanism: string
  management: string
  references: string[]
  riskFactors?: string[]
  monitoring?: string[]
}

interface DrugInteractionAlertProps {
  newMedication: {
    name: string
    genericName?: string
    dosage?: string
    ndc?: string
  }
  currentMedications: Array<{
    name: string
    genericName?: string
    dosage?: string
  }>
  patientId?: string
  onInteractionCheck?: (result: any) => void
  autoCheck?: boolean
}

export function DrugInteractionAlert({
  newMedication,
  currentMedications,
  patientId,
  onInteractionCheck,
  autoCheck = true,
}: DrugInteractionAlertProps) {
  const [interactions, setInteractions] = useState<DrugInteraction[]>([])
  const [riskLevel, setRiskLevel] = useState<"low" | "moderate" | "high" | "critical">("low")
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [requiresPharmacistReview, setRequiresPharmacistReview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedInteraction, setSelectedInteraction] = useState<DrugInteraction | null>(null)
  const [processingTime, setProcessingTime] = useState(0)

  useEffect(() => {
    if (autoCheck && newMedication.name && currentMedications.length > 0) {
      checkInteractions()
    }
  }, [newMedication, currentMedications, autoCheck])

  const checkInteractions = async () => {
    if (!newMedication.name) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/drug-interactions/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newMedication,
          currentMedications,
          patientId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setInteractions(data.interactions)
        setRiskLevel(data.riskLevel)
        setRecommendations(data.recommendations)
        setRequiresPharmacistReview(data.requiresPharmacistReview)
        setProcessingTime(data.processingTime)

        if (onInteractionCheck) {
          onInteractionCheck(data)
        }
      }
    } catch (error) {
      console.error("Error checking drug interactions:", error)
      setRecommendations(["Unable to check interactions. Please consult pharmacist."])
      setRequiresPharmacistReview(true)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "contraindicated":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "major":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "moderate":
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case "minor":
        return <Info className="h-5 w-5 text-yellow-500" />
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "contraindicated":
        return "bg-red-100 text-red-800 border-red-300"
      case "major":
        return "bg-red-50 text-red-700 border-red-200"
      case "moderate":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "minor":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      default:
        return "bg-green-50 text-green-700 border-green-200"
    }
  }

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <XCircle className="h-6 w-6 text-red-600" />
      case "high":
        return <AlertTriangle className="h-6 w-6 text-red-500" />
      case "moderate":
        return <AlertCircle className="h-6 w-6 text-orange-500" />
      default:
        return <CheckCircle className="h-6 w-6 text-green-500" />
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "border-red-500 bg-red-50"
      case "high":
        return "border-red-400 bg-red-50"
      case "moderate":
        return "border-orange-400 bg-orange-50"
      default:
        return "border-green-400 bg-green-50"
    }
  }

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700">Checking drug interactions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (interactions.length === 0 && riskLevel === "low") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-green-700 font-medium">No Drug Interactions Detected</p>
              <p className="text-green-600 text-sm">Safe to administer with current medications</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={`border-2 ${getRiskLevelColor(riskLevel)}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              {getRiskLevelIcon(riskLevel)}
              <span>Drug Interaction Alert</span>
              <Badge className={getSeverityColor(riskLevel)}>{riskLevel.toUpperCase()} RISK</Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {requiresPharmacistReview && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Pharmacist Review Required
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {processingTime}ms
              </Badge>
            </div>
          </div>
          <CardDescription>
            {interactions.length} interaction{interactions.length !== 1 ? "s" : ""} found between{" "}
            <strong>{newMedication.name}</strong> and current medications
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Interactions Found
              </h4>
              <div className="space-y-1">
                {interactions.map((interaction, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getSeverityColor(
                      interaction.severity,
                    )}`}
                    onClick={() => {
                      setSelectedInteraction(interaction)
                      setShowDetails(true)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(interaction.severity)}
                        <span className="font-medium text-sm">
                          {interaction.drug1} + {interaction.drug2}
                        </span>
                      </div>
                      <Badge className={getSeverityColor(interaction.severity)}>{interaction.severity}</Badge>
                    </div>
                    <p className="text-xs mt-1 opacity-80">{interaction.clinicalEffect}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Immediate Actions
              </h4>
              <div className="space-y-2">
                {recommendations.slice(0, 4).map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
                {recommendations.length > 4 && (
                  <Button variant="outline" size="sm" onClick={() => setShowDetails(true)} className="w-full mt-2">
                    View All Recommendations ({recommendations.length})
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button onClick={() => setShowDetails(true)} variant="outline" size="sm" className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button onClick={checkInteractions} variant="outline" size="sm" disabled={isLoading}>
              <Activity className="h-4 w-4 mr-2" />
              Recheck
            </Button>
            {requiresPharmacistReview && (
              <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Shield className="h-4 w-4 mr-2" />
                Contact Pharmacist
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Interaction Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Drug Interaction Analysis</span>
            </DialogTitle>
            <DialogDescription>
              Detailed analysis of {interactions.length} drug interaction{interactions.length !== 1 ? "s" : ""} for{" "}
              {newMedication.name}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="interactions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>

            <TabsContent value="interactions" className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                {interactions.map((interaction, index) => (
                  <Card key={index} className={`mb-4 border ${getSeverityColor(interaction.severity)}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          {getSeverityIcon(interaction.severity)}
                          <span>
                            {interaction.drug1} + {interaction.drug2}
                          </span>
                        </CardTitle>
                        <Badge className={getSeverityColor(interaction.severity)}>
                          {interaction.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Clinical Effect</h4>
                        <p className="text-sm">{interaction.clinicalEffect}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">Mechanism</h4>
                        <p className="text-sm">{interaction.mechanism}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">Management</h4>
                        <p className="text-sm">{interaction.management}</p>
                      </div>
                      {interaction.riskFactors && interaction.riskFactors.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Risk Factors</h4>
                          <div className="flex flex-wrap gap-1">
                            {interaction.riskFactors.map((factor, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {interactions.map((interaction, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {interaction.drug1} + {interaction.drug2}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {interaction.monitoring && interaction.monitoring.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center">
                              <Eye className="h-4 w-4 mr-2" />
                              Required Monitoring
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {interaction.monitoring.map((monitor, idx) => (
                                <div key={idx} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                                  <Heart className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm">{monitor}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            {requiresPharmacistReview && (
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Shield className="h-4 w-4 mr-2" />
                Contact Pharmacist
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
