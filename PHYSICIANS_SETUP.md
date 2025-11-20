# Physicians Page Setup Guide

This document explains the changes made to the Physicians page and how to set it up.

## Overview

The Physicians page has been completely overhauled to work with a real database backend instead of mock data. It now supports:

- ✅ Real database persistence using Supabase
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ CAQH verification integration
- ✅ CSV export functionality
- ✅ Current/future dates (no outdated mock data)
- ✅ Loading and error states
- ✅ Search and filter capabilities

## Changes Made

### 1. Database Migration (`scripts/072-create-physicians-table.sql`)
Created a new `physicians` table with:
- Basic physician information (NPI, name, specialty)
- License details (number, state, expiration)
- CAQH verification status
- Board certification
- DEA and malpractice insurance information
- Hospital affiliations
- Audit fields (added_by, created_at, updated_at)
- Sample data with current/future dates

### 2. API Endpoints

#### `app/api/physicians/route.ts`
- `GET` - Fetch all physicians with search and filter support
- `POST` - Create new physician

#### `app/api/physicians/[id]/route.ts`
- `GET` - Fetch single physician by ID
- `PATCH` - Update physician information
- `DELETE` - Soft delete physician (sets `is_active` to false)

#### `app/api/physicians/export/route.ts`
- `GET` - Export all physicians to CSV format

### 3. Frontend Updates (`app/physicians/page.tsx`)

**Removed:**
- Hardcoded mock data with outdated dates
- Client-only state management

**Added:**
- Data fetching from API on component mount
- Loading and error states with user-friendly UI
- Proper async operations for add, update, verify
- Export functionality that downloads CSV file
- Automatic refresh after data changes
- Error notifications

### 4. Type Definitions (`types/database.ts`)
Added `physicians` table type definitions with Row, Insert, and Update types.

## Setup Instructions

### 1. Run Database Migration

Connect to your Supabase database and run the migration script:

```bash
# Using psql
psql -h your-db-host -U postgres -d your-database -f scripts/072-create-physicians-table.sql

# Or using Supabase SQL Editor
# Copy the contents of scripts/072-create-physicians-table.sql
# and paste into the SQL Editor, then run
```

### 2. Verify Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Test the Application

1. Navigate to `/physicians` in your browser
2. You should see 3 sample physicians loaded from the database
3. Test adding a new physician
4. Test the CAQH verification button
5. Test the export functionality

## Features

### Physician Management
- **Add Physician**: Click "Add Physician" button to open a form
- **Verify Credentials**: Click the user icon to verify via CAQH
- **View Details**: Click the eye icon to view full physician details
- **Export Data**: Click "Export Report" to download CSV

### Search & Filter
- Search by name, NPI, license number, or specialty
- Filter by verification status (all, verified, pending, expired, error, not_verified)

### Statistics Dashboard
The page displays real-time statistics:
- Total Physicians
- Verified Physicians
- Pending Verifications
- Expired Licenses
- Licenses Expiring Soon (within 30 days)

### Expiration Tracking
License expiration dates are color-coded:
- 🔴 Red: Expired
- 🟠 Orange: Expiring within 30 days
- 🟡 Yellow: Expiring within 90 days
- 🟢 Green: Valid (more than 90 days)

## API Usage Examples

### Fetch All Physicians
```javascript
const response = await fetch('/api/physicians')
const data = await response.json()
console.log(data.physicians)
```

### Add New Physician
```javascript
const response = await fetch('/api/physicians', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    npi: '1234567890',
    firstName: 'Dr. John',
    lastName: 'Smith',
    specialty: 'Cardiology',
    licenseNumber: 'MD123456',
    licenseState: 'MI',
    licenseExpiration: '2026-12-31'
  })
})
const result = await response.json()
```

### Update Physician
```javascript
const response = await fetch('/api/physicians/physician-id', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    verificationStatus: 'verified',
    lastVerified: '2025-11-14',
    caqhId: 'CAQH123456'
  })
})
```

### Export to CSV
```javascript
const response = await fetch('/api/physicians/export')
const blob = await response.blob()
// Download the file
```

## Database Schema

```sql
CREATE TABLE public.physicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npi TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    specialty TEXT,
    license_number TEXT,
    license_state TEXT,
    license_expiration DATE,
    caqh_id TEXT,
    verification_status TEXT DEFAULT 'not_verified',
    last_verified DATE,
    board_certification TEXT,
    board_expiration DATE,
    malpractice_insurance BOOLEAN DEFAULT false,
    malpractice_expiration DATE,
    dea_number TEXT,
    dea_expiration DATE,
    hospital_affiliations TEXT[],
    notes TEXT,
    added_by TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Troubleshooting

### "Failed to load physicians" error
- Check that the database migration has been run
- Verify Supabase environment variables are set correctly
- Check browser console for detailed error messages

### Verification not working
- The CAQH verification currently uses mock data (see `app/api/caqh/verify-physician/route.ts`)
- To integrate real CAQH API, replace the mock implementation with actual API calls

### Export not downloading
- Check browser console for errors
- Ensure popup blockers are not preventing the download
- Verify the `/api/physicians/export` endpoint is accessible

## Next Steps

To fully integrate with CAQH:
1. Update `app/api/caqh/verify-physician/route.ts` with real CAQH API credentials
2. Add proper error handling for CAQH API failures
3. Implement webhook handlers for async verification results
4. Add automated verification scheduling for expiring licenses

## Support

If you encounter any issues, please check:
1. Database connection is working
2. All environment variables are set
3. Migration script has been run successfully
4. Browser console for detailed error messages




