# Quick Start: Document Processing

## 🚀 Get Started in 5 Minutes!

### Step 1: Get API Keys (2 minutes)

**PDF.co (for OCR):**
1. Go to https://pdf.co
2. Click "Sign Up" (free account)
3. Dashboard → API → Copy API Key

**OpenAI (for AI extraction):**
1. Go to https://platform.openai.com
2. Sign in or create account
3. API Keys → Create new key → Copy it

### Step 2: Add Keys to Environment (1 minute)

Create or edit `.env.local` file in project root:

```bash
PDFCO_API_KEY=your_pdfco_key_here
OPENAI_API_KEY=sk-your_openai_key_here
```

### Step 3: Restart Server (30 seconds)

```bash
# Press Ctrl+C to stop
npm run dev
```

### Step 4: Test It! (30 seconds)

1. Go to http://localhost:3000/referral-management
2. Find "Process Faxed Referral" card (right side)
3. Click "Choose a file"
4. Upload a referral PDF/image
5. Click "Process with AI-OCR"
6. Wait ~20 seconds
7. ✅ Done! Check "New Referrals" tab

---

## 🎯 What It Does

**Automatically extracts:**
- Patient Name
- Insurance Info
- Diagnosis
- Phone, Address, DOB
- And more!

**No typing needed!** 🎉

---

## 💰 Cost

- **Free Tier:** 150 docs/month (PDF.co) + $5 credit (OpenAI)
- **Per Document:** ~$0.01 (1 cent)
- **Compared to manual:** 99% cheaper + 100x faster!

---

## 📚 Full Documentation

- Setup Guide: `DOCUMENT_PROCESSING_SETUP.md`
- Implementation Details: `DOCUMENT_PROCESSING_IMPLEMENTATION_SUMMARY.md`

---

## ❓ Need Help?

**Error: "API key not configured"**
- Add keys to `.env.local`
- Restart server

**Error: "Module not found: openai"**
- Run: `npm install openai`

**Processing fails:**
- Check file is PDF/PNG/JPG
- Max size 10MB
- Verify API keys are correct

---

**That's it! You're ready to go! 🚀**

