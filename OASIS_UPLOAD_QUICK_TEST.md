# OASIS Upload - Quick Test Guide

## ✅ Pre-Testing Checklist

1. **Environment Variables Set:**
   ```bash
   # Check your .env.local file has:
   PDFCO_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   BLOB_READ_WRITE_TOKEN=your_token
   ```

2. **Database Tables Created:**
   - Run: `scripts/create-oasis-tables-v1.sql` in Supabase SQL editor

3. **Development Server Running:**
   ```bash
   npm run dev
   ```

## 🧪 Test Steps

### Test 1: Upload a PDF Document

1. Navigate to: `http://localhost:3000/oasis-upload`

2. **Configuration:**
   - QA Type: `Comprehensive QA`
   - Priority: `Medium`
   - Patient ID: `TEST-001` (optional)
   - Chart ID: Leave default or set to `test-chart-1`

3. **Upload OASIS Assessment:**
   - Click or drag a PDF file to "OASIS Assessment" zone
   - Watch the progress bar
   - Check browser console for logs

4. **Expected Console Logs:**
   ```
   [v0] Processing file: { uploadId: '...', fileType: 'oasis', fileName: '...' }
   [v0] File uploaded to blob: https://...
   [v0] Extracting text from document using PDF.co OCR...
   Starting async OCR job for: https://...
   OCR job started, jobId: ...
   Checking job status (attempt 1/60)...
   ✅ OCR job completed successfully
   [v0] PDF.co OCR extraction successful, text length: 1234
   [v0] Creating Supabase service client...
   [v0] Analyzing OASIS document with AI...
   [v0] Full AI response length: ...
   [v0] JSON parsed successfully
   [v0] Analysis validated successfully
   [v0] Inserting assessment into database...
   [v0] Assessment stored in database: uuid-here
   ```

5. **Expected UI Response:**
   - Status changes: `uploading` → `processing` → `completed`
   - Toast notification: "Processing Complete"
   - File appears in uploaded documents list with green checkmark

### Test 2: View Results

1. Click on **"Results & QAPI Report"** tab

2. **Verify Summary Stats:**
   - Documents Processed: 1
   - Avg Quality Score: Shows a percentage
   - Total Issues: Shows a number
   - Revenue Impact: Shows a dollar amount

3. **Verify Document Details:**
   - Quality Score (0-100%)
   - Confidence (0-100%)
   - Issues count
   - "View Details" button appears

### Test 3: Upload Multiple Document Types

1. Upload additional documents:
   - Plan of Care (POC)
   - Physician Order
   - RN Note

2. **Verify Chart Grouping:**
   - All documents with same Chart ID appear together
   - Document count updates
   - Each shows correct badge (OASIS Assessment, Plan of Care, etc.)

### Test 4: Database Verification

Run in Supabase SQL Editor:

```sql
-- Check latest assessment
SELECT 
  upload_id,
  patient_name,
  mrn,
  visit_type,
  quality_score,
  confidence_score,
  completeness_score,
  current_revenue,
  optimized_revenue,
  revenue_increase,
  status,
  created_at
FROM oasis_assessments
ORDER BY created_at DESC
LIMIT 1;

-- Check extracted data
SELECT 
  patient_name,
  primary_diagnosis,
  jsonb_array_length(suggested_codes) as suggested_codes_count,
  jsonb_array_length(corrections) as corrections_count,
  jsonb_array_length(flagged_issues) as flagged_issues_count,
  jsonb_array_length(recommendations) as recommendations_count
FROM oasis_assessments
WHERE upload_id = 'your-upload-id-here';
```

## 🐛 Troubleshooting Tests

### Test: Missing API Key

1. **Remove PDFCO_API_KEY** from `.env.local`
2. Restart dev server
3. Try to upload
4. **Expected:** Warning in console: "⚠️ PDF.co API key not found"
5. **Expected:** Error response: "PDF.co API key not configured"

### Test: Invalid File Type

1. Try uploading a `.docx` or unsupported file
2. **Expected:** Should still attempt processing
3. **Expected:** May fail with "Failed to extract text from document"

### Test: Empty Document

1. Upload a blank PDF or image
2. **Expected:** Error: "Extracted text is empty or too short"

### Test: Network Issues

1. Temporarily set invalid API key
2. **Expected:** Graceful error handling
3. **Expected:** Status changes to "error"
4. **Expected:** Red error toast notification

## 📊 Success Criteria

### ✅ Basic Functionality
- [ ] File uploads successfully to blob storage
- [ ] PDF.co extracts text from PDF
- [ ] PDF.co extracts text from images
- [ ] OpenAI analyzes extracted text
- [ ] Results stored in database
- [ ] UI shows analysis results

### ✅ Error Handling
- [ ] Missing API key shows warning
- [ ] Invalid files show error
- [ ] Empty documents show error
- [ ] Network errors handled gracefully
- [ ] UI shows error status

### ✅ Data Quality
- [ ] Patient info extracted correctly
- [ ] Diagnosis codes identified
- [ ] Quality scores calculated (0-100)
- [ ] Financial impact estimated
- [ ] Recommendations provided

### ✅ UI/UX
- [ ] Progress indicators work
- [ ] Multiple files can be uploaded
- [ ] Documents grouped by Chart ID
- [ ] Results tab shows statistics
- [ ] Toast notifications appear

## 🔍 Sample Test Documents

### Create Test PDF
You can use these sample medical notes:

**Sample OASIS Content:**
```
OASIS ASSESSMENT FORM
Patient Name: John Smith
MRN: 123456
Visit Type: Start of Care (SOC)
Payor: Medicare Part A
Visit Date: 11/24/2025
Clinician: Jane Doe, RN

PRIMARY DIAGNOSIS:
M79.3 - Myalgia

SECONDARY DIAGNOSES:
I10 - Essential hypertension
E11.9 - Type 2 diabetes mellitus without complications

ASSESSMENT:
Patient presents with generalized muscle pain and weakness.
Requires assistance with ADLs. Home health services initiated.

FUNCTIONAL STATUS:
- Bathing: Requires assistance
- Dressing: Requires assistance  
- Ambulation: Limited, uses walker

VITAL SIGNS:
BP: 135/85, HR: 78, RR: 16, Temp: 98.6°F
```

Save this as a text file or convert to PDF for testing.

## 📈 Performance Benchmarks

### Expected Processing Times:
- **File Upload:** 1-2 seconds
- **PDF.co OCR (small PDF):** 10-30 seconds
- **PDF.co OCR (large PDF):** 30-90 seconds
- **OpenAI Analysis:** 3-8 seconds
- **Database Storage:** 1-2 seconds
- **Total:** 15-100 seconds depending on file size

### Expected Costs per Document:
- **PDF.co:** Free (within 300/month limit) or $0.01
- **OpenAI GPT-4o-mini:** $0.005 - $0.02
- **Total:** ~$0.01 - $0.03 per document

## 🚨 Common Issues & Solutions

### Issue: "PDF.co API key not configured"
**Solution:** 
- Add `PDFCO_API_KEY` to `.env.local`
- Restart dev server: `npm run dev`

### Issue: "OCR processing timeout"
**Solution:**
- File may be too large (>10MB)
- PDF.co free tier may have processing limits
- Try with a smaller file

### Issue: "Invalid OpenAI API key"
**Solution:**
- Verify key at: https://platform.openai.com/api-keys
- Ensure key has proper permissions
- Check if you have credits available

### Issue: "Failed to store assessment"
**Solution:**
- Run database migration: `scripts/create-oasis-tables-v1.sql`
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase logs for detailed errors

### Issue: Analysis shows default/fallback data
**Solution:**
- Check OpenAI API is responding
- Verify document has sufficient text content
- Review console logs for AI parsing errors

## 📝 Test Results Template

```
OASIS Upload Test Results
Date: ___________
Tester: __________

✅ Environment Setup
- [ ] API keys configured
- [ ] Database tables created
- [ ] Dev server running

✅ Basic Upload Tests
- [ ] PDF upload successful
- [ ] Image upload successful
- [ ] Text file upload successful

✅ Processing Tests
- [ ] PDF.co OCR extraction works
- [ ] OpenAI analysis completes
- [ ] Results stored in database
- [ ] UI displays results correctly

✅ Error Handling
- [ ] Invalid file handled
- [ ] Missing API key detected
- [ ] Empty document rejected

✅ Performance
- Upload time: _____ seconds
- OCR time: _____ seconds
- Analysis time: _____ seconds
- Total time: _____ seconds

✅ Data Quality
- Patient info accuracy: ___/10
- Diagnosis codes correct: Yes/No
- Recommendations useful: Yes/No

Notes:
_________________________________
_________________________________
_________________________________
```

---

**Need Help?** Check `OASIS_UPLOAD_SETUP.md` for detailed setup instructions.

