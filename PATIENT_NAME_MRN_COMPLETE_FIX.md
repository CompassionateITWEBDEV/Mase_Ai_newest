# Patient Name and MRN Extraction - Complete Fix

## Problem
Patient Name and MRN were showing as "[PATIENT_NAME]" and "[ID]" placeholders instead of actual patient data from the PDF.

## Root Causes Identified

### 1. **Anonymization Before Extraction** (Primary Issue)
- **File**: `lib/oasis-ai-analyzer.ts` lines 130-136
- **Problem**: Patient names and MRNs were being anonymized BEFORE sending to AI
- **Result**: AI could only see placeholders, so it extracted "[PATIENT_NAME]" and "[ID]"

### 2. **PatientInfo Not Stored in extracted_data**
- **File**: `app/api/oasis-upload/process/route.ts` line 226
- **Problem**: `patientInfo` was at top level, not included in `extracted_data` field
- **Result**: Frontend couldn't find patient info in `extracted_data.patientInfo`

## Complete Solution

### Fix 1: Extract Real Patient Data BEFORE Anonymization
**File**: `lib/oasis-ai-analyzer.ts`

Added extraction of real patient info before anonymizing:

```typescript
// Extract patient name (various formats)
const patientNameMatch = 
  extractedText.match(/Patient Name[:\s]*([A-Z][a-z]+(?:,?\s+[A-Z][a-z]+)+)/i) ||
  extractedText.match(/\(M0040\)[^:]*First Name[:\s]*([A-Z][a-z]+)[^:]*Last Name[:\s]*([A-Z][a-z]+)/i) ||
  extractedText.match(/Name[:\s]*([A-Z][a-z]+,\s*[A-Z][a-z]+)/i) ||
  extractedText.match(/\b([A-Z][a-z]+,\s*[A-Z][a-z]+)\b/)

let realPatientName = null
if (patientNameMatch) {
  if (patientNameMatch[2]) {
    // First name and last name captured separately
    realPatientName = `${patientNameMatch[1]} ${patientNameMatch[2]}`
  } else {
    realPatientName = patientNameMatch[1]
  }
}

// Extract MRN/Patient ID
const mrnMatch = 
  extractedText.match(/MRN[:\s]*([A-Z0-9]+)/i) ||
  extractedText.match(/\(M0020\)[^:]*ID Number[:\s]*([A-Z0-9]+)/i) ||
  extractedText.match(/Patient ID[:\s]*([A-Z0-9]+)/i) ||
  extractedText.match(/Medical Record Number[:\s]*([A-Z0-9]+)/i)
const realMRN = mrnMatch ? mrnMatch[1] : null
```

### Fix 2: Override AI Response with Real Data
**File**: `lib/oasis-ai-analyzer.ts`

After AI analysis, override placeholders with real extracted data:

```typescript
// Override patient info with REAL extracted data (not placeholders)
if (validatedAnalysis.patientInfo) {
  if (realPatientName && validatedAnalysis.patientInfo.name === '[PATIENT_NAME]') {
    console.log('[OASIS] ✅ Overriding patient name with real extracted value:', realPatientName)
    validatedAnalysis.patientInfo.name = realPatientName
  }
  if (realMRN && validatedAnalysis.patientInfo.mrn === '[ID]') {
    console.log('[OASIS] ✅ Overriding MRN with real extracted value:', realMRN)
    validatedAnalysis.patientInfo.mrn = realMRN
  }
  if (realVisitDate && validatedAnalysis.patientInfo.visitDate) {
    validatedAnalysis.patientInfo.visitDate = realVisitDate
  }
}
```

### Fix 3: Store PatientInfo in extracted_data
**File**: `app/api/oasis-upload/process/route.ts`

Ensure `patientInfo` is included in `extracted_data`:

```typescript
extracted_data: {
  ...(analysis.extractedData || {}),
  // Ensure patientInfo is included in extracted_data
  patientInfo: analysis.patientInfo || null
},
```

## How It Works Now

### Data Flow

```
1. PDF Upload
   ↓
2. Extract Text from PDF
   ↓
3. REGEX EXTRACTION (NEW!)
   - Extract real patient name: "John Doe"
   - Extract real MRN: "MRN12345"
   - Extract real visit date: "06/21/2025"
   ↓
4. Anonymize Text for AI
   - Replace "John Doe" → "[PATIENT_NAME]"
   - Replace "MRN12345" → "[ID]"
   ↓
5. Send to AI (sees anonymized text)
   - AI extracts: name: "[PATIENT_NAME]", mrn: "[ID]"
   ↓
6. OVERRIDE AI RESPONSE (NEW!)
   - Replace "[PATIENT_NAME]" → "John Doe"
   - Replace "[ID]" → "MRN12345"
   ↓
7. Store in Database
   - patient_name: "John Doe"
   - mrn: "MRN12345"
   - extracted_data.patientInfo: { name: "John Doe", mrn: "MRN12345" }
   ↓
8. Display in UI
   - Shows: "John Doe" and "MRN12345" ✅
```

## Regex Patterns Used

### Patient Name Patterns
1. `Patient Name: John Doe`
2. `(M0040) First Name: John ... Last Name: Doe`
3. `Name: Doe, John`
4. `Doe, John` (standalone)

### MRN Patterns
1. `MRN: ABC123`
2. `(M0020) ID Number: ABC123`
3. `Patient ID: ABC123`
4. `Medical Record Number: ABC123`

## Console Logs to Verify

After uploading a new OASIS document, check terminal for:

```
[OASIS] 📋 Extracted REAL patient info BEFORE anonymization:
[OASIS] - Patient Name: John Doe
[OASIS] - MRN: MRN12345
[OASIS] - Visit Date: 06/21/2025
[OASIS] - DOB: 01/15/1950
...
[OASIS] ✅ Overriding patient name with real extracted value: John Doe
[OASIS] ✅ Overriding MRN with real extracted value: MRN12345
[OASIS] 📋 Final patient info after override: { name: 'John Doe', mrn: 'MRN12345', ... }
```

## Testing

### For Existing Records
The previous fixes (checking multiple sources, using extracted_data) will still work as fallbacks.

### For New Uploads
1. Upload a new OASIS PDF
2. Check terminal logs for extracted patient info
3. View the optimization report
4. Verify patient name and MRN show real data (not placeholders)

## Files Modified

1. ✅ `lib/oasis-ai-analyzer.ts`
   - Added regex extraction for patient name and MRN
   - Added override logic after AI analysis
   - Added console logging

2. ✅ `app/api/oasis-upload/process/route.ts`
   - Modified `extracted_data` to include `patientInfo`

3. ✅ `app/api/oasis-qa/optimization/[id]/route.ts` (previous fix)
   - Added JSON parsing for diagnosis codes
   - Added extraction of patientInfo from extracted_data

4. ✅ `app/oasis-qa/optimization/[id]/page.tsx` (previous fix)
   - Added multiple source checking for patient data
   - Added placeholder detection

## Expected Result

After uploading a NEW OASIS document:
- ✅ Patient Name: Real name from PDF (e.g., "John Doe")
- ✅ MRN: Real MRN from PDF (e.g., "MRN12345")
- ✅ Visit Date: Real date from PDF
- ✅ All diagnosis codes displayed correctly
- ✅ Payor and Clinician information displayed

## Fallback Strategy

If regex extraction fails:
1. Try to get from AI response (if not placeholder)
2. Try to get from database fields
3. Try to get from extracted_data.patientInfo
4. Show "Patient Name Not Available" as last resort

This ensures maximum reliability!

