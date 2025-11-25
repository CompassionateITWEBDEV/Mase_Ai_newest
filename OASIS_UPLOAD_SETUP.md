# OASIS Upload - Setup Guide

## Overview
The OASIS Upload feature allows uploading and analyzing clinical documentation using PDF.co for text extraction and OpenAI for AI-powered analysis.

## Prerequisites

### 1. PDF.co API Key
PDF.co is used to extract text from PDF and image documents via OCR.

**Get Your API Key:**
1. Go to [https://pdf.co](https://pdf.co)
2. Sign up for a free account
3. Navigate to API Dashboard
4. Copy your API key

**Free Tier Includes:**
- 300 API calls per month
- Up to 50MB file size
- All OCR features

### 2. OpenAI API Key
OpenAI GPT-4o-mini is used to analyze extracted text and provide insights.

**Get Your API Key:**
1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

### 3. Supabase Setup
Database tables need to be created for storing assessments.

**Run the SQL script:**
```bash
# Located at: scripts/create-oasis-tables-v1.sql
```

### 4. Vercel Blob Storage (Optional but Recommended)
Used for storing uploaded files.

**Setup:**
1. Connect your project to Vercel
2. Add Blob Storage from Vercel Dashboard
3. Environment variables will be auto-configured

## Environment Variables

Create or update your `.env.local` file with the following variables:

```env
# ============================================
# OASIS Upload Configuration
# ============================================

# PDF.co API Key (for OCR text extraction)
PDFCO_API_KEY=your_pdfco_api_key_here
# Alternative key name (both are supported)
PDF_CO_API_KEY=your_pdfco_api_key_here

# OpenAI API Key (for AI analysis)
OPENAI_API_KEY=your_openai_api_key_here

# Vercel Blob Storage (auto-configured if using Vercel)
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# Supabase Configuration (should already be set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL (for internal API calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Setup

Run the SQL script to create required tables:

```sql
-- Run the file: scripts/create-oasis-tables-v1.sql
-- This creates:
-- 1. oasis_assessments table (stores OASIS documents and analysis)
-- 2. doctor_orders table (stores physician orders)
-- 3. Indexes for performance
-- 4. Triggers for updated_at timestamps
```

## Features

### Supported Document Types
- **OASIS Assessment**: Primary assessment documents
- **Plan of Care (POC)**: Patient care plans
- **Physician Orders**: Doctor's orders
- **RN Notes**: Registered nurse documentation
- **PT Notes**: Physical therapy documentation
- **OT Notes**: Occupational therapy documentation
- **Evaluations**: Clinical evaluation notes

### Supported File Formats
- **PDF**: `.pdf` files (via PDF.co OCR)
- **Images**: `.jpg`, `.jpeg`, `.png`, `.tiff` (via PDF.co OCR)
- **Text**: `.txt` files (direct reading)

### File Size Limits
- Maximum: 10MB per file (frontend validation)
- Backend: 50MB (server limit)

### Processing Workflow

1. **Upload**: Files are uploaded to Vercel Blob Storage
2. **OCR Extraction**: PDF.co extracts text from documents
3. **AI Analysis**: OpenAI GPT-4o-mini analyzes the extracted text
4. **Database Storage**: Results are stored in Supabase
5. **Results Display**: Analysis shown in the UI with metrics

## AI Analysis Features

The OpenAI analyzer provides:

- **Patient Information Extraction**
  - Name, MRN, Visit Type, Payor
  - Visit Date, Clinician Name

- **Diagnosis Analysis**
  - Primary diagnosis with ICD-10 codes
  - Secondary diagnoses
  - Suggested additional codes

- **Quality Assessment**
  - Quality Score (0-100)
  - Confidence Score (0-100)
  - Completeness Score (0-100)

- **Financial Optimization**
  - Current revenue estimation
  - Optimized revenue potential
  - Revenue increase opportunities

- **Risk Factors & Recommendations**
  - Identified risk factors with severity
  - Actionable recommendations
  - Flagged issues requiring attention

- **Corrections & Suggestions**
  - Documentation corrections
  - Coding improvements
  - Revenue impact analysis

## Testing the Setup

1. **Start the development server:**
```bash
npm run dev
```

2. **Navigate to the OASIS Upload page:**
```
http://localhost:3000/oasis-upload
```

3. **Test with a sample document:**
   - Upload a PDF or image containing medical text
   - Check browser console for processing logs
   - Verify results appear in the "Results & QAPI Report" tab

4. **Verify database records:**
```sql
-- Check uploaded assessments
SELECT * FROM oasis_assessments 
ORDER BY created_at DESC 
LIMIT 5;

-- Check analysis results
SELECT 
  upload_id,
  patient_name,
  quality_score,
  confidence_score,
  revenue_increase
FROM oasis_assessments
WHERE status = 'completed';
```

## Troubleshooting

### PDF.co Issues

**Error: "PDF.co API key not configured"**
- Ensure `PDFCO_API_KEY` or `PDF_CO_API_KEY` is set in `.env.local`
- Restart your development server after adding the key

**Error: "OCR extraction failed"**
- Check if you've exceeded your PDF.co free tier limits
- Verify the file format is supported
- Try with a smaller file

### OpenAI Issues

**Error: "Invalid OpenAI API key"**
- Verify your `OPENAI_API_KEY` is correct
- Check if you have credits in your OpenAI account
- Ensure the key has proper permissions

**Error: "Rate limit exceeded"**
- OpenAI has rate limits on their API
- Wait a few moments and try again
- Consider upgrading your OpenAI plan

### Database Issues

**Error: "Failed to store assessment"**
- Verify Supabase tables are created (run SQL script)
- Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Review Supabase logs for detailed error messages

### Text Extraction Issues

**Error: "Extracted text is empty or too short"**
- Document might be a scanned image with poor quality
- Try using a higher quality scan
- Ensure the document contains readable text

## API Endpoints

### Upload & Process
```
POST /api/oasis-upload/process
```

**Parameters:**
- `file`: File (PDF, image, or text)
- `uploadId`: Unique upload identifier
- `uploadType`: Type of analysis (comprehensive-qa, coding-review, etc.)
- `priority`: Priority level (low, medium, high, urgent)
- `fileType`: Document type (oasis, poc, physician-order, etc.)
- `patientId`: Optional patient identifier
- `notes`: Optional processing notes
- `chartId`: Chart identifier for grouping documents

**Response:**
```json
{
  "success": true,
  "message": "OASIS assessment processed successfully",
  "assessmentId": "upload-123",
  "analysis": {
    "qualityScore": 85,
    "confidence": 90,
    "financialImpact": 750,
    "flaggedIssues": []
  }
}
```

## Cost Estimates

### PDF.co (Free Tier)
- 300 calls/month free
- After: $0.01 per API call
- Average: 1 call per document

### OpenAI GPT-4o-mini
- Input: $0.150 per 1M tokens
- Output: $0.600 per 1M tokens
- Average cost per document: ~$0.005 - $0.02

**Example Monthly Cost:**
- 100 documents/month
- PDF.co: Free (within 300 calls)
- OpenAI: ~$0.50 - $2.00
- **Total: $0.50 - $2.00/month**

## Production Deployment

### Environment Variables on Production
Ensure all environment variables are set in your production environment (Vercel, AWS, etc.):

1. Go to your hosting dashboard
2. Add all environment variables from `.env.local`
3. Redeploy your application

### Security Considerations
- Never commit `.env.local` to version control
- Use environment variable encryption when available
- Rotate API keys regularly
- Monitor API usage to detect anomalies

### Performance Optimization
- PDF.co OCR can take 30-60 seconds for large documents
- Use async processing for better UX
- Consider implementing a queue system for bulk uploads
- Cache analysis results to avoid re-processing

## Support & Resources

- **PDF.co Documentation**: [https://pdf.co/docs](https://pdf.co/docs)
- **OpenAI API Reference**: [https://platform.openai.com/docs](https://platform.openai.com/docs)
- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)

## Next Steps

1. ✅ Set up environment variables
2. ✅ Run database migrations
3. ✅ Test with sample documents
4. 📋 Configure production environment
5. 📊 Set up monitoring and alerts
6. 🚀 Deploy to production

---

**Last Updated:** November 24, 2025
**Version:** 1.0.0


