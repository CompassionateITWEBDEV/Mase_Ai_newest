# Staff Competency Areas - Gi Unsa Pag Setup (How Areas Are Assigned)

Kini ang explanation kung gi unsa pag determine ang different competency areas para sa each staff member.

## 🎯 Question: "Naa occupational assessment, naay therapy, ang uban wala, personal care - asa mana nila gi kuha, gi unsa mana setup?"

**Answer:** Based sa **staff role/department** gikan sa database!

---

## 📋 How It Works

### **Step 1: Get Staff Role from Database**

When creating assessment, system checks:
```typescript
// app/staff-competency/page.tsx (line 1906)
const staffRole = selectedStaff.department || 'STAFF'
```

**Source:** `staff.department` field sa database
- RN = "RN" or "Clinical"
- LPN = "LPN" 
- HHA = "HHA" or "Personal Care"
- PT = "PT" or "Physical Therapy"
- OT = "OT" or "Occupational Therapy"

### **Step 2: Assign Areas Based on Role**

System calls function:
```typescript
// app/staff-competency/page.tsx (line 1907)
const defaultCompetencyAreas = getCompetencyAreasForRole(staffRole)
```

**Function:** `getCompetencyAreasForRole(role)` (line 126-469)

---

## 🎯 Role-Based Area Assignment

### **Base Areas (ALL Staff Get These):**

1. **Safety & Compliance** (Weight: 25%)
   - Hand Hygiene
   - PPE Usage
   - Infection Control

2. **Communication Skills** (Weight: 20%)
   - Patient Communication
   - Interdisciplinary Communication

3. **Documentation** (Weight: 15%)
   - Clinical Documentation

### **Role-Specific Areas (Different Per Role):**

#### **RN (Registered Nurse):**
```typescript
RN: [
  {
    name: "Clinical Assessment",      // ← RN specific
    weight: 30%,
    skills: [
      "Comprehensive Patient Assessment",
      "Medication Administration",
      "Wound Assessment and Care"
    ]
  },
  {
    name: "Supervision & Delegation", // ← RN specific
    weight: 10%,
    skills: [
      "Appropriate Delegation"
    ]
  }
]
```

**Total Areas for RN:**
- ✅ Safety & Compliance (base)
- ✅ Communication Skills (base)
- ✅ Documentation (base)
- ✅ **Clinical Assessment** (RN only)
- ✅ **Supervision & Delegation** (RN only)

---

#### **LPN (Licensed Practical Nurse):**
```typescript
LPN: [
  {
    name: "Clinical Skills",          // ← LPN specific
    weight: 30%,
    skills: [
      "Basic Patient Assessment",
      "Medication Administration (Supervised)"
    ]
  }
]
```

**Total Areas for LPN:**
- ✅ Safety & Compliance (base)
- ✅ Communication Skills (base)
- ✅ Documentation (base)
- ✅ **Clinical Skills** (LPN only)

---

#### **HHA (Home Health Aide):**
```typescript
HHA: [
  {
    name: "Personal Care",             // ← HHA specific
    weight: 35%,
    skills: [
      "Activities of Daily Living",
      "Safe Transfer Techniques"
    ]
  }
]
```

**Total Areas for HHA:**
- ✅ Safety & Compliance (base)
- ✅ Communication Skills (base)
- ✅ Documentation (base)
- ✅ **Personal Care** (HHA only)

**That's why Robert Thompson (HHA) has "Personal Care"!** ✅

---

#### **PT (Physical Therapist):**
```typescript
PT: [
  {
    name: "Therapy Assessment",        // ← PT specific
    weight: 35%,
    skills: [
      "Physical Therapy Assessment",
      "Treatment Plan Development"
    ]
  }
]
```

**Total Areas for PT:**
- ✅ Safety & Compliance (base)
- ✅ Communication Skills (base)
- ✅ Documentation (base)
- ✅ **Therapy Assessment** (PT only)

**That's why Michael Chan (PT) has "Therapy Assessment"!** ✅

---

#### **OT (Occupational Therapist):**
```typescript
OT: [
  {
    name: "Occupational Assessment",  // ← OT specific
    weight: 35%,
    skills: [
      "Functional Assessment",
      "Adaptive Equipment Training"
    ]
  }
]
```

**Total Areas for OT:**
- ✅ Safety & Compliance (base)
- ✅ Communication Skills (base)
- ✅ Documentation (base)
- ✅ **Occupational Assessment** (OT only)

**That's why Emily Davis (OT) has "Occupational Assessment"!** ✅

---

## 💻 Code Implementation

### **Function: `getCompetencyAreasForRole`**

**File:** `app/staff-competency/page.tsx` (line 126-469)

```typescript
const getCompetencyAreasForRole = (role: string): CompetencyArea[] => {
  // Base areas - ALL staff get these
  const baseAreas: CompetencyArea[] = [
    { name: "Safety & Compliance", weight: 25, ... },
    { name: "Communication Skills", weight: 20, ... },
    { name: "Documentation", weight: 15, ... }
  ]

  // Role-specific areas
  const roleSpecificAreas: Record<string, CompetencyArea[]> = {
    RN: [
      { name: "Clinical Assessment", weight: 30, ... },
      { name: "Supervision & Delegation", weight: 10, ... }
    ],
    LPN: [
      { name: "Clinical Skills", weight: 30, ... }
    ],
    HHA: [
      { name: "Personal Care", weight: 35, ... }
    ],
    PT: [
      { name: "Therapy Assessment", weight: 35, ... }
    ],
    OT: [
      { name: "Occupational Assessment", weight: 35, ... }
    ]
  }

  // Return: base areas + role-specific areas
  return [...baseAreas, ...(roleSpecificAreas[role] || [])]
}
```

### **When Creating Assessment:**

**File:** `app/staff-competency/page.tsx` (line 1904-1950)

```typescript
// Get staff role from database
const staffRole = selectedStaff.department || 'STAFF'

// Get areas for this role
const defaultCompetencyAreas = getCompetencyAreasForRole(staffRole)

// Convert to API format and save to database
const competencyAreasForAPI = defaultCompetencyAreas.map(area => ({
  category: area.name,
  weight: area.weight / 100,
  items: area.skills.map(skill => ({
    description: skill.name,
    supervisorAssessmentScore: skill.supervisorAssessment,
    ...
  }))
}))

// Save to database
await fetch('/api/staff-performance/competency', {
  method: 'POST',
  body: JSON.stringify({
    action: 'create-evaluation',
    data: {
      staffId: newAssessmentData.staffId,
      competencyAreas: competencyAreasForAPI  // ← Areas saved here
    }
  })
})
```

---

## 📊 Database Storage

### **How Areas Are Stored:**

When assessment is created, areas are saved to database:

```sql
-- 1. Create evaluation
INSERT INTO staff_competency_evaluations (staff_id, ...)
VALUES ('staff-uuid', ...)
RETURNING id;

-- 2. Create areas for this evaluation
INSERT INTO staff_competency_areas (evaluation_id, category_name, weight)
VALUES 
  ('eval-id', 'Safety & Compliance', 25),
  ('eval-id', 'Communication Skills', 20),
  ('eval-id', 'Documentation', 15),
  ('eval-id', 'Personal Care', 35);  -- ← Role-specific area

-- 3. Create skills for each area
INSERT INTO staff_competency_skills (area_id, skill_name, ...)
VALUES 
  ('area-id', 'Activities of Daily Living', ...),
  ('area-id', 'Safe Transfer Techniques', ...);
```

### **When Displaying:**

API fetches areas from database:
```sql
SELECT 
  e.*,
  areas:staff_competency_areas (
    category_name,
    weight,
    skills:staff_competency_skills (*)
  )
FROM staff_competency_evaluations e
WHERE e.staff_id = 'staff-uuid'
```

**Result:** Each staff member sees their own areas based on what's stored in their evaluation record.

---

## 🔍 Why Different Staff Have Different Areas

### **Example Scenarios:**

**Scenario 1: Robert Thompson (HHA)**
```
1. Staff record: department = "HHA"
2. Create assessment → getCompetencyAreasForRole("HHA")
3. Returns: Base areas + "Personal Care"
4. Saved to database with "Personal Care" area
5. Display shows: Safety, Communication, Documentation, Personal Care ✅
```

**Scenario 2: Michael Chan (PT)**
```
1. Staff record: department = "PT"
2. Create assessment → getCompetencyAreasForRole("PT")
3. Returns: Base areas + "Therapy Assessment"
4. Saved to database with "Therapy Assessment" area
5. Display shows: Safety, Communication, Documentation, Therapy Assessment ✅
```

**Scenario 3: Emily Davis (OT)**
```
1. Staff record: department = "OT"
2. Create assessment → getCompetencyAreasForRole("OT")
3. Returns: Base areas + "Occupational Assessment"
4. Saved to database with "Occupational Assessment" area
5. Display shows: Safety, Communication, Documentation, Occupational Assessment ✅
```

**Scenario 4: Sarah Johnson (RN)**
```
1. Staff record: department = "RN"
2. Create assessment → getCompetencyAreasForRole("RN")
3. Returns: Base areas + "Clinical Assessment" + "Supervision & Delegation"
4. Saved to database with both areas
5. Display shows: Safety, Communication, Documentation, Clinical Assessment, Supervision ✅
```

---

## 🎯 Summary

### **"Asa nila gi kuha?"**

1. **From Staff Database:**
   - System checks `staff.department` field
   - Gets role: RN, LPN, HHA, PT, OT

2. **From Code Function:**
   - Calls `getCompetencyAreasForRole(role)`
   - Returns base areas + role-specific areas

3. **Saved to Database:**
   - Areas stored in `staff_competency_areas` table
   - Linked to specific evaluation record

4. **Displayed in UI:**
   - Fetches areas from database
   - Shows only areas for that staff member's evaluation

### **"Gi unsa mana setup?"**

**Setup happens in 2 places:**

1. **Code Setup (Hardcoded):**
   ```typescript
   // app/staff-competency/page.tsx
   const roleSpecificAreas = {
     RN: [...],
     HHA: [{ name: "Personal Care", ... }],
     PT: [{ name: "Therapy Assessment", ... }],
     OT: [{ name: "Occupational Assessment", ... }]
   }
   ```

2. **Database Setup (When Creating Assessment):**
   ```typescript
   // When user clicks "Create Assessment"
   const areas = getCompetencyAreasForRole(staffRole)
   // Save to database
   await saveAreasToDatabase(areas)
   ```

### **Why Some Have, Some Don't:**

- **HHA** → Gets "Personal Care" (role-specific)
- **PT** → Gets "Therapy Assessment" (role-specific)
- **OT** → Gets "Occupational Assessment" (role-specific)
- **RN** → Gets "Clinical Assessment" + "Supervision" (role-specific)
- **LPN** → Gets "Clinical Skills" (role-specific)

**All get base areas (Safety, Communication, Documentation), but role-specific areas are different!**

---

## ✅ Quick Reference

| Staff Role | Base Areas | Role-Specific Area |
|-----------|-----------|-------------------|
| **RN** | Safety, Communication, Documentation | Clinical Assessment, Supervision & Delegation |
| **LPN** | Safety, Communication, Documentation | Clinical Skills |
| **HHA** | Safety, Communication, Documentation | **Personal Care** |
| **PT** | Safety, Communication, Documentation | **Therapy Assessment** |
| **OT** | Safety, Communication, Documentation | **Occupational Assessment** |

**That's why:**
- Robert (HHA) has "Personal Care" ✅
- Michael (PT) has "Therapy Assessment" ✅
- Emily (OT) has "Occupational Assessment" ✅
- Sarah (RN) has "Clinical Assessment" + "Supervision" ✅
- Others don't have these (different roles) ✅

**All based on their `staff.department` field in the database!** 🎯

