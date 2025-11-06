# Staff Competency Tab - Where to Start (Asa Mag Sugod)

This guide shows you exactly where to start to get the Staff Competency tab results working.

## 📍 Key Files Location

### 1. **Frontend Page** (Main UI)
**Location:** `app/staff-competency/page.tsx`
- This is the main page that displays the Staff Competency tab
- Contains the "Staff Assessments" tab with the list of records
- Loads data from the API endpoint

### 2. **API Endpoint** (Backend Data)
**Location:** `app/api/staff-performance/competency/route.ts`
- This is the API that fetches data from the database
- Returns competency records with areas and skills
- Handles GET, POST, and PATCH requests

### 3. **Database Tables** (Data Storage)
**Location:** `scripts/056-create-staff-competency-tables.sql`
- Main tables:
  - `staff_competency_evaluations` - Main evaluation records
  - `staff_competency_areas` - Competency categories (Safety, Communication, etc.)
  - `staff_competency_skills` - Individual skills within each area

## 🚀 Quick Start Steps

### Step 1: Verify Database Tables Exist

Run this SQL in your Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'staff_competency_evaluations',
  'staff_competency_areas', 
  'staff_competency_skills'
);
```

**If tables don't exist**, run:
```sql
-- Run the table creation script
-- File: scripts/056-create-staff-competency-tables.sql
```

### Step 2: Check if Data Exists

```sql
-- Check for existing evaluations
SELECT COUNT(*) as total_evaluations 
FROM staff_competency_evaluations;

-- Check for areas
SELECT COUNT(*) as total_areas 
FROM staff_competency_areas;

-- Check for skills
SELECT COUNT(*) as total_skills 
FROM staff_competency_skills;
```

**If no data exists**, proceed to Step 3.

### Step 3: Create Sample Data

**Option A: Use the UI Button**
1. Go to `/staff-competency` in your app
2. Click the **"Staff Assessments"** tab
3. If you see "No assessments found", click **"Create Sample Data"** button
4. Wait for success message

**Option B: Use API Endpoint**
```bash
# Make a POST request to:
POST /api/competency/seed-sample-data
```

**Option C: Run SQL Script**
```sql
-- Run the sample data script
-- File: scripts/create-sample-competency-data.sql
```

### Step 4: Test the API

Test if the API is working:

```bash
# In your browser console or Postman:
GET http://localhost:3000/api/staff-performance/competency
```

**Expected Response:**
```json
{
  "success": true,
  "records": [
    {
      "id": "...",
      "staffName": "Sarah Johnson",
      "staffRole": "RN",
      "overallScore": 91,
      "competencyAreas": [...]
    }
  ],
  "summary": {
    "totalRecords": 1,
    "competentStaff": 1,
    ...
  }
}
```

### Step 5: View in UI

1. Navigate to: `http://localhost:3000/staff-competency`
2. Click the **"Staff Assessments"** tab
3. You should see:
   - Staff competency records
   - Overall score badges (e.g., "91% Competent")
   - Competency areas with progress bars
   - "X of Y skills competent" text

## 🔍 Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│  Frontend: app/staff-competency/page.tsx        │
│  - Displays Staff Assessments tab               │
│  - Shows competency records with progress bars  │
└─────────────────┬───────────────────────────────┘
                  │
                  │ fetch('/api/staff-performance/competency')
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  API: app/api/staff-performance/competency/     │
│  route.ts                                        │
│  - Queries database                              │
│  - Transforms data                               │
│  - Returns JSON response                         │
└─────────────────┬───────────────────────────────┘
                  │
                  │ Supabase Query
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Database Tables:                                │
│  - staff_competency_evaluations                  │
│  - staff_competency_areas                        │
│  - staff_competency_skills                      │
└─────────────────────────────────────────────────┘
```

## 🐛 Troubleshooting

### Problem: "No assessments found"

**Check 1: Database has data?**
```sql
SELECT * FROM staff_competency_evaluations LIMIT 1;
```

**Check 2: API is working?**
- Open browser DevTools → Network tab
- Go to `/staff-competency`
- Look for request to `/api/staff-performance/competency`
- Check if response has `success: true` and `records: []`

**Check 3: Staff table has records?**
```sql
SELECT id, name FROM staff LIMIT 5;
```
The API needs staff records to link evaluations.

### Problem: Progress bars not showing

**Check: Skills have status = 'competent'?**
```sql
SELECT 
  a.category_name,
  COUNT(sk.id) as total_skills,
  COUNT(CASE WHEN sk.status = 'competent' THEN 1 END) as competent_skills
FROM staff_competency_areas a
LEFT JOIN staff_competency_skills sk ON sk.area_id = a.id
GROUP BY a.id, a.category_name;
```

**Fix: Update skills status**
```sql
UPDATE staff_competency_skills 
SET status = 'competent' 
WHERE final_score >= 80 
AND (status IS NULL OR status != 'competent');
```

### Problem: API returns empty array

**Check: Staff IDs match?**
```sql
-- Check if evaluation staff_id exists in staff table
SELECT 
  e.id,
  e.staff_id,
  s.name as staff_name
FROM staff_competency_evaluations e
LEFT JOIN staff s ON s.id = e.staff_id
WHERE s.id IS NULL;  -- This should return 0 rows
```

**Fix: Update staff_id if needed**
```sql
-- Get a valid staff ID first
SELECT id, name FROM staff LIMIT 1;

-- Then update evaluations with invalid staff_id
UPDATE staff_competency_evaluations 
SET staff_id = '<valid-staff-id>' 
WHERE staff_id NOT IN (SELECT id FROM staff);
```

## 📝 Code Locations Reference

| Component | File Path | Purpose |
|-----------|-----------|---------|
| **Main Page** | `app/staff-competency/page.tsx` | UI display, data loading |
| **API Route** | `app/api/staff-performance/competency/route.ts` | Backend data fetching |
| **Database Schema** | `scripts/056-create-staff-competency-tables.sql` | Table definitions |
| **Sample Data** | `scripts/create-sample-competency-data.sql` | Test data |
| **Seed API** | `app/api/competency/seed-sample-data/route.ts` | Programmatic data creation |

## ✅ Success Checklist

Before you start coding, verify:

- [ ] Database tables exist (`staff_competency_evaluations`, etc.)
- [ ] At least 1 staff record exists in `staff` table
- [ ] API endpoint `/api/staff-performance/competency` returns data
- [ ] Frontend page `/staff-competency` loads without errors
- [ ] "Staff Assessments" tab displays records (or "Create Sample Data" button)

## 🎯 Next Steps After Setup

Once you have data showing:

1. **Create New Assessment**: Use "+ New Assessment" button
2. **Assess Skills**: Click "Assess Skills" on any record
3. **View Reports**: Click "View Report" to see detailed breakdown
4. **Filter/Search**: Use search and filter options
5. **Customize Areas**: Add/remove competency areas as needed

## 💡 Quick Commands

```bash
# Check if API is running
curl http://localhost:3000/api/staff-performance/competency

# Check database connection (in Supabase SQL Editor)
SELECT COUNT(*) FROM staff_competency_evaluations;

# Create sample data via API (if seed endpoint exists)
curl -X POST http://localhost:3000/api/competency/seed-sample-data
```

## 📞 Need Help?

If you're stuck:

1. **Check browser console** for JavaScript errors
2. **Check Network tab** for API request/response
3. **Check Supabase logs** for database errors
4. **Verify environment variables** (Supabase URL, keys)
5. **Check the transformRecord function** in `page.tsx` (line 583) - this transforms API data to UI format

---

**Start here:** Run Step 1 (verify tables), then Step 2 (check data), then Step 3 (create sample data if needed), then Step 5 (view in UI).

