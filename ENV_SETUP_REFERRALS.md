# 🔧 Environment Setup for Manual Referral Entry

## ✅ What's Fixed
The Manual Referral Entry feature in the Referral Management page is now fully functional!

---

## 🚀 Required Environment Variable

To enable manual referral creation, you need to add the Supabase Service Role Key to your environment variables.

### Step 1: Get Your Service Role Key
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Find the **Service Role Key** (starts with `eyJ...`)
5. Copy the entire key

### Step 2: Add to `.env.local`
In your **project root folder** (where `package.json` is), open or create `.env.local` and add:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Example .env.local file:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
```

### Step 3: Restart Your Server
```bash
# Stop your server (Ctrl+C)
npm run dev
```

---

## ✨ Manual Referral Entry Features

Once configured, the Manual Referral Entry form provides:

### Required Fields
- ✅ **Patient Name** - Full name of the patient
- ✅ **Referral Date** - Date of referral (defaults to today)
- ✅ **Insurance Provider** - Name of insurance company (e.g., Medicare, Blue Cross)
- ✅ **Insurance ID** - Patient's insurance ID number
- ✅ **Primary Diagnosis** - Main diagnosis or reason for care

### Functionality
- ✅ **Real-time validation** - Checks all required fields before submission
- ✅ **Success/Error alerts** - Clear feedback on submission status
- ✅ **Loading states** - Button shows "Submitting..." during processing
- ✅ **Auto-refresh** - Referrals list updates automatically after submission
- ✅ **Form reset** - Clears form after successful submission
- ✅ **Database persistence** - Saves to Supabase referrals table
- ✅ **AI recommendation** - Auto-assigns "Review" status with reason

---

## 🎯 How to Use

1. Navigate to **Referral Management** page
2. Find the **Manual Referral Entry** card on the right side
3. Fill in all required fields (marked with red asterisks)
4. Click **"Submit Referral"**
5. Success message appears and referral is added to "New Referrals" tab

---

## 🔒 Security Notes

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` is a sensitive credential that:
- ✅ Bypasses Row Level Security (RLS) policies
- ✅ Should ONLY be used in server-side code (never client-side)
- ✅ Must be kept secret (already in `.gitignore`)
- ✅ Should NOT be committed to version control

This key is used in:
- `lib/supabase/server.ts` - Admin client creation
- `app/api/referrals/route.ts` - Server-side referral creation

---

## 📊 What Happens When You Submit

1. **Validation** - Form checks all required fields
2. **API Call** - Sends POST request to `/api/referrals`
3. **Database Insert** - Creates new record in `referrals` table with:
   - Status: "New"
   - Source: "Manual Entry"
   - AI Recommendation: "Review"
   - AI Reason: "Manually entered referral requires review"
4. **Success Response** - Returns created referral data
5. **UI Update** - Shows success message and refreshes list
6. **Form Reset** - Clears all fields for next entry

---

## 🐛 Troubleshooting

### Error: "Failed to create referral"

**Check:**
1. ✅ Is `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`?
2. ✅ Did you restart the server after adding the key?
3. ✅ Is the key correct (starts with `eyJ`)?
4. ✅ Check browser console for detailed error messages
5. ✅ Check server logs for API errors

### Still Not Working?

1. **Open browser console** (F12) and check for error messages
2. **Check server terminal** for API logs
3. Verify your Supabase project is active and accessible
4. Ensure the `referrals` table exists in your database

### Environment Variable Not Loading?

- ✅ File must be named exactly `.env.local` (with the dot)
- ✅ File must be in project root (same folder as `package.json`)
- ✅ Server must be fully restarted (Ctrl+C, then `npm run dev`)
- ✅ No spaces around the `=` sign

---

## 📝 Database Schema

The referrals table has the following structure:

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY,
  patient_name TEXT NOT NULL,
  referral_date DATE NOT NULL,
  referral_source TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  insurance_provider TEXT NOT NULL,
  insurance_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  ai_recommendation TEXT,
  ai_reason TEXT,
  soc_due_date DATE,
  extendedcare_data JSONB,
  eligibility_status JSONB,
  insurance_monitoring JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ✅ Verification

To verify the feature is working:

1. Fill out the manual referral form
2. Click "Submit Referral"
3. You should see:
   - ✅ Green success message
   - ✅ Form clears automatically
   - ✅ New referral appears in "New Referrals" tab
   - ✅ Referral shows "Manual Entry" as source
   - ✅ AI Recommendation is "Review"

---

## 📞 Additional Resources

- **Supabase Dashboard:** [supabase.com/dashboard](https://supabase.com/dashboard)
- **Referral Management Page:** `/referral-management`
- **API Endpoint:** `/api/referrals` (POST)

---

## 🎉 Status: Complete and Working!

The Manual Referral Entry feature is fully functional and ready to use once the environment variable is configured.

**Questions?** Check the server logs or browser console for detailed error messages.





