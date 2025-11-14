# 🔧 Fix for "last_updated column not found" Error

## The Problem
When you click **"Request Prior Auth"**, you get this error:
```
Supabase Error: Could not find the 'last_updated' column of 'authorizations' in the schema cache
```

This happens because Supabase cached an old schema that had `last_updated`, but your table actually uses `updated_at`.

## The Solution

### Step 1: Run the SQL Fix Script

1. **Open Supabase Dashboard** → Your Project
2. Go to **SQL Editor** (left sidebar)
3. **Copy and paste** the entire contents of `FINAL_FIX_AUTHORIZATIONS_SCHEMA.sql`
4. Click **Run** (or press Ctrl+Enter)

### Step 2: Restart Your Dev Server

After running the SQL:

1. **Stop your Next.js dev server** (Ctrl+C in terminal)
2. **Restart it**: `npm run dev`

### Step 3: Test

1. Go to **Referral Management**
2. Click **"Request Prior Auth"** on any referral
3. It should now work! ✅

---

## What the Fix Does

The SQL script:
1. ✅ Drops and recreates the `authorizations` table with the **correct** schema
2. ✅ Uses `created_at` and `updated_at` (NOT `last_updated`)
3. ✅ **Reloads Supabase's schema cache** with `NOTIFY pgrst, 'reload schema'`
4. ✅ Verifies the fix worked

---

## If You Still See the Error

1. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check the Supabase SQL Editor output - it should show:
   - ✅ SUCCESS: last_updated column does not exist
   - ✅ SUCCESS: updated_at column exists
3. If still broken, go to **Supabase Dashboard → API → Restart PostgREST server**

---

## Why This Happened

Your SQL files correctly define the table with `updated_at`, but somewhere along the way:
- An older version with `last_updated` was created
- Supabase cached that schema
- Even though you updated the table, the cache wasn't reloaded
- The `NOTIFY pgrst, 'reload schema'` command forces the cache reload

---

**Need help?** Check the console logs after clicking "Request Prior Auth" to see the exact error details.

