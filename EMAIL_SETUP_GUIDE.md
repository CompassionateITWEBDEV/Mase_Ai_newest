# 📧 **Email Setup Guide for Invite System**

## 🔧 **Setup Gmail App Password**

To send real emails, you need to set up Gmail App Password:

### **Step 1: Enable 2-Factor Authentication**
1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the steps to enable 2FA

### **Step 2: Generate App Password**
1. Go back to **Security** settings
2. Under "Signing in to Google", click **App passwords**
3. Select **Mail** and **Other (Custom name)**
4. Enter "MASE AI Invite System" as the name
5. Click **Generate**
6. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

### **Step 3: Update Environment Variables**
1. Open `.env.local` file in your project root
2. Replace `your-app-password-here` with your actual app password:

```env
EMAIL_USER=mase2025ai@gmail.com
EMAIL_PASS=your-16-character-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Step 4: Restart the Server**
```bash
pnpm dev
```

## ✅ **Test the Email System**

1. Go to: http://localhost:3000/invite
2. Fill in the invitation form:
   - **Name**: Your Name
   - **Email**: Your Gmail address
   - **Position**: Any position
   - **Template**: General Healthcare
3. Click **Send Invitation**
4. Check your Gmail inbox!

## 🎯 **What You'll Receive**

You'll get a beautifully formatted HTML email with:
- ✅ Professional Serenity Rehabilitation Center branding
- ✅ Personalized content with your name
- ✅ Clickable "Apply Now" button
- ✅ All the job details and requirements
- ✅ Contact information

## 🔧 **Troubleshooting**

### **If emails don't send:**
1. Check the server console for error messages
2. Verify the app password is correct (no spaces)
3. Make sure 2FA is enabled on your Google account
4. Check that the email address in `.env.local` matches your Google account

### **If you get "Less secure app" error:**
- This means you need to use App Password, not your regular password
- Follow Step 2 above to generate an App Password

## 🚀 **Ready to Send Invitations!**

Once configured, the invite system will send real emails to candidates! 🎉
