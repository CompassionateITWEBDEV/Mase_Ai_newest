# Cost Per Mile ug Visit Time - Explanation

## 💰 Cost Per Mile (Cost per Mile)

### **Giunsa Nakuha:**
Ang **Cost Per Mile** is **$0.67 per mile** - this is the **IRS Standard Mileage Rate** for business use of vehicles.

### **Asa Nakuha:**
1. **IRS Standard Rate:**
   - Ang $0.67/mile is gikan sa IRS (Internal Revenue Service) standard mileage rate
   - This rate is updated annually by the IRS
   - Currently using 2024 rate: **$0.67 per mile**

2. **Where It's Set:**
   - **Default value:** Hardcoded sa code as `0.67`
   - **Location sa code:**
     - `app/api/gps/end-trip/route.ts` (lines 143, 156, 157)
     - `app/api/staff-performance/stats/route.ts` (lines 65, 75, 108, 117, 128)
   - **Database:** Stored sa `staff_performance_stats.cost_per_mile` column

### **Giunsa Ma-Calculate ang Total Cost:**
```
Total Cost = Total Miles × Cost Per Mile
```

**Example:**
- Staff nag-drive ug 50 miles
- Cost per mile: $0.67
- Total Cost = 50 × $0.67 = **$33.50**

### **Asa Gigamit:**
1. **Performance Dashboard** (`/staff-performance`):
   - Shows "Cost per Mile" sa metrics
   - Shows "Total Driving Cost" sa breakdown
   - Para makita ang total cost sa driving per staff

2. **Trip End:**
   - When staff ends trip, automatically calculates:
     - Total distance (miles)
     - Total cost = distance × $0.67
   - Saved sa `staff_performance_stats.total_cost`

3. **Daily/Weekly Stats:**
   - Aggregated cost per day
   - Aggregated cost per week
   - Para sa cost analysis ug budgeting

### **Can Be Customized:**
- Currently hardcoded as $0.67
- Can be customized per staff or per vehicle in the future
- Can be updated annually based on IRS rate changes

---

## ⏱️ Visit Time (Total Visit Time)

### **Giunsa Nakuha:**
Ang **Visit Time** is the **total time spent with patients** during visits, measured in **minutes**.

### **Giunsa Ma-Calculate:**
1. **Per Visit:**
   ```
   Visit Duration = Visit End Time - Visit Start Time (in minutes)
   ```

2. **Total Visit Time:**
   ```
   Total Visit Time = Sum of all visit durations for the day/week
   ```

**Example:**
- Visit 1: 60 minutes
- Visit 2: 45 minutes
- Visit 3: 30 minutes
- **Total Visit Time = 135 minutes (2 hours 15 minutes)**

### **Asa Gigamit:**

#### **1. Efficiency Score Calculation:**
```
Efficiency Score = (Visit Time / (Visit Time + Drive Time)) × 100
```

**Purpose:** Para makita kung mas daghan ba ang time sa patients vs driving

**Example:**
- Visit Time: 300 minutes (5 hours)
- Drive Time: 100 minutes (1.67 hours)
- Efficiency = (300 / (300 + 100)) × 100 = **75%**
- **Higher score = Better** (mas daghan time sa patients)

**Target:** 70%+ efficiency score

#### **2. Average Visit Duration:**
```
Average Visit Duration = Total Visit Time / Total Number of Visits
```

**Purpose:** Para makita ang average time per patient visit

**Example:**
- Total Visit Time: 300 minutes
- Total Visits: 5
- Average = 300 / 5 = **60 minutes per visit**

#### **3. Performance Dashboard Display:**
- Shows "Visit Time" sa key metrics card
- Shows "Time Distribution" with progress bars:
  - Visit Time vs Drive Time
  - Para makita ang ratio sa time spent

#### **4. Performance Analysis:**
- **Para sa Admin/Manager:**
  - Makita kung ang staff nag-spend ug enough time sa patients
  - Compare visit time vs drive time
  - Identify staff na masyado daghan drive time vs visit time
  - Monitor efficiency per staff

#### **5. Billing/Reimbursement:**
- Can be used para sa billing calculations
- Some payers reimburse based on visit duration
- Para sa documentation ug reporting

### **Where It's Stored:**
- **Per Visit:** `staff_visits.duration` (minutes)
- **Daily Total:** `staff_performance_stats.total_visit_time` (minutes)
- **Average:** `staff_performance_stats.avg_visit_duration` (minutes)

### **When It's Updated:**
1. **When Visit Ends:**
   - System calculates duration gikan sa start_time ug end_time
   - Updates `staff_visits.duration`
   - Adds to `staff_performance_stats.total_visit_time`
   - Recalculates `avg_visit_duration`
   - Recalculates `efficiency_score`

2. **Location sa Code:**
   - `app/api/visits/end/route.ts` (lines 36-39, 95-107)
   - Calculates duration when visit ends
   - Updates performance stats automatically

---

## 📊 Summary

### **Cost Per Mile:**
- **Value:** $0.67 per mile (IRS standard)
- **Purpose:** Calculate total driving cost
- **Formula:** `Total Cost = Miles × $0.67`
- **Used for:** Cost analysis, budgeting, performance tracking

### **Visit Time:**
- **Value:** Total minutes spent with patients
- **Purpose:** Measure efficiency, analyze performance
- **Formula:** `Efficiency = (Visit Time / (Visit Time + Drive Time)) × 100`
- **Used for:** 
  - Efficiency score calculation
  - Average visit duration
  - Performance analysis
  - Time distribution display
  - Billing/reimbursement (potential)

---

## 🔍 Code References

### **Cost Per Mile:**
- `app/api/gps/end-trip/route.ts` - Calculates total cost when trip ends
- `app/api/staff-performance/stats/route.ts` - Returns cost per mile in stats
- `app/staff-performance/page.tsx` - Displays cost per mile in dashboard

### **Visit Time:**
- `app/api/visits/end/route.ts` - Calculates visit duration and updates total visit time
- `app/api/staff-performance/stats/route.ts` - Returns total visit time in stats
- `app/staff-performance/page.tsx` - Displays visit time and uses it for efficiency calculation

---

## 💡 Important Notes

1. **Cost Per Mile:**
   - Currently hardcoded as $0.67
   - Should be updated annually based on IRS rate
   - Can be customized per staff/vehicle in future updates

2. **Visit Time:**
   - Measured in minutes
   - Only counts time when visit is active (start_time to end_time)
   - Does NOT include drive time to visit
   - Used primarily for efficiency analysis

3. **Efficiency Score:**
   - Higher = Better (more time with patients)
   - Target: 70%+ efficiency
   - Formula: `(Visit Time / Total Time) × 100`

---

**Last Updated:** 2024
**Status:** ✅ Current Implementation

