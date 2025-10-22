"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, TestTube, Key, Mail, Shield } from "lucide-react"
import Link from "next/link"

export default function SignatureSettings() {
  const [settings, setSettings] = useState({
    provider: "docusign",
    apiKey: "",
    webhookUrl: "",
    defaultExpiry: "30",
    autoReminders: true,
    reminderFrequency: "3",
    requireAuthentication: true,
    allowDecline: true,
    emailTemplate: "",
  })

  const handleSave = () => {
    // Save settings to backend
    console.log("Saving signature settings:", settings)
  }

  const testConnection = () => {
    // Test API connection
    console.log("Testing connection with provider:", settings.provider)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/signatures">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Signatures
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Signature Settings</h1>
              <p className="text-gray-600">Configure digital signature integration and preferences</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="provider" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="provider">Provider Settings</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="provider" className="space-y-6">
            {/* Provider Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  Signature Provider
                </CardTitle>
                <CardDescription>Configure your digital signature service provider</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="provider">Signature Provider</Label>
                  <Select
                    value={settings.provider}
                    onValueChange={(value) => setSettings({ ...settings, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="docusign">DocuSign</SelectItem>
                      <SelectItem value="adobe">Adobe Sign</SelectItem>
                      <SelectItem value="hellosign">HelloSign</SelectItem>
                      <SelectItem value="pandadoc">PandaDoc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    placeholder="Enter your API key"
                  />
                </div>

                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                    placeholder="https://your-domain.com/api/webhooks/signatures"
                  />
                </div>

                <div className="flex space-x-3">
                  <Button onClick={testConnection} variant="outline">
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Default Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Default Settings</CardTitle>
                <CardDescription>Configure default values for new signature requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="default-expiry">Default Expiry (days)</Label>
                  <Select
                    value={settings.defaultExpiry}
                    onValueChange={(value) => setSettings({ ...settings, defaultExpiry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-decline">Allow Recipients to Decline</Label>
                    <p className="text-sm text-gray-600">Recipients can decline to sign documents</p>
                  </div>
                  <Switch
                    id="allow-decline"
                    checked={settings.allowDecline}
                    onCheckedChange={(checked) => setSettings({ ...settings, allowDecline: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email Notifications
                </CardTitle>
                <CardDescription>Configure automatic email notifications and reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-reminders">Automatic Reminders</Label>
                    <p className="text-sm text-gray-600">Send reminder emails to pending signers</p>
                  </div>
                  <Switch
                    id="auto-reminders"
                    checked={settings.autoReminders}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoReminders: checked })}
                  />
                </div>

                {settings.autoReminders && (
                  <div>
                    <Label htmlFor="reminder-frequency">Reminder Frequency</Label>
                    <Select
                      value={settings.reminderFrequency}
                      onValueChange={(value) => setSettings({ ...settings, reminderFrequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Daily</SelectItem>
                        <SelectItem value="3">Every 3 days</SelectItem>
                        <SelectItem value="7">Weekly</SelectItem>
                        <SelectItem value="14">Bi-weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="notification-email">Notification Email</Label>
                  <Input
                    id="notification-email"
                    type="email"
                    placeholder="hr@company.com"
                    defaultValue="hr@serenityrehab.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email address to receive completion notifications</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure security and authentication requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require-auth">Require Authentication</Label>
                    <p className="text-sm text-gray-600">Require signers to authenticate their identity</p>
                  </div>
                  <Switch
                    id="require-auth"
                    checked={settings.requireAuthentication}
                    onCheckedChange={(checked) => setSettings({ ...settings, requireAuthentication: checked })}
                  />
                </div>

                <div>
                  <Label htmlFor="auth-method">Authentication Method</Label>
                  <Select defaultValue="email">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Verification</SelectItem>
                      <SelectItem value="sms">SMS Verification</SelectItem>
                      <SelectItem value="phone">Phone Call Verification</SelectItem>
                      <SelectItem value="id">ID Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ip-restrictions">IP Address Restrictions</Label>
                  <Textarea id="ip-restrictions" placeholder="Enter IP addresses or ranges (one per line)" rows={3} />
                  <p className="text-xs text-gray-500 mt-1">Restrict signing to specific IP addresses (optional)</p>
                </div>

                <div>
                  <Label htmlFor="audit-trail">Audit Trail Settings</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="log-views" defaultChecked />
                      <Label htmlFor="log-views" className="text-sm">
                        Log document views
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="log-downloads" defaultChecked />
                      <Label htmlFor="log-downloads" className="text-sm">
                        Log document downloads
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="log-ip" defaultChecked />
                      <Label htmlFor="log-ip" className="text-sm">
                        Log IP addresses
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {/* Email Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>Customize email templates for signature requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-type">Template Type</Label>
                  <Select defaultValue="invitation">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invitation">Signature Invitation</SelectItem>
                      <SelectItem value="reminder">Reminder Email</SelectItem>
                      <SelectItem value="completion">Completion Notification</SelectItem>
                      <SelectItem value="declined">Declined Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="email-subject">Email Subject</Label>
                  <Input
                    id="email-subject"
                    defaultValue="Please sign: {{document_name}}"
                    placeholder="Enter email subject"
                  />
                </div>

                <div>
                  <Label htmlFor="email-body">Email Body</Label>
                  <Textarea
                    id="email-body"
                    rows={8}
                    defaultValue={`Hello {{recipient_name}},

You have been requested to sign the document "{{document_name}}".

Please click the link below to review and sign the document:
{{signing_link}}

This request will expire on {{expiry_date}}.

If you have any questions, please contact us at hr@serenityrehab.com.

Best regards,
Serenity Rehabilitation Center`}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Available Variables:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <code>{"{{recipient_name}}"}</code> - Recipient's name
                    </div>
                    <div>
                      <code>{"{{document_name}}"}</code> - Document title
                    </div>
                    <div>
                      <code>{"{{signing_link}}"}</code> - Signing URL
                    </div>
                    <div>
                      <code>{"{{expiry_date}}"}</code> - Expiration date
                    </div>
                    <div>
                      <code>{"{{sender_name}}"}</code> - Sender's name
                    </div>
                    <div>
                      <code>{"{{company_name}}"}</code> - Company name
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline">Preview</Button>
                  <Button>Save Template</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
