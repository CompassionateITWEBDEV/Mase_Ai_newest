# 🚀 Quick Start: Professional Development Plan

## 📝 Simple Step-by-Step Process

### STEP 1: Create Staff User (Admin)
**Asa dapit?** `/admin/users`

1. I-click ang "Add User" button
2. Fill-in:
   - Name: e.g., "Juan dela Cruz"
   - Email: e.g., "juan@example.com"
   - Password: any password
   - Role: Select (e.g., STAFF, NURSE)
   - Department: e.g., "Nursing"
3. I-click "Create User"
4. ✅ Done! Makita na ang user sa list

---

### STEP 2: Create Performance Evaluation (Staff Self-Evaluation)
**Asa dapit?** `/self-evaluation`

1. I-login as ang staff user nga gi-create
2. Go to Self-Evaluation page
3. Complete ang Performance Evaluation
   - Fill out tanan questions
   - Submit evaluation
4. ✅ Done! Ang system automatically mag-generate Performance Goals kung low scores (< 4.0)

**Or via API (for testing):**
```bash
POST /api/self-evaluations
{
  "staffId": "staff-uuid",
  "evaluationType": "performance",
  "responses": { "quality": "3" },  // Low score para makita ang goal
  "status": "submitted"
}
```

---

### STEP 3: Create Competency Evaluation with PIP (Supervisor)
**Asa dapit?** `/staff-competency`

**Important:** Dapat supervisor/admin ka para maka-create!

1. Go to Staff Competency Review page
2. I-click "New Assessment"
3. Fill-in:
   - Staff Member: Select ang staff
   - Evaluation Type: Select (Initial, Annual, etc.)
   - Next Evaluation Due: Set date
   - Evaluator Name: Your name
4. I-click "Create Assessment"
5. **Para makakuha og Competency Goals:**
   - After creating, i-edit ang assessment
   - Add competency areas ug skills
   - Set skill status to "needs-improvement" para automatic makakuha og PIP goals

**Or create PIP directly via API:**
```bash
POST /api/staff-performance/competency
{
  "action": "create-evaluation",
  "data": {
    "staffId": "staff-uuid",
    "status": "needs-improvement",  // Important!
    "performanceImprovementPlan": {
      "startDate": "2024-01-15",
      "targetCompletionDate": "2024-04-15",
      "goals": [
        {
          "description": "Improve Documentation Efficiency",
          "targetDate": "2024-03-15",
          "progress": 25,
          "actions": ["Complete training", "Practice daily"]
        }
      ]
    }
  }
}
```

---

### STEP 4: View Results (Staff)
**Asa dapit?** `/self-evaluation`

1. I-login as ang staff member
2. Go to Self-Evaluation page
3. Scroll down sa "Professional Development Plan" section
4. Makita nimo:
   - **Left Column:** Performance Goals
   - **Right Column:** Competency Goals
5. Open Browser Console (F12) para makita ang detailed logs

**✅ Makita nimo:**
- Performance Goals gikan sa PIP ug evaluations
- Competency Goals gikan sa PIP ug skills
- Progress, target dates, action items
- Console logs showing data sources

---

## 🔍 How to Verify

### Check Browser Console (F12):
Makita nimo ang logs like:
```
✅ [Performance Goals] Total: 2 goals
✅ [Competency Goals] Total: 3 goals
🔍 [Data Sources]:
  - Primary: /api/staff-performance/pip-goals
  - Supplementary Performance: /api/self-evaluations?evaluationType=performance
  - Supplementary Competency: /api/staff-performance/competency
```

### Check Database (Optional):
```sql
-- Check PIP goals
SELECT * FROM staff_pip WHERE staff_id = 'your-staff-id';
SELECT * FROM staff_pip_goals WHERE pip_id IN (
  SELECT id FROM staff_pip WHERE staff_id = 'your-staff-id'
);
```

---

## ⚠️ Common Issues

### Problem: Goals wala mag-appear
**Fix:**
1. Check console (F12) para makita errors
2. Verify nga naa data sa database
3. Check nga ang PIP status is "active"

### Problem: Wrong goals category
**Fix:**
- Performance Goals: general performance improvements
- Competency Goals: specific skills, certifications, training

### Problem: Duplicate goals
**Fix:**
- Ang system automatically removes duplicates
- Check console logs

---

## 📊 Data Flow (Simple)

```
Admin Page
  ↓ Create Staff
Staff Table
  ↓
Self-Evaluation Page
  ↓ Submit Performance
Performance Goals Generated
  ↓
Staff Competency Page
  ↓ Create PIP
Competency Goals Created
  ↓
Self-Evaluation Page
  ↓ View Professional Development Plan
All Goals Displayed ✅
```

---

## ✅ Quick Checklist

Para makakuha og complete results:

- [ ] Created staff user sa `/admin/users`
- [ ] Created performance evaluation (or low score) sa `/self-evaluation`
- [ ] Created competency evaluation sa `/staff-competency`
- [ ] Created PIP with goals (kung needs-improvement)
- [ ] Viewed results sa `/self-evaluation` → Professional Development Plan
- [ ] Checked browser console (F12) para makita ang logs
- [ ] Verified nga ang goals accurate gikan sa database

---

**Need more details?** Check ang full guide: `PROFESSIONAL_DEVELOPMENT_PLAN_GUIDE.md`


