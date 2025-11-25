# OASIS Upload Error Fix

## Error You're Seeing

```
Error: Failed to process file
at processFile (webpack-internal:///(app-pages-browser)/./app/oasis-upload/page.tsx:257:23)
```

## Root Cause

**The API keys are NOT configured yet!** ⚠️

The error is happening because:
1. **PDFCO_API_KEY** is missing from `.env.local`
2. **OPENAI_API_KEY** might be missing from `.env.local`

Without these keys, the backend cannot:
- Extract text from your PDF/images (needs PDF.co)
- Analyze the extracted text (needs OpenAI)

---

## ✅ SOLUTION (Takes 5 minutes)

### Step 1: Check if `.env.local` exists

Look in your project root for a file called `.env.local`

**If it doesn't exist:**
```bash
# Create it
New-Item .env.local -ItemType File
```

### Step 2: Add the API Keys

Open `.env.local` and add these lines:

```env
# PDF.co API Key (for OCR text extraction)
PDFCO_API_KEY=your_pdfco_api_key_here

# OpenAI API Key (for AI analysis)
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 3: Get PDF.co API Key (2 minutes)

**You MUST do this - it's required!**

1. Go to: **https://pdf.co**
2. Click "Sign Up Free"
3. Verify your email
4. Go to Dashboard → API
5. Copy your API key
6. Paste it into `.env.local` as `PDFCO_API_KEY=your_key_here`

**FREE: 300 documents per month!**

### Step 4: Add Your OpenAI API Key (1 minute)

You mentioned you already have an OpenAI API key. Add it to `.env.local`:

```env
OPENAI_API_KEY=sk-proj-your-key-here
```

If you don't have one:
1. Go to: https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy and paste into `.env.local`

### Step 5: Restart Your Dev Server (Required!)

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

**Important:** Environment variables are only loaded when the server starts!

---

## ✅ Verify Your `.env.local` File

Your `.env.local` should look like this:

```env
# Existing variables (keep these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
BLOB_READ_WRITE_TOKEN=your_blob_token

# NEW - Add these for OASIS Upload
PDFCO_API_KEY=abc123def456xyz789
OPENAI_API_KEY=sk-proj-abcd1234efgh5678
```

---

## 🧪 Test Again

1. **Restart server:** `npm run dev`
2. **Go to:** http://localhost:3000/oasis-upload
3. **Upload a test PDF or image**
4. **Wait 15-60 seconds**
5. **Check the Results tab**

---

## 🐛 Still Getting Errors?

### Check Browser Console (F12)

Look for specific error messages:

**"PDF.co API key not configured"**
→ PDFCO_API_KEY is missing or incorrect

**"Invalid OpenAI API key"**
→ OPENAI_API_KEY is missing or incorrect

**"Failed to store assessment"**
→ Database tables not created (see next step)

### If Database Error

Run this in Supabase SQL Editor:
```sql
-- File: scripts/create-oasis-tables-v1.sql
-- Creates the required tables
```

---

## 📋 Complete Checklist

Before testing, make sure:

- [ ] `.env.local` file exists
- [ ] `PDFCO_API_KEY` is added
- [ ] `OPENAI_API_KEY` is added
- [ ] Dev server restarted
- [ ] Database tables created (run SQL script)
- [ ] Blob storage configured (should already be done)

---

## 💡 Why This Happened

The code I fixed is working perfectly, but it **requires configuration**:

1. **PDF.co** for extracting text from PDFs/images
2. **OpenAI** for analyzing the extracted text

Without these API keys, the backend API returns an error, which the frontend displays as "Failed to process file".

---

## 🎯 Quick Fix Summary

```bash
# 1. Create/edit .env.local
notepad .env.local

# 2. Add these lines:
PDFCO_API_KEY=your_pdfco_key
OPENAI_API_KEY=your_openai_key

# 3. Save and restart
npm run dev
```

---

## 📚 Need More Help?

See these guides:
- **ACTION_REQUIRED_OASIS.md** - What you need to do
- **START_HERE_OASIS_UPLOAD.md** - Complete setup guide
- **OASIS_UPLOAD_SETUP.md** - Detailed configuration

---

## ✅ After You Add the Keys

The error will go away and you'll see:
- ✅ File uploads successfully
- ✅ Processing starts (15-60 seconds)
- ✅ Results appear with AI analysis
- ✅ Quality scores, diagnosis codes, recommendations

**The fix is already implemented - you just need to configure it!** 🚀


