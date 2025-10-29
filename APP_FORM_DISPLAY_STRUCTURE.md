# Application Form Display Structure

Based on analyzing the application form (components/job-application-modal.tsx), the display format should match the exact structure:

## Healthcare Compliance Section (Step 4):
Each subsection is in a `border rounded-lg p-4` container:

1. **HIPAA Compliance & Privacy Training** (separate bordered box)
2. **Conflict of Interest Disclosure** (separate bordered box)  
3. **Background Check Authorization** (separate bordered box)

## Health & Safety Requirements Section (Step 5):
Each subsection is in a `border rounded-lg p-4` container:

1. **Tuberculosis (TB) Screening** (separate bordered box)
2. **Healthcare Associated Prevention Program (HAPP) Statement** (separate bordered box)
3. **Physical Requirements & Accommodations** (separate bordered box)
4. **Immunization Requirements** (separate bordered box)

## Current Issue:
The employer dashboard currently has all compliance fields mixed together in one section. Need to split them into separate bordered containers matching the form structure.

## Solution:
Replace the current "HIPAA Compliance & Privacy Training" section (lines 4020-4087) with:
- Parent div with `mb-6 space-y-4`
- Add main heading "Healthcare Compliance"
- Three separate bordered boxes for each subsection
- Similar restructuring needed for the TB, HAPP, Physical, and Immunization sections


