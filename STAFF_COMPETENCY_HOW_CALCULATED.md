# Staff Competency - Gi Unsa Pag Calculate (How Results Are Obtained)

Kini ang explanation kung gi unsa pag calculate ang different results para sa each staff member.

## 🎯 Question: "Diba lahi sila gi unsa aron makuha na?"

**Oo, lahi-lahi sila!** Each staff member has different:
- **Overall Percentage** (91%, 85%, 76%, 89%, 87%)
- **Competency Areas** (Safety, Communication, Clinical, Personal Care, Therapy, etc.)
- **Area Scores** (different scores per area)
- **Skills** (different skills assessed)

---

## 📊 How Different Percentages Are Calculated

### **Formula: Weighted Average**

```
Overall Score = Σ(Area Score × Weight) / Total Weight
```

**Example Calculation:**

**Sarah Johnson (91%):**
```
Area 1: Safety & Compliance
  - Area Score: 95%
  - Weight: 25%
  - Contribution: 95 × 25 = 2,375

Area 2: Communication Skills
  - Area Score: 90%
  - Weight: 20%
  - Contribution: 90 × 20 = 1,800

Area 3: Documentation
  - Area Score: 88%
  - Weight: 10%
  - Contribution: 88 × 10 = 880

Area 4: Clinical Assessment
  - Area Score: 92%
  - Weight: 40%
  - Contribution: 92 × 40 = 3,680

Area 5: Supervision & Delegation
  - Area Score: 85%
  - Weight: 5%
  - Contribution: 85 × 5 = 425

Total Weight = 25 + 20 + 10 + 40 + 5 = 100
Total Contribution = 2,375 + 1,800 + 880 + 3,680 + 425 = 9,160

Overall Score = 9,160 / 100 = 91.6% ≈ 91% ✅
```

**Lisa Garcia (85%):**
```
Area 1: Safety & Compliance
  - Area Score: 88%
  - Weight: 25%
  - Contribution: 88 × 25 = 2,200

Area 2: Communication Skills
  - Area Score: 85%
  - Weight: 20%
  - Contribution: 85 × 20 = 1,700

Area 3: Documentation
  - Area Score: 82%
  - Weight: 10%
  - Contribution: 82 × 10 = 820

Area 4: Clinical Skills
  - Area Score: 84%
  - Weight: 30%
  - Contribution: 84 × 30 = 2,520

Total Weight = 25 + 20 + 10 + 30 = 85
Total Contribution = 2,200 + 1,700 + 820 + 2,520 = 7,240

Overall Score = 7,240 / 85 = 85.17% ≈ 85% ✅
```

**Robert Thompson (76%):**
```
Area 1: Safety & Compliance
  - Area Score: 80%
  - Weight: 25%
  - Contribution: 80 × 25 = 2,000

Area 2: Communication Skills
  - Area Score: 75%
  - Weight: 20%
  - Contribution: 75 × 20 = 1,500

Area 3: Documentation
  - Area Score: 70%
  - Weight: 10%
  - Contribution: 70 × 10 = 700

Area 4: Personal Care
  - Area Score: 75%
  - Weight: 30%
  - Contribution: 75 × 30 = 2,250

Total Weight = 25 + 20 + 10 + 30 = 85
Total Contribution = 2,000 + 1,500 + 700 + 2,250 = 6,450

Overall Score = 6,450 / 85 = 75.88% ≈ 76% ✅
```

---

## 🔍 How Area Scores Are Calculated

### **Formula: Average of Skill Scores**

```
Area Score = Σ(Skill Final Score) / Number of Skills
```

**Example: Safety & Compliance Area**

**Sarah Johnson:**
```
Skill 1: Hand Hygiene
  - Final Score: 95%

Skill 2: PPE Usage
  - Final Score: 92%

Skill 3: Infection Control
  - Final Score: 98%

Area Score = (95 + 92 + 98) / 3 = 95% ✅
```

**Robert Thompson:**
```
Skill 1: Hand Hygiene
  - Final Score: 78%

Skill 2: PPE Usage
  - Final Score: 82%

Skill 3: Infection Control
  - Final Score: 80%

Area Score = (78 + 82 + 80) / 3 = 80% ✅
```

**That's why different!** Different skill scores = different area scores = different overall scores!

---

## 🎯 How Different Competency Areas Are Determined

### **1. Role-Based Areas**

Different staff roles have different competency areas:

**RN (Registered Nurse):**
- Safety & Compliance
- Communication Skills
- Documentation
- Clinical Assessment
- Supervision & Delegation

**LPN (Licensed Practical Nurse):**
- Safety & Compliance
- Communication Skills
- Documentation
- Clinical Skills

**HHA (Home Health Aide):**
- Safety & Compliance
- Communication Skills
- Documentation
- Personal Care

**PT (Physical Therapist):**
- Safety & Compliance
- Communication Skills
- Documentation
- Therapy Assessment

**OT (Occupational Therapist):**
- Safety & Compliance
- Communication Skills
- Documentation
- Occupational Document

### **2. Database Storage**

Each evaluation stores its own areas:

```sql
-- Sarah Johnson's evaluation
INSERT INTO staff_competency_areas (evaluation_id, category_name, weight)
VALUES 
  ('eval-sarah-1', 'Safety & Compliance', 25),
  ('eval-sarah-1', 'Communication Skills', 20),
  ('eval-sarah-1', 'Documentation', 10),
  ('eval-sarah-1', 'Clinical Assessment', 40),
  ('eval-sarah-1', 'Supervision & Delegation', 5);

-- Robert Thompson's evaluation (HHA - different areas)
INSERT INTO staff_competency_areas (evaluation_id, category_name, weight)
VALUES 
  ('eval-robert-1', 'Safety & Compliance', 25),
  ('eval-robert-1', 'Communication Skills', 20),
  ('eval-robert-1', 'Documentation', 10),
  ('eval-robert-1', 'Personal Care', 30);  -- Different!
```

---

## 💻 Code Implementation

### **1. Overall Score Calculation** (Frontend)

**File:** `app/staff-competency/page.tsx` (line 640-659)

```typescript
// Recalculate overall score from area scores and weights
let overallScore = 0
if (competencyAreas.length > 0) {
  const totalWeight = competencyAreas.reduce((sum: number, area: any) => sum + (area.weight || 0), 0)
  if (totalWeight > 0) {
    overallScore = Math.round(
      competencyAreas.reduce((sum: number, area: any) => {
        const areaScore = area.areaScore || 0
        const weight = area.weight || 0
        return sum + (areaScore * weight / totalWeight)  // Weighted average
      }, 0)
    )
  }
}
```

### **2. Area Score Calculation** (Frontend)

**File:** `app/staff-competency/page.tsx` (line 617-628)

```typescript
// Calculate area score based on actual skill scores
let areaScore = 0
if (skills.length > 0) {
  const totalScore = skills.reduce((sum: number, skill: any) => {
    const skillScore = skill.supervisorAssessment || skill.selfAssessment || 0
    return sum + skillScore
  }, 0)
  areaScore = Math.round(totalScore / skills.length)  // Average
}
```

### **3. Overall Score Update** (Backend)

**File:** `app/api/staff-performance/competency/route.ts` (line 850-883)

```typescript
// Recalculate overall score (weighted average)
const { data: allAreas } = await supabase
  .from('staff_competency_areas')
  .select('weight, category_score')
  .eq('evaluation_id', evaluationId)

if (allAreas && allAreas.length > 0) {
  const totalWeight = allAreas.reduce((sum, area) => sum + (area.weight || 0), 0)
  if (totalWeight > 0) {
    const overallScore = allAreas.reduce((sum, area) => {
      const areaScore = parseFloat(area.category_score?.toString() || '0')
      const weight = area.weight || 0
      return sum + (areaScore * weight / totalWeight)  // Weighted average
    }, 0)
    
    // Update evaluation
    await supabase
      .from('staff_competency_evaluations')
      .update({
        overall_score: Math.round(overallScore),
        status: newStatus
      })
      .eq('id', evaluationId)
  }
}
```

---

## 📋 Complete Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ DATABASE: Individual Records per Staff                  │
│                                                          │
│ Sarah Johnson Evaluation:                               │
│   - Area: Safety (score: 95%, weight: 25%)             │
│   - Area: Communication (score: 90%, weight: 20%)        │
│   - Area: Clinical (score: 92%, weight: 40%)           │
│   → Calculated: 91% overall                            │
│                                                          │
│ Robert Thompson Evaluation:                             │
│   - Area: Safety (score: 80%, weight: 25%)             │
│   - Area: Communication (score: 75%, weight: 20%)       │
│   - Area: Personal Care (score: 75%, weight: 30%)      │
│   → Calculated: 76% overall                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ API: Fetches All Evaluations                            │
│ - Queries staff_competency_evaluations                 │
│ - Joins with staff_competency_areas                     │
│ - Joins with staff_competency_skills                    │
│ - Returns JSON with all data                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ FRONTEND: Calculates Scores                             │
│ - For each staff:                                       │
│   1. Calculate area scores (average of skills)          │
│   2. Calculate overall score (weighted average)         │
│   3. Determine status (competent/needs-improvement)     │
│ - Displays different results per staff                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ UI: Shows Different Results                              │
│ - Sarah: 91% (different areas, different scores)        │
│ - Robert: 76% (different areas, different scores)       │
│ - Lisa: 85% (different areas, different scores)          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Points

### **Why Different Percentages?**

1. **Different Skill Scores**
   - Sarah's skills: 95%, 92%, 98% → Higher area scores
   - Robert's skills: 78%, 82%, 80% → Lower area scores

2. **Different Area Weights**
   - Sarah: Clinical Assessment = 40% weight (heavier)
   - Robert: Personal Care = 30% weight (different focus)

3. **Different Number of Areas**
   - Sarah: 5 areas
   - Robert: 4 areas
   - Different total weights affect calculation

4. **Different Competency Areas**
   - RN: Clinical Assessment, Supervision
   - HHA: Personal Care
   - PT: Therapy Assessment
   - OT: Occupational Document

### **Why Different Areas?**

1. **Role-Based**
   - Each role has different job requirements
   - Different competency areas needed

2. **Stored Per Evaluation**
   - Each evaluation can have custom areas
   - Not all staff assessed on same areas

3. **Flexible System**
   - Can add/remove areas per staff
   - Can customize weights per evaluation

---

## ✅ Summary

**"Diba lahi sila gi unsa aron makuha na?"**

**Oo, lahi-lahi sila because:**

1. **Different Data in Database**
   - Each staff has separate evaluation record
   - Different areas, different skills, different scores

2. **Different Calculations**
   - Area score = Average of skill scores (different per staff)
   - Overall score = Weighted average of area scores (different per staff)

3. **Different Roles**
   - RN, LPN, HHA, PT, OT have different competency areas
   - Different areas = different calculations = different results

4. **Formula is Same, Data is Different**
   - Same calculation logic
   - Different input data = different output results

**That's why makita nimo:**
- Sarah: 91% (5 areas, high scores)
- Robert: 76% (4 areas, lower scores)
- Lisa: 85% (4 areas, medium scores)
- Michael: 89% (different areas, different scores)
- Emily: 87% (different areas, different scores)

**Each staff member = Individual assessment = Individual calculation = Individual result!** 🎯

