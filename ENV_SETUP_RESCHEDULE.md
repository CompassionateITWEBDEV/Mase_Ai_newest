# Environment Variable Setup for Reschedule Requests

## The Problem
You're getting "Server configuration error" because the `SUPABASE_SERVICE_ROLE_KEY` environment variable is not set. This is required for the reschedule request API to bypass Row Level Security (RLS) policies.

## How to Fix

### Step 1: Get Your Supabase Service Role Key

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Scroll down to **Project API keys**
5. Find the **`service_role`** key
6. Click **Copy** to copy the key
   - ⚠️ **Important**: The service role key has elevated privileges and should NEVER be exposed in client-side code
   - It bypasses RLS policies, so keep it secret!

### Step 2: Add to Your Environment Variables

#### For Local Development
Create or update `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### For Production (Render)
1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Select your service
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add these variables:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

#### For Production (Vercel)
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the variable:
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `your-service-role-key-here`
   - Environment: Production, Preview, Development (select all)

### Step 3: Restart Your Server
After adding the environment variable:
```bash
# Stop your dev server (Ctrl+C)
# Then restart it
npm run dev
# or
pnpm dev
```

### Step 4: Test the Reschedule Request
Try submitting a reschedule request again. It should now work!

## Why This Is Needed

The `SUPABASE_SERVICE_ROLE_KEY` allows the API to:
- Bypass Row Level Security (RLS) policies
- Insert data into protected tables
- Access all data regardless of user permissions

This is necessary because the reschedule request API needs to create records on behalf of users, and the regular `anon` key is restricted by RLS policies.

## Security Notes

- ✅ **Safe for server-side**: The service role key is only used in API routes (server-side)
- ❌ **Never expose client-side**: Never use this key in client components
- 🔒 **Keep it secret**: Don't commit this key to Git
- 📝 **Add to .gitignore**: Make sure `.env.local` is in your `.gitignore`

## Troubleshooting

### "Still getting Server configuration error"
- Verify the environment variable is spelled correctly: `SUPABASE_SERVICE_ROLE_KEY`
- Make sure you restarted your dev server after adding it
- Check that there are no extra spaces or quotes around the key

### "Still getting RLS policy violation"
1. Run the SQL from `scripts/fix-reschedule-rls.sql` in your Supabase SQL Editor
2. Or run this simplified version:
   ```sql
   CREATE POLICY "Service role bypass RLS" 
     ON interview_reschedule_requests FOR ALL
     USING (auth.role() = 'service_role')
     WITH CHECK (auth.role() = 'service_role');
   ```

### "Missing columns error" or "new_date violates not-null constraint"
This means the table has old column names. Run the SQL from `scripts/fix-reschedule-column-names.sql` in your Supabase SQL Editor. It will:
- Rename `new_date` → `proposed_date`
- Rename `new_time` → `proposed_time`
- Add `original_date` column
- Make columns nullable if needed

## Questions?

Check the main documentation: `FIX_RESCHEDULE_COLUMNS.md`

