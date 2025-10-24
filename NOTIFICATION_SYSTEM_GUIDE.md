# Notification System Setup Guide

## Overview
The MASE Healthcare platform now has a comprehensive notification system for both **Employers** and **Applicants**. The system automatically refreshes every 30 seconds to show real-time updates.

## Features

### For Applicants
- **Application Status Updates**: Get notified when your application status changes
- **Interview Invitations**: Receive interview scheduling notifications
- **Job Offers**: Be alerted about new job offers
- **Document Status**: Know when your documents are verified or need attention
- **New Job Matches**: Get notified about new jobs matching your profile

### For Employers
- **New Applications**: Instant notification when someone applies
- **Interview Responses**: Know when candidates confirm/reschedule interviews
- **Document Uploads**: Get alerted when candidates upload required documents
- **Candidate Actions**: Track when candidates accept/decline offers

## Components

### ApplicantNotificationSystem
Location: `components/applicant-notification-system.tsx`
- Displays notifications in the applicant dashboard
- Auto-refreshes every 30 seconds
- Shows unread count badge
- Supports marking notifications as read

### EmployerNotificationSystem
Location: `components/employer-notification-system.tsx`
- Displays notifications in the employer dashboard
- Auto-refreshes every 30 seconds
- Shows unread count badge
- Supports marking notifications as read

## API Endpoints

### GET `/api/notifications`
Fetch notifications for a user

**Query Parameters:**
- `employer_id` (optional): UUID of the employer
- `applicant_id` (optional): UUID of the applicant

**Example:**
```javascript
// For applicant
const response = await fetch('/api/notifications?applicant_id=xxx')

// For employer
const response = await fetch('/api/notifications?employer_id=xxx')
```

### POST `/api/notifications`
Create a new notification

**Body:**
```json
{
  "applicant_id": "uuid",  // OR "employer_id": "uuid"
  "type": "application|interview|offer|document|job|message",
  "title": "Notification Title",
  "message": "Notification message content",
  "action_url": "/optional/link"  // Optional
}
```

### PUT `/api/notifications/update`
Mark a specific notification as read

**Body:**
```json
{
  "notification_id": "uuid",
  "read": true,
  "applicant_id": "uuid"  // OR "employer_id": "uuid"
}
```

### PATCH `/api/notifications/update`
Mark all notifications as read for a user

**Body:**
```json
{
  "applicant_id": "uuid"  // OR "employer_id": "uuid"
}
```

## Database Setup

### Run Migration
Apply the database migration to add support for applicant notifications:

```sql
-- Run this in your Supabase SQL Editor
-- File: scripts/036-update-notifications-table.sql
```

This migration:
1. Adds `applicant_id` column to notifications table
2. Adds constraint ensuring either `employer_id` OR `applicant_id` is set (not both)
3. Creates RLS policies for applicant access
4. Adds performance indexes
5. Grants necessary permissions

### Table Structure
```sql
notifications (
  id UUID PRIMARY KEY,
  employer_id UUID REFERENCES employers(id),
  applicant_id UUID REFERENCES applicants(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT notifications_user_type_check CHECK (
    (employer_id IS NOT NULL AND applicant_id IS NULL) OR 
    (employer_id IS NULL AND applicant_id IS NOT NULL)
  )
)
```

## Notification Types

### Applicant Notifications
- `application` - Application status updates
- `interview` - Interview scheduling/updates
- `offer` - Job offer received
- `document` - Document verification status
- `job` - New job matches
- `message` - General messages

### Employer Notifications
- `application` - New application received
- `interview` - Interview confirmations
- `offer` - Offer responses
- `document` - Document uploads
- `candidate` - Candidate profile views

## Usage Examples

### Creating an Application Status Notification
```javascript
// When an application status changes
await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    applicant_id: applicant.id,
    type: 'application',
    title: 'Application Status Updated',
    message: `Your application for ${jobTitle} has been updated to: ${status}`,
    action_url: '/applicant-dashboard?tab=applications'
  })
})
```

### Creating an Interview Invitation
```javascript
// When an interview is scheduled
await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    applicant_id: applicant.id,
    type: 'interview',
    title: 'Interview Scheduled',
    message: `Interview scheduled for ${jobTitle} on ${date} at ${time}`,
    action_url: '/applicant-dashboard?tab=applications'
  })
})
```

### Creating a New Application Notification for Employer
```javascript
// When a new application is received
await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employer_id: employer.id,
    type: 'application',
    title: 'New Application Received',
    message: `${applicantName} has applied for ${jobTitle}`,
    action_url: '/employer-dashboard?tab=applications'
  })
})
```

## Auto-Refresh Feature
Both notification systems automatically refresh every 30 seconds to show new notifications without requiring manual page refresh. This ensures users always see the latest updates.

## Styling
The notification UI includes:
- ✅ Unread count badge
- 🔵 Unread indicator dot
- 📱 Responsive dropdown design
- 🎨 Type-specific icons and colors
- ⏰ Relative timestamps ("2m ago", "1h ago")
- 🔔 Sound/visual feedback (customizable)

## Best Practices

1. **Always specify action_url** - Makes notifications actionable
2. **Keep messages concise** - 1-2 sentences maximum
3. **Use appropriate types** - Helps with filtering and styling
4. **Clean up old notifications** - Consider archiving after 30 days
5. **Test RLS policies** - Ensure users can only see their own notifications

## Troubleshooting

### Notifications not showing up?
1. Check if migration was applied: `scripts/036-update-notifications-table.sql`
2. Verify RLS policies are enabled
3. Check browser console for API errors
4. Confirm user ID is being passed correctly

### Auto-refresh not working?
1. Check browser console for errors
2. Verify the useEffect cleanup is working
3. Ensure the interval is being cleared properly

### Permission errors?
1. Verify Supabase RLS policies
2. Check that user is authenticated
3. Ensure the correct user ID type (employer vs applicant) is being used

## Future Enhancements
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Push notifications (PWA)
- [ ] Notification preferences/settings
- [ ] Notification categories/filters
- [ ] Sound alerts for urgent notifications
- [ ] Desktop notifications API integration

