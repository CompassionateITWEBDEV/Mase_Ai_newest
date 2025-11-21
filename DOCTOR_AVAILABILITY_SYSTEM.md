# Doctor Availability System - Now Functional!

## Overview

The doctor availability status is now **fully functional** and connected to the database. Doctors can toggle their online/offline status and it persists across sessions.

---

## Features Implemented

### 1. Database Integration ✅
- Availability status stored in `physicians` table
- Real-time updates when status changes
- Persists across browser sessions

### 2. Availability Toggle ✅
- Switch between Available/Offline
- Updates database immediately
- Shows loading state while saving
- Toast notifications on success/error

### 3. Availability Modes ✅
- Immediate Response
- Within 5 minutes
- Within 15 minutes
- Saved to database with each change

### 4. Auto-Load Status ✅
- Loads current status from database on page load
- Uses doctor ID from localStorage
- Shows loading spinner while fetching

---

## Database Schema

The `physicians` table has these fields:

```sql
CREATE TABLE physicians (
  id UUID PRIMARY KEY,
  email TEXT,
  name TEXT,
  
  -- Availability fields
  is_available BOOLEAN DEFAULT false,
  availability_mode TEXT DEFAULT 'immediate',
  telehealth_enabled BOOLEAN DEFAULT true,
  
  -- Other fields...
  updated_at TIMESTAMPTZ
);
```

---

## API Endpoints

### GET /api/doctors/availability

Fetch doctor's current availability status.

**Query Parameters:**
- `doctorId` (required): Doctor's UUID

**Response:**
```json
{
  "success": true,
  "availability": {
    "isAvailable": true,
    "availabilityMode": "immediate",
    "telehealthEnabled": true
  }
}
```

### POST /api/doctors/availability

Update doctor's availability status.

**Request Body:**
```json
{
  "doctorId": "doctor-uuid",
  "isAvailable": true,
  "availabilityMode": "immediate"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Availability status updated to Available",
  "availability": {
    "isAvailable": true,
    "availabilityMode": "immediate"
  }
}
```

---

## Component Flow

### EnhancedAvailabilityToggle Component

```
1. Component Mounts
   ↓
2. Load doctor ID from localStorage
   ↓
3. Fetch current availability from API
   ↓
4. Display current status
   ↓
5. User toggles switch
   ↓
6. Update local state
   ↓
7. Call API to save to database
   ↓
8. Show toast notification
   ↓
9. On error: Revert state
```

---

## Data Flow

### On Page Load

```
localStorage → currentUser → doctor.id
                    ↓
        GET /api/doctors/availability?doctorId=...
                    ↓
              Database Query
                    ↓
        SELECT is_available, availability_mode
        FROM physicians
        WHERE id = doctorId
                    ↓
           Update UI State
```

### On Toggle Change

```
User clicks switch → setIsAvailable(true)
                           ↓
      POST /api/doctors/availability
      { doctorId, isAvailable: true }
                           ↓
           Database Update
                           ↓
      UPDATE physicians
      SET is_available = true
      WHERE id = doctorId
                           ↓
        Toast Notification
```

---

## How to Use

### For Doctors

1. **Login to Doctor Portal**
   - Go to `/doctor-portal`
   - Login with your credentials

2. **Access Availability Tab**
   - Click on "Availability" tab
   - You'll see your current status

3. **Toggle Availability**
   - Click the switch to go online/offline
   - Status saves automatically to database
   - You'll see a confirmation toast

4. **Set Response Time**
   - When online, choose your availability mode:
     - Immediate Response
     - Within 5 minutes
     - Within 15 minutes
   - Saves automatically

### Status Indicators

| Badge | Meaning | Description |
|-------|---------|-------------|
| 🟢 Available | Online | Ready for consultations |
| ⚫ Offline | Offline | Not receiving requests |
| 🔄 Loader | Saving | Updating status |

---

## Console Logs (for Debugging)

The system logs all actions to the console:

```
✅ [AVAILABILITY] Doctor ID loaded: abc-123
✅ [AVAILABILITY] Loaded from database: { isAvailable: true }
🔄 [AVAILABILITY] Updating to: true immediate
✅ [AVAILABILITY] Updated successfully
```

**Server-side logs:**
```
✅ [AVAILABILITY] Fetched availability for doctor: abc-123
🔄 [AVAILABILITY] Updating availability: { isAvailable: true }
✅ [AVAILABILITY] Updated successfully for doctor: abc-123
```

---

## Error Handling

### 1. Not Logged In
- Shows: "Please login to manage your availability"
- Solution: Login to doctor portal first

### 2. Database Error
- Toast: "Update Failed - [error message]"
- State reverts to previous value
- Check console for details

### 3. No Doctor ID
- Component won't show toggle
- Message: "Please login first"

---

## Testing

### Test Case 1: Toggle Availability

1. Login to doctor portal
2. Go to Availability tab
3. Click the switch to go online
4. Check:
   - ✅ Badge changes to "Available"
   - ✅ Toast shows "Availability Updated"
   - ✅ Green indicator appears
   - ✅ Console shows success log

5. Refresh the page
6. Check:
   - ✅ Status is still "Available"
   - ✅ Database persisted the change

### Test Case 2: Change Availability Mode

1. Make sure you're available (online)
2. Change dropdown from "Immediate" to "Within 5 minutes"
3. Check:
   - ✅ Selection updates
   - ✅ Toast shows update
   - ✅ Database saves new mode

4. Refresh page
5. Check:
   - ✅ Mode is still "Within 5 minutes"

### Test Case 3: Database Persistence

1. Open database (Supabase)
2. Run query:
```sql
SELECT id, email, is_available, availability_mode
FROM physicians
WHERE email = 'your-doctor-email@example.com';
```

3. Toggle availability in UI
4. Run query again
5. Verify `is_available` changed

---

## Integration with Consultation System

When a nurse requests a consultation, the system:

1. **Checks doctor availability**
```sql
SELECT * FROM physicians
WHERE is_available = true
AND telehealth_enabled = true
AND account_status = 'active'
ORDER BY availability_mode, total_consultations
LIMIT 1
```

2. **Filters by response time**
- Immediate → Prioritized first
- Within 5 min → Second priority
- Within 15 min → Third priority

3. **Sends request to available doctor**
- Consultation appears in doctor's "Pending Requests"
- Doctor receives notification

---

## Future Enhancements

### 1. Auto-Offline Timer
- Automatically set to offline after X hours of inactivity
- Prevent doctors from forgetting to go offline

### 2. Schedule-Based Availability
- Set specific hours/days when available
- Auto-toggle based on schedule

### 3. Notifications
- Send push notification when going offline
- Reminder if online for too long

### 4. Analytics
- Track online hours
- Average response time
- Acceptance rate

---

## Troubleshooting

### Issue: Status doesn't persist

**Check:**
```sql
SELECT is_available FROM physicians WHERE id = 'your-id';
```

**Fix:** Make sure API calls are succeeding (check console)

### Issue: "Please login first" message

**Cause:** No doctor ID in localStorage

**Fix:**
1. Logout and login again
2. Check console for login errors
3. Verify localStorage has `currentUser`

### Issue: Can't toggle switch

**Cause:** `isSaving` is stuck or doctor not found

**Fix:**
1. Refresh page
2. Check if doctor exists in database
3. Verify doctor has `is_active = true`

---

## SQL Commands

### Check doctor availability
```sql
SELECT id, email, is_available, availability_mode, updated_at
FROM physicians
WHERE email = 'doctor@example.com';
```

### Manually set availability
```sql
UPDATE physicians
SET is_available = true,
    availability_mode = 'immediate'
WHERE email = 'doctor@example.com';
```

### Find available doctors
```sql
SELECT email, is_available, availability_mode
FROM physicians
WHERE is_available = true
AND telehealth_enabled = true;
```

---

## Summary

✅ **Database Connected**: Status saved to `physicians` table  
✅ **Auto-Load**: Loads current status on page load  
✅ **Real-Time Updates**: Saves immediately when toggled  
✅ **Error Handling**: Reverts on error, shows toasts  
✅ **Persistence**: Status survives page refresh  
✅ **Logging**: Full console logs for debugging  

**The availability system is now fully functional!** 🎉

