# Cost Per Mile Setup Guide - Configurable Feature

## 🎯 Overview

Ang Cost Per Mile feature is now **configurable per staff member** instead of hardcoded. Each staff can have their own cost per mile rate, or use the default IRS standard rate of $0.67/mile.

---

## 📋 What Needs to Be Connected (REQUIRED)

### **1. Database Migration (MUST RUN FIRST!)**

**File:** `scripts/059-add-cost-per-mile-to-staff.sql`

**What it does:**
- Adds `cost_per_mile` column sa `staff` table
- Sets default value to $0.67 (IRS standard)
- Updates existing staff records to have default value

**⚠️ IMPORTANT: Without this migration, the feature will NOT work properly!**

**How to Run:**
1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Copy and paste the contents of `scripts/059-add-cost-per-mile-to-staff.sql`
4. Click **Run**
5. Verify the column was added:
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'staff' AND column_name = 'cost_per_mile';
   ```

**Expected Result:**
- Column `cost_per_mile` exists
- Default value is `0.67`
- All existing staff records have `cost_per_mile = 0.67`

---

## 🔧 How It Works

### **Priority Order:**
1. **Staff's Custom Rate** - If staff has `cost_per_mile` set in database
2. **Stats Record Rate** - If exists in `staff_performance_stats.cost_per_mile`
3. **Default Rate** - Falls back to $0.67 (IRS standard)

### **Code Changes:**

#### **1. API Endpoints Updated:**
- ✅ `app/api/gps/end-trip/route.ts` - Fetches staff's cost_per_mile
- ✅ `app/api/staff-performance/stats/route.ts` - Uses staff's cost_per_mile
- ✅ `app/api/visits/end/route.ts` - Already uses stats (no change needed)

#### **2. Tracking Page Updated:**
- ✅ Shows trip cost summary when trip ends
- ✅ Displays distance, cost per mile, and total cost
- ✅ Real-time cost calculation

---

## 📊 Database Schema

### **Staff Table - New Column:**
```sql
cost_per_mile DECIMAL(10, 2) DEFAULT 0.67
```

**Description:**
- Stores customizable cost per mile per staff member
- Default: $0.67 (IRS standard rate)
- Can be updated per staff or vehicle

---

## 🚀 How to Use

### **Option 1: Use Default Rate ($0.67)**
- No action needed
- All staff will use $0.67/mile automatically

### **Option 2: Set Custom Rate Per Staff**

**Via SQL:**
```sql
-- Set custom cost per mile for specific staff
UPDATE public.staff 
SET cost_per_mile = 0.75 
WHERE id = 'staff-uuid-here';
```

**Via API (Future):**
- Can create admin interface to update cost per mile
- Or add to staff profile settings

### **Option 3: Set Different Rates for Different Staff**
```sql
-- Example: Different rates for different departments
UPDATE public.staff 
SET cost_per_mile = 0.70 
WHERE department = 'Nursing';

UPDATE public.staff 
SET cost_per_mile = 0.65 
WHERE department = 'Therapy';
```

---

## ✅ Verification Steps

### **1. Check Database Column:**
```sql
-- Verify column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'staff' 
AND column_name = 'cost_per_mile';
```

**Expected Result:**
```
column_name   | data_type | column_default
--------------|-----------|---------------
cost_per_mile | numeric   | 0.67
```

### **2. Check Staff Records:**
```sql
-- View staff with their cost per mile
SELECT id, name, department, cost_per_mile
FROM public.staff
LIMIT 10;
```

### **3. Test Trip End:**
1. Go to `/track/[staffId]`
2. Start a trip
3. End the trip
4. Check if cost is calculated correctly
5. Verify cost per mile is shown in trip summary

### **4. Check Performance Dashboard:**
1. Go to `/staff-performance`
2. Select a staff member
3. Check "Cost per Mile" in metrics
4. Should show staff's custom rate or default $0.67

---

## 🔍 Code Flow

### **When Trip Ends:**
```
1. User clicks "End Trip"
   ↓
2. API: /api/gps/end-trip
   ↓
3. Fetches staff.cost_per_mile from database
   ↓
4. Calculates: total_cost = distance × cost_per_mile
   ↓
5. Updates staff_performance_stats with cost
   ↓
6. Returns trip data with cost info
   ↓
7. Tracking page displays cost summary
```

### **When Viewing Performance Stats:**
```
1. User views /staff-performance
   ↓
2. API: /api/staff-performance/stats
   ↓
3. Fetches staff.cost_per_mile from database
   ↓
4. Uses staff rate, or stats rate, or default 0.67
   ↓
5. Returns cost_per_mile in response
   ↓
6. Dashboard displays cost metrics
```

---

## 📝 Example Scenarios

### **Scenario 1: Default Rate**
- Staff has no custom `cost_per_mile` set
- System uses default: **$0.67/mile**
- Trip: 50 miles → Cost: **$33.50**

### **Scenario 2: Custom Rate**
- Staff has `cost_per_mile = 0.75` in database
- System uses: **$0.75/mile**
- Trip: 50 miles → Cost: **$37.50**

### **Scenario 3: Department-Based Rates**
- Nursing staff: $0.70/mile
- Therapy staff: $0.65/mile
- Each staff uses their department rate

---

## ⚠️ Important Notes

1. **Migration Required:**
   - Must run `scripts/059-add-cost-per-mile-to-staff.sql` first
   - Without this, system will use hardcoded $0.67

2. **Backward Compatible:**
   - Existing code still works with default $0.67
   - New code enhances with customizable rates

3. **Performance:**
   - Cost per mile is fetched once per trip end
   - Cached in `staff_performance_stats` for daily stats
   - No performance impact

4. **Updates:**
   - Can update cost per mile anytime
   - New trips will use updated rate
   - Historical stats keep their original rate

---

## 🐛 Troubleshooting

### **Issue: Cost still shows $0.67 even after setting custom rate**

**Solution:**
1. Check if migration ran successfully
2. Verify staff record has `cost_per_mile` set:
   ```sql
   SELECT id, name, cost_per_mile FROM staff WHERE id = 'your-staff-id';
   ```
3. Clear browser cache and refresh
4. Check API response in browser console

### **Issue: Migration fails**

**Solution:**
1. Check if column already exists:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'staff' AND column_name = 'cost_per_mile';
   ```
2. If exists, skip migration
3. If not, check for syntax errors in SQL

### **Issue: Cost calculation is wrong**

**Solution:**
1. Verify distance is calculated correctly
2. Check cost_per_mile value in database
3. Verify formula: `cost = distance × cost_per_mile`
4. Check browser console for errors

---

## 📚 Related Files

- `scripts/059-add-cost-per-mile-to-staff.sql` - Database migration
- `app/api/gps/end-trip/route.ts` - Trip end with cost calculation
- `app/api/staff-performance/stats/route.ts` - Performance stats with cost
- `app/track/[staffId]/page.tsx` - Tracking page with cost display
- `app/staff-performance/page.tsx` - Performance dashboard

---

## ✅ Checklist

- [ ] **Run database migration** (`scripts/059-add-cost-per-mile-to-staff.sql`) - **REQUIRED!**
- [ ] Verify column exists in `staff` table
- [ ] Test trip end with cost calculation
- [ ] Verify cost displays in tracking page
- [ ] Check performance dashboard shows correct cost per mile
- [ ] (Optional) Set custom rates for staff members

---

## 🚨 IMPORTANT: Before Using This Feature

**You MUST run the database migration first!**

Without the migration:
- ❌ Cost per mile will still use hardcoded $0.67
- ❌ Custom rates won't work
- ❌ Tracking page may show errors

After migration:
- ✅ Cost per mile is configurable per staff
- ✅ Tracking page shows accurate cost
- ✅ Performance dashboard uses correct rates
- ✅ All calculations are accurate

---

**Last Updated:** 2024
**Status:** ✅ Ready to Use (after migration)

