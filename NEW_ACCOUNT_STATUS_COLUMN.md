# New account_status Column - Separate from is_active

## Overview

We've added a **new dedicated column** `account_status` for tracking login access, keeping `is_active` for its original purpose of general physician status.

---

## Why Two Columns?

### Problem with Using is_active
- `is_active` was being used for TWO different purposes:
  1. General physician status in practice (active/inactive in the system)
  2. Login access control (can they access the portal?)

### Solution: Separate Concerns
Now we have **two independent columns**:

```sql
┌─────────────────────────────────────────────────────────┐
│ is_active (existing)        account_status (NEW)        │
├─────────────────────────────────────────────────────────┤
│ General physician status    Login access control        │
│ - In practice or not?       - Can login to portal?      │
│ - Still working here?       - Account enabled?          │
│ - System visibility         - Authentication status     │
└─────────────────────────────────────────────────────────┘
```

---

## Column Definitions

### `is_active` (Existing - Unchanged)
**Purpose**: General physician status in the system
**Type**: `BOOLEAN`
**Values**:
- `true` = Physician is active in the practice
- `false` = Physician no longer with practice / removed

**Use Cases**:
- Filtering physicians in admin views
- Showing/hiding from staff selection dropdowns
- Tracking physician roster changes
- System-wide visibility control

### `account_status` (NEW)
**Purpose**: Login access control for doctor portal
**Type**: `TEXT`
**Values**:
- `'active'` = Can login to doctor portal
- `'inactive'` = Cannot login (not yet activated)
- `'pending'` = Has credentials but awaiting admin activation
- `'suspended'` = Temporarily blocked from logging in

**Use Cases**:
- Authentication checks during login
- Admin activation workflow
- Security (suspending accounts)
- Tracking account lifecycle

---

## Database Schema

### Migration Script
**File**: `scripts/122-add-account-status-column.sql`

```sql
-- Add new column
ALTER TABLE physicians 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'inactive' 
CHECK (account_status IN ('active', 'inactive', 'suspended', 'pending'));

-- Add index
CREATE INDEX IF NOT EXISTS idx_physicians_account_status 
ON physicians(account_status);

-- Set default based on existing data
UPDATE physicians 
SET account_status = CASE 
  WHEN email IS NOT NULL AND password_hash IS NOT NULL THEN 'pending'
  ELSE 'inactive'
END
WHERE account_status = 'inactive';
```

---

## Status Values Explained

### 1. `'inactive'` (Default)
**When**: Physician just added, no login credentials yet
**Can Login**: ❌ No
**Next Step**: Admin adds credentials OR doctor self-registers

**Example**:
```
Admin manually adds physician:
→ account_status = 'inactive'
→ No email/password yet
→ Cannot login
```

### 2. `'pending'`
**When**: Has email/password but not activated by admin
**Can Login**: ❌ No
**Next Step**: Admin clicks "Activate" button

**Example**:
```
Doctor self-registers:
→ account_status = 'pending'
→ Has email/password
→ Awaiting admin approval
→ Cannot login yet
```

### 3. `'active'`
**When**: Admin has activated the account
**Can Login**: ✅ Yes
**Next Step**: Doctor can login to portal

**Example**:
```
Admin clicks "Activate":
→ account_status = 'active'
→ Doctor can login ✅
→ Full portal access
```

### 4. `'suspended'`
**When**: Account temporarily blocked (security/admin action)
**Can Login**: ❌ No
**Next Step**: Admin must reactivate or investigate

**Example**:
```
Security concern detected:
→ account_status = 'suspended'
→ Login blocked immediately
→ Requires investigation
```

---

## Possible Combinations

| is_active | account_status | Meaning | Portal Access |
|-----------|----------------|---------|---------------|
| `true` | `'inactive'` | Active physician, no portal setup | ❌ No |
| `true` | `'pending'` | Active physician, awaiting activation | ❌ No |
| `true` | `'active'` | **Fully operational doctor** | ✅ Yes |
| `true` | `'suspended'` | Active physician, temporarily blocked | ❌ No |
| `false` | `'active'` | ⚠️ Left practice but can still login (cleanup needed) | ✅ Yes |
| `false` | `'inactive'` | Removed physician, no portal access | ❌ No |

---

## API Changes

### 1. Activation Endpoint
**File**: `app/api/physicians/[id]/activate/route.ts`

```typescript
// BEFORE
UPDATE physicians SET is_active = true

// AFTER
UPDATE physicians SET account_status = 'active'
```

### 2. Login Check
**File**: `app/api/auth/login/route.ts`

```typescript
// BEFORE
if (!data.is_active) {
  return error('Account inactive')
}

// AFTER
if (data.account_status !== 'active') {
  if (accountStatus === 'pending') {
    return error('Account pending activation')
  } else if (accountStatus === 'suspended') {
    return error('Account suspended')
  }
  return error('Account inactive')
}
```

### 3. Registration
**File**: `app/api/auth/register-doctor/route.ts`

```typescript
// BEFORE
is_active: false

// AFTER
account_status: 'pending'
```

### 4. Add Credentials
**File**: `app/api/physicians/[id]/add-credentials/route.ts`

```typescript
// BEFORE
if (activate) {
  updateData.is_active = true
}

// AFTER
if (activate) {
  updateData.account_status = 'active'
} else {
  updateData.account_status = 'pending'
}
```

---

## UI Changes

### 1. Interface Update
**File**: `app/physicians/page.tsx`

```typescript
interface Physician {
  // ... other fields
  accountStatus: "active" | "inactive" | "pending" | "suspended"
  // Note: is_active still exists but for different purpose
}
```

### 2. Data Transformation
```typescript
const transformedPhysicians = data.physicians.map((p: any) => ({
  // ... other fields
  accountStatus: p.account_status || 'inactive',
}))
```

### 3. Badge Display

```tsx
{physician.accountStatus === 'active' ? (
  <Badge className="bg-green-100 text-green-800">
    <CheckCircle /> Active
  </Badge>
) : physician.accountStatus === 'pending' ? (
  <Badge className="bg-yellow-100 text-yellow-800">
    <Clock /> Pending
  </Badge>
) : physician.accountStatus === 'suspended' ? (
  <Badge variant="destructive">
    <AlertTriangle /> Suspended
  </Badge>
) : (
  <Badge variant="secondary">
    <Clock /> Inactive
  </Badge>
)}
```

### 4. Button State

```tsx
<Button
  disabled={physician.accountStatus === 'active'}
  title={
    physician.accountStatus === 'active' 
      ? "Account already active" 
      : "Activate doctor account"
  }
>
  <CheckCircle />
</Button>
```

---

## Workflow Examples

### Scenario 1: Admin Adds Physician (No Credentials)
```
1. Admin adds physician manually
   is_active: true (active in practice)
   account_status: 'inactive' (no login yet)
   ↓
2. Admin clicks "Activate"
   → Modal appears: "Add Credentials"
   ↓
3. Admin enters email + password
   account_status: 'pending' → 'active'
   ↓
4. Doctor can login ✅
```

### Scenario 2: Doctor Self-Registers
```
1. Doctor signs up at /doctor-portal
   is_active: true (default)
   account_status: 'pending' (awaiting activation)
   ↓
2. Admin reviews and activates
   account_status: 'pending' → 'active'
   ↓
3. Doctor can login ✅
```

### Scenario 3: Physician Leaves Practice
```
1. Physician leaves practice
   is_active: true → false
   account_status: still 'active'
   ⚠️ Can still login!
   ↓
2. Admin deactivates account
   account_status: 'active' → 'inactive'
   ✅ Cannot login anymore
```

### Scenario 4: Security Suspension
```
1. Security issue detected
   account_status: 'active' → 'suspended'
   ❌ Login immediately blocked
   ↓
2. Investigation complete
   account_status: 'suspended' → 'active'
   ✅ Can login again
```

---

## Benefits of Separation

### 1. **Clear Responsibilities**
- `is_active` = Practice roster management
- `account_status` = Portal access control

### 2. **Independent Operations**
```
Can remove from practice WITHOUT affecting login
Can block login WITHOUT removing from practice
Can track both statuses separately
```

### 3. **Better Security**
```
Suspend account immediately: account_status = 'suspended'
No need to change practice status
Easy to reactivate later
```

### 4. **Clearer Audit Trail**
```sql
-- Who can login?
SELECT * FROM physicians WHERE account_status = 'active'

-- Who is in practice?
SELECT * FROM physicians WHERE is_active = true

-- Who is in practice but can't login?
SELECT * FROM physicians 
WHERE is_active = true AND account_status != 'active'
```

### 5. **More Granular States**
- Inactive (no credentials)
- Pending (has credentials, awaiting approval)
- Active (can login)
- Suspended (temporarily blocked)

---

## Testing

### Test Case 1: Fresh Installation
```sql
-- Run migration
\i scripts/122-add-account-status-column.sql

-- Verify column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'physicians' 
AND column_name = 'account_status';

-- Check default values
SELECT id, email, account_status FROM physicians;
```

### Test Case 2: Activation Flow
```bash
1. Go to /physicians page
2. Find physician with "Pending" or "Inactive" badge
3. Click "Activate" button
4. Verify: Badge changes to "Active"
5. Verify: Button becomes disabled
6. Check database:
   SELECT account_status FROM physicians WHERE id = '...'
   Should be 'active'
```

### Test Case 3: Login Check
```bash
1. Try to login with pending account
   → Error: "Account pending activation"

2. Try to login with inactive account
   → Error: "Account not activated"

3. Try to login with suspended account
   → Error: "Account suspended"

4. Try to login with active account
   → Success ✅
```

---

## Migration Checklist

- [x] Create migration SQL file (`122-add-account-status-column.sql`)
- [x] Update activation API endpoint
- [x] Update login API check
- [x] Update registration API
- [x] Update add-credentials API
- [x] Update frontend interface
- [x] Update data transformation
- [x] Update badge display
- [x] Update button logic
- [x] Test all flows
- [x] Document changes

---

## Summary

✅ **NEW Column**: `account_status` for login access control  
✅ **KEEPS**: `is_active` for general physician status  
✅ **4 States**: inactive, pending, active, suspended  
✅ **Clear Separation**: Practice status vs Portal access  
✅ **Better Security**: Independent suspension capability  

**Key Concept**: 
- `is_active` = "Are they in our practice?"
- `account_status` = "Can they login to our portal?"

These are now **completely independent**! ✨

