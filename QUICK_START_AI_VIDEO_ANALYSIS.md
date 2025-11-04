# 🚀 Quick Start: AI Video Analysis (5 Minutes)

## ⚡ Fast Setup

### 1. Get OpenAI API Key (2 minutes)

Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys) and:
- Sign in or create account
- Click **"Create new secret key"**
- Copy the key (starts with `sk-`)

### 2. Create `.env.local` File (1 minute)

In your **project root directory** (same folder as `package.json`), create a file named `.env.local`:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Example:**
```bash
OPENAI_API_KEY=sk-proj-abc123xyz789defghijk456...
```

### 3. Restart Server (1 minute)

```bash
# Stop your server (Ctrl+C or Cmd+C)
npm run dev
```

### 4. Verify It Works (1 minute)

1. Open your app in browser
2. Navigate to **Evaluations → Video Evaluations** tab
3. Look for the green banner:

```
✓ AI Analysis Active
OpenAI GPT-4o Vision is configured and ready
```

**If you see a yellow banner instead:**
- ⚠️ Check that `.env.local` is in the root directory (not in app/ or components/)
- ⚠️ Verify the API key starts with `sk-` or `sk-proj-`
- ⚠️ Make sure you fully restarted the server

---

## ✅ Test It Out

1. Select a **staff member** and **evaluation type**
2. Click **"Start Camera"** (allow camera access)
3. Click **"Start Recording"**
4. Watch real-time AI insights appear! 🎉

The AI will analyze:
- ✅ Clinical technique and hand positioning
- ✅ Safety compliance (PPE, hand hygiene)
- ✅ Communication and patient interaction
- ✅ Documentation practices

---

## 🎯 What You Get With Real AI

**Before (Mock Mode):**
```
❌ Generic feedback: "Demonstrated proper assessment techniques"
❌ Random confidence: 92%
❌ Simulated timestamps
```

**After (Real AI):**
```
✅ Specific feedback: "Hand positioning at 00:01:30 shows proper 
   sterile technique with appropriate finger placement"
✅ Accurate confidence: 87% (based on visibility)
✅ Real timestamps: Based on actual video moments
```

---

## 💰 Cost

**~$0.09-0.12 per 60-second evaluation**
- 12 frames @ ~$0.0077 per frame

Set spending limits at [platform.openai.com/account/limits](https://platform.openai.com/account/limits)

---

## 🆘 Troubleshooting

### Still seeing "Mock Mode"?

**Check these 3 things:**

1. **File Location**
   ```
   ✅ Correct:
   my-project/
   ├── .env.local          ← Here (same level as package.json)
   ├── package.json
   └── app/
   
   ❌ Wrong:
   my-project/
   ├── package.json
   └── app/
       └── .env.local      ← Not here!
   ```

2. **API Key Format**
   ```bash
   ✅ Correct: OPENAI_API_KEY=sk-proj-abc123...
   ❌ Wrong:   OPENAI_API_KEY=your-key-here
   ❌ Wrong:   OPENAI_API_KEY=
   ```

3. **Server Restart**
   - Must **fully stop** server (Ctrl+C)
   - Then start again: `npm run dev`
   - Refreshing browser is NOT enough

### API Key Not Working?

- Check you have credits: [platform.openai.com/usage](https://platform.openai.com/usage)
- Verify key isn't revoked: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Try generating a new key

---

## 📚 More Information

- **Detailed Guide**: See `OPENAI_SETUP.md`
- **Complete Summary**: See `AI_VIDEO_ANALYSIS_SETUP_COMPLETE.md`
- **OpenAI Dashboard**: [platform.openai.com](https://platform.openai.com)

---

## ✨ That's It!

Your AI video analysis is now ready to use! 🎉

**Next:** Start recording evaluations and watch the AI provide real-time, accurate feedback on clinical performance.

