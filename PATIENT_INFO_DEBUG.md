# Patient Information Debug Fix

## Issue
Patient Name and MRN showing as "Patient Name Not Available" and "MRN Not Available" even after the initial fix.

## Root Cause Investigation
The patient information might be stored in multiple locations:
1. Direct database fields: `patient_name`, `mrn`
2. Inside `extracted_data.patientInfo` (JSON field)
3. Inside `analysisResults.patientInfo`

## Changes Made

### API Route (`app/api/oasis-qa/optimization/[id]/route.ts`)

1. **Added early parsing of extracted_data**:
```typescript
// Parse extracted data early to access patientInfo
const extractedData = safeJsonParse(assessment.extracted_data)
console.log("[OASIS] 🔍 EXTRACTED DATA:", JSON.stringify(extractedData, null, 2))
console.log("[OASIS] 🔍 PATIENT INFO FROM EXTRACTED DATA:", JSON.stringify(extractedData?.patientInfo, null, 2))
```

2. **Added detailed logging**:
```typescript
console.log("[OASIS] 🔍 RAW patient_name from DB:", assessment.patient_name)
console.log("[OASIS] 🔍 RAW mrn from DB:", assessment.mrn)
console.log("[OASIS] 🔍 RAW extracted_data type:", typeof assessment.extracted_data)
```

3. **Made patientInfo directly available**:
```typescript
patientInfo: extractedData?.patientInfo || null,
```

### Frontend (`app/oasis-qa/optimization/[id]/page.tsx`)

1. **Check multiple sources for patient data**:
```typescript
const extractedPatientInfo = 
  patientInfoFromExtraction || 
  analysisResults?.patientInfo || 
  analysisResults?.extractedData?.patientInfo ||
  {}
```

2. **Try multiple sources for name and MRN**:
```typescript
const patientNameSources = [
  patientData?.name,
  extractedPatientInfo?.name,
  analysisResults?.patientInfo?.name,
  analysisResults?.extractedData?.patientInfo?.name
]

const patientMRNSources = [
  patientData?.mrn,
  extractedPatientInfo?.mrn,
  analysisResults?.patientInfo?.mrn,
  analysisResults?.extractedData?.patientInfo?.mrn
]

const patientName = patientNameSources.find(val => val && !isPlaceholder(String(val))) || "Patient Name Not Available"
const patientMRN = patientMRNSources.find(val => val && !isPlaceholder(String(val))) || "MRN Not Available"
```

3. **Added extensive logging**:
```typescript
console.log('[OASIS] 🔍 Final extractedPatientInfo:', extractedPatientInfo)
console.log('[OASIS] 🔍 Patient Name Sources:', patientNameSources)
console.log('[OASIS] 🔍 Patient MRN Sources:', patientMRNSources)
```

## How to Debug

After refreshing the page, check the browser console for these logs:

### Backend Logs (Terminal/Server Console):
```
[OASIS] 🔍 RAW patient_name from DB: [value]
[OASIS] 🔍 RAW mrn from DB: [value]
[OASIS] 🔍 RAW extracted_data type: [string/object]
[OASIS] 🔍 EXTRACTED DATA: {...}
[OASIS] 🔍 PATIENT INFO FROM EXTRACTED DATA: {...}
```

### Frontend Logs (Browser Console):
```
[OASIS] Transform - Patient Info From Extraction: {...}
[OASIS] Transform - Extracted Data: {...}
[OASIS] Transform - PatientInfo from analysisResults: {...}
[OASIS] 🔍 Final extractedPatientInfo: {...}
[OASIS] 🔍 Patient Name Sources: [...]
[OASIS] 🔍 Patient MRN Sources: [...]
```

## What to Look For

1. **If patient_name and mrn are placeholders** → Data should come from extracted_data.patientInfo
2. **If extracted_data is a string** → It needs to be parsed (already handled by safeJsonParse)
3. **If extracted_data.patientInfo exists** → It should be used as the source
4. **If all sources are empty/placeholders** → The OASIS document didn't have patient info, or AI didn't extract it

## Next Steps

Based on the console logs, we can determine:
- Where the actual patient data is stored
- If it's being extracted properly from the database
- If it's being parsed correctly
- If the fallback chain is working

Please refresh the page and share the console logs so we can see exactly what data is available.

