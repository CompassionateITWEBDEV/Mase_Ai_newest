# Fix: Availability Mode Check Constraint Error

## Problem

Error when toggling doctor availability:
```
Error: new row for relation "physicians" violates check constraint 
"physicians_availability_mode_check"
```

---

## Root Cause

The database has a CHECK constraint on `availability_mode`:

```sql
availability_mode TEXT CHECK (availability_mode IN ('immediate', 'scheduled', 'both'))
```

But the component was using different values:
- ❌ `'within-5min'` (not allowed)
- ❌ `'within-15min'` (not allowed)

---

## Solution

Updated the component to use the correct values:

### Before (Wrong)
```typescript
<SelectItem value="immediate">Immediate Response</SelectItem>
<SelectItem value="within-5min">Within 5 minutes</SelectItem>
<SelectItem value="within-15min">Within 15 minutes</SelectItem>
```

### After (Correct)
```typescript
<SelectItem value="immediate">Immediate - Accept consultations now</SelectItem>
<SelectItem value="scheduled">Scheduled - Only pre-scheduled appointments</SelectItem>
<SelectItem value="both">Both - Immediate and scheduled</SelectItem>
```

---

## Database Constraint

The `physicians` table has this constraint:

```sql
ALTER TABLE physicians 
ADD COLUMN IF NOT EXISTS availability_mode TEXT DEFAULT 'immediate' 
CHECK (availability_mode IN ('immediate', 'scheduled', 'both'))
```

**Valid values ONLY:**
1. `'immediate'` - Accept urgent consultations immediately
2. `'scheduled'` - Only accept pre-scheduled appointments
3. `'both'` - Accept both immediate and scheduled

---

## API Validation

Added validation in the API to prevent invalid values:

```typescript
const validModes = ['immediate', 'scheduled', 'both']
const mode = availabilityMode || 'immediate'

if (!validModes.includes(mode)) {
  return NextResponse.json({ 
    error: `Invalid availability mode. Must be one of: ${validModes.join(', ')}` 
  }, { status: 400 })
}
```

---

## What Each Mode Means

### 1. Immediate (Default)
- Doctor is available RIGHT NOW
- Can accept urgent telehealth consultations
- Highest priority in doctor matching
- Best for emergency situations

**Use case:** Doctor is at computer, ready to join video call immediately

### 2. Scheduled
- Only accepts pre-scheduled appointments
- Won't receive urgent consultation requests
- Patients must book in advance

**Use case:** Doctor has scheduled clinic hours, no walk-ins

### 3. Both
- Accepts immediate urgent consultations
- Also accepts scheduled appointments
- Most flexible option

**Use case:** Doctor wants to maximize availability

---

## Testing

1. **Login to doctor portal**
2. **Go to Availability tab**
3. **Toggle availability ON**
4. **Change mode dropdown:**
   - Select "Immediate" ✅
   - Select "Scheduled" ✅
   - Select "Both" ✅
5. **Should work without errors now!**

---

## Console Logs

After fix, you should see:
```
🔄 [AVAILABILITY] Updating availability: { 
  doctorId: "...", 
  isAvailable: true, 
  availabilityMode: "immediate" 
}
✅ [AVAILABILITY] Updated successfully
```

---

## Database Query to Verify

```sql
-- Check allowed values
SELECT column_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'physicians_availability_mode_check';

-- Verify doctor's mode
SELECT email, is_available, availability_mode
FROM physicians
WHERE email = 'doctor@example.com';

-- Update manually if needed
UPDATE physicians
SET availability_mode = 'immediate'
WHERE availability_mode NOT IN ('immediate', 'scheduled', 'both');
```

---

## Summary

✅ **Component Updated** - Uses correct values  
✅ **API Validation** - Rejects invalid modes  
✅ **Database Constraint** - Enforces valid values  
✅ **Error Fixed** - No more check constraint violations  

**The availability mode now works correctly!** 🎉

