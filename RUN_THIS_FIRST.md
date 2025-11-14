# ⚡ IMPORTANTE: Run This First! (Padagan-a una ni!)

## 🎯 Quick Setup - 2 Steps Only!

### **Step 1: Add ALL Database Columns (2 minutes)**

Kulang ug daghan ang columns sa database. I-add tanan at once!

**Open Supabase SQL Editor ug run ni:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor**
4. Copy ug paste ni (COMPLETE SQL):

```sql
-- Add ALL required columns at once
BEGIN;

-- Required columns
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_source TEXT NOT NULL DEFAULT 'Manual Entry';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS diagnosis TEXT NOT NULL DEFAULT 'Not specified';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_provider TEXT NOT NULL DEFAULT 'Not provided';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_id TEXT NOT NULL DEFAULT 'Not provided';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'New';

-- Optional columns (for advanced features)
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS ai_reason TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS ai_recommendation TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS soc_due_date DATE;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS extendedcare_data JSONB;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS eligibility_status JSONB;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_monitoring JSONB;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_patient_name ON public.referrals(patient_name);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_date ON public.referrals(referral_date);

COMMIT;

-- Verify it worked
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'referrals' 
ORDER BY ordinal_position;
```

5. Click **"Run"**

✅ Dapat mu-display ang tanang columns:
```
patient_name
referral_date
referral_source
diagnosis
insurance_provider
insurance_id
status
... etc
```

---

### **Step 2: Add Environment Variable**

Add sa `.env.local` file (same folder sa `package.json`):

```bash
SUPABASE_SERVICE_ROLE_KEY=your-key-here
```

**Para makuha ang key:**
1. Supabase Dashboard → Settings → API
2. Copy ang **Service Role Key**
3. Paste sa `.env.local`

**Then restart server:**
```bash
# Stop (Ctrl+C)
npm run dev
```

---

## ✅ Done! Try It Now!

1. Go to **Referral Management** page
2. Fill out ang form:
   - Patient Name ✓
   - Referral Date ✓
   - Insurance Provider ✓
   - Insurance ID ✓
   - **Primary Diagnosis ✓** ← Naa na ni!
3. Click **Submit Referral**

Dapat mo-work na! 🎉

---

## 📝 Form Fields (All Required)

✅ **Patient Name** - Full name  
✅ **Referral Date** - Date today (default)  
✅ **Insurance Provider** - Medicare, Blue Cross, etc.  
✅ **Insurance ID** - Insurance number  
✅ **Primary Diagnosis** - Reason for referral  

---

## 🐛 If May Error Pa:

### "Could not find the 'diagnosis' column"
**Fix:** Run ang SQL sa Step 1 sa taas

### "Missing SUPABASE_SERVICE_ROLE_KEY"
**Fix:** Add ang key sa `.env.local` (Step 2)

### Still broken?
Check ang console (F12) for detailed errors

---

## 🚀 Optional: Add All Features

Para sa full features (AI recommendations, ExtendedCare, etc.):

**Run ni sa SQL Editor:**
```sql
-- Add ALL optional columns
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS ai_reason TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS ai_recommendation TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS soc_due_date DATE;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS extendedcare_data JSONB;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS eligibility_status JSONB;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_monitoring JSONB;
```

Or use: `scripts/075-add-all-missing-referral-columns.sql`

---

## ✅ Summary

**Required (2 minutes):**
1. ✅ Run SQL to add `diagnosis` column
2. ✅ Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
3. ✅ Restart server

**Optional (extra features):**
- ⬜ Run full migration for AI features

---

**Status:** ✅ Primary Diagnosis field is BACK!  
**Time:** 2 minutes  
**Difficulty:** Sayon ra!

Go ahead, try it! Pwede na mag-submit og referrals! 🎊

