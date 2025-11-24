# 🚀 START HERE - OASIS Upload Quick Start

## You're Almost Ready! Follow These 3 Simple Steps:

---

## ⚡ Step 1: Get Your API Keys (5 minutes)

### PDF.co API Key (FREE)
1. Go to: **https://pdf.co**
2. Click "Sign Up Free"
3. Verify your email
4. Go to Dashboard → API
5. Copy your API key

### OpenAI API Key (Paid, but very cheap)
1. Go to: **https://platform.openai.com**
2. Sign up or log in
3. Click "API Keys" in left sidebar
4. Click "Create new secret key"
5. Copy the key (starts with `sk-...`)
6. Add $5-10 credits to your account

**Cost:** About $0.01 per document processed

---

## ⚡ Step 2: Configure Environment (2 minutes)

Open your `.env.local` file and add these lines:

```env
# PDF.co API Key
PDFCO_API_KEY=paste_your_pdfco_key_here

# OpenAI API Key
OPENAI_API_KEY=paste_your_openai_key_here
```

**Example:**
```env
PDFCO_API_KEY=abc123def456
OPENAI_API_KEY=sk-proj-abc123def456xyz789
```

**Save the file and restart your dev server:**
```bash
# Press Ctrl+C to stop current server
npm run dev
```

---

## ⚡ Step 3: Create Database Tables (1 minute)

1. Open **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy the contents of: `scripts/create-oasis-tables-v1.sql`
6. Paste into the editor
7. Click "Run" button

**Done!** Tables created.

---

## ✅ You're Ready! Test It Now

1. **Start your dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open the page:**
   ```
   http://localhost:3000/oasis-upload
   ```

3. **Upload a test document:**
   - Drag any PDF or image with medical text
   - Watch it process (15-60 seconds)
   - See AI analysis results!

---

## 🎯 What to Expect

### Upload Process:
1. **Uploading** (2-5 seconds) - File uploads to storage
2. **Processing** (15-60 seconds) - PDF.co extracts text, OpenAI analyzes
3. **Completed** - Results appear!

### You'll See:
- ✅ Patient information extracted
- ✅ Diagnosis codes identified
- ✅ Quality scores calculated
- ✅ Revenue optimization suggestions
- ✅ Risk factors and recommendations

---

## 🐛 Quick Troubleshooting

### Problem: "PDF.co API key not configured"
**Solution:** 
- Double-check you added `PDFCO_API_KEY` to `.env.local`
- Restart dev server: Press Ctrl+C, then run `npm run dev`

### Problem: "Invalid OpenAI API key"
**Solution:**
- Verify your key at: https://platform.openai.com/api-keys
- Make sure you have credits in your account
- Double-check the key in `.env.local`

### Problem: "Failed to store assessment"
**Solution:**
- Run the database migration (Step 3 above)
- Check Supabase connection in `.env.local`

---

## 📚 Need More Help?

Detailed guides are available:

- **Setup Guide:** `OASIS_UPLOAD_SETUP.md` (Complete configuration)
- **Test Guide:** `OASIS_UPLOAD_QUICK_TEST.md` (Detailed testing)
- **Implementation:** `OASIS_UPLOAD_IMPLEMENTATION_COMPLETE.md` (Technical details)

---

## 💰 Cost Breakdown

**PDF.co (Free Tier):**
- ✅ 300 documents/month FREE
- After: $0.01 per document

**OpenAI GPT-4o-mini:**
- $0.005 - $0.02 per document

**Total Monthly Cost Examples:**
- 50 documents: ~$0.25 - $1.00
- 100 documents: ~$0.50 - $2.00
- 300 documents: ~$1.50 - $6.00

**Very affordable!** 🎉

---

## ✨ Features You Get

- 📄 PDF text extraction (OCR)
- 🖼️ Image text extraction (OCR)
- 🤖 AI-powered analysis
- 💊 Diagnosis code identification
- 💰 Revenue optimization
- ⚠️ Risk factor detection
- 📊 Quality scoring
- 📈 Completeness assessment
- ✅ Recommendations

---

## 🎉 That's It!

You're all set. The OASIS Upload is now:
- ✅ **Using PDF.co** for text extraction
- ✅ **Using OpenAI** for AI analysis  
- ✅ **Fully functional** and ready to use

**Just add your API keys and start uploading!**

---

**Questions? Issues?** Check the detailed guides mentioned above.

**Ready to Go?** Head to: http://localhost:3000/oasis-upload

