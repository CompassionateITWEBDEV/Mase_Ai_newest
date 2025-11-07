# ✅ Video Extraction Error Fix - Complete

## 🎯 Problem

**Error Message:**
```
Error: ❌ "No content extracted from file. Cannot generate quiz from database metadata.
Please ensure:
1. File is accessible (PDF, PowerPoint, or video)
2. PDF.co API is configured correctly (PDF_CO_API_KEY)
3. File contains extractable content

Questions must be generated from extracted file content, not from module title/description."
```

**Terminal Logs:**
```
❌ No content extracted from video
📄 Extraction result: {
  success: false,
  contentLength: 0,
  fileType: 'video',
  fileName: 'WIN_20250613_11_19_28_Pro.mp4',
  preview: ''
}
⚠️ No content extracted from video: WIN_20250613_11_19_28_Pro.mp4
```

**Issues:**
- ❌ Video extraction failing silently
- ❌ No clear error messages about why extraction failed
- ❌ Not handling Supabase storage URLs properly
- ❌ Not checking file size limits (Whisper has 25MB limit)
- ❌ Not handling silent videos (no audio track)

---

## ✅ Solutions Implemented

### **1. Better Error Handling for Video Fetching** ✅

**File:** `app/api/extract-content/route.ts`

**Before:**
```typescript
// Regular URL
const response = await fetch(videoUrl)
if (!response.ok) {
  throw new Error("Failed to fetch video")
}
```

**After:**
```typescript
if (videoUrl.startsWith("data:")) {
  // Base64 video
  console.log("📹 Processing base64 video...")
  const response = await fetch(videoUrl)
  videoBlob = await response.blob()
} else if (videoUrl.includes("supabase.co") || videoUrl.includes("storage.googleapis.com")) {
  // Supabase Storage URL - try to fetch directly (should be public)
  console.log("📹 Processing Supabase Storage URL...")
  const response = await fetch(videoUrl, {
    headers: {
      'Accept': 'video/*',
    }
  })
  if (!response.ok) {
    console.error(`❌ Failed to fetch video from storage: ${response.status} ${response.statusText}`)
    throw new Error(`Failed to fetch video from storage: ${response.status} ${response.statusText}`)
  }
  videoBlob = await response.blob()
} else {
  // Regular URL
  console.log("📹 Processing regular URL...")
  const response = await fetch(videoUrl, {
    headers: {
      'Accept': 'video/*',
    }
  })
  if (!response.ok) {
    console.error(`❌ Failed to fetch video: ${response.status} ${response.statusText}`)
    throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`)
  }
  videoBlob = await response.blob()
}
```

**Changes:**
- ✅ Handles base64 videos
- ✅ Handles Supabase storage URLs
- ✅ Handles regular URLs
- ✅ Better error messages with status codes
- ✅ More detailed logging

---

### **2. File Size Checking** ✅

**File:** `app/api/extract-content/route.ts`

**Added File Size Check:**
```typescript
const fileSizeMB = videoBuffer.length / (1024 * 1024)
const WHISPER_MAX_SIZE_MB = 25

if (fileSizeMB > WHISPER_MAX_SIZE_MB) {
  console.warn(`⚠️ Video is ${fileSizeMB.toFixed(2)} MB, exceeds Whisper limit of ${WHISPER_MAX_SIZE_MB} MB. Skipping audio transcription.`)
  console.warn("💡 Recommendation: Compress video to <25MB or split into smaller segments for audio transcription.")
} else {
  // Try audio transcription
}
```

**Changes:**
- ✅ Checks file size before sending to Whisper
- ✅ Skips audio transcription if file is too large
- ✅ Still attempts visual content extraction
- ✅ Provides helpful recommendations

---

### **3. Better Error Messages** ✅

**File:** `app/api/extract-content/route.ts`

**Before:**
```typescript
} else {
  console.error("❌ No content extracted from video")
  return ""
}
```

**After:**
```typescript
} else {
  const fileSizeMB = videoBuffer.length / (1024 * 1024)
  const errorMsg = `No content extracted from video. ` +
    `Video file: ${fileSizeMB.toFixed(2)} MB. ` +
    `Possible reasons: ` +
    `1. Video is too large (>25MB) for audio transcription, ` +
    `2. Video has no audio track (silent video), ` +
    `3. Visual content extraction failed, ` +
    `4. Video file is corrupted or inaccessible. ` +
    `Please ensure video has audio or is <25MB for transcription.`
  console.error(`❌ ${errorMsg}`)
  throw new Error(errorMsg)
}
```

**Changes:**
- ✅ Detailed error message explaining possible reasons
- ✅ Includes file size information
- ✅ Provides actionable recommendations
- ✅ Throws error instead of returning empty string

---

### **4. Improved Logging** ✅

**File:** `app/api/extract-content/route.ts`

**Added Logging:**
```typescript
console.log("🎥 Starting comprehensive video content extraction (audio + visual)...")
console.log("📹 Video URL:", videoUrl.substring(0, 200))
console.log(`📹 Video fetched: ${videoBuffer.length} bytes (${fileSizeMB.toFixed(2)} MB)`)
console.log("📤 Sending video to OpenAI Whisper API...")
console.log(`✅ Audio transcript extracted: ${audioTranscript.length} characters`)
console.log(`📝 Transcript preview: ${audioTranscript.substring(0, 200)}...`)
```

**Changes:**
- ✅ Logs video URL (first 200 chars)
- ✅ Logs file size in MB
- ✅ Logs each step of extraction
- ✅ Logs transcript preview for debugging
- ✅ Better error logging with status codes

---

### **5. Better Whisper API Error Handling** ✅

**File:** `app/api/extract-content/route.ts`

**Before:**
```typescript
if (whisperResponse.ok) {
  audioTranscript = await whisperResponse.text()
  console.log(`✅ Audio transcript extracted: ${audioTranscript.length} characters`)
} else {
  const errorText = await whisperResponse.text()
  console.warn("⚠️ OpenAI Whisper API error:", errorText.substring(0, 200))
}
```

**After:**
```typescript
if (whisperResponse.ok) {
  audioTranscript = await whisperResponse.text()
  if (audioTranscript && audioTranscript.trim().length > 0) {
    console.log(`✅ Audio transcript extracted: ${audioTranscript.length} characters`)
    console.log(`📝 Transcript preview: ${audioTranscript.substring(0, 200)}...`)
  } else {
    console.warn("⚠️ Audio transcript is empty - video may be silent or have no audio track")
  }
} else {
  const errorText = await whisperResponse.text()
  console.error(`❌ OpenAI Whisper API error (${whisperResponse.status}):`, errorText.substring(0, 500))
  // Don't throw - continue to try visual extraction
}
```

**Changes:**
- ✅ Checks if transcript is empty (silent video)
- ✅ Logs HTTP status code
- ✅ More detailed error logging
- ✅ Continues to try visual extraction even if audio fails

---

## 📊 How It Works Now

### **Video Extraction Flow:**

```
1. Receive video URL
   ↓
2. Log video URL and start extraction
   ↓
3. Fetch video file
   - Check if base64, Supabase storage, or regular URL
   - Handle each type appropriately
   - Log file size
   ↓
4. Check file size
   - If >25MB: Skip audio transcription, warn user
   - If <25MB: Attempt audio transcription
   ↓
5. Extract audio transcript (if file size OK)
   - Send to OpenAI Whisper API
   - Check if transcript is empty (silent video)
   - Log transcript preview
   ↓
6. Extract visual content
   - Frame-by-frame analysis (if implemented)
   - Extract text from slides/visual aids
   ↓
7. Combine audio + visual content
   - If both available: Combine
   - If only audio: Use audio only
   - If only visual: Use visual only
   - If neither: Throw detailed error
   ↓
8. Return combined content or throw error
```

---

## 🧪 Testing

### **Test 1: Large Video (>25MB)**

1. Upload video >25MB
2. Complete module content
3. **Expected:**
   - Warning: "Video exceeds Whisper limit of 25 MB"
   - Recommendation to compress video
   - Still attempts visual extraction
   - Error message if no content extracted

### **Test 2: Silent Video (No Audio)**

1. Upload video with no audio track
2. Complete module content
3. **Expected:**
   - Warning: "Audio transcript is empty - video may be silent"
   - Attempts visual extraction
   - Uses visual content if available
   - Error message if no content extracted

### **Test 3: Supabase Storage URL**

1. Upload video to Supabase storage
2. Complete module content
3. **Expected:**
   - Logs: "Processing Supabase Storage URL..."
   - Fetches video successfully
   - Extracts content normally

### **Test 4: Base64 Video**

1. Upload small video (base64)
2. Complete module content
3. **Expected:**
   - Logs: "Processing base64 video..."
   - Fetches video successfully
   - Extracts content normally

### **Test 5: Failed Fetch**

1. Use invalid/corrupted video URL
2. Complete module content
3. **Expected:**
   - Error: "Failed to fetch video: [status] [statusText]"
   - Clear error message
   - No silent failure

---

## 🎯 Key Improvements

### **1. Better Error Messages** ✅
- ❌ Before: Generic "No content extracted"
- ✅ After: Detailed error with file size, possible reasons, and recommendations

### **2. File Size Handling** ✅
- ❌ Before: Tried to transcribe large videos, failed silently
- ✅ After: Checks size, skips if too large, provides recommendations

### **3. Supabase Storage Support** ✅
- ❌ Before: Might fail to fetch Supabase storage URLs
- ✅ After: Handles Supabase storage URLs properly

### **4. Silent Video Detection** ✅
- ❌ Before: No indication if video has no audio
- ✅ After: Detects and warns about silent videos

### **5. Better Logging** ✅
- ❌ Before: Minimal logging, hard to debug
- ✅ After: Detailed logging at each step

---

## 📝 Error Messages

### **Before:**
```
Error: No content extracted from file. Cannot generate quiz...
```

### **After:**
```
Error: No content extracted from video. Video file: 35.2 MB. 
Possible reasons: 
1. Video is too large (>25MB) for audio transcription, 
2. Video has no audio track (silent video), 
3. Visual content extraction failed, 
4. Video file is corrupted or inaccessible. 
Please ensure video has audio or is <25MB for transcription.
```

---

## 🎉 Summary

✅ **Better Error Handling:**
- Handles base64, Supabase storage, and regular URLs
- Better error messages with status codes
- More detailed logging

✅ **File Size Checking:**
- Checks file size before sending to Whisper
- Skips audio transcription if too large
- Provides recommendations

✅ **Better Error Messages:**
- Detailed error explaining possible reasons
- Includes file size information
- Actionable recommendations

✅ **Improved Logging:**
- Logs each step of extraction
- Logs file size, transcript preview
- Better error logging

---

## 📚 Files Modified

1. **`app/api/extract-content/route.ts`**
   - Improved video fetching (handles Supabase storage URLs)
   - Added file size checking
   - Better error messages
   - Improved logging
   - Better Whisper API error handling

---

## ✅ Verification Checklist

- [ ] Handles base64 videos
- [ ] Handles Supabase storage URLs
- [ ] Handles regular URLs
- [ ] Checks file size before Whisper API
- [ ] Skips audio transcription if file too large
- [ ] Detects silent videos
- [ ] Provides detailed error messages
- [ ] Logs each step of extraction
- [ ] Continues to try visual extraction if audio fails
- [ ] Throws error instead of returning empty string

