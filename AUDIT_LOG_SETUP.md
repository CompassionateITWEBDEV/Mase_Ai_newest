# Audit Log System - Setup & Documentation

## Overview
The Audit Log system tracks all user actions and system changes in the admin panel, providing a complete history of who did what, when, and where.

## Features
✅ **Real-time Logging** - All user actions are automatically logged
✅ **Database Integration** - Logs stored in Supabase `audit_logs` table
✅ **User Tracking** - Links actions to staff members
✅ **IP Address Logging** - Records the IP address of each action
✅ **Detailed Information** - Stores action type, resource type, and additional details
✅ **Visual Categorization** - Color-coded icons for different action types

## Database Schema

The `audit_logs` table has the following structure:

```sql
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.staff(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes
- `idx_audit_logs_user_id` - For filtering by user
- `idx_audit_logs_action` - For filtering by action type
- `idx_audit_logs_resource_type` - For filtering by resource
- `idx_audit_logs_timestamp` - For sorting by time (DESC)
- `idx_audit_logs_resource_id` - For tracking specific resources

## Setup Instructions

### 1. Run the Migration

The SQL migration file is located at: `scripts/012-create-audit-logs-table.sql`

Run it using the migration script:

```bash
npx tsx scripts/run-migration.ts 012-create-audit-logs-table.sql
```

Or manually in the Supabase SQL Editor:
1. Go to https://supabase.com/dashboard/project/twaupwloddlyahjtfvfy/sql/new
2. Copy the contents of `scripts/012-create-audit-logs-table.sql`
3. Paste and execute the SQL

This will:
- Create the `audit_logs` table
- Set up all necessary indexes
- Enable RLS (Row Level Security)
- Create policies for anonymous and authenticated access
- Insert sample audit log entries

### 2. Verify the Setup

After running the migration, verify in Supabase:

1. **Check the Table**
   - Go to Table Editor
   - Verify `audit_logs` table exists
   - Check that it has 2 sample entries

2. **Check the Policies**
   - Go to Authentication > Policies
   - Verify RLS is enabled for `audit_logs`
   - Check policies: "Allow all to select audit_logs" and "Allow all to insert audit_logs"

## API Endpoints

### 1. List Audit Logs
**Endpoint:** `GET /api/audit/list`

**Query Parameters:**
- `limit` (optional) - Number of logs to return (default: 50)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "uuid",
      "user_id": "uuid or null",
      "action": "Created staff user account",
      "resource_type": "staff",
      "resource_id": "uuid",
      "details": { "target": "user@example.com", "name": "John Doe" },
      "ip_address": "127.0.0.1",
      "timestamp": "2025-01-22T14:30:00Z",
      "staff": {
        "name": "Admin User",
        "email": "admin@example.com"
      }
    }
  ],
  "count": 1
}
```

### 2. Create Audit Log Entry
**Endpoint:** `POST /api/audit/create`

**Request Body:**
```json
{
  "user_id": "uuid (optional)",
  "action": "Action description (required)",
  "resource_type": "staff|applicant|employer (optional)",
  "resource_id": "uuid (optional)",
  "details": { "any": "additional data" },
  "ip_address": "127.0.0.1 (optional, auto-detected)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Audit log created successfully!",
  "log": { ... }
}
```

## Logged Actions

The system automatically logs the following user actions:

### Staff Management
1. **Created staff user account**
   - When: New staff member is created via admin panel
   - Details: Email, name, role

2. **Activated/Deactivated user account**
   - When: User status is toggled
   - Details: Email, name, previous status, new status

3. **Deleted user account**
   - When: Staff member is removed
   - Details: Email, name, role

## UI Components

### Audit Log Tab
Location: `/admin/users` → "Audit Log" tab

Features:
- **Loading State** - Spinner while fetching logs
- **Empty State** - Message when no logs exist
- **Log Entries** - List of all audit logs with:
  - Color-coded icons based on action type
  - Action description
  - User who performed the action
  - Target of the action
  - IP address (if available)
  - Timestamp in local format

### Action Type Icons
- 🟢 **Create** - Green (Plus icon)
- 🔵 **Update** - Blue (Edit icon)
- 🟣 **Access** - Purple (Eye icon)
- 🔴 **Delete** - Red (Alert Triangle icon)
- ⚪ **Info** - Gray (Settings icon)

## How It Works

### 1. User Performs Action
When a user creates, updates, or deletes a staff member:

```typescript
// Example: Creating a staff member
const response = await fetch('/api/staff/create', {
  method: 'POST',
  body: JSON.stringify({ ... })
})
```

### 2. Action is Logged
After the action succeeds, an audit log entry is created:

```typescript
await fetch('/api/audit/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'Created staff user account',
    resource_type: 'staff',
    resource_id: data.staff.id,
    details: {
      target: newUser.email,
      name: newUser.name,
      role: selectedRole.name,
    },
  }),
})
```

### 3. Logs are Refreshed
The UI automatically reloads the audit logs to show the new entry:

```typescript
const auditResponse = await fetch('/api/audit/list?limit=100')
const auditData = await auditResponse.json()
if (auditData.success && auditData.logs) {
  setAuditLogs(auditData.logs)
}
```

### 4. User Sees Updated Log
The new entry appears immediately in the "Audit Log" tab.

## Testing

### Test 1: View Existing Audit Logs
1. Navigate to `/admin/users`
2. Click the "Audit Log" tab
3. Verify you see the sample logs:
   - "system_startup"
   - "table_created"

### Test 2: Create Staff and Verify Log
1. Go to "Users" tab
2. Click "Add User"
3. Fill in user details:
   - Name: Test User
   - Email: test@example.com
   - Role: Staff
4. Click "Create User"
5. Go to "Audit Log" tab
6. Verify you see a new entry: "Created staff user account"
   - Should show: by System, Target: test@example.com

### Test 3: Toggle User Status
1. Go to "Users" tab
2. Find a user and click the toggle switch to deactivate
3. Go to "Audit Log" tab
4. Verify you see: "Deactivated user account"
5. Toggle again to activate
6. Verify you see: "Activated user account"

### Test 4: Delete User
1. Go to "Users" tab
2. Click the trash icon next to a user
3. Confirm deletion
4. Go to "Audit Log" tab
5. Verify you see: "Deleted user account"

## Future Enhancements

Potential improvements for the audit log system:

1. **Filtering & Search**
   - Filter by action type
   - Filter by user
   - Filter by date range
   - Search by target/details

2. **Export Functionality**
   - Export to CSV
   - Export to PDF
   - Export to JSON

3. **Advanced Analytics**
   - Most active users
   - Action frequency charts
   - Timeline visualization

4. **Real-time Updates**
   - WebSocket integration
   - Live log streaming
   - Push notifications for critical actions

5. **Log Retention**
   - Automatic cleanup of old logs
   - Archive old logs
   - Configurable retention periods

## Troubleshooting

### Issue: No audit logs appearing
**Solution:**
1. Check if the table exists in Supabase
2. Verify RLS policies are enabled
3. Check browser console for API errors
4. Verify the migration was run successfully

### Issue: Audit logs not updating after action
**Solution:**
1. Check if the audit log API calls are failing (browser console)
2. Verify the `/api/audit/create` endpoint is working
3. Check if the action handlers have the audit logging code

### Issue: "Failed to create audit log" error
**Solution:**
1. Check Supabase connection
2. Verify table schema matches the API expectations
3. Check RLS policies allow inserts
4. Verify the action field is not null

## Security Considerations

1. **RLS Policies** - Ensure proper Row Level Security is enabled
2. **IP Logging** - Consider privacy regulations when logging IP addresses
3. **Data Retention** - Implement a retention policy for old logs
4. **Sensitive Data** - Avoid logging passwords or sensitive information in details
5. **Access Control** - Restrict who can view and export audit logs

## Technical Details

### Stack
- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **UI Components:** shadcn/ui

### File Structure
```
app/
  api/
    audit/
      list/
        route.ts         # GET endpoint for fetching logs
      create/
        route.ts         # POST endpoint for creating logs
  admin/
    users/
      page.tsx          # Main UI with audit log tab

scripts/
  012-create-audit-logs-table.sql  # Database migration
```

## Conclusion

The Audit Log system is now fully integrated and functional. It automatically tracks all user actions in the admin panel, providing transparency and accountability. The system is ready for production use and can be extended with additional features as needed.

For any issues or questions, please refer to the Troubleshooting section or check the browser console for detailed error messages.

