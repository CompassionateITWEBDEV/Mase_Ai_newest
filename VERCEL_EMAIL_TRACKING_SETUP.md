# Vercel Email Tracking Setup

## 🚨 **Issue Fixed: Email Tracking on Vercel**

The problem was that email templates were using `localhost:3000` instead of your Vercel domain.

## ✅ **What I Fixed:**

1. **Dynamic URL Generation** - Now uses Vercel URL in production
2. **Environment Variable Support** - Uses `NEXT_PUBLIC_APP_URL` if set
3. **Fallback to Vercel URL** - Automatically detects Vercel deployment

## 🔧 **Vercel Environment Variables**

Add these to your Vercel project settings:

```
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_USER=alexizabao@gmail.com
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🧪 **How to Test:**

### **Step 1: Deploy to Vercel**
1. Push your changes to GitHub
2. Vercel will auto-deploy
3. Get your Vercel URL (e.g., `https://mase-ai-newest.vercel.app`)

### **Step 2: Test Email Tracking**
1. Go to your Vercel app's invite page
2. Send a test invitation
3. Check the email - the "Apply Now" link should use your Vercel domain
4. Click the link - it should redirect to your application
5. Check the database - `clicked_at` should be updated

### **Step 3: Debug if Still Not Working**
1. Go to `https://your-app.vercel.app/test-tracking`
2. Enter an invitation ID
3. Test the tracking functions
4. Check the results

## 🔍 **URL Structure Now:**

**Before (Broken):**
```
http://localhost:3000/api/invitations/track?action=click&id=123
```

**After (Fixed):**
```
https://your-app.vercel.app/api/invitations/track?action=click&id=123
```

## 📧 **Email Template URLs:**

The email templates now generate:
- **Tracking URLs:** `https://your-app.vercel.app/api/invitations/track?...`
- **Application Links:** `https://your-app.vercel.app/application`
- **Tracking Pixels:** `https://your-app.vercel.app/api/invitations/track?action=open&id=...`

## 🚀 **Deploy Steps:**

1. **Commit and push:**
   ```bash
   git add .
   git commit -m "Fix Vercel email tracking URLs"
   git push origin main
   ```

2. **Wait for Vercel deployment** (2-3 minutes)

3. **Test the tracking** using the debug tool

## 🎯 **Expected Results:**

After deployment, when you:
1. **Send an invitation** → Email contains Vercel URLs
2. **Click the email link** → Redirects to your Vercel app
3. **Check database** → `clicked_at` timestamp is recorded
4. **View analytics** → Click tracking shows in dashboard

The tracking should now work perfectly on Vercel! 🎉
