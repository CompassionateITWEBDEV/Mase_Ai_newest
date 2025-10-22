"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, FileText, Loader2, Send } from "lucide-react"

type ActivityLog = {
  id: string
  employeeName: string
  employeeId: string
  weekEnding: string
  totalHours: number
  totalMiles: number
  status: "Submitted" | "Approved" | "Processed"
}

const mockLogs: ActivityLog[] = [
  {
    id: "log-001",
    employeeName: "Sarah Johnson",
    employeeId: "RN-2024-001",
    weekEnding: "2024-07-13",
    totalHours: 40,
    totalMiles: 125,
    status: "Approved",
  },
  {
    id: "log-002",
    employeeName: "Michael Chen",
    employeeId: "PT-2024-005",
    weekEnding: "2024-07-13",
    totalHours: 38.5,
    totalMiles: 88,
    status: "Submitted",
  },
  {
    id: "log-003",
    employeeName: "Emily Davis",
    employeeId: "OT-2024-002",
    weekEnding: "2024-07-13",
    totalHours: 42,
    totalMiles: 150,
    status: "Submitted",
  },
  {
    id: "log-004",
    employeeName: "Robert Wilson",
    employeeId: "HHA-2024-012",
    weekEnding: "2024-07-06",
    totalHours: 35,
    totalMiles: 210,
    status: "Processed",
  },
]

export default function PayrollPage() {
  const [payPeriodEnd, setPayPeriodEnd] = useState<Date | undefined>(new Date())
  const [logs, setLogs] = useState<ActivityLog[]>(mockLogs)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRunPayroll = async () => {
    setIsProcessing(true)
    // In a real app, you would fetch approved logs for the period
    // and send them to your backend to sync with QuickBooks.
    // await fetch('/api/integrations/quickbooks/sync-payroll', { ... })
    console.log("Running payroll for week ending:", payPeriodEnd?.toISOString().split("T")[0])
    setTimeout(() => {
      setLogs((prevLogs) => prevLogs.map((log) => (log.status === "Approved" ? { ...log, status: "Processed" } : log)))
      setIsProcessing(false)
      alert("Payroll successfully processed and synced with QuickBooks!")
    }, 3000)
  }

  const getStatusBadge = (status: ActivityLog["status"]) => {
    switch (status) {
      case "Submitted":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
      case "Approved":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
      case "Processed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <Send className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payroll Processing</h1>
          <p className="text-gray-600 mt-1">Review submitted activity logs and run payroll with QuickBooks.</p>
        </header>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Run Payroll</CardTitle>
            <CardDescription>Select a pay period and run payroll for all approved logs.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <Label htmlFor="payPeriodEnd">Pay Period End Date</Label>
              <DatePicker date={payPeriodEnd} setDate={setPayPeriodEnd} />
            </div>
            <Button onClick={handleRunPayroll} disabled={isProcessing} className="mt-4 sm:mt-6">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Run Payroll for Approved Logs"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submitted Activity Logs</CardTitle>
            <CardDescription>Review and approve logs before running payroll.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Week Ending</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Total Miles</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-medium">{log.employeeName}</div>
                      <div className="text-sm text-gray-500">{log.employeeId}</div>
                    </TableCell>
                    <TableCell>{log.weekEnding}</TableCell>
                    <TableCell className="text-right">{log.totalHours.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{log.totalMiles}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        {log.status === "Submitted" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              setLogs(logs.map((l) => (l.id === log.id ? { ...l, status: "Approved" } : l)))
                            }
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
