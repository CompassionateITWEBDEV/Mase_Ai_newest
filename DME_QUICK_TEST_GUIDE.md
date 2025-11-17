# 🧪 DME Supply Management - Quick Test Guide

## 🚀 How to Test (Step-by-Step)

### 1. Navigate to Facility Portal
```
http://localhost:3000/facility-portal
```

### 2. Click on "DME Orders" Tab
You should see:
- Two supplier cards (Parachute Health & Verse Medical)
- Search bar
- Status filter dropdown
- Orders list (may be empty initially)
- Refresh button in header

---

## ✅ Test Case 1: Create Order via Parachute Health

1. **Click the blue "Parachute Health" card** or its "Order DME Supplies" button
2. **Fill the form**:
   - Patient Initials: `J.W.`
   - Link to Referral: (optional - select from dropdown if any exist)
   - DME Items:
     - Category: `Wheelchair`
     - Item name: `Manual Wheelchair - Standard`
     - Quantity: `1`
3. **Click "Add Another Item"**
4. **Add second item**:
   - Category: `Walker`
   - Item name: `Folding Walker with Wheels`
   - Quantity: `1`
5. **Add notes**: `Please deliver to main entrance`
6. **Click "Create Order"**
7. **Verify**:
   - Success alert appears
   - Dialog closes
   - New order appears in the list
   - Order shows "Parachute" badge

---

## ✅ Test Case 2: Create Order via Verse Medical

1. **Click the green "Verse Medical" card**
2. **Fill the form**:
   - Patient Initials: `S.M.`
   - Category: `Oxygen`
   - Item name: `Portable Oxygen Concentrator`
   - Quantity: `1`
3. **Click "Create Order"**
4. **Verify**:
   - Success alert shows Verse Medical
   - Order appears with green "Verse Medical" badge

---

## ✅ Test Case 3: Search Functionality

1. **Type in search bar**: `J.W.`
2. **Verify**: Only orders for patient J.W. appear
3. **Clear search**
4. **Type**: `PARACHUTE` (tracking number prefix)
5. **Verify**: Only Parachute orders appear

---

## ✅ Test Case 4: Filter by Status

1. **Click status dropdown**
2. **Select "Approved"**
3. **Verify**: Only approved orders show
4. **Try other statuses**: Pending, Shipped, Delivered
5. **Return to "All Status"**

---

## ✅ Test Case 5: Refresh Data

1. **Click "Refresh" button** in header
2. **Verify**: 
   - Refresh icon spins
   - Data reloads
   - No errors in console

---

## ✅ Test Case 6: Order Details Display

**Check each order card shows**:
- ✅ Order number (e.g., `Order #DME2025001`)
- ✅ Supplier badge (Parachute or Verse Medical)
- ✅ Patient initials
- ✅ Order date
- ✅ Status badge with icon
- ✅ Items list with quantities
- ✅ Notes section (if provided)
- ✅ Tracking number box (blue background)
- ✅ Estimated delivery date

---

## ✅ Test Case 7: Validation

**Try to create order with missing fields**:

1. Open order dialog
2. Leave patient initials empty
3. **Verify**: "Create Order" button is disabled
4. Enter initials: `T.P.`
5. Leave item name empty
6. **Verify**: Button still disabled
7. Fill all required fields
8. **Verify**: Button becomes enabled

---

## ✅ Test Case 8: Multiple Items Management

1. Open order dialog
2. **Click "Add Another Item"** three times
3. **Verify**: Four item forms appear
4. **Fill each with different items**:
   - Wheelchair
   - Walker
   - Cane
   - Oxygen
5. **Click X button** on second item
6. **Verify**: Item is removed
7. **Submit order**
8. **Verify**: Order shows 3 items

---

## ✅ Test Case 9: Link to Referral

1. **First, create a referral** (in "Live Referral Submission" tab)
2. **Go back to DME Orders tab**
3. **Create new order**
4. **Select the referral** from dropdown
5. **Submit order**
6. **Verify**: Order is linked to referral in database

---

## ✅ Test Case 10: Empty States

1. **Filter by "Cancelled"** (if no cancelled orders exist)
2. **Verify**: Empty state shows with message "No DME Orders Found"
3. **Clear search bar**
4. **Search for nonexistent patient**: `X.X.X.`
5. **Verify**: Empty state with "Try adjusting your search or filters"

---

## ✅ Test Case 11: Responsive Design

1. **Resize browser** to mobile width (< 768px)
2. **Verify**:
   - Supplier cards stack vertically
   - Search and filter stack vertically
   - Order cards adjust width
   - Dialog remains scrollable
   - All text remains readable

---

## ✅ Test Case 12: Auto-Refresh

1. **Open browser console**
2. **Watch Network tab**
3. **Wait 30 seconds**
4. **Verify**: DME orders API call is made automatically

---

## 🐛 Common Issues & Solutions

### Orders Not Appearing
**Solution**: 
- Check Supabase connection
- Verify `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- Check browser console for errors
- Try manual refresh

### Order Creation Fails
**Solution**:
- Check Network tab for API error
- Verify all required fields filled
- Check Supabase table exists: `dme_orders`
- Verify `facility_users` table has data

### Tracking Not Showing
**Solution**:
- Check order status (only shipped/delivered have tracking)
- Verify `tracking_number` field in database

### Search Not Working
**Solution**:
- Check `order_id`, `patient_initials`, `tracking_number` fields exist
- Clear browser cache
- Verify state updates in React DevTools

---

## 📊 Expected Data Flow

```
User Action → Form Submit → API Request → Supabase Insert
                                              ↓
UI Updates ← API Response ← Success ← Database Record
```

---

## 🎯 Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ No linter errors
- ✅ Smooth UI transitions
- ✅ Data persists after refresh
- ✅ Search works instantly
- ✅ Filters work correctly
- ✅ Orders display all information
- ✅ Tracking shows for shipped orders
- ✅ Validation prevents invalid submissions
- ✅ Loading states appear during API calls

---

## 📝 Testing Checklist

Copy this to test systematically:

```
□ Navigate to DME tab
□ View supplier cards
□ Create order via Parachute Health
□ Create order via Verse Medical
□ Add multiple items
□ Remove item from order
□ Add special instructions
□ Link order to referral
□ Search by patient initials
□ Search by tracking number
□ Filter by status (each one)
□ Click manual refresh
□ Wait for auto-refresh
□ Verify order details complete
□ Test validation on empty fields
□ Check responsive design
□ Verify empty states
□ Check tracking information
□ Verify order count badges
□ Test dialog open/close
□ Cancel order creation
□ Check for console errors
```

---

## ✅ All Tests Passed?

**Congratulations! The DME Supply Management tab is fully functional and accurate.** 🎉

Ready for production use! 🚀

