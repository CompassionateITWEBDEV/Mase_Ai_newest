# Doctor Authentication - Import Error Fix

## 🐛 Error Encountered

```
Attempted import error: 'createServiceClient' is not exported from '@/lib/supabase/server'
TypeError: createServiceClient is not a function
```

## ✅ Root Cause

The project has **two different Supabase client files**:

1. **`lib/supabase/server.ts`** - For regular server-side operations (respects RLS)
   - Exports: `createClient()` and `createAdminClient()`
   
2. **`lib/supabase/service.ts`** - For service role operations (bypasses RLS)
   - Exports: `createServiceClient()`

The doctor authentication APIs were incorrectly importing from `server.ts` instead of `service.ts`.

---

## 🔧 Fix Applied

### Files Updated:

#### 1. `app/api/auth/register-doctor/route.ts`
**Before:**
```typescript
import { createServiceClient } from '@/lib/supabase/server'  // ❌ Wrong file
const supabase = await createClient()  // ❌ Wrong function
```

**After:**
```typescript
import { createServiceClient } from '@/lib/supabase/service'  // ✅ Correct file
const supabase = createServiceClient()  // ✅ Correct function (no await)
```

#### 2. `app/api/telehealth/consultation/route.ts`
**Before:**
```typescript
import { createServiceClient } from '@/lib/supabase/server'  // ❌ Wrong file
```

**After:**
```typescript
import { createServiceClient } from '@/lib/supabase/service'  // ✅ Correct file
```

#### 3. `app/api/telehealth/create-session/route.ts`
**Before:**
```typescript
import { createServiceClient } from '@/lib/supabase/server'  // ❌ Wrong file
```

**After:**
```typescript
import { createServiceClient } from '@/lib/supabase/service'  // ✅ Correct file
```

---

## 📚 Understanding the Two Client Types

### When to use `lib/supabase/server.ts`:
- Regular authenticated operations
- User-specific queries
- Respects Row Level Security (RLS) policies
- Example: Fetching user's own data

```typescript
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()  // Note: await needed
  const { data } = await supabase.from('users').select('*')
  return NextResponse.json(data)
}
```

### When to use `lib/supabase/service.ts`:
- System-level operations
- Admin operations
- Bypasses Row Level Security (RLS)
- Example: Creating users, system inserts

```typescript
import { createServiceClient } from '@/lib/supabase/service'

export async function POST() {
  const supabase = createServiceClient()  // Note: no await
  const { data } = await supabase.from('physicians').insert({ ... })
  return NextResponse.json(data)
}
```

---

## ✅ Verification

After the fix:
- ✅ No linter errors
- ✅ Doctor registration API should work
- ✅ Telehealth consultation API should work
- ✅ Video session creation API should work

---

## 🧪 Testing

Try registering a doctor again:
1. Navigate to `/doctor-portal`
2. Click "Sign Up" tab
3. Fill out the form
4. Submit
5. Should see success message (no more import errors)

---

## 📝 Key Takeaways

1. **Always check which Supabase client to use:**
   - Need RLS? → Use `server.ts`
   - Need to bypass RLS? → Use `service.ts`

2. **Different function signatures:**
   - `createClient()` → Requires `await`
   - `createServiceClient()` → No `await` needed

3. **Security consideration:**
   - Service client bypasses RLS, so only use in secure API routes
   - Never expose service client to client-side code

---

## ✨ Status

**Fixed:** November 21, 2025
**Status:** ✅ Resolved
**Files Modified:** 3
**Linter Errors:** 0

