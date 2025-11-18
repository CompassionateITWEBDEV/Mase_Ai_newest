# 🚨 Quick Fix: "API error response: {}" Error

## The Problem
You're getting an empty API error because the `SUPABASE_SERVICE_ROLE_KEY` environment variable is missing.

---

## ✅ Quick Fix (2 Minutes)

### Step 1: Get Your Service Role Key

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** from the list
3. Click **Settings** (⚙️ icon in sidebar)
4. Click **API** from the settings menu
5. Scroll to **Project API keys** section
6. Find **Service Role Key** (⚠️ Secret - don't share!)
7. Click the **Copy** button (📋 icon)

**Your key will look like:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhY...
```

---

### Step 2: Create or Edit `.env.local`

**Location:** Project root folder (same folder as `package.json`)

**Create/Edit the file:**

**Windows:**
```powershell
# Navigate to project root
cd C:\Users\ejohn\M.A.S.E-AI-INTALEGINCE--main

# Create or edit .env.local with notepad
notepad .env.local
```

**Mac/Linux:**
```bash
# Navigate to project root
cd ~/your-project-folder

# Create or edit .env.local
nano .env.local
# or
code .env.local
```

---

### Step 3: Add the Key

**In `.env.local`, add this line:**

```bash
SUPABASE_SERVICE_ROLE_KEY=paste-your-key-here
```

**Full example `.env.local` file:**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key

# Optional: OpenAI (for other features)
OPENAI_API_KEY=sk-your-openai-key
```

**Important:**
- ✅ No spaces around the `=` sign
- ✅ No quotes around the key
- ✅ File must be in project root (next to `package.json`)
- ✅ File must be named exactly `.env.local` (with the dot at the start)

---

### Step 4: Restart Your Server

**Stop the server:**
Press `Ctrl + C` in the terminal

**Start it again:**
```bash
npm run dev
```

**Wait for:**
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

---

### Step 5: Test It

1. Go to **Referral Management** page
2. Fill out the **Manual Referral Entry** form:
   - Patient Name: `Test Patient`
   - Referral Date: (today's date)
   - Insurance Provider: `Medicare`
   - Insurance ID: `123456789`
   - Primary Diagnosis: `Test diagnosis`
3. Click **Submit Referral**
4. ✅ Success! You should see a green success message

---

## 🎯 What This Key Does

The `SUPABASE_SERVICE_ROLE_KEY` allows the server to:
- ✅ Bypass Row Level Security (RLS) policies
- ✅ Create referrals without user authentication
- ✅ Perform admin-level database operations

**Security:** It's only used server-side (in API routes) and never exposed to the browser.

---

## 🐛 Still Getting Errors?

### Check the Console

**Browser Console (F12):**
Look for messages like:
- `⚠️ SETUP REQUIRED:` - Follow the instructions shown
- `Creating admin client with service role` - ✅ Good!
- `Missing SUPABASE_SERVICE_ROLE_KEY` - ❌ Key not loaded

**Server Terminal:**
Look for:
```
=== Starting referral creation ===
Admin client created successfully
Received referral creation request: {...}
```

---

### Common Issues

#### ❌ "SUPABASE_SERVICE_ROLE_KEY is not set"
**Fix:** 
- Make sure `.env.local` is in the **root folder**
- Verify the key is pasted correctly
- Restart the server completely

#### ❌ "No such file or directory: .env.local"
**Fix:**
- You're in the wrong folder
- Navigate to project root: `cd C:\Users\ejohn\M.A.S.E-AI-INTALEGINCE--main`

#### ❌ Server starts but key still not loaded
**Fix:**
- Check for syntax errors in `.env.local`
- Make sure there's no space before/after `=`
- Delete the file and recreate it (avoid copy/paste formatting issues)

#### ❌ "permission denied: .env.local"
**Fix:**
- Close any text editors that have the file open
- On Windows, run your terminal as Administrator

---

## 📝 Verify Your Setup

**Your project structure should look like:**
```
M.A.S.E-AI-INTALEGINCE--main/
├── .env.local           ← ADD THIS FILE HERE
├── package.json
├── next.config.js
├── app/
├── components/
├── lib/
└── ...
```

**Your `.env.local` should contain:**
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

---

## ✅ Success Checklist

After setup, you should:
- ✅ See no console errors about missing keys
- ✅ Successfully submit manual referrals
- ✅ See referrals appear in "New Referrals" tab
- ✅ See "Creating admin client" in server logs
- ✅ Get green success message after form submission

---

## 📞 Need More Help?

1. **Check server logs** - Look for detailed error messages
2. **Check browser console (F12)** - Look for setup instructions
3. **Read ENV_SETUP_REFERRALS.md** - Complete detailed guide
4. **Verify Supabase project is active** - Check your Supabase dashboard

---

## 🎉 That's It!

Once you add the key and restart:
- ✅ Manual Referral Entry will work perfectly
- ✅ Referrals will be saved to database
- ✅ All features will function properly

**Time to complete:** ~2 minutes  
**Difficulty:** Easy

Good luck! 🚀



