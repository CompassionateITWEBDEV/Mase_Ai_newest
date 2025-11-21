# Quick Reference: account_status Column

## Two Columns, Two Purposes

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  is_active (existing)      account_status (NEW)     │
│                                                      │
│  "In our practice?"        "Can they login?"        │
│                                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  BOOLEAN                   TEXT                     │
│  true / false              active / pending /       │
│                            inactive / suspended     │
│                                                      │
│  General status            Login access             │
│  Practice roster           Portal authentication    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## account_status Values

| Value | Meaning | Can Login? | Badge Color |
|-------|---------|------------|-------------|
| `'active'` | Account activated | ✅ Yes | Green |
| `'pending'` | Awaiting activation | ❌ No | Yellow |
| `'inactive'` | No credentials yet | ❌ No | Gray |
| `'suspended'` | Temporarily blocked | ❌ No | Red |

---

## Quick Examples

### Example 1: New Self-Registration
```
Doctor signs up:
→ is_active: true
→ account_status: 'pending'
→ Badge: 🕐 Pending (Yellow)
→ Can login: ❌ No (awaiting admin)
```

### Example 2: Admin Activates
```
Admin clicks "Activate":
→ account_status: 'pending' → 'active'
→ Badge: ✅ Active (Green)
→ Can login: ✅ Yes
```

### Example 3: Physician Leaves
```
Physician leaves practice:
→ is_active: true → false
→ account_status: stays 'active'
→ Still can login ⚠️

Admin deactivates account:
→ account_status: 'active' → 'inactive'
→ Can login: ❌ No
```

---

## SQL Migration

```sql
-- Run this to add the column
\i scripts/122-add-account-status-column.sql
```

---

## Common Queries

```sql
-- Who can login?
SELECT * FROM physicians WHERE account_status = 'active';

-- Who is awaiting activation?
SELECT * FROM physicians WHERE account_status = 'pending';

-- Who is in practice?
SELECT * FROM physicians WHERE is_active = true;

-- In practice but can't login?
SELECT * FROM physicians 
WHERE is_active = true 
AND account_status != 'active';
```

---

## Remember

- `is_active` = Practice membership status
- `account_status` = Portal login access
- **They are independent!**
- Use `account_status` for all login checks
- Use `is_active` for roster management

---

## Files Changed

✅ SQL: `scripts/122-add-account-status-column.sql`  
✅ API: Activation, Login, Registration, Add-Credentials  
✅ UI: `app/physicians/page.tsx`  

**Ready to use!** 🚀

