"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function QuickBooksSetupPage() {
  const [config, setConfig] = useState({
    clientId: "",
    clientSecret: "",
    realmId: "",
    syncPayroll: true,
    syncInvoices: false,
    syncExpenses: true,
  })
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleTestConnection = async () => {
    setStatus("testing")
    setMessage("")
    // In a real app, you would make an API call to your backend
    // await fetch('/api/integrations/quickbooks/test-connection', { ... })
    setTimeout(() => {
      if (config.clientId && config.clientSecret && config.realmId) {
        setStatus("success")
        setMessage("Connection successful! QuickBooks is now connected.")
      } else {
        setStatus("error")
        setMessage("Connection failed. Please check your credentials and try again.")
      }
    }, 2000)
  }

  const handleSaveChanges = async () => {
    setStatus("testing")
    setMessage("")
    // In a real app, you would make an API call to your backend
    // await fetch('/api/integrations/quickbooks/configure', { ... })
    setTimeout(() => {
      setStatus("success")
      setMessage("Configuration saved successfully.")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/integrations" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Integrations
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">QuickBooks Integration Setup</h1>
          <p className="text-gray-600 mt-1">Connect your QuickBooks account to automate payroll and accounting.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>API Credentials</CardTitle>
              <CardDescription>
                Enter your QuickBooks App API credentials. You can find these in your QuickBooks Developer dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="realmId">Company ID (Realm ID)</Label>
                <Input
                  id="realmId"
                  value={config.realmId}
                  onChange={(e) => setConfig({ ...config, realmId: e.target.value })}
                  placeholder="e.g., 46208163650000000"
                />
              </div>
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  type="password"
                  value={config.clientId}
                  onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                  placeholder="Enter your Client ID"
                />
              </div>
              <div>
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={config.clientSecret}
                  onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                  placeholder="Enter your Client Secret"
                />
              </div>
              <Button onClick={handleTestConnection} disabled={status === "testing"}>
                {status === "testing" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Connection
              </Button>
            </CardContent>
          </Card>

          {status !== "idle" && message && (
            <Alert variant={status === "success" ? "default" : "destructive"}>
              {status === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle>{status === "success" ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Data Synchronization Settings</CardTitle>
              <CardDescription>Choose which data you want to sync with QuickBooks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="sync-payroll" className="font-medium">
                    Sync Payroll Data
                  </Label>
                  <p className="text-sm text-gray-500">
                    Automatically sync weekly activity logs for payroll processing.
                  </p>
                </div>
                <Switch
                  id="sync-payroll"
                  checked={config.syncPayroll}
                  onCheckedChange={(checked) => setConfig({ ...config, syncPayroll: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="sync-invoices" className="font-medium">
                    Sync Invoices
                  </Label>
                  <p className="text-sm text-gray-500">Sync client invoices with QuickBooks.</p>
                </div>
                <Switch
                  id="sync-invoices"
                  checked={config.syncInvoices}
                  onCheckedChange={(checked) => setConfig({ ...config, syncInvoices: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="sync-expenses" className="font-medium">
                    Sync Expenses
                  </Label>
                  <p className="text-sm text-gray-500">Sync mileage and other expenses for reimbursement.</p>
                </div>
                <Switch
                  id="sync-expenses"
                  checked={config.syncExpenses}
                  onCheckedChange={(checked) => setConfig({ ...config, syncExpenses: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveChanges} disabled={status === "testing"}>
              {status === "testing" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
