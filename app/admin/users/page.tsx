"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Settings,
  Search,
  UserCheck,
  UserX,
  Crown,
  AlertTriangle,
  Eye,
  Building2,
} from "lucide-react"
import { type User, type UserRole, type Permission, USER_ROLES } from "@/lib/auth"

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("users")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isConfigureRoleOpen, setIsConfigureRoleOpen] = useState(false)
  const [roleToConfig, setRoleToConfig] = useState<UserRole | null>(null)

  // Real users data from database
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  // Audit logs data from database
  interface AuditLog {
    id: string
    user_id: string | null
    action: string
    resource_type: string | null
    resource_id: string | null
    details: any
    ip_address: string | null
    timestamp: string
    staff?: {
      name: string
      email: string
    }
  }

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(true)

  // Load users from database on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/staff/list')
        const data = await response.json()

        if (data.success && data.staff) {
          // Convert staff data to User format
          const loadedUsers = data.staff.map((staff: any) => {
            // Find matching role or use default
            const role = Object.values(USER_ROLES).find(r => r.id === staff.role_id) || USER_ROLES.STAFF
            
            return {
              id: staff.id,
              email: staff.email,
              name: staff.name,
              role: role,
              permissions: role.permissions,
              department: staff.department || undefined,
              organization: staff.organization || undefined,
              isActive: staff.is_active,
              lastLogin: staff.last_login ? new Date(staff.last_login) : undefined,
            }
          })

          setUsers(loadedUsers)
          console.log(`Loaded ${loadedUsers.length} users from database`)
        }
      } catch (error) {
        console.error('Error loading users:', error)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    loadUsers()
  }, [])

  // Load audit logs from database
  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        const response = await fetch('/api/audit/list?limit=100')
        const data = await response.json()

        if (data.success && data.logs) {
          setAuditLogs(data.logs)
          console.log(`Loaded ${data.logs.length} audit log entries from database`)
        }
      } catch (error) {
        console.error('Error loading audit logs:', error)
      } finally {
        setIsLoadingAuditLogs(false)
      }
    }

    loadAuditLogs()
  }, [])

  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "",
    department: "",
    organization: "",
    permissions: [] as Permission[],
    isActive: true,
  })

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role.id === selectedRole
    return matchesSearch && matchesRole
  })

  const getRoleColor = (role: UserRole) => {
    switch (role.level) {
      case 100:
        return "bg-red-100 text-red-800"
      case 90:
        return "bg-purple-100 text-purple-800"
      case 80:
        return "bg-blue-100 text-blue-800"
      case 75:
        return "bg-indigo-100 text-indigo-800"
      case 70:
        return "bg-green-100 text-green-800"
      case 60:
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleIcon = (role: UserRole) => {
    if (role.level === 100) return <Crown className="h-4 w-4" />
    if (role.id === "survey_user") return <Eye className="h-4 w-4" />
    if (role.level >= 80) return <Shield className="h-4 w-4" />
    if (role.level >= 60) return <UserCheck className="h-4 w-4" />
    return <Users className="h-4 w-4" />
  }

  const handleCreateUser = async () => {
    const selectedRole = Object.values(USER_ROLES).find((role) => role.id === newUser.role)
    if (!selectedRole) {
      alert('Please select a role')
      return
    }

    if (!newUser.email || !newUser.name) {
      alert('Please fill in all required fields')
      return
    }

    try {
      // Call API to create staff member
      const response = await fetch('/api/staff/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          name: newUser.name,
          role_id: newUser.role,
          department: newUser.department,
          organization: newUser.organization,
          is_active: newUser.isActive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create staff member')
      }

      // Add to local state for immediate UI update
    const user: User = {
        id: data.staff.id,
      email: newUser.email,
      name: newUser.name,
      role: selectedRole,
      permissions: newUser.permissions.length > 0 ? newUser.permissions : selectedRole.permissions,
      department: newUser.department,
      organization: newUser.organization,
      isActive: newUser.isActive,
    }

    setUsers([...users, user])
    setNewUser({
      email: "",
      name: "",
      role: "",
      department: "",
      organization: "",
      permissions: [],
      isActive: true,
    })
    setIsCreateUserOpen(false)

      alert('Staff member created successfully!')

      // Log this action to audit log
      await fetch('/api/audit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Created staff user account',
          resource_type: 'staff',
          resource_id: data.staff.id,
          details: {
            target: newUser.email,
            name: newUser.name,
            role: selectedRole.name,
          },
        }),
      })

      // Reload the users list to get fresh data from database
      const reloadResponse = await fetch('/api/staff/list')
      const reloadData = await reloadResponse.json()
      if (reloadData.success && reloadData.staff) {
        const reloadedUsers = reloadData.staff.map((staff: any) => {
          const role = Object.values(USER_ROLES).find(r => r.id === staff.role_id) || USER_ROLES.STAFF
          return {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            role: role,
            permissions: role.permissions,
            department: staff.department || undefined,
            organization: staff.organization || undefined,
            isActive: staff.is_active,
            lastLogin: staff.last_login ? new Date(staff.last_login) : undefined,
          }
        })
        setUsers(reloadedUsers)
      }

      // Reload audit logs
      const auditResponse = await fetch('/api/audit/list?limit=100')
      const auditData = await auditResponse.json()
      if (auditData.success && auditData.logs) {
        setAuditLogs(auditData.logs)
      }
      
    } catch (error: any) {
      console.error('Error creating staff:', error)
      alert('Failed to create staff member: ' + (error.message || 'Please try again'))
    }
  }

  const handleToggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    try {
      const response = await fetch('/api/staff/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          email: user.email,
          name: user.name,
          role_id: user.role.id,
          department: user.department,
          organization: user.organization,
          is_active: !user.isActive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update staff status')
      }

      // Update local state
      setUsers(users.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)))

      // Log this action to audit log
      await fetch('/api/audit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: user.isActive ? 'Deactivated user account' : 'Activated user account',
          resource_type: 'staff',
          resource_id: userId,
          details: {
            target: user.email,
            name: user.name,
            previousStatus: user.isActive ? 'active' : 'inactive',
            newStatus: !user.isActive ? 'active' : 'inactive',
          },
        }),
      })

      // Reload audit logs
      const auditResponse = await fetch('/api/audit/list?limit=100')
      const auditData = await auditResponse.json()
      if (auditData.success && auditData.logs) {
        setAuditLogs(auditData.logs)
      }
      
    } catch (error: any) {
      console.error('Error toggling status:', error)
      alert('Failed to update status: ' + error.message)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const response = await fetch(`/api/staff/delete?id=${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete staff member')
      }

      // Remove from local state
      setUsers(users.filter((u) => u.id !== userId))
      alert('Staff member deleted successfully!')

      // Log this action to audit log
      await fetch('/api/audit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Deleted user account',
          resource_type: 'staff',
          resource_id: userId,
          details: {
            target: user.email,
            name: user.name,
            role: user.role.name,
          },
        }),
      })

      // Reload audit logs
      const auditResponse = await fetch('/api/audit/list?limit=100')
      const auditData = await auditResponse.json()
      if (auditData.success && auditData.logs) {
        setAuditLogs(auditData.logs)
      }
      
    } catch (error: any) {
      console.error('Error deleting staff:', error)
      alert('Failed to delete staff member: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
        <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system with appropriate permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(USER_ROLES).map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(role)}
                            <span>{role.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department/Organization</Label>
                  <Input
                    id="department"
                    value={newUser.role === "survey_user" ? newUser.organization : newUser.department}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        ...(newUser.role === "survey_user"
                          ? { organization: e.target.value }
                          : { department: e.target.value }),
                      })
                    }
                    placeholder={newUser.role === "survey_user" ? "Enter organization" : "Enter department"}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newUser.isActive}
                  onCheckedChange={(checked) => setNewUser({ ...newUser, isActive: checked })}
                />
                <Label>Active User</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser}>Create User</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter((u) => u.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Crown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administrators</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter((u) => u.role.level >= 90).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Eye className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Survey Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.role.id === "survey_user").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserX className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter((u) => !u.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Accounts</CardTitle>
                  <CardDescription>Manage user accounts and their access levels</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {Object.values(USER_ROLES).map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department/Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="text-gray-600">Loading users from database...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No users found. Click "Add User" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          <div className="flex items-center space-x-1">
                            {getRoleIcon(user.role)}
                            <span>{user.role.name}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user.role.id === "survey_user" && <Building2 className="h-4 w-4 text-gray-400" />}
                          <span>{user.organization || user.department || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.lastLogin ? user.lastLogin.toLocaleDateString() : "Never"}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsEditUserOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleUserStatus(user.id)}>
                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          {user.role.level < 100 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(USER_ROLES).map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(role)}
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                    </div>
                    <Badge className={getRoleColor(role)}>Level {role.level}</Badge>
                  </div>
                  {role.defaultRoute && <CardDescription>Default route: {role.defaultRoute}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Permissions ({role.permissions.length})</Label>
                      <div className="mt-2 space-y-1">
                        {role.permissions.slice(0, 5).map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{permission.name}</span>
                          </div>
                        ))}
                        {role.permissions.length > 5 && (
                          <div className="text-sm text-gray-500">+{role.permissions.length - 5} more permissions</div>
                        )}
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full bg-transparent"
                        onClick={() => {
                          setRoleToConfig(role)
                          setIsConfigureRoleOpen(true)
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Role
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Track user activities and system changes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAuditLogs ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="ml-3 text-gray-600">Loading audit logs...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No audit logs found.</p>
                  <p className="text-sm mt-1">User activities will appear here.</p>
                </div>
              ) : (
              <div className="space-y-4">
                  {auditLogs.map((log) => {
                    // Determine log type based on action
                    const logType = log.action.toLowerCase().includes('create') ? 'create'
                      : log.action.toLowerCase().includes('update') || log.action.toLowerCase().includes('edit') ? 'update'
                      : log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('deactivate') ? 'delete'
                      : log.action.toLowerCase().includes('access') || log.action.toLowerCase().includes('login') ? 'access'
                      : 'info'

                    // Format timestamp
                    const timestamp = new Date(log.timestamp).toLocaleString()

                    // Get user name
                    const userName = log.staff?.name || log.staff?.email || 'System'

                    // Get target from details or resource_type
                    const target = log.details?.target || log.resource_type || log.resource_id || 'N/A'

                    return (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-lg ${
                              logType === "create"
                            ? "bg-green-100"
                                : logType === "update"
                              ? "bg-blue-100"
                                  : logType === "access"
                                ? "bg-purple-100"
                                    : logType === "delete"
                                      ? "bg-red-100"
                                      : "bg-gray-100"
                        }`}
                      >
                            {logType === "create" ? (
                          <Plus className="h-4 w-4 text-green-600" />
                            ) : logType === "update" ? (
                          <Edit className="h-4 w-4 text-blue-600" />
                            ) : logType === "access" ? (
                          <Eye className="h-4 w-4 text-purple-600" />
                            ) : logType === "delete" ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                              <Settings className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-gray-600">
                              by {userName} • Target: {target}
                            </p>
                            {log.ip_address && (
                              <p className="text-xs text-gray-400">IP: {log.ip_address}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{timestamp}</div>
                      </div>
                    )
                  })}
                    </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configure Role Dialog */}
      <Dialog open={isConfigureRoleOpen} onOpenChange={setIsConfigureRoleOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {roleToConfig && getRoleIcon(roleToConfig)}
              <span>Configure Role: {roleToConfig?.name}</span>
            </DialogTitle>
            <DialogDescription>
              View and understand the permissions for this role
            </DialogDescription>
          </DialogHeader>

          {roleToConfig && (
            <div className="space-y-6">
              {/* Role Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm text-gray-600">Role Name</Label>
                  <p className="font-medium">{roleToConfig.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Access Level</Label>
                  <Badge className={getRoleColor(roleToConfig)}>Level {roleToConfig.level}</Badge>
                </div>
                {roleToConfig.defaultRoute && (
                  <div>
                    <Label className="text-sm text-gray-600">Default Route</Label>
                    <p className="font-medium">{roleToConfig.defaultRoute}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-gray-600">Total Permissions</Label>
                  <p className="font-medium">{roleToConfig.permissions.length}</p>
                </div>
              </div>

              {/* All Permissions */}
              <div>
                <Label className="text-lg font-semibold mb-3 block">All Permissions</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roleToConfig.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{permission.name}</div>
                        {permission.description && (
                          <div className="text-xs text-gray-500 mt-1">{permission.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Users with this Role */}
              <div>
                <Label className="text-lg font-semibold mb-3 block">Users with this Role</Label>
                <div className="space-y-2">
                  {users.filter(u => u.role.id === roleToConfig.id).length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No users assigned to this role yet</p>
                  ) : (
                    users
                      .filter(u => u.role.id === roleToConfig.id)
                      .map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsConfigureRoleOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    alert('Role configuration saved! (This is a demo - actual role editing would require backend changes)')
                    setIsConfigureRoleOpen(false)
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
