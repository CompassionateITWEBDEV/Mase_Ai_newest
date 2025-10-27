# Reject Button - Hidden After Rejection ✅

## ✅ Confirmation: Already Working!

The reject button is **already hidden** after the employer rejects an applicant. You can only reject once!

---

## 💾 Database-Driven (NOT Hardcoded)

The reject button visibility is based on the `status` field in the database:

```sql
-- After employer clicks reject
UPDATE job_applications 
SET 
  status = 'rejected',  ← DATABASE UPDATED!
  updated_at = NOW()
WHERE id = '<application_id>';
```

---

## 🎯 Current Logic

### **Reject Button is HIDDEN when:**

```typescript
{!(application.status === 'pending' && application.is_accepted) && 
 application.status !== 'rejected' &&      // ← HIDDEN when rejected!
 application.status !== 'accepted' && 
 application.status !== 'hired' && (
  <Button onClick={reject}>Reject</Button>
)}
```

### **What Gets Hidden:**

1. ❌ **When `status = 'rejected'`** ← Can only reject ONCE!
2. ❌ **When `status = 'accepted'`**
3. ❌ **When `status = 'hired'`**
4. ❌ **When `status = 'pending'` AND `is_accepted = true`** (already accepted)

---

## 📊 Complete Reject Flow

### **Step 1: Employer Clicks Reject**
```
Status: pending (or reviewing)
Reject Button: ✅ VISIBLE
        ↓
Click "Reject"
        ↓
Confirmation: "Are you sure?"
        ↓
Click "Yes"
```

### **Step 2: Status Updates in Database**
```sql
UPDATE job_applications 
SET status = 'rejected'  -- Updated in database!
WHERE id = '<id>';
```

### **Step 3: Reject Button HIDDEN**
```
Status: rejected
Reject Button: ❌ HIDDEN (completely removed from DOM)
```

### **Step 4: Persists Across Reloads**
```
Page reloads
        ↓
Loads from database
        ↓
status = 'rejected'
        ↓
Reject Button: ❌ Still HIDDEN (from database!)
```

---

## 🧪 Verify It Works

### **Test:**

1. **Click "Reject" on an application**
   - Confirm dialog appears
   - Click "Yes"

2. **Check Database:**
   ```sql
   SELECT status 
   FROM job_applications 
   WHERE id = '<application_id>';
   ```
   - Should show: `status = 'rejected'`

3. **Check UI:**
   - Reject button: ❌ **GONE** (not visible)
   - Status badge: Shows "Rejected" (red)
   - Other buttons: Hidden as well

4. **Reload page:**
   - Reject button: Still ❌ **GONE**
   - Cannot reject again (from database)

---

## 📋 Button States Summary

| Status | Reject Button | Reason |
|--------|---------------|--------|
| pending (not accepted) | ✅ Visible | Can reject |
| pending (accepted) | ❌ Hidden | Already accepted |
| reviewing | ✅ Visible | Can reject |
| interview_scheduled | ✅ Visible | Can still reject |
| **rejected** | ❌ **Hidden** | **Already rejected (once only!)** |
| accepted | ❌ Hidden | Already hired |
| hired | ❌ Hidden | Already hired |

---

## ✅ Summary

### **Reject Button Behavior:**

1. ✅ **Visible** before acceptance/rejection
2. ✅ **Hidden** after acceptance
3. ✅ **Hidden** after rejection ← **Once only!**
4. ✅ **Hidden** when hired
5. ✅ **Based on database** `status` field
6. ✅ **Persists** across reloads

### **Database Tracking:**
- ✅ Column: `status` (TEXT)
- ✅ Updated to `'rejected'` when rejected
- ✅ Used to hide reject button
- ✅ Persists in Supabase
- ✅ **Cannot reject twice** (status already 'rejected')

---

## 🎯 Answer to Your Question

**"Once ra man pwede mo reject og applicant?"**

YES! The reject button is hidden after rejection (based on database). Employer can only reject once because:

1. First rejection → Status = `'rejected'` in database
2. Reject button checks: `application.status !== 'rejected'`
3. Button not rendered → **Hidden**
4. **Cannot click reject again** (button doesn't exist)
5. Status persists in database

**It's from the database, not hardcoded!** ✅

---

**Status:** ✅ Already working  
**Database:** ✅ Tracks rejection status  
**Hidden after rejection:** ✅ YES  
**Can only reject once:** ✅ YES

