# Document Processing Setup Guide

## Overview
This feature enables automatic processing of faxed/scanned referral documents using:
- **PDF.co** for OCR (Optical Character Recognition)
- **OpenAI GPT** for intelligent data extraction

## Features
✅ Upload PDF, PNG, or JPG referral documents  
✅ Automatic text extraction via OCR  
✅ AI-powered data extraction (patient name, insurance, diagnosis, etc.)  
✅ Auto-creates referral in database  
✅ No manual typing required!  

---

## Setup Instructions

### 1. Get PDF.co API Key

1. Go to [https://pdf.co](https://pdf.co)
2. Sign up for free account (or log in)
3. Navigate to Dashboard → API
4. Copy your API Key

**Free Tier Includes:**
- 150 API calls/month
- Good for testing and small volume

### 2. Get OpenAI API Key

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (you won't see it again!)

**Pricing:**
- Using `gpt-4o-mini` model (cost-efficient)
- ~$0.00015 per referral document
- Very affordable!

### 3. Add API Keys to Environment

Create or update your `.env.local` file:

```bash
# PDF.co API Key (for OCR)
PDFCO_API_KEY=your_pdfco_api_key_here
# Alternative name also supported:
# PDF_CO_API_KEY=your_pdfco_api_key_here

# OpenAI API Key (for AI extraction)
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Restart Development Server

```bash
# Stop the server (Ctrl+C)
# Restart it
npm run dev
```

---

## Usage

### From Referral Management Page

1. Navigate to `/referral-management`
2. Look for "Process Faxed Referral" card (right sidebar)
3. Click "Choose a file" or drag & drop
4. Select a referral document (PDF, PNG, JPG)
5. Click "Process with AI-OCR"
6. Wait 10-30 seconds for processing
7. Referral is automatically created!

### Supported File Types

- ✅ PDF documents
- ✅ PNG images
- ✅ JPG/JPEG images
- ⚠️ Max file size: 10MB

### What Gets Extracted

The AI will automatically extract:
- **Patient Name** (required)
- **Date of Birth** (if available)
- **Age** (if available)
- **Diagnosis** (required)
- **Insurance Provider** (required)
- **Insurance ID/Policy Number** (required)
- **Phone Number** (if available)
- **Address** (if available)
- **Referring Physician** (if available)
- **Services Requested** (e.g., skilled nursing, wound care)
- **Urgency Level** (routine, urgent, stat)
- **Additional Notes**

---

## How It Works

### Step 1: Upload
User uploads a referral document (PDF/image)

### Step 2: OCR Processing
- File is sent to PDF.co
- OCR extracts all text from document
- Returns plain text

### Step 3: AI Extraction
- Text is sent to OpenAI GPT-4o-mini
- AI understands medical referral format
- Extracts structured data (JSON)
- Falls back to regex if AI fails

### Step 4: Referral Creation
- Validates required fields
- Creates referral in database
- Sets source as "Fax Upload"
- Adds AI confidence score
- Flags for review if low confidence

### Step 5: Confirmation
- Shows success message
- Displays extracted patient info
- Refreshes referral list
- New referral appears in "New Referrals" tab

---

## API Endpoints

### POST `/api/referrals/process-document`

**Request:**
```typescript
FormData {
  file: File (PDF, PNG, or JPG)
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Document processed successfully",
  "referral": {
    "id": "uuid",
    "patient_name": "John Doe",
    "insurance_provider": "Medicare",
    // ... full referral object
  },
  "extractedData": {
    "patientName": "John Doe",
    "diagnosis": "Post-operative care",
    "insuranceProvider": "Medicare",
    "insuranceId": "123-45-6789",
    "confidence": 85,
    "ocrText": "First 500 chars of extracted text..."
  }
}
```

**Response (Error):**
```json
{
  "error": "Error message",
  "details": "Detailed error description"
}
```

---

## Troubleshooting

### Error: "PDF.co API key not configured"

**Solution:**
1. Add `PDFCO_API_KEY` to `.env.local`
2. Restart dev server
3. Verify key is correct

### Error: "OpenAI client not initialized"

**Solution:**
1. Add `OPENAI_API_KEY` to `.env.local`
2. Restart dev server
3. Check API key is valid

### Error: "OCR processing failed"

**Possible causes:**
- Invalid file format
- File corrupted
- PDF.co API limit reached
- File too large (>10MB)

**Solutions:**
- Try different file
- Check PDF.co dashboard for usage
- Reduce file size

### Error: "Failed to extract referral data"

**Possible causes:**
- Document doesn't contain referral information
- Text quality too poor
- Unexpected document format

**Solutions:**
- Use clearer scan/image
- Try manual entry instead
- Check document is actually a medical referral

### Low Confidence Score (<70%)

**What happens:**
- Referral still created
- Flagged for manual review
- Confidence score shown in AI reason

**Action:**
- Review extracted data carefully
- Verify against original document
- Correct any errors manually

---

## Cost Estimates

### PDF.co (OCR)
- **Free Tier:** 150 calls/month
- **Paid Plans:** Starting at $19/month for 3,000 calls
- **Per Call Cost:** ~$0.006-0.01 per document

### OpenAI (AI Extraction)
- **Model:** GPT-4o-mini
- **Cost per Document:** ~$0.00015
- **100 documents:** ~$0.015 (1.5 cents)
- **1,000 documents:** ~$0.15 (15 cents)

### Total Cost per Document
**~$0.01 or less** with paid PDF.co plan  
**Free for first 150/month** with free tier

---

## File Structure

```
lib/
├── pdfco-service.ts              # PDF.co OCR integration
├── openai-referral-extractor.ts  # OpenAI data extraction
app/
├── api/
│   └── referrals/
│       └── process-document/
│           └── route.ts          # API endpoint
└── referral-management/
    └── page.tsx                  # UI with upload
```

---

## Testing

### Test Files
Create test referral documents with this information:

```
REFERRAL FORM
Patient: John Smith  
DOB: 01/15/1950
Diagnosis: Diabetes with complications, Hypertension
Insurance: Medicare Part A & B
Policy #: 123456789A
Address: 123 Main St, Houston, TX 77001
Phone: (555) 123-4567
Physician: Dr. Sarah Johnson
Services Requested: Skilled Nursing, Diabetic Management
Urgency: Routine
```

### Manual Testing Steps

1. Create a simple PDF with above text
2. Upload to system
3. Verify all fields extracted correctly
4. Check referral appears in database
5. Confirm data accuracy

---

## Security Considerations

### API Keys
- ✅ Stored in environment variables (not in code)
- ✅ Never committed to git
- ✅ Server-side only (not exposed to client)

### File Uploads
- ✅ File type validation (PDF, PNG, JPG only)
- ✅ File size limit (10MB max)
- ✅ Temporary storage (PDF.co auto-deletes)
- ✅ No permanent file storage on your server

### Data Privacy
- ⚠️ Documents sent to third-party APIs (PDF.co, OpenAI)
- ✅ HIPAA: Use business associate agreements
- ✅ Consider self-hosted OCR for sensitive data
- ✅ Data not retained by services (check their policies)

---

## Future Enhancements

### Potential Improvements
- [ ] Drag & drop file upload
- [ ] Batch processing (multiple files)
- [ ] Preview extracted data before creating referral
- [ ] Edit extracted data before saving
- [ ] Save original document with referral
- [ ] Email notification when processing complete
- [ ] Integration with fax server (auto-process incoming faxes)
- [ ] Support for more file types (TIFF, HEIC)
- [ ] Handwriting recognition improvement
- [ ] Multi-page document support
- [ ] Document templates for different facilities

---

## Support

### PDF.co Support
- Documentation: https://pdf.co/documentation/api
- Support: support@pdf.co

### OpenAI Support
- Documentation: https://platform.openai.com/docs
- Community: https://community.openai.com

### Your System
- Check browser console for errors
- Check server logs for API errors
- Review extracted text to debug AI parsing issues

---

## Last Updated
November 17, 2025

## Version
1.0.0 - Initial implementation

