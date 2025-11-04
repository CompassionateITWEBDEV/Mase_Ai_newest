# Quick Start: Staff Assessment Progress Bars

This guide helps you quickly set up staff competency assessments with progress bars.

## 🚀 Quick Setup (3 Steps)

### Step 1: Run the Sample Data Script

Run this SQL script in your Supabase SQL editor or database:

```bash
# The script is located at:
scripts/create-sample-competency-data.sql
```

Or directly run in Supabase:

1. Go to your Supabase project
2. Open SQL Editor
3. Copy and paste the contents of `scripts/create-sample-competency-data.sql`
4. Click "Run"

**What it does:**
- Creates a sample competency evaluation for your first staff member
- Adds 5 competency areas (Safety & Compliance, Communication Skills, etc.)
- Adds 17 skills total across all areas (all with "competent" status)
- Sets up weights and scores to show progress bars

### Step 2: Verify the Data

After running the script, verify the data was created:

```sql
SELECT 
  e.id,
  s.name as staff_name,
  e.overall_score,
  COUNT(DISTINCT a.id) as num_areas,
  COUNT(DISTINCT sk.id) as num_skills
FROM staff_competency_evaluations e
JOIN staff s ON s.id = e.staff_id
LEFT JOIN staff_competency_areas a ON a.evaluation_id = e.id
LEFT JOIN staff_competency_skills sk ON sk.area_id = a.id
WHERE e.evaluation_date >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY e.id, s.name, e.overall_score;
```

You should see at least 1 evaluation with 5 areas and multiple skills.

### Step 3: View in UI

1. **Open your app**: Go to `/staff-competency`
2. **Click "Staff Assessments" tab**
3. **You should see:**
   - Staff name and role
   - Overall score badge (e.g., "91% Competent" in green)
   - List of competency areas with:
     - Area name
     - "X of Y skills competent" status
     - Weight badge (e.g., "Weight: 25%")
     - Red progress bar showing completion

## 📊 What You'll See

For each staff member with an assessment:

```
┌─────────────────────────────────────────────────┐
│ Sarah Johnson                                   │
│ RN • Clinical                          [91% Competent] │
│ Assessed by: Dr. Martinez • Next due: 2024-07-15│
│                                                 │
│ Safety & Compliance                            │
│ 3 of 3 skills competent        [Weight: 25%]   │
│ [████████████████████] 100%                    │
│                                                 │
│ Communication Skills                            │
│ 2 of 2 skills competent        [Weight: 20%]   │
│ [████████████████████] 100%                    │
│                                                 │
│ [View Report]  [Assess Skills]                 │
└─────────────────────────────────────────────────┘
```

## 🔧 Manual Creation (Alternative)

If you prefer to create assessments manually:

### Using the UI:

1. Go to `/staff-competency`
2. Click **"+ New Assessment"** button
3. Fill in:
   - Staff Member: Select from dropdown
   - Evaluation Type: Choose type
   - Next Evaluation Due: Future date
   - Evaluator Name: Your name
4. Click **"Create Assessment"**
5. Find your assessment in the Staff Assessments tab
6. Click **"Assess Skills"** button
7. Add competency areas and skills
8. Set skill status to **"competent"** for progress bars to show

## ⚠️ Troubleshooting

### No progress bars showing?

**Check 1: Do evaluations exist?**
```sql
SELECT COUNT(*) FROM staff_competency_evaluations;
```
If 0, run the sample data script.

**Check 2: Do areas exist with weights?**
```sql
SELECT category_name, weight 
FROM staff_competency_areas 
WHERE weight > 0;
```

**Check 3: Do skills exist with status?**
```sql
SELECT skill_name, status 
FROM staff_competency_skills 
WHERE status = 'competent';
```

**Fix: Update skills without status**
```sql
UPDATE staff_competency_skills 
SET status = 'competent' 
WHERE status IS NULL OR status = 'not-assessed'
AND final_score >= 80;
```

### Progress bars showing 0%?

**Fix: Ensure skills have "competent" status**
```sql
UPDATE staff_competency_skills 
SET status = 'competent' 
WHERE final_score >= 80 
AND (status IS NULL OR status != 'competent');
```

### Overall score badge not showing correctly?

**Fix: Update overall score**
```sql
UPDATE staff_competency_evaluations 
SET overall_score = 91, 
    status = 'completed'
WHERE overall_score < 80;
```

## 🎯 Next Steps

Once you have data showing:

1. **Create more assessments** for other staff members
2. **Customize competency areas** to match your needs
3. **Add more skills** under each area
4. **Use "Assess Skills"** button to update skill statuses
5. **View reports** using the "View Report" button

## 📝 Important Notes

- **Skill Status**: Only skills with `status = 'competent'` count toward progress
- **Weights**: Areas should have weights that sum to ~100% (or close)
- **Progress Calculation**: `(competent_skills / total_skills) * 100`
- **Progress Bar Color**: Red fill (`bg-red-500`) on gray background

## ✅ Success Checklist

- [ ] Sample data script run successfully
- [ ] At least 1 evaluation exists in database
- [ ] At least 1 competency area exists with weight > 0
- [ ] At least 1 skill exists with status = 'competent'
- [ ] Staff Assessments tab shows progress bars
- [ ] Overall score badge displays correctly
- [ ] "X of Y skills competent" text shows correctly

Once all checked, you're ready to use the Staff Assessments feature! 🎉


