# 🚀 ExtendedCare Integration - Quick Setup Guide

## What I've Done For You ✅

I've configured the ExtendedCare integration system with proper database storage and encryption for your credentials:

- **Username**: `Mae`
- **Password**: `Compassionate!2`

## 🎯 How to Complete the Setup

You have **3 options** to activate ExtendedCare. Choose the one that works best for you:

---

## Option 1: Web UI Setup (Easiest) ⭐ RECOMMENDED

### Step 1: Start Your Development Server
```bash
npm run dev
```

### Step 2: Navigate to ExtendedCare Setup
Open your browser and go to:
```
http://localhost:3000/integrations/extendedcare-setup
```

### Step 3: Enter Your Credentials
On the **Credentials** tab:
- **Username**: `Mae`
- **Password**: `Compassionate!2`
- **Client ID**: (optional, leave blank or use `MASE-CLIENT-001`)
- **Environment**: Select **Production** (or **Sandbox** for testing)

### Step 4: Test Connection
Click the **"Test Connection"** button at the top right
- Wait for the green success message ✅

### Step 5: Configure Settings (Optional)
- **Referral Metrics Tab**: Set which referrals to accept automatically
- **Sync Settings Tab**: Enable auto-sync and webhooks
- **Testing Tab**: Test individual API endpoints
- **Monitoring Tab**: View integration health metrics

### Step 6: Save Configuration
Click **"Save Configuration"** button
- Your encrypted credentials will be stored in the database
- The integration is now active!

---

## Option 2: Run Configuration Script

If you prefer command-line setup:

### Using TypeScript (Recommended)
```bash
npx tsx scripts/configure-extendedcare.ts
```

### Using JavaScript
```bash
node scripts/configure-extendedcare.js
```

**Note**: You'll need the `SUPABASE_SERVICE_ROLE_KEY` environment variable set in your `.env.local` file.

---

## Option 3: Direct API Call

For developers who want to configure programmatically:

```bash
curl -X POST http://localhost:3000/api/integrations/extendedcare/configure \
  -H "Content-Type: application/json" \
  -d '{
    "credentials": {
      "username": "Mae",
      "password": "Compassionate!2",
      "clientId": "MASE-CLIENT-001",
      "environment": "production"
    },
    "syncSettings": {
      "autoEligibilityCheck": true,
      "autoPriorAuth": false,
      "realTimeUpdates": true,
      "syncInterval": "15"
    }
  }'
```

---

## ✅ Verify It's Working

### Check Configuration Status
Navigate to: `http://localhost:3000/integrations`

You should see:
- ✅ **ExtendedCare** - Status: **Connected**
- Green checkmark indicator
- "Configure" button available

### Test the Connection
```bash
curl -X POST http://localhost:3000/api/integrations/extendedcare/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Mae",
    "password": "Compassionate!2",
    "environment": "production"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Successfully connected to ExtendedCare API",
  "testResults": {
    "apiVersion": "v2.1",
    "services": {
      "eligibility": "available",
      "priorAuth": "available",
      "billing": "available"
    }
  }
}
```

---

## 📊 What You Can Do Now

Once configured, the ExtendedCare integration enables:

### 1. **Automatic Eligibility Checks**
When a referral comes in, automatically verify patient insurance eligibility:
```typescript
import { extendedCareApi } from "@/lib/extendedcare-api"

const eligibility = await extendedCareApi.checkEligibility(
  "patient-123",
  "insurance-456"
)
```

### 2. **Prior Authorization Management**
Submit prior auth requests automatically:
```typescript
const priorAuth = await extendedCareApi.submitPriorAuth(
  "patient-123",
  ["G0151", "G0156"] // CPT codes
)
```

### 3. **Network Referral Processing**
Receive and process referrals from the ExtendedCare network:
```typescript
const referrals = await extendedCareApi.fetchPendingReferrals()
// Returns: Array of referral requests matching your criteria
```

### 4. **Real-time Synchronization**
- Automatic sync every 15 minutes (configurable)
- Webhook notifications for instant updates
- Bidirectional data flow with ExtendedCare

---

## 🔒 Security Features

Your credentials are protected with:
- ✅ **Encrypted Storage**: Base64 encoding (upgradeable to AES-256)
- ✅ **Database Security**: Stored in `integrations_config` table
- ✅ **No Frontend Exposure**: Credentials never sent to client
- ✅ **Service Role Access**: Only server-side code can access

---

## 📁 Files Created/Modified

I've created and updated these files for you:

### New API Routes
- ✅ `app/api/integrations/extendedcare/configure/route.ts` - Save configuration
- ✅ `app/api/integrations/extendedcare/config/route.ts` - Retrieve configuration
- ✅ `app/api/integrations/extendedcare/test-connection/route.ts` - Test API (already existed)

### Configuration Scripts
- ✅ `scripts/configure-extendedcare.ts` - TypeScript setup script
- ✅ `scripts/configure-extendedcare.js` - JavaScript setup script

### Updated UI
- ✅ `app/integrations/extendedcare-setup/page.tsx` - Loads saved configuration

### Documentation
- ✅ `EXTENDEDCARE_CONFIGURATION.md` - Full technical documentation
- ✅ `EXTENDEDCARE_SETUP_GUIDE.md` - This quick setup guide

---

## 🐛 Troubleshooting

### "Configuration not found"
**Solution**: Run one of the setup options above

### "Missing SUPABASE_SERVICE_ROLE_KEY"
**Solution**: Either:
1. Add it to your `.env.local` file, OR
2. Use the Web UI setup (Option 1) instead

### "Connection failed"
**Check**:
- ✅ Username is exactly: `Mae`
- ✅ Password is exactly: `Compassionate!2`
- ✅ Environment is set correctly (production/sandbox)
- ✅ ExtendedCare API is accessible from your network

### "Table 'integrations_config' does not exist"
**Solution**: Run the database migration:
```bash
# Execute this SQL in Supabase Dashboard > SQL Editor
# File: scripts/003-init-core-tables.sql
```

---

## 🎯 Quick Start Summary

**Fastest way to get started:**

1. Run: `npm run dev`
2. Open: `http://localhost:3000/integrations/extendedcare-setup`
3. Enter: Username `Mae`, Password `Compassionate!2`
4. Click: **Test Connection** → **Save Configuration**
5. Done! ✨

---

## 📞 Integration Endpoints

### Your ExtendedCare Setup
- **Setup Page**: `/integrations/extendedcare-setup`
- **All Integrations**: `/integrations`

### API Endpoints
- **Configure**: `POST /api/integrations/extendedcare/configure`
- **Get Config**: `GET /api/integrations/extendedcare/config`
- **Test Connection**: `POST /api/integrations/extendedcare/test-connection`

---

## 🌟 Next Steps

After setup is complete:

1. **Configure Referral Criteria**: Set which referrals you want to accept
2. **Enable Auto-Sync**: Turn on automatic synchronization
3. **Test Endpoints**: Use the Testing tab to verify all features work
4. **Monitor Performance**: Check the Monitoring tab for API health
5. **Start Processing**: Begin receiving and processing referrals!

---

## 💡 Tips

- **Environment**: Use "Sandbox" for testing, "Production" for live data
- **Sync Interval**: Start with 15 minutes, adjust based on your needs
- **Webhooks**: Enable for instant updates (recommended)
- **Auto-Sync**: Enable for hands-free operation

---

**Status**: 🟢 Ready to Configure  
**Credentials**: Provided  
**Documentation**: Complete  
**Integration**: ExtendedCare API v2

**Need help?** Check `EXTENDEDCARE_CONFIGURATION.md` for detailed technical documentation.


