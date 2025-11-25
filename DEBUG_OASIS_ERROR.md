# Debug OASIS Upload Error

## 🔍 How to Find the Real Error

I've just added detailed error logging to help you find the exact problem.

---

## Step 1: Check Your Server Console

Look at your terminal where `npm run dev` is running. You should now see detailed logs like:

```
[OASIS] === Starting file processing ===
[OASIS] Received request: { uploadId: '...', fileType: 'oasis', fileName: 'test.pdf' }
[OASIS] API Keys configured: { hasPdfcoKey: false, hasOpenaiKey: false }
[OASIS] ❌ PDFCO_API_KEY is not configured!
```

---

## Step 2: Identify the Error

### ❌ If you see: "PDFCO_API_KEY is not configured"
**Problem:** Missing PDF.co API key

**Solution:**
1. Open `.env.local`
2. Add: `PDFCO_API_KEY=your_key_here`
3. Get key from: https://pdf.co (free signup)
4. Restart server: `npm run dev`

### ❌ If you see: "OPENAI_API_KEY is not configured"
**Problem:** Missing OpenAI API key

**Solution:**
1. Open `.env.local`
2. Add: `OPENAI_API_KEY=sk-your_key_here`
3. Get key from: https://platform.openai.com/api-keys
4. Restart server: `npm run dev`

### ❌ If you see: "Failed to upload file to PDF.co"
**Problem:** Invalid PDF.co API key or network issue

**Solution:**
1. Verify your PDF.co key at: https://pdf.co/dashboard
2. Check if you have credits remaining (300 free/month)
3. Try with a smaller file
4. Check your internet connection

### ❌ If you see: "OCR extraction failed"
**Problem:** PDF.co couldn't extract text

**Solution:**
1. Try a different file
2. Ensure file is not corrupted
3. Check file is a real PDF with text (not just a blank image)
4. Try smaller file size

### ❌ If you see: "Invalid JSON response from AI"
**Problem:** OpenAI response format issue

**Solution:**
1. Verify OpenAI API key is valid
2. Check you have credits: https://platform.openai.com/account/usage
3. Try again (sometimes it's a temporary issue)

### ❌ If you see: "Failed to store assessment"
**Problem:** Database table doesn't exist

**Solution:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the SQL from: `scripts/create-oasis-tables-v1.sql`
4. Try uploading again

---

## Step 3: Try Uploading Again

After fixing the issue:
1. Refresh the page: `http://localhost:3000/oasis-upload`
2. Upload a test file
3. Check the server console for new logs
4. Look at the browser console (F12) for frontend errors

---

## 🧪 Quick Test Checklist

Before uploading, verify:

```bash
# Check .env.local exists
dir .env.local

# Check if server is running
# Should see: "Ready in X ms" in terminal
```

Open `.env.local` and verify you have:
- [ ] `PDFCO_API_KEY=...` (not empty)
- [ ] `OPENAI_API_KEY=...` (not empty)
- [ ] `NEXT_PUBLIC_SUPABASE_URL=...` (should already exist)
- [ ] `SUPABASE_SERVICE_ROLE_KEY=...` (should already exist)

---

## 📋 Common Mistakes

### ❌ Mistake 1: Didn't Restart Server
**After adding keys to `.env.local`, you MUST restart the server!**

```bash
# Press Ctrl+C to stop
npm run dev
```

### ❌ Mistake 2: Wrong File
Editing `.env` instead of `.env.local`

**Use:** `.env.local` (this is the one that works)
**Not:** `.env` (template only)

### ❌ Mistake 3: Spaces or Quotes
```env
# WRONG:
PDFCO_API_KEY = "your_key"

# CORRECT:
PDFCO_API_KEY=your_key
```

### ❌ Mistake 4: Missing Database Tables
Run this SQL in Supabase:
```sql
-- File: scripts/create-oasis-tables-v1.sql
```

---

## 🎯 Step-by-Step Debug Process

1. **Look at server console** (terminal running npm run dev)
2. **Find the [OASIS] error message**
3. **Follow the solution for that specific error**
4. **Restart the server**
5. **Try uploading again**
6. **Check logs again**

---

## 💡 What the New Logs Show

You'll now see detailed information:

```
[OASIS] === Starting file processing ===
[OASIS] Received request: { uploadId: 'xxx', fileType: 'oasis', fileName: 'test.pdf' }
[OASIS] API Keys configured: { hasPdfcoKey: true, hasOpenaiKey: true }
[OASIS] File uploaded to blob: https://...
[OASIS] Extracting text from document using PDF.co OCR...
Starting async OCR job for: https://...
OCR job started, jobId: xxx
Checking job status (attempt 1/60)...
✅ OCR job completed successfully
[OASIS] PDF.co OCR extraction successful, text length: 1234
[OASIS] Creating Supabase service client...
[OASIS] Analyzing OASIS document with AI...
[OASIS] Calling OpenAI for OASIS analysis...
[OASIS] Full AI response length: 2000
[OASIS] JSON parsed successfully
[OASIS] Analysis validated successfully
[OASIS] Inserting assessment into database...
[OASIS] Assessment stored in database: uuid
```

---

## 🆘 Still Stuck?

**Copy the error logs from your server console and the browser console (F12), then:**

1. Check if API keys are in `.env.local`
2. Verify you restarted the server
3. Try with a simple text file first (to rule out OCR issues)
4. Check Supabase tables are created

---

## ✅ Success Indicators

You'll know it's working when you see:

**In Server Console:**
```
[OASIS] === Starting file processing ===
[OASIS] API Keys configured: { hasPdfcoKey: true, hasOpenaiKey: true }
✅ OCR job completed successfully
[OASIS] Assessment stored in database
```

**In Browser:**
- Progress bar completes
- Status changes to "completed" (green checkmark)
- Toast notification: "Processing Complete"
- Results tab shows analysis data

---

## 📞 Final Checklist

If still not working after following debug steps:

1. [ ] `.env.local` file has both API keys
2. [ ] API keys are valid (no typos)
3. [ ] Server was restarted after adding keys
4. [ ] Database tables created (ran SQL script)
5. [ ] File is a valid PDF/image with text
6. [ ] No firewall blocking API calls
7. [ ] Internet connection working

---

**The improved error logging will tell you exactly what's wrong!**

Check your server console now and look for `[OASIS]` messages.


