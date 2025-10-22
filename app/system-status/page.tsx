"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Database, Activity, RefreshCw, Server, Shield } from "lucide-react"
import { testDatabaseConnection, ensureTestData, type DatabaseTestResult } from "@/lib/database-test"

export default function SystemStatusPage() {
  const [testResult, setTestResult] = useState<DatabaseTestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastTest, setLastTest] = useState<Date | null>(null)

  const runTests = async () => {
    setIsLoading(true)
    try {
      // Ensure test data exists
      await ensureTestData()

      // Run connection tests
      const result = await testDatabaseConnection()
      setTestResult(result)
      setLastTest(new Date())
    } catch (error) {
      console.error("Test error:", error)
      setTestResult({
        connection: false,
        tables: [],
        sampleData: {},
        errors: [`Test failed: ${error}`],
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />
  }

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className={status ? "bg-green-100 text-green-800" : ""}>
        {status ? "Operational" : "Error"}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
              <p className="text-gray-600">MASE AI Healthcare Dashboard System Health</p>
            </div>
            <Button onClick={runTests} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Testing..." : "Run Tests"}
            </Button>
          </div>
          {lastTest && <p className="text-sm text-gray-500 mt-2">Last tested: {lastTest.toLocaleString()}</p>}
        </div>

        {/* Overall Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Overall System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              {testResult?.connection ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-lg font-semibold text-green-800">All Systems Operational</p>
                    <p className="text-sm text-gray-600">Database connected, all tables accessible</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-lg font-semibold text-red-800">System Issues Detected</p>
                    <p className="text-sm text-gray-600">Database connection or table access problems</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Component Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Database className="h-5 w-5 mr-2 text-blue-600" />
                Database Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {getStatusIcon(testResult?.connection || false)}
                {getStatusBadge(testResult?.connection || false)}
              </div>
              <p className="text-sm text-gray-600 mt-2">Supabase PostgreSQL connection status</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Server className="h-5 w-5 mr-2 text-green-600" />
                Tables Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {getStatusIcon((testResult?.tables.length || 0) >= 3)}
                {getStatusBadge((testResult?.tables.length || 0) >= 3)}
              </div>
              <p className="text-sm text-gray-600 mt-2">{testResult?.tables.length || 0} of 3 tables accessible</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Shield className="h-5 w-5 mr-2 text-purple-600" />
                Data Integrity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {getStatusIcon((testResult?.errors.length || 0) === 0)}
                {getStatusBadge((testResult?.errors.length || 0) === 0)}
              </div>
              <p className="text-sm text-gray-600 mt-2">{testResult?.errors.length || 0} errors detected</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        {testResult && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tables Status */}
            <Card>
              <CardHeader>
                <CardTitle>Database Tables</CardTitle>
                <CardDescription>Status of core database tables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["subscription_plans", "user_subscriptions", "dashboard_access"].map((table) => (
                    <div key={table} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(testResult.tables.includes(table))}
                        <span className="font-medium">{table}</span>
                      </div>
                      <div className="text-sm text-gray-600">{testResult.sampleData[table]?.length || 0} records</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Errors & Warnings */}
            <Card>
              <CardHeader>
                <CardTitle>System Messages</CardTitle>
                <CardDescription>Errors, warnings, and status messages</CardDescription>
              </CardHeader>
              <CardContent>
                {testResult.errors.length > 0 ? (
                  <div className="space-y-2">
                    {testResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>All systems are functioning normally. No errors detected.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sample Data Preview */}
        {testResult?.sampleData && Object.keys(testResult.sampleData).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Sample Data Preview</CardTitle>
              <CardDescription>Recent data from connected tables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(testResult.sampleData).map(([table, data]) => (
                  <div key={table}>
                    <h4 className="font-medium mb-2">{table}</h4>
                    <div className="bg-gray-50 p-3 rounded-lg overflow-x-auto">
                      <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
