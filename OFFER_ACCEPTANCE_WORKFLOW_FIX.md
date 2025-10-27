# Offer Acceptance Workflow - Fixed

## Problem
When an applicant accepted a job offer, it was automatically marking them as hired (status: 'accepted'). This bypassed the employer's ability to review and confirm the hiring decision.

## Solution
Changed the workflow so that:
1. **Applicant accepts offer** → Status changes to `'offer_accepted'` (pending employment)
2. **Employer reviews** → Employer can see the "Mark as Hired" button
3. **Employer clicks "Mark as Hired"** → Status changes to `'accepted'` (final hired status)

---

## Changes Made

### 1. Applicant Dashboard - Offer Acceptance

**File:** `app/applicant-dashboard/page.tsx`

#### Updated `handleAcceptOffer` Function (Line ~1303)
**Before:**
```typescript
status: 'accepted'  // ❌ Auto-hired
```

**After:**
```typescript
status: 'offer_accepted'  // ✅ Pending employer confirmation
```

**Alert Message Updated:**
- Changed from: "Offer accepted successfully!"
- Changed to: "Offer accepted successfully! Waiting for employer confirmation."

---

### 2. Applicant Dashboard - Status Display

Added support for displaying `offer_accepted` status throughout the applicant dashboard:

#### a) Application Card Colors (Line ~2508)
```typescript
application.status === 'offer_accepted' ? 'bg-emerald-50 border-emerald-200' :
```

#### b) Status Badge Display (Line ~1934)
```typescript
application.status === 'offer_accepted' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
```

Badge text: **"Offer Accepted"**

#### c) New Status Section (Line ~2666)
Added dedicated display for `offer_accepted` status:
```typescript
{application.status === 'offer_accepted' && (
  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
    <div className="flex items-center space-x-2">
      <CheckCircle className="h-4 w-4 text-emerald-600" />
      <span className="text-sm font-medium text-emerald-800">Offer Accepted - Pending Employment</span>
    </div>
    <Button ... onClick={...}>
      View Details
    </Button>
  </div>
)}
```

#### d) Updated "Accepted" Status Message
Changed from "Application Accepted" to **"Hired! Welcome to the team!"** to differentiate from pending employment.

#### e) Statistics Metric (Line ~1614)
Added tracking for accepted offers:
```typescript
offersAccepted: applications.filter(app => app.status === 'offer_accepted').length,
```

#### f) Modal Badge Display (Line ~4413)
```typescript
selectedApplication.status === 'offer_accepted' ? 'bg-emerald-100 text-emerald-800' :
```

Badge text: **"Offer Accepted"**

---

## Complete Workflow

```
┌─────────────────────────┐
│  1. Employer sends      │
│     job offer           │
└───────────┬─────────────┘
            │
            ↓ status: 'offer_received'
┌─────────────────────────┐
│  2. Applicant accepts   │
│     offer               │
└───────────┬─────────────┘
            │
            ↓ status: 'offer_accepted'
            │ (Pending Employment)
            │
            ┌──────────────────────────────────────────┐
            │ Applicant sees:                          │
            │ "Offer Accepted - Pending Employment"    │
            │ (Emerald badge)                          │
            └──────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────┐
│  3. Employer Dashboard                               │
│     - Sees status: "Offer Accepted"                  │
│     - "Mark as Hired" button appears                 │
│     - Employer clicks button                         │
└───────────┬──────────────────────────────────────────┘
            │
            ↓ status: 'accepted'
            │ (FINAL: Hired!)
            │
            ┌──────────────────────────────────────────┐
            │ Applicant sees:                          │
            │ "Hired! Welcome to the team!"            │
            │ (Green badge)                            │
            └──────────────────────────────────────────┘
```

---

## Status Flow Summary

| Step | Status | Who Sees It | Description |
|------|--------|-------------|-------------|
| **Initial** | `pending` | Both | Application under review |
| **Interview** | `interview_scheduled` | Both | Interview scheduled |
| **Offer Sent** | `offer_received` | Applicant | Employer sent offer |
| **Offer Accepted** | `offer_accepted` | Both | **NEW:** Applicant accepted, pending employment confirmation |
| **Hired** | `accepted` | Both | **FINAL:** Employer confirmed - Employee is hired! |

---

## Key Differences

### Before (❌ Incorrect):
- Applicant accepts → Immediately `accepted` (hired)
- No employer confirmation step
- Bypasses hiring decision process

### After (✅ Correct):
- Applicant accepts → `offer_accepted` (pending)
- Employer must review and click "Mark as Hired"
- Final status → `accepted` (hired)
- Proper hiring workflow with confirmation

---

## Employer Dashboard Features

The "Mark as Hired" button:
- Appears when status is `offer_accepted`
- Changes status to `accepted` (final hired status)
- Located in both:
  - Application list view (compact)
  - Application detail modal (full view)
- Styled in emerald green to indicate positive action

---

## Testing Checklist

- [ ] Applicant can accept offer
- [ ] Status changes to `offer_accepted` after acceptance
- [ ] Applicant sees "Offer Accepted - Pending Employment" message
- [ ] Employer sees "Offer Accepted" badge
- [ ] "Mark as Hired" button appears in employer dashboard
- [ ] Employer can click "Mark as Hired"
- [ ] Status changes to `accepted` after employer action
- [ ] Applicant sees "Hired! Welcome to the team!" message
- [ ] Badge colors display correctly (emerald for pending, green for hired)
- [ ] Statistics track offers accepted correctly

---

## Files Modified

### 1. Frontend Changes
**File:** `app/applicant-dashboard/page.tsx`
   - Updated `handleAcceptOffer` to set status to `offer_accepted`
   - Added `offer_accepted` status display in multiple locations
   - Added statistics tracking for accepted offers
   - Updated alert message

### 2. Backend/API Changes
**File:** `app/api/applications/update-status/route.ts`

#### a) Added applicant notification for offer acceptance (Line ~131)
```typescript
else if (status === 'offer_accepted') {
  await supabase
    .from('notifications')
    .insert({
      applicant_id: updatedApplication.applicant_id,
      type: 'offer',
      title: 'Offer Accepted',
      message: `You have accepted the job offer for ${jobTitle} at ${companyName}. Waiting for employer confirmation.`,
      action_url: '/applicant-dashboard?tab=applications',
      read: false
    })
}
```

#### b) Added employer notification for offer acceptance (Line ~182)
```typescript
// Create employer notification when applicant accepts offer
if (status === 'offer_accepted' && updatedApplication.job_posting?.employer_id) {
  await supabase
    .from('notifications')
    .insert({
      employer_id: updatedApplication.job_posting.employer_id,
      type: 'offer',
      title: 'Offer Accepted',
      message: `${applicantName} has accepted the job offer for ${jobTitle}. Ready to mark as hired.`,
      action_url: '/employer-dashboard?tab=applications',
      read: false
    })
}
```

#### c) Updated query to include employer_id (Line ~92)
Added `employer_id` to the job_posting query to enable employer notifications.

---

## Notifications Added

### Applicant Notification
**When:** Applicant accepts offer  
**Title:** "Offer Accepted"  
**Message:** "You have accepted the job offer for [Job Title] at [Company]. Waiting for employer confirmation."  
**Action:** Links to applicant dashboard

### Employer Notification
**When:** Applicant accepts offer  
**Title:** "Offer Accepted"  
**Message:** "[Applicant Name] has accepted the job offer for [Job Title]. Ready to mark as hired."  
**Action:** Links to employer dashboard

---

## Database

- ✅ No schema changes needed - `status` column is TEXT type
- ✅ API already validates `offer_accepted` as valid status
- ✅ `offer_accepted` is supported in existing status checks
- ✅ Notifications table already supports both `employer_id` and `applicant_id`

---

## Notes

- The employer dashboard already had proper support for the "Mark as Hired" button
- No database migrations required
- The `offer_accepted` status was already supported in the API validation
- This fix ensures the proper two-step confirmation process with notifications

