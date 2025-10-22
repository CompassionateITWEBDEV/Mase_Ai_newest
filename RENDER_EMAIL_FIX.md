# Fix Email Timeout on Render Deployment

## Problem
The email functionality works locally but fails on Render with `ETIMEDOUT` errors. This is because Gmail SMTP has connection restrictions on cloud platforms.

## Solution
Use SendGrid as the primary email service for cloud deployment.

## Step 1: Get SendGrid API Key

1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for a free account (100 emails/day free)
3. Go to Settings > API Keys
4. Create a new API Key with "Full Access" permissions
5. Copy the API key

## Step 2: Update Render Environment Variables

In your Render dashboard, go to your service and add these environment variables:

```
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key-here
EMAIL_USER=your-verified-sender-email@yourdomain.com
NEXT_PUBLIC_APP_URL=https://your-render-app-url.onrender.com
```

## Step 3: Verify Sender Identity

1. In SendGrid dashboard, go to Settings > Sender Authentication
2. Click "Verify a Single Sender"
3. Add your email address (e.g., mase2025ai@gmail.com)
4. Check your email and click the verification link

## Step 4: Alternative - Use Resend (Easier Setup)

If you prefer Resend:

```
EMAIL_SERVICE=resend
RESEND_API_KEY=your-resend-api-key-here
EMAIL_USER=your-verified-sender-email@yourdomain.com
NEXT_PUBLIC_APP_URL=https://your-render-app-url.onrender.com
```

1. Go to [Resend](https://resend.com/)
2. Sign up and get your API key
3. Add your domain or use "Verified Senders" for testing

## Step 5: Deploy and Test

1. Push your changes to GitHub
2. Render will automatically redeploy
3. Test the email functionality

## Troubleshooting

### Still getting timeouts?
- Make sure you're using SendGrid or Resend (not Gmail)
- Check that your API keys are correct
- Verify your sender email is authenticated
- Check Render logs for specific error messages

### Gmail still not working?
Gmail SMTP is not recommended for cloud platforms due to:
- Connection timeouts
- Rate limiting
- Security restrictions
- App password requirements

## Environment Variables Summary

For SendGrid:
```
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_USER=your-email@gmail.com
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
```

For Resend:
```
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_USER=your-email@gmail.com
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
```

## Testing

After deployment, test by:
1. Going to your app's invite page
2. Sending a test invitation
3. Check the logs in Render dashboard
4. Verify the email is received

The system now includes:
- Automatic retry logic (3 attempts)
- Better error messages
- Cloud-optimized email services
- Fallback mechanisms
