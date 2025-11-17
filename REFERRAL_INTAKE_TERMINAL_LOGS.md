# 🖥️ Referral Intake - Terminal Logs Documentation

## ✅ What Was Added

Enhanced terminal logging in the Referral Intake API to show detailed information when referrals are successfully inserted into the database.

**File Modified**: `app/api/marketing/referrals/route.ts`

---

## 📊 Example Terminal Output

### **Standard Referral Submission**

When a user submits a referral form, you'll see this in your terminal:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [REFERRAL INTAKE] Successfully inserted into database!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Referral Number: MKT-20251117-0001
🏥 Facility: Mercy General Hospital
👤 Contact: John Smith
🤒 Patient: Jane Doe
💊 Service: home-health
⏱️  Urgency: ROUTINE
🎯 Routing: CHHS (chhs)
👨‍💼 Marketer: Sarah Johnson
📱 Source: direct
🆔 Database ID: 123e4567-e89b-12d3-a456-426614174000
📅 Created: 11/17/2025, 10:30:45 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **URGENT or STAT Referral**

For high-priority referrals, you'll see additional alerts:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [REFERRAL INTAKE] Successfully inserted into database!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Referral Number: MKT-20251117-0002
🏥 Facility: Riverside Medical Center
👤 Contact: Emily Brown
🤒 Patient: Robert Wilson
💊 Service: behavioral
⏱️  Urgency: STAT
🎯 Routing: Serenity (serenity)
👨‍💼 Marketer: Mike Davis
📱 Source: qr
🆔 Database ID: 789e4567-e89b-12d3-a456-426614174111
📅 Created: 11/17/2025, 10:35:22 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
🚨 URGENT REFERRAL ALERT: MKT-20251117-0002
🚨 Priority Level: STAT
🚨 Patient: Robert Wilson
🚨 Facility: Riverside Medical Center
🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨

```

---

### **QR Code Referral**

When submitted via QR code link:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [REFERRAL INTAKE] Successfully inserted into database!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Referral Number: MKT-20251117-0003
🏥 Facility: Lakeside Behavioral Center
👤 Contact: David Lee
🤒 Patient: Mary Johnson
💊 Service: skilled-nursing
⏱️  Urgency: URGENT
🎯 Routing: CHHS (chhs)
👨‍💼 Marketer: Sarah Johnson
📱 Source: qr                    ← QR code detected!
🆔 Database ID: 456e4567-e89b-12d3-a456-426614174222
📅 Created: 11/17/2025, 10:40:15 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **Error Case**

If insertion fails, you'll see:

```
❌ [REFERRAL INTAKE] Error inserting marketing referral: {
  message: "null value in column 'referred_by' violates not-null constraint",
  details: "Failing row contains (...)",
  code: "23502"
}
```

---

## 📝 Log Fields Explained

| Field | Description | Example |
|-------|-------------|---------|
| 📋 Referral Number | Auto-generated unique ID | `MKT-20251117-0001` |
| 🏥 Facility | Healthcare facility name | `Mercy General Hospital` |
| 👤 Contact | Contact person name | `John Smith` |
| 🤒 Patient | Patient name | `Jane Doe` |
| 💊 Service | Type of service needed | `home-health`, `behavioral`, etc. |
| ⏱️ Urgency | Priority level | `ROUTINE`, `URGENT`, `STAT` |
| 🎯 Routing | Organization & destination | `CHHS (chhs)`, `Serenity (serenity)` |
| 👨‍💼 Marketer | Marketing representative | `Sarah Johnson` |
| 📱 Source | Referral source | `direct`, `qr`, `link`, `phone` |
| 🆔 Database ID | Supabase UUID | `123e4567-e89b-12d3-...` |
| 📅 Created | Timestamp of creation | `11/17/2025, 10:30:45 AM` |

---

## 🎯 Log Levels & Indicators

### ✅ Success Indicator
```
✅ [REFERRAL INTAKE] Successfully inserted into database!
```
- Green checkmark
- Clear success message
- Boxed with separator lines

### ❌ Error Indicator
```
❌ [REFERRAL INTAKE] Error inserting marketing referral:
```
- Red X mark
- Detailed error information
- Includes SQL error details

### 🚨 Urgent Alert
```
🚨 URGENT REFERRAL ALERT: MKT-20251117-0002
```
- Red sirens
- Double-boxed for attention
- Shows priority level
- Displays key patient info

### 📤 Webhook Notification
```
📤 Sending webhook notification...
```
- Shows when webhook is triggered
- Only appears if `WEBHOOK_URL` is configured

---

## 🔍 How to View Logs

### **Development Mode**

When running `npm run dev`:

```bash
npm run dev
```

Logs appear in the **same terminal** where dev server is running.

### **Production Mode**

When running `npm start`:

```bash
npm start
```

Logs appear in the production server terminal.

### **Docker/PM2**

If using Docker or PM2, check your log files:

```bash
# PM2
pm2 logs

# Docker
docker logs <container-name>
```

### **Vercel/Netlify**

Check the **Function Logs** in your deployment dashboard:
- Vercel: Project → Functions → View Logs
- Netlify: Site → Functions → View Logs

---

## 🧪 Testing the Logs

### **Test 1: Basic Referral**
1. Go to `/referral-intake`
2. Fill form with test data
3. Submit
4. **Check terminal** for success log

### **Test 2: STAT Referral**
1. Fill form
2. Set Urgency to **STAT**
3. Submit
4. **Check terminal** for urgent alert boxes

### **Test 3: QR Code Referral**
1. Visit: `/referral-intake?marketer=Test&source=qr`
2. Fill and submit
3. **Check terminal** - Source should show `qr`

### **Test 4: Multiple Routing**
Submit referrals with different services:
- `behavioral` → Should route to **Serenity**
- `home-health` → Should route to **CHHS**
- `other` → Should route to **M.A.S.E. Pro**

---

## 🎨 Log Format

The logs use:
- **Box Drawing Characters**: `━` for borders
- **Emojis**: For visual distinction
- **Colors**: (if terminal supports)
- **Structured Format**: Easy to read
- **Consistent Spacing**: Aligned fields

---

## 📊 What You Can Track

From these logs, you can easily monitor:

1. **Referral Volume**: Count success messages
2. **Source Distribution**: Track `direct` vs `qr` vs `link`
3. **Urgency Levels**: Count STAT/URGENT alerts
4. **Routing Distribution**: See which organizations get most referrals
5. **Marketer Performance**: Track referrals by marketer name
6. **Errors**: Identify submission issues
7. **Peak Times**: When most referrals come in

---

## 🔧 Customization

Want to add more fields to the logs?

Edit `app/api/marketing/referrals/route.ts` around **line 88-103**:

```javascript
console.log('📋 Referral Number:', newReferral.referral_number)
console.log('🏥 Facility:', newReferral.facility_name)
// Add your custom field here:
console.log('🆕 Custom Field:', newReferral.your_field)
```

Want to disable logs?

Comment out the entire console.log block:

```javascript
/*
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ [REFERRAL INTAKE] Successfully inserted into database!')
... (rest of the logs)
*/
```

---

## 📈 Example: Full Terminal Session

Here's what your terminal looks like with multiple submissions:

```bash
> npm run dev
  ▲ Next.js 15.2.4
  - Local:        http://localhost:3000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [REFERRAL INTAKE] Successfully inserted into database!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Referral Number: MKT-20251117-0001
🏥 Facility: Test Hospital
👤 Contact: John Doe
🤒 Patient: Jane Smith
💊 Service: home-health
⏱️  Urgency: ROUTINE
🎯 Routing: CHHS (chhs)
👨‍💼 Marketer: Sarah Johnson
📱 Source: direct
🆔 Database ID: 123e4567-e89b-12d3-a456-426614174000
📅 Created: 11/17/2025, 10:30:45 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [REFERRAL INTAKE] Successfully inserted into database!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Referral Number: MKT-20251117-0002
🏥 Facility: Behavioral Center
👤 Contact: Mike Davis
🤒 Patient: Robert Wilson
💊 Service: behavioral
⏱️  Urgency: STAT
🎯 Routing: Serenity (serenity)
👨‍💼 Marketer: Mike Davis
📱 Source: qr
🆔 Database ID: 789e4567-e89b-12d3-a456-426614174111
📅 Created: 11/17/2025, 10:35:22 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
🚨 URGENT REFERRAL ALERT: MKT-20251117-0002
🚨 Priority Level: STAT
🚨 Patient: Robert Wilson
🚨 Facility: Behavioral Center
🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
```

---

## ✅ Summary

**What You Get:**
- ✅ Detailed success logs for every referral
- ✅ Special alerts for urgent/stat referrals
- ✅ Source tracking (direct, qr, link)
- ✅ Routing information
- ✅ Database ID confirmation
- ✅ Timestamp for analytics
- ✅ Error logging with details
- ✅ Webhook notification status

**Perfect for:**
- 📊 Monitoring referral intake
- 🐛 Debugging submission issues
- 📈 Tracking marketing performance
- 🚨 Spotting urgent referrals
- 🔍 Audit trail

**Now you can see every referral that gets inserted into the database!** 🎉

