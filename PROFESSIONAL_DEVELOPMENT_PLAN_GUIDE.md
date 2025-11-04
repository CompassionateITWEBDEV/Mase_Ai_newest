# 📘 Step-by-Step Guide: Professional Development Plan System

## 🎯 Overview

Kini nga guide mag-tudlo nimo step-by-step kung giunsa gamiton ang system para makakuha og accurate Professional Development Plan results nga naa sa Self-Evaluation page, connected gikan sa Performance ug Competency evaluations.

---

## 📋 Table of Contents

1. [Step 1: Create Staff User](#step-1-create-staff-user)
2. [Step 2: Create Performance Evaluation](#step-2-create-performance-evaluation)
3. [Step 3: Create Competency Evaluation with PIP](#step-3-create-competency-evaluation-with-pip)
4. [Step 4: View Results sa Self-Evaluation Page](#step-4-view-results-sa-self-evaluation-page)
5. [Troubleshooting](#troubleshooting)

---

## Step 1: Create Staff User

### Purpose:
Para makakuha og staff member nga pwede ma-evaluate ug makita ang goals.

### Steps:

1. **Open Admin Users Page**
   - I-access: `/admin/users`
   - Or navigate gikan sa main menu → Admin → Users

2. **Click "Add User" Button**
   - Makita nimo ang dialog/form para sa bag-ong user

3. **Fill in Required Fields:**
   ```
   Name: Juan dela Cruz
   Email: juan.delacruz@example.com
   Password: password123 (or any secure password)
   Role: Select appropriate role (e.g., STAFF, NURSE, etc.)
   Department: Nursing (or appropriate department)
   Organization: M.A.S.E Healthcare
   Is Active: ✓ Checked
   ```

4. **Click "Create User"**
   - Dapat makita ang success message
   - Ang bag-ong user dapat makita sa list

### ✅ Verification:
- Makita ang user sa `/admin/users` page
- User dapat naa sa database (`staff` table)

---

## Step 2: Create Performance Evaluation

### Purpose:
Para makakuha og performance data nga mag-generate og Performance Goals.

### Steps:

1. **Login as Staff (or create evaluation via API)**
   - I-login ang staff user nga gi-create sa Step 1

2. **Go to Self-Evaluation Page**
   - Navigate to: `/self-evaluation`
   - Or gikan sa main menu → Self Evaluation

3. **Complete Performance Evaluation**
   - Switch to "Performance" tab (kung naa)
   - Fill out all required questions
   - Submit the evaluation

4. **Or Create via API (for testing):**
   ```bash
   POST /api/self-evaluations
   {
     "staffId": "staff-uuid-here",
     "evaluationType": "performance",
     "responses": {
       "quality-of-work": "3",  // Low score para makita ang goal
       "communication": "4",
       "teamwork": "3"
     },
     "status": "submitted"
   }
   ```

### ✅ Verification:
- Makita ang evaluation sa Self-Evaluation page → History tab
- Performance Goals mag-appear automatically kung naa low scores (< 4.0)

---

## Step 3: Create Competency Evaluation with PIP

### Purpose:
Para makakuha og Competency Goals gikan sa Performance Improvement Plan (PIP).

### Steps:

1. **Go to Staff Competency Review Page**
   - Navigate to: `/staff-competency`
   - Or gikan sa main menu → Staff Competency Review
   - **Important:** Dapat supervisor/admin ka para maka-create

2. **Click "New Assessment" Button**
   - Makita nimo ang form

3. **Fill in Assessment Details:**
   ```
   Staff Member: Select ang staff nga gi-create sa Step 1
   Evaluation Type: Select (Initial, Annual, Skills Validation, or Performance Improvement)
   Next Evaluation Due: Set future date (e.g., 2024-12-31)
   Evaluator Name: Your name or supervisor name
   ```

4. **Click "Create Assessment"**
   - Dapat makita ang success message

5. **Add Competency Areas and Skills:**
   - After creating, i-edit ang assessment
   - Add competency areas (e.g., "Clinical Skills", "Documentation", etc.)
   - Add skills under each area
   - Set skill status to "needs-improvement" or "not-competent" para makita ang goals

6. **Create Performance Improvement Plan (PIP):**
   
   **Option A: Automatic (kung needs-improvement ang status)**
   - Pag-set og skill status to "needs-improvement" or "not-competent"
   - Save the evaluation
   - Ang system automatically mag-create og PIP

   **Option B: Manual via API (for testing):**
   ```bash
   POST /api/staff-performance/competency
   {
     "action": "create-evaluation",
     "data": {
       "staffId": "staff-uuid-here",
       "staffName": "Juan dela Cruz",
       "evaluationType": "annual",
       "status": "needs-improvement",  // Important!
       "performanceImprovementPlan": {
         "startDate": "2024-01-15",
         "targetCompletionDate": "2024-04-15",
         "progress": 0,
         "status": "active",
         "supervisor": "Supervisor Name",
         "goals": [
           {
             "description": "Improve Documentation Efficiency",
             "targetDate": "2024-03-15",
             "completed": false,
             "progress": 25,
             "actions": [
               "Complete documentation training",
               "Practice daily documentation",
               "Review with supervisor weekly"
             ]
           },
           {
             "description": "Enhance Clinical Skills",
             "targetDate": "2024-04-01",
             "completed": false,
             "progress": 10,
             "actions": [
               "Attend skills workshop",
               "Practice under supervision"
             ]
           }
         ],
         "reviewDates": []
       }
     }
   }
   ```

### ✅ Verification:
- Makita ang assessment sa `/staff-competency` page
- Makita ang PIP goals sa database (`staff_pip` ug `staff_pip_goals` tables)

---

## Step 4: View Results sa Self-Evaluation Page

### Purpose:
Para makita ang tanan Performance ug Competency Goals nga connected gikan sa database.

### Steps:

1. **Login as the Staff Member**
   - I-login ang staff nga gi-evaluate
   - Or i-open ang `/self-evaluation` page

2. **Navigate to Professional Development Plan Section**
   - Scroll down sa Self-Evaluation page
   - Makita nimo ang "Professional Development Plan" card

3. **Check Performance Goals:**
   - Sa left column, makita ang "Performance Goals"
   - Dapat makita ang goals gikan sa:
     - PIP goals (performance-related)
     - Performance evaluations nga low scores
   - Each goal mag-show:
     - Description
     - Target completion date
     - Progress percentage
     - Action items (kung naa)

4. **Check Competency Goals:**
   - Sa right column, makita ang "Competency Goals"
   - Dapat makita ang goals gikan sa:
     - PIP goals (competency-related)
     - Skills nga need improvement
   - Same format as Performance Goals

5. **Open Browser Console (F12):**
   - Press F12 para ma-open ang Developer Tools
   - I-check ang Console tab
   - Makita nimo ang detailed logs:
     ```
     ✅ [Performance Goals] Total: 2 goals
     📊 Breakdown: 1 from PIP, 1 from evaluations
     📋 [Performance Goals] Details: [...]
     
     ✅ [Competency Goals] Total: 3 goals
     📊 Breakdown: 2 from PIP, 1 from skills
     📋 [Competency Goals] Details: [...]
     
     🔍 [Data Sources]:
       - Primary: /api/staff-performance/pip-goals (direct PIP goals from database)
       - Supplementary Performance: /api/self-evaluations?evaluationType=performance (low scores)
       - Supplementary Competency: /api/staff-performance/competency (skills needing improvement)
     ```

### ✅ Verification Checklist:

- [ ] Performance Goals naa sa left column
- [ ] Competency Goals naa sa right column
- [ ] Ang goals accurate gikan sa database (dili hardcoded)
- [ ] Makita ang progress, target dates, ug action items
- [ ] Console logs nag-show sa correct data sources
- [ ] Goals connected gikan sa Staff Competency Review page

---

## 🔗 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN/USER CREATION                       │
│  /admin/users → Create Staff → staff table                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              PERFORMANCE EVALUATION                          │
│  /self-evaluation → Submit Performance Evaluation           │
│  → staff_self_evaluations table                              │
│  → Auto-generate goals if scores < 4.0                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           COMPETENCY EVALUATION + PIP                        │
│  /staff-competency → Create Assessment                       │
│  → staff_competency_evaluations table                        │
│  → Create PIP (if needs-improvement)                        │
│  → staff_pip + staff_pip_goals tables                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         PROFESSIONAL DEVELOPMENT PLAN VIEW                   │
│  /self-evaluation → Load PIP Goals                           │
│  → /api/staff-performance/pip-goals                           │
│  → Separate into Performance & Competency Goals              │
│  → Display in UI                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Understanding the Data Sources

### Performance Goals Source:
1. **Primary**: PIP goals gikan sa `staff_pip_goals` (performance-related)
2. **Supplementary**: Performance evaluations nga low scores gikan sa `staff_self_evaluations`

### Competency Goals Source:
1. **Primary**: PIP goals gikan sa `staff_pip_goals` (competency-related)
2. **Supplementary**: Skills nga need improvement gikan sa `staff_competency_skills`

### How Goals are Categorized:
- **Performance Goals**: Goals nga dili specific sa competency/certification/training
- **Competency Goals**: Goals nga naa keywords like "certification", "competency", "skills", "training", "wound care", "IV therapy", etc.

---

## 🧪 Testing Checklist

Para ma-verify nga tanan working correctly:

### Test Case 1: Performance Goals from Low Scores
- [ ] Create performance evaluation with score < 4.0
- [ ] Check Self-Evaluation page
- [ ] Verify Performance Goals mag-appear
- [ ] Check console logs

### Test Case 2: Competency Goals from PIP
- [ ] Create competency evaluation
- [ ] Create PIP with goals
- [ ] Check Self-Evaluation page
- [ ] Verify Competency Goals mag-appear
- [ ] Check console logs

### Test Case 3: Mixed Goals
- [ ] Create both performance evaluation (low score) ug competency PIP
- [ ] Check Self-Evaluation page
- [ ] Verify both Performance ug Competency Goals mag-appear
- [ ] Verify no duplicates

### Test Case 4: Empty State
- [ ] Check staff nga walay evaluations
- [ ] Verify proper empty state messages
- [ ] No errors in console

---

## 🐛 Troubleshooting

### Problem: Goals wala mag-appear
**Solution:**
1. Check browser console (F12) para makita ang errors
2. Verify nga naa ang data sa database:
   ```sql
   -- Check PIP goals
   SELECT * FROM staff_pip WHERE staff_id = 'your-staff-id';
   SELECT * FROM staff_pip_goals WHERE pip_id IN (
     SELECT id FROM staff_pip WHERE staff_id = 'your-staff-id'
   );
   
   -- Check performance evaluations
   SELECT * FROM staff_self_evaluations 
   WHERE staff_id = 'your-staff-id' 
   AND evaluation_type = 'performance';
   
   -- Check competency evaluations
   SELECT * FROM staff_competency_evaluations 
   WHERE staff_id = 'your-staff-id';
   ```
3. Verify nga ang API endpoint working:
   ```
   GET /api/staff-performance/pip-goals?staffId=your-staff-id
   ```

### Problem: Goals duplicate
**Solution:**
- Ang system automatically nag-remove duplicates based sa description
- Check console logs para makita kung unsa ang duplicate

### Problem: Goals categorized incorrectly
**Solution:**
- Ang categorization based sa goal description keywords
- I-check ang API code sa `app/api/staff-performance/pip-goals/route.ts`
- I-update ang keywords kung kinahanglan

### Problem: Empty state showing bisan naa data
**Solution:**
1. Check nga ang staff_id correct (should be UUID)
2. Check nga ang PIP status is "active"
3. Check browser console for API errors
4. Verify nga ang API response format correct:
   ```json
   {
     "success": true,
     "performanceGoals": [...],
     "competencyGoals": [...],
     "totalPips": 1
   }
   ```

---

## 📝 Quick Reference

### Key URLs:
- Admin Users: `/admin/users`
- Self-Evaluation: `/self-evaluation`
- Staff Competency Review: `/staff-competency`

### Key API Endpoints:
- Create Staff: `POST /api/staff/create`
- Create Performance Evaluation: `POST /api/self-evaluations`
- Create Competency Evaluation: `POST /api/staff-performance/competency`
- Get PIP Goals: `GET /api/staff-performance/pip-goals?staffId={id}`

### Key Database Tables:
- `staff` - Staff members
- `staff_self_evaluations` - Performance evaluations
- `staff_competency_evaluations` - Competency evaluations
- `staff_pip` - Performance Improvement Plans
- `staff_pip_goals` - PIP Goals

---

## ✅ Success Criteria

Ang system successful kung:
1. ✅ Makita ang Performance Goals gikan sa PIP ug evaluations
2. ✅ Makita ang Competency Goals gikan sa PIP ug skills
3. ✅ Ang goals accurate gikan sa database (dili hardcoded)
4. ✅ Console logs nag-show sa correct data sources
5. ✅ No errors sa browser console
6. ✅ Proper empty states kung walay data

---

## 📞 Need Help?

Kung naa pa questions or issues:
1. Check ang browser console (F12) para makita ang errors
2. Check ang database tables para verify ang data
3. Check ang API responses para verify ang data flow
4. Review ang code comments sa `app/self-evaluation/page.tsx` ug `app/api/staff-performance/pip-goals/route.ts`

---

**Last Updated:** 2024-01-XX
**Version:** 1.0


