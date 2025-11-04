# Staff Assessment Progress Bars Guide

This guide explains how to get the progress bars displaying in the **Staff Assessments** tab at `/staff-competency`, similar to the image you provided.

## 📋 Overview

The progress bars show competency assessment results with:
- **Overall Score Badge**: Shows "X% Competent" (green badge)
- **Competency Areas**: Each area shows:
  - Category name (e.g., "Safety & Compliance")
  - Status: "X of Y skills competent"
  - Weight percentage badge
  - Progress bar (red fill showing completion)

## 🔑 Requirements

To see progress bars like in the image, you need:

1. **Staff Competency Evaluations** in the database
2. **Competency Areas** for each evaluation (with weights)
3. **Skills** under each area (with status values)
4. **Status values** on skills must be set to "competent", "needs-improvement", or "not-competent"

## 📊 Data Structure

The data flows like this:

```
Staff Competency Evaluation
  └─ Competency Areas (with weight %)
      └─ Skills (with status: "competent" or "not-competent")
```

### Example Data Structure

For a staff member to show progress bars like:
- **Safety & Compliance**: "3 of 3 skills competent" (100% progress)
- **Communication Skills**: "2 of 2 skills competent" (100% progress)
- **Documentation**: "4 of 5 skills competent" (80% progress)

You need:

```sql
-- 1. Evaluation record
INSERT INTO staff_competency_evaluations (
  staff_id,
  evaluator_name,
  evaluation_date,
  evaluation_type,
  overall_score,
  status,
  next_evaluation_due
) VALUES (
  'staff-uuid-here',
  'Dr. Martinez',
  '2024-01-15',
  'annual',
  91.0,
  'completed',
  '2024-07-15'
);

-- 2. Competency Area: Safety & Compliance
INSERT INTO staff_competency_areas (
  evaluation_id,
  category_name,
  weight,  -- 25% = 25
  category_score
) VALUES (
  'evaluation-uuid-here',
  'Safety & Compliance',
  25,
  100.0
);

-- 3. Skills under Safety & Compliance (all with status='competent')
INSERT INTO staff_competency_skills (
  area_id,
  skill_name,
  status,  -- MUST be 'competent' for progress calculation
  final_score
) VALUES
  ('area-uuid-1', 'Hand hygiene protocols', 'competent', 95),
  ('area-uuid-1', 'Infection control measures', 'competent', 90),
  ('area-uuid-1', 'Safety equipment usage', 'competent', 100);
```

## 🚀 How to Create Assessments

### Method 1: Using the UI (Recommended)

1. **Navigate to Staff Competency Page**
   - Go to `/staff-competency`
   - Click the **"+ New Assessment"** button

2. **Fill in Assessment Details**
   - **Staff Member**: Select a staff member from dropdown
   - **Evaluation Type**: Choose (Initial, Annual, Skills Validation, Performance Improvement)
   - **Next Evaluation Due**: Set a future date
   - **Evaluator Name**: Enter your name or supervisor name

3. **Click "Create Assessment"**

4. **Add Competency Areas and Skills**
   - Go to the **Staff Assessments** tab
   - Find the assessment you just created
   - Click **"Assess Skills"** button
   - Add competency areas with:
     - **Category Name**: e.g., "Safety & Compliance"
     - **Weight**: e.g., 25 (for 25%)
   - Add skills under each area and set:
     - **Skill Name**: e.g., "Hand hygiene protocols"
     - **Status**: Set to "competent", "needs-improvement", or "not-competent"
     - **Final Score**: Enter score (0-100)
   - Click **"Save Assessment"**

### Method 2: Using the API

```bash
POST /api/staff-performance/competency
Content-Type: application/json

{
  "action": "create-evaluation",
  "data": {
    "staffId": "staff-uuid-here",
    "staffName": "Sarah Johnson",
    "evaluationType": "annual",
    "evaluatorName": "Dr. Martinez",
    "nextEvaluationDue": "2024-07-15",
    "competencyAreas": [
      {
        "category": "Safety & Compliance",
        "weight": 0.25,  // 25% as decimal
        "categoryScore": 100.0,
        "items": [
          {
            "description": "Hand hygiene protocols",
            "supervisorAssessmentScore": 95,
            "score": 95
          },
          {
            "description": "Infection control measures",
            "supervisorAssessmentScore": 90,
            "score": 90
          },
          {
            "description": "Safety equipment usage",
            "supervisorAssessmentScore": 100,
            "score": 100
          }
        ]
      },
      {
        "category": "Communication Skills",
        "weight": 0.20,  // 20% as decimal
        "categoryScore": 100.0,
        "items": [
          {
            "description": "Patient communication",
            "supervisorAssessmentScore": 95,
            "score": 95
          },
          {
            "description": "Team communication",
            "supervisorAssessmentScore": 90,
            "score": 90
          }
        ]
      }
    ]
  }
}
```

### Method 3: Direct SQL Insert (For Testing)

```sql
-- Step 1: Get a staff member ID
SELECT id, name FROM staff LIMIT 1;

-- Step 2: Create evaluation
INSERT INTO staff_competency_evaluations (
  staff_id,
  evaluator_name,
  evaluation_date,
  evaluation_type,
  overall_score,
  status,
  next_evaluation_due
) VALUES (
  'YOUR_STAFF_UUID_HERE',  -- Replace with actual staff UUID
  'Dr. Martinez',
  CURRENT_DATE,
  'annual',
  91.0,
  'completed',
  '2024-07-15'
) RETURNING id;

-- Step 3: Create competency areas (use evaluation_id from Step 2)
INSERT INTO staff_competency_areas (
  evaluation_id,
  category_name,
  weight,
  category_score
) VALUES
  ('EVALUATION_UUID_1', 'Safety & Compliance', 25, 100.0),
  ('EVALUATION_UUID_1', 'Communication Skills', 20, 100.0),
  ('EVALUATION_UUID_1', 'Documentation', 15, 80.0),
  ('EVALUATION_UUID_1', 'Clinical Assessment', 25, 95.0),
  ('EVALUATION_UUID_1', 'Supervision & Delegation', 15, 90.0)
RETURNING id;

-- Step 4: Create skills (use area_id from Step 3)
-- For Safety & Compliance (3 skills, all competent)
INSERT INTO staff_competency_skills (
  area_id,
  skill_name,
  status,
  final_score,
  last_assessed
) VALUES
  ('AREA_UUID_1', 'Hand hygiene protocols', 'competent', 95, CURRENT_DATE),
  ('AREA_UUID_1', 'Infection control measures', 'competent', 90, CURRENT_DATE),
  ('AREA_UUID_1', 'Safety equipment usage', 'competent', 100, CURRENT_DATE);

-- For Communication Skills (2 skills, all competent)
INSERT INTO staff_competency_skills (
  area_id,
  skill_name,
  status,
  final_score,
  last_assessed
) VALUES
  ('AREA_UUID_2', 'Patient communication', 'competent', 95, CURRENT_DATE),
  ('AREA_UUID_2', 'Team communication', 'competent', 90, CURRENT_DATE);
```

## 🔍 How Progress Bars Are Calculated

The progress bars calculate:

1. **For each Competency Area**:
   - Count skills with `status = 'competent'`
   - Count total skills in the area
   - Progress = `(competent_skills / total_skills) * 100`

2. **For Overall Score**:
   - Calculated from area scores weighted by their weights
   - Displayed as: `"91% Competent"` (green badge if ≥80%)

## ✅ Verification Steps

After creating assessments, verify:

1. **Check Database**:
   ```sql
   -- Check evaluations exist
   SELECT id, staff_id, overall_score, status 
   FROM staff_competency_evaluations;
   
   -- Check areas exist with weights
   SELECT id, evaluation_id, category_name, weight 
   FROM staff_competency_areas;
   
   -- Check skills exist with status
   SELECT id, area_id, skill_name, status 
   FROM staff_competency_skills;
   ```

2. **Check API Response**:
   ```bash
   GET /api/staff-performance/competency
   ```
   
   Should return:
   ```json
   {
     "success": true,
     "records": [
       {
         "staffName": "Sarah Johnson",
         "staffRole": "RN",
         "overallScore": 91,
         "competencyAreas": [
           {
             "category": "Safety & Compliance",
             "weight": 0.25,
             "items": [
               { "description": "...", "status": "competent" },
               ...
             ]
           }
         ]
       }
     ]
   }
   ```

3. **Check UI**:
   - Go to `/staff-competency`
   - Click **"Staff Assessments"** tab
   - You should see:
     - Staff name and role
     - Overall score badge (e.g., "91% Competent")
     - List of competency areas with progress bars
     - Each area showing "X of Y skills competent"

## 🐛 Troubleshooting

### Problem: No progress bars showing

**Solution**:
1. Check if evaluations exist: `SELECT * FROM staff_competency_evaluations;`
2. Check if areas exist: `SELECT * FROM staff_competency_areas;`
3. Check if skills exist: `SELECT * FROM staff_competency_skills;`
4. Verify skills have `status` set to "competent", "needs-improvement", or "not-competent"

### Problem: Progress bars showing 0%

**Solution**:
- Check that skills have `status = 'competent'` (not NULL or 'not-assessed')
- Update skills: `UPDATE staff_competency_skills SET status = 'competent' WHERE status IS NULL;`

### Problem: Weight not showing correctly

**Solution**:
- Verify area weights are set: `SELECT category_name, weight FROM staff_competency_areas;`
- Weights should be integers 0-100 (representing percentages)
- If stored as decimals (0.25), multiply by 100 in the query

### Problem: Overall score badge not green

**Solution**:
- Check overall score is ≥ 80%: `SELECT overall_score FROM staff_competency_evaluations;`
- Update if needed: `UPDATE staff_competency_evaluations SET overall_score = 91 WHERE overall_score < 80;`

## 📝 Important Notes

1. **Skill Status Values**: 
   - Only skills with `status = 'competent'` count toward progress
   - Status must be one of: `'competent'`, `'needs-improvement'`, `'not-competent'`, `'not-assessed'`

2. **Weight Calculation**:
   - Weights are stored as integers 0-100 in database
   - API accepts decimal (0.25) and converts to integer (25)

3. **Progress Bar Color**:
   - Progress bars are **red** (`bg-red-500`) to match the design
   - Background is gray (`bg-gray-200`)

4. **Overall Score Badge**:
   - Green: ≥ 80% Competent
   - Yellow: 70-79% Developing/Needs Improvement
   - Red: < 70% Not Competent

## 🎯 Quick Test Script

Run this to create a complete test assessment:

```sql
-- Replace STAFF_UUID_HERE with actual staff UUID
DO $$
DECLARE
  staff_uuid UUID := 'STAFF_UUID_HERE';  -- Change this!
  eval_id UUID;
  area1_id UUID;
  area2_id UUID;
BEGIN
  -- Create evaluation
  INSERT INTO staff_competency_evaluations (
    staff_id, evaluator_name, evaluation_date, evaluation_type,
    overall_score, status, next_evaluation_due
  ) VALUES (
    staff_uuid, 'Dr. Martinez', CURRENT_DATE, 'annual',
    91.0, 'completed', '2024-07-15'
  ) RETURNING id INTO eval_id;
  
  -- Create Safety & Compliance area
  INSERT INTO staff_competency_areas (
    evaluation_id, category_name, weight, category_score
  ) VALUES (
    eval_id, 'Safety & Compliance', 25, 100.0
  ) RETURNING id INTO area1_id;
  
  -- Create Communication Skills area
  INSERT INTO staff_competency_areas (
    evaluation_id, category_name, weight, category_score
  ) VALUES (
    eval_id, 'Communication Skills', 20, 100.0
  ) RETURNING id INTO area2_id;
  
  -- Add skills to Safety & Compliance (3 competent)
  INSERT INTO staff_competency_skills (area_id, skill_name, status, final_score)
  VALUES
    (area1_id, 'Hand hygiene protocols', 'competent', 95),
    (area1_id, 'Infection control measures', 'competent', 90),
    (area1_id, 'Safety equipment usage', 'competent', 100);
  
  -- Add skills to Communication Skills (2 competent)
  INSERT INTO staff_competency_skills (area_id, skill_name, status, final_score)
  VALUES
    (area2_id, 'Patient communication', 'competent', 95),
    (area2_id, 'Team communication', 'competent', 90);
  
  RAISE NOTICE '✅ Test assessment created! Evaluation ID: %', eval_id;
END $$;
```

After running this script, refresh the Staff Assessments tab to see the progress bars!


