# Roles & Permissions - Testing Guide

## Overview
Ang Roles & Permissions feature allows administrators to view and understand the different user roles in the system, their access levels, and their assigned permissions.

## Who Can Access This Feature?

### ✅ **Current Access Control:**

Based sa current implementation:

1. **Super Admin (Level 100)** ✅
   - Has `SYSTEM_ADMIN` permission
   - Has `USER_MANAGEMENT` permission
   - Can access `/admin/users` page
   - Can view and configure all roles

2. **Admin (Level 90)** ✅
   - Has `STAFF_ADMIN` permission
   - Can likely access admin features
   - Can view and manage staff

3. **Other Roles** ❌
   - QA Director, HR Director, etc. - No access to user management
   - Marketing roles - No access
   - Nurse roles - No access
   - Patient - No access

### 🔒 **Database Access Control (RLS):**

Currently, ang database RLS policies allow:
- `anon` (anonymous) users - Can INSERT, SELECT, UPDATE staff
- `authenticated` users - Can INSERT, SELECT, UPDATE staff

**⚠️ IMPORTANT:** For production, dapat i-restrict ang RLS policies para only admins can manage users!

## Available Roles & Their Permissions

### 1. **Super Administrator** (Level 100)
- **Access Level:** Highest (Full System Access)
- **Total Permissions:** 31 permissions (ALL)
- **Default Route:** `/`
- **Can Do:**
  - Everything in the system
  - Manage all users
  - Access all modules
  - Delete any resource

### 2. **Administrator** (Level 90)
- **Access Level:** High
- **Total Permissions:** 14 permissions
- **Default Route:** `/`
- **Key Permissions:**
  - Dashboard Admin
  - Staff Admin
  - QA Admin
  - HR Admin
  - Marketing Admin
  - Analytics Admin

### 3. **Marketing Manager** (Level 75)
- **Access Level:** Medium-High
- **Total Permissions:** 5 permissions
- **Default Route:** `/marketing-dashboard`
- **Key Permissions:**
  - Marketing Admin
  - View Staff
  - View Applications
  - View Analytics

### 4. **Survey User** (Level 75)
- **Access Level:** Medium-High
- **Total Permissions:** 3 permissions
- **Default Route:** `/survey-ready`
- **Key Permissions:**
  - View Survey Dashboard
  - Export Survey Data
  - Survey Audit Access

### 5. **QA Director** (Level 80)
- **Access Level:** High
- **Total Permissions:** 8 permissions
- **Default Route:** `/quality`
- **Key Permissions:**
  - QA Admin
  - View Dashboard
  - Manage Authorizations
  - View Analytics

### 6. **QA Nurse** (Level 70)
- **Access Level:** Medium
- **Total Permissions:** 6 permissions
- **Default Route:** `/quality`
- **Key Permissions:**
  - QA Review
  - View Patient Portal
  - View Authorizations

### 7. **HR Director** (Level 80)
- **Access Level:** High
- **Total Permissions:** 8 permissions
- **Default Route:** `/hr-files`
- **Key Permissions:**
  - HR Admin
  - Staff Admin
  - Manage Applications
  - Manage Training

### 8. **HR Specialist** (Level 60)
- **Access Level:** Medium
- **Total Permissions:** 6 permissions
- **Default Route:** `/hr-files`
- **Key Permissions:**
  - Manage HR
  - View Staff
  - View Applications

### 9. **Clinical Director** (Level 85)
- **Access Level:** Very High
- **Total Permissions:** 9 permissions
- **Default Route:** `/`
- **Key Permissions:**
  - Manage Staff
  - QA Admin
  - Manage Patients
  - Manage Schedule

### 10. **Nurse Manager** (Level 70)
- **Access Level:** Medium
- **Total Permissions:** 6 permissions
- **Default Route:** `/schedule`
- **Key Permissions:**
  - Manage Schedule
  - View Staff
  - View Patients
  - Track Authorizations

### 11. **Staff Nurse** (Level 50)
- **Access Level:** Low-Medium
- **Total Permissions:** 5 permissions
- **Default Route:** `/staff-dashboard`
- **Key Permissions:**
  - View Dashboard
  - View Schedule
  - View Patients
  - View Training

### 12. **Patient** (Level 10)
- **Access Level:** Lowest
- **Total Permissions:** 1 permission
- **Default Route:** `/patient-portal`
- **Key Permissions:**
  - View Patient Portal only

## How to Test the Feature

### Test 1: Access the Roles & Permissions Tab

1. **Navigate to Admin Panel:**
   ```
   http://localhost:3000/admin/users
   ```

2. **Click on "Roles & Permissions" Tab:**
   - You should see all 12 role cards
   - Each card shows:
     - Role icon (Crown for Super Admin, Shield for others)
     - Role name
     - Access level badge
     - Total permissions count
     - Number of users with that role
     - "Configure Role" button

3. **Expected Result:**
   - All roles are displayed in a grid (3 columns)
   - Each role has proper styling and icons
   - Colors match the role level

### Test 2: Click "Configure Role" Button

1. **Select Any Role:**
   - Click the "Configure Role" button on any role card
   - Example: Click on "Super Administrator"

2. **Dialog Should Open:**
   - Title shows: "Configure Role: Super Administrator"
   - Role icon is displayed

3. **Verify Role Info Section:**
   - ✅ Role Name: Super Administrator
   - ✅ Access Level: Badge showing "Level 100"
   - ✅ Default Route: /
   - ✅ Total Permissions: 31

4. **Verify All Permissions Section:**
   - Should show all 31 permissions for Super Admin
   - Each permission has:
     - Green dot indicator
     - Permission name
     - Description (if available)
   - Permissions are displayed in 2 columns

5. **Verify Users Section:**
   - Shows "Users with this Role"
   - If no users: "No users assigned to this role yet"
   - If users exist:
     - User name
     - User email
     - Active/Inactive badge

6. **Verify Actions:**
   - "Close" button (closes dialog)
   - "Save Changes" button (currently shows demo alert)

### Test 3: Test Different Roles

Try clicking "Configure Role" on different roles:

**A. Super Administrator:**
- Should show 31 permissions
- Highest level (100)

**B. Administrator:**
- Should show 14 permissions
- Level 90
- No USER_MANAGEMENT permission (only Super Admin has it)

**C. Staff Nurse:**
- Should show 5 permissions
- Level 50
- Only view permissions

**D. Patient:**
- Should show 1 permission
- Level 10
- Only "View Patient Portal"

### Test 4: Verify Users with Roles

1. **Create Staff Members:**
   - Go to "Users" tab
   - Click "Add User"
   - Create users with different roles:
     - User 1: Super Admin
     - User 2: HR Director
     - User 3: QA Nurse
     - User 4: Staff Nurse

2. **Check Role Assignment:**
   - Go to "Roles & Permissions" tab
   - Click "Configure Role" on each role
   - Verify the user appears in the "Users with this Role" section

3. **Expected Result:**
   - Super Administrator role shows User 1
   - HR Director role shows User 2
   - QA Nurse role shows User 3
   - Staff Nurse role shows User 4

### Test 5: Visual Verification

**Color Coding by Level:**

High Levels (80-100):
- Super Admin (100): Gold/Crown icon
- Clinical Director (85): Blue
- QA Director (80): Blue
- HR Director (80): Blue

Medium-High (70-79):
- Survey User (75): Green
- Marketing Manager (75): Green
- QA Nurse (70): Green
- Nurse Manager (70): Green

Medium-Low (50-69):
- Marketing Specialist (65): Yellow
- HR Specialist (60): Yellow
- Staff Nurse (50): Yellow

Low (10-49):
- Patient (10): Gray

### Test 6: Permission Details

**Check Specific Permission Categories:**

1. **Dashboard Permissions:**
   - DASHBOARD_VIEW (read)
   - DASHBOARD_ADMIN (read, write, delete)

2. **Staff Management:**
   - STAFF_VIEW (read)
   - STAFF_MANAGE (read, write)
   - STAFF_ADMIN (read, write, delete)

3. **QA Permissions:**
   - QA_VIEW (read)
   - QA_REVIEW (read, write)
   - QA_ADMIN (read, write, delete)

4. **Special Permissions:**
   - SYSTEM_ADMIN (only Super Admin)
   - USER_MANAGEMENT (only Super Admin)

### Test 7: Verify Permission Actions

Each permission has specific actions:

- **Read**: View data
- **Write**: Create/Update data
- **Delete**: Remove data
- **Export**: Export data (Survey)
- **Audit**: Audit access (Survey)
- **Track**: Track status (Authorizations)

## Common Test Scenarios

### Scenario 1: Admin wants to see who has QA permissions
1. Go to Roles & Permissions tab
2. Find "QA Director" card
3. Click "Configure Role"
4. Check "Users with this Role" section
5. See all QA Directors in the system

### Scenario 2: HR wants to know what permissions HR Specialist has
1. Go to Roles & Permissions tab
2. Find "HR Specialist" card
3. Note: Shows 6 permissions
4. Click "Configure Role"
5. See detailed list:
   - View Dashboard
   - Manage HR
   - View Staff
   - View Applications
   - View Training
   - View Marketing

### Scenario 3: Check if a user can delete staff
1. Find the user's role (e.g., HR Director)
2. Go to Roles & Permissions tab
3. Click "Configure Role" on HR Director
4. Look for "Staff Admin" permission
5. Check if it has "delete" action
6. HR Director has STAFF_ADMIN → Can delete staff ✅

### Scenario 4: Verify Survey User has limited access
1. Go to Roles & Permissions
2. Click "Configure Role" on Survey User
3. Verify only 3 permissions:
   - View Survey Dashboard
   - Export Survey Data
   - Survey Audit Access
4. No other system access ✅

## Security Testing

### Test Access Control

**As Super Admin:**
```javascript
// In browser console (if you implement auth checking)
const user = getCurrentUser()
console.log(user.role.name) // "Super Administrator"
console.log(user.role.level) // 100
console.log(hasPermission(user, "users", "write")) // true
console.log(hasPermission(user, "users", "delete")) // true
```

**As Staff Nurse:**
```javascript
const user = getCurrentUser()
console.log(user.role.name) // "Staff Nurse"
console.log(user.role.level) // 50
console.log(hasPermission(user, "users", "write")) // false
console.log(hasPermission(user, "users", "delete")) // false
```

## What the Feature Currently Does

✅ **Implemented:**
1. Display all 12 system roles
2. Show role access levels (1-100)
3. Show total permissions count
4. Show number of users per role
5. View detailed role information
6. View all permissions for a role
7. View users assigned to a role
8. Color-coded visual indicators
9. Responsive dialog layout
10. Close/Cancel functionality

❌ **Not Yet Implemented (Future):**
1. Actually editing role permissions
2. Creating custom roles
3. Deleting roles
4. Assigning/removing specific permissions
5. Role templates
6. Permission inheritance
7. Role cloning
8. Audit log for role changes

## Current Limitations

1. **Read-Only:** The "Save Changes" button is a demo - no actual editing
2. **No Custom Roles:** Can't create new roles beyond the 12 predefined
3. **No Permission Toggle:** Can't add/remove individual permissions
4. **No RLS Enforcement:** Database allows all authenticated users (should be admin-only)
5. **No User Filtering:** Can't filter which users to show

## Recommendations for Production

### 1. Implement Proper Access Control
```typescript
// Add to page.tsx
const user = getCurrentUser()
if (user.role.level < 90) {
  redirect('/unauthorized')
}
```

### 2. Update RLS Policies
```sql
-- Only allow admins to manage staff
DROP POLICY IF EXISTS "Allow all to insert staff" ON public.staff;
DROP POLICY IF EXISTS "Allow all to update staff" ON public.staff;

CREATE POLICY "Only admins can insert staff"
ON public.staff FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.staff 
    WHERE role_id IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Only admins can update staff"
ON public.staff FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.staff 
    WHERE role_id IN ('super_admin', 'admin')
  )
);
```

### 3. Add Role Editing (Future Enhancement)
```typescript
// Example implementation
const handleUpdateRole = async (roleId: string, permissions: Permission[]) => {
  // Validate user has SYSTEM_ADMIN permission
  if (!hasPermission(currentUser, 'system', 'write')) {
    alert('Unauthorized')
    return
  }

  // Update role permissions in database
  await fetch('/api/roles/update', {
    method: 'PUT',
    body: JSON.stringify({ roleId, permissions })
  })

  // Log to audit
  await fetch('/api/audit/create', {
    method: 'POST',
    body: JSON.stringify({
      action: 'Updated role permissions',
      resource_type: 'role',
      resource_id: roleId,
      details: { permissions }
    })
  })
}
```

## Troubleshooting

### Issue: Can't access /admin/users page
**Solution:**
- Check if you're logged in
- Verify your role has USER_MANAGEMENT permission
- Check browser console for errors

### Issue: No users showing in role
**Solution:**
- Verify users are created in the database
- Check that role_id matches exactly
- Refresh the page

### Issue: Wrong permission count
**Solution:**
- Check lib/auth.ts for role definition
- Verify all permissions are in the permissions array
- Count should match Object.values(PERMISSIONS).length for Super Admin

### Issue: Configure button does nothing
**Solution:**
- Check browser console for errors
- Verify Dialog component is imported
- Check state: isConfigureRoleOpen and roleToConfig

## Conclusion

Ang Roles & Permissions feature is currently **VIEW-ONLY** pero very useful for:
- Understanding system roles
- Checking user permissions
- Planning access control
- Onboarding new admins
- Security audits

Para sa production:
- Add actual role editing
- Implement strict RLS
- Add custom role creation
- Add permission templates
- Add role history/audit

## Quick Reference

**Who can access:** Super Admin, Admin (Level 90+)

**Where:** `/admin/users` → "Roles & Permissions" tab

**What you can do:**
- ✅ View all roles
- ✅ See permissions per role
- ✅ See users per role
- ✅ Understand access levels
- ❌ Edit roles (not yet)
- ❌ Create roles (not yet)

**Files involved:**
- `app/admin/users/page.tsx` - Main UI
- `lib/auth.ts` - Role definitions
- `components/ui/*` - UI components

