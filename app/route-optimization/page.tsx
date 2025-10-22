"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Navigation, Clock, DollarSign, TrendingUp, MapPin, Zap, BarChart3 } from "lucide-react"

export default function RouteOptimizationPage() {
  const [optimizing, setOptimizing] = useState(false)

  const routeData = [
    {
      staffId: "RN-2024-001",
      name: "Sarah Johnson",
      currentRoute: ["Patient A", "Patient B", "Patient C", "Patient D"],
      optimizedRoute: ["Patient A", "Patient C", "Patient B", "Patient D"],
      currentDistance: 28.5,
      optimizedDistance: 22.3,
      timeSaved: 15,
      costSaved: 4.15,
    },
    {
      staffId: "PT-2024-001",
      name: "Michael Chen",
      currentRoute: ["Patient E", "Patient F", "Patient G"],
      optimizedRoute: ["Patient F", "Patient E", "Patient G"],
      currentDistance: 15.2,
      optimizedDistance: 12.8,
      timeSaved: 8,
      costSaved: 1.61,
    },
  ]

  const handleOptimizeAll = async () => {
    setOptimizing(true)
    // Simulate optimization process
    setTimeout(() => setOptimizing(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Route Optimization</h1>
        <p className="text-gray-600">AI-powered route planning to minimize travel time and costs</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$5.76</div>
            <p className="text-xs text-muted-foreground">Per day across all routes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Savings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">23 min</div>
            <p className="text-xs text-muted-foreground">Total time saved daily</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distance Reduced</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">8.6 mi</div>
            <p className="text-xs text-muted-foreground">Less driving per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Gain</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">12%</div>
            <p className="text-xs text-muted-foreground">Average improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Route Optimization Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Route Analysis</CardTitle>
                  <CardDescription>Compare current vs optimized routes for each staff member</CardDescription>
                </div>
                <Button onClick={handleOptimizeAll} disabled={optimizing}>
                  <Zap className={`h-4 w-4 mr-2 ${optimizing ? "animate-spin" : ""}`} />
                  {optimizing ? "Optimizing..." : "Optimize All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Current Distance</TableHead>
                    <TableHead>Optimized Distance</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routeData.map((route) => (
                    <TableRow key={route.staffId}>
                      <TableCell>
                        <div className="font-medium">{route.name}</div>
                        <div className="text-sm text-muted-foreground">{route.staffId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{route.currentDistance} mi</div>
                        <div className="text-sm text-muted-foreground">Current route</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">{route.optimizedDistance} mi</div>
                        <div className="text-sm text-muted-foreground">Optimized route</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">${route.costSaved.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{route.timeSaved} min saved</div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Apply Route
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Optimization Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Prioritize time savings</span>
                <Badge variant="secondary">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Consider traffic patterns</span>
                <Badge variant="secondary">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Respect appointment windows</span>
                <Badge variant="secondary">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Minimize fuel costs</span>
                <Badge variant="outline">Disabled</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Routes optimized today</span>
                <span className="font-bold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total savings this week</span>
                <span className="font-bold text-green-600">$34.50</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average efficiency gain</span>
                <span className="font-bold text-blue-600">15%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CO2 reduction</span>
                <span className="font-bold text-green-600">12.3 lbs</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <MapPin className="h-4 w-4 mr-2" />
                Export Routes
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Clock className="h-4 w-4 mr-2" />
                Schedule Optimization
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
