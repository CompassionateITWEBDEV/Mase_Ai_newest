# Add BLOB_READ_WRITE_TOKEN

## ❌ Error You're Seeing

```
Vercel Blob: No token found. Either configure the `BLOB_READ_WRITE_TOKEN` environment variable
```

## What You Need

Your `.env.local` file needs **3 environment variables**:

```env
PDFCO_API_KEY=your_pdfco_key          ✅ (You have this)
OPENAI_API_KEY=your_openai_key        ❓ (Need to verify)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx ❌ (Missing - this is the issue)
```

---

## ✅ Solution: Get Vercel Blob Token

### Method 1: From Existing Vercel Project (If Connected)

**If your project is already deployed on Vercel:**

1. Go to: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Look for `BLOB_READ_WRITE_TOKEN`
5. Click "👁️ Show" to reveal the value
6. Copy the entire token
7. Add to your `.env.local`:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_ABC123XYZ789
```

8. **Restart your dev server:**
```bash
npm run dev
```

---

### Method 2: Create New Vercel Blob Storage

**If you don't have Blob Storage yet:**

1. Go to: https://vercel.com/dashboard
2. Click **Storage** in the top navigation
3. Click **Create Database**
4. Select **Blob**
5. Choose a name (e.g., "oasis-storage")
6. Click **Create**
7. Go to **Settings** tab
8. Copy the `.env.local` tab contents
9. It will show:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

10. Add this to your `.env.local` file

11. **Connect to your project:**
    - In Vercel Dashboard → Storage → Your Blob
    - Click **Connect Project**
    - Select your project

12. **Restart dev server:**
```bash
npm run dev
```

---

### Method 3: Using Vercel CLI (Quick)

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Link project (if not linked)
vercel link

# Pull environment variables
vercel env pull .env.local
```

This will automatically add all environment variables including `BLOB_READ_WRITE_TOKEN`.

Then restart:
```bash
npm run dev
```

---

## 📋 Complete .env.local Example

After adding all tokens, your `.env.local` should look like:

```env
# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx...

# Vercel Blob Storage - ADD THIS
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_ABC123XYZ789

# PDF.co OCR - You have this
PDF_CO_API_KEY=your_pdfco_key

# OpenAI AI - Add this
OPENAI_API_KEY=sk-proj-your_openai_key
```

---

## 🧪 Test After Adding Token

1. **Save `.env.local`**
2. **Restart server:** `npm run dev` (IMPORTANT!)
3. **Refresh browser:** http://localhost:3000/oasis-upload
4. **Upload a test file**
5. **Check server console for:**

```
[OASIS] === Starting file processing ===
[OASIS] Environment configured: { 
  hasPdfcoKey: true, 
  hasOpenaiKey: true, 
  hasBlobToken: true 
}
[OASIS] File uploaded to blob: https://...
```

---

## 🆘 Don't Have Vercel Account?

**Option 1: Create Free Vercel Account (Recommended)**

Vercel Blob is free for:
- 500MB storage
- 5GB bandwidth per month
- Perfect for testing and small projects

Sign up: https://vercel.com/signup

**Option 2: Alternative Storage (Advanced)**

You could modify the code to use:
- AWS S3
- Google Cloud Storage
- Supabase Storage
- Local file system (dev only)

But Vercel Blob is the easiest and it's already integrated!

---

## ✅ Summary

**What you need to do:**

1. Get `BLOB_READ_WRITE_TOKEN` from Vercel
2. Add it to `.env.local`
3. Restart server: `npm run dev`
4. Test upload again

**Your `.env.local` needs these 3 new variables:**
- ✅ `PDFCO_API_KEY` (you have)
- ❓ `OPENAI_API_KEY` (verify you have)
- ❌ `BLOB_READ_WRITE_TOKEN` (add this now)

---

## 🎯 Quick Start with Vercel Blob

**Fastest way:**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Create Blob storage in dashboard
# Go to: https://vercel.com/dashboard → Storage → Create → Blob

# 5. Pull environment variables
vercel env pull .env.local

# 6. Restart
npm run dev
```

Done! The token will be automatically added to your `.env.local`.

---

**After adding the token, the OASIS upload will work! 🚀**

