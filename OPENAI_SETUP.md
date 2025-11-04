# OpenAI API Setup for AI Competency Assessment

## Setting up OpenAI API Key

To enable real AI-powered competency assessments, you need to add your OpenAI API key to your environment variables.

### Step 1: Create `.env.local` file

In the root directory of your project, create a file named `.env.local` (if it doesn't exist):

```bash
# .env.local

```

### Step 2: Restart your development server

After adding the API key:
1. Stop your current dev server (Ctrl+C)
2. Restart it with `npm run dev`

### Step 3: Verify it's working

When you run an AI assessment, check the server logs. You should see:
- ✅ "OpenAI API called successfully" instead of "OpenAI not configured, using mock analysis"

## How It Works

1. **Real AI Analysis**: When an API key is configured, the system uses OpenAI GPT-4o to analyze competency assessments
2. **Mock Fallback**: If no API key is found, it automatically falls back to mock/simulated analysis
3. **Video/Audio Support**: The system is designed to accept video/audio data for future enhancements

## API Usage

The AI assessment uses GPT-4o model which:
- Analyzes competency areas (Clinical Skills, Communication, Safety, Documentation)
- Provides specific observations and recommendations
- Generates evidence timestamps
- Calculates confidence scores

## Security Note

⚠️ **IMPORTANT**: Never commit your `.env.local` file to git! It's already in `.gitignore` but always verify.

