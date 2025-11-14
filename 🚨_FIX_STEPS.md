# 🚨 FIX: "last_updated column not found" Error

## Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the Fix Script
1. Open the file: **`RUN_THIS_NOW_TO_FIX.sql`** (in this project)
2. **Copy ALL the contents** (Ctrl+A, Ctrl+C)
3. **Paste into Supabase SQL Editor**
4. Click **RUN** button (or press Ctrl+Enter)

You should see output like:
```
✅ SUCCESS: Schema is correct!
✅ - last_updated does NOT exist
✅ - updated_at exists
✅ Test insert successful!
```

### Step 3: Restart Your Dev Server
```bash
# Press Ctrl+C to stop the server
# Then restart it:
npm run dev
```

### Step 4: Test
1. Go to **Referral Management** page
2. Click **"Request Prior Auth"** on any referral
3. ✅ **It should work now!**

---

## If Still Not Working

### Option A: Hard Refresh
- Browser: Press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

### Option B: Manual Cache Reload
1. Go to **Supabase Dashboard**
2. Click **Settings** (bottom left)
3. Click **API** tab
4. Click **"Restart PostgREST server"** button
5. Wait 10 seconds
6. Try again

### Option C: Check the Error Details
Open your browser console (F12) and look for the exact error message. Share it if the problem persists.

---

## What This Fix Does

✅ Drops the old `authorizations` table completely  
✅ Creates a new table with the **correct** schema  
✅ Uses `created_at` and `updated_at` (NOT `last_updated`)  
✅ Forces Supabase to reload its schema cache  
✅ Tests that inserts work correctly  

---

## Why This Error Happened

Your Supabase instance cached an old version of the table schema that included a `last_updated` column. Even though your code and SQL scripts use the correct `updated_at` column, Supabase's API (PostgREST) was still looking for the old column name in its cache.

The `NOTIFY pgrst, 'reload schema'` command forces it to forget the cached version and read the actual current table structure.

