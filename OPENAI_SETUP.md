# OpenAI API Setup for AI Competency Assessment & Video Analysis

## 🎯 Overview

This system uses **OpenAI GPT-4o with Vision** to provide real-time, AI-powered analysis of healthcare worker competency evaluations through:
- **Live Video Analysis**: Real-time frame-by-frame assessment of clinical demonstrations
- **Automated Scoring**: Accurate competency scoring with detailed confidence levels
- **Detailed Observations**: Specific, evidence-based feedback on performance
- **Smart Recommendations**: Actionable guidance for improvement

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy your API key (starts with `sk-...`)
5. ⚠️ **Save it securely** - you won't be able to see it again!

### Step 2: Add API Key to `.env.local`

In the root directory of your project, open the `.env.local` file and add your API key:

```bash
# .env.local

# OpenAI API Key for AI-powered video analysis
OPENAI_API_KEY=sk-your-actual-api-key-here

# Supabase Configuration (should already be set)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Example:**
```bash
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

### Step 3: Restart Your Development Server

After adding the API key:
```bash
# Stop your current dev server (Ctrl+C)
# Then restart it:
npm run dev
```

---

## ✅ Verify It's Working

### Check #1: Server Logs
When you start a video evaluation, check the terminal/console logs. You should see:

✅ **Working correctly:**
```
🟢 [AI Analysis] Attempt 1/3 for live frame analysis
Calling OpenAI GPT-4o with VIDEO ANALYSIS...
OpenAI analysis completed successfully (with video)
```

❌ **Not working (using mock):**
```
⚠️ OpenAI API key not found in environment variables
⚠️ To enable real AI analysis, set OPENAI_API_KEY in your .env.local file
```

### Check #2: Evaluation Results
Real AI analysis provides:
- ✅ **Specific observations** like "Hand positioning at 00:01:30 shows proper technique"
- ✅ **Confidence scores** that vary based on what's visible in the video
- ✅ **Evidence timestamps** that reference exact moments in the recording
- ✅ **Contextual recommendations** based on actual observed performance

Mock analysis provides:
- ❌ Generic observations like "Demonstrated proper assessment techniques"
- ❌ Random confidence scores (typically 85-95%)
- ❌ Simulated timestamps
- ❌ Generic recommendations

---

## 🎥 How Video Analysis Works

### Live Camera Evaluation Flow

1. **Frame Capture**: System captures frames every 5 seconds during live demonstration
2. **Image Processing**: Frames converted to base64-encoded JPEG format
3. **OpenAI Vision Analysis**: Each frame sent to GPT-4o with Vision API
4. **Real-time Feedback**: AI analyzes:
   - ✅ Clinical technique and hand positioning
   - ✅ Safety compliance (PPE, hand hygiene, protocols)
   - ✅ Communication approach and patient interaction
   - ✅ Documentation practices (if visible)
5. **Progressive Scoring**: Scores updated as more frames are analyzed
6. **Final Assessment**: Comprehensive evaluation saved to database

### What OpenAI GPT-4o Analyzes

The AI provides **detailed, accurate analysis** including:

**Clinical Skills**
- Hand positioning and technique accuracy
- Procedural compliance and sequence
- Equipment handling and setup
- Error recognition and correction

**Communication**
- Patient approach (distance, orientation, eye contact)
- Verbal and non-verbal communication quality
- Empathy and professionalism indicators
- Patient engagement and responsiveness

**Safety & Compliance**
- PPE usage (correct donning, wearing, doffing)
- Hand hygiene compliance (specific moments)
- Infection control measures
- Safety protocol adherence

**Documentation**
- Accuracy and completeness (if visible)
- Timeliness and detail level
- Privacy measures

---

## 🔧 Troubleshooting

### Issue: "OpenAI not configured, using mock analysis"

**Solution 1**: Check API Key Format
```bash
# Make sure your key starts with "sk-"
OPENAI_API_KEY=sk-proj-...   # ✅ Correct
OPENAI_API_KEY=your-key-here  # ❌ Wrong - replace with actual key
OPENAI_API_KEY=                # ❌ Wrong - empty
```

**Solution 2**: Restart Server
```bash
# Kill the dev server completely (Ctrl+C)
npm run dev
```

**Solution 3**: Check File Location
- `.env.local` must be in the **root directory** (same level as `package.json`)
- Not in `app/`, `components/`, or any subdirectory

### Issue: "AI Analysis Error" or Blank Results

**Solution 1**: Check API Key Permissions
- Ensure your OpenAI account has available credits
- Check usage limits at [OpenAI Usage Dashboard](https://platform.openai.com/usage)

**Solution 2**: Check API Key Status
- Verify the key hasn't been revoked
- Try generating a new key if needed

**Solution 3**: Check Network Connection
- OpenAI API requires internet connection
- Check firewall settings

### Issue: Low Confidence Scores or Generic Feedback

**Cause**: Camera quality, lighting, or positioning
**Solution**:
- ✅ Ensure good lighting on the demonstration area
- ✅ Position camera to clearly capture hands and technique
- ✅ Maintain stable camera position (avoid excessive movement)
- ✅ Ensure staff member is clearly visible and identifiable

---

## 💰 API Costs

OpenAI GPT-4o Vision pricing (as of 2024):
- **Input**: ~$2.50-5.00 per 1M tokens
- **Images**: ~$0.00765 per image (standard quality)

**Estimated cost per evaluation:**
- 60-second evaluation = ~12 frames
- Total cost: ~$0.09-0.12 per evaluation

💡 **Tip**: Monitor usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env.local` to git** (already in `.gitignore`)
2. ✅ **Use separate API keys** for development and production
3. ✅ **Rotate keys regularly** (every 90 days recommended)
4. ✅ **Set usage limits** in OpenAI dashboard to prevent unexpected charges
5. ✅ **Monitor API usage** regularly for anomalies

---

## 📊 API Usage Monitoring

### View API Calls in Logs
The system logs every AI analysis attempt:
```bash
🟢 [AI Analysis] Attempt 1/3 for live frame analysis
✅ OpenAI analysis completed successfully (with video)
❌ [AI Analysis] Attempt 1 failed: API key invalid
```

### Check OpenAI Dashboard
- [Usage Dashboard](https://platform.openai.com/usage) - View API calls and costs
- [API Keys](https://platform.openai.com/api-keys) - Manage your keys
- [Limits](https://platform.openai.com/account/limits) - Set spending limits

---

## 🆘 Need Help?

**Common Issues:**
1. ❓ API key not working → Verify format starts with `sk-proj-` or `sk-`
2. ❓ "Mock analysis" message → Check `.env.local` file exists and has correct key
3. ❓ Server not picking up changes → Fully restart dev server (stop and start)
4. ❓ Low quality results → Improve camera positioning and lighting

**Still having issues?**
- Check the server logs for detailed error messages
- Verify your OpenAI account has available credits
- Try generating a new API key

---

## ✨ Features Enabled with OpenAI

✅ **Real-time Video Analysis** - Frame-by-frame competency assessment
✅ **Accurate Scoring** - Evidence-based performance evaluation  
✅ **Detailed Observations** - Specific, timestamped feedback
✅ **Smart Recommendations** - Actionable improvement guidance
✅ **Identity Verification** - AI confirms staff member identity
✅ **Activity Detection** - Recognizes clinical vs. idle time
✅ **Comprehensive Reports** - Detailed assessment documentation

Without OpenAI key: Falls back to **simulated analysis** with generic feedback.

