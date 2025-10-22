"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Users, Calendar, AlertCircle, CheckCircle } from "lucide-react"

export default function OperationsPage() {
  const [syncStatus, setSyncStatus] = useState({
    axxess: { connected: true, lastSync: new Date() },
    billing: { connected: true, lastSync: new Date() },
    orders: { connected: true, lastSync: new Date() },
  })

  const [operationalData, setOperationalData] = useState({
    activeStaff: 89,
    scheduledVisits: 247,
    pendingOrders: 12,
    completedToday: 156,
  })

  useEffect(() => {
    const fetchOperationsData = async () => {
      try {
        const response = await fetch("/api/axxess/operations/sync")
        if (response.ok) {
          const data = await response.json()
          setOperationalData(data.operations)
          setSyncStatus(data.syncStatus)
        }
      } catch (error) {
        console.error("Failed to fetch operations data:", error)
      }
    }

    fetchOperationsData()
    const interval = setInterval(fetchOperationsData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Operations Management</h1>
        <div className="flex items-center gap-2">
          <Badge variant={syncStatus.axxess.connected ? "default" : "destructive"}>
            AxxessWeb {syncStatus.axxess.connected ? "Connected" : "Disconnected"}
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Now
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="orders">Order Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{operationalData.activeStaff}</div>
                <p className="text-xs text-muted-foreground">Currently on duty</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Visits</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{operationalData.scheduledVisits}</div>
                <p className="text-xs text-muted-foreground">Today's schedule</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{operationalData.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{operationalData.completedToday}</div>
                <p className="text-xs text-muted-foreground">Tasks finished</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>Manage staff schedules and assignments synced with AxxessWeb</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Staff management interface with real-time AxxessWeb synchronization</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling</CardTitle>
              <CardDescription>Patient visit scheduling and calendar management</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Scheduling interface with AxxessWeb calendar sync</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>Medical orders and supply management</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Order management with real-time AxxessWeb synchronization</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
