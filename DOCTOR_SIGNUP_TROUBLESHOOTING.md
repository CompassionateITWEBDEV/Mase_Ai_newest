# Doctor Signup Troubleshooting Guide

## 🔍 Common Issues & Solutions

### **Issue 1: Form Not Submitting**

**Symptoms:**
- Button doesn't respond
- No error message shown
- Page doesn't change

**Solutions:**
1. Check browser console for errors (F12)
2. Verify all required fields are filled
3. Ensure password is at least 6 characters
4. Confirm password and confirm password match
5. NPI must be exactly 10 digits

---

### **Issue 2: Validation Errors**

**Required Fields:**
- ✅ First Name
- ✅ Last Name
- ✅ Email (valid format)
- ✅ Password (min 6 characters)
- ✅ Confirm Password (must match)
- ✅ NPI (exactly 10 digits)
- ✅ Specialty
- ✅ License Number
- ✅ License State
- ✅ License Expiration Date
- ✅ Years of Experience
- ✅ Hourly Rate

**Optional Fields:**
- Phone
- DEA Number
- Bio

---

### **Issue 3: API Errors**

**Common Error Messages:**

1. **"Missing required fields"**
   - Solution: Fill all required fields

2. **"NPI must be 10 digits"**
   - Solution: Enter exactly 10 numeric digits

3. **"Invalid email format"**
   - Solution: Use valid email (e.g., doctor@example.com)

4. **"Password must be at least 6 characters"**
   - Solution: Use longer password

5. **"Email already registered"**
   - Solution: Use different email or login instead

6. **"NPI already exists"**
   - Solution: This NPI is already registered
   - If you're claiming an existing account, the system should update it

---

### **Issue 4: Phone Field Mismatch**

**Problem:** The form has a `phone` field but the API doesn't save it.

**Status:** This is a minor issue - phone is collected but not saved to database.

**Impact:** None - signup still works, phone just isn't stored.

**Fix:** Either:
- Remove phone from form (quick fix)
- Add phone to API and database (proper fix)

---

## 🧪 Testing Steps

### **Step 1: Open Browser Console**
```
1. Open doctor portal
2. Press F12 (or right-click > Inspect)
3. Go to "Console" tab
4. Try to sign up
5. Look for error messages
```

### **Step 2: Fill Form Correctly**
```
First Name: John
Last Name: Doe
Email: john.doe@example.com
Phone: 5551234567 (optional)
Password: password123
Confirm Password: password123
NPI: 1234567890 (exactly 10 digits)
DEA: (optional)
Specialty: Select any
License Number: ABC123
License State: Select any
License Expiration: Select future date
Years Experience: 5
Bio: (optional)
Hourly Rate: 125.00 (default)
✅ Check both agreement boxes
```

### **Step 3: Submit**
```
1. Click "Complete Registration"
2. Wait for response
3. Check for:
   - Success toast notification
   - Success alert popup
   - Redirect to login page
```

---

## 🔧 Quick Fixes

### **Fix 1: Remove Phone Field (Temporary)**

If phone field is causing issues, you can remove it from the form temporarily.

### **Fix 2: Add Phone to API (Proper)**

Update the API to handle phone field properly.

### **Fix 3: Check Database Connection**

Ensure Supabase connection is working:
- Check `.env.local` has correct credentials
- Verify `physicians` table exists
- Check RLS policies allow inserts

---

## 📊 Expected Behavior

### **Successful Signup:**
1. Form validates all fields ✅
2. API creates doctor record ✅
3. Password is hashed ✅
4. Account status set to 'pending' ✅
5. Toast notification shows success ✅
6. Alert popup shows details ✅
7. Redirects to login page after 3 seconds ✅

### **After Signup:**
- Doctor account exists in database
- Status: 'pending' (needs admin approval)
- Cannot login until activated
- Admin can verify/activate in physicians page

---

## 🐛 Debug Mode

### **Enable Detailed Logging:**

The signup already has extensive logging. Check console for:

```
🏥 [FRONTEND] Starting doctor registration...
✅ [FRONTEND] All validations passed
📤 [FRONTEND] Sending registration request to API...
📋 [FRONTEND] Registration data: {...}
📥 [FRONTEND] Received response: 200 OK
📦 [FRONTEND] Response data: {...}
✅ [FRONTEND] Registration successful!
🎉 [FRONTEND] Doctor created: {...}
🔄 [FRONTEND] Redirecting to doctor portal...
```

If you see errors, they'll show as:
```
❌ [FRONTEND] Validation failed: ...
❌ [FRONTEND] Registration failed: ...
❌ [FRONTEND] Registration error: ...
```

---

## 📞 Need Help?

**What to provide:**
1. Error message from console (F12)
2. Which step fails (validation, API call, redirect)
3. Screenshot of error (if visual)
4. Data you're trying to submit (without password)

---

## ✅ Checklist

Before reporting an issue, verify:

- [ ] All required fields are filled
- [ ] Email format is valid
- [ ] Password is at least 6 characters
- [ ] Passwords match
- [ ] NPI is exactly 10 digits
- [ ] Both agreement checkboxes are checked
- [ ] Browser console is open (F12)
- [ ] You've read any error messages
- [ ] Database connection is working
- [ ] `.env.local` has OPENAI_API_KEY and Supabase credentials

---

**Last Updated**: November 21, 2025  
**Status**: Signup functional, phone field minor issue (doesn't affect signup)

