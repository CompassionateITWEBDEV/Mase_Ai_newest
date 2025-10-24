# Notification Events Guide

This document describes all automatic notification triggers in the MASE Healthcare platform.

## 📨 Applicant Notifications

Applicants receive notifications for the following events:

### 1. Interview Scheduled
**Trigger:** When an employer schedules an interview
**API Endpoint:** `POST /api/applications/schedule-interview`
**Notification Type:** `interview`
**Title:** "Interview Scheduled"
**Message:** "Your interview for [Job Title] at [Company Name] has been scheduled for [Date] at [Time] at [Location]."
**Action URL:** `/applicant-dashboard?tab=applications`

**Example:**
```
Title: Interview Scheduled
Message: Your interview for Registered Nurse at General Hospital has been scheduled for Monday, January 15, 2024 at 2:00 PM at 123 Main St, Suite 400.
```

---

### 2. Profile Viewed by Employer
**Trigger:** When an employer views the applicant's profile
**API Endpoint:** `POST /api/candidates/view-profile`
**Notification Type:** `message`
**Title:** "Profile Viewed"
**Message:** "[Employer Name] viewed your profile."
**Action URL:** `/applicant-dashboard?tab=profile`

**Example:**
```
Title: Profile Viewed
Message: General Hospital viewed your profile.
```

---

### 3. Hired (Application Accepted)
**Trigger:** When application status is updated to "accepted"
**API Endpoint:** `PUT /api/applications/update-status`
**Notification Type:** `offer`
**Title:** "Congratulations! You're Hired!"
**Message:** "Congratulations! [Company Name] has hired you for the [Job Title] position. Check your email for further details."
**Action URL:** `/applicant-dashboard?tab=applications`

**Example:**
```
Title: Congratulations! You're Hired!
Message: Congratulations! General Hospital has hired you for the Registered Nurse position. Check your email for further details.
```

---

### 4. Application Under Review
**Trigger:** When application status is updated to "reviewing"
**API Endpoint:** `PUT /api/applications/update-status`
**Notification Type:** `application`
**Title:** "Application Under Review"
**Message:** "[Company Name] is reviewing your application for [Job Title]."
**Action URL:** `/applicant-dashboard?tab=applications`

---

### 5. Application Update (Rejected)
**Trigger:** When application status is updated to "rejected"
**API Endpoint:** `PUT /api/applications/update-status`
**Notification Type:** `application`
**Title:** "Application Update"
**Message:** "Your application for [Job Title] at [Company Name] has been reviewed. Thank you for your interest."
**Action URL:** `/applicant-dashboard?tab=applications`

---

## 🏢 Employer Notifications

Employers receive notifications for the following events:

### 1. New Application Received
**Trigger:** When an applicant submits an application
**API Endpoint:** `POST /api/applications/create`
**Notification Type:** `application`
**Title:** "New Application Received"
**Message:** "[Applicant Name] has applied for [Job Title]."
**Action URL:** `/employer-dashboard?tab=applications`

**Example:**
```
Title: New Application Received
Message: John Smith has applied for Registered Nurse.
```

---

## 🔧 Technical Implementation

### Notification Creation Flow

1. **Event Occurs** (e.g., application submitted, interview scheduled)
2. **API Endpoint Processes Event** (e.g., creates application, updates status)
3. **Notification Created** in `notifications` table
4. **Auto-Refresh System** picks up new notification (30 seconds)
5. **User Sees Notification** in their dashboard

### Database Structure

```sql
notifications (
  id UUID PRIMARY KEY,
  employer_id UUID REFERENCES employers(id),     -- For employer notifications
  applicant_id UUID REFERENCES applicants(id),   -- For applicant notifications
  type TEXT NOT NULL,                             -- notification type
  title TEXT NOT NULL,                            -- notification title
  message TEXT NOT NULL,                          -- notification message
  action_url TEXT,                                -- link when clicked
  read BOOLEAN DEFAULT FALSE,                     -- read status
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Notification Types

**Applicant Types:**
- `interview` - Interview-related notifications
- `offer` - Job offer and hiring notifications
- `application` - Application status updates
- `message` - General messages (profile views, etc.)
- `document` - Document verification updates
- `job` - Job recommendations

**Employer Types:**
- `application` - New applications and updates
- `interview` - Interview confirmations
- `document` - Document uploads
- `candidate` - Candidate activities

---

## 📊 Notification System Features

### Auto-Refresh
- **Applicant Dashboard:** Every 30 seconds
- **Employer Dashboard:** Every 30 seconds
- **Background Process:** Runs without user interaction

### Visual Indicators
- 🔴 **Unread Count Badge:** Shows number of unread notifications
- 🔵 **Blue Dot:** Indicates individual unread notifications
- 🔔 **Bell Icon:** Main notification access point

### User Actions
- **Click Notification:** Marks as read and navigates to relevant page
- **Mark as Read:** Individual notification
- **Mark All as Read:** All notifications at once
- **Auto-Dismiss:** None (notifications stay until manually dismissed)

---

## 🚀 Usage Examples

### Example 1: Applicant Applies for Job
```javascript
// In applicant dashboard - Apply button clicked
const response = await fetch('/api/applications/create', {
  method: 'POST',
  body: JSON.stringify({
    job_posting_id: jobId,
    applicant_id: applicantId,
    cover_letter: coverLetter
  })
})

// Automatic notification created:
// - Employer receives: "John Smith has applied for Registered Nurse"
```

### Example 2: Employer Schedules Interview
```javascript
// In employer dashboard - Schedule interview clicked
const response = await fetch('/api/applications/schedule-interview', {
  method: 'POST',
  body: JSON.stringify({
    applicationId: appId,
    interviewDate: '2024-01-15',
    interviewTime: '14:00',
    location: '123 Main St, Suite 400',
    notes: 'Please bring your certifications'
  })
})

// Automatic notification created:
// - Applicant receives: "Your interview for Registered Nurse at General Hospital..."
```

### Example 3: Employer Views Applicant Profile
```javascript
// In employer dashboard - View details clicked
await fetch('/api/candidates/view-profile', {
  method: 'POST',
  body: JSON.stringify({
    candidateId: applicantId,
    employerId: employerId,
    employerName: 'General Hospital'
  })
})

// Automatic notification created:
// - Applicant receives: "General Hospital viewed your profile"
```

### Example 4: Applicant Gets Hired
```javascript
// In employer dashboard - Accept application clicked
const response = await fetch('/api/applications/update-status', {
  method: 'PUT',
  body: JSON.stringify({
    applicationId: appId,
    status: 'accepted',
    notes: 'Welcome to the team!'
  })
})

// Automatic notification created:
// - Applicant receives: "Congratulations! You're Hired!"
```

---

## 🧪 Testing Notifications

### Test Scenario 1: New Application
1. Log in as Applicant
2. Apply for a job
3. Log in as Employer (for that job)
4. Check notifications - should see "New Application Received"

### Test Scenario 2: Interview Scheduled
1. Log in as Employer
2. Schedule interview for an application
3. Log in as Applicant
4. Check notifications - should see "Interview Scheduled"

### Test Scenario 3: Profile View
1. Log in as Employer
2. View an applicant's profile
3. Log in as that Applicant
4. Check notifications - should see "Profile Viewed"

### Test Scenario 4: Hired
1. Log in as Employer
2. Accept an application (status = accepted)
3. Log in as Applicant
4. Check notifications - should see "Congratulations! You're Hired!"

---

## 📝 Best Practices

1. **Error Handling:** Notification failures don't stop the main operation
2. **Async Creation:** Notifications are created asynchronously
3. **User-Friendly Messages:** Use clear, actionable language
4. **Include Context:** Always mention job title, company name, etc.
5. **Action URLs:** Every notification should link to relevant page
6. **Console Logging:** Success/failure logged for debugging

---

## 🔍 Troubleshooting

### Notifications Not Appearing?

1. **Check Database:**
   ```sql
   SELECT * FROM notifications 
   WHERE applicant_id = 'your-id' OR employer_id = 'your-id'
   ORDER BY created_at DESC;
   ```

2. **Check Console:**
   - Look for "✅ notification created" messages
   - Look for error messages

3. **Check RLS Policies:**
   - Ensure migration `036-update-notifications-table.sql` was run
   - Verify policies allow SELECT for notifications

4. **Check Auto-Refresh:**
   - Open browser console
   - Look for "Auto-refreshing notifications..." every 30 seconds

### Duplicate Notifications?

- Check if API endpoint is being called multiple times
- Verify event listeners are not duplicated
- Check for multiple auto-refresh intervals

---

## 🎯 Future Enhancements

- [ ] Email notifications (Resend integration)
- [ ] SMS notifications (Twilio integration)
- [ ] Push notifications (Web Push API)
- [ ] Notification preferences (enable/disable by type)
- [ ] Notification history/archive
- [ ] Sound alerts for urgent notifications
- [ ] Desktop notifications (when browser tab is inactive)
- [ ] Notification batching (group similar notifications)

---

## 📚 Related Documentation

- [NOTIFICATION_SYSTEM_GUIDE.md](./NOTIFICATION_SYSTEM_GUIDE.md) - General notification system setup
- [scripts/036-update-notifications-table.sql](./scripts/036-update-notifications-table.sql) - Database migration
- [components/applicant-notification-system.tsx](./components/applicant-notification-system.tsx) - Applicant UI
- [components/employer-notification-system.tsx](./components/employer-notification-system.tsx) - Employer UI

