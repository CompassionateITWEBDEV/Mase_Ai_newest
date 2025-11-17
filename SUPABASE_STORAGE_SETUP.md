# 📦 Supabase Storage Setup for Document Uploads

This guide will help you set up the Supabase Storage bucket required for the document upload feature.

## 🎯 Overview

The document upload system stores files in a Supabase Storage bucket called `referral-documents`. File metadata is stored in the `referral_documents` database table.

---

## ⚡ QUICK SETUP (5 Minutes)

### Step 1: Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Run: scripts/110-referral-documents-table.sql
-- This creates the referral_documents table
```

**Or copy-paste this:**

```sql
CREATE TABLE IF NOT EXISTS referral_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('medical', 'insurance', 'consent', 'other')),
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID,
  uploaded_by_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_referral_documents_referral_id ON referral_documents(referral_id);
CREATE INDEX idx_referral_documents_uploaded_at ON referral_documents(uploaded_at DESC);
CREATE INDEX idx_referral_documents_type ON referral_documents(document_type);

ALTER TABLE referral_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to referral_documents"
  ON referral_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view referral_documents"
  ON referral_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert referral_documents"
  ON referral_documents FOR INSERT TO authenticated WITH CHECK (true);
```

---

### Step 2: Create Storage Bucket

1. **Go to Supabase Dashboard** → Your Project
2. **Click "Storage"** in the left sidebar
3. **Click "New bucket"** button
4. **Enter details:**
   - **Name:** `referral-documents`
   - **Public bucket:** ✅ **Checked** (files need to be accessible via URL)
   - **File size limit:** `10485760` (10MB)
   - **Allowed MIME types:** Leave blank or add:
     ```
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     image/jpeg
     image/png
     image/gif
     text/plain
     ```

5. **Click "Create bucket"**

---

### Step 3: Set Storage Policies

After creating the bucket, set up access policies:

1. **In Storage**, click on `referral-documents` bucket
2. **Click "Policies"** tab
3. **Add the following policies:**

#### Policy 1: Allow Service Role Full Access

```sql
CREATE POLICY "Service role can do anything"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'referral-documents');
```

#### Policy 2: Allow Authenticated Users to Upload

```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'referral-documents');
```

#### Policy 3: Allow Public Read Access

```sql
CREATE POLICY "Public can read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'referral-documents');
```

#### Policy 4: Allow Authenticated Users to Delete

```sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'referral-documents');
```

---

### Step 4: Verify Environment Variables

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
# OR
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## ✅ VERIFICATION

### Test the Setup:

1. **Run the application:**
   ```bash
   npm run dev
   ```

2. **Go to Facility Portal** → Submit a referral
3. **Go to Referral Tracker** tab
4. **Click the Upload (📤) button** next to any referral
5. **Select files and upload**
6. **Check Supabase:**
   - Storage → `referral-documents` → Should see uploaded files
   - Database → `referral_documents` table → Should see metadata records

---

## 📂 Folder Structure in Storage

Files are organized by referral:

```
referral-documents/
├── referrals/
│   ├── {referral-id-1}/
│   │   ├── 1699999999_abc123_medical_record.pdf
│   │   ├── 1699999999_def456_insurance_card.jpg
│   │   └── ...
│   ├── {referral-id-2}/
│   │   └── ...
```

---

## 🔒 Security Features

✅ **Row Level Security (RLS)** enabled on database table  
✅ **Service role** has full access  
✅ **Authenticated users** can upload and delete  
✅ **Public read** for file access (required for viewing)  
✅ **File size limit**: 10MB per file  
✅ **File type validation**: Only allowed types can be uploaded  

---

## 🐛 Troubleshooting

### Error: "Storage bucket does not exist"
**Solution:** Create the `referral-documents` bucket in Supabase Storage

### Error: "new row violates row-level security policy"
**Solution:** Make sure RLS policies are set up correctly

### Error: "Failed to upload to storage"
**Solution:** 
- Check that bucket is public
- Verify storage policies are created
- Check service role key is correct

### Files upload but can't be viewed
**Solution:** Make sure the bucket is set to **public** and the "Public can read" policy exists

---

## 🎯 File Type Support

**Accepted file types:**
- 📄 **Documents:** PDF, DOC, DOCX, TXT
- 🖼️ **Images:** JPG, JPEG, PNG, GIF

**Maximum file size:** 10MB per file

**Multiple uploads:** Yes, up to 10 files at once (configurable)

---

## 📊 Database Schema

```sql
referral_documents (
  id UUID PRIMARY KEY,
  referral_id UUID → referrals(id),
  document_name TEXT,
  document_type TEXT (medical|insurance|consent|other),
  file_url TEXT (public URL),
  file_path TEXT (storage path),
  file_size INTEGER (bytes),
  mime_type TEXT,
  uploaded_by_name TEXT,
  uploaded_at TIMESTAMP,
  notes TEXT
)
```

---

## 🚀 API Endpoints

### Upload Documents
```
POST /api/facility-portal/documents
Content-Type: multipart/form-data

FormData:
- files: File[] (multiple files)
- referralId: string
- documentType: string (medical|insurance|consent|other)
- uploadedByName: string
```

### Get Documents
```
GET /api/facility-portal/documents?referralId={id}

Response: { documents: [...], count: number }
```

### Delete Document
```
DELETE /api/facility-portal/documents?documentId={id}

Response: { success: true, message: "..." }
```

---

## ✅ Setup Complete!

Your document upload system is now fully functional! 🎉

Users can:
- ✅ Upload multiple documents per referral
- ✅ Categorize documents by type
- ✅ View uploaded documents
- ✅ Delete documents
- ✅ Track upload history

---

**Need help?** Check the console logs for detailed error messages.

