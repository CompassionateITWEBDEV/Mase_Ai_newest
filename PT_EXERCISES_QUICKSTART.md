# 🚀 PT Exercises - Quick Start Guide (5 Minutes)

## ⚡ Setup in 3 Simple Steps

---

## **STEP 1: Run Database Setup (2 minutes)**

1. Open your **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy the contents of `scripts/setup-pt-exercises.sql`
4. Click **"Run"**
5. You should see success messages ✅

**Alternative:** Run the individual files:
```sql
-- File 1: scripts/115-pt-exercise-tables.sql
-- File 2: scripts/116-pt-exercise-seed-data.sql (optional sample data)
```

---

## **STEP 2: Verify Environment Variables (1 minute)**

Make sure your `.env.local` file has:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## **STEP 3: Restart Server & Test (2 minutes)**

```bash
# Stop your dev server (Ctrl+C)
npm run dev
# or
yarn dev
```

---

## 🧪 Quick Test

### Test as PT Staff:

1. **Navigate to:** `http://localhost:3000/pt-management`

2. **Click:** "Create New Program"

3. **Fill in:**
   - Patient: Select any patient
   - Program Name: "Post-Surgery Rehab"
   - Total Weeks: 8
   - Total Sessions: 24
   - Next Session: Select tomorrow's date

4. **Add Exercise:**
   - Name: "Ankle Pumps"
   - Description: "Flex and point your foot"
   - Duration: "2 minutes"
   - Repetitions: "10-15 reps"
   - Sets: 3
   - Difficulty: Easy
   - AI Tips: "Keep movements slow and controlled"

5. **Click:** "Create Program"

6. **Result:** ✅ You should see success toast and program in the list!

---

### Test as Patient:

1. **Navigate to:** `http://localhost:3000/patient-portal`

2. **Login** as the patient you assigned the program to

3. **Click:** "PT Exercises" tab

4. **You Should See:**
   - ✅ Program name and progress
   - ✅ Week 1/8
   - ✅ Sessions 0/24
   - ✅ Exercise list with "Ankle Pumps"
   - ✅ Weekly goals
   - ✅ Exercise timer

5. **Click:** "Mark Complete" on the exercise

6. **Result:** ✅ Exercise turns green with checkmark!

---

## 📋 What You Get

### ✅ **4 Database Tables**
- `pt_exercise_programs`
- `pt_exercises`
- `pt_exercise_completions`
- `pt_weekly_goals`

### ✅ **5 API Endpoints**
- Patient exercise fetching
- Exercise completion
- Goal tracking
- Staff program management
- Program creation

### ✅ **2 User Interfaces**
- **Patient Portal** (`/patient-portal` → PT Exercises tab)
  - View exercises
  - Complete exercises
  - Track goals
  - Use timer
  
- **PT Management** (`/pt-management`)
  - Create programs
  - Assign exercises
  - Set goals
  - Monitor progress

---

## 🎯 Key Features

### For Patients:
- ✅ View assigned exercises
- ✅ One-click completion
- ✅ Progress tracking (weeks, sessions, %)
- ✅ AI coach tips
- ✅ Weekly goal checklist
- ✅ Integrated timer
- ✅ Beautiful, mobile-friendly UI

### For PT Staff:
- ✅ Create custom programs
- ✅ Add multiple exercises
- ✅ Set difficulty levels
- ✅ Add personalized tips
- ✅ Track patient progress
- ✅ Visual progress bars
- ✅ Status management

---

## 🔧 Troubleshooting

### "No active program found"
**Fix:** Create a program in `/pt-management` for the patient

### "Failed to fetch"
**Fix:** 
1. Check `.env.local` has correct Supabase credentials
2. Verify database tables exist
3. Restart dev server

### Can't see exercises
**Fix:** Make sure exercises were added when creating the program

### Database errors
**Fix:** Re-run `scripts/setup-pt-exercises.sql` in Supabase

---

## 📖 Full Documentation

See `PT_EXERCISES_IMPLEMENTATION.md` for:
- Complete feature breakdown
- Database schema details
- API endpoint documentation
- Security features
- Future enhancements

---

## 🎉 You're Done!

The PT Exercises feature is now **fully functional**! 

- ✅ Database configured
- ✅ APIs working
- ✅ Patient portal connected
- ✅ Staff interface ready
- ✅ Real-time data flow

**Start creating exercise programs for your patients!** 🏋️

---

## 📞 Need Help?

Check the browser console and server logs for detailed error messages. All API endpoints have comprehensive logging.

**Common URLs:**
- Patient Portal: `/patient-portal`
- PT Management: `/pt-management`
- Patient Login: `/patient-login`

**Have fun helping patients recover! 💪**

