# Verify Your Setup

## ✅ You Have PDF_CO_API_KEY

Good! Now let's make sure everything is configured correctly.

---

## 🔍 Complete Setup Checklist

### 1. Check Your `.env.local` File

Open `.env.local` and verify you have BOTH keys:

```env
# PDF.co API Key - ✅ You have this
PDF_CO_API_KEY=your_key_here
# OR
PDFCO_API_KEY=your_key_here

# OpenAI API Key - Do you have this?
OPENAI_API_KEY=sk-proj-your_key_here
```

**Note:** The code supports both `PDF_CO_API_KEY` and `PDFCO_API_KEY` (either works)

---

## 2. Verify BOTH API Keys Are Present

You need:
- ✅ `PDF_CO_API_KEY` (you have this)
- ❓ `OPENAI_API_KEY` (do you have this?)

---

## 3. Check OpenAI API Key

If you don't have it yet:

1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-` or `sk-`)
4. Add to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-proj-your_key_here
   ```

---

## 4. Your `.env.local` Should Look Like:

```env
# Existing variables (keep these)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx

# Add these two:
PDF_CO_API_KEY=your_pdfco_key_here
OPENAI_API_KEY=sk-proj-your_openai_key_here
```

---

## 5. RESTART Your Dev Server (CRITICAL!)

```bash
# In your terminal:
# 1. Press Ctrl+C to stop the server
# 2. Start it again:
npm run dev
```

**Environment variables are ONLY loaded when the server starts!**

---

## 6. Test Again

1. Go to: http://localhost:3000/oasis-upload
2. Upload a test file
3. Watch your **server console** (terminal) for logs:

**You should see:**
```
[OASIS] === Starting file processing ===
[OASIS] API Keys configured: { hasPdfcoKey: true, hasOpenaiKey: true }
```

**If you see `hasPdfcoKey: false` or `hasOpenaiKey: false`, the keys aren't loaded!**

---

## 🐛 Troubleshooting

### If Still Getting Error:

**Check Server Console Output:**

Look for these specific messages:

```
[OASIS] ❌ PDFCO_API_KEY is not configured!
```
→ Key not found. Check `.env.local` and restart server.

```
[OASIS] ❌ OPENAI_API_KEY is not configured!
```
→ OpenAI key missing. Add it to `.env.local` and restart.

```
[OASIS] API Keys configured: { hasPdfcoKey: true, hasOpenaiKey: true }
```
→ ✅ Keys are loaded! If still failing, it's a different issue.

---

## 💡 Common Issues

### Issue 1: Wrong File Name
- ❌ `.env` (wrong - this is a template)
- ✅ `.env.local` (correct - this is what Next.js uses)

### Issue 2: Didn't Restart
- After editing `.env.local`, you MUST restart the server
- Ctrl+C to stop, then `npm run dev`

### Issue 3: Typo in Variable Name
```env
# Wrong:
PDFCO-API-KEY=xxx  (hyphens)
PDFCO_APIKEY=xxx   (missing underscore)

# Correct:
PDFCO_API_KEY=xxx
# OR
PDF_CO_API_KEY=xxx
```

### Issue 4: Spaces Around Equals
```env
# Wrong:
PDFCO_API_KEY = xxx

# Correct:
PDFCO_API_KEY=xxx
```

---

## 🧪 Quick Test

Run this in PowerShell while in your project directory:

```powershell
# Check if .env.local exists
if (Test-Path .env.local) {
    Write-Host "✓ .env.local exists"
    
    # Check if keys are present (without showing values)
    $content = Get-Content .env.local -Raw
    if ($content -match "PDF_CO_API_KEY|PDFCO_API_KEY") {
        Write-Host "✓ PDF.co key found"
    } else {
        Write-Host "✗ PDF.co key NOT found"
    }
    
    if ($content -match "OPENAI_API_KEY") {
        Write-Host "✓ OpenAI key found"
    } else {
        Write-Host "✗ OpenAI key NOT found"
    }
} else {
    Write-Host "✗ .env.local does NOT exist"
}
```

---

## ✅ Final Steps

1. **Confirm both keys are in `.env.local`:**
   - `PDF_CO_API_KEY=...`
   - `OPENAI_API_KEY=...`

2. **Restart the server:**
   ```bash
   npm run dev
   ```

3. **Check server console when you upload:**
   - Look for: `[OASIS] API Keys configured: { hasPdfcoKey: true, hasOpenaiKey: true }`

4. **If both show `true`, the keys are loaded!**

5. **Upload a test file and check the logs**

---

## 🎯 What to Do Next

1. Add `OPENAI_API_KEY` to `.env.local` (if not already there)
2. Save the file
3. Restart server: `npm run dev`
4. Try uploading again
5. Check server console for `[OASIS]` logs
6. The detailed logs will tell you exactly what's happening

---

**Need more help?** Share the `[OASIS]` logs from your server console!

