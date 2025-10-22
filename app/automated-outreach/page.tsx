"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Zap,
  Mail,
  MessageSquare,
  Phone,
  Target,
  Play,
  Pause,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Search,
  Download,
  MoreHorizontal,
  Send,
  Building,
  MapPin,
  DollarSign,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"

interface Campaign {
  id: string
  name: string
  type: "email" | "sms" | "phone" | "multi-channel"
  status: "draft" | "active" | "paused" | "completed"
  targetFacilities: number
  sent: number
  opened: number
  responded: number
  converted: number
  createdAt: string
  lastRun: string
  nextRun: string
  budget: number
  spent: number
  roi: number
}

interface Template {
  id: string
  name: string
  type: "email" | "sms" | "phone"
  subject?: string
  content: string
  variables: string[]
  performance: {
    sent: number
    opened: number
    responded: number
    converted: number
  }
}

interface Facility {
  id: string
  name: string
  type: "SNF" | "Hospital" | "Clinic" | "Rehab" | "LTAC"
  location: string
  contactName: string
  contactEmail: string
  contactPhone: string
  status: "new" | "contacted" | "interested" | "converted" | "not-interested"
  priority: "high" | "medium" | "low"
  lastContact: string
  notes: string
  referralVolume: number
  potentialValue: number
}

interface AutomationRule {
  id: string
  name: string
  trigger: string
  condition: string
  action: string
  delay: number
  isActive: boolean
  triggered: number
  successful: number
}

export default function AutomatedOutreachPage() {
  const [activeTab, setActiveTab] = useState("campaigns")
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "1",
      name: "SNF Onboarding Campaign",
      type: "multi-channel",
      status: "active",
      targetFacilities: 150,
      sent: 120,
      opened: 84,
      responded: 23,
      converted: 8,
      createdAt: "2024-01-15",
      lastRun: "2024-01-20",
      nextRun: "2024-01-21",
      budget: 5000,
      spent: 2340,
      roi: 340,
    },
    {
      id: "2",
      name: "Hospital Partnership Outreach",
      type: "email",
      status: "active",
      targetFacilities: 75,
      sent: 75,
      opened: 52,
      responded: 15,
      converted: 4,
      createdAt: "2024-01-10",
      lastRun: "2024-01-19",
      nextRun: "2024-01-22",
      budget: 3000,
      spent: 1200,
      roi: 180,
    },
    {
      id: "3",
      name: "Rehab Center Follow-up",
      type: "phone",
      status: "paused",
      targetFacilities: 45,
      sent: 30,
      opened: 0,
      responded: 12,
      converted: 3,
      createdAt: "2024-01-05",
      lastRun: "2024-01-18",
      nextRun: "",
      budget: 2000,
      spent: 800,
      roi: 95,
    },
  ])

  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "SNF Introduction Email",
      type: "email",
      subject: "Partnership Opportunity with {{facility_name}}",
      content:
        "Dear {{contact_name}},\n\nI hope this email finds you well. I'm reaching out to introduce our homecare services and explore potential partnership opportunities with {{facility_name}}...",
      variables: ["facility_name", "contact_name", "location"],
      performance: { sent: 245, opened: 172, responded: 45, converted: 12 },
    },
    {
      id: "2",
      name: "Follow-up SMS",
      type: "sms",
      content:
        "Hi {{contact_name}}, following up on our homecare partnership discussion. Quick 5-min call this week? Reply YES for scheduling. - {{sender_name}}",
      variables: ["contact_name", "sender_name"],
      performance: { sent: 89, opened: 89, responded: 23, converted: 7 },
    },
    {
      id: "3",
      name: "Phone Script - Initial Contact",
      type: "phone",
      content:
        "Hello, this is {{caller_name}} from {{company_name}}. I'm calling to discuss how our homecare services can support {{facility_name}}'s discharge planning...",
      variables: ["caller_name", "company_name", "facility_name"],
      performance: { sent: 156, opened: 0, responded: 67, converted: 18 },
    },
  ])

  const [facilities, setFacilities] = useState<Facility[]>([
    {
      id: "1",
      name: "Sunrise Manor SNF",
      type: "SNF",
      location: "Detroit, MI",
      contactName: "Sarah Johnson",
      contactEmail: "sarah.johnson@sunrisemanor.com",
      contactPhone: "(313) 555-0123",
      status: "interested",
      priority: "high",
      lastContact: "2024-01-19",
      notes: "Interested in wound care services. Follow up next week.",
      referralVolume: 12,
      potentialValue: 45000,
    },
    {
      id: "2",
      name: "Metro General Hospital",
      type: "Hospital",
      location: "Grand Rapids, MI",
      contactName: "Dr. Michael Chen",
      contactEmail: "m.chen@metrogeneral.org",
      contactPhone: "(616) 555-0456",
      status: "contacted",
      priority: "medium",
      lastContact: "2024-01-17",
      notes: "Requested more information about our PT services.",
      referralVolume: 8,
      potentialValue: 32000,
    },
    {
      id: "3",
      name: "Lakeside Rehabilitation Center",
      type: "Rehab",
      location: "Ann Arbor, MI",
      contactName: "Lisa Rodriguez",
      contactEmail: "l.rodriguez@lakesiderehab.com",
      contactPhone: "(734) 555-0789",
      status: "new",
      priority: "high",
      lastContact: "",
      notes: "",
      referralVolume: 0,
      potentialValue: 28000,
    },
  ])

  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: "1",
      name: "Auto Follow-up Email",
      trigger: "Email opened but no response",
      condition: "After 3 days",
      action: "Send follow-up email template",
      delay: 3,
      isActive: true,
      triggered: 45,
      successful: 12,
    },
    {
      id: "2",
      name: "Escalate to Phone",
      trigger: "Multiple emails sent, no response",
      condition: "After 2 email attempts",
      action: "Schedule phone call",
      delay: 7,
      isActive: true,
      triggered: 23,
      successful: 8,
    },
    {
      id: "3",
      name: "High-Value Alert",
      trigger: "High-priority facility shows interest",
      condition: "Immediate",
      action: "Notify sales team",
      delay: 0,
      isActive: true,
      triggered: 8,
      successful: 8,
    },
  ])

  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false)
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "interested":
        return "bg-green-100 text-green-800"
      case "contacted":
        return "bg-blue-100 text-blue-800"
      case "converted":
        return "bg-purple-100 text-purple-800"
      case "not-interested":
        return "bg-red-100 text-red-800"
      case "new":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "sms":
        return <MessageSquare className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      case "multi-channel":
        return <Zap className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  const calculateConversionRate = (converted: number, sent: number) => {
    return sent > 0 ? ((converted / sent) * 100).toFixed(1) : "0.0"
  }

  const calculateOpenRate = (opened: number, sent: number) => {
    return sent > 0 ? ((opened / sent) * 100).toFixed(1) : "0.0"
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || campaign.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const filteredFacilities = facilities.filter((facility) => {
    const matchesSearch =
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || facility.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              Automated Outreach
            </h1>
            <p className="text-gray-600 mt-2">Intelligent multi-channel campaigns to generate homecare referrals</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button size="sm" onClick={() => setIsCreateCampaignOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {campaigns.filter((c) => c.status === "active").length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Facilities</p>
                  <p className="text-2xl font-bold text-green-600">{facilities.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {calculateConversionRate(
                      campaigns.reduce((sum, c) => sum + c.converted, 0),
                      campaigns.reduce((sum, c) => sum + c.sent, 0),
                    )}
                    %
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total ROI</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${campaigns.reduce((sum, c) => sum + c.roi, 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle>Campaign Management</CardTitle>
                    <CardDescription>Create and manage multi-channel outreach campaigns</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search campaigns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>ROI</TableHead>
                        <TableHead>Next Run</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{campaign.name}</div>
                              <div className="text-sm text-gray-500">
                                {campaign.targetFacilities} facilities targeted
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(campaign.type)}
                              <span className="capitalize">{campaign.type.replace("-", " ")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>
                                  Sent: {campaign.sent}/{campaign.targetFacilities}
                                </span>
                                <span>{Math.round((campaign.sent / campaign.targetFacilities) * 100)}%</span>
                              </div>
                              <Progress value={(campaign.sent / campaign.targetFacilities) * 100} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div>Open: {calculateOpenRate(campaign.opened, campaign.sent)}%</div>
                              <div>Response: {calculateConversionRate(campaign.responded, campaign.sent)}%</div>
                              <div>Convert: {calculateConversionRate(campaign.converted, campaign.sent)}%</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-green-600">${campaign.roi.toLocaleString()}</div>
                              <div className="text-sm text-gray-500">${campaign.spent.toLocaleString()} spent</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {campaign.nextRun ? new Date(campaign.nextRun).toLocaleDateString() : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Campaign
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  {campaign.status === "active" ? (
                                    <>
                                      <Pause className="h-4 w-4 mr-2" />
                                      Pause Campaign
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4 mr-2" />
                                      Start Campaign
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Campaign
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle>Template Library</CardTitle>
                    <CardDescription>Manage email, SMS, and phone script templates</CardDescription>
                  </div>
                  <Button onClick={() => setIsCreateTemplateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(template.type)}
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Send className="h-4 w-4 mr-2" />
                                Test Send
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {template.subject && <div className="text-sm text-gray-600">Subject: {template.subject}</div>}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-sm text-gray-700 line-clamp-3">{template.content}</div>

                          <div className="flex flex-wrap gap-1">
                            {template.variables.map((variable) => (
                              <Badge key={variable} variant="outline" className="text-xs">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600">Sent</div>
                              <div className="font-medium">{template.performance.sent}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Opened</div>
                              <div className="font-medium">
                                {calculateOpenRate(template.performance.opened, template.performance.sent)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600">Responded</div>
                              <div className="font-medium">
                                {calculateConversionRate(template.performance.responded, template.performance.sent)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600">Converted</div>
                              <div className="font-medium">
                                {calculateConversionRate(template.performance.converted, template.performance.sent)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle>Target Facilities</CardTitle>
                    <CardDescription>Manage your outreach target database</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search facilities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="interested">Interested</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="not-interested">Not Interested</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Facility
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Facility</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Last Contact</TableHead>
                        <TableHead>Potential Value</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFacilities.map((facility) => (
                        <TableRow key={facility.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{facility.name}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {facility.location} • {facility.type}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{facility.contactName}</div>
                              <div className="text-sm text-gray-500">{facility.contactEmail}</div>
                              <div className="text-sm text-gray-500">{facility.contactPhone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(facility.status)}>
                              {facility.status.replace("-", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {facility.priority === "high" && <ArrowUp className="h-4 w-4 text-red-500" />}
                              {facility.priority === "medium" && <Minus className="h-4 w-4 text-yellow-500" />}
                              {facility.priority === "low" && <ArrowDown className="h-4 w-4 text-gray-500" />}
                              <span className="capitalize">{facility.priority}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {facility.lastContact ? new Date(facility.lastContact).toLocaleDateString() : "Never"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              ${facility.potentialValue.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Facility
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Campaign
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle>Automation Rules</CardTitle>
                    <CardDescription>Configure intelligent automation workflows</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {automationRules.map((rule) => (
                    <Card key={rule.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium">{rule.name}</h3>
                              <Switch checked={rule.isActive} />
                              <Badge variant={rule.isActive ? "default" : "secondary"}>
                                {rule.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>
                                <strong>Trigger:</strong> {rule.trigger}
                              </div>
                              <div>
                                <strong>Condition:</strong> {rule.condition}
                              </div>
                              <div>
                                <strong>Action:</strong> {rule.action}
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-sm">
                              <div className="text-gray-600">Triggered: {rule.triggered}</div>
                              <div className="text-gray-600">Successful: {rule.successful}</div>
                              <div className="font-medium text-green-600">
                                Success Rate:{" "}
                                {rule.triggered > 0 ? Math.round((rule.successful / rule.triggered) * 100) : 0}%
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Rule
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  View Analytics
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Rule
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Campaign Dialog */}
        <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>Set up a new automated outreach campaign to generate referrals</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input id="campaign-name" placeholder="Enter campaign name" />
                </div>
                <div>
                  <Label htmlFor="campaign-type">Campaign Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="sms">SMS Only</SelectItem>
                      <SelectItem value="phone">Phone Only</SelectItem>
                      <SelectItem value="multi-channel">Multi-Channel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="campaign-description">Description</Label>
                <Textarea id="campaign-description" placeholder="Describe your campaign goals" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-facilities">Target Facilities</Label>
                  <Input id="target-facilities" type="number" placeholder="Number of facilities" />
                </div>
                <div>
                  <Label htmlFor="campaign-budget">Budget</Label>
                  <Input id="campaign-budget" type="number" placeholder="Campaign budget" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateCampaignOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateCampaignOpen(false)}>Create Campaign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Template Dialog */}
        <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>Create a new email, SMS, or phone script template</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input id="template-name" placeholder="Enter template name" />
                </div>
                <div>
                  <Label htmlFor="template-type">Template Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="phone">Phone Script</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="template-subject">Subject Line (Email only)</Label>
                <Input id="template-subject" placeholder="Enter subject line" />
              </div>
              <div>
                <Label htmlFor="template-content">Content</Label>
                <Textarea
                  id="template-content"
                  placeholder="Enter your template content. Use {{variable_name}} for personalization."
                  rows={6}
                />
              </div>
              <div>
                <Label>Available Variables</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["facility_name", "contact_name", "location", "sender_name", "company_name"].map((variable) => (
                    <Badge key={variable} variant="outline" className="cursor-pointer">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateTemplateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateTemplateOpen(false)}>Create Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
