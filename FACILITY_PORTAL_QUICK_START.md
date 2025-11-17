# 🚀 Facility Portal - Quick Start (2 Minutes)

## ⚡ WHAT'S FIXED
Your facility portal now uses **real database** instead of mock data!

---

## 📋 SETUP (3 STEPS)

### **1. Run Database Script** (1 minute)

Go to: **Supabase Dashboard → SQL Editor**

Run this file:
```
scripts/100-facility-portal-tables.sql
```

Wait for: `✅ FACILITY PORTAL DATABASE READY!`

---

### **2. Verify Environment** (30 seconds)

Check `.env.local` has:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_KEY=your_service_key
```

---

### **3. Restart Server** (30 seconds)

```bash
# Press Ctrl+C to stop
npm run dev
```

---

## ✅ TEST IT

1. Go to: `/facility-portal`
2. Click **"Submit Referral"** tab
3. Fill out form:
   - Patient Initials: `J.D.`
   - Diagnosis: `Test diagnosis`
   - Insurance: `Medicare`
   - Services: Check any
4. Click **"Submit Referral"**
5. Should see: ✅ Success message
6. Go to **"Referral Tracker"** tab
7. Should see: Your new referral!

---

## 🎯 WHAT NOW WORKS

✅ Referrals saved to database  
✅ Messages tracked  
✅ DME orders stored  
✅ Auto-refresh every 30 seconds  
✅ Loading states  
✅ Error handling  
✅ Form validation  

---

## 🐛 TROUBLESHOOTING

### "Failed to fetch"
→ Run database script again  
→ Restart server  

### "Missing configuration"
→ Check `.env.local` file  
→ Restart server after changes  

### "No referrals showing"
→ Submit a test referral first  
→ Check Supabase database directly  

---

## 📚 DETAILED DOCS

See `FACILITY_PORTAL_SETUP_GUIDE.md` for complete documentation.

---

## 🎉 YOU'RE DONE!

The facility portal is now fully functional with real database integration.

**Test it by submitting a referral and watching it appear in the tracker!**

