export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  permissions: Permission[]
  department?: string
  isActive: boolean
  lastLogin?: Date
  organization?: string
}

export interface UserRole {
  id: string
  name: string
  level: number
  permissions: Permission[]
  defaultRoute?: string
}

export interface Permission {
  id: string
  name: string
  resource: string
  actions: string[]
}

export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD_VIEW: { id: "dashboard_view", name: "View Dashboard", resource: "dashboard", actions: ["read"] },
  DASHBOARD_ADMIN: {
    id: "dashboard_admin",
    name: "Admin Dashboard",
    resource: "dashboard",
    actions: ["read", "write", "delete"],
  },

  // Staff management
  STAFF_VIEW: { id: "staff_view", name: "View Staff", resource: "staff", actions: ["read"] },
  STAFF_MANAGE: { id: "staff_manage", name: "Manage Staff", resource: "staff", actions: ["read", "write"] },
  STAFF_ADMIN: { id: "staff_admin", name: "Staff Admin", resource: "staff", actions: ["read", "write", "delete"] },

  // Applications
  APPLICATIONS_VIEW: {
    id: "applications_view",
    name: "View Applications",
    resource: "applications",
    actions: ["read"],
  },
  APPLICATIONS_MANAGE: {
    id: "applications_manage",
    name: "Manage Applications",
    resource: "applications",
    actions: ["read", "write"],
  },

  // QA permissions
  QA_VIEW: { id: "qa_view", name: "View QA", resource: "qa", actions: ["read"] },
  QA_REVIEW: { id: "qa_review", name: "QA Review", resource: "qa", actions: ["read", "write"] },
  QA_ADMIN: { id: "qa_admin", name: "QA Admin", resource: "qa", actions: ["read", "write", "delete"] },

  // HR permissions
  HR_VIEW: { id: "hr_view", name: "View HR", resource: "hr", actions: ["read"] },
  HR_MANAGE: { id: "hr_manage", name: "Manage HR", resource: "hr", actions: ["read", "write"] },
  HR_ADMIN: { id: "hr_admin", name: "HR Admin", resource: "hr", actions: ["read", "write", "delete"] },

  // Training permissions
  TRAINING_VIEW: { id: "training_view", name: "View Training", resource: "training", actions: ["read"] },
  TRAINING_MANAGE: { id: "training_manage", name: "Manage Training", resource: "training", actions: ["read", "write"] },

  // Scheduling
  SCHEDULE_VIEW: { id: "schedule_view", name: "View Schedule", resource: "schedule", actions: ["read"] },
  SCHEDULE_MANAGE: { id: "schedule_manage", name: "Manage Schedule", resource: "schedule", actions: ["read", "write"] },

  // Patient portal
  PATIENT_VIEW: { id: "patient_view", name: "View Patient Portal", resource: "patient", actions: ["read"] },
  PATIENT_MANAGE: { id: "patient_manage", name: "Manage Patients", resource: "patient", actions: ["read", "write"] },

  // Analytics
  ANALYTICS_VIEW: { id: "analytics_view", name: "View Analytics", resource: "analytics", actions: ["read"] },
  ANALYTICS_ADMIN: {
    id: "analytics_admin",
    name: "Analytics Admin",
    resource: "analytics",
    actions: ["read", "write"],
  },

  // Survey permissions
  SURVEY_VIEW: { id: "survey_view", name: "View Survey Dashboard", resource: "survey", actions: ["read"] },
  SURVEY_EXPORT: { id: "survey_export", name: "Export Survey Data", resource: "survey", actions: ["read", "export"] },
  SURVEY_AUDIT: { id: "survey_audit", name: "Survey Audit Access", resource: "survey", actions: ["read", "audit"] },

  // Marketing permissions
  MARKETING_VIEW: { id: "marketing_view", name: "View Marketing", resource: "marketing", actions: ["read"] },
  MARKETING_MANAGE: {
    id: "marketing_manage",
    name: "Manage Marketing",
    resource: "marketing",
    actions: ["read", "write"],
  },
  MARKETING_ADMIN: {
    id: "marketing_admin",
    name: "Marketing Admin",
    resource: "marketing",
    actions: ["read", "write", "delete"],
  },

  // System admin
  SYSTEM_ADMIN: { id: "system_admin", name: "System Admin", resource: "system", actions: ["read", "write", "delete"] },
  USER_MANAGEMENT: {
    id: "user_management",
    name: "User Management",
    resource: "users",
    actions: ["read", "write", "delete"],
  },
  // Add these new permissions after the existing ones:
  AUTHORIZATION_VIEW: {
    id: "authorization_view",
    name: "View Authorizations",
    resource: "authorization",
    actions: ["read"],
  },
  AUTHORIZATION_MANAGE: {
    id: "authorization_manage",
    name: "Manage Authorizations",
    resource: "authorization",
    actions: ["read", "write"],
  },
  AUTHORIZATION_TRACK: {
    id: "authorization_track",
    name: "Track Authorization Status",
    resource: "authorization",
    actions: ["read", "track"],
  },
}

export const USER_ROLES: Record<string, UserRole> = {
  SUPER_ADMIN: {
    id: "super_admin",
    name: "Super Administrator",
    level: 100,
    permissions: Object.values(PERMISSIONS),
    defaultRoute: "/",
  },

  ADMIN: {
    id: "admin",
    name: "Administrator",
    level: 90,
    permissions: [
      PERMISSIONS.DASHBOARD_ADMIN,
      PERMISSIONS.STAFF_ADMIN,
      PERMISSIONS.APPLICATIONS_MANAGE,
      PERMISSIONS.QA_ADMIN,
      PERMISSIONS.HR_ADMIN,
      PERMISSIONS.TRAINING_MANAGE,
      PERMISSIONS.SCHEDULE_MANAGE,
      PERMISSIONS.PATIENT_MANAGE,
      PERMISSIONS.ANALYTICS_ADMIN,
      PERMISSIONS.SURVEY_VIEW,
      PERMISSIONS.SURVEY_EXPORT,
      PERMISSIONS.MARKETING_ADMIN,
      PERMISSIONS.AUTHORIZATION_MANAGE,
    ],
    defaultRoute: "/",
  },

  MARKETING_MANAGER: {
    id: "marketing_manager",
    name: "Marketing Manager",
    level: 75,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.MARKETING_ADMIN,
      PERMISSIONS.STAFF_VIEW,
      PERMISSIONS.APPLICATIONS_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
    ],
    defaultRoute: "/marketing-dashboard",
  },

  MARKETING_SPECIALIST: {
    id: "marketing_specialist",
    name: "Marketing Specialist",
    level: 65,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.MARKETING_MANAGE,
      PERMISSIONS.STAFF_VIEW,
      PERMISSIONS.APPLICATIONS_VIEW,
    ],
    defaultRoute: "/marketing-dashboard",
  },

  SURVEY_USER: {
    id: "survey_user",
    name: "Survey User",
    level: 75,
    permissions: [PERMISSIONS.SURVEY_VIEW, PERMISSIONS.SURVEY_EXPORT, PERMISSIONS.SURVEY_AUDIT],
    defaultRoute: "/survey-ready",
  },

  QA_DIRECTOR: {
    id: "qa_director",
    name: "QA Director",
    level: 80,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.QA_ADMIN,
      PERMISSIONS.STAFF_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.TRAINING_VIEW,
      PERMISSIONS.SURVEY_VIEW,
      PERMISSIONS.MARKETING_VIEW,
      PERMISSIONS.AUTHORIZATION_MANAGE,
    ],
    defaultRoute: "/quality",
  },

  QA_NURSE: {
    id: "qa_nurse",
    name: "QA Nurse",
    level: 70,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.QA_REVIEW,
      PERMISSIONS.STAFF_VIEW,
      PERMISSIONS.PATIENT_VIEW,
      PERMISSIONS.MARKETING_VIEW,
      PERMISSIONS.AUTHORIZATION_VIEW,
    ],
    defaultRoute: "/quality",
  },

  HR_DIRECTOR: {
    id: "hr_director",
    name: "HR Director",
    level: 80,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.HR_ADMIN,
      PERMISSIONS.STAFF_ADMIN,
      PERMISSIONS.APPLICATIONS_MANAGE,
      PERMISSIONS.TRAINING_MANAGE,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.MARKETING_VIEW,
      PERMISSIONS.AUTHORIZATION_VIEW,
    ],
    defaultRoute: "/hr-files",
  },

  HR_SPECIALIST: {
    id: "hr_specialist",
    name: "HR Specialist",
    level: 60,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.HR_MANAGE,
      PERMISSIONS.STAFF_VIEW,
      PERMISSIONS.APPLICATIONS_VIEW,
      PERMISSIONS.TRAINING_VIEW,
      PERMISSIONS.MARKETING_VIEW,
    ],
    defaultRoute: "/hr-files",
  },

  CLINICAL_DIRECTOR: {
    id: "clinical_director",
    name: "Clinical Director",
    level: 85,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.STAFF_MANAGE,
      PERMISSIONS.QA_ADMIN,
      PERMISSIONS.PATIENT_MANAGE,
      PERMISSIONS.SCHEDULE_MANAGE,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.SURVEY_VIEW,
      PERMISSIONS.MARKETING_VIEW,
      PERMISSIONS.AUTHORIZATION_MANAGE,
    ],
    defaultRoute: "/",
  },

  NURSE_MANAGER: {
    id: "nurse_manager",
    name: "Nurse Manager",
    level: 70,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.STAFF_VIEW,
      PERMISSIONS.SCHEDULE_MANAGE,
      PERMISSIONS.PATIENT_VIEW,
      PERMISSIONS.QA_VIEW,
      PERMISSIONS.MARKETING_VIEW,
      PERMISSIONS.AUTHORIZATION_TRACK,
    ],
    defaultRoute: "/schedule",
  },

  STAFF_NURSE: {
    id: "staff_nurse",
    name: "Staff Nurse",
    level: 50,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.SCHEDULE_VIEW,
      PERMISSIONS.PATIENT_VIEW,
      PERMISSIONS.TRAINING_VIEW,
      PERMISSIONS.AUTHORIZATION_TRACK,
    ],
    defaultRoute: "/staff-dashboard",
  },

  PATIENT: {
    id: "patient",
    name: "Patient",
    level: 10,
    permissions: [PERMISSIONS.PATIENT_VIEW],
    defaultRoute: "/patient-portal",
  },
}

export function hasPermission(user: User, resource: string, action: string): boolean {
  return user.permissions.some((permission) => permission.resource === resource && permission.actions.includes(action))
}

export function canAccessRoute(user: User, route: string): boolean {
  const routePermissions: Record<string, { resource: string; action: string }> = {
    "/": { resource: "dashboard", action: "read" },
    "/applications": { resource: "applications", action: "read" },
    "/staff-dashboard": { resource: "staff", action: "read" },
    "/employer-dashboard": { resource: "staff", action: "write" },
    "/quality": { resource: "qa", action: "read" },
    "/oasis-qa": { resource: "qa", action: "read" },
    "/hr-files": { resource: "hr", action: "read" },
    "/training": { resource: "training", action: "read" },
    "/schedule": { resource: "schedule", action: "read" },
    "/patient-portal": { resource: "patient", action: "read" },
    "/analytics": { resource: "analytics", action: "read" },
    "/admin": { resource: "system", action: "read" },
    "/survey-ready": { resource: "survey", action: "read" },
    "/marketing-dashboard": { resource: "marketing", action: "read" },
    "/referral-management": { resource: "applications", action: "read" },
  }

  const permission = routePermissions[route]
  if (!permission) return true // Allow access to routes without specific permissions

  return hasPermission(user, permission.resource, permission.action)
}

export function getDefaultRoute(user: User): string {
  return user.role.defaultRoute || "/"
}

// Mock current user - in real app this would come from authentication
export const getCurrentUser = (): User => {
  // This would typically come from your authentication system
  return {
    id: "1",
    email: "admin@irishtripletshealth.com",
    name: "System Administrator",
    role: USER_ROLES.SUPER_ADMIN,
    permissions: USER_ROLES.SUPER_ADMIN.permissions,
    isActive: true,
    lastLogin: new Date(),
  }
}

// Mock survey user for testing
export const getSurveyUser = (): User => {
  return {
    id: "survey_1",
    email: "surveyor@state.gov",
    name: "State Surveyor - J. Smith",
    role: USER_ROLES.SURVEY_USER,
    permissions: USER_ROLES.SURVEY_USER.permissions,
    organization: "State Health Department",
    isActive: true,
    lastLogin: new Date(),
  }
}

// Mock marketing manager for testing
export const getMarketingManager = (): User => {
  return {
    id: "marketing_1",
    email: "marketing@masepro.com",
    name: "Marketing Manager - Sarah Johnson",
    role: USER_ROLES.MARKETING_MANAGER,
    permissions: USER_ROLES.MARKETING_MANAGER.permissions,
    department: "Marketing",
    isActive: true,
    lastLogin: new Date(),
  }
}
