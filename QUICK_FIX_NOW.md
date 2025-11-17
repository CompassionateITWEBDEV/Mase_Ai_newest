# 🚨 QUICK FIX - Run This Now!

## ❌ Current Error:
```
Error: Failed to fetch messages
```

---

## ✅ THE FIX (30 Seconds)

### **Step 1: Run This SQL Script**

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste: **`FIX_MESSAGES_ERROR.sql`**
3. Click **"Run"**
4. Wait for: `✅ MESSAGES ERROR FIXED!`

---

### **Step 2: Restart Server**

```bash
# Press Ctrl+C in terminal
npm run dev
```

---

### **Step 3: Test**

Go to: http://localhost:3000/facility-portal

Should see:
- ✅ Page loads completely
- ✅ No errors in console
- ✅ Messages tab works
- ✅ Welcome message appears

---

## 📋 What This Fixes

The error happens because the `facility_messages` table wasn't created properly. 

The fix script:
1. ✅ Recreates the `facility_messages` table
2. ✅ Adds proper indexes
3. ✅ Sets up auto-numbering
4. ✅ Enables RLS policies
5. ✅ Creates a welcome message

---

## 🎯 After This Works

Test these features:
1. **Submit Referral** - Should create notification message
2. **Messages Tab** - Should show welcome message
3. **Refresh Button** - Should update messages

---

## ✅ You're Done!

After running the fix:
- Facility portal fully functional ✅
- All tabs working ✅
- Database connected ✅
- Ready to use! 🎉

