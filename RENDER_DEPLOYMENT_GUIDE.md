# 🚀 **Render Deployment Guide for MASE AI Platform**

## 📧 **Email Service Setup for Render**

Gmail SMTP often doesn't work on cloud platforms like Render due to network restrictions. Here are the recommended solutions:

### **Option 1: Resend (Recommended - Free & Easy)**

1. **Sign up at Resend**: https://resend.com
2. **Get API Key**: Go to API Keys section
3. **Add to Render Environment Variables**:
   ```
   EMAIL_SERVICE=resend
   RESEND_API_KEY=your_resend_api_key_here
   EMAIL_USER=your-verified-domain@yourdomain.com
   ```

### **Option 2: SendGrid (Reliable)**

1. **Sign up at SendGrid**: https://sendgrid.com
2. **Create API Key**: Settings → API Keys → Create API Key
3. **Add to Render Environment Variables**:
   ```
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   EMAIL_USER=your-verified-email@yourdomain.com
   ```

### **Option 3: Mailgun (Alternative)**

1. **Sign up at Mailgun**: https://mailgun.com
2. **Get SMTP credentials**: Domains → Your Domain → SMTP
3. **Add to Render Environment Variables**:
   ```
   EMAIL_SERVICE=mailgun
   MAILGUN_SMTP_USER=your_smtp_username
   MAILGUN_SMTP_PASS=your_smtp_password
   EMAIL_USER=your-verified-email@yourdomain.com
   ```

### **Option 4: Gmail (Fallback - May Not Work)**

If you want to try Gmail anyway:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
```

## 🔧 **Render Environment Variables Setup**

In your Render dashboard, add these environment variables:

### **Required Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
```

### **Email Variables (Choose one service):**
```
EMAIL_SERVICE=resend
RESEND_API_KEY=your_api_key
EMAIL_USER=your-verified-email@domain.com
```

### **Optional Variables:**
```
NODE_ENV=production
```

## 🗄️ **Database Setup**

1. **Run the migration scripts** in Supabase SQL Editor:
   - `scripts/020-create-invitations-table-clean.sql`
   - `scripts/021-fix-invitations-rls.sql`

2. **Verify tables exist**:
   - `invitations`
   - `invitation_templates`

## 🚀 **Deployment Steps**

1. **Connect GitHub repository** to Render
2. **Set build command**: `pnpm install && pnpm build`
3. **Set start command**: `pnpm start`
4. **Add environment variables** (see above)
5. **Deploy!**

## 🧪 **Testing After Deployment**

1. **Visit your app**: `https://your-app-name.onrender.com/invite`
2. **Test individual invitation** first
3. **Test bulk invitations** with 2-3 emails
4. **Check Render logs** for any errors

## 🔍 **Troubleshooting**

### **If emails still don't send:**
1. Check Render logs for specific error messages
2. Verify email service API keys are correct
3. Ensure sender email is verified with the email service
4. Try a different email service

### **Common Issues:**
- **Connection timeout**: Use Resend or SendGrid instead of Gmail
- **Authentication failed**: Check API keys and email verification
- **Rate limiting**: Wait a few minutes between tests

## 📊 **Monitoring**

- **Render Dashboard**: Check logs and metrics
- **Email Service Dashboard**: Monitor delivery rates
- **Supabase Dashboard**: Check invitation records

## 🎯 **Recommended Setup**

For production, I recommend:
1. **Resend** for email delivery (free tier: 3,000 emails/month)
2. **Custom domain** for professional email addresses
3. **Supabase** for database and authentication
4. **Render** for hosting

This combination provides reliable email delivery and excellent performance! 🚀
