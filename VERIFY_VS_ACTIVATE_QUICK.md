# Quick Reference: Verify vs Activate

## Two Different Things!

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🛡️  VERIFY CREDENTIALS          ✅  ACTIVATE ACCOUNT          │
│                                                                 │
│  "Are they a real doctor?"       "Can they login?"             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Checks:                         Checks:                       │
│  • NPI validity                  • Has email? ✓                │
│  • Medical license               • Has password? ✓             │
│  • Board certifications          • Ready to grant access       │
│  • DEA registration                                            │
│                                                                 │
│  Updates:                        Updates:                      │
│  verification_status = 'verified' is_active = true             │
│                                                                 │
│  Endpoint:                       Endpoint:                     │
│  /api/physicians/[id]/verify     /api/physicians/[id]/activate │
│                                                                 │
│  Does NOT enable login ❌        Enables login ✅              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflow

```
Step 1: Add Doctor
   ↓
Step 2: Verify Credentials 🛡️
   ↓  (checks licenses, NPI, etc.)
   ↓  verification_status = 'verified'
   ↓
Step 3: Activate Account ✅
   ↓  (enables login access)
   ↓  is_active = true
   ↓
Step 4: Doctor Can Login! 🎉
```

---

## The Smart Activation Button

When you click **Activate (✅)**:

```javascript
if (doctor.email exists) {
  → Activate immediately ✅
  → Doctor can login
} else {
  → Show modal 📝
  → Admin adds email + password
  → Then activate ✅
}
```

---

## Quick Comparison

| Action | Verify 🛡️ | Activate ✅ |
|--------|-----------|------------|
| **What?** | Checks credentials | Enables login |
| **Icon** | Shield (Blue) | CheckCircle (Green) |
| **Updates** | `verification_status` | `is_active` |
| **Needs email?** | No | Yes (or shows modal) |
| **Enables login?** | No | Yes |
| **Endpoint** | `/verify` | `/activate` |
| **When?** | After adding doctor | After verifying |

---

## Remember

- **Verify FIRST** → Check if legitimate ✅
- **Activate SECOND** → Enable login ✅
- **Never skip verification!** ⚠️

---

## Error You Might See

```
❌ "Cannot activate account without email and password"
```

**Solution**: The activate button will automatically show a modal to add credentials.

---

## Database Fields

```typescript
{
  // Verification
  verification_status: 'verified' | 'pending' | 'not_verified'
  
  // Activation
  is_active: true | false
  
  // Login Credentials
  email: string
  password_hash: string
}
```

All three are **separate** and **independent**!

