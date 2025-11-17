# 🚨 FIX: "Failed to fetch referrals" Error

## ❌ THE ERROR YOU'RE SEEING:

```
Error: Failed to fetch referrals
at fetchReferrals (webpack-internal:///(app-pages-browser)/./app/facility-portal/page.tsx:73:37)
```

---

## ✅ THE FIX (2 Steps - 2 Minutes)

### **Step 1: Run Emergency Fix Script** (1 minute)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste this file:
   ```
   FACILITY_PORTAL_EMERGENCY_FIX.sql
   ```
3. Click **"Run"**
4. Wait for: `✅ EMERGENCY FIX COMPLETE!`

This creates all required database tables and columns.

---

### **Step 2: Restart Dev Server** (30 seconds)

```bash
# In your terminal, press Ctrl+C to stop the server
# Then restart:
npm run dev
```

---

### **Step 3: Test Again** (30 seconds)

1. Go to: `http://localhost:3000/facility-portal`
2. You should see:
   - ✅ Page loads without errors
   - ✅ Empty referrals list (that's normal!)
   - ✅ No console errors

---

## 🔍 WHY THIS ERROR HAPPENED

The facility portal API tries to query these columns from the `referrals` table:

```sql
SELECT 
  referral_number,    ← Missing!
  patient_name,       ← Missing!
  diagnosis,          ← Missing!
  status,            ← Missing!
  referral_date,     ← Missing!
  facility_name,     ← Missing!
  case_manager,      ← Missing!
  services           ← Missing!
FROM referrals
```

If any of these columns don't exist, the API fails with:
```
Error: Failed to fetch referrals
```

---

## 🎯 WHAT THE FIX DOES

The emergency fix script:

1. ✅ Checks if `referrals` table exists
2. ✅ Adds all required columns (patient_name, referral_date, etc.)
3. ✅ Creates `facility_users` table
4. ✅ Creates `facility_messages` table
5. ✅ Adds default facility user (Mercy Hospital)
6. ✅ Creates indexes for performance
7. ✅ Sets up RLS policies
8. ✅ Verifies everything is ready

---

## ✅ HOW TO VERIFY IT'S FIXED

### **In Browser Console (F12):**

Before fix:
```
❌ GET /api/facility-portal/referrals?facilityName=... 500 (Internal Server Error)
❌ Error fetching referrals: Failed to fetch referrals
```

After fix:
```
✅ GET /api/facility-portal/referrals?facilityName=... 200 (OK)
✅ [] (empty array - that's correct!)
```

---

## 🧪 TEST THAT IT WORKS

1. **Go to facility portal:** `/facility-portal`
2. **Click "Submit Referral" tab**
3. **Fill out form:**
   - Patient Initials: `J.D.`
   - Diagnosis: `Test diagnosis`
   - Insurance: `Medicare`
   - Check any service
4. **Click "Submit Referral"**
5. **Should see:** ✅ Success message!
6. **Go to "Referral Tracker" tab**
7. **Should see:** Your new referral in the table!

---

## 🐛 STILL GETTING ERRORS?

### **Error: "referrals table does not exist"**

**Fix:** Run this first:
```sql
-- In Supabase SQL Editor:
-- Run: scripts/040-create-referrals-table.sql
```

Then run the emergency fix script.

---

### **Error: "Missing Supabase configuration"**

**Fix:** Check your `.env.local` file has:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

Then restart the server.

---

### **Error: "FOREIGN KEY constraint failed"**

**Fix:** The emergency script creates all foreign key relationships.
If you still see this, run:
```sql
-- Remove the foreign key temporarily
ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_facility_user_id_fkey;

-- Run emergency fix script again
```

---

### **Error: "column does not exist"**

**Fix:** This means a column is still missing. Run:
```sql
-- Check what columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'referrals' 
ORDER BY column_name;
```

Then run the emergency fix script again.

---

## 📊 VERIFY DATABASE IS READY

Run this in **Supabase SQL Editor**:

```sql
-- Should show all these columns:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'referrals'
AND column_name IN (
  'patient_name', 
  'referral_date', 
  'referral_number', 
  'diagnosis', 
  'insurance_provider',
  'insurance_id',
  'status',
  'facility_name',
  'case_manager',
  'services',
  'urgency'
)
ORDER BY column_name;
```

Should return **11 rows** with all these columns.

---

## 🔍 CHECK BROWSER NETWORK TAB

1. Open **DevTools** (F12)
2. Go to **Network** tab
3. Refresh `/facility-portal`
4. Look for: `referrals?facilityName=...`

**Should see:**
```
Status: 200 OK
Response: []  (empty array)
```

**If you see:**
```
Status: 500 Internal Server Error
Response: { "error": "..." }
```

Look at the error message - it will tell you exactly what's missing!

---

## 📝 QUICK CHECKLIST

- [ ] Ran `FACILITY_PORTAL_EMERGENCY_FIX.sql` in Supabase
- [ ] Saw success message: `✅ EMERGENCY FIX COMPLETE!`
- [ ] Restarted dev server (`Ctrl+C`, then `npm run dev`)
- [ ] Went to `/facility-portal`
- [ ] Page loads without errors
- [ ] Browser console shows no errors
- [ ] API call returns 200 status

---

## 💡 WHAT TO DO AFTER FIX WORKS

Once the page loads successfully:

1. **Submit a test referral** to verify database writes work
2. **Check Referral Tracker tab** to see it appear
3. **Check Supabase database** to see the data
4. **Test the refresh button** to verify data fetching
5. **Check Messages tab** for auto-generated notifications

---

## 🎉 SUCCESS INDICATORS

You'll know it's working when:

✅ Page loads without errors  
✅ No console errors  
✅ Submit referral works  
✅ Referral appears in tracker  
✅ Messages show notifications  
✅ Refresh button works  

---

## 📞 IF NOTHING WORKS

**Check these in order:**

1. **Supabase URL/Keys:**
   - Open `.env.local`
   - Verify all 3 keys are present
   - No typos, no extra spaces
   - Restart server after changes

2. **Database Tables:**
   - Open Supabase → Table Editor
   - Check `referrals` table exists
   - Check `facility_users` table exists
   - Check `facility_messages` table exists

3. **Server Logs:**
   - Look in terminal running `npm run dev`
   - Should see any API errors there
   - Look for SQL errors or missing columns

4. **Browser Console:**
   - Open DevTools (F12) → Console
   - Look for red error messages
   - Check Network tab for failed requests

5. **Last Resort:**
   - Run `FACILITY_PORTAL_EMERGENCY_FIX.sql` again
   - Restart dev server
   - Clear browser cache (Ctrl+Shift+Delete)
   - Hard refresh page (Ctrl+Shift+R)

---

## 🚀 YOU'RE DONE!

After running the fix script and restarting:
- Facility portal should work
- You can submit referrals
- Data persists in database
- Everything is connected!

**Now go test it! 🎉**

