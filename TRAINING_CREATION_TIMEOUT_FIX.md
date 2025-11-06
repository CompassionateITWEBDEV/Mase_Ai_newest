# ✅ Training Creation Timeout Fix

## 🎯 Problem

Training creation was timing out with error:
```
Failed to create training: canceling statement due to statement timeout
Error code: 57014
```

**Root Cause:**
- Large video files stored as base64 in database
- Database insert operation exceeds Supabase timeout (usually 20-30 seconds)
- Large JSONB data in modules array causes slow inserts

---

## ✅ Solutions Implemented

### **1. Better Error Handling** ✅

**File:** `app/api/in-service/trainings/route.ts`

#### **A. Timeout Detection**

**Added:**
- ✅ Detects timeout errors (code 57014)
- ✅ Checks for large video files before insert
- ✅ Provides helpful error messages

**Code:**
```typescript
// Check for very large video files that might cause timeout
let hasLargeVideos = false
if (Array.isArray(dbData.modules)) {
  for (const module of dbData.modules) {
    if (module.fileUrl && module.fileUrl.startsWith('data:video/')) {
      const base64Size = module.fileUrl.length
      if (base64Size > 50 * 1024 * 1024) { // > 50MB base64
        hasLargeVideos = true
        console.warn(`⚠️ Large video file detected`)
      }
    }
  }
}
```

---

#### **B. Specific Timeout Error Response**

**Before:**
```typescript
return NextResponse.json({ 
  error: "Failed to create training: " + error.message,
}, { status: 500 })
```

**After:**
```typescript
if (error.code === "57014" || error.message?.includes("timeout")) {
  const errorMessage = hasLargeVideos
    ? "Training creation timed out. Large video files (>50MB) may cause timeouts. Please try:\n1. Compress videos to <50MB\n2. Use shorter videos\n3. Split into multiple smaller modules\n4. Consider using Supabase Storage for large videos"
    : "Training creation timed out. The database operation took too long. Please try:\n1. Reduce the number of modules\n2. Use smaller file sizes\n3. Try again in a moment"
  
  return NextResponse.json({ 
    error: errorMessage,
    code: error.code,
    timeout: true,
  }, { status: 504 }) // 504 Gateway Timeout
}
```

---

### **2. Frontend Warning for Large Videos** ✅

**Files:**
- `app/in-service/page.tsx` (Line ~2932-2953)
- `app/continuing-education/page.tsx` (Line ~2529-2550)

#### **A. File Selection Warning**

**Added:**
- ✅ Checks file size when video is selected
- ✅ Warns if video > 50MB
- ✅ Gives recommendations
- ✅ Allows user to cancel or proceed

**Code:**
```typescript
onChange={(e) => {
  const file = e.target.files?.[0]
  if (file) {
    const isVideo = file.type.startsWith('video/') || 
                  ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'].includes('.' + file.name.split('.').pop()?.toLowerCase())
    const fileSizeMB = file.size / (1024 * 1024)
    
    if (isVideo && fileSizeMB > 50) {
      const proceed = confirm(
        `⚠️ Large Video File Detected\n\n` +
        `File: ${file.name}\n` +
        `Size: ${fileSizeMB.toFixed(2)}MB\n\n` +
        `Videos larger than 50MB may cause timeout errors.\n\n` +
        `Recommendations:\n` +
        `• Compress the video to <50MB\n` +
        `• Use a shorter video\n` +
        `• Split into multiple smaller modules\n\n` +
        `Do you want to continue?`
      )
      if (!proceed) {
        e.target.value = '' // Clear the input
        return
      }
    }
    // ... continue with file selection
  }
}}
```

---

### **3. Improved Error Display** ✅

**File:** `app/in-service/page.tsx` (Line ~2567-2586)

#### **A. Timeout Error Handling**

**Before:**
```typescript
alert("Failed to create training: " + errorMsg)
```

**After:**
```typescript
const isTimeout = data.timeout || data.code === "57014" || errorMsg.includes("timeout")

if (isTimeout) {
  const timeoutMessage = errorMsg.includes("\n") 
    ? errorMsg 
    : `Training creation timed out. This usually happens with large video files (>50MB).\n\nPlease try:\n1. Compress videos to <50MB\n2. Use shorter videos\n3. Split into multiple smaller modules\n4. Try again in a moment`
  
  alert(`⏱️ Timeout Error\n\n${timeoutMessage}`)
}
```

---

## 📊 Problem Analysis

### **Why Timeouts Happen:**

1. **Large Base64 Data:**
   - Video file: 50MB
   - Base64 encoding: ~67MB (33% larger)
   - Stored in JSONB column
   - Database insert takes >30 seconds

2. **Database Limits:**
   - Supabase statement timeout: 20-30 seconds
   - Large JSONB inserts are slow
   - Multiple modules = more data

3. **Network Transfer:**
   - Large files take time to upload
   - Base64 conversion adds overhead
   - Database write is slow

---

## 🔧 Technical Details

### **File Size Limits:**

| File Type | Upload Limit | Base64 Size | Risk Level |
|-----------|--------------|-------------|------------|
| Documents | 500MB | ~667MB | Low |
| Videos <50MB | 500MB | ~67MB | Low |
| Videos >50MB | 500MB | >67MB | **High (Timeout Risk)** |

### **Timeout Detection:**

**Error Code:** `57014` (PostgreSQL statement timeout)

**Error Message:** `"canceling statement due to statement timeout"`

**Detection:**
```typescript
if (error.code === "57014" || 
    error.message?.includes("timeout") || 
    error.message?.includes("canceling statement")) {
  // Handle timeout
}
```

---

## 🎨 User Experience

### **Before:**
```
User uploads large video → Creates training → Timeout error → Confusing message ❌
```

### **After:**
```
User selects large video (>50MB)
  ↓
⚠️ Warning dialog appears
  ↓
User can cancel or proceed
  ↓
If timeout occurs:
  ↓
Clear error message with recommendations ✅
```

---

## 🧪 Testing

### **Test 1: Large Video Warning**

1. Go to In-Service → Create Training
2. Add a module
3. Select a video file > 50MB
4. **Expected:**
   - Warning dialog appears
   - Shows file name and size
   - Provides recommendations
   - Can cancel or proceed

### **Test 2: Timeout Error Handling**

1. Upload a very large video (>100MB)
2. Try to create training
3. **Expected:**
   - Timeout error occurs
   - Clear error message shown
   - Recommendations provided
   - Helpful hints displayed

### **Test 3: Small Video Success**

1. Upload a video < 50MB
2. Create training
3. **Expected:**
   - No warning
   - Training creates successfully
   - Video plays correctly

---

## 💡 Recommendations

### **For Users:**

1. **Compress Videos:**
   - Use video compression tools
   - Target: <50MB per video
   - Recommended: MP4 with H.264 codec

2. **Split Large Videos:**
   - Break into multiple modules
   - Each module <50MB
   - Better for loading anyway

3. **Use Shorter Videos:**
   - Keep videos concise
   - Focus on key content
   - Better user experience

### **For Developers (Future Enhancement):**

1. **Use Supabase Storage:**
   - Store videos in storage buckets
   - Store only URL in database
   - Much faster inserts

2. **Implement Chunked Upload:**
   - Upload in chunks
   - Progress tracking
   - Resume capability

3. **Add Video Compression:**
   - Client-side compression
   - Automatic optimization
   - Better file sizes

---

## ✅ Summary

**Problem:**
- Training creation timing out with large videos
- Error code 57014 (statement timeout)
- Confusing error messages

**Solution:**
1. ✅ Better timeout error detection
2. ✅ Helpful error messages with recommendations
3. ✅ Warning dialog for large videos (>50MB)
4. ✅ Clear guidance on how to fix

**Result:**
- ✅ Users warned before uploading large videos
- ✅ Clear error messages when timeout occurs
- ✅ Actionable recommendations provided
- ✅ Better user experience

---

## 🚀 Future Improvements

### **Option 1: Supabase Storage Integration**

**Benefits:**
- Faster inserts (no base64 in database)
- Better performance
- Scalable

**Implementation:**
```typescript
// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('training-videos')
  .upload(`videos/${timestamp}-${file.name}`, file)

// Store only URL in database
module.fileUrl = data.path
```

### **Option 2: Increase Database Timeout**

**SQL:**
```sql
-- Increase statement timeout for training creation
SET statement_timeout = '60s';
```

**Note:** Requires database admin access

---

**Karon, ang timeout error na-handle na properly!** 🚀  
(Now, timeout errors are handled properly!)

**Users will be warned about large videos and get helpful error messages!** ✅

**Last Updated:** November 6, 2025

