# OASIS Optimization Report Display Fix

## Problems Fixed
1. **Diagnosis codes** were showing as "Not visible" even though the data existed in the database
2. **Patient information** was showing placeholders like `[PATIENT_NAME]` and `[ID]` instead of actual patient data

## Root Causes

### Issue 1: Diagnosis Codes
The database was storing diagnosis data as **JSON strings** instead of parsed JSON objects:
- Primary diagnosis: `"{\"code\":\"I69.351\",\"description\":\"Hemiplegia...\"}"` (string)
- Secondary diagnoses: Array of JSON strings

The frontend code was expecting parsed objects and trying to access properties like `analysisResults?.primaryDiagnosis?.code`, which returned `undefined` when the data was a string.

### Issue 2: Patient Information
The patient data was being stored in the database with placeholder values like `[PATIENT_NAME]` and `[ID]` because:
1. The AI analyzer was instructed to extract placeholders as-is (line 140 in `lib/oasis-ai-analyzer.ts`)
2. The database fields (`patient_name`, `mrn`, etc.) were being populated with these placeholders
3. The actual patient information existed in the `extracted_data.patientInfo` JSON field but wasn't being used as a fallback

## Solution

### 1. API Route Fix (`app/api/oasis-qa/optimization/[id]/route.ts`)
Added JSON parsing logic to handle both string and object formats:

```typescript
// Parse primary diagnosis
const parsePrimaryDiagnosis = (data: any) => {
  if (!data) return null
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return null
    }
  }
  return data
}

// Parse secondary diagnoses array
const parseSecondaryDiagnoses = (data: any) => {
  if (!data) return []
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'string') {
        try {
          return JSON.parse(item)
        } catch {
          return null
        }
      }
      return item
    }).filter(Boolean)
  }
  return []
}

// Safe JSON parser for other fields
const safeJsonParse = (data: any) => {
  if (!data) return data
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (e) {
      console.error('[OASIS] Failed to parse JSON:', e)
      return data
    }
  }
  return data
}
```

### 2. API Route - Patient Info Fix (`app/api/oasis-qa/optimization/[id]/route.ts`)
Added extraction of patient info from the `extracted_data` field:

```typescript
// Also include patientInfo from extracted_data as fallback
patientInfoFromExtraction: safeJsonParse(assessment.extracted_data)?.patientInfo || null,
```

### 3. Frontend Fix - Diagnosis Parsing (`app/oasis-qa/optimization/[id]/page.tsx`)
Added additional parsing in the `transformAnalysisData` function as a safety measure:

```typescript
const parseDiagnosisIfNeeded = (data: any) => {
  if (!data) return null
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return null
    }
  }
  return data
}
```

Updated fallback messages to be more descriptive:
- Changed "Not visible" to "No diagnosis code found" / "No diagnosis description available"

### 4. Frontend Fix - Patient Info (`app/oasis-qa/optimization/[id]/page.tsx`)
Added intelligent fallback logic to use extracted patient info when database fields contain placeholders:

```typescript
// Helper to check if a value is a placeholder
const isPlaceholder = (value: string | undefined | null): boolean => {
  if (!value) return true
  const placeholders = ['[PATIENT_NAME]', '[ID]', '[REDACTED]', '[PHONE]', 'Unknown', 'Not visible']
  return placeholders.some(p => value.includes(p))
}

// Get best patient info by checking for placeholders
const getBestValue = (dbValue: any, extractedValue: any, fallback: string): string => {
  if (dbValue && !isPlaceholder(String(dbValue))) return String(dbValue)
  if (extractedValue && !isPlaceholder(String(extractedValue))) return String(extractedValue)
  return fallback
}
```

This logic:
1. Checks if database values are placeholders
2. Falls back to extracted patient info from the AI analysis
3. Uses descriptive fallback messages if both are unavailable

## Changes Made

### Files Modified:
1. `app/api/oasis-qa/optimization/[id]/route.ts`
   - Added `parsePrimaryDiagnosis()` function
   - Added `parseSecondaryDiagnoses()` function
   - Added `safeJsonParse()` helper function
   - Applied parsing to all JSON fields (diagnoses, functional status, corrections, etc.)
   - Added extraction of `patientInfoFromExtraction` from `extracted_data`
   - Added console logging for debugging

2. `app/oasis-qa/optimization/[id]/page.tsx`
   - Added `parseDiagnosisIfNeeded()` function in `transformAnalysisData()`
   - Added `isPlaceholder()` helper to detect placeholder values
   - Added `getBestValue()` helper to intelligently select best data source
   - Updated patient info extraction to use extracted data when DB has placeholders
   - Updated fallback text for better UX
   - Added filtering to remove null entries from secondary diagnoses

## Testing
After refreshing the page, the diagnosis codes should now display correctly:
- **Primary Diagnosis**: I69.351 - Hemiplegia following cerebral infarction, right dominant side
- **Secondary Diagnoses**: All 9 diagnoses with proper codes and descriptions

## Expected Results

### Patient Information Section
Should now display actual patient data instead of placeholders:
- **Patient Name**: Real patient name (not `[PATIENT_NAME]`)
- **MRN**: Real medical record number (not `[ID]`)
- **Visit Type**: Start of Care (or actual visit type)
- **Payor**: Full payor description with checkmark (e.g., "✓ 2 - Medicare (HMO/managed care/Advantage plan)")
- **Visit Date**: Actual visit date in proper format
- **Clinician**: Real clinician name with credentials (e.g., "Trenetta Carroll RN")

### Diagnosis Codes Section
Should now show proper diagnosis codes:
- **Primary Diagnosis**: I69.351 - Hemiplegia following cerebral infarction, right dominant side
- **9 Secondary Diagnoses** with proper codes and descriptions:
  - I12.9 - Hypertensive chronic kidney disease
  - N18.1 - Chronic kidney disease, stage 1
  - D63.1 - Anemia in chronic kidney disease
  - L40.9 - Psoriasis, unspecified
  - F63.81 - Intermittent explosive disorder
  - F19.10 - Other psychoactive substance abuse
  - Z79.1 - Long term use of NSAID
  - Z87.891 - Personal history of nicotine dependence
  - F10.91 - Alcohol use, unspecified, in remission

## Prevention & Future Improvements

### Current Fix
- Handles both string and object formats for JSON data
- Intelligently falls back to extracted data when database fields contain placeholders
- Works with existing data without requiring database migration

### Recommended Future Improvements
1. **Database Schema**: Ensure JSON data is stored as proper JSONB type in PostgreSQL/Supabase (not as strings)
2. **Data Extraction**: Update the AI analyzer to extract real patient data from OASIS documents instead of placeholders
3. **Data Validation**: Add validation during upload to ensure patient info is properly extracted before storing
4. **Database Population**: Consider updating the `app/api/oasis-upload/process/route.ts` to:
   - Extract patient info from `analysis.patientInfo` 
   - Only use database fields if they don't contain placeholders
   - Store both in separate fields for redundancy

### How It Works Now
The fix creates a smart fallback chain:
1. Check database field (e.g., `patient_name`)
2. If it's a placeholder, check `extracted_data.patientInfo.name`
3. If both are unavailable, use descriptive fallback message
4. This ensures real data is displayed whenever available

