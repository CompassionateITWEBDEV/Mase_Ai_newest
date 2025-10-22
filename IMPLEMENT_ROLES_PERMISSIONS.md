# How to Make Roles & Permissions WORK 🔧

## Overview
This guide shows EXACTLY how to implement a working Roles & Permissions system in your Next.js app.

---

## 🎯 **What We're Going to Build**

From this:
- ❌ Login exists but no password check
- ❌ Roles defined but not enforced
- ❌ Anyone can access any page
- ❌ No API protection

To this:
- ✅ Secure login with password hashing
- ✅ Role-based access control
- ✅ Route protection (only admins can access /admin)
- ✅ API protection (only authorized users can call APIs)
- ✅ Permission checking on every action

---

## 📋 **Implementation Plan**

### **Phase 1: Authentication (Required)**
1. Add password hashing
2. Create session management
3. Store auth state globally

### **Phase 2: Route Protection (Required)**
1. Create middleware to check authentication
2. Protect admin routes
3. Redirect unauthorized users

### **Phase 3: Permission Enforcement (Required)**
1. Add permission checks in UI
2. Add permission checks in API
3. Hide/show elements based on permissions

### **Phase 4: Enhanced Features (Optional)**
1. Remember me functionality
2. Logout functionality
3. Session timeout
4. Audit logging for auth events

---

## 🔐 **PHASE 1: Secure Authentication**

### Step 1.1: Add Password Hashing

**Install bcryptjs:**
```bash
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

**Update Registration API** (`app/api/auth/register/route.ts`):
```typescript
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { email, password, accountType, ...otherFields } = await request.json()
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // Insert with hashed password
  const { data, error } = await supabase
    .from('staff')
    .insert({
      email,
      password_hash: hashedPassword,  // Store hashed password
      ...otherFields
    })
    .select()
    .single()
    
  // Don't return password in response
  return NextResponse.json({
    success: true,
    user: { id: data.id, email: data.email }
  })
}
```

**Update Login API** (`app/api/auth/login/route.ts`):
```typescript
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { email, password, accountType } = await request.json()
  
  // Fetch user with password_hash
  const { data: user, error } = await supabase
    .from('staff')
    .select('*')
    .eq('email', email)
    .single()
    
  if (error || !user) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }
  
  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash)
  
  if (!isValidPassword) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }
  
  // Password is correct, proceed...
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role_id
    },
    redirectTo: getRedirectByRole(user.role_id)
  })
}

function getRedirectByRole(roleId: string): string {
  const roleRedirects: Record<string, string> = {
    'super_admin': '/admin/users',
    'admin': '/admin/users',
    'qa_director': '/quality',
    'hr_director': '/hr-files',
    'marketing_manager': '/marketing-dashboard',
    'survey_user': '/survey-ready',
    // ... add more
  }
  return roleRedirects[roleId] || '/staff-dashboard'
}
```

**Update Database Schema:**
```sql
-- Add password_hash column to staff table
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Do the same for applicants and employers
ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE public.employers 
ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

---

### Step 1.2: Create Session Management

**Install jose (JWT library for Next.js):**
```bash
pnpm add jose
```

**Create auth utilities** (`lib/auth-utils.ts`):
```typescript
import { SignJWT, jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

export interface UserSession {
  id: string
  email: string
  name: string
  role: string
  accountType: string
}

// Create JWT token
export async function createToken(user: UserSession): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accountType: user.accountType,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Token expires in 24 hours
    .sign(SECRET_KEY)

  return token
}

// Verify JWT token
export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload as unknown as UserSession
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Get current user from request
export async function getCurrentUser(request: NextRequest): Promise<UserSession | null> {
  const token = request.cookies.get('auth_token')?.value
  
  if (!token) {
    return null
  }
  
  return await verifyToken(token)
}

// Set auth cookie
export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  return response
}

// Clear auth cookie
export function clearAuthCookie(response: NextResponse) {
  response.cookies.delete('auth_token')
  return response
}
```

**Update Login API to create session:**
```typescript
import { createToken, setAuthCookie } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  // ... password verification code ...
  
  if (!isValidPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }
  
  // Create JWT token
  const token = await createToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role_id,
    accountType: 'staff'
  })
  
  // Create response with auth cookie
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role_id
    },
    redirectTo: getRedirectByRole(user.role_id)
  })
  
  // Set cookie
  setAuthCookie(response, token)
  
  return response
}
```

**Add to .env.local:**
```env
JWT_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
```

---

### Step 1.3: Create Auth Context (Global State)

**Create context** (`lib/auth-context.tsx`):
```typescript
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, USER_ROLES } from './auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, accountType: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (resource: string, action: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          
          // Map role_id to USER_ROLES
          const role = USER_ROLES[data.user.role.toUpperCase()] || USER_ROLES.STAFF
          
          setUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: role,
            permissions: role.permissions,
            isActive: true,
          })
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string, accountType: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, accountType })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Login failed')
    }

    const data = await response.json()
    
    // Map role_id to USER_ROLES
    const role = USER_ROLES[data.user.role.toUpperCase()] || USER_ROLES.STAFF
    
    setUser({
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: role,
      permissions: role.permissions,
      isActive: true,
    })

    // Redirect
    window.location.href = data.redirectTo
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.href = '/login'
  }

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false
    return user.permissions.some(
      p => p.resource === resource && p.actions.includes(action)
    )
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

**Create /api/auth/me endpoint** (`app/api/auth/me/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }
  
  return NextResponse.json({ user })
}
```

**Create /api/auth/logout endpoint** (`app/api/auth/logout/route.ts`):
```typescript
import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth-utils'

export async function POST() {
  const response = NextResponse.json({ success: true })
  clearAuthCookie(response)
  return response
}
```

**Wrap app with AuthProvider** (`app/layout.tsx`):
```typescript
import { AuthProvider } from '@/lib/auth-context'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

## 🛡️ **PHASE 2: Route Protection**

### Step 2.1: Create Middleware

**Create** (`middleware.ts` in project root):
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth-utils'

// Routes that require authentication
const protectedRoutes = [
  '/admin',
  '/staff-dashboard',
  '/employer-dashboard',
  '/applicant-dashboard',
  '/quality',
  '/hr-files',
  '/marketing-dashboard',
  '/analytics',
]

// Routes that require specific roles
const roleBasedRoutes: Record<string, string[]> = {
  '/admin': ['super_admin', 'admin'],
  '/quality': ['super_admin', 'admin', 'qa_director', 'qa_nurse', 'clinical_director'],
  '/hr-files': ['super_admin', 'admin', 'hr_director', 'hr_specialist'],
  '/marketing-dashboard': ['super_admin', 'admin', 'marketing_manager', 'marketing_specialist'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if route needs protection
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  if (!isProtectedRoute) {
    return NextResponse.next()
  }
  
  // Get token from cookie
  const token = request.cookies.get('auth_token')?.value
  
  if (!token) {
    // Not logged in, redirect to login
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  
  // Verify token
  const user = await verifyToken(token)
  
  if (!user) {
    // Invalid token, redirect to login
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  
  // Check role-based access
  for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(user.role)) {
        // User doesn't have required role
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }
  
  // User is authenticated and authorized
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
```

**Create unauthorized page** (`app/unauthorized/page.tsx`):
```typescript
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Login Again</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
```

---

## 🔒 **PHASE 3: Permission Enforcement**

### Step 3.1: UI Permission Checks

**Update login page to use auth context** (`app/login/page.tsx`):
```typescript
'use client'

import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [accountType, setAccountType] = useState('staff')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await login(formData.email, formData.password, accountType)
      // Auth context handles redirect
    } catch (error: any) {
      alert(error.message)
    }
  }
  
  // ... rest of form
}
```

**Use in components** (`app/admin/users/page.tsx`):
```typescript
'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminUsersPage() {
  const { user, isLoading, hasPermission } = useAuth()
  const router = useRouter()
  
  // Check if user has permission
  useEffect(() => {
    if (!isLoading && user) {
      if (!hasPermission('users', 'read')) {
        router.push('/unauthorized')
      }
    }
  }, [user, isLoading])
  
  if (isLoading) {
    return <div>Loading...</div>
  }
  
  if (!user) {
    return <div>Not authenticated</div>
  }
  
  return (
    <div>
      <h1>User Management</h1>
      
      {/* Show add button only if user can write */}
      {hasPermission('users', 'write') && (
        <Button onClick={handleAddUser}>
          Add User
        </Button>
      )}
      
      {/* Show delete button only if user can delete */}
      {hasPermission('users', 'delete') && (
        <Button onClick={handleDeleteUser}>
          Delete User
        </Button>
      )}
      
      {/* ... rest of component */}
    </div>
  )
}
```

---

### Step 3.2: API Permission Checks

**Create API auth helper** (`lib/api-auth.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, UserSession } from './auth-utils'
import { USER_ROLES } from './auth'

export async function requireAuth(request: NextRequest): Promise<UserSession> {
  const user = await getCurrentUser(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

export async function requirePermission(
  request: NextRequest,
  resource: string,
  action: string
): Promise<UserSession> {
  const user = await requireAuth(request)
  
  // Get user's role and permissions
  const role = USER_ROLES[user.role.toUpperCase()]
  
  if (!role) {
    throw new Error('Invalid role')
  }
  
  // Check if user has permission
  const hasPermission = role.permissions.some(
    p => p.resource === resource && p.actions.includes(action)
  )
  
  if (!hasPermission) {
    throw new Error('Forbidden')
  }
  
  return user
}

export function handleAuthError(error: any) {
  if (error.message === 'Unauthorized') {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }
  
  if (error.message === 'Forbidden') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }
  
  return NextResponse.json(
    { error: error.message || 'Internal server error' },
    { status: 500 }
  )
}
```

**Protect API routes** (`app/api/staff/create/route.ts`):
```typescript
import { requirePermission, handleAuthError } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  try {
    // Require permission before proceeding
    const user = await requirePermission(request, 'staff', 'write')
    
    // User is authenticated and has permission
    const body = await request.json()
    
    // Create staff member...
    const { data, error } = await supabase
      .from('staff')
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    
    // Log to audit
    await fetch('/api/audit/create', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        action: 'Created staff user',
        resource_type: 'staff',
        resource_id: data.id,
      })
    })
    
    return NextResponse.json({ success: true, staff: data })
    
  } catch (error) {
    return handleAuthError(error)
  }
}
```

**Protect all staff endpoints:**

`app/api/staff/update/route.ts`:
```typescript
export async function PUT(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'staff', 'write')
    // ... update logic
  } catch (error) {
    return handleAuthError(error)
  }
}
```

`app/api/staff/delete/route.ts`:
```typescript
export async function DELETE(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'staff', 'delete')
    // ... delete logic
  } catch (error) {
    return handleAuthError(error)
  }
}
```

`app/api/staff/list/route.ts`:
```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, 'staff', 'read')
    // ... list logic
  } catch (error) {
    return handleAuthError(error)
  }
}
```

---

## 🎨 **PHASE 4: Enhanced Features**

### Step 4.1: Add Logout Button

**Create logout component** (`components/logout-button.tsx`):
```typescript
'use client'

import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const { logout, user } = useAuth()
  
  if (!user) return null
  
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        {user.name} ({user.role.name})
      </span>
      <Button variant="outline" size="sm" onClick={logout}>
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  )
}
```

### Step 4.2: Show User Info

**Create user menu** (`components/user-menu.tsx`):
```typescript
'use client'

import { useAuth } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'
import { User, Shield } from 'lucide-react'

export function UserMenu() {
  const { user } = useAuth()
  
  if (!user) return null
  
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
      <div className="p-2 bg-blue-100 rounded-full">
        <User className="h-5 w-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <div className="font-medium">{user.name}</div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </div>
      <div>
        <Badge className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {user.role.name}
        </Badge>
      </div>
    </div>
  )
}
```

---

## 📝 **Complete Implementation Checklist**

### Backend (API & Database):
- [ ] Install bcryptjs
- [ ] Add password_hash column to tables
- [ ] Update register API to hash passwords
- [ ] Update login API to verify passwords
- [ ] Install jose (JWT library)
- [ ] Create auth-utils.ts (token management)
- [ ] Update login API to create JWT tokens
- [ ] Create /api/auth/me endpoint
- [ ] Create /api/auth/logout endpoint
- [ ] Create api-auth.ts (permission helpers)
- [ ] Protect all staff API endpoints
- [ ] Test API authentication

### Frontend (UI & Routes):
- [ ] Create auth-context.tsx
- [ ] Wrap app with AuthProvider
- [ ] Update login page to use context
- [ ] Create middleware.ts for route protection
- [ ] Create unauthorized page
- [ ] Update admin pages to check permissions
- [ ] Hide/show UI elements based on permissions
- [ ] Create logout button component
- [ ] Create user menu component
- [ ] Test route protection

### Database:
- [ ] Run migration to add password_hash columns
- [ ] Update existing users with hashed passwords
- [ ] Test user creation
- [ ] Test user login

---

## 🧪 **Testing Steps**

### Test 1: Authentication
```bash
# 1. Create a test user with hashed password
# Run in Supabase SQL Editor
```

### Test 2: Route Protection
```
1. Try to access /admin/users without login
   Expected: Redirect to /login

2. Login as admin
   Expected: Can access /admin/users

3. Login as staff nurse (level 50)
   Expected: Redirect to /unauthorized when accessing /admin
```

### Test 3: Permission Enforcement
```
1. Login as admin
   Expected: Can see Add/Edit/Delete buttons

2. Login as HR specialist
   Expected: Can see Add/Edit, but NOT Delete

3. Login as staff nurse
   Expected: Cannot see any modification buttons
```

### Test 4: API Protection
```
1. Call /api/staff/create without auth token
   Expected: 401 Unauthorized

2. Call /api/staff/create as staff nurse
   Expected: 403 Forbidden

3. Call /api/staff/create as admin
   Expected: 200 Success
```

---

## 🚀 **Quick Start (Fastest Way)**

Want to get it working ASAP? Follow these steps in order:

### 1. Install Dependencies (5 minutes)
```bash
pnpm add bcryptjs jose
pnpm add -D @types/bcryptjs
```

### 2. Add Database Column (2 minutes)
```sql
ALTER TABLE public.staff ADD COLUMN password_hash TEXT;
ALTER TABLE public.applicants ADD COLUMN password_hash TEXT;
ALTER TABLE public.employers ADD COLUMN password_hash TEXT;
```

### 3. Copy the Files (10 minutes)
- Copy `lib/auth-utils.ts` (from Step 1.2)
- Copy `lib/auth-context.tsx` (from Step 1.3)
- Copy `lib/api-auth.ts` (from Step 3.2)
- Copy `middleware.ts` (from Step 2.1)

### 4. Update Login API (5 minutes)
- Add password hashing to `app/api/auth/login/route.ts`

### 5. Create Auth Endpoints (5 minutes)
- Create `app/api/auth/me/route.ts`
- Create `app/api/auth/logout/route.ts`

### 6. Wrap App (2 minutes)
- Add AuthProvider to `app/layout.tsx`

### 7. Test (5 minutes)
- Try to access /admin/users
- Should redirect to login
- Login and verify access

**Total time: ~35 minutes** ⏱️

---

## 💡 **Summary**

**What makes it work:**

1. **Authentication** = JWT tokens + HTTP-only cookies
2. **Route Protection** = Middleware checks token before page load
3. **Permission Enforcement** = Check role.permissions before action
4. **API Protection** = Verify token + permission in every endpoint

**The Flow:**
```
User enters email/password
    ↓
Login API verifies password (bcrypt)
    ↓
Creates JWT token with user data
    ↓
Sets HTTP-only cookie
    ↓
Middleware checks cookie on every request
    ↓
Verifies token is valid
    ↓
Checks if user has required role
    ↓
Allows or denies access
```

**Key Files:**
- `lib/auth-utils.ts` - Token creation/verification
- `lib/auth-context.tsx` - Global auth state
- `lib/api-auth.ts` - API permission checking
- `middleware.ts` - Route protection
- `app/api/auth/login/route.ts` - Login logic

Gusto mo ba i-implement karon? Or specific part lang una? 🤔

