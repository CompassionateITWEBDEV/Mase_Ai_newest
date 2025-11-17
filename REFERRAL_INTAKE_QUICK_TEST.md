# 🧪 Referral Intake - Quick Test Guide

## 🚀 Setup (One-Time)

### 1. Run the Database Script
```sql
-- In Supabase SQL Editor, paste and run:
scripts/120-marketing-referrals-table.sql
```

**Expected Output**:
```
✅ Marketing referrals table created successfully!
📊 Indexes created for performance
🔒 Row Level Security enabled
📈 Analytics views created
🎯 Ready for referral intake!
```

### 2. Verify Environment Variables
Check `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## ✅ Test Case 1: Basic Referral Submission

### Steps:
1. **Navigate**: `http://localhost:3000/referral-intake`

2. **Fill Form**:
   - Facility Name: `Test Hospital`
   - Contact Name: `John Smith`
   - Contact Phone: `555-1234`
   - Contact Email: `jsmith@test.com`
   - Patient Name: `Jane Doe`
   - Patient Age: `65`
   - Service Needed: `Home Health`
   - Urgency Level: `Routine`
   - Referred By: `Sarah Johnson`
   - Insurance Type: `Medicare`
   - Notes: `Test referral`

3. **Click**: "Submit Referral"

4. **Verify Success Page Shows**:
   - ✅ Green checkmark
   - ✅ "Referral Submitted Successfully!"
   - ✅ Referral Number (e.g., `MKT-20251117-0001`)
   - ✅ Facility: Test Hospital
   - ✅ Contact: John Smith
   - ✅ Patient: Jane Doe
   - ✅ Service: home-health
   - ✅ Badge: ROUTINE
   - ✅ Routing: "Routed to CHHS"

5. **Check Database**:
```sql
SELECT * FROM marketing_referrals 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected**: New record with all your data

---

## ✅ Test Case 2: Intelligent Routing to Serenity

### Steps:
1. **Go to**: `/referral-intake`

2. **Fill Form** (same as above, but):
   - Service Needed: **Behavioral Health**
   - Urgency Level: **Urgent**

3. **Submit**

4. **Verify**:
   - ✅ Badge shows: URGENT (different color)
   - ✅ Routing: "Routed to **Serenity**"
   - ✅ Message: "handled by the **Serenity** team"

---

## ✅ Test Case 3: STAT Referral (High Priority)

### Steps:
1. **Fill Form**:
   - Service Needed: `Skilled Nursing`
   - Urgency Level: **STAT**

2. **Submit**

3. **Check Console** (Browser DevTools → Console)
   - Should see: `🚨 URGENT REFERRAL: MKT-XXXXXXXX-XXXX - stat`

4. **Verify**:
   - ✅ Badge shows: STAT (red/destructive variant)
   - ✅ Routing: "Routed to CHHS"

---

## ✅ Test Case 4: QR Code Link

### Steps:
1. **Navigate with QR params**:
```
http://localhost:3000/referral-intake?facility=FAC-001&marketer=Sarah%20Johnson&source=qr
```

2. **Verify**:
   - ✅ "Referred By" field auto-filled with "Sarah Johnson"
   - ✅ Form shows QR indication

3. **Fill remaining fields and submit**

4. **Check Database**:
```sql
SELECT source, facility_id, referred_by 
FROM marketing_referrals 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected**:
- `source` = 'qr'
- `facility_id` = 'FAC-001'
- `referred_by` = 'Sarah Johnson'

---

## ✅ Test Case 5: Validation

### Steps:
1. **Try to submit with empty fields**

2. **Verify**:
   - ✅ Error shows: "Missing required field: facilityName" (or other)
   - ✅ Form doesn't submit

---

## ✅ Test Case 6: API GET Endpoint

### Test in Browser or Postman:

**Fetch all referrals**:
```
GET http://localhost:3000/api/marketing/referrals
```

**Filter by status**:
```
GET http://localhost:3000/api/marketing/referrals?status=new
```

**Filter by marketer**:
```
GET http://localhost:3000/api/marketing/referrals?referredBy=Sarah%20Johnson
```

**Filter by routing**:
```
GET http://localhost:3000/api/marketing/referrals?routing=serenity
```

**Expected Response**:
```json
{
  "success": true,
  "referrals": [ /* array of referrals */ ],
  "count": 3
}
```

---

## ✅ Test Case 7: Submit Another Referral

### Steps:
1. **After successful submission**, click "Submit Another Referral"

2. **Verify**:
   - ✅ Form reappears
   - ✅ Fields are cleared
   - ✅ Marketer name persists (if from QR)

---

## ✅ Test Case 8: Routing Logic

Test each service type and verify routing:

| Service | Expected Routing |
|---------|-----------------|
| `behavioral` | Serenity |
| `detox` | Serenity |
| `mental-health` | Serenity |
| `home-health` | CHHS |
| `skilled-nursing` | CHHS |
| `therapy` | CHHS |
| `hospice` | CHHS |
| `other` | M.A.S.E. Pro |

---

## ✅ Test Case 9: Analytics Views

### Test in Supabase SQL Editor:

**Referral stats by marketer**:
```sql
SELECT * FROM marketing_referral_stats;
```

**Routing stats**:
```sql
SELECT * FROM marketing_routing_stats;
```

**Expected**: Tables with aggregated statistics

---

## ✅ Test Case 10: Referral Number Format

### Steps:
1. **Submit 3 referrals on the same day**

2. **Verify referral numbers**:
   - First: `MKT-20251117-0001`
   - Second: `MKT-20251117-0002`
   - Third: `MKT-20251117-0003`

3. **Check uniqueness**:
```sql
SELECT referral_number, COUNT(*) 
FROM marketing_referrals 
GROUP BY referral_number 
HAVING COUNT(*) > 1;
```

**Expected**: No duplicates (empty result)

---

## 🎯 Quick Checklist

Copy and use this for testing:

```
□ Navigate to /referral-intake
□ Fill and submit form
□ See referral number (MKT-YYYYMMDD-XXXX)
□ Verify routing to correct organization
□ Check database has new record
□ Test behavioral → Serenity routing
□ Test home-health → CHHS routing
□ Test STAT urgency level
□ Test QR code parameters
□ Test validation on empty fields
□ Test GET API endpoint
□ Test filtering by status
□ Test "Submit Another Referral"
□ Verify marketer stats view
□ Verify routing stats view
□ Check console for urgent referral logs
```

---

## 🐛 Troubleshooting

### Referral Not Saving
**Fix**:
1. Check Supabase connection
2. Verify service role key in `.env.local`
3. Check browser console for errors
4. Verify table exists: `SELECT * FROM marketing_referrals LIMIT 1;`

### Referral Number Not Showing
**Fix**:
1. Check API response in Network tab
2. Verify `submittedReferral` state is set
3. Check success page renders `{submittedReferral.referralNumber}`

### Routing Incorrect
**Fix**:
1. Verify service type matches routing logic
2. Check `routing_destination` and `organization_name` in database
3. Review API route routing logic (lines 39-53)

### QR Parameters Not Working
**Fix**:
1. URL encode special characters (spaces = %20)
2. Check `searchParams` extraction
3. Verify `source` and `facilityId` sent to API

---

## ✅ Expected Database State After All Tests

```sql
-- Should have multiple referrals
SELECT 
    COUNT(*) as total_referrals,
    COUNT(DISTINCT referred_by) as unique_marketers,
    COUNT(DISTINCT routing_destination) as routing_destinations,
    COUNT(*) FILTER (WHERE urgency_level = 'stat') as stat_count,
    COUNT(*) FILTER (WHERE source = 'qr') as qr_count
FROM marketing_referrals;
```

**Expected**:
- `total_referrals` > 0
- Multiple `routing_destinations`
- Some `stat_count` and `qr_count` > 0

---

## 🎉 Success Criteria

All tests pass if:
- ✅ Referrals save to database
- ✅ Referral numbers unique and formatted correctly
- ✅ Routing logic works for all service types
- ✅ QR code parameters tracked
- ✅ Success page shows complete details
- ✅ API endpoints return correct data
- ✅ Analytics views have data
- ✅ No console errors
- ✅ Form validation works
- ✅ "Submit Another" resets form

**If all pass: Referral Intake is production-ready! 🚀**

