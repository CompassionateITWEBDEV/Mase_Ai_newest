# ⚡ Quick Start: Document Upload (5 Minutes)

## 🎯 **3 SIMPLE STEPS TO GET IT WORKING**

---

## **STEP 1: Create Database Table (1 minute)**

Go to your **Supabase Dashboard** → **SQL Editor** → Click **"New Query"**

**Copy and paste this:**

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
ALTER TABLE referral_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access" ON referral_documents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can view" ON referral_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert" ON referral_documents FOR INSERT TO authenticated WITH CHECK (true);
```

**Click "Run"** ✅

---

## **STEP 2: Create Storage Bucket (2 minutes)**

1. Go to **Supabase Dashboard** → Click **"Storage"** in sidebar
2. Click **"New bucket"** button
3. Enter these details:
   - **Name:** `referral-documents`
   - **Public bucket:** ✅ **CHECKED** (important!)
   - Click **"Create bucket"**

4. **Set up policies:**
   - Click on `referral-documents` bucket
   - Click **"Policies"** tab
   - Click **"New policy"**
   - Click **"For full customization"**
   
   **Add these 3 policies:**

   **Policy 1: Service Role Full Access**
   ```sql
   CREATE POLICY "Service role full access"
   ON storage.objects FOR ALL TO service_role
   USING (bucket_id = 'referral-documents');
   ```

   **Policy 2: Public Read**
   ```sql
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT TO public
   USING (bucket_id = 'referral-documents');
   ```

   **Policy 3: Authenticated Upload**
   ```sql
   CREATE POLICY "Authenticated upload"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'referral-documents');
   ```

---

## **STEP 3: Verify Setup (2 minutes)**

1. **Check your `.env.local` file has:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

2. **Restart your dev server:**
   ```bash
   npm run dev
   ```

3. **Test it:**
   - Go to Facility Portal
   - Submit a referral
   - Go to "Referral Tracker" tab
   - Click the **Upload (📤) button**
   - Select a file
   - Click "Upload"
   - ✅ **SUCCESS!**

---

## ✅ **DONE! You're Ready!**

**The upload button now works! Try it:**

1. 📝 Submit a referral
2. 📤 Click Upload button in tracker
3. 📂 Select files
4. ✅ Upload complete!

---

## 🆘 **Problems?**

### **"Storage bucket does not exist"**
→ Go back to Step 2, create the bucket

### **"Failed to upload"**
→ Check that bucket is **PUBLIC** (checkmark in Step 2)

### **"Missing Supabase configuration"**
→ Check `.env.local` has correct keys (Step 3)

---

**Need more help?** See `SUPABASE_STORAGE_SETUP.md` for detailed guide.

---

**That's it! 🎉 The document upload system is now working!**

