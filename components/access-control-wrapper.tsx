"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, User, Lock, AlertTriangle, CheckCircle } from "lucide-react"

interface UserRole {
  id: string
  name: string
  permissions: string[]
  level: "admin" | "manager" | "staff" | "readonly"
  description: string
}

interface AccessLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  timestamp: string
  status: "allowed" | "denied"
  ipAddress: string
}

interface AccessControlWrapperProps {
  children: React.ReactNode
  requiredPermission?: string
  requiredRole?: string
  fallbackComponent?: React.ReactNode
}

export default function AccessControlWrapper({
  children,
  requiredPermission,
  requiredRole,
  fallbackComponent,
}: AccessControlWrapperProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserAccess()
    loadAccessLogs()
  }, [requiredPermission, requiredRole])

  const checkUserAccess = async () => {
    try {
      // Simulate user authentication check
      const user = {
        id: "user_123",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
        permissions: [
          "billing.read",
          "billing.write",
          "patients.read",
          "patients.write",
          "staff.read",
          "staff.write",
          "admin.access",
          "reports.generate",
        ],
      }

      setCurrentUser(user)

      // Check if user has required permission or role
      let accessGranted = true

      if (requiredPermission) {
        accessGranted = user.permissions.includes(requiredPermission)
      }

      if (requiredRole) {
        accessGranted = accessGranted && user.role === requiredRole
      }

      setHasAccess(accessGranted)

      // Log access attempt
      await logAccessAttempt(user.id, user.name, accessGranted)
    } catch (error) {
      console.error("Access check failed:", error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  const logAccessAttempt = async (userId: string, userName: string, allowed: boolean) => {
    const logEntry: AccessLog = {
      id: `log_${Date.now()}`,
      userId,
      userName,
      action: "page_access",
      resource: requiredPermission || requiredRole || "general",
      timestamp: new Date().toISOString(),
      status: allowed ? "allowed" : "denied",
      ipAddress: "192.168.1.100", // Simulated IP
    }

    setAccessLogs((prev) => [logEntry, ...prev.slice(0, 49)]) // Keep last 50 logs
  }

  const loadAccessLogs = async () => {
    // Simulate loading recent access logs
    const mockLogs: AccessLog[] = [
      {
        id: "log_1",
        userId: "user_123",
        userName: "John Doe",
        action: "billing_access",
        resource: "mobile-billing",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: "allowed",
        ipAddress: "192.168.1.100",
      },
      {
        id: "log_2",
        userId: "user_456",
        userName: "Jane Smith",
        action: "patient_access",
        resource: "patient-portal",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        status: "allowed",
        ipAddress: "192.168.1.101",
      },
      {
        id: "log_3",
        userId: "user_789",
        userName: "Bob Johnson",
        action: "admin_access",
        resource: "user-management",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: "denied",
        ipAddress: "192.168.1.102",
      },
    ]

    setAccessLogs(mockLogs)
  }

  const loadUserRoles = async () => {
    const roles: UserRole[] = [
      {
        id: "admin",
        name: "Administrator",
        level: "admin",
        permissions: ["*"],
        description: "Full system access",
      },
      {
        id: "manager",
        name: "Manager",
        level: "manager",
        permissions: [
          "billing.read",
          "billing.write",
          "patients.read",
          "patients.write",
          "staff.read",
          "reports.generate",
        ],
        description: "Management level access",
      },
      {
        id: "staff",
        name: "Staff Member",
        level: "staff",
        permissions: ["billing.read", "patients.read", "schedule.read", "schedule.write"],
        description: "Standard staff access",
      },
      {
        id: "readonly",
        name: "Read Only",
        level: "readonly",
        permissions: ["billing.read", "patients.read", "reports.read"],
        description: "View only access",
      },
    ]

    setUserRoles(roles)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <div className="text-lg font-medium">Checking Access...</div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this resource</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {requiredPermission && `Required permission: ${requiredPermission}`}
                {requiredRole && `Required role: ${requiredRole}`}
              </AlertDescription>
            </Alert>

            {currentUser && (
              <div className="text-sm text-gray-600">
                <div>Current user: {currentUser.name}</div>
                <div>Current role: {currentUser.role}</div>
              </div>
            )}

            {fallbackComponent || (
              <div className="text-center">
                <Button variant="outline" onClick={() => window.history.back()}>
                  Go Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {/* Access granted - show the protected content */}
      {children}

      {/* Optional: Show access control info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="w-80">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <CardTitle className="text-sm">Access Control</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs defaultValue="user" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="user">User</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="user" className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{currentUser?.name}</span>
                  </div>
                  <Badge variant="outline">{currentUser?.role}</Badge>
                  <div className="text-xs text-gray-500">{currentUser?.permissions.length} permissions</div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-2">
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {accessLogs.slice(0, 3).map((log) => (
                      <div key={log.id} className="flex items-center gap-2 text-xs">
                        {log.status === "allowed" ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="truncate">{log.action}</span>
                        <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
