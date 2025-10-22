"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Send, Copy, CheckCircle, Mail, Users, LinkIcon, MessageSquare, Loader2 } from "lucide-react"
import Link from "next/link"

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  template_type: string
  variables: string[]
}

interface Invitation {
  id: string
  recipient_name: string
  recipient_email: string
  position: string
  template_type: string
  subject: string
  status: string
  sent_at: string
  opened_at?: string
  clicked_at?: string
  applied_at?: string
}

export default function InviteSystem() {
  const [linkCopied, setLinkCopied] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("general")
  const [invitesSent, setInvitesSent] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [inviteHistory, setInviteHistory] = useState<Invitation[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  
  // Form states
  const [individualForm, setIndividualForm] = useState({
    candidateName: '',
    candidateEmail: '',
    position: '',
    personalMessage: '',
    scheduleLater: false
  })
  
  const [bulkForm, setBulkForm] = useState({
    emails: '',
    template: 'general',
    csvFile: null as File | null
  })

  const emailTemplates = {
    general: {
      subject: "Join Our Healthcare Team at Serenity Rehabilitation Center",
      body: `Dear [Name],

We hope this message finds you well. Serenity Rehabilitation Center is currently seeking dedicated healthcare professionals to join our compassionate team.

We believe your skills and experience would be a valuable addition to our organization. We invite you to apply for positions that match your expertise:

• Registered Nurse (RN)
• Physical Therapist (PT)
• Occupational Therapist (OT)
• Home Health Aide (HHA)
• Master of Social Work (MSW)
• Speech Therapist (ST)

To apply, please visit our online application portal: [APPLICATION_LINK]

What we offer:
✓ Competitive compensation
✓ Comprehensive benefits package
✓ Professional development opportunities
✓ Supportive work environment
✓ Flexible scheduling options

If you have any questions about our positions or the application process, please don't hesitate to contact our HR team.

We look forward to hearing from you!

Best regards,
Serenity Rehabilitation Center HR Team
673 Martin Luther King Jr Blvd N, Pontiac, MI 48342
Phone: (248) 555-0123`,
    },
    rn: {
      subject: "Registered Nurse Position - Serenity Rehabilitation Center",
      body: `Dear [Name],

We are excited to invite you to apply for a Registered Nurse position at Serenity Rehabilitation Center. Your nursing expertise and dedication to patient care make you an ideal candidate for our team.

Position Highlights:
• Home health and rehabilitation nursing
• Competitive salary: $28-35/hour
• Full benefits package including health, dental, and vision
• Continuing education support
• Flexible scheduling

Requirements:
• Current Michigan RN license
• Minimum 2 years clinical experience
• CPR certification
• Reliable transportation

Apply now: [APPLICATION_LINK]

We would love to discuss this opportunity with you further.

Sincerely,
Nursing Department
Serenity Rehabilitation Center`,
    },
    pt: {
      subject: "Physical Therapist Opportunity - Serenity Rehabilitation Center",
      body: `Dear [Name],

Serenity Rehabilitation Center is seeking a skilled Physical Therapist to join our rehabilitation team. We believe your expertise would greatly benefit our patients and organization.

Position Details:
• Home-based and clinic physical therapy
• Competitive salary: $35-42/hour
• Comprehensive benefits
• Professional development opportunities
• Collaborative team environment

Requirements:
• Michigan PT license
• DPT or equivalent degree
• Experience in home health preferred
• Strong communication skills

Start your application: [APPLICATION_LINK]

We look forward to welcoming you to our team!

Best regards,
Rehabilitation Services
Serenity Rehabilitation Center`,
    },
  }

  // Load data on component mount
  useEffect(() => {
    loadTemplates()
    loadInviteHistory()
    loadAnalytics()
  }, [])

  const loadTemplates = async () => {
    try {
      console.log('Loading templates...')
      const response = await fetch('/api/invitations/templates')
      const data = await response.json()
      console.log('Templates response:', data)
      if (data.success) {
        setTemplates(data.templates)
        console.log('Templates loaded:', data.templates)
      } else {
        console.error('Failed to load templates:', data.error)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const loadInviteHistory = async () => {
    setIsLoadingHistory(true)
    try {
      console.log('Loading invite history...')
      const response = await fetch('/api/invitations/history')
      const data = await response.json()
      console.log('History response:', data)
      if (data.success) {
        setInviteHistory(data.invitations || [])
        console.log('History loaded:', data.invitations?.length || 0, 'invitations')
      } else {
        console.error('Failed to load invite history:', data.error)
        setInviteHistory([])
      }
    } catch (error) {
      console.error('Failed to load invite history:', error)
      setInviteHistory([])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true)
    try {
      console.log('Loading analytics...')
      const response = await fetch('/api/invitations/analytics')
      const data = await response.json()
      console.log('Analytics response:', data)
      if (data.success) {
        setAnalytics(data)
        console.log('Analytics loaded:', data.metrics)
      } else {
        console.error('Failed to load analytics:', data.error)
        setAnalytics({
          metrics: {
            totalSent: 0,
            opened: 0,
            clicked: 0,
            applied: 0,
            openRate: 0,
            clickRate: 0,
            conversionRate: 0
          },
          templateMetrics: {},
          dailyMetrics: [],
          topPositions: [],
          period: '30 days'
        })
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setAnalytics({
        metrics: {
          totalSent: 0,
          opened: 0,
          clicked: 0,
          applied: 0,
          openRate: 0,
          clickRate: 0,
          conversionRate: 0
        },
        templateMetrics: {},
        dailyMetrics: [],
        topPositions: [],
        period: '30 days'
      })
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  const copyApplicationLink = () => {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/application`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const sendIndividualInvite = async () => {
    if (!individualForm.candidateName || !individualForm.candidateEmail || !individualForm.position) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: individualForm.candidateName,
          recipientEmail: individualForm.candidateEmail,
          position: individualForm.position,
          templateType: selectedTemplate,
          personalMessage: individualForm.personalMessage
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('Invitation sent successfully!')
    setInvitesSent(invitesSent + 1)
        setIndividualForm({
          candidateName: '',
          candidateEmail: '',
          position: '',
          personalMessage: '',
          scheduleLater: false
        })
        loadInviteHistory()
        loadAnalytics()
      } else {
        alert('Failed to send invitation: ' + data.error)
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      alert('Failed to send invitation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const sendBulkInvites = async () => {
    if (!bulkForm.emails.trim()) {
      alert('Please enter email addresses')
      return
    }

    console.log('Original input:', bulkForm.emails)

    // Parse email addresses - support both comma-separated and newline-separated
    let emailList: string[] = []
    
    // First, split by newlines
    const lines = bulkForm.emails.split('\n').filter(line => line.trim())
    console.log('Lines after newline split:', lines)
    
    // Then for each line, split by commas
    lines.forEach(line => {
      const emails = line.split(',').map(email => email.trim()).filter(email => email)
      console.log('Emails from line:', line, '->', emails)
      emailList.push(...emails)
    })
    
    // Remove duplicates and filter out invalid emails
    const uniqueEmails = [...new Set(emailList)].filter(email => {
      const trimmedEmail = email.trim()
      const isValid = trimmedEmail.includes('@') && 
             trimmedEmail.includes('.') && 
             trimmedEmail.length > 5 &&
             !trimmedEmail.includes(' ')
      console.log('Email validation:', trimmedEmail, '->', isValid)
      return isValid
    })
    
    console.log('Email list after splitting:', emailList)
    console.log('Unique emails after filtering:', uniqueEmails)
    
    const recipients = uniqueEmails.map(email => ({
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: email,
      position: 'Healthcare Professional'
    }))
    
    console.log('Parsed recipients:', recipients)
    console.log('Number of recipients:', recipients.length)

    if (recipients.length === 0) {
      alert('No valid email addresses found. Please check your input format.')
      return
    }

    setIsLoading(true)
    try {
      const requestBody = {
        recipients,
        templateType: bulkForm.template
      }
      
      console.log('Sending bulk request:', requestBody)
      
      const response = await fetch('/api/invitations/bulk-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      console.log('Bulk response:', data)
      
      if (data.success) {
        alert(`Bulk invitations sent! ${data.totalSent} sent successfully, ${data.errors.length} failed.`)
        setInvitesSent(invitesSent + data.totalSent)
        setBulkForm({
          emails: '',
          template: 'general',
          csvFile: null
        })
        loadInviteHistory()
        loadAnalytics()
      } else {
        alert('Failed to send bulk invitations: ' + data.error)
      }
    } catch (error) {
      console.error('Error sending bulk invitations:', error)
      alert('Failed to send bulk invitations. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-green-100 text-green-800"
      case "opened":
        return "bg-blue-100 text-blue-800"
      case "sent":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Candidate Invitation System</h1>
              <p className="text-gray-600">Send job application invitations to potential candidates</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="send">Send Invitations</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="history">Invitation History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Send Individual Invitation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Send Individual Invitation
                  </CardTitle>
                  <CardDescription>Send a personalized invitation to a specific candidate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="candidate-name">Candidate Name</Label>
                      <Input 
                        id="candidate-name" 
                        placeholder="Enter full name" 
                        value={individualForm.candidateName}
                        onChange={(e) => setIndividualForm({...individualForm, candidateName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="candidate-email">Email Address</Label>
                      <Input 
                        id="candidate-email" 
                        type="email" 
                        placeholder="candidate@email.com" 
                        value={individualForm.candidateEmail}
                        onChange={(e) => setIndividualForm({...individualForm, candidateEmail: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="position">Target Position</Label>
                    <Select value={individualForm.position} onValueChange={(value) => setIndividualForm({...individualForm, position: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Registered Nurse (RN)">Registered Nurse (RN)</SelectItem>
                        <SelectItem value="Physical Therapist (PT)">Physical Therapist (PT)</SelectItem>
                        <SelectItem value="Occupational Therapist (OT)">Occupational Therapist (OT)</SelectItem>
                        <SelectItem value="Home Health Aide (HHA)">Home Health Aide (HHA)</SelectItem>
                        <SelectItem value="Master of Social Work (MSW)">Master of Social Work (MSW)</SelectItem>
                        <SelectItem value="Speech Therapist (ST)">Speech Therapist (ST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="template-select">Email Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.length > 0 ? (
                          templates.map((template) => (
                            <SelectItem key={template.id} value={template.template_type}>
                              {template.name}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                        <SelectItem value="general">General Healthcare Positions</SelectItem>
                        <SelectItem value="rn">Registered Nurse Specific</SelectItem>
                        <SelectItem value="pt">Physical Therapist Specific</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="personal-message">Personal Message (Optional)</Label>
                    <Textarea 
                      id="personal-message" 
                      placeholder="Add a personal note to the candidate..." 
                      rows={3}
                      value={individualForm.personalMessage}
                      onChange={(e) => setIndividualForm({...individualForm, personalMessage: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="schedule-send" 
                      checked={individualForm.scheduleLater}
                      onCheckedChange={(checked) => setIndividualForm({...individualForm, scheduleLater: !!checked})}
                    />
                    <Label htmlFor="schedule-send">Schedule for later</Label>
                  </div>

                  <Button onClick={sendIndividualInvite} className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                    <Send className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </CardContent>
              </Card>

              {/* Bulk Invitations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Bulk Invitations
                  </CardTitle>
                  <CardDescription>Send invitations to multiple candidates at once</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bulk-emails">Email Addresses</Label>
                    <Textarea
                      id="bulk-emails"
                      placeholder="Enter email addresses separated by commas or new lines..."
                      rows={6}
                      value={bulkForm.emails}
                      onChange={(e) => setBulkForm({...bulkForm, emails: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: email1@domain.com, email2@domain.com, email3@domain.com<br/>
                      Or one per line: email1@domain.com<br/>email2@domain.com
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bulk-template">Email Template</Label>
                    <Select value={bulkForm.template} onValueChange={(value) => setBulkForm({...bulkForm, template: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.length > 0 ? (
                          templates.map((template) => (
                            <SelectItem key={template.id} value={template.template_type}>
                              {template.name}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                        <SelectItem value="general">General Healthcare Positions</SelectItem>
                        <SelectItem value="rn">Registered Nurse Specific</SelectItem>
                        <SelectItem value="pt">Physical Therapist Specific</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Upload CSV File</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">Drag and drop a CSV file or click to browse</p>
                      <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                        Choose File
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">CSV format: Name, Email, Position (optional)</p>
                  </div>

                  <Button onClick={sendBulkInvites} className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                    <Send className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? 'Sending...' : 'Send Bulk Invitations'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Application Link Sharing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2" />
                  Share Application Link
                </CardTitle>
                <CardDescription>Direct link to the job application form</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="app-link">Application Link</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="app-link"
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/application`}
                      readOnly
                      className="flex-1"
                    />
                    <Button onClick={copyApplicationLink} variant="outline">
                      {linkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {linkCopied && <p className="text-sm text-green-600 mt-1">Link copied to clipboard!</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="flex items-center justify-center bg-transparent">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Share via SMS
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center bg-transparent">
                    <Mail className="h-4 w-4 mr-2" />
                    Share via Email
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center bg-transparent">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Social Media
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {/* Email Templates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>Manage and customize invitation email templates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="template-selector">Select Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.length > 0 ? (
                          templates.map((template) => (
                            <SelectItem key={template.id} value={template.template_type}>
                              {template.name}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                        <SelectItem value="general">General Healthcare Positions</SelectItem>
                        <SelectItem value="rn">Registered Nurse Specific</SelectItem>
                        <SelectItem value="pt">Physical Therapist Specific</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="email-subject">Subject Line</Label>
                    <Input
                      id="email-subject"
                      value={templates.find(t => t.template_type === selectedTemplate)?.subject || ''}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label htmlFor="email-body">Email Body</Label>
                    <Textarea
                      id="email-body"
                      value={templates.find(t => t.template_type === selectedTemplate)?.body || ''}
                      rows={15}
                      readOnly
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline">Edit Template</Button>
                    <Button variant="outline">Create New</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Template Variables</CardTitle>
                  <CardDescription>Available variables for personalization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { variable: "[Name]", description: "Candidate's full name" },
                      { variable: "[First_Name]", description: "Candidate's first name" },
                      { variable: "[Position]", description: "Target position" },
                      { variable: "[APPLICATION_LINK]", description: "Direct link to application form" },
                      { variable: "[Company_Name]", description: "Serenity Rehabilitation Center" },
                      { variable: "[Contact_Phone]", description: "HR contact phone number" },
                      { variable: "[Contact_Email]", description: "HR contact email" },
                      { variable: "[Date]", description: "Current date" },
                    ].map((item) => (
                      <div key={item.variable} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <code className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">{item.variable}</code>
                        <span className="text-sm text-gray-600">{item.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Invitation History */}
            <Card>
              <CardHeader>
                <CardTitle>Invitation History</CardTitle>
                <CardDescription>Track all sent invitations and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingHistory ? (
                    <div className="text-center py-8 text-gray-500">
                      <Loader2 className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-spin" />
                      <p>Loading invitation history...</p>
                    </div>
                  ) : inviteHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No invitations sent yet</p>
                      <p className="text-sm">Start by sending your first invitation!</p>
                    </div>
                  ) : (
                    inviteHistory.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Mail className="h-8 w-8 text-gray-400" />
                        <div>
                            <p className="font-medium">{invite.recipient_name}</p>
                          <p className="text-sm text-gray-600">
                              {invite.position} • Sent: {new Date(invite.sent_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">Template: {invite.template_type}</p>
                            {invite.opened_at && (
                              <p className="text-xs text-green-600">Opened: {new Date(invite.opened_at).toLocaleDateString()}</p>
                            )}
                            {invite.applied_at && (
                              <p className="text-xs text-blue-600">Applied: {new Date(invite.applied_at).toLocaleDateString()}</p>
                            )}
                          </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(invite.status)}>
                          {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Resend
                        </Button>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Dashboard */}
            {isLoadingAnalytics ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="h-12 w-12 mx-auto mb-4 text-gray-300 animate-spin" />
                <p>Loading analytics...</p>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Send className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{analytics?.totalSent || 0}</p>
                      <p className="text-gray-600 text-sm">Invitations Sent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Mail className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{analytics?.opened || 0}</p>
                      <p className="text-gray-600 text-sm">Emails Opened</p>
                      <p className="text-xs text-gray-500">{analytics?.openRate || 0}% open rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{analytics?.clicked || 0}</p>
                      <p className="text-gray-600 text-sm">Links Clicked</p>
                      <p className="text-xs text-gray-500">{analytics?.clickRate || 0}% click rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{analytics?.conversionRate || 0}%</p>
                      <p className="text-gray-600 text-sm">Conversion Rate</p>
                      <p className="text-xs text-gray-500">{analytics?.applied || 0} applications</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance by Template */}
            <Card>
              <CardHeader>
                <CardTitle>Template Performance</CardTitle>
                <CardDescription>Compare the effectiveness of different email templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.templateMetrics ? (
                    Object.entries(analytics.templateMetrics).map(([templateType, metrics]: [string, any]) => (
                      <div key={templateType} className="space-y-2">
                      <div className="flex justify-between items-center">
                          <span className="font-medium">{templateType.charAt(0).toUpperCase() + templateType.slice(1)}</span>
                        <span className="text-sm text-gray-600">
                            {metrics.applied}/{metrics.sent} applied ({metrics.conversionRate.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${metrics.conversionRate}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                          <span>{metrics.sent} sent</span>
                          <span>{metrics.opened} opened ({metrics.openRate.toFixed(1)}%)</span>
                          <span>{metrics.applied} applied</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No template data available yet</p>
                      <p className="text-sm">Send some invitations to see performance metrics</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
