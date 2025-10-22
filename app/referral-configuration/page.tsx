"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Save, Plus, Trash2, Copy, AlertTriangle, CheckCircle } from "lucide-react"
import type { ReferralConfiguration } from "@/types/referral-config"

export default function ReferralConfigurationPage() {
  const [config, setConfig] = useState<ReferralConfiguration>({
    id: "default",
    name: "Default Configuration",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    geographic: {
      maxTravelDistance: 25,
      excludedZipCodes: [],
      preferredZipCodes: [],
      serviceAreas: [],
    },
    insurance: {
      acceptedTypes: {
        medicare: true,
        medicaid: true,
        commercial: true,
        managedCare: true,
        selfPay: false,
      },
      excludedProviders: [],
      requirePriorAuth: ["Aetna Better Health", "Molina Healthcare"],
      minimumCopay: 0,
      maximumCopay: 100,
    },
    clinical: {
      acceptedDiagnoses: [],
      excludedDiagnoses: ["hospice", "palliative", "experimental"],
      requiredServices: ["skilled_nursing"],
      excludedServices: ["ventilator_care"],
      maxEpisodeLength: 120,
      minEpisodeLength: 7,
      urgencyHandling: {
        routine: "accept",
        urgent: "accept",
        stat: "review",
      },
    },
    capacity: {
      maxDailyReferrals: 15,
      maxWeeklyReferrals: 75,
      nurseCaseloadLimit: 25,
      therapistCaseloadLimit: 30,
      weekendAcceptance: false,
      holidayAcceptance: false,
    },
    quality: {
      minimumHospitalRating: 3,
      preferredReferralSources: ["Memorial Hospital", "St. Mary's Medical Center"],
      excludedReferralSources: [],
      requirePhysicianOrders: true,
      requireInsuranceVerification: true,
    },
    notifications: {
      notifyMSWOnReject: true,
      notifyMSWOnReview: true,
      notifyMSWOnAccept: false,
      autoAssignIntake: true,
      escalationTimeHours: 4,
    },
    scoring: {
      geographicWeight: 0.2,
      insuranceWeight: 0.25,
      clinicalWeight: 0.3,
      capacityWeight: 0.15,
      qualityWeight: 0.1,
      minimumAcceptanceScore: 0.75,
    },
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [newZipCode, setNewZipCode] = useState("")
  const [newDiagnosis, setNewDiagnosis] = useState("")
  const [newProvider, setNewProvider] = useState("")

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/referral-configuration/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setSaveStatus("success")
        setTimeout(() => setSaveStatus("idle"), 3000)
      } else {
        setSaveStatus("error")
      }
    } catch (error) {
      setSaveStatus("error")
    } finally {
      setIsSaving(false)
    }
  }

  const addToList = (listPath: string, value: string) => {
    if (!value.trim()) return

    setConfig((prev) => {
      const newConfig = { ...prev }
      const pathParts = listPath.split(".")
      let current: any = newConfig

      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]]
      }

      const finalKey = pathParts[pathParts.length - 1]
      if (!current[finalKey].includes(value.trim())) {
        current[finalKey] = [...current[finalKey], value.trim()]
      }

      return newConfig
    })
  }

  const removeFromList = (listPath: string, value: string) => {
    setConfig((prev) => {
      const newConfig = { ...prev }
      const pathParts = listPath.split(".")
      let current: any = newConfig

      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]]
      }

      const finalKey = pathParts[pathParts.length - 1]
      current[finalKey] = current[finalKey].filter((item: string) => item !== value)

      return newConfig
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Referral Configuration</h1>
          <p className="text-muted-foreground">Configure AI decision rules for automated referral processing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      {saveStatus === "success" && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Configuration saved successfully!</AlertDescription>
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to save configuration. Please try again.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="geographic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
        </TabsList>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Rules</CardTitle>
              <CardDescription>Configure location-based acceptance criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDistance">Maximum Travel Distance (miles)</Label>
                  <Input
                    id="maxDistance"
                    type="number"
                    value={config.geographic.maxTravelDistance}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        geographic: { ...prev.geographic, maxTravelDistance: Number.parseInt(e.target.value) || 0 },
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Excluded Zip Codes</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter zip code to exclude"
                    value={newZipCode}
                    onChange={(e) => setNewZipCode(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      addToList("geographic.excludedZipCodes", newZipCode)
                      setNewZipCode("")
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.geographic.excludedZipCodes.map((zipCode) => (
                    <Badge key={zipCode} variant="secondary" className="flex items-center gap-1">
                      {zipCode}
                      <button
                        onClick={() => removeFromList("geographic.excludedZipCodes", zipCode)}
                        className="ml-1 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Rules</CardTitle>
              <CardDescription>Configure insurance acceptance criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Accepted Insurance Types</Label>
                {Object.entries(config.insurance.acceptedTypes).map(([type, accepted]) => (
                  <div key={type} className="flex items-center justify-between">
                    <Label htmlFor={type} className="capitalize">
                      {type.replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                    <Switch
                      id={type}
                      checked={accepted}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({
                          ...prev,
                          insurance: {
                            ...prev.insurance,
                            acceptedTypes: { ...prev.insurance.acceptedTypes, [type]: checked },
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minCopay">Minimum Copay ($)</Label>
                  <Input
                    id="minCopay"
                    type="number"
                    value={config.insurance.minimumCopay}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        insurance: { ...prev.insurance, minimumCopay: Number.parseInt(e.target.value) || 0 },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCopay">Maximum Copay ($)</Label>
                  <Input
                    id="maxCopay"
                    type="number"
                    value={config.insurance.maximumCopay}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        insurance: { ...prev.insurance, maximumCopay: Number.parseInt(e.target.value) || 0 },
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Providers Requiring Prior Auth</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter insurance provider name"
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      addToList("insurance.requirePriorAuth", newProvider)
                      setNewProvider("")
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.insurance.requirePriorAuth.map((provider) => (
                    <Badge key={provider} variant="secondary" className="flex items-center gap-1">
                      {provider}
                      <button
                        onClick={() => removeFromList("insurance.requirePriorAuth", provider)}
                        className="ml-1 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Rules</CardTitle>
              <CardDescription>Configure clinical acceptance criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minEpisode">Minimum Episode Length (days)</Label>
                  <Input
                    id="minEpisode"
                    type="number"
                    value={config.clinical.minEpisodeLength}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        clinical: { ...prev.clinical, minEpisodeLength: Number.parseInt(e.target.value) || 0 },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxEpisode">Maximum Episode Length (days)</Label>
                  <Input
                    id="maxEpisode"
                    type="number"
                    value={config.clinical.maxEpisodeLength}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        clinical: { ...prev.clinical, maxEpisodeLength: Number.parseInt(e.target.value) || 0 },
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Urgency Handling</Label>
                {Object.entries(config.clinical.urgencyHandling).map(([urgency, action]) => (
                  <div key={urgency} className="flex items-center justify-between">
                    <Label className="capitalize">{urgency} Referrals</Label>
                    <Select
                      value={action}
                      onValueChange={(value: "accept" | "review" | "reject") =>
                        setConfig((prev) => ({
                          ...prev,
                          clinical: {
                            ...prev.clinical,
                            urgencyHandling: { ...prev.clinical.urgencyHandling, [urgency]: value },
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accept">Accept</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="reject">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Excluded Diagnoses</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter diagnosis to exclude"
                    value={newDiagnosis}
                    onChange={(e) => setNewDiagnosis(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      addToList("clinical.excludedDiagnoses", newDiagnosis)
                      setNewDiagnosis("")
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.clinical.excludedDiagnoses.map((diagnosis) => (
                    <Badge key={diagnosis} variant="destructive" className="flex items-center gap-1">
                      {diagnosis}
                      <button
                        onClick={() => removeFromList("clinical.excludedDiagnoses", diagnosis)}
                        className="ml-1 hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capacity Rules</CardTitle>
              <CardDescription>Configure capacity and workload limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dailyMax">Max Daily Referrals</Label>
                  <Input
                    id="dailyMax"
                    type="number"
                    value={config.capacity.maxDailyReferrals}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        capacity: { ...prev.capacity, maxDailyReferrals: Number.parseInt(e.target.value) || 0 },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weeklyMax">Max Weekly Referrals</Label>
                  <Input
                    id="weeklyMax"
                    type="number"
                    value={config.capacity.maxWeeklyReferrals}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        capacity: { ...prev.capacity, maxWeeklyReferrals: Number.parseInt(e.target.value) || 0 },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nurseLimit">Nurse Caseload Limit</Label>
                  <Input
                    id="nurseLimit"
                    type="number"
                    value={config.capacity.nurseCaseloadLimit}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        capacity: { ...prev.capacity, nurseCaseloadLimit: Number.parseInt(e.target.value) || 0 },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="therapistLimit">Therapist Caseload Limit</Label>
                  <Input
                    id="therapistLimit"
                    type="number"
                    value={config.capacity.therapistCaseloadLimit}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        capacity: { ...prev.capacity, therapistCaseloadLimit: Number.parseInt(e.target.value) || 0 },
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekendAcceptance">Accept Weekend Referrals</Label>
                  <Switch
                    id="weekendAcceptance"
                    checked={config.capacity.weekendAcceptance}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({
                        ...prev,
                        capacity: { ...prev.capacity, weekendAcceptance: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="holidayAcceptance">Accept Holiday Referrals</Label>
                  <Switch
                    id="holidayAcceptance"
                    checked={config.capacity.holidayAcceptance}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({
                        ...prev,
                        capacity: { ...prev.capacity, holidayAcceptance: checked },
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Rules</CardTitle>
              <CardDescription>Configure quality and compliance requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalRating">Minimum Hospital Rating (1-5 stars)</Label>
                <Input
                  id="hospitalRating"
                  type="number"
                  min="1"
                  max="5"
                  value={config.quality.minimumHospitalRating}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      quality: { ...prev.quality, minimumHospitalRating: Number.parseInt(e.target.value) || 1 },
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireOrders">Require Physician Orders</Label>
                  <Switch
                    id="requireOrders"
                    checked={config.quality.requirePhysicianOrders}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({
                        ...prev,
                        quality: { ...prev.quality, requirePhysicianOrders: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireVerification">Require Insurance Verification</Label>
                  <Switch
                    id="requireVerification"
                    checked={config.quality.requireInsuranceVerification}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({
                        ...prev,
                        quality: { ...prev.quality, requireInsuranceVerification: checked },
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Rules</CardTitle>
              <CardDescription>Configure when and how to notify staff</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyReject">Notify MSW on Reject</Label>
                  <Switch
                    id="notifyReject"
                    checked={config.notifications.notifyMSWOnReject}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, notifyMSWOnReject: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyReview">Notify MSW on Review</Label>
                  <Switch
                    id="notifyReview"
                    checked={config.notifications.notifyMSWOnReview}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, notifyMSWOnReview: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyAccept">Notify MSW on Accept</Label>
                  <Switch
                    id="notifyAccept"
                    checked={config.notifications.notifyMSWOnAccept}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, notifyMSWOnAccept: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoAssign">Auto-assign Intake Coordinator</Label>
                  <Switch
                    id="autoAssign"
                    checked={config.notifications.autoAssignIntake}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, autoAssignIntake: checked },
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="escalationTime">Escalation Time (hours)</Label>
                <Input
                  id="escalationTime"
                  type="number"
                  value={config.notifications.escalationTimeHours}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        escalationTimeHours: Number.parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scoring Weights</CardTitle>
              <CardDescription>Configure how different factors are weighted in the decision</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Geographic Weight</Label>
                    <span className="text-sm text-muted-foreground">
                      {(config.scoring.geographicWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[config.scoring.geographicWeight]}
                    onValueChange={([value]) =>
                      setConfig((prev) => ({
                        ...prev,
                        scoring: { ...prev.scoring, geographicWeight: value },
                      }))
                    }
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Insurance Weight</Label>
                    <span className="text-sm text-muted-foreground">
                      {(config.scoring.insuranceWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[config.scoring.insuranceWeight]}
                    onValueChange={([value]) =>
                      setConfig((prev) => ({
                        ...prev,
                        scoring: { ...prev.scoring, insuranceWeight: value },
                      }))
                    }
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Clinical Weight</Label>
                    <span className="text-sm text-muted-foreground">
                      {(config.scoring.clinicalWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[config.scoring.clinicalWeight]}
                    onValueChange={([value]) =>
                      setConfig((prev) => ({
                        ...prev,
                        scoring: { ...prev.scoring, clinicalWeight: value },
                      }))
                    }
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Capacity Weight</Label>
                    <span className="text-sm text-muted-foreground">
                      {(config.scoring.capacityWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[config.scoring.capacityWeight]}
                    onValueChange={([value]) =>
                      setConfig((prev) => ({
                        ...prev,
                        scoring: { ...prev.scoring, capacityWeight: value },
                      }))
                    }
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Quality Weight</Label>
                    <span className="text-sm text-muted-foreground">
                      {(config.scoring.qualityWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[config.scoring.qualityWeight]}
                    onValueChange={([value]) =>
                      setConfig((prev) => ({
                        ...prev,
                        scoring: { ...prev.scoring, qualityWeight: value },
                      }))
                    }
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Minimum Acceptance Score</Label>
                  <span className="text-sm text-muted-foreground">
                    {(config.scoring.minimumAcceptanceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[config.scoring.minimumAcceptanceScore]}
                  onValueChange={([value]) =>
                    setConfig((prev) => ({
                      ...prev,
                      scoring: { ...prev.scoring, minimumAcceptanceScore: value },
                    }))
                  }
                  max={1}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Referrals scoring below this threshold will be rejected or flagged for review
                </p>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Total weight:{" "}
                  {(
                    (config.scoring.geographicWeight +
                      config.scoring.insuranceWeight +
                      config.scoring.clinicalWeight +
                      config.scoring.capacityWeight +
                      config.scoring.qualityWeight) *
                    100
                  ).toFixed(0)}
                  %
                  {config.scoring.geographicWeight +
                    config.scoring.insuranceWeight +
                    config.scoring.clinicalWeight +
                    config.scoring.capacityWeight +
                    config.scoring.qualityWeight !==
                    1 && " - Weights should total 100% for optimal scoring"}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
