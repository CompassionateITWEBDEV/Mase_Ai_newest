# ✅ STAFF TABLE ONLY - ASSIGNMENTS FEATURE

## Current Implementation (FINAL)

### Assignment Tab Employee List
**Source**: `app/api/employees/list/route.ts`

```typescript
// Get ONLY active staff members from staff table (not hired applicants)
// This prevents duplicates when same person exists in both tables
const { data: staffList, error: staffError } = await supabase
  .from('staff')
  .select('id, name, email, role_id, department, credentials')
  .eq('is_active', true)
  .order('name', { ascending: true })
```

### What This Means:
- ✅ **STAFF TABLE ONLY** - Pure staff members
- ✅ **NO HIRED APPLICANTS** included
- ✅ **NO DUPLICATES** possible
- ✅ Only shows `is_active = true` staff

### Employee Progress Tab (Different!)
**Source**: `app/api/in-service/employee-progress/route.ts`

This tab DOES combine staff + hired applicants because:
- Need to track ALL enrolled employees (including those who joined as applicants)
- Uses deduplication to prevent showing same person twice
- Shows training progress for everyone

---

## Why Different Logic?

### Assignment Tab = Staff Only
- Admins assign training to **current staff members**
- Clean, simple list from `staff` table
- No confusion about who is "active staff"

### Progress Tab = Staff + Hired Applicants
- Need to see progress for **everyone enrolled** in training
- Includes people who may have started as applicants but are now hired
- Historical data preservation

---

## Database Schema

### Staff Table
```
- id (UUID)
- name (TEXT)
- email (TEXT)
- role_id (TEXT)
- department (TEXT)
- credentials (TEXT)
- is_active (BOOLEAN) <- Only TRUE are shown
```

### What's NOT Included in Assignment Dropdown:
- ❌ Applicants table
- ❌ Hired applicants
- ❌ Inactive staff (is_active = false)
- ❌ Duplicates

---

## Verification

Run this SQL to confirm:
```sql
-- This is EXACTLY what the API returns
SELECT id, name, email, role_id, department, credentials
FROM staff
WHERE is_active = true
ORDER BY name;
```

If you see 5 employees in the assignment dropdown, it means:
- You have **5 active staff** in the `staff` table
- **ZERO hired applicants** are included
- This is **CORRECT BEHAVIOR** ✅

---

## Summary

| Feature | Data Source | Includes Applicants? |
|---------|-------------|---------------------|
| **Assignment Tab** | `staff` table only | ❌ NO |
| **Employee Progress Tab** | `staff` + hired applicants | ✅ YES (with deduplication) |

✅ **Assignment dropdown = 100% STAFF TABLE ONLY**

