# 🧪 How to Test Authorization → Referral Sync

## ⚠️ Important Note

The COLES, PHYLLIS referral is stuck because the authorization was approved **BEFORE** the sync code was added. The sync only works for NEW approvals.

---

## ✅ How to Test Properly

### Option 1: Test with James Wilson (Still Pending)

```
1. Go to Authorization Tracking tab
2. Find "James Wilson" authorization (should be "pending")
3. Click "Mark Approved"
4. Check browser console (F12) for logs
5. ✅ Should see detailed sync logs
6. Go back to Referral Processing tab
7. Click "Refresh" button
8. ✅ James Wilson should now be in "Approved" tab!
```

---

### Option 2: Create a NEW Referral and Test

```
STEP 1: Create New Referral
├─ Go to Referral Processing tab
├─ Scroll to "Manual Referral Entry"
├─ Fill in:
│  ├─ Patient Name: "Test Patient"
│  ├─ Insurance: "Medicare"
│  ├─ Insurance ID: "TEST123"
│  └─ Diagnosis: "Test diagnosis"
└─ Click "Submit Referral"

STEP 2: Request Authorization
├─ Find "Test Patient" in New Referrals tab
├─ Click "Request Prior Auth"
└─ ✅ Authorization created, Referral status → "Pending Auth"

STEP 3: Approve Authorization
├─ Go to Authorization Tracking tab
├─ Find "Test Patient" authorization
├─ Click "Mark Approved"
└─ ✅ Check console for sync logs

STEP 4: Verify Sync
├─ Go back to Referral Processing tab
├─ Click "Refresh"
└─ ✅ "Test Patient" should be in "Approved" tab!
```

---

## 🔍 What to Look For in Console

When you click "Mark Approved", you should see:

```bash
=== Updating authorization ===
✅ Authorization updated successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 [INTEGRATION] Authorization status changed - updating linked referral
   Authorization ID: [id]
   Linked Referral ID: [referral-id]
   Authorization Status: approved
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Updating referral to status: Approved

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [INTEGRATION] Referral status updated successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Referral ID: [id]
👤 Patient: [name]
📊 Authorization Status: approved
📊 Referral Old Status: Pending Auth
📊 Referral New Status: Approved
🕐 Updated At: [timestamp]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Referral now visible in correct tab!
🔄 Please refresh Referral Processing tab to see changes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Fix COLES, PHYLLIS Manually

Since COLES, PHYLLIS was approved before the sync was added, you need to manually update it:

### Option A: Database Update (If you have Supabase access)

```sql
UPDATE referrals 
SET status = 'Approved', updated_at = NOW()
WHERE patient_name = 'COLES, PHYLLIS';
```

### Option B: Re-Approve in UI

```
1. Go to Authorization Tracking
2. Find COLES, PHYLLIS
3. Click to change status back to "pending"
4. Click "Mark Approved" again
5. ✅ This time the sync will trigger!
```

---

## 🎯 Quick Test Summary

### Test the Sync is Working:

1. **Use James Wilson** (still pending) OR create a new referral
2. **Request Prior Auth** (if new referral)
3. **Go to Authorization Tracking** → Mark Approved
4. **Check console logs** → Should see integration messages
5. **Refresh Referral Processing** → Should see in Approved tab

### Expected Result:

```
BEFORE:
  Authorization: "pending"
  Referral: "Pending Auth"

AFTER (Click "Mark Approved"):
  Authorization: "approved" ✅
  Referral: "Approved" ✅ (AUTOMATIC!)
```

---

## ⚠️ Why COLES, PHYLLIS Didn't Update

**Timeline:**
```
1. You requested prior auth for COLES, PHYLLIS
2. Authorization created with status "pending"
3. Referral status changed to "Pending Auth" ✅
4. You marked authorization as "approved"
5. ❌ Sync code didn't exist yet - no referral update
6. I added the sync code
7. But COLES, PHYLLIS authorization is already "approved"
8. Sync only triggers on STATUS CHANGE, not existing approved auths
```

**Solution:** Test with a NEW authorization approval (James Wilson or new test patient)

---

## 🔄 How to Refresh to See Changes

After marking authorization as approved:

### Method 1: Click Refresh Button
```
Referral Processing tab → Click "🔄 Refresh" button
```

### Method 2: Switch Tabs
```
Switch away from Referral Processing → Switch back
```

### Method 3: Reload Page
```
Press F5 or Ctrl+R
```

---

**Klaro na? Test with James Wilson or a new referral to see the sync working! COLES, PHYLLIS is stuck because it was approved before the sync code existed.** 🎯

