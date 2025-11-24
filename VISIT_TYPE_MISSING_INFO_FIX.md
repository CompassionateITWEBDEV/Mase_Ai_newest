# Visit Type Missing Information Fix

## Problem
Visit Type was showing in the "Missing Required Information" section even though it had data extracted from the PDF. The missing information detection was not accurate and was based on hardcoded values from the AI rather than actual extracted data.

## Root Causes

### 1. AI's Missing Information Was Being Merged
The backend validation was merging the AI's own `missingInformation` array with the backend-detected missing fields. The AI might have been incorrectly flagging Visit Type as missing even when it was extracted.

**Location**: `lib/oasis-ai-analyzer.ts` line 280-281
```typescript
// OLD CODE - Merging AI's potentially inaccurate missing info
const existingMissing = analysis.missingInformation || []
const allMissing = [...existingMissing, ...missingFields]
```

### 2. No Backend Validation for Visit Type
The `detectMissingRequiredFields()` function was only checking:
- Primary Diagnosis
- Secondary Diagnoses
- Functional Status
- Patient Name
- MRN

It was NOT checking:
- Visit Type
- Visit Date
- Payor
- Clinician

### 3. Fallback Values Masked Missing Data
The backend was using fallback values like "SOC" for visit type, which made it impossible to distinguish between:
- AI actually found "SOC" in the document
- AI didn't find anything and we used "SOC" as a fallback

**Location**: `lib/oasis-ai-analyzer.ts` line 786
```typescript
// OLD CODE - Using fallback that masks missing data
visitType: analysis.patientInfo?.visitType || "SOC",
```

## Solutions Implemented

### 1. Stop Merging AI's Missing Information
Changed the backend validation to ONLY use our own detection logic, not the AI's potentially inaccurate `missingInformation` array.

**File**: `lib/oasis-ai-analyzer.ts`
```typescript
// NEW CODE - Only use backend validation
console.log("[OASIS] ℹ️ Using backend validation only (ignoring AI's missingInformation)")
const allMissing = missingFields
```

### 2. Added Backend Validation for All Patient Info Fields
Added comprehensive validation for:
- Visit Type
- Visit Date
- Payor
- Clinician

**File**: `lib/oasis-ai-analyzer.ts`
```typescript
// Check Visit Type
if (!analysis.patientInfo?.visitType || 
    analysis.patientInfo.visitType === "Not visible") {
  console.log("[OASIS] ❌ Missing: Visit Type")
  missingFields.push({
    field: "Visit Type",
    location: "Section M0, Page 1",
    impact: "Impact on compliance/billing/care",
    recommendation: "Ensure visit type is documented clearly.",
    required: true,
  })
} else {
  console.log(`[OASIS] ✅ Visit Type found: ${analysis.patientInfo.visitType}`)
}

// Similar checks for Visit Date, Payor, and Clinician
```

### 3. Use "Not visible" Instead of Fallback Values
Changed the backend to preserve "Not visible" when the AI can't find a field, instead of using fallback values that mask missing data.

**File**: `lib/oasis-ai-analyzer.ts`
```typescript
// NEW CODE - Keep "Not visible" to accurately detect missing fields
visitType: analysis.patientInfo?.visitType || "Not visible",
payor: analysis.patientInfo?.payor || "Not visible",
visitDate: analysis.patientInfo?.visitDate || "Not visible",
clinician: analysis.patientInfo?.clinician || "Not visible",
```

The frontend already handles "Not visible" correctly:
- `isPlaceholder()` function treats "Not visible" as a placeholder
- `getBestValue()` skips "Not visible" and uses appropriate fallbacks for display

## How It Works Now

### Extraction Flow
1. **AI Extraction**: AI analyzes PDF and extracts visit type (e.g., "Start of Care", "ROC", "Recert")
2. **AI Can't Find It**: If not found, AI returns "Not visible"
3. **Backend Validation**: 
   - If `visitType === "Not visible"` → Flag as missing
   - If `visitType` has a real value → Mark as found (with console log)
4. **Frontend Display**:
   - If value is "Not visible" → Display "Not Available" (clear indicator of missing data)
   - If value is real → Display the actual value

### Validation Logic
```typescript
// Backend checks actual extracted data
if (visitType === "Not visible") {
  // Flag as missing in missingInformation array
} else {
  // Log success: "✅ Visit Type found: Start of Care"
}
```

### Data Flow
```
PDF Document
    ↓
AI Extraction → "Start of Care" (or "Not visible" if not found)
    ↓
Backend Validation → Check if "Not visible"
    ↓
Database Storage → Store actual value or "Not visible"
    ↓
Frontend Display → Use actual value or fallback for UI
```

## Testing

To verify the fix:
1. Upload a PDF with Visit Type data
2. Check console logs for: `[OASIS] ✅ Visit Type found: [value]`
3. Verify Visit Type does NOT appear in "Missing Required Information" section
4. Verify Visit Type displays correctly in Patient Information section

To verify missing detection:
1. Upload a PDF without Visit Type
2. Check console logs for: `[OASIS] ❌ Missing: Visit Type`
3. Verify Visit Type DOES appear in "Missing Required Information" section
4. Verify frontend displays "Not Available" (not a misleading hardcoded value)

## Benefits

1. **Accurate Detection**: Missing information is based on actual extracted data, not AI's potentially inaccurate flags
2. **Single Source of Truth**: Backend validation is the authoritative source for missing field detection
3. **Better Debugging**: Console logs show exactly what was found or missing
4. **Consistent Validation**: All patient info fields (Visit Type, Visit Date, Payor, Clinician) are now validated
5. **Proper Data Flow**: "Not visible" values are preserved through the backend, allowing accurate detection, while frontend provides user-friendly fallbacks

## Files Modified

1. `lib/oasis-ai-analyzer.ts`
   - Added validation for Visit Type, Visit Date, Payor, Clinician
   - Changed to use "Not visible" instead of fallback values
   - Stopped merging AI's missingInformation array
   - Added console logging for debugging

2. `app/oasis-qa/optimization/[id]/page.tsx`
   - Changed fallback values from misleading defaults to "Not Available"
   - Visit Type: "Start of Care" → "Not Available"
   - Visit Date: Current date → "Not Available"
   - Payor: "Payor Not Available" → "Not Available"
   - Clinician: "Clinician Not Available" → "Not Available"
   - This ensures users can clearly see when data is missing from the PDF

## Related Issues

- Patient Name and MRN extraction (previously fixed)
- Diagnosis codes display (previously fixed)
- AI hallucination of functional status (previously fixed)
- Backend missing field detection (previously implemented)

