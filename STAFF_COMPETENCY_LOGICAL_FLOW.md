# Staff Competency - Logical Flow (Asa Mag Sugod)

Kini ang step-by-step logic flow para makita nimo ang results sa Staff Assessment.

## 🎯 Main Goal
**Makita ang Staff Assessment results sa frontend**

Para makita ang results, kinahanglan nimo:
1. **INSERT** data sa database (create assessment)
2. **FETCH** data gikan sa database (load records)
3. **DISPLAY** data sa frontend (show in UI)

---

## 📋 Logical Flow (Step-by-Step)

### **STEP 1: INSERT Data (Create Assessment)**

**Unsa ang kinahanglan:**
- Staff member (naa sa `staff` table)
- Competency areas (Safety, Communication, etc.)
- Skills under each area

**Asa mag start:**
1. **Option A: Via UI**
   - Go to `/staff-competency`
   - Click **"+ New Assessment"** button
   - Fill form:
     - Select Staff Member
     - Choose Evaluation Type
     - Set Next Evaluation Due date
     - Enter Evaluator Name
   - Click **"Create Assessment"**
   - **Result:** New record sa `staff_competency_evaluations` table

2. **Option B: Via API**
   ```javascript
   POST /api/staff-performance/competency
   {
     "action": "create-evaluation",
     "data": {
       "staffId": "uuid-here",
       "evaluationType": "annual",
       "evaluatorName": "John Doe",
       "nextEvaluationDue": "2024-12-31",
       "competencyAreas": [...]
     }
   }
   ```

3. **Option C: Via SQL (Direct Database)**
   ```sql
   INSERT INTO staff_competency_evaluations (
     staff_id, 
     evaluation_type, 
     evaluator_name,
     next_evaluation_due
   ) VALUES (
     'staff-uuid-here',
     'annual',
     'John Doe',
     '2024-12-31'
   );
   ```

**After INSERT:**
- ✅ Record exists sa `staff_competency_evaluations`
- ❌ Pero wala pa areas ug skills (empty assessment)

---

### **STEP 2: INSERT Areas (Competency Categories)**

**Unsa ang kinahanglan:**
- Evaluation ID gikan sa Step 1
- Area names (Safety & Compliance, Communication Skills, etc.)
- Weights (25%, 20%, etc.)

**Asa mag start:**
1. **Via UI:**
   - After creating assessment, click **"Assess Skills"** button
   - Add competency areas
   - Set weights

2. **Via API:**
   ```javascript
   // Areas are created automatically when you create evaluation with competencyAreas
   // Or manually:
   POST /api/staff-performance/competency
   {
     "action": "create-evaluation",
     "data": {
       "evaluationId": "eval-uuid",
       "competencyAreas": [
         {
           "category": "Safety & Compliance",
           "weight": 0.25,  // 25%
           "items": [...]
         }
       ]
     }
   }
   ```

3. **Via SQL:**
   ```sql
   INSERT INTO staff_competency_areas (
     evaluation_id,
     category_name,
     weight
   ) VALUES (
     'evaluation-uuid-here',
     'Safety & Compliance',
     25  -- 25%
   );
   ```

**After INSERT Areas:**
- ✅ Areas exist sa `staff_competency_areas`
- ❌ Pero wala pa skills (empty areas)

---

### **STEP 3: INSERT Skills (Individual Competencies)**

**Unsa ang kinahanglan:**
- Area ID gikan sa Step 2
- Skill names (Hand Hygiene, PPE Usage, etc.)
- Status (competent, needs-improvement, etc.)
- Scores (self-assessment, supervisor-assessment, final_score)

**Asa mag start:**
1. **Via UI:**
   - Click **"Assess Skills"** on a record
   - Add skills under each area
   - Set status to "competent" para makita ang progress bars
   - Set scores (0-100)

2. **Via API:**
   ```javascript
   PATCH /api/staff-performance/competency
   {
     "action": "update-skills",
     "evaluationId": "eval-uuid",
     "skillAssessments": {
       "skill-id-1": {
         "supervisorScore": 90,
         "status": "competent",
         "notes": "Excellent"
       }
     }
   }
   ```

3. **Via SQL:**
   ```sql
   INSERT INTO staff_competency_skills (
     area_id,
     skill_name,
     status,
     final_score,
     supervisor_assessment_score
   ) VALUES (
     'area-uuid-here',
     'Hand Hygiene',
     'competent',
     90,
     90
   );
   ```

**After INSERT Skills:**
- ✅ Skills exist sa `staff_competency_skills`
- ✅ Status set to "competent"
- ✅ Scores set (final_score >= 80)
- ✅ Ready na para i-display!

---

### **STEP 4: FETCH Data (Load Records)**

**Unsa ang mahitabo:**
- Frontend calls API
- API queries database
- API returns data

**Asa mag start:**
1. **Frontend automatically loads:**
   ```typescript
   // app/staff-competency/page.tsx (line 472-491)
   useEffect(() => {
     const loadRecords = async () => {
       const res = await fetch('/api/staff-performance/competency')
       const data = await res.json()
       if (data.success && data.records) {
         const transformed = data.records.map(transformRecord)
         setStaffCompetencyRecords(transformed)
       }
     }
     loadRecords()
   }, [])
   ```

2. **API processes request:**
   ```typescript
   // app/api/staff-performance/competency/route.ts (line 72-291)
   export async function GET(request: NextRequest) {
     // Query database
     const { data: evaluations } = await supabase
       .from('staff_competency_evaluations')
       .select(`
         *,
         areas:staff_competency_areas (
           *,
           skills:staff_competency_skills (*)
         )
       `)
     
     // Transform data
     // Return JSON
   }
   ```

**After FETCH:**
- ✅ Data loaded sa frontend state
- ✅ Ready na para i-display

---

### **STEP 5: DISPLAY Data (Show in UI)**

**Unsa ang mahitabo:**
- Frontend renders the data
- Shows progress bars, badges, scores

**Asa mag start:**
1. **Data flows to UI:**
   ```typescript
   // app/staff-competency/page.tsx (line 1094+)
   {filteredRecords.map((record) => (
     <Card>
       <CardHeader>
         <h3>{record.staffName}</h3>
         <Badge>{record.overallCompetencyScore}% Competent</Badge>
       </CardHeader>
       <CardContent>
         {record.competencyAreas.map((area) => (
           <div>
             <p>{area.name}</p>
             <Progress value={area.areaScore} />
           </div>
         ))}
       </CardContent>
     </Card>
   ))}
   ```

**After DISPLAY:**
- ✅ Results visible sa UI
- ✅ Progress bars showing
- ✅ Scores displayed
- ✅ **SUCCESS!** 🎉

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: INSERT Evaluation                              │
│ - Create record sa staff_competency_evaluations        │
│ - Result: Evaluation ID                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: INSERT Areas                                    │
│ - Create categories sa staff_competency_areas          │
│ - Link to evaluation_id                                 │
│ - Result: Area IDs                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: INSERT Skills                                   │
│ - Create skills sa staff_competency_skills              │
│ - Link to area_id                                       │
│ - Set status = 'competent'                              │
│ - Set final_score >= 80                                 │
│ - Result: Skills with scores                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: FETCH Data                                      │
│ - Frontend calls /api/staff-performance/competency      │
│ - API queries all 3 tables (JOIN)                       │
│ - API transforms data                                   │
│ - Returns JSON to frontend                              │
│ - Result: Data sa frontend state                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 5: DISPLAY Data                                    │
│ - Frontend renders records                              │
│ - Shows progress bars                                   │
│ - Shows scores and badges                               │
│ - Result: VISIBLE SA UI! ✅                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Answer: Asa Mag Start?

### **Para makita ang results, mag start ka sa:**

1. **INSERT data FIRST** (Steps 1-3)
   - Create evaluation
   - Add areas
   - Add skills with status = 'competent'

2. **Then FETCH** (Step 4)
   - Automatic na - page loads data

3. **Then DISPLAY** (Step 5)
   - Automatic na - renders sa UI

### **Simplest Way to Start:**

**Option 1: Use "Create Sample Data" Button**
- Go to `/staff-competency`
- Click "Staff Assessments" tab
- Click "Create Sample Data" button
- **DONE!** - All steps 1-5 automatic

**Option 2: Manual via UI**
1. Click "+ New Assessment"
2. Fill form → Creates evaluation (Step 1)
3. Click "Assess Skills" → Add areas (Step 2)
4. Add skills, set status to "competent" (Step 3)
5. Page auto-refreshes → Shows results (Steps 4-5)

**Option 3: Via SQL (Fastest for Testing)**
```sql
-- Step 1: Insert evaluation
INSERT INTO staff_competency_evaluations (staff_id, evaluation_type, evaluator_name)
SELECT id, 'annual', 'Test Evaluator' FROM staff LIMIT 1
RETURNING id;

-- Step 2: Insert area (use evaluation_id from above)
INSERT INTO staff_competency_areas (evaluation_id, category_name, weight)
VALUES ('evaluation-id-here', 'Safety & Compliance', 25)
RETURNING id;

-- Step 3: Insert skills (use area_id from above)
INSERT INTO staff_competency_skills (area_id, skill_name, status, final_score)
VALUES 
  ('area-id-here', 'Hand Hygiene', 'competent', 90),
  ('area-id-here', 'PPE Usage', 'competent', 85);

-- Steps 4-5: Automatic - refresh page!
```

---

## ✅ Checklist: Para Makita ang Results

- [ ] **Step 1:** At least 1 record sa `staff_competency_evaluations`
- [ ] **Step 2:** At least 1 record sa `staff_competency_areas` (linked to evaluation)
- [ ] **Step 3:** At least 1 record sa `staff_competency_skills` (linked to area)
- [ ] **Step 3:** Skills have `status = 'competent'` AND `final_score >= 80`
- [ ] **Step 4:** API endpoint `/api/staff-performance/competency` returns data
- [ ] **Step 5:** Frontend page `/staff-competency` displays records

**If all checked → Results visible na!** 🎉

---

## 💡 Key Point

**Wala ka makakita results kung:**
- ❌ Wala data sa database (Steps 1-3 wala nahuman)
- ❌ Skills wala status = 'competent' (progress bars 0%)
- ❌ API error (check network tab)
- ❌ Frontend error (check console)

**Makita nimo results kung:**
- ✅ Complete data (evaluation + areas + skills)
- ✅ Skills have status = 'competent'
- ✅ API returns success
- ✅ Frontend renders correctly

---

## 🚀 Recommended Start

**Para makita dayon ang results:**

1. **Fastest:** Click "Create Sample Data" button sa UI
2. **Or:** Run `scripts/create-sample-competency-data.sql` sa Supabase
3. **Then:** Refresh `/staff-competency` page
4. **Result:** Makita na nimo ang staff assessment results!

**That's it!** Start with INSERT (create data), then automatic na ang FETCH ug DISPLAY.

