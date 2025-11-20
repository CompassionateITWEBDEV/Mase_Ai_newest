# 🔧 Fix: "Could not find the 'ai_reason' column" Error

## ✅ The Problem
Your database is missing the `ai_reason` column in the `referrals` table.

---

## 🚀 Quick Fix (2 Options)

### **Option 1: Add the Column (Recommended)**

Run the migration script to add the missing column to your database.

#### **Step 1: Open Supabase SQL Editor**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

#### **Step 2: Run the Migration**
Copy and paste this SQL:

```sql
-- Add ai_reason column to referrals table
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS ai_reason TEXT;

-- Add a comment
COMMENT ON COLUMN public.referrals.ai_reason IS 'AI-powered reasoning and explanation for the recommendation';

-- Verify it was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'referrals' 
  AND column_name = 'ai_reason';
```

#### **Step 3: Click "Run"**

You should see:
```
Success. 1 row returned
column_name | data_type | is_nullable
ai_reason   | text      | YES
```

✅ Done! Now try submitting a referral again.

---

### **Option 2: Use the Migration File**

If you prefer to use the migration file I created:

1. Open `scripts/074-add-ai-reason-column.sql`
2. Copy its contents
3. Paste into Supabase SQL Editor
4. Click "Run"

---

## 🎯 What This Column Does

The `ai_reason` column stores explanations for AI recommendations, such as:
- "Manually entered referral requires review"
- "STAT referral requires immediate review"
- "Standard ExtendedCare referral with good coverage"

It helps staff understand why the system recommended approval, denial, or review.

---

## ✅ Verification

After running the migration, verify it worked:

### **Method 1: Check in Supabase Dashboard**
1. Go to **Table Editor**
2. Select **referrals** table
3. Look for `ai_reason` column in the column list

### **Method 2: Query the Database**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'referrals' 
  AND column_name = 'ai_reason';
```

Should return:
```
column_name
-----------
ai_reason
```

---

## 🐛 Alternative: Remove AI Fields (Temporary Workaround)

If you don't want to use AI features right now, you can temporarily disable them by modifying the API to not send these fields.

**This is already done!** The API has been updated to make `ai_reason` optional, so:
- ✅ If the column exists: AI reason will be saved
- ✅ If the column doesn't exist: Referral will still be created (just without AI reasoning)

However, I **recommend running the migration** to add the column for full functionality.

---

## 🔄 What Changed in the API

I've updated the API (`app/api/referrals/route.ts`) to:
- Only include `ai_reason` if it's provided
- Make it optional instead of required
- Gracefully handle cases where the column might not exist

This means the form should work now even without the migration, but you won't get AI reasoning saved.

---

## 📊 Complete Column List

After running the migration, your `referrals` table should have:

**Required Columns:**
- `id` - UUID (Primary Key)
- `patient_name` - TEXT
- `referral_date` - DATE
- `referral_source` - TEXT
- `diagnosis` - TEXT
- `insurance_provider` - TEXT
- `insurance_id` - TEXT
- `status` - TEXT (default: 'New')

**Optional Columns:**
- `ai_recommendation` - TEXT (Approve, Deny, Review)
- `ai_reason` - TEXT ← **This one was missing!**
- `soc_due_date` - DATE
- `extendedcare_data` - JSONB
- `eligibility_status` - JSONB
- `insurance_monitoring` - JSONB
- `created_by` - UUID
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

---

## ✅ Next Steps

### **Recommended:**
1. ✅ Run the migration SQL in Supabase SQL Editor (Option 1 above)
2. ✅ Try submitting a referral again
3. ✅ Verify the referral appears in "New Referrals" tab

### **Alternative (if you're in a hurry):**
1. ✅ Just try submitting a referral - it should work now!
2. ✅ Run the migration later when you have time

---

## 🎉 Status

- ✅ Migration script created: `scripts/074-add-ai-reason-column.sql`
- ✅ API updated to make `ai_reason` optional
- ✅ Code is resilient to missing column
- ✅ Ready to use!

---

## 💡 Why Did This Happen?

The `referrals` table was likely created from an older version of the schema file, or the table was created manually without the `ai_reason` column. This migration adds it to match the current schema definition.

---

## 📞 Need Help?

If you encounter issues running the migration:
1. Check that you're connected to the correct Supabase project
2. Verify you have the right permissions (you need to be an admin)
3. Check the SQL Editor for error messages
4. Try refreshing the Supabase dashboard

---

**Time to fix:** 1 minute  
**Difficulty:** Very Easy  
**Impact:** Full AI reasoning functionality enabled! ✅




