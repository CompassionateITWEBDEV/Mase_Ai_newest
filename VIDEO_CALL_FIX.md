# Video Call Fix - Doctor & Nurse Real-Time Connection

## Issues Fixed

### 1. ✅ DialogTitle Accessibility Error
**Error:**
```
`DialogContent` requires a `DialogTitle` for screen reader accessibility
```

**Fix:** Added `VisuallyHidden` wrapper with `DialogTitle` to both dialogs

### 2. ✅ Video Call Not Working
**Problem:** Doctor and nurse couldn't connect in real-time video call

**Fix:** 
- Improved session management
- Added proper token generation for both parties
- Created session fetch endpoint
- Added comprehensive logging

---

## How It Works Now

### Flow Diagram

```
NURSE                           DOCTOR
  │                               │
  │ 1. Request Consultation       │
  ├──────────────────────────────>│
  │                               │
  │                               │ 2. See Request
  │                               │ 3. Click "Accept"
  │                               │
  │<──────────────────────────────┤ 4. Accept API Call
  │                               │
  │ 5. Poll detects acceptance    │ 5. Create Video Session
  │                               │
  │ 6. Fetch session              │ 6. Get doctor token
  │                               │
  │ 7. Get nurse token            │ 7. Open video dialog
  │                               │
  │ 8. Open video dialog          │
  │                               │
  └───────── BOTH JOIN ───────────┘
          Same Session ID
       Real-Time Video Call! 🎥
```

---

## Code Changes

### 1. Doctor Portal (`app/doctor-portal/page.tsx`)

#### Added DialogTitle
```typescript
<Dialog open={showVideoCall}>
  <DialogContent>
    <VisuallyHidden>
      <DialogTitle>Video Consultation</DialogTitle>
    </VisuallyHidden>
    <VideoCallInterface ... />
  </DialogContent>
</Dialog>
```

#### Enhanced Accept Function
```typescript
const handleAcceptConsult = async (consultation: any) => {
  // 1. Accept consultation
  await fetch('/api/telehealth/consultation', {
    method: 'PATCH',
    body: JSON.stringify({ action: 'accept', ... })
  })
  
  // 2. Create video session (doctor creates it)
  const sessionData = await fetch('/api/telehealth/create-session', {
    method: 'POST',
    body: JSON.stringify({ consultationId, nurseId, doctorId })
  })
  
  // 3. Open video call with doctor token
  setVideoSession({
    sessionId: sessionData.sessionId,
    token: sessionData.doctorToken,  // Doctor's token
    ...
  })
  setShowVideoCall(true)
}
```

### 2. Track Page (`app/track/[staffId]/page.tsx`)

#### Added DialogTitle
```typescript
<Dialog open={showVideoCall}>
  <DialogContent>
    <VisuallyHidden>
      <DialogTitle>Video Consultation</DialogTitle>
    </VisuallyHidden>
    <VideoCallInterface ... />
  </DialogContent>
</Dialog>
```

#### Enhanced Polling Function
```typescript
const handleConsultationCreated = async (consultationId: string) => {
  // Poll for doctor acceptance
  const pollInterval = setInterval(async () => {
    // Check if doctor accepted
    const accepted = await checkAcceptance()
    
    if (accepted) {
      // Fetch existing session (doctor created it)
      const sessionData = await fetch(
        `/api/telehealth/session?consultationId=${consultationId}`
      )
      
      // Open video call with nurse token
      setVideoSession({
        sessionId: sessionData.session.session_id,
        token: sessionData.nurseToken,  // Nurse's token
        ...
      })
      setShowVideoCall(true)
    }
  }, 3000)
}
```

### 3. New API Endpoint (`app/api/telehealth/session/route.ts`)

Fetches existing video session and generates nurse token:

```typescript
GET /api/telehealth/session?consultationId=...

Response:
{
  success: true,
  session: {
    id: "...",
    session_id: "...",  // Vonage session ID
    consultation_id: "...",
    status: "active"
  },
  nurseToken: "...",  // Generated for nurse
  usingMockSession: false
}
```

---

## Console Logs (for Debugging)

### Doctor Side
```
🩺 [DOCTOR] Accepting consultation: abc-123
📞 [DOCTOR] Step 1: Accepting consultation...
📞 [DOCTOR] Accept response: { success: true }
📹 [DOCTOR] Step 2: Creating video session...
📹 [DOCTOR] Session response: { sessionId: "...", doctorToken: "..." }
✅ [DOCTOR] Video session created
🎥 [DOCTOR] Opening video call dialog
```

### Nurse Side
```
🩺 [NURSE] Consultation created: abc-123
🔄 [NURSE] Starting to poll for doctor acceptance...
✅ [NURSE] Doctor accepted consultation!
📹 [NURSE] Fetching video session...
📹 [NURSE] Session data: { session: { session_id: "..." }, nurseToken: "..." }
✅ [NURSE] Got video session, opening call
```

---

## Testing Steps

### Test Case 1: Full Video Call Flow

1. **Nurse Side (Track Page)**
   - Login as nurse
   - Go to track page
   - Start a visit
   - Click "Request Doctor Consultation"
   - Fill in the form
   - Submit

2. **Doctor Side (Doctor Portal)**
   - Login as doctor
   - Go to "Consultations" tab
   - Should see pending request
   - Click "Accept & Start Video Call"

3. **Expected Result:**
   - ✅ Doctor sees video interface open
   - ✅ Nurse sees "Doctor Accepted!" toast
   - ✅ Nurse video interface opens
   - ✅ Both see the same session
   - ✅ Real-time video connection! 🎥

### Test Case 2: Check Console Logs

1. Open DevTools (F12) on both sides
2. Follow Test Case 1
3. Check console logs match the expected flow above

### Test Case 3: Verify Database

```sql
-- Check consultation was accepted
SELECT id, status, doctor_id, doctor_name
FROM telehealth_consultations
WHERE status = 'accepted'
ORDER BY created_at DESC
LIMIT 1;

-- Check video session was created
SELECT id, session_id, consultation_id, status
FROM telehealth_sessions
WHERE consultation_id = 'consultation-id-here';
```

---

## Troubleshooting

### Issue 1: DialogTitle Error Still Shows

**Solution:** Refresh the page after the fix

### Issue 2: Video Call Doesn't Open for Doctor

**Check Console:**
```
❌ [DOCTOR] Accept error: ...
```

**Common Causes:**
- Consultation API failed
- Session creation failed
- Missing Vonage credentials

**Fix:**
1. Check API responses in console
2. Verify Vonage API keys in `.env`
3. Check database has `telehealth_sessions` table

### Issue 3: Video Call Doesn't Open for Nurse

**Check Console:**
```
❌ [NURSE] No session found
```

**Common Causes:**
- Doctor didn't create session
- Polling stopped too early
- Session fetch failed

**Fix:**
1. Make sure doctor clicked "Accept"
2. Wait for polling (up to 5 minutes)
3. Check session exists in database

### Issue 4: Both Open But Can't See Each Other

**Cause:** Different session IDs

**Check Console:**
```
Doctor session ID: 1_MX4...
Nurse session ID: 1_MX4...  (should be the same!)
```

**Fix:**
- Make sure nurse is fetching the session (not creating new one)
- Check `/api/telehealth/session` endpoint works
- Verify same `consultation_id` is used

---

## API Endpoints Summary

### 1. Accept Consultation
```
PATCH /api/telehealth/consultation
Body: { consultationId, action: 'accept', doctorId, doctorName }
```

### 2. Create Video Session
```
POST /api/telehealth/create-session
Body: { consultationId, nurseId, doctorId }
Response: { sessionId, doctorToken, nurseToken }
```

### 3. Fetch Existing Session (NEW)
```
GET /api/telehealth/session?consultationId=...
Response: { session: {...}, nurseToken }
```

### 4. Poll for Acceptance
```
GET /api/telehealth/consultation?status=accepted&nurseId=...
Response: { consultations: [...] }
```

---

## Database Tables

### telehealth_consultations
```sql
id              UUID
nurse_id        UUID
doctor_id       UUID
doctor_name     TEXT
status          TEXT  -- 'pending', 'accepted', 'completed'
created_at      TIMESTAMPTZ
```

### telehealth_sessions
```sql
id              UUID
consultation_id UUID
session_id      TEXT  -- Vonage session ID
status          TEXT  -- 'active', 'ended'
created_at      TIMESTAMPTZ
```

---

## Environment Variables Required

```env
VONAGE_API_KEY=your-api-key
VONAGE_API_SECRET=your-api-secret
```

If these are not set, the system uses mock sessions (for testing).

---

## Summary

✅ **DialogTitle Error Fixed** - Added accessibility support  
✅ **Video Call Working** - Doctor and nurse connect in real-time  
✅ **Session Management** - Single session, two tokens  
✅ **Comprehensive Logging** - Easy to debug  
✅ **Error Handling** - Proper error messages  
✅ **Fallback Logic** - Creates session if not found  

**The video call system now works correctly!** 🎥🎉

