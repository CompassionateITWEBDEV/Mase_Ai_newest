# Extract Available Data Strategy - Updated Approach

## Core Principle
**Extract WHATEVER data is available in ANY document type, then detect what's missing.**

## Purpose
The system should:
1. ✅ Extract patient info from ANY document (OASIS, H&P, Progress Note, etc.)
2. ✅ Extract diagnosis codes from ANY document
3. ✅ Extract functional status ONLY if M1800-M1870 sections exist
4. ✅ Show what was found AND what's missing
5. ✅ Prevent AI hallucination while maximizing data extraction

## Document Type Handling

### Scenario 1: OASIS Form (Complete)
**Document Contains:**
- Patient Name: Allan, James ✅
- MRN: ALLAN ✅
- Diagnosis Codes: I69.351, I12.9, etc. ✅
- Functional Status M1800-M1870 ✅

**System Behavior:**
```json
{
  "patientInfo": { "name": "Allan, James", "mrn": "ALLAN", ... },
  "primaryDiagnosis": { "code": "I69.351", ... },
  "secondaryDiagnoses": [9 codes],
  "functionalStatus": [9 items],
  "missingInformation": []
}
```
**UI:** Shows all sections, no missing information card

---

### Scenario 2: History & Physical
**Document Contains:**
- Patient Name: COLES, Phyllis ELVERA ✅
- DOB: 08/26/1942 ✅
- Chief Complaint, Medications, Assessment ✅
- NO M1021/M1023 diagnosis codes ❌
- NO M1800-M1870 functional status ❌

**System Behavior:**
```json
{
  "patientInfo": { "name": "COLES, Phyllis ELVERA", "mrn": "6183795", ... },
  "primaryDiagnosis": { "code": "Not visible", ... },
  "secondaryDiagnoses": [],
  "functionalStatus": [],
  "missingInformation": [
    { "field": "Primary Diagnosis Code (M1021)", ... },
    { "field": "Secondary Diagnoses (M1023)", ... },
    { "field": "All Functional Status Items (M1800-M1870)", ... }
  ]
}
```
**UI:** 
- ✅ Shows Patient Information (with actual data)
- ❌ Hides Diagnosis Codes section (empty)
- ❌ Hides Functional Status section (empty)
- ✅ Shows prominent "Missing Information" card

---

### Scenario 3: Progress Note
**Document Contains:**
- Patient Name: John Doe ✅
- Vital Signs ✅
- Assessment/Plan ✅
- Some diagnosis mentions (but not formal ICD codes) ⚠️
- NO functional status ❌

**System Behavior:**
```json
{
  "patientInfo": { "name": "John Doe", ... },
  "primaryDiagnosis": { "code": "Not visible", ... },
  "secondaryDiagnoses": [],
  "functionalStatus": [],
  "missingInformation": [
    { "field": "Primary Diagnosis Code (M1021)", ... },
    { "field": "All Functional Status Items (M1800-M1870)", ... }
  ]
}
```

---

### Scenario 4: OASIS Form (Incomplete)
**Document Contains:**
- Patient Name: Jane Smith ✅
- MRN: JS12345 ✅
- Primary Diagnosis: E11.9 ✅
- Only 3 functional status items (M1800, M1810, M1820) ⚠️

**System Behavior:**
```json
{
  "patientInfo": { "name": "Jane Smith", "mrn": "JS12345", ... },
  "primaryDiagnosis": { "code": "E11.9", ... },
  "secondaryDiagnoses": [],
  "functionalStatus": [
    { "item": "M1800 - Grooming", ... },
    { "item": "M1810 - Dress Upper", ... },
    { "item": "M1820 - Dress Lower", ... }
  ],
  "missingInformation": [
    { "field": "Secondary Diagnoses (M1023)", ... },
    { "field": "6 Functional Status Items Missing", ... }
  ]
}
```
**UI:**
- ✅ Shows Patient Information
- ✅ Shows Diagnosis Codes (primary only)
- ✅ Shows Functional Status (3 items)
- ✅ Shows Missing Information card (6 functional items missing)

---

## Validation Logic

### What Gets Validated:
```typescript
// For each extracted functional status item:
1. Check if M18XX code exists in source text
2. Check if value looks fabricated (generic "2" without source)
3. Remove if not found in source OR looks hallucinated
4. Keep if found in source (verified actual data)
```

### What DOESN'T Get Removed:
- ✅ Patient name (extract from any document)
- ✅ MRN/Patient ID (extract from any document)
- ✅ Diagnosis codes IF they look real and match patterns
- ✅ Functional status IF M18XX sections found in source

### What DOES Get Removed:
- ❌ Functional status with generic values NOT in source
- ❌ M1800-M1870 items when document has no M18XX sections
- ❌ Hallucinated "template" values

---

## Console Log Examples

### Example 1: OASIS Form
```bash
[OASIS] 🔍 Validating extraction accuracy...
[OASIS] Document type: OASIS Form
[OASIS] ✅ Kept 9 verified functional status items
[OASIS] 📋 Patient info: name: Found, mrn: Found, visitDate: Found
[OASIS] 🏥 Primary diagnosis found: I69.351
[OASIS] 🏥 Secondary diagnoses found: 9
[OASIS] ✅ Validation complete - Functional Status: 9 items
[OASIS] 🔍 Detecting missing required fields...
[OASIS] 📊 Total missing fields detected: 0
```

### Example 2: History & Physical
```bash
[OASIS] 🔍 Validating extraction accuracy...
[OASIS] Document type: Non-OASIS Document (will extract available data)
[OASIS] ⚠️ M1800 not found in non-OASIS document - removing fabricated data
[OASIS] ⚠️ M1810 not found in non-OASIS document - removing fabricated data
[OASIS] ✅ Removed 9 fabricated/unverified functional status items
[OASIS] ✅ Kept 0 verified functional status items
[OASIS] 📋 Patient info: name: Found, mrn: Found, visitDate: Found
[OASIS] ✅ Validation complete - Functional Status: 0 items
[OASIS] 🔍 Detecting missing required fields...
[OASIS] ❌ Missing: All Functional Status Items (M1800-M1870)
[OASIS] 📊 Total missing fields detected: 3
```

### Example 3: OASIS with Partial Data
```bash
[OASIS] 🔍 Validating extraction accuracy...
[OASIS] Document type: OASIS Form
[OASIS] ⚠️ M1840 not found in source document - removing fabricated data
[OASIS] ⚠️ M1850 not found in source document - removing fabricated data
[OASIS] ✅ Removed 2 fabricated/unverified functional status items
[OASIS] ✅ Kept 7 verified functional status items
[OASIS] 📋 Patient info: name: Found, mrn: Found
[OASIS] 🏥 Primary diagnosis found: E11.9
[OASIS] ✅ Validation complete - Functional Status: 7 items
[OASIS] 🔍 Detecting missing required fields...
[OASIS] ⚠️ Partial: 7/9 Functional Status Items
[OASIS] 📊 Total missing fields detected: 1
[OASIS] 📋 Missing fields: 2 Functional Status Items Missing
```

---

## Key Changes from Previous Approach

### BEFORE (Overly Restrictive):
```typescript
if (!isOASISForm && analysis.functionalStatus.length > 0) {
  // Clear ALL functional status
  analysis.functionalStatus = []
}
```
❌ This removed potential valid data

### NOW (Validation-Based):
```typescript
// Validate each item individually
analysis.functionalStatus = analysis.functionalStatus.filter(item => {
  const itemCode = item.item.split(' - ')[0].trim()
  const foundInSource = sourceText.includes(itemCode)
  return foundInSource  // Keep if verified in source
})
```
✅ Validates each item, keeps verified data

---

## Benefits

1. **Maximum Data Extraction**
   - Gets patient info from ANY document
   - Gets diagnosis codes when available
   - Gets functional status when available

2. **Accurate Missing Detection**
   - Shows what's truly missing
   - Doesn't assume all documents need all fields
   - Clear guidance on what to complete

3. **Prevents Hallucination**
   - Validates against source text
   - Removes unverified data
   - Keeps only confirmed extractions

4. **Flexible Document Handling**
   - Works with OASIS forms
   - Works with H&P documents
   - Works with Progress Notes
   - Works with partial/incomplete forms

---

## Expected UI Behavior

### Complete OASIS Form:
```
✅ Patient Information (complete)
✅ Revenue Optimization Analysis  
✅ Diagnosis Codes (all present)
✅ Functional Status (9 items)
✅ AI Analysis & Recommendations
(No missing information card)
```

### History & Physical:
```
✅ Patient Information (name, DOB from H&P)
✅ Revenue Optimization Analysis (with defaults)
⚠️ Missing Information Card:
    - Primary Diagnosis Code (M1021) [REQUIRED]
    - All Functional Status Items [REQUIRED]
(Diagnosis and Functional Status sections hidden)
```

### Partial OASIS:
```
✅ Patient Information (complete)
✅ Diagnosis Codes (primary + 3 secondary)
✅ Functional Status (5 of 9 items)
⚠️ Missing Information Card:
    - 6 Secondary Diagnoses could improve reimbursement
    - 4 Functional Status Items Missing
```

---

## Files Modified
- ✅ `lib/oasis-ai-analyzer.ts`
  - Updated `validateExtractionAccuracy()` to validate per-item
  - Updated prompts to extract available data
  - Removed document type restrictions
  - Added better logging

**The system now extracts maximum available data while preventing hallucination!** 🚀

