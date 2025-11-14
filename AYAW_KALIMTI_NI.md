# 🚨 AYAW KALIMTI NI! (Don't Forget This!)

## ⚡ KULANG ANG DATABASE! (Database Missing Columns!)

Ang `referrals` table nimo kulang ug columns. I-add una ni before mag-work ang form!

---

## 📋 COPY NI UG RUN SA SUPABASE! (Copy and Run in Supabase!)

### **1. Open Supabase**
- Go to: https://supabase.com/dashboard
- Click your project
- Click **SQL Editor** (sa left side)

### **2. Copy ug Paste ni nga SQL:**

```sql
-- FIX ALL MISSING COLUMNS (INCLUDING REFERRAL_NUMBER!)
BEGIN;

ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_source TEXT NOT NULL DEFAULT 'Manual Entry';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS diagnosis TEXT NOT NULL DEFAULT 'Not specified';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_provider TEXT NOT NULL DEFAULT 'Not provided';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_id TEXT NOT NULL DEFAULT 'Not provided';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'New';

-- Add referral_number with auto-generation
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'referral_number'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN referral_number TEXT;
        UPDATE public.referrals SET referral_number = 'REF-' || id::TEXT WHERE referral_number IS NULL;
        ALTER TABLE public.referrals ALTER COLUMN referral_number SET NOT NULL;
    END IF;
END $$;

ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS ai_reason TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS ai_recommendation TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS soc_due_date DATE;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS extendedcare_data JSONB;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS eligibility_status JSONB;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_monitoring JSONB;

CREATE INDEX IF NOT EXISTS idx_referrals_patient_name ON public.referrals(patient_name);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_date ON public.referrals(referral_date);

COMMIT;
```

### **3. Click "RUN"**

✅ Dapat dili mag-error!

---

## 🔑 STEP 2: Add Service Key

Sa `.env.local` file sa root folder (same folder sa `package.json`):

```bash
SUPABASE_SERVICE_ROLE_KEY=your-key-here
```

**Asa kuhaon ang key:**
1. Supabase Dashboard
2. Settings → API
3. Copy ang **Service Role Key**
4. Paste sa `.env.local`

---

## 🔄 STEP 3: Restart Server

```bash
# Stop (press Ctrl+C)
npm run dev
```

---

## ✅ HUMAN NA! (Done!)

Try subay ang form:
- Patient Name ✓
- Referral Date ✓  
- Insurance Provider ✓
- Insurance ID ✓
- Primary Diagnosis ✓

Click **Submit Referral** - MAGWORK NA! 🎉

---

## 🐛 Kung mag-error pa gihapon:

### "Could not find the 'xxxx' column"
**Fix:** Di pa na-run ang SQL sa taas. Run it again!

### "Missing SUPABASE_SERVICE_ROLE_KEY"
**Fix:** Check `.env.local` - add ang service key!

### "Server error 500"
**Fix:** 
1. Check server console sa terminal
2. Check browser console (press F12)
3. Ensure gi-restart ang server human mag-add sa `.env.local`

---

## 📝 Files Imong I-check:

- ✅ `.env.local` - Must have `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Supabase Database - Must have all columns
- ✅ Server - Must be restarted after changes

---

## 🎯 Summary (3 Steps Lang!)

1. ✅ **Run SQL** sa Supabase (adds all columns)
2. ✅ **Add key** sa `.env.local` 
3. ✅ **Restart** server

**Time:** 3 minutes total  
**Difficulty:** Easy!  
**Result:** Working referral form! 🎊

---

## 💡 Tip

Kung complex ra kaayo, just:
1. Open `RUN_THIS_FIRST.md` - detailed guide
2. Follow step-by-step
3. Mag-work jud na!

---

**Maayo unta! Salamat!** 🙏

