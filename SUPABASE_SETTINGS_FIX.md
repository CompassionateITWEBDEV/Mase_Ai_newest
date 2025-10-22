# Fix Supabase Auth Settings

## ⚠️ Error: "Database error saving new user"

This error happens because of Supabase Auth configuration. Follow these steps:

---

## 🔧 STEP 1: Disable Email Confirmation

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/twaupwloddlyahjtfvfy/auth/providers

2. Click on **"Email" provider** (should be the first one)

3. Find **"Confirm email"** setting

4. **DISABLE** it (turn it OFF)
   - This allows users to register without email verification

5. Click **"Save"**

---

## 🔧 STEP 2: Check Auth Settings

Go to: https://supabase.com/dashboard/project/twaupwloddlyahjtfvfy/auth/settings

Make sure these are set:

- ✅ **Enable email signup** - ON
- ✅ **Enable email confirmations** - OFF (disabled)
- ✅ **Enable manual linking** - OFF
- ✅ **Secure email change** - OFF (for testing)

Click **"Save"** if you made changes

---

## 🔧 STEP 3: Check for Auto Profile Creation

Go to: https://supabase.com/dashboard/project/twaupwloddlyahjtfvfy/database/triggers

Check if there's a trigger like:
- `on_auth_user_created`
- `handle_new_user`

If YES:
1. Click on it
2. **Disable** or **Delete** it (for now)
3. We're handling profile creation manually in our code

---

## 🔧 STEP 4: Verify RLS Policies

Go to: https://supabase.com/dashboard/project/twaupwloddlyahjtfvfy/auth/policies

For tables: `applicants` and `employers`

Make sure you have these policies:
- ✅ "Anyone can insert applicants" - **ENABLED**
- ✅ "Anyone can insert employers" - **ENABLED**

---

## 🧪 Test After Changes

After making these changes:

1. **Refresh** your app: http://localhost:3001/register

2. Try to register with:
   - Email: test@example.com
   - Password: **Test@2024!** (strong password)

3. Should work now! ✅

---

## 📊 Check Logs

If still not working, check Supabase logs:
https://supabase.com/dashboard/project/twaupwloddlyahjtfvfy/logs/explorer

Look for errors related to:
- auth.users
- triggers
- policies

---

## Alternative: Simple Test

Try this SQL in Supabase SQL Editor to test manually:

```sql
-- Test if we can insert into applicants
INSERT INTO public.applicants (
    email, 
    first_name, 
    last_name
) VALUES (
    'manual-test@example.com',
    'Test',
    'User'
);

-- Check if it worked
SELECT * FROM public.applicants WHERE email = 'manual-test@example.com';

-- Clean up
DELETE FROM public.applicants WHERE email = 'manual-test@example.com';
```

If this works, the problem is definitely in Auth configuration, not the tables.

