"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  Database,
  Mail,
  MessageSquare,
  DollarSign,
  Shield,
  Cloud,
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock,
  Stethoscope,
  FileText,
  CreditCard,
  Phone,
  Zap,
  Activity,
  Search,
  RefreshCw,
  ExternalLink,
  TestTube,
  Heart,
  UserCheck,
  FileCheck,
  Calculator,
  Video,
  Server,
} from "lucide-react"
import Link from "next/link"

interface Integration {
  id: string
  name: string
  description: string
  category: "healthcare" | "communication" | "financial" | "infrastructure"
  status: "active" | "inactive" | "error" | "pending"
  icon: any
  setupUrl?: string
  lastSync?: string
  uptime: number
  monthlyUsage: number
  features: string[]
  pricing?: string
  provider: string
  apiVersion?: string
  webhookUrl?: string
  testEndpoint?: string
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null)
  const { toast } = useToast()

  // Mock integrations data
  useEffect(() => {
    const mockIntegrations: Integration[] = [
      // Healthcare & Eligibility Platforms
      {
        id: "axxess",
        name: "Axxess",
        description:
          "Complete EMR integration for home health agencies with billing, scheduling, and clinical documentation",
        category: "healthcare",
        status: "active",
        icon: Database,
        setupUrl: "/integrations/axxess-setup",
        lastSync: "2024-01-11T10:30:00Z",
        uptime: 99.8,
        monthlyUsage: 15420,
        features: [
          "Patient Management",
          "Billing & Claims",
          "Clinical Documentation",
          "Scheduling",
          "Compliance Tracking",
        ],
        pricing: "$299/month",
        provider: "Axxess Technology Solutions",
        apiVersion: "v3.2",
        webhookUrl: "/api/webhooks/axxess",
        testEndpoint: "/api/integrations/axxess/test",
      },
      {
        id: "extendedcare",
        name: "ExtendedCare",
        description: "Comprehensive home health software with advanced clinical workflows and financial management",
        category: "healthcare",
        status: "active",
        icon: Heart,
        setupUrl: "/integrations/extendedcare-setup",
        lastSync: "2024-01-11T10:25:00Z",
        uptime: 99.5,
        monthlyUsage: 8750,
        features: ["Clinical Workflows", "Financial Management", "Quality Assurance", "Regulatory Compliance"],
        pricing: "$199/month",
        provider: "ExtendedCare",
        apiVersion: "v2.1",
        testEndpoint: "/api/integrations/extendedcare/test",
      },
      {
        id: "change-healthcare",
        name: "Change Healthcare",
        description:
          "Healthcare technology solutions for eligibility verification, claims processing, and revenue cycle management",
        category: "healthcare",
        status: "active",
        icon: Stethoscope,
        setupUrl: "/integrations/change-healthcare-setup",
        lastSync: "2024-01-11T10:20:00Z",
        uptime: 99.9,
        monthlyUsage: 12300,
        features: ["Eligibility Verification", "Claims Processing", "Prior Authorization", "Revenue Cycle Management"],
        pricing: "$0.50 per transaction",
        provider: "Change Healthcare",
        apiVersion: "v4.0",
        testEndpoint: "/api/integrations/change-healthcare/test",
      },
      {
        id: "availity",
        name: "Availity",
        description:
          "Real-time healthcare information network for eligibility, benefits verification, and claims status",
        category: "healthcare",
        status: "active",
        icon: UserCheck,
        setupUrl: "/integrations/availity-setup",
        lastSync: "2024-01-11T10:15:00Z",
        uptime: 99.7,
        monthlyUsage: 9850,
        features: ["Eligibility Verification", "Benefits Verification", "Claims Status", "Prior Authorization"],
        pricing: "$0.35 per transaction",
        provider: "Availity",
        apiVersion: "v3.1",
        testEndpoint: "/api/integrations/availity/test",
      },
      {
        id: "caqh-proview",
        name: "CAQH ProView",
        description: "Provider credentialing and primary source verification for healthcare professionals",
        category: "healthcare",
        status: "active",
        icon: FileCheck,
        setupUrl: "/integrations/caqh-setup",
        lastSync: "2024-01-11T09:45:00Z",
        uptime: 98.9,
        monthlyUsage: 2340,
        features: [
          "Provider Credentialing",
          "Primary Source Verification",
          "License Monitoring",
          "Sanctions Screening",
        ],
        pricing: "$15 per provider/month",
        provider: "CAQH",
        apiVersion: "v2.0",
        testEndpoint: "/api/integrations/caqh/test",
      },
      {
        id: "sterling-check",
        name: "Sterling Check",
        description: "Background screening and verification services for healthcare staff and providers",
        category: "healthcare",
        status: "active",
        icon: Shield,
        setupUrl: "/integrations/sterling-setup",
        lastSync: "2024-01-11T09:30:00Z",
        uptime: 99.2,
        monthlyUsage: 1850,
        features: ["Background Checks", "Drug Screening", "License Verification", "Reference Checks"],
        pricing: "$25 per screening",
        provider: "Sterling Check",
        apiVersion: "v1.8",
        testEndpoint: "/api/integrations/sterling/test",
      },

      // Communication Platforms
      {
        id: "twilio",
        name: "Twilio",
        description: "Cloud communications platform for SMS, voice calls, and video conferencing",
        category: "communication",
        status: "active",
        icon: Phone,
        setupUrl: "/integrations/twilio-setup",
        lastSync: "2024-01-11T10:35:00Z",
        uptime: 99.9,
        monthlyUsage: 5420,
        features: ["SMS Messaging", "Voice Calls", "Video Conferencing", "WhatsApp Integration"],
        pricing: "$0.0075 per SMS",
        provider: "Twilio Inc.",
        apiVersion: "v2010-04-01",
        testEndpoint: "/api/integrations/twilio/test",
      },
      {
        id: "sendgrid",
        name: "SendGrid",
        description: "Email delivery service for transactional and marketing emails",
        category: "communication",
        status: "active",
        icon: Mail,
        setupUrl: "/integrations/sendgrid-setup",
        lastSync: "2024-01-11T10:32:00Z",
        uptime: 99.8,
        monthlyUsage: 12750,
        features: ["Transactional Email", "Marketing Campaigns", "Email Analytics", "Template Management"],
        pricing: "$14.95/month",
        provider: "SendGrid",
        apiVersion: "v3",
        testEndpoint: "/api/integrations/sendgrid/test",
      },
      {
        id: "vonage",
        name: "Vonage",
        description: "Business communications platform with voice, messaging, and video APIs",
        category: "communication",
        status: "inactive",
        icon: Video,
        setupUrl: "/integrations/vonage-setup",
        uptime: 99.5,
        monthlyUsage: 0,
        features: ["Voice API", "SMS API", "Video API", "Number Insight"],
        pricing: "$0.0040 per minute",
        provider: "Vonage",
        apiVersion: "v1.0",
        testEndpoint: "/api/integrations/vonage/test",
      },
      {
        id: "microsoft-teams",
        name: "Microsoft Teams",
        description: "Collaboration platform for chat, meetings, and file sharing",
        category: "communication",
        status: "pending",
        icon: MessageSquare,
        setupUrl: "/integrations/teams-setup",
        uptime: 99.7,
        monthlyUsage: 0,
        features: ["Team Chat", "Video Meetings", "File Sharing", "App Integration"],
        pricing: "$4/user/month",
        provider: "Microsoft",
        apiVersion: "v1.0",
        testEndpoint: "/api/integrations/teams/test",
      },

      // Financial & Billing Platforms
      {
        id: "stripe",
        name: "Stripe",
        description: "Payment processing platform for online and in-person transactions",
        category: "financial",
        status: "active",
        icon: CreditCard,
        setupUrl: "/integrations/stripe-setup",
        lastSync: "2024-01-11T10:40:00Z",
        uptime: 99.9,
        monthlyUsage: 3250,
        features: ["Payment Processing", "Subscription Billing", "Fraud Prevention", "Financial Reporting"],
        pricing: "2.9% + 30¢ per transaction",
        provider: "Stripe Inc.",
        apiVersion: "2023-10-16",
        testEndpoint: "/api/integrations/stripe/test",
      },
      {
        id: "quickbooks",
        name: "QuickBooks",
        description: "Accounting software for financial management and bookkeeping",
        category: "financial",
        status: "active",
        icon: Calculator,
        setupUrl: "/integrations/quickbooks-setup",
        lastSync: "2024-01-11T10:28:00Z",
        uptime: 99.6,
        monthlyUsage: 1850,
        features: ["Accounting", "Invoicing", "Expense Tracking", "Financial Reports"],
        pricing: "$30/month",
        provider: "Intuit",
        apiVersion: "v3",
        testEndpoint: "/api/integrations/quickbooks/test",
      },
      {
        id: "docusign",
        name: "DocuSign",
        description: "Electronic signature platform for secure document signing and workflow automation",
        category: "financial",
        status: "active",
        icon: FileText,
        setupUrl: "/integrations/docusign-setup",
        lastSync: "2024-01-11T10:22:00Z",
        uptime: 99.8,
        monthlyUsage: 890,
        features: ["Electronic Signatures", "Document Management", "Workflow Automation", "Compliance"],
        pricing: "$10/user/month",
        provider: "DocuSign",
        apiVersion: "v2.1",
        testEndpoint: "/api/integrations/docusign/test",
      },
      {
        id: "paypal",
        name: "PayPal",
        description: "Digital payment platform for online transactions and money transfers",
        category: "financial",
        status: "inactive",
        icon: DollarSign,
        setupUrl: "/integrations/paypal-setup",
        uptime: 99.4,
        monthlyUsage: 0,
        features: ["Payment Processing", "Money Transfers", "Invoicing", "Buyer Protection"],
        pricing: "2.9% + fixed fee",
        provider: "PayPal",
        apiVersion: "v2",
        testEndpoint: "/api/integrations/paypal/test",
      },

      // Infrastructure & Cloud Services
      {
        id: "supabase",
        name: "Supabase",
        description: "Open source Firebase alternative with PostgreSQL database and real-time subscriptions",
        category: "infrastructure",
        status: "active",
        icon: Database,
        setupUrl: "/integrations/supabase-setup",
        lastSync: "2024-01-11T10:45:00Z",
        uptime: 99.9,
        monthlyUsage: 25600,
        features: ["PostgreSQL Database", "Real-time Subscriptions", "Authentication", "Storage"],
        pricing: "$25/month",
        provider: "Supabase",
        apiVersion: "v1",
        testEndpoint: "/api/integrations/supabase/test",
      },
      {
        id: "vercel",
        name: "Vercel",
        description: "Cloud platform for static sites and serverless functions with global CDN",
        category: "infrastructure",
        status: "active",
        icon: Cloud,
        setupUrl: "/integrations/vercel-setup",
        lastSync: "2024-01-11T10:42:00Z",
        uptime: 99.9,
        monthlyUsage: 18750,
        features: ["Static Hosting", "Serverless Functions", "Global CDN", "Analytics"],
        pricing: "$20/month",
        provider: "Vercel Inc.",
        apiVersion: "v2",
        testEndpoint: "/api/integrations/vercel/test",
      },
      {
        id: "aws",
        name: "Amazon Web Services",
        description: "Comprehensive cloud computing platform with storage, compute, and networking services",
        category: "infrastructure",
        status: "active",
        icon: Server,
        setupUrl: "/integrations/aws-setup",
        lastSync: "2024-01-11T10:38:00Z",
        uptime: 99.8,
        monthlyUsage: 8950,
        features: ["Cloud Storage", "Compute Services", "Networking", "Machine Learning"],
        pricing: "Pay-as-you-go",
        provider: "Amazon",
        apiVersion: "2006-03-01",
        testEndpoint: "/api/integrations/aws/test",
      },
      {
        id: "cloudflare",
        name: "Cloudflare",
        description: "Web infrastructure and website security services with global CDN",
        category: "infrastructure",
        status: "active",
        icon: Shield,
        setupUrl: "/integrations/cloudflare-setup",
        lastSync: "2024-01-11T10:35:00Z",
        uptime: 99.9,
        monthlyUsage: 45200,
        features: ["CDN", "DDoS Protection", "SSL/TLS", "DNS Management"],
        pricing: "$20/month",
        provider: "Cloudflare Inc.",
        apiVersion: "v4",
        testEndpoint: "/api/integrations/cloudflare/test",
      },
    ]

    setIntegrations(mockIntegrations)
    setIsLoading(false)
  }, [])

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || integration.category === categoryFilter
    const matchesStatus = statusFilter === "all" || integration.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const toggleIntegration = async (integrationId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })

      if (response.ok) {
        setIntegrations((prev) =>
          prev.map((integration) =>
            integration.id === integrationId
              ? { ...integration, status: enabled ? "active" : "inactive" }
              : integration,
          ),
        )
        toast({
          title: enabled ? "Integration Enabled" : "Integration Disabled",
          description: `${integrations.find((i) => i.id === integrationId)?.name} has been ${enabled ? "enabled" : "disabled"}.`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update integration status.",
        variant: "destructive",
      })
    }
  }

  const testIntegration = async (integrationId: string) => {
    setTestingIntegration(integrationId)
    try {
      const integration = integrations.find((i) => i.id === integrationId)
      if (!integration?.testEndpoint) return

      const response = await fetch(integration.testEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Test Successful",
          description: `${integration.name} connection test passed.`,
        })
      } else {
        toast({
          title: "Test Failed",
          description: result.message || "Connection test failed.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to test integration connection.",
        variant: "destructive",
      })
    } finally {
      setTestingIntegration(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "inactive":
        return <Clock className="h-4 w-4 text-gray-600" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "healthcare":
        return <Stethoscope className="h-5 w-5" />
      case "communication":
        return <MessageSquare className="h-5 w-5" />
      case "financial":
        return <DollarSign className="h-5 w-5" />
      case "infrastructure":
        return <Server className="h-5 w-5" />
      default:
        return <Settings className="h-5 w-5" />
    }
  }

  const stats = {
    total: integrations.length,
    active: integrations.filter((i) => i.status === "active").length,
    inactive: integrations.filter((i) => i.status === "inactive").length,
    error: integrations.filter((i) => i.status === "error").length,
    healthcare: integrations.filter((i) => i.category === "healthcare").length,
    communication: integrations.filter((i) => i.category === "communication").length,
    financial: integrations.filter((i) => i.category === "financial").length,
    infrastructure: integrations.filter((i) => i.category === "infrastructure").length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Technology Integrations</h1>
              <p className="text-gray-600 mt-1">Manage your healthcare, communication, and business integrations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Activity className="h-3 w-3 mr-1" />
                {stats.active} Active
              </Badge>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Integrations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search integrations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="healthcare">Healthcare ({stats.healthcare})</option>
                  <option value="communication">Communication ({stats.communication})</option>
                  <option value="financial">Financial ({stats.financial})</option>
                  <option value="infrastructure">Infrastructure ({stats.infrastructure})</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="error">Error</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations by Category */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="healthcare">Healthcare ({stats.healthcare})</TabsTrigger>
            <TabsTrigger value="communication">Communication ({stats.communication})</TabsTrigger>
            <TabsTrigger value="financial">Financial ({stats.financial})</TabsTrigger>
            <TabsTrigger value="infrastructure">Infrastructure ({stats.infrastructure})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => (
                <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <integration.icon className="h-6 w-6 text-gray-700" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(integration.status)}>
                              {getStatusIcon(integration.status)}
                              <span className="ml-1 capitalize">{integration.status}</span>
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getCategoryIcon(integration.category)}
                              <span className="ml-1 capitalize">{integration.category}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={integration.status === "active"}
                        onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm leading-relaxed">{integration.description}</CardDescription>

                    {/* Integration Metrics */}
                    {integration.status === "active" && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Uptime</span>
                          <span className="text-sm font-medium">{integration.uptime}%</span>
                        </div>
                        <Progress value={integration.uptime} className="h-2" />

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Monthly Usage</span>
                            <p className="font-medium">{integration.monthlyUsage.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Pricing</span>
                            <p className="font-medium">{integration.pricing}</p>
                          </div>
                        </div>

                        {integration.lastSync && (
                          <div className="text-xs text-gray-500">
                            Last sync: {new Date(integration.lastSync).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Features */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Key Features</span>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {integration.features.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{integration.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {integration.setupUrl && (
                        <Link href={integration.setupUrl}>
                          <Button size="sm" className="flex-1">
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </Button>
                        </Link>
                      )}

                      {integration.testEndpoint && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testIntegration(integration.id)}
                          disabled={testingIntegration === integration.id}
                        >
                          {testingIntegration === integration.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                      )}

                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Category-specific tabs */}
          {["healthcare", "communication", "financial", "infrastructure"].map((category) => (
            <TabsContent key={category} value={category} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIntegrations
                  .filter((integration) => integration.category === category)
                  .map((integration) => (
                    <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <integration.icon className="h-6 w-6 text-gray-700" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{integration.name}</CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getStatusColor(integration.status)}>
                                  {getStatusIcon(integration.status)}
                                  <span className="ml-1 capitalize">{integration.status}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={integration.status === "active"}
                            onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <CardDescription className="text-sm leading-relaxed">{integration.description}</CardDescription>

                        {/* Integration Metrics */}
                        {integration.status === "active" && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Uptime</span>
                              <span className="text-sm font-medium">{integration.uptime}%</span>
                            </div>
                            <Progress value={integration.uptime} className="h-2" />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Monthly Usage</span>
                                <p className="font-medium">{integration.monthlyUsage.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Pricing</span>
                                <p className="font-medium">{integration.pricing}</p>
                              </div>
                            </div>

                            {integration.lastSync && (
                              <div className="text-xs text-gray-500">
                                Last sync: {new Date(integration.lastSync).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Features */}
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-gray-700">Key Features</span>
                          <div className="flex flex-wrap gap-1">
                            {integration.features.slice(0, 3).map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {integration.features.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{integration.features.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          {integration.setupUrl && (
                            <Link href={integration.setupUrl}>
                              <Button size="sm" className="flex-1">
                                <Settings className="h-4 w-4 mr-2" />
                                Configure
                              </Button>
                            </Link>
                          )}

                          {integration.testEndpoint && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testIntegration(integration.id)}
                              disabled={testingIntegration === integration.id}
                            >
                              {testingIntegration === integration.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </main>
    </div>
  )
}
