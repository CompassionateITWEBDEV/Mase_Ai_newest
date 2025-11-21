# 🗄️ Telehealth Database Setup Guide

## ✅ **Quick Setup**

### **Step 1: Run the SQL Script**

1. Open your Supabase SQL Editor
2. Copy the contents of `scripts/120-telehealth-sessions-tables.sql`
3. Paste into the SQL Editor
4. Click **"Run"**
5. ✅ Done! Tables created successfully.

---

## 📋 **What Gets Created**

### **Tables:**
- `telehealth_consultations` - Stores consultation requests
- `telehealth_sessions` - Stores video session data

### **Security:**
- Row Level Security (RLS) policies
- Secure access for nurses and doctors

### **Performance:**
- Indexes for fast queries
- Optimized for real-time polling

### **Automation:**
- Triggers for automatic timestamps
- Functions for duration calculation

---

## ⚠️ **Important Notes**

### **Sample Data:**
The sample data insertion is **commented out** in the script because it requires an existing nurse ID from your staff table.

If you want to add sample data for testing:
1. Get a nurse ID from your staff table:
   ```sql
   SELECT id, name FROM staff LIMIT 5;
   ```

2. Uncomment the sample data section in the SQL script (lines 233-261)

3. Replace `'nurse-uuid-here'` with an actual nurse ID

4. Run just that INSERT statement

---

## 🧪 **Testing Without Sample Data**

You don't need sample data! The system works by:
1. Nurse creates consultation via the UI (Track Page)
2. System automatically inserts into database
3. Doctor sees it in the Doctor Portal

**Just use the application - it will create real data!**

---

## ✅ **Verify Installation**

Run this query to verify tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('telehealth_consultations', 'telehealth_sessions');
```

You should see both tables listed.

---

## 🔍 **Check Table Structure**

```sql
-- View consultation table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'telehealth_consultations'
ORDER BY ordinal_position;

-- View session table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'telehealth_sessions'
ORDER BY ordinal_position;
```

---

## 🔒 **Verify RLS Policies**

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('telehealth_consultations', 'telehealth_sessions');
```

You should see multiple policies for each table.

---

## 📊 **View Data (After Using System)**

```sql
-- View all consultations
SELECT 
  id,
  patient_name,
  nurse_name,
  doctor_name,
  urgency_level,
  status,
  created_at
FROM telehealth_consultations
ORDER BY created_at DESC;

-- View all sessions
SELECT 
  id,
  consultation_id,
  status,
  duration_seconds,
  created_at
FROM telehealth_sessions
ORDER BY created_at DESC;
```

---

## 🧹 **Clean Up (If Needed)**

To remove the tables and start fresh:

```sql
-- WARNING: This deletes all data!
DROP TABLE IF EXISTS telehealth_sessions CASCADE;
DROP TABLE IF EXISTS telehealth_consultations CASCADE;
```

Then re-run the setup script.

---

## 🚨 **Troubleshooting**

### **Error: "relation already exists"**
**Solution:** Tables already created. Either:
- Use the existing tables (they're ready!)
- Or drop them first (see Clean Up above)

### **Error: "column does not exist"**
**Solution:** This was fixed! Make sure you're using the updated SQL script that has the sample data commented out.

### **Error: "permission denied"**
**Solution:** Make sure you're running the script as a Supabase admin or service role.

### **No errors but can't see tables**
**Solution:** Check you're looking in the `public` schema:
```sql
SET search_path TO public;
```

---

## ✅ **Success Indicators**

You'll know it worked when:
- ✅ No errors in SQL Editor
- ✅ Tables appear in Supabase Table Editor
- ✅ Can view table structure
- ✅ RLS policies are active
- ✅ Application can create consultations

---

## 🎉 **You're Done!**

The database is ready for the telehealth video consultation system!

**Next Step:** Test the system by creating a consultation from the Track Page.

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the error message carefully
2. Verify you're using the latest SQL script
3. Make sure Supabase connection is active
4. Check browser console for API errors

**The system is ready to go!** 🚀

