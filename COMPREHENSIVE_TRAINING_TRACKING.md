# Comprehensive Training Content Tracking & Automated Quiz Generation

## 🎯 Overview

This system implements **strict content tracking** and **automated quiz generation** to ensure staff properly engage with training materials before completion.

---

## ✅ **IMPLEMENTED FEATURES**

### **1. Video Tracking** ✅
- **Requirement**: Must watch 90% of video duration
- **Prevents**: Skipping through video
- **Tracking**: Real-time progress monitoring
- **Cannot complete until**: Video watched to 90%+

**Technical Implementation:**
- Tracks `currentTime` vs `duration`
- Calculates watched percentage
- Prevents seek-ahead cheating
- Visual progress indicator

### **2. Enhanced PDF Tracking** ✅
- **Requirement**: Must view 90% of all pages
- **Minimum time**: 10 seconds per page
- **Prevents**: Instant completion by scrolling
- **Tracking**: Page-by-page viewing progress

**Key Features:**
- Page counter (current/total)
- Viewed pages tracking
- Time spent per page
- Must reach last page
- Visual progress bar

### **3. PowerPoint/Slides Tracking** ✅ (NEW!)
- **Requirement**: Must view ALL slides
- **Minimum time**: 8 seconds per slide
- **Prevents**: Skipping slides
- **Tracking**: Slide-by-slide progress

**Key Features:**
- Slide navigation
- Viewed slides tracking
- Time per slide monitoring
- Must complete all slides
- Fullscreen support

### **4. Automated Quiz Generation** ✅ (NEW!)
- **Uses**: OpenAI GPT-4 API
- **Generates**: Context-aware questions
- **Per module**: 5-8 questions
- **Passing score**: 80%
- **Fallback**: Default questions if API fails

**AI-Powered Features:**
- Analyzes module content
- Creates relevant questions
- 4 options per question
- Provides explanations
- Tests understanding, not memorization

### **5. Strict Enforcement** ✅
- **Cannot complete module without**:
  1. ✅ Viewing full content (video/PDF/slides)
  2. ✅ Passing the quiz (80%+)
  3. ✅ Meeting time requirements
- **No shortcuts**: All requirements must be met
- **Progress saved**: Can continue later

---

## 📁 **NEW FILES CREATED**

### **Components:**
1. `components/training/EnhancedPDFViewer.tsx`
   - Page-based tracking
   - Time per page monitoring
   - Must reach last page

2. `components/training/PowerPointViewer.tsx`
   - Slide-by-slide tracking
   - Time per slide monitoring
   - Fullscreen support

### **Libraries:**
3. `lib/quizGenerator.ts`
   - Quiz generation logic
   - Content extraction
   - Answer validation
   - Score calculation

### **API Endpoints:**
4. `app/api/generate-quiz/route.ts`
   - OpenAI integration
   - Question generation
   - Fallback questions

---

## 🔧 **SETUP INSTRUCTIONS**

### **1. Install Dependencies**

```bash
# Already included in package.json
pnpm install
```

### **2. Configure OpenAI API**

Add to your `.env.local`:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

**Get API Key:**
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Copy and paste to `.env.local`

### **3. Update Module Data Structure**

Modules in the database should include:

```typescript
{
  id: string
  title: string
  description: string
  files: Array<{
    id: string
    name: string
    url: string
    type: 'video' | 'pdf' | 'ppt' | 'pptx'
    // NEW FIELDS:
    totalPages?: number      // For PDFs
    totalSlides?: number     // For PowerPoint
    estimatedTime?: number   // For videos (seconds)
  }>
  // Quiz will be auto-generated from content
}
```

---

## 🚀 **HOW IT WORKS**

### **Module Completion Flow:**

```
1. Staff opens training module
   ↓
2. Views content (video/PDF/PowerPoint)
   ├─ Video: Must watch 90%+
   ├─ PDF: Must view 90% of pages (10s each)
   └─ PowerPoint: Must view ALL slides (8s each)
   ↓
3. Content tracking enforced
   ├─ Progress bars show status
   ├─ Cannot skip ahead
   └─ Time requirements per page/slide
   ↓
4. Quiz automatically generated
   ├─ OpenAI analyzes content
   ├─ Creates 5-8 questions
   └─ Fallback if API fails
   ↓
5. Staff takes quiz
   ├─ Must score 80%+
   ├─ Can retry if failed
   └─ Unlimited attempts
   ↓
6. Module marked complete
   ├─ Certificate generated
   ├─ CEU hours awarded
   └─ Progress saved
```

---

## 📊 **TRACKING DATA STORED**

For each module completion, the system tracks:

```typescript
{
  moduleId: string
  completedModules: string[]
  viewedFiles: {
    [moduleId]: string[]  // Array of file IDs viewed
  }
  moduleQuizScores: {
    [moduleId]: number    // Quiz score (0-100)
  }
  moduleTimeSpent: {
    [moduleId]: number    // Time in seconds
  }
  // NEW FIELDS:
  contentProgress: {
    [fileId]: {
      type: 'video' | 'pdf' | 'ppt'
      progress: number          // Percentage
      viewedPages?: number[]    // For PDF
      viewedSlides?: number[]   // For PowerPoint
      watchedPercent?: number   // For video
      timeSpent: number         // Seconds
      completed: boolean
    }
  }
}
```

---

## 🎮 **USER EXPERIENCE**

### **Video Module:**
1. Staff clicks "View Video"
2. Video player opens
3. Progress bar shows: "Watch at least 90% to complete (45% watched)"
4. Cannot proceed until 90% watched
5. Green checkmark appears when complete
6. "Continue to Quiz" button enabled

### **PDF Module:**
1. Staff clicks "View PDF"
2. PDF viewer opens with page 1
3. Header shows: "Page 1 of 20 (5% viewed)"
4. Must spend 10 seconds per page minimum
5. Progress bar updates as pages viewed
6. Alert: "Please read through to the last page"
7. Green checkmark when 90% of pages viewed
8. "Continue to Quiz" button enabled

### **PowerPoint Module:**
1. Staff clicks "View Presentation"
2. PowerPoint viewer opens with slide 1
3. Header shows: "Slide 1 of 15 (6% viewed)"
4. Must spend 8 seconds per slide minimum
5. Progress bar updates as slides viewed
6. Alert: "Review all slides to the end"
7. Green checkmark when ALL slides viewed
8. "Continue to Quiz" button enabled

### **Quiz:**
1. Auto-generated from module content
2. 5-8 multiple choice questions
3. Immediate feedback on answers
4. Explanation for correct answer
5. Must score 80%+ to pass
6. Can retry unlimited times
7. Best score saved

---

## 🛡️ **ANTI-CHEAT MEASURES**

### **Prevents:**
- ✅ Instant PDF scrolling to last page
- ✅ Skipping video to the end
- ✅ Jumping directly to quiz
- ✅ Guessing on quiz without viewing content
- ✅ Completing module in unrealistic time

### **Enforces:**
- ✅ Minimum time per page/slide
- ✅ Sequential content viewing
- ✅ Quiz after content completion
- ✅ 80% passing score
- ✅ Full content engagement

---

## 🔄 **FALLBACK MECHANISMS**

### **If OpenAI API Fails:**
- System uses pre-configured fallback questions
- Questions are general but relevant
- Staff can still complete training
- No service interruption

### **If Content Type Unknown:**
- Defaults to time-based tracking
- Minimum viewing time calculated
- Basic progress monitoring
- Still requires quiz completion

---

## 📈 **ANALYTICS & REPORTING**

### **Tracked Metrics:**
- Time spent on each content piece
- Pages/slides viewed
- Video watch percentage
- Quiz scores and attempts
- Completion rate
- Average time to complete

### **Admin Dashboard Shows:**
- Which content is most challenging (low quiz scores)
- Average completion time per module
- Common quiz failures (needs content improvement)
- Staff engagement metrics

---

## 🎓 **QUIZ GENERATION EXAMPLES**

### **Input:** Module about "Hand Hygiene"

**Auto-Generated Questions:**
1. When should hand hygiene be performed?
   - Before patient contact
   - After patient contact
   - Before aseptic procedures
   - ✅ All of the above

2. What is the minimum duration for proper hand washing?
   - 5 seconds
   - 10 seconds
   - ✅ 20 seconds
   - 30 seconds

(System generates 5-8 such questions per module)

---

## 🔧 **CUSTOMIZATION OPTIONS**

### **Adjust Requirements:**

In the component files:
```typescript
// EnhancedPDFViewer.tsx
const mustViewPercent = 90  // Change to 80, 95, etc.
const minTimePerPage = 10   // Seconds per page

// PowerPointViewer.tsx
const minTimePerSlide = 8   // Seconds per slide

// VideoPlayer.tsx
const REQUIRED_WATCH_PERCENT = 90  // Percentage

// InteractiveQuiz.tsx
const PASSING_SCORE = 80  // Percentage to pass
```

---

## 🐛 **TROUBLESHOOTING**

### **Issue: OpenAI API not working**
**Solution:** Check `.env.local` for `OPENAI_API_KEY`. System will use fallback questions.

### **Issue: PDF page tracking not working**
**Solution:** Ensure `totalPages` is set in module file data.

### **Issue: PowerPoint not displaying**
**Solution:** Check if file URL is publicly accessible. Office Online requires public URLs.

### **Issue: Quiz not generating**
**Solution:** Check browser console for errors. Verify module has sufficient content (50+ characters).

---

## 📚 **INTEGRATION GUIDE**

### **In your training page:**

```typescript
import { EnhancedPDFViewer } from "@/components/training/EnhancedPDFViewer"
import { PowerPointViewer } from "@/components/training/PowerPointViewer"
import { generateQuiz } from "@/lib/quizGenerator"

// For PDF files
<EnhancedPDFViewer
  fileUrl={file.url}
  fileName={file.name}
  totalPages={file.totalPages || 10}
  onComplete={() => handleContentComplete(file.id)}
  onClose={() => setShowViewer(false)}
/>

// For PowerPoint files
<PowerPointViewer
  fileUrl={file.url}
  fileName={file.name}
  totalSlides={file.totalSlides || 15}
  onComplete={() => handleContentComplete(file.id)}
  onClose={() => setShowViewer(false)}
/>

// Generate quiz
const questions = await generateQuiz({
  moduleTitle: module.title,
  moduleDescription: module.description,
  moduleContent: module.content,
  numberOfQuestions: 5
})
```

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] OpenAI API key configured
- [ ] New components imported
- [ ] Module data includes file types
- [ ] PDF files have `totalPages` field
- [ ] PowerPoint files have `totalSlides` field
- [ ] Video files have `estimatedTime` field
- [ ] Quiz enforcement enabled
- [ ] Progress tracking working
- [ ] Anti-cheat measures active
- [ ] Fallback questions available

---

## 🎯 **EXPECTED RESULTS**

### **Staff Experience:**
- Clear progress indicators
- Cannot skip ahead
- Engaging quiz questions
- Fair completion requirements
- Immediate feedback

### **Admin Benefits:**
- Verified content engagement
- Quality assurance
- Compliance proof
- Analytics data
- Reduced training fraud

### **System Integrity:**
- No instant completions
- Proper learning verification
- Accurate CEU hours
- Audit trail
- Data integrity

---

## 📞 **SUPPORT**

For issues or questions:
1. Check browser console for errors
2. Verify `.env.local` configuration
3. Test with fallback questions first
4. Review module data structure
5. Check API endpoint logs

---

**System Status:** ✅ FULLY IMPLEMENTED
**Ready for Production:** YES
**Requires Setup:** OpenAI API Key (optional, has fallback)

