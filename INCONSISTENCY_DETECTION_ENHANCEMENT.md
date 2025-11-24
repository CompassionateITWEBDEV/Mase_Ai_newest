# Inconsistency Detection Enhancement

## Overview
Enhanced the inconsistency detection system to provide comprehensive analysis of conflicts and discrepancies within OASIS documents. The AI now actively identifies and reports inconsistencies between different sections, helping ensure documentation accuracy and compliance.

## Features Implemented

### 1. Backend - Comprehensive Detection Instructions
**File**: `lib/oasis-ai-analyzer.ts`

Added **SECTION 6 - INCONSISTENCY DETECTION** with detailed guidelines for 7 types of inconsistencies:

#### 1. Date Inconsistencies
- Visit date vs. assessment date mismatches
- Start of care date vs. physician order date conflicts
- Medication start dates that don't align with visit dates
- **Example**: "Visit date is 09/10/2024 but physician order dated 09/15/2024 (future date)"

#### 2. Diagnosis-Functional Status Conflicts
- Diagnosis indicates severe impairment but functional status shows independence
- **Example**: "Patient has stroke diagnosis (I69.351) but all functional items marked as 0 (independent)"
- **Example**: "Diabetes with complications (E11.65) but Bathing marked as 0 (independent)"

#### 3. Functional Status Internal Conflicts
- Inconsistent functional levels across related items
- **Example**: "M1800 Grooming = 3 (total dependence) but M1810 Dress Upper = 0 (independent)"
- **Example**: "M1850 Transferring = 0 (independent) but M1840 Toilet Transfer = 4 (dependent)"

#### 4. Medication-Diagnosis Conflicts
- Medications prescribed without corresponding diagnosis
- **Example**: "Patient on insulin but no diabetes diagnosis listed"
- Missing medications for documented diagnoses
- **Example**: "Hypertension diagnosis but no antihypertensive medications"

#### 5. Clinical Note Conflicts
- Clinical notes contradict functional status coding
- **Example**: "Notes state 'patient requires assistance with bathing' but M1830 Bathing = 0 (independent)"
- **Example**: "Notes mention 'patient uses walker' but M1860 Ambulation = 0 (independent)"

#### 6. Payor-Service Conflicts
- Services documented that aren't covered by payor
- Visit type doesn't match payor requirements
- **Example**: "Medicare payor but no qualifying hospital stay documented for SOC"

#### 7. Clinician Signature Conflicts
- Different clinicians signed different sections
- Missing signatures on required sections
- **Example**: "Page 1 signed by RN but Page 12 signed by LPN (credential mismatch)"

### 2. Severity Levels

The system classifies inconsistencies by severity:

- **Critical** 🔴: Affects billing, compliance, or patient safety
- **High** 🟠: Significant impact on case mix or documentation quality
- **Medium** 🟡: Minor conflicts that should be reviewed
- **Low** ⚪: Informational discrepancies

### 3. Enhanced UI Display
**File**: `app/oasis-qa/optimization/[id]/page.tsx`

Redesigned the inconsistencies section with:
- ✅ Prominent border and warning icon
- ✅ Color-coded severity badges
- ✅ Clear section identification (A vs B)
- ✅ Separated clinical impact and recommendation boxes
- ✅ Visual hierarchy for easy scanning

## UI Example

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Detected Inconsistencies                                     │
│ The following inconsistencies were detected between different   │
│ sections of the document. Please review and resolve these       │
│ conflicts.                                                       │
├─────────────────────────────────────────────────────────────────┤
│ Diagnosis-Functional Status Conflict           [HIGH]           │
│                                                                  │
│ 📍 Section A: M1800 Grooming - Value: 0 (Independent)          │
│ 📍 Section B: Primary Diagnosis: I69.351 (Stroke with          │
│                hemiplegia)                                       │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ⚕️ Clinical Impact:                                          ││
│ │ Current coding may underrepresent patient's care needs.     ││
│ │ Accurate functional status coding is essential for          ││
│ │ appropriate case mix calculation.                           ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ✅ Recommendation:                                           ││
│ │ Review grooming functional status. Patients with stroke and ││
│ │ hemiplegia typically require some level of assistance with  ││
│ │ grooming activities.                                        ││
│ └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│ Date Mismatch                                  [CRITICAL]       │
│                                                                  │
│ 📍 Section A: Visit Date: 09/10/2024                           │
│ 📍 Section B: Physician Order Date: 09/15/2024                 │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ⚕️ Clinical Impact:                                          ││
│ │ This creates a compliance issue as services cannot be       ││
│ │ provided before physician orders are obtained.              ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ✅ Recommendation:                                           ││
│ │ Verify dates. Physician order cannot be dated after the     ││
│ │ start of care visit.                                        ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Detection Logic

### What Gets Flagged:
✅ Diagnosis codes that don't match functional status
✅ Dates that are out of sequence
✅ Medications without corresponding diagnoses
✅ Functional status items that contradict each other
✅ Clinical notes that conflict with coded values
✅ Payor requirements not met
✅ Missing or mismatched signatures

### What Doesn't Get Flagged:
❌ Normal variations in patient status over time
❌ Expected differences between assessment types
❌ Clinically appropriate variations

## Data Structure

```typescript
inconsistencies: Array<{
  sectionA: string          // Location of first conflict
  sectionB: string          // Location of second conflict
  conflictType: string      // Type of inconsistency
  severity: string          // critical/high/medium/low
  recommendation: string    // How to resolve
  clinicalImpact: string    // Impact on care/billing
}>
```

## Example Output

### Input (OASIS Document):
```
Patient: John Doe
Primary Diagnosis: I69.351 (Hemiplegia following stroke)

M1800 Grooming: ☑ 0 - Able to groom self unaided
M1810 Dress Upper Body: ☑ 0 - Able to dress upper body without assistance
M1820 Dress Lower Body: ☑ 3 - Patient unable to dress lower body

Visit Date: 09/10/2024
Physician Order Date: 09/15/2024
```

### Detected Inconsistencies:
```json
{
  "inconsistencies": [
    {
      "sectionA": "M1800 Grooming - Value: 0 (Independent)",
      "sectionB": "Primary Diagnosis: I69.351 (Stroke with hemiplegia)",
      "conflictType": "Diagnosis-Functional Status Conflict",
      "severity": "high",
      "recommendation": "Review grooming functional status. Patients with stroke and hemiplegia typically require some level of assistance with grooming activities.",
      "clinicalImpact": "Current coding may underrepresent patient's care needs. Accurate functional status coding is essential for appropriate case mix calculation."
    },
    {
      "sectionA": "M1800 Grooming - Value: 0 (Independent)",
      "sectionB": "M1820 Dress Lower Body - Value: 3 (Unable to dress)",
      "conflictType": "Functional Status Internal Conflict",
      "severity": "medium",
      "recommendation": "Review functional status consistency. If patient is unable to dress lower body (value 3), they likely need some assistance with grooming as well.",
      "clinicalImpact": "Inconsistent functional status coding may indicate incomplete assessment or documentation errors."
    },
    {
      "sectionA": "Visit Date: 09/10/2024",
      "sectionB": "Physician Order Date: 09/15/2024",
      "conflictType": "Date Mismatch",
      "severity": "critical",
      "recommendation": "Verify dates. Physician order cannot be dated after the start of care visit. Services cannot be provided before orders are obtained.",
      "clinicalImpact": "This creates a critical compliance issue that could result in claim denial or audit findings."
    }
  ]
}
```

## Benefits

### 1. Quality Assurance
- ✅ Catches documentation errors before submission
- ✅ Ensures internal consistency across document sections
- ✅ Identifies potential coding errors

### 2. Compliance
- ✅ Prevents date-related compliance issues
- ✅ Ensures diagnoses support functional status coding
- ✅ Validates payor requirements are met

### 3. Revenue Protection
- ✅ Identifies under-coding opportunities
- ✅ Prevents over-coding that could trigger audits
- ✅ Ensures case mix weight is accurate

### 4. Clinical Accuracy
- ✅ Ensures functional status reflects patient's actual abilities
- ✅ Validates medication lists match diagnoses
- ✅ Confirms clinical notes align with coded values

### 5. User Experience
- ✅ Clear visual presentation of conflicts
- ✅ Specific recommendations for resolution
- ✅ Severity-based prioritization

## Severity-Based Color Coding

The UI uses color coding for quick identification:

- **Critical** (Red): `bg-red-600 text-white`
- **High** (Orange-Red): `bg-red-500 text-white`
- **Medium** (Orange): `bg-orange-500 text-white`
- **Low** (Yellow): `bg-yellow-500 text-white`

## Testing

### Test Case 1: Diagnosis-Functional Status Conflict
1. Upload OASIS with stroke diagnosis
2. Functional status all marked as 0 (independent)
3. Verify inconsistency is detected
4. Check severity is "high"
5. Confirm recommendation is provided

### Test Case 2: Date Mismatch
1. Upload OASIS with visit date before physician order date
2. Verify inconsistency is detected
3. Check severity is "critical"
4. Confirm compliance impact is explained

### Test Case 3: No Inconsistencies
1. Upload well-documented OASIS form
2. Verify no inconsistencies are flagged
3. Confirm section is not displayed
4. No errors in console

## Files Modified

1. **lib/oasis-ai-analyzer.ts**
   - Added SECTION 6 - INCONSISTENCY DETECTION with 7 types of conflicts
   - Added severity level guidelines
   - Added detection rules and examples
   - Enhanced inconsistencies JSON output format with detailed examples

2. **app/oasis-qa/optimization/[id]/page.tsx**
   - Enhanced UI with prominent border and warning icon
   - Added color-coded severity badges
   - Separated clinical impact and recommendation into distinct boxes
   - Improved visual hierarchy with emojis and spacing
   - Added descriptive header text

## Future Enhancements

Potential improvements:
1. **Auto-Resolution Suggestions**: Provide specific value recommendations
2. **Inconsistency Trends**: Track common inconsistencies across documents
3. **Batch Detection**: Identify patterns across multiple patients
4. **Learning System**: Improve detection based on clinician feedback
5. **Integration with Corrections**: Link inconsistencies to suggested corrections
6. **Priority Scoring**: Calculate overall document risk score
7. **Historical Comparison**: Compare with previous assessments

## Related Features

- Missing Information Detection
- Functional Status Optimization
- Diagnosis Code Extraction
- Medication Management
- OASIS Compliance Checking

## Compliance Notes

This feature supports compliance with:
- **CMS OASIS Requirements**: Documentation consistency
- **Medicare Guidelines**: Accurate functional status coding
- **Billing Compliance**: Diagnosis-functional status alignment
- **Quality Measures**: Internal consistency validation

