"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Send, Copy, CheckCircle, Mail, Users, LinkIcon, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function InviteSystem() {
  const [linkCopied, setLinkCopied] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("general")
  const [invitesSent, setInvitesSent] = useState(0)

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

  const [inviteHistory, setInviteHistory] = useState<any[]>([])

  // In a real app, you would load invitation history from an API
  // useEffect(() => {
  //   const loadInviteHistory = async () => {
  //     try {
  //       const response = await fetch('/api/invitations/history')
  //       const data = await response.json()
  //       setInviteHistory(data.history || [])
  //     } catch (error) {
  //       console.error('Failed to load invite history:', error)
  //     }
  //   }
  //   loadInviteHistory()
  // }, [])

  const copyApplicationLink = () => {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/application`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const sendInvite = () => {
    // In a real app, this would send the email
    setInvitesSent(invitesSent + 1)
    console.log("Invite sent!")
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
                      <Input id="candidate-name" placeholder="Enter full name" />
                    </div>
                    <div>
                      <Label htmlFor="candidate-email">Email Address</Label>
                      <Input id="candidate-email" type="email" placeholder="candidate@email.com" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="position">Target Position</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rn">Registered Nurse (RN)</SelectItem>
                        <SelectItem value="pt">Physical Therapist (PT)</SelectItem>
                        <SelectItem value="ot">Occupational Therapist (OT)</SelectItem>
                        <SelectItem value="hha">Home Health Aide (HHA)</SelectItem>
                        <SelectItem value="msw">Master of Social Work (MSW)</SelectItem>
                        <SelectItem value="st">Speech Therapist (ST)</SelectItem>
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
                        <SelectItem value="general">General Healthcare Positions</SelectItem>
                        <SelectItem value="rn">Registered Nurse Specific</SelectItem>
                        <SelectItem value="pt">Physical Therapist Specific</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="personal-message">Personal Message (Optional)</Label>
                    <Textarea id="personal-message" placeholder="Add a personal note to the candidate..." rows={3} />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="schedule-send" />
                    <Label htmlFor="schedule-send">Schedule for later</Label>
                  </div>

                  <Button onClick={sendInvite} className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
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
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: email@domain.com, Name (optional)</p>
                  </div>

                  <div>
                    <Label htmlFor="bulk-template">Email Template</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Healthcare Positions</SelectItem>
                        <SelectItem value="rn">Registered Nurse Specific</SelectItem>
                        <SelectItem value="pt">Physical Therapist Specific</SelectItem>
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

                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send Bulk Invitations
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
                        <SelectItem value="general">General Healthcare Positions</SelectItem>
                        <SelectItem value="rn">Registered Nurse Specific</SelectItem>
                        <SelectItem value="pt">Physical Therapist Specific</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="email-subject">Subject Line</Label>
                    <Input
                      id="email-subject"
                      value={emailTemplates[selectedTemplate as keyof typeof emailTemplates].subject}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label htmlFor="email-body">Email Body</Label>
                    <Textarea
                      id="email-body"
                      value={emailTemplates[selectedTemplate as keyof typeof emailTemplates].body}
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
                  {inviteHistory.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Mail className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium">{invite.recipient}</p>
                          <p className="text-sm text-gray-600">
                            {invite.position} • Sent: {invite.sentDate}
                          </p>
                          <p className="text-xs text-gray-500">Template: {invite.template}</p>
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Send className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">127</p>
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
                      <p className="text-2xl font-bold">89</p>
                      <p className="text-gray-600 text-sm">Emails Opened</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">34</p>
                      <p className="text-gray-600 text-sm">Applications Started</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">27%</p>
                      <p className="text-gray-600 text-sm">Conversion Rate</p>
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
                  {[
                    { template: "General Healthcare", sent: 45, opened: 32, applied: 12, rate: "27%" },
                    { template: "RN Specific", sent: 38, opened: 29, applied: 15, rate: "39%" },
                    { template: "PT Specific", sent: 28, opened: 21, applied: 8, rate: "29%" },
                  ].map((template) => (
                    <div key={template.template} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{template.template}</span>
                        <span className="text-sm text-gray-600">
                          {template.applied}/{template.sent} applied ({template.rate})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(template.applied / template.sent) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{template.sent} sent</span>
                        <span>{template.opened} opened</span>
                        <span>{template.applied} applied</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
