"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Users, Building, Database, HardDrive, AlertTriangle, CheckCircle, Crown, Zap } from "lucide-react"

interface SubscriptionData {
  plan: string
  subscription_id: number
  period_end: string
  limits: {
    users: number
    facilities: number
    api_calls: number
    storage_gb: number
  }
  usage: {
    users: number
    facilities: number
    api_calls: number
    storage_gb: number
  }
  percentages: {
    users: number
    facilities: number
    api_calls: number
    storage_gb: number
  }
  warnings: string[]
  features: string[]
  billing: {
    amount: number
    period: string
    next_billing_date: string
  }
}

const PLAN_COLORS = {
  starter: "bg-blue-500",
  professional: "bg-purple-500",
  enterprise: "bg-gold-500",
}

const PLAN_ICONS = {
  starter: Users,
  professional: Crown,
  enterprise: Zap,
}

export default function SubscriptionManagement() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock user ID - in real app, get from auth context
  const userId = "550e8400-e29b-41d4-a716-446655440000"

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/subscription/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch subscription data")
      }

      const data = await response.json()
      setSubscriptionData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planName: string) => {
    try {
      setUpgrading(true)
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planName }),
      })

      if (!response.ok) {
        throw new Error("Failed to upgrade subscription")
      }

      const result = await response.json()
      if (result.success) {
        await fetchSubscriptionData() // Refresh data
        alert(`Successfully upgraded to ${planName} plan!`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upgrade failed")
    } finally {
      setUpgrading(false)
    }
  }

  const formatLimit = (value: number) => {
    return value === -1 ? "Unlimited" : value.toLocaleString()
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 80) return "text-yellow-600"
    return "text-green-600"
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!subscriptionData) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No subscription data found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const PlanIcon = PLAN_ICONS[subscriptionData.plan.toLowerCase() as keyof typeof PLAN_ICONS] || Users

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-gray-600 mt-2">Manage your plan and monitor usage</p>
        </div>
        <div className="flex items-center space-x-2">
          <PlanIcon className="h-6 w-6 text-blue-600" />
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {subscriptionData.plan} Plan
          </Badge>
        </div>
      </div>

      {subscriptionData.warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You're approaching limits for: {subscriptionData.warnings.join(", ")}. Consider upgrading your plan.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscriptionData.usage.users.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">of {formatLimit(subscriptionData.limits.users)}</p>
                <Progress value={subscriptionData.percentages.users} className="mt-2" />
                <p className={`text-xs mt-1 ${getUsageColor(subscriptionData.percentages.users)}`}>
                  {subscriptionData.percentages.users}% used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Facilities</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscriptionData.usage.facilities.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">of {formatLimit(subscriptionData.limits.facilities)}</p>
                <Progress value={subscriptionData.percentages.facilities} className="mt-2" />
                <p className={`text-xs mt-1 ${getUsageColor(subscriptionData.percentages.facilities)}`}>
                  {subscriptionData.percentages.facilities}% used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscriptionData.usage.api_calls.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">of {formatLimit(subscriptionData.limits.api_calls)}</p>
                <Progress value={subscriptionData.percentages.api_calls} className="mt-2" />
                <p className={`text-xs mt-1 ${getUsageColor(subscriptionData.percentages.api_calls)}`}>
                  {subscriptionData.percentages.api_calls}% used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscriptionData.usage.storage_gb} GB</div>
                <p className="text-xs text-muted-foreground">of {formatLimit(subscriptionData.limits.storage_gb)} GB</p>
                <Progress value={subscriptionData.percentages.storage_gb} className="mt-2" />
                <p className={`text-xs mt-1 ${getUsageColor(subscriptionData.percentages.storage_gb)}`}>
                  {subscriptionData.percentages.storage_gb}% used
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>Features included in your {subscriptionData.plan} plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {subscriptionData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Billing Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Plan</label>
                  <p className="text-lg font-semibold">{subscriptionData.plan}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Monthly Cost</label>
                  <p className="text-lg font-semibold">${subscriptionData.billing.amount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Next Billing Date</label>
                  <p className="text-lg font-semibold">
                    {new Date(subscriptionData.billing.next_billing_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Billing History</h3>
                <p className="text-sm text-gray-600">
                  Billing history and invoices would be displayed here in a production environment.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upgrade" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["Starter", "Professional", "Enterprise"].map((planName) => {
              const isCurrentPlan = planName.toLowerCase() === subscriptionData.plan.toLowerCase()
              const prices = { Starter: 99, Professional: 299, Enterprise: 799 }

              return (
                <Card key={planName} className={`relative ${isCurrentPlan ? "ring-2 ring-blue-500" : ""}`}>
                  {isCurrentPlan && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                      Current Plan
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {planName}
                      {planName === "Professional" && <Crown className="h-5 w-5 text-purple-500" />}
                      {planName === "Enterprise" && <Zap className="h-5 w-5 text-yellow-500" />}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold">${prices[planName as keyof typeof prices]}</span>
                      <span className="text-sm">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      disabled={isCurrentPlan || upgrading}
                      onClick={() => handleUpgrade(planName)}
                      variant={isCurrentPlan ? "secondary" : "default"}
                    >
                      {isCurrentPlan ? "Current Plan" : upgrading ? "Upgrading..." : `Upgrade to ${planName}`}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
