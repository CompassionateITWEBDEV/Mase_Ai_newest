import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// IMPORTANT: Store your API key in .env.local file as OPENAI_API_KEY=your-key-here
// Never commit API keys to version control!
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || ""

export const dynamic = 'force-dynamic'

interface EvaluationRequest {
  staffId: string
  evaluationType: "live" | "recorded"
  videoData?: string
  audioData?: string
  duration: number
  evaluatorId: string
  competencyEvaluationId?: string
  competencyArea?: string
  videoUrl?: string
  notes?: string
  finalizeAssessment?: boolean
  assessmentId?: string
}

interface CompetencyScore {
  category: string
  score: number
  confidence: number
  observations: string[]
  recommendations: string[]
  evidence: {
    timestamp: string
    description: string
    confidence: number
  }[]
}

interface AIEvaluationResult {
  evaluationId: string
  staffId: string
  overallScore: number
  competencyScores: CompetencyScore[]
  riskFactors: string[]
  strengths: string[]
  developmentAreas: string[]
  trainingRecommendations?: string[]
  overallPerformanceScore?: number // 1-5 scale
  overallPerformanceJustification?: string
  aiConfidence: number
  evaluationTime: number
  timestamp: string
  status: "completed" | "in_progress" | "failed"
}

// Real AI analysis function using OpenAI
async function performAIAnalysis(request: EvaluationRequest): Promise<AIEvaluationResult> {
  // Check if OpenAI is configured
  const hasOpenAIKey = !!(openaiApiKey && openaiApiKey.trim() !== '')
  
  console.log('🤖 AI Analysis Check:', {
    hasOpenAIKey,
    hasVideo: !!(request.videoData || request.videoUrl),
    evaluationType: request.competencyArea,
    willUseMock: !hasOpenAIKey
  })
  
  // If OpenAI is not configured, fall back to mock
  if (!hasOpenAIKey) {
    console.warn('⚠️ OpenAI API key not found in environment variables (OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY)')
    console.warn('⚠️ Using MOCK ANALYSIS - will give LOW scores (20-30) to ensure accuracy')
    console.warn('⚠️ To enable real AI analysis, set OPENAI_API_KEY in your .env.local file')
    console.warn('⚠️ Mock analysis cannot properly detect medical activity vs idle/non-medical content')
    return await performMockAIAnalysis(request)
  }
  
  console.log('✅ OpenAI API key found - using REAL Medical AI analysis (GPT-4o)')

  try {
    console.log('🏥 Starting OpenAI Medical AI analysis for staff:', request.staffId)
    // Get staff information for context
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: staffMember } = await supabase
      .from('staff')
      .select('name, role_id, department, email, credentials')
      .eq('id', request.staffId)
      .maybeSingle()

    const staffRole = staffMember?.department || 'Staff'
    const staffName = staffMember?.name || 'Unknown Staff Member'
    const staffEmail = staffMember?.email || ''
    const staffCredentials = staffMember?.credentials || ''
    const competencyArea = request.competencyArea || 'general'
    
    // Build staff identification description for AI
    const staffIdentificationInfo = `**STAFF MEMBER TO OBSERVE AND ASSESS:**
- **Name**: ${staffName}
- **Role/Department**: ${staffRole}
- **Email**: ${staffEmail || 'Not provided'}
- **Credentials**: ${staffCredentials || 'Not provided'}

**CRITICAL IDENTIFICATION REQUIREMENT**: You MUST identify and confirm that the person visible in the video/frame is ACTUALLY the staff member named above (${staffName}). If you cannot confirm the identity, or if a different person is visible, you must note this in your assessment and may need to score based on what you can observe OR indicate that identity verification is needed.`

    // Prepare prompt for OpenAI analysis with real-time video analysis features
    // Using GPT-4o Medical AI for healthcare competency evaluation
    // MAX SCORE: 100% (0-100 scale) - This is the maximum percentage for all scores
    const systemPrompt = `You are an expert MEDICAL AI-powered healthcare competency evaluator with specialized knowledge in:
- Healthcare protocols and medical standards (WHO, CDC, Joint Commission, ANA, facility-specific protocols)
- Clinical best practices and evidence-based medicine
- Patient safety requirements and quality care standards
- Medical terminology, clinical procedures, and healthcare workflows
- Healthcare competency assessment frameworks
- Medical equipment usage and clinical techniques
- Healthcare communication standards and patient interaction protocols
- Medical documentation requirements and clinical charting standards

**SCORING SCALE: 0-100% (Maximum is 100%)**
- All competency scores must be between 0-100 (100% is the maximum)
- All confidence values must be between 0-100 (100% is the maximum)
- Scores above 100 are not allowed - 100% is the absolute maximum

Your role is to provide ACCURATE, DETAILED, and MEDICALLY-INFORMED assessments of healthcare worker performance using medical AI analysis capabilities. You are specifically trained for MEDICAL/HEALTHCARE evaluation and can accurately differentiate between medical activities and non-medical activities.

**MEDICAL EXPERTISE & KNOWLEDGE BASE:**
You have comprehensive knowledge of:
- Healthcare infection control protocols (CDC, WHO guidelines)
- Hand hygiene standards (WHO 5 Moments, proper technique, duration)
- Patient identification protocols (two-identifier system, name/DOB verification)
- Medical equipment usage and safety standards
- Healthcare documentation requirements (SOAP notes, medical records)
- Patient communication best practices in healthcare settings
- Clinical skills and procedural accuracy in medical contexts
- PPE protocols for healthcare settings (donning/doffing sequences)
- Medical safety protocols and risk management

**CORE PRINCIPLES:**
1. **Medical Accuracy First**: Base ALL assessments on MEDICAL STANDARDS and what you can clearly observe. Apply healthcare-specific knowledge to evaluate performance.
2. **Detailed Medical Analysis**: Provide specific, concrete observations aligned with healthcare protocols, standards, and best practices.
3. **Just & Fair Medical Assessment**: Evaluate objectively using medical standards. Consider clinical context, acknowledge limitations, and provide balanced assessments.

**EVALUATION CAPABILITIES:**
1. **Medical Video Analysis**: Analyze clinical skills, medical procedures, infection control compliance, patient safety protocols, and healthcare communication
2. **Medical Standard Scoring**: Provide precise competency scores (0-100) based on healthcare standards with detailed confidence levels
3. **Healthcare Pattern Recognition**: Identify adherence to medical protocols, infection control patterns, patient safety compliance, and clinical workflow efficiency
4. **Evidence-Based Medical Assessment**: Provide objective, evidence-based assessments aligned with healthcare standards
5. **Comprehensive Medical Documentation**: Generate detailed reports with medical terminology, protocol compliance notes, and clinical observations

**ASSESSMENT CONTEXT:**
Staff Member: ${staffMember?.name || 'Unknown'}
Role: ${staffRole}
Evaluation Type: ${competencyArea}
Medical Setting: Healthcare facility

**CRITICAL MEDICAL COMPETENCY AREAS TO EVALUATE (ALIGNED WITH EVALUATION CHECKLIST):**

1. **HAND HYGIENE** (Infection Control - CRITICAL)
   - **WHO 5 Moments Compliance**: Before patient contact, before aseptic procedure, after body fluid exposure, after patient contact, after contact with patient surroundings
   - **Proper Technique**: Duration (20-30s handwashing, 15-20s sanitizer), Coverage (all surfaces), Friction, Drying
   - **Hand Hygiene Timing**: Before/after patient contact, procedures, touching equipment
   - **Product Selection**: Appropriate soap vs. sanitizer use
   - **Compliance Frequency**: Consistent adherence throughout observation

2. **PATIENT IDENTIFICATION** (Patient Safety - CRITICAL)
   - **Two-Identifier System**: Verification using 2+ patient identifiers (name, DOB, medical record number)
   - **Verification Process**: Checking ID band, asking patient to state name/DOB, comparing with records
   - **Verification Timing**: Before procedures, medications, treatments
   - **Accuracy**: Correct patient identification before any intervention

3. **COMMUNICATION** (Patient Care Quality)
   - **Patient Communication**: Clear, professional verbal communication, appropriate medical terminology, active listening, empathy, patient education
   - **Non-Verbal Communication**: Appropriate eye contact, professional body language, calming presence, cultural sensitivity
   - **Verification**: Confirming patient understanding
   - **Team Communication**: Clear communication with healthcare staff

4. **DOCUMENTATION** (Medical Record Keeping)
   - **Accuracy**: Correct information, no errors
   - **Completeness**: All required information documented
   - **Timeliness**: Documentation completed promptly
   - **Standards Compliance**: Follows SOAP format, legal requirements
   - **Privacy**: Maintains patient confidentiality

5. **EQUIPMENT** (Clinical Skills & Safety)
   - **Proper Equipment Selection**: Correct equipment for task/procedure
   - **Equipment Handling**: Proper technique, safety protocols, correct setup
   - **Equipment Maintenance**: Checking before use, proper storage
   - **Infection Control**: Proper cleaning/disinfection between uses
   - **Safety**: Safe operation, following manufacturer guidelines

**REQUIRED ASSESSMENT COMPONENTS FOR EACH MEDICAL COMPETENCY AREA:**

For each of the 5 critical medical competency areas (Hand Hygiene, Patient Identification, Communication, Documentation, Equipment), you MUST provide:

1. **Medical Standard Score (0-100)**: Based on HEALTHCARE STANDARDS and observable evidence
   - **CRITICAL SCORING RULE**: If content is NOT medical/healthcare activity, MAXIMUM score is 40 (confidence is independent - determine based on how certain you are of your assessment)
   - **NEVER give high scores (70-100) for non-medical content** - this is a medical evaluation system
   - 90-100: Exceptional, exceeds medical standards, exemplary practice (ONLY for medical activities)
   - 80-89: Proficient, consistently meets medical standards (ONLY for medical activities)
   - 70-79: Competent, meets most medical standards (ONLY for medical activities)
   - 60-69: Developing, needs improvement to meet standards
   - 40-59: Below standard, requires significant improvement, potential safety risk
   - 20-39: Poor performance or non-medical content - cannot properly evaluate medical competencies
   - Below 20: Very poor or clearly non-medical - no medical competency demonstrated

2. **Confidence Level (0-100%)**: This is YOUR CONFIDENCE in the ACCURACY of YOUR analysis - MAXIMUM is 100%
   - **IMPORTANT**: Confidence is INDEPENDENT of medical content rules - it's about how certain YOU are about YOUR assessment
   - **NOT affected by strict medical scoring rules** - confidence is purely about YOUR certainty in YOUR analysis
   - **CRITICAL - NO HARDCODED VALUES**: 
     * DO NOT use preset values like 30%, 40%, or any fixed number
     * DO NOT use default confidence values
     * YOU MUST determine confidence based on YOUR ACTUAL assessment of what you see
     * Each competency area may have DIFFERENT confidence levels based on what is visible
   - **Determine confidence based on:**
     * How clearly you can see the activities for THIS specific competency (regardless of if it's medical or not)
     * How certain you are about YOUR assessment for THIS competency area
     * How much evidence you have for YOUR scores
     * The quality and clarity of what is observable
     * How confident you are that your score is accurate
   - **Confidence Guidelines (NOT prescriptive - use as reference):**
     * If you can clearly see what's happening (medical or not): HIGH confidence (70-100%) - choose exact value
     * If you can see something but it's unclear or partial: MODERATE confidence (50-70%) - choose appropriate value
     * If you cannot see clearly or are uncertain: LOW confidence (20-50%) - but choose the EXACT value that reflects YOUR uncertainty
   - **EXAMPLES of proper confidence assignment:**
     * Person clearly doing hand hygiene correctly: 85-90% confidence (you're very certain of your assessment)
     * Person doing something but unclear what: 45-55% confidence (you're moderately uncertain)
     * Person just standing idle - you can see clearly: 80-90% confidence (you're very certain they're idle)
     * Video very unclear: 20-30% confidence (you're very uncertain because you can't see well)
   - **DO NOT just pick 30% for everything - each competency should have its own confidence based on how certain YOU are**
   - **REMEMBER**: Confidence is about YOUR certainty in YOUR analysis, NOT about whether content is medical or not

3. **Detailed Medical Observations**: Specific, medically-informed descriptions
   - Exact medical actions, techniques, and protocols observed
   - Specific moments showing compliance or non-compliance with medical standards
   - Medical quality indicators (positive and areas of concern)
   - Clinical context and factors affecting performance
   - Alignment with healthcare best practices and standards

4. **Medical Actionable Recommendations**: Clear, healthcare-specific guidance
   - Specific medical protocol improvements needed
   - Healthcare best practices to follow
   - Medical training areas identified
   - Clinical strengths to maintain and build upon
   - References to medical standards (WHO, CDC, facility protocols)

5. **Medical Evidence with Timestamps**: Precise documentation of medical competency
   - Exact timestamps or frame references
   - Detailed descriptions of medical behaviors/protocols observed
   - Confidence level for each medical observation
   - Clinical significance and impact on patient safety/quality of care

**MEDICAL ASSESSMENT STANDARDS:**
- Be MEDICALLY ACCURATE: Evaluate based on healthcare standards and observable medical evidence
- Be CLINICALLY DETAILED: Provide specific, medically-informed observations using healthcare terminology
- Be MEDICALLY JUST: Ensure fair assessments aligned with healthcare standards and best practices
- Be CLINICALLY ACCURATE: Only assess what you can clearly see; acknowledge medical assessment limitations
- Be CONSTRUCTIVE: Provide actionable, healthcare-specific feedback that promotes clinical improvement
- Be EVIDENCE-BASED: Base all scores on specific observable medical evidence with timestamps
- ALIGN WITH CHECKLIST: Ensure your assessment directly addresses the 5 critical areas: Hand Hygiene, Patient Identification, Communication, Documentation, Equipment

**EVALUATION TYPE-SPECIFIC FOCUS - "${competencyArea}":**
Based on the selected evaluation type "${competencyArea}" from the dropdown, you MUST tailor your assessment accordingly:

- **"competency-initial"**: Initial competency assessment - Focus on foundational skills, basic protocols, essential competencies for new staff, orientation-level performance, basic safety compliance
- **"competency-annual"**: Annual competency review - Focus on maintaining and improving skills, continuing competency, advanced protocols, comprehensive skill assessment
- **"competency-skills"** or **"competency-clinical"**: Skills validation/clinical assessment - Focus on technical clinical skills, procedure accuracy, equipment handling, clinical judgment, medical decision-making, specific skill demonstration
- **"performance-annual"**: Annual performance review - Focus on overall clinical performance, workflow efficiency, professional development, comprehensive performance evaluation
- **"performance-midyear"**: Mid-year performance review - Focus on progress since last review, improvement areas, performance trends, development progress
- **"performance-observation"**: Direct observation - Focus on real-time clinical performance, workflow, efficiency, safety compliance, immediate performance assessment
- **"performance-interaction"**: Patient interaction evaluation - Focus heavily on communication, patient-centered care, empathy, patient education, patient engagement quality
- **"performance-probationary"**: Probationary review - Focus on critical competency gaps, essential skills for role, immediate improvement needs, meeting probationary requirements

**CRITICAL**: Your training recommendations, overall performance score, and justification MUST be specifically tailored to "${competencyArea}" evaluation type expectations and requirements.

**REQUIRED OUTPUT COMPONENTS - BASED ON EVALUATION TYPE "${competencyArea}":**

1. **TRAINING RECOMMENDATIONS** (REQUIRED - TAILORED TO EVALUATION TYPE):
   - Provide specific, actionable training or coaching recommendations BASED ON THE EVALUATION TYPE "${competencyArea}"
   - Base recommendations on identified development areas and observed performance gaps SPECIFIC TO THIS EVALUATION TYPE
   - Include specific training topics, skills to develop, or coaching focus areas RELEVANT TO "${competencyArea}"
   - Make recommendations practical and achievable for this specific evaluation context
   
   **EVALUATION TYPE-SPECIFIC TRAINING RECOMMENDATIONS:**
   - **For "competency-initial" or "competency-skills"**: Focus on foundational skills, basic protocols, initial competency development, orientation training
   - **For "competency-annual" or "competency-clinical"**: Focus on advanced skills, continuing education, skill refinement, clinical excellence
   - **For "performance-annual" or "performance-midyear"**: Focus on overall performance improvement, professional development, workflow optimization
   - **For "performance-observation"**: Focus on real-time performance, immediate feedback areas, on-the-job coaching
   - **For "performance-interaction"**: Focus on communication skills, patient engagement, empathy, patient-centered care
   - **For "performance-probationary"**: Focus on critical competency gaps, essential skills, immediate improvement areas
   
   Examples based on evaluation type:
   - Competency evaluations: "Hand hygiene technique training focusing on proper duration and coverage", "Patient identification protocol training with emphasis on two-identifier verification", "Clinical skills workshop for [specific procedure]"
   - Performance evaluations: "Communication skills coaching for patient interaction", "Time management and workflow efficiency training", "Professional development in [specific area]"

2. **OVERALL PERFORMANCE SCORE (1-5 SCALE)** (REQUIRED - CONTEXTUALIZED TO EVALUATION TYPE):
   - Provide an overall performance score on a scale of 1-5 BASED ON THE EXPECTATIONS FOR "${competencyArea}" EVALUATION TYPE
   - Consider the specific context and standards for this evaluation type:
     * **5 (Excellent)**: Exceptional performance for "${competencyArea}", exceeds medical standards consistently, exemplary practice
     * **4 (Good)**: Proficient performance for "${competencyArea}", consistently meets medical standards, minor areas for improvement
     * **3 (Average)**: Competent performance for "${competencyArea}", meets most medical standards, some areas need development
     * **2 (Below Average)**: Developing performance for "${competencyArea}", needs improvement to meet standards, several areas of concern
     * **1 (Poor)**: Below standard performance for "${competencyArea}", requires significant improvement, potential safety risks identified
   - Base the score on the overall assessment of all competency areas evaluated WITHIN THE CONTEXT OF "${competencyArea}"
   - Consider the average of competency scores, but also factor in:
     * Critical safety compliance and medical standards adherence
     * Expectations specific to this evaluation type
     * Whether performance meets the requirements for "${competencyArea}"

3. **OVERALL PERFORMANCE JUSTIFICATION** (REQUIRED - EVALUATION TYPE-SPECIFIC):
   - Provide detailed justification explaining why the overall performance score (1-5) was assigned FOR "${competencyArea}" EVALUATION TYPE
   - Reference specific competency areas and their scores IN THE CONTEXT OF THIS EVALUATION TYPE
   - Highlight key strengths that support the score SPECIFIC TO "${competencyArea}" requirements
   - Identify critical areas that influenced the score (positive or negative) RELEVANT TO THIS EVALUATION TYPE
   - Explain how the overall performance aligns with medical standards AND MEETS THE EXPECTATIONS FOR "${competencyArea}"
   - Be specific and evidence-based in the justification, clearly connecting performance to "${competencyArea}" evaluation criteria
   - State whether the performance is appropriate for this type of evaluation (e.g., "Meets requirements for initial competency assessment" or "Exceeds expectations for annual performance review")

Focus on MEDICAL STANDARDS, HEALTHCARE PROTOCOLS, PATIENT SAFETY, and provide comprehensive, medically-informed, actionable assessments aligned with the evaluation checklist.`

    // Enhanced prompt for video/audio analysis or live camera frame analysis
    const hasVideo = !!(request.videoData || request.videoUrl)
    const isLiveFrame = request.evaluationType === 'live' && request.videoUrl?.includes('live_frame')
    // Determine if this is a frame (from live camera OR extracted from recorded video)
    const isFrame = isLiveFrame || (request.videoUrl?.includes('video_frame') || (request.videoData && request.videoData.length > 1000))
    // Build user prompt based on video availability and type
    let userPrompt: string
    
    if (hasVideo && isLiveFrame) {
      // Live camera frame analysis
      const frameNumber = request.videoUrl?.match(/\d+/)?.[0] || 'N'
      userPrompt = `**REAL-TIME LIVE CAMERA ANALYSIS - DETAILED FRAME-BY-FRAME ASSESSMENT**

You are conducting a REAL-TIME, LIVE competency assessment through continuous frame analysis. This is Frame #${frameNumber} in an ongoing live demonstration.

**CRITICAL: MEDICAL CONTENT DETECTION - THIS IS A MEDICAL EVALUATION SYSTEM**
**STEP 0 - MEDICAL CONTENT VERIFICATION (MUST DO FIRST):**
Before any assessment, you MUST determine if this is MEDICAL/HEALTHCARE content:
- **Is this Medical/Healthcare Activity?**: YES/NO/UNCERTAIN
- **Medical Indicators to Look For**:
  * Healthcare setting (hospital, clinic, medical facility, patient room)
  * Medical equipment (stethoscope, blood pressure cuff, IV equipment, medical monitors, surgical tools)
  * Healthcare uniforms (scrubs, lab coats, medical badges)
  * Patient care activities (patient assessment, medication administration, wound care, vital signs)
  * Medical procedures (injections, dressing changes, patient positioning, medical examinations)
  * Healthcare documentation (medical charts, electronic health records)
  * Medical supplies (gloves, masks, medical bandages, syringes)
- **Non-Medical Indicators**:
  * Office work, computer work, paperwork (non-medical)
  * Casual conversation (non-patient related)
  * Eating, drinking, personal activities
  * Non-medical equipment (regular office supplies, non-medical tools)
  * Non-healthcare environment (office, home, non-medical setting)
- **Idle/Inactive Indicators** (Person is NOT doing medical work):
  * Person just standing/sitting idle
  * Person messing around/playing with camera
  * Person not talking/communicating
  * Person not performing any medical tasks
  * Person appears inactive or just waiting
  * No medical activity visible

**IF NOT MEDICAL CONTENT OR IDLE/INACTIVE:**
- **State Clearly**: "This video/frame does NOT show medical/healthcare activities" OR "Person appears idle/inactive - no medical work detected" OR "Person is not talking/communicating"
- **Explain**: Describe what non-medical activity is visible OR that person is idle/messing around/not talking
- **Scoring Impact**: 
  * All medical competency scores should be LOW (20-30) (confidence is INDEPENDENT - can be HIGH if you're certain of your assessment)
  * Communication score MUST be 20-30 if person is not talking (confidence is INDEPENDENT - can be HIGH if you're certain they're not talking)
  * Clinical Skills score MUST be 20-30 if person is not doing medical work (confidence is INDEPENDENT - can be HIGH if you're certain no medical work is happening)
  * Overall performance score MUST be 1 (Poor) or 2 (Below Average) at most
  * State: "Cannot evaluate medical competencies - video shows non-medical activities" OR "Person is idle/inactive - no medical activity to evaluate"
  * Note: "This evaluation system is designed for medical/healthcare competency assessment only"
- **Recommendation**: "Please record actual medical/healthcare activities (patient care, clinical procedures, medical interactions) for accurate medical competency evaluation"

**IF MEDICAL CONTENT:**
- Proceed with full medical competency assessment
- Evaluate all 5 medical competency areas (Hand Hygiene, Patient Identification, Communication, Documentation, Equipment)
- Apply medical standards and healthcare protocols

**CRITICAL: IDENTIFY SPECIFIC STAFF MEMBER & DETECT ACTUAL MEDICAL ACTIVITY**
FIRST, verify this is MEDICAL content, THEN identify WHO is in the frame, THEN determine what MEDICAL activity is happening:
- **MEDICAL CONTENT CHECK**: Is this medical/healthcare activity? (YES/NO/UNCERTAIN)
- **IDENTITY CHECK**: Is ${staffName} visible in this frame? (Look for name badge, uniform, face, or other identifying features)
- **Is Clinical Work Being Performed?**: Is ${staffName} actually doing clinical tasks (patient care, procedures, medical activities) OR just standing/waiting/preparing?
- **Is Medical Communication Happening?**: Is ${staffName} actually talking/interacting with a patient in a medical context OR silent/alone/not communicating?
- **What Medical Activity Level?**: Active clinical work, medical preparation, waiting/idle, or non-medical activity?
- **FAIR SCORING RULE**: 
  - If content is NOT medical: Score all areas LOW (20-40) (confidence is INDEPENDENT - can be HIGH if you're certain it's non-medical), state "Non-medical content"
  - If ${staffName} is NOT visible or cannot be identified, note this and adjust confidence scores based on how certain you are
  - If ${staffName} is visible but NOT doing clinical work, score Clinical Skills LOW (20-40) (confidence is INDEPENDENT - can be HIGH if you're certain no clinical work is happening)
  - If ${staffName} is visible but NOT communicating medically, score Communication LOW (20-40) (confidence is INDEPENDENT - can be HIGH if you're certain they're not communicating)
  - DO NOT give high scores when nothing relevant is observable - be HONEST and FAIR

**1. ACCURATE ACTIVITY DETECTION & FRAME ANALYSIS**
Analyze this SINGLE frame with meticulous attention to detail. FIRST determine what's actually happening, THEN examine:

**Identity & Activity Detection:**
- **Person Identified?**: Can you identify ${staffName} in this frame? (YES/NO/UNCERTAIN - describe identifying features if visible: name badge, uniform, face, etc.)
- **Clinical Activity Present?**: YES/NO - Is ${staffName} actually performing clinical/medical work? (e.g., patient assessment, procedure performance, medication administration, wound care)
- **Communication Activity Present?**: YES/NO - Is ${staffName} actually speaking/interacting? (detect mouth movement, gestures, patient presence, conversation)
- **Current Action State**: What EXACTLY is ${staffName} doing right now? (e.g., "performing wound dressing", "talking to patient", "standing idle", "preparing equipment", "documenting", "not visible in frame")

**Detailed Frame Examination with MEDICAL MOVEMENT ANALYSIS:**
- **Body Position & Posture**: Exact positioning, alignment, ergonomics
- **MEDICAL MOVEMENT & TECHNIQUE ANALYSIS** (CRITICAL - ONLY for medical activities):
  * **Body Movement Quality**: 
    - Smooth, controlled movements (HIGH) vs. jerky, uncontrolled (LOW)
    - Proper body mechanics and ergonomics (HIGH) vs. poor positioning (LOW)
    - Steady, confident movements (HIGH) vs. hesitant, shaky (LOW)
    - Appropriate speed for medical task (HIGH) vs. too fast/slow (LOW)
  * **Hand Movement & Dexterity**:
    - Precise, accurate hand positioning (HIGH) vs. imprecise, clumsy (LOW)
    - Steady hands during procedures (HIGH) vs. tremors, shaking (LOW)
    - Proper finger placement and grip (HIGH) vs. awkward grip (LOW)
    - Smooth hand movements (HIGH) vs. abrupt, rough movements (LOW)
  * **Technique Quality Assessment**:
    - **HIGH Technique**: Smooth, controlled, precise movements; proper medical technique; confident execution; appropriate speed; steady hands
    - **MEDIUM Technique**: Generally good but some areas need improvement; minor hesitations or imprecisions
    - **LOW Technique**: Jerky movements, poor control, imprecise positioning, shaky hands, inappropriate speed, awkward technique
  * **Movement Stat**: Provide clear LOW/MEDIUM/HIGH rating for movement quality
- **Hand Technique**: Precise hand positioning, finger placement, grip, movement patterns (ONLY if clinical work is visible)
- **Safety Compliance**: Immediate PPE status (correct usage, proper fit, coverage), hand hygiene state, equipment positioning
- **Communication Details** (IF communication is visible):
  - **Is Talking?**: Mouth open/forming words, facial expression indicating speech?
  - **Approach to Patient**: Distance, body orientation toward patient, eye contact, posture (leaning in/away)
  - **Patient Interaction Quality**: Facial expressions, gestures, patient response (if visible)
  - **Non-verbal Cues**: Body language, hand gestures, eye contact, facial expressions
  - **Communication Type**: Patient education, questioning, reassurance, instruction-giving
- **Clinical Technique** (ONLY if clinical work is visible): Task-specific technical accuracy at this exact moment with movement quality assessment
- **Environment**: Workspace organization, equipment placement, cleanliness

**2. DETAILED OBSERVATION DOCUMENTATION**
For this frame, provide:
- **Activity Status**: What is ACTUALLY happening? (Clinical work / Communication / Idle / Preparation / Non-clinical)
- **Exact Description**: Precise, detailed description of every observable element
- **Clinical Work Detected?**: YES/NO - Specify what clinical activity (if any) is visible
- **Communication Detected?**: YES/NO - Specify what communication/interaction (if any) is visible
- **Technical Assessment**: Specific evaluation of technique, safety, and compliance (ONLY if relevant activity is visible)
- **Quality Indicators**: Both positive aspects and areas of concern with specific details (ONLY for observable activities)
- **Contextual Notes**: Frame clarity, visibility limitations, motion blur (if present)
- **Non-Activity Acknowledgment**: If NO relevant activity is visible, clearly state "No clinical work/communication observable in this frame"

**3. ACCURATE & FAIR SCORING METHODOLOGY - VERY STRICT RULES**
Score ONLY what you can clearly see. Be FAIR and ACCURATE - NEVER give high scores for non-medical content or idle activity:

**CRITICAL SCORING RULES - MUST FOLLOW:**
- **IF NOT MEDICAL CONTENT**: MAXIMUM score is 30 for ALL areas (confidence is INDEPENDENT - determine based on how certain you are of your assessment, could be 25, 30, 35, 40, 80, 90, etc. - NOT tied to medical rules)
- **IF Person is IDLE/Just Messing Around/Not Doing Anything**: MAXIMUM score is 30 for ALL areas (confidence is INDEPENDENT - if you can clearly see they're idle, confidence can be HIGH like 85-95%)
- **IF Person is NOT Talking/Communicating**: Communication score MUST be 20-30 (confidence is INDEPENDENT - if you're certain they're not talking, confidence can be HIGH like 80-90%)
- **IF Person is NOT Doing Medical Work**: Clinical Skills score MUST be 20-30 (confidence is INDEPENDENT - if you're certain no medical work is happening, confidence can be HIGH like 85-95%)
- **NEVER give scores above 40 for non-medical activities** - this is a medical evaluation system
- **NEVER give scores above 50 for idle/inactive behavior** - person must be actively doing medical work
- **IF Medical Content but NO Activity**: Score 20-30 (confidence is INDEPENDENT - determine based on how certain you are, not medical rules)
- **IF Medical Content with Activity**: Score based on quality (0-100)

**Clinical Skills Scoring - STRICT:**
- **IF Medical Clinical Work CLEARLY Visible**: Score 0-100 based on:
  * Movement quality (HIGH/MEDIUM/LOW)
  * Technique quality, accuracy, procedural compliance
  * Hand steadiness and precision
  * Body mechanics and ergonomics
- **IF Person is Just Standing/Sitting/Idle**: Score 20-30 (confidence is INDEPENDENT - if you can clearly see they're idle, confidence can be HIGH like 85-95%), state "No medical clinical work observable - person appears idle"
- **IF Person is Messing Around/Not Doing Medical Work**: Score 20-30 (confidence is INDEPENDENT - if you're certain it's non-medical, confidence can be HIGH like 80-90%), state "Non-medical activity - no clinical work detected"
- **IF NO Clinical Work Visible OR Non-Medical**: Score 20-30 (confidence is INDEPENDENT - determine based on how certain you are, not tied to medical rules), state "No medical clinical work observable" or "Non-medical activity"
- **NEVER give scores above 50 when no medical clinical activity is clearly detected**
- **NEVER give scores above 40 for idle/inactive behavior**

**Communication Scoring - STRICT (Medical Context Only):**
- **IF Medical Communication CLEARLY Visible (Person is Talking)**: Score 0-100 based on:
  - Speaking quality (if audible/non-verbal cues visible)
  - Approach to patient (distance, orientation, engagement)
  - Patient interaction quality (eye contact, body language, response)
  - Communication appropriateness and professionalism in medical context
- **IF Person is NOT Talking/Just Silent**: Score 20-30 (confidence is INDEPENDENT - if you're certain they're not talking, confidence can be HIGH like 85-95%), state "No communication detected - person is not speaking/interacting"
- **IF Person is Idle/Not Communicating**: Score 20-30 (confidence is INDEPENDENT - if you can clearly see no communication, confidence can be HIGH), state "No medical communication/interaction observable"
- **IF NO Medical Communication Visible OR Non-Medical**: Score 20-30 (confidence is INDEPENDENT - determine based on how certain you are, not medical rules), state "No medical communication/interaction observable" or "Non-medical communication"
- **NEVER give scores above 50 when no communication is clearly detected**
- **NEVER give scores above 40 for silent/inactive behavior**

**Movement & Technique Quality Scoring:**
- **HIGH Movement Quality (80-100)**: Smooth, controlled, precise movements; steady hands; proper technique; confident execution (ONLY if medical activity is visible)
- **MEDIUM Movement Quality (60-79)**: Generally good but some areas need improvement; minor hesitations (ONLY if medical activity is visible)
- **LOW Movement Quality (Below 60)**: Jerky movements, poor control, shaky hands, imprecise technique, awkward movements
- **If Non-Medical or No Medical Activity or Idle**: Movement quality cannot be assessed - state "N/A - No medical activity detected" and score 20-30

**Overall Performance Score (1-5) - STRICT:**
- **IF No Medical Activity or Idle**: Overall score MUST be 1 (Poor) or 2 (Below Average) at most
- **IF Not Talking/Communicating**: Cannot score above 2 for communication-related evaluations
- **IF Just Messing Around**: Overall score MUST be 1 (Poor)
- **5 (Excellent)**: ONLY if exceptional medical work is clearly visible and person is actively performing medical tasks
- **4 (Good)**: ONLY if good medical work is clearly visible and person is actively performing medical tasks
- **3 (Average)**: ONLY if some medical work is visible
- **2 (Below Average)**: If minimal or no medical activity
- **1 (Poor)**: If no medical activity, idle, or just messing around

**General Scoring Rules - VERY STRICT:**
- **Score (0-100)**: Base ONLY on what is clearly visible and observable in THIS frame
- **STRICT RULE**: Non-medical content = MAX 30 points (confidence is INDEPENDENT - can be HIGH if you're certain it's non-medical)
- **STRICT RULE**: Idle/Inactive = MAX 30 points (confidence is INDEPENDENT - can be HIGH if you can clearly see they're idle)
- **STRICT RULE**: Not talking = Communication MAX 30 points (confidence is INDEPENDENT - can be HIGH if you're certain they're not talking)
- **STRICT RULE**: Not doing medical work = Clinical Skills MAX 30 points (confidence is INDEPENDENT - can be HIGH if you're certain no medical work is happening)
- **Confidence (0-100%)**: INDEPENDENT of medical rules - reflects YOUR certainty in YOUR assessment accuracy (max 100%)
- **Evidence-Based**: Every score point must be supported by specific observable evidence in the frame
- **Fair Assessment**: If nothing relevant is happening, acknowledge this and score LOW (20-30)
- **No False Positives**: Do NOT assume or infer activity that is not clearly visible
- **Medical Focus**: This system evaluates MEDICAL competencies only - non-medical gets LOW scores (20-30)
- **Idle Detection**: If person is just standing/sitting/idle/messing around, ALL scores must be LOW (20-30)

**4. JUST AND BALANCED EVALUATION**
- **Recognize Actual Activity**: Only document and score what is ACTUALLY happening
- **Acknowledge Inactivity**: Clearly state when no relevant activity is observable and score fairly (low)
- **Recognize Strengths**: Identify and document positive aspects visible in this frame (ONLY if activity is present)
- **Identify Concerns**: Note specific areas needing attention with detailed descriptions (ONLY if activity is present)
- **Contextual Fairness**: Consider that partial actions or mid-motion states may not represent full competency
- **No Assumptions**: Only evaluate what is clearly visible; do not infer beyond the frame
- **Fair When Empty**: If frame shows no relevant activity, acknowledge this fairly rather than guessing

**5. SPECIFIC EVIDENCE DOCUMENTATION**
For each competency area assessed:
- **Timestamp/Frame Reference**: Frame #${frameNumber}
- **Activity Detected?**: YES/NO - What specific activity (if any) is visible?
- **Detailed Observation**: Exact description of what you see (or state "No relevant activity observable")
- **Evidence Confidence**: How certain you are about the observation
- **Significance**: Why this observation matters for competency assessment (or why assessment cannot be made)

${staffIdentificationInfo}

**ASSESSMENT CONTEXT:**
- **Staff Member Being Assessed**: ${staffName} (${staffRole})
- Competency Focus: ${competencyArea}
- Assessment Type: REAL-TIME LIVE (continuous frame analysis)
- Current Frame: #${frameNumber}

**IDENTITY VERIFICATION (CRITICAL FIRST STEP):**
BEFORE analyzing competency, you MUST:
1. **Identify the person in the frame**: Who is visible? Can you see a name badge, uniform, face, or other identifying features?
2. **Verify if it matches**: Does this person appear to be ${staffName} (the staff member being assessed)?
3. **Note verification status**: 
   - ✅ CONFIRMED: Person matches ${staffName}
   - ⚠️ UNCERTAIN: Cannot confirm identity but continuing assessment
   - ❌ NOT MATCHING: Different person visible - state this clearly
4. **If identity unclear**: Mention this in observations and adjust confidence scores accordingly

**ANALYSIS INSTRUCTIONS:**
1. **STEP 1 - IDENTITY VERIFICATION**: 
   - Identify WHO is in the frame (look for name badge, uniform, face features, or other identifying markers)
   - Verify if this is ${staffName} (the person being assessed)
   - If identity cannot be confirmed or different person is visible, NOTE THIS and adjust assessment accordingly
   
2. **STEP 2 - ACTIVITY DETECTION**: 
   - Determine what is ACTUALLY happening (Clinical work? Communication? Idle? Nothing relevant?)
   - Is ${staffName} actually performing clinical tasks OR just standing/waiting/preparing?
   - Is ${staffName} actually talking/interacting OR silent/alone/not communicating?
   
3. **STEP 3 - DETAILED EXAMINATION**: 
   - Examine the frame pixel-by-pixel for ALL observable details
   - Document EVERY specific element you can identify (posture, hand position, equipment, PPE, communication indicators, etc.)
   - Focus ONLY on ${staffName} if multiple people are visible
   
4. **STEP 4 - FAIR SCORING**: 
   - If ${staffName} is NOT doing clinical work, score Clinical Skills LOW (20-40) (confidence is INDEPENDENT - can be HIGH if you're certain no clinical work is happening)
   - If ${staffName} is NOT communicating, score Communication LOW (20-40) (confidence is INDEPENDENT - can be HIGH if you're certain they're not communicating)
   - Do NOT give high scores (80-100) when no relevant activity is observable
   - Be HONEST: Low activity = Low scores
   
5. **STEP 5 - ASSESSMENT**: 
   - Provide scores ONLY for what you can clearly see and assess for ${staffName}
   - Adjust confidence scores based on: (a) frame quality, (b) identity confirmation, (c) activity level
   - Give specific, actionable feedback based on this exact moment (ONLY if relevant activity is present)
   - Acknowledge limitations: if something cannot be assessed, state that clearly

**SPECIFIC DETECTION REQUIREMENTS:**

**Communication Detection:**
- Look for: Mouth movement (forming words), facial expressions indicating speech, gestures, patient presence in frame
- If talking detected: Describe approach (distance, body orientation, eye contact, leaning in/away)
- If NO talking: State "No communication activity observable" and score Communication 20-40 (confidence is INDEPENDENT - can be HIGH if you're certain they're not talking)

**Clinical Work Detection:**
- Look for: Medical equipment in use, patient care procedures, clinical tasks being performed
- If clinical work detected: Assess technique, accuracy, safety compliance
- If NO clinical work: State "No clinical work observable" and score Clinical Skills 20-40 (confidence is INDEPENDENT - can be HIGH if you're certain no clinical work is happening)

**IMPORTANT REMINDERS:**
- This is a LIVE, REAL-TIME frame - provide immediate, precise feedback
- Accuracy is paramount: base ALL assessments on visible evidence only
- Detail is essential: provide comprehensive observations for what IS observable
- Justice in assessment: be FAIR - if nothing relevant is happening, acknowledge this and score LOW, don't give false positives
- Honesty first: It's better to score low with low confidence when nothing is observable than to guess or assume

Live camera frame image has been provided. Analyze with maximum accuracy, detail, and fairness. Be HONEST about what you can and cannot see.`
    } else if (hasVideo) {
      // Video file analysis
      const videoDataNote = request.videoData 
        ? 'Video data has been provided in base64 format for analysis.' 
        : 'Video URL reference has been provided.'
      
      userPrompt = `**COMPREHENSIVE VIDEO ANALYSIS MODE - DETAILED FRAME-BY-FRAME ASSESSMENT**

You are conducting a thorough, accurate analysis of a complete video recording showing a healthcare worker performing ${competencyArea} tasks.

**CRITICAL: MEDICAL CONTENT DETECTION - THIS IS A MEDICAL EVALUATION SYSTEM**
**STEP 0 - MEDICAL CONTENT VERIFICATION (MUST DO FIRST):**
Before any assessment, you MUST determine if this entire video shows MEDICAL/HEALTHCARE content:
- **Is this Medical/Healthcare Activity?**: YES/NO/PARTIAL/UNCERTAIN
- **Medical Indicators to Look For Throughout Video**:
  * Healthcare setting (hospital, clinic, medical facility, patient room, exam room)
  * Medical equipment (stethoscope, blood pressure cuff, IV equipment, medical monitors, surgical tools, medical devices)
  * Healthcare uniforms (scrubs, lab coats, medical badges, healthcare attire)
  * Patient care activities (patient assessment, medication administration, wound care, vital signs, patient positioning)
  * Medical procedures (injections, dressing changes, medical examinations, clinical assessments)
  * Healthcare documentation (medical charts, electronic health records, medical forms)
  * Medical supplies (gloves, masks, medical bandages, syringes, medical instruments)
  * Patient interaction in medical context (medical history taking, patient education, medical communication)
- **Non-Medical Indicators**:
  * Office work, computer work, paperwork (non-medical administrative tasks)
  * Casual conversation (non-patient related, non-medical)
  * Eating, drinking, personal activities
  * Non-medical equipment (regular office supplies, non-medical tools, non-healthcare items)
  * Non-healthcare environment (office, home, non-medical setting, non-clinical area)
- **Idle/Inactive Indicators** (Person is NOT doing medical work):
  * Person just standing/sitting idle throughout video
  * Person messing around/playing with camera
  * Person not talking/communicating at all
  * Person not performing any medical tasks
  * Person appears inactive or just waiting
  * No medical activity visible in entire video

**IF NOT MEDICAL CONTENT OR IDLE/INACTIVE (or mostly non-medical):**
- **State Clearly**: "This video does NOT show medical/healthcare activities" OR "Video shows person is idle/inactive - no medical work detected" OR "Person is not talking/communicating throughout video"
- **Explain**: Describe what non-medical activities are visible OR that person is idle/messing around/not talking throughout the video
- **Scoring Impact**: 
  * All medical competency scores should be LOW (20-30) (confidence is INDEPENDENT - can be HIGH if you're certain of your assessment)
  * Communication score MUST be 20-30 if person is not talking throughout video (confidence is INDEPENDENT - can be HIGH if you're certain they're not talking)
  * Clinical Skills score MUST be 20-30 if person is not doing medical work throughout video (confidence is INDEPENDENT - can be HIGH if you're certain no medical work is happening)
  * Overall performance score MUST be 1 (Poor) or 2 (Below Average) at most
  * State: "Cannot evaluate medical competencies - video shows non-medical activities" OR "Person is idle/inactive - no medical activity to evaluate"
  * Note: "This evaluation system is designed for medical/healthcare competency assessment only"
  * Provide specific examples of non-medical activities OR idle behavior observed
- **Recommendation**: "Please record actual medical/healthcare activities (patient care, clinical procedures, medical interactions) for accurate medical competency evaluation"

**IF MEDICAL CONTENT:**
- Proceed with full medical competency assessment
- Evaluate all 5 medical competency areas (Hand Hygiene, Patient Identification, Communication, Documentation, Equipment)
- Apply medical standards and healthcare protocols throughout
- Focus on medical/healthcare-specific observations

**IF PARTIAL MEDICAL CONTENT:**
- Assess only the medical portions
- Note which segments are medical vs non-medical
- Score based on medical segments only
- Clearly indicate which parts cannot be evaluated due to non-medical content

**CRITICAL ANALYSIS PRINCIPLES:**
1. **MEDICAL CONTENT FIRST**: Verify this is medical/healthcare content before any assessment
2. **ACCURACY**: Base ALL assessments EXCLUSIVELY on what you can clearly observe in the video
3. **DETAIL**: Provide comprehensive, specific observations with precise descriptions
4. **JUSTICE**: Evaluate fairly and objectively, recognizing both strengths and improvement areas
5. **MEDICAL FOCUS**: This system evaluates MEDICAL competencies only - non-medical content should be noted and scored accordingly

${staffIdentificationInfo}

**ASSESSMENT DETAILS:**
- Video Duration: ${request.duration} seconds
- Competency Focus Area: ${competencyArea}
- **Staff Member Being Assessed**: ${staffName} (${staffRole})
- Analysis Type: Complete Video Recording
- **System Purpose**: MEDICAL/HEALTHCARE competency evaluation only

**IDENTITY VERIFICATION (CRITICAL FIRST STEP):**
BEFORE analyzing competency, you MUST:
1. **Identify the person(s) in the video**: Who is visible? Can you see name badges, uniforms, faces, or other identifying features?
2. **Verify if it matches**: Does the person performing activities appear to be ${staffName} (the staff member being assessed)?
3. **Note verification status**: 
   - ✅ CONFIRMED: Person matches ${staffName}
   - ⚠️ UNCERTAIN: Cannot confirm identity but continuing assessment
   - ❌ NOT MATCHING: Different person visible - state this clearly
4. **Focus assessment**: If multiple people are visible, focus ONLY on ${staffName}. If ${staffName} cannot be identified, note this in your assessment.

**DETAILED FRAME-BY-FRAME ANALYSIS REQUIREMENTS:**

**1. COMPREHENSIVE MOMENT-BY-MOMENT EXAMINATION WITH ACTIVITY DETECTION**
Analyze the ENTIRE video systematically. FIRST detect what activities are actually happening, THEN examine:

**CRITICAL: Identity Verification & Activity Detection Throughout Video**
For EACH significant moment, FIRST determine:
- **Person Identified?**: Can you identify ${staffName} at this moment? (YES/NO/UNCERTAIN - look for name badge, uniform, face, etc.)
- **Clinical Work Present?**: Is ${staffName} actually performing clinical/medical work at this moment?
- **Communication Present?**: Is ${staffName} actually speaking/interacting with patient at this moment?
- **What Activity?**: Clinical procedure / Patient communication / Documentation / Idle/Waiting / Preparation / Non-clinical activity / Not visible

**VERY STRICT FAIR SCORING RULES - MUST FOLLOW:**
- **IF NOT MEDICAL CONTENT**: MAXIMUM score is 30 for ALL areas (confidence is INDEPENDENT - can be HIGH like 85-95% if you're certain it's non-medical) - NEVER give high scores for non-medical
- **IF Person is IDLE/Just Messing Around/Not Doing Anything**: MAXIMUM score is 30 for ALL areas (confidence is INDEPENDENT - can be HIGH like 85-95% if you can clearly see they're idle)
- **IF Person is NOT Talking/Communicating**: Communication score MUST be 20-30 (confidence is INDEPENDENT - can be HIGH like 85-95% if you're certain they're not talking)
- **IF Person is NOT Doing Medical Work**: Clinical Skills score MUST be 20-30 (confidence is INDEPENDENT - can be HIGH like 85-95% if you're certain no medical work is happening)
- If ${staffName} cannot be identified in significant portions: Note this and adjust confidence scores
- If ${staffName} is visible but NO clinical work is happening: Score Clinical Skills LOW (20-30) for those moments, acknowledge "No clinical work observable - person appears idle/inactive"
- If ${staffName} is visible but NO communication is happening: Score Communication LOW (20-30) for those moments, acknowledge "No communication observable - person is not speaking/interacting"
- **NEVER give scores above 50 when no relevant medical activity is happening** - be HONEST and ACCURATE
- **NEVER give scores above 40 for idle/inactive behavior** - person must be actively doing medical work
- **NEVER give scores above 30 for non-medical content** - this is a medical evaluation system
- **IF Just Messing Around/Idle**: Overall performance score MUST be 1 (Poor) or 2 (Below Average) at most
- Focus assessment ONLY on ${staffName} if multiple people are visible
- Movement quality can ONLY be assessed for medical activities - non-medical or idle = N/A, score 20-30

**Clinical Skills Assessment with MEDICAL MOVEMENT ANALYSIS (ONLY when clinical work is visible):**
- **MEDICAL MOVEMENT & TECHNIQUE ANALYSIS** (CRITICAL):
  * **Body Movement Quality Throughout Video**:
    - Smooth, controlled movements (HIGH) vs. jerky, uncontrolled (LOW)
    - Proper body mechanics and ergonomics (HIGH) vs. poor positioning (LOW)
    - Steady, confident movements (HIGH) vs. hesitant, shaky (LOW)
    - Appropriate speed for medical tasks (HIGH) vs. too fast/slow (LOW)
    - Consistent movement quality (HIGH) vs. inconsistent (LOW)
  * **Hand Movement & Dexterity Analysis**:
    - Precise, accurate hand positioning throughout (HIGH) vs. imprecise, clumsy (LOW)
    - Steady hands during procedures (HIGH) vs. tremors, shaking (LOW)
    - Proper finger placement and grip (HIGH) vs. awkward grip (LOW)
    - Smooth hand movements (HIGH) vs. abrupt, rough movements (LOW)
    - Hand-eye coordination (HIGH) vs. poor coordination (LOW)
  * **Overall Movement & Technique Quality Stat**:
    - **HIGH (80-100)**: Smooth, controlled, precise movements throughout; proper medical technique consistently; confident execution; appropriate speed; steady hands; excellent body mechanics
    - **MEDIUM (60-79)**: Generally good movement quality but some areas need improvement; minor hesitations or imprecisions; mostly steady with occasional issues
    - **LOW (Below 60)**: Jerky movements, poor control, imprecise positioning, shaky hands, inappropriate speed, awkward technique, poor body mechanics
    - **N/A**: If non-medical or no medical activity - cannot assess movement quality
- Technical accuracy at each step (hand positioning, movement precision, equipment handling)
- Procedural compliance and sequence adherence
- Technique quality throughout the entire process with movement quality assessment
- Error recognition and correction (if applicable)
- Efficiency and workflow optimization
- Task completion quality
- **If clinical work NOT visible OR Non-Medical OR Idle**: State "Clinical work not observable" or "Non-medical activity" or "Person appears idle" and score 20-30 with confidence based on your uncertainty (not preset to 30) - do NOT give high scores

**Safety & Compliance Assessment:**
- PPE usage throughout (correct donning, wearing, doffing sequences)
- Hand hygiene compliance (specific moments of handwashing, sanitizing)
- Infection control measures (surface disinfection, barrier usage)
- Safety protocol adherence at every step
- Equipment safety and proper handling
- Risk management and awareness

**Communication Assessment (DETAILED when communication is visible):**
- **Is Talking/Communicating?**: Detect actual speech (mouth movement, conversation, interaction)
- **Approach to Patient**: 
  - Distance from patient (close/professional distance/too far)
  - Body orientation (facing patient/angled away/side)
  - Eye contact (direct/maintained/avoiding)
  - Posture (leaning in attentively/upright professional/leaning away)
- **Verbal Communication Quality** (if speech is detectable):
  - Clarity and articulation
  - Appropriateness of language and tone
  - Professionalism in delivery
  - Patient education or instruction quality
- **Non-verbal Communication**:
  - Body language (open/closed, engaged/distant)
  - Eye contact patterns
  - Gestures and hand movements
  - Facial expressions (warm/neutral/concerned)
- **Patient Engagement**: 
  - Empathy indicators
  - Active listening responses
  - Responsiveness to patient cues
- **Cultural Sensitivity and Respect**: Observable signs of respect and cultural awareness
- **Team Communication** (if applicable): Interaction with other staff members
- **If NO Communication Visible OR Person is NOT Talking**: State "No communication/interaction observable - person is not speaking" and score Communication 20-30 with confidence reflecting your uncertainty (not always 30)
- **If Person is Idle/Silent**: Score Communication 20-30 with confidence based on your assessment certainty (varies), state "No communication detected - person appears idle/silent"

**Documentation Assessment (if visible):**
- Accuracy and completeness of documentation
- Timeliness of record-keeping
- Detail level and adherence to standards
- Privacy measures

**2. DETAILED PATTERN RECOGNITION**
Identify and document specific patterns throughout the video:
- **Hand Hygiene Pattern**: Every instance of handwashing, sanitizing, or missed opportunities
- **PPE Sequence Pattern**: Complete donning/doffing sequences, correct order, proper technique
- **Patient Interaction Pattern**: Consistency of communication quality, empathy, engagement
- **Safety Compliance Pattern**: Overall adherence to safety protocols, frequency of compliance
- **Technical Skill Pattern**: Consistency of technique, areas of strength/weakness
- **Workflow Pattern**: Efficiency, organization, time management

**3. PRECISE TIMESTAMP-BASED EVIDENCE DOCUMENTATION**
For EACH significant observation, provide:
- **Exact Timestamp**: Format as MM:SS (e.g., "00:01:30")
- **Detailed Description**: Specific, concrete description of what occurred at that moment
- **Competency Category**: Which area this evidence relates to
- **Quality Assessment**: Whether this demonstrates strength, area for improvement, or compliance/violation
- **Confidence Level**: How certain you are about this observation (0-100)
- **Significance**: Why this moment is important for the overall assessment

**4. ACCURATE AND JUST SCORING METHODOLOGY**
For each competency area:
- **Base Scores ONLY on Observable Evidence**: Every point must be supported by specific video evidence
- **Consider Video Quality**: Adjust confidence scores based on visibility, clarity, and completeness
- **Fair Weighting**: Consider the entire video duration; don't over-weight single moments
- **Balanced Assessment**: Recognize both positive demonstrations and areas needing improvement
- **Context Consideration**: Evaluate within the context of the task complexity and circumstances

**5. COMPREHENSIVE OBSERVATION REQUIREMENTS**
For each competency area, provide:
- **Strengths Observed**: Specific moments demonstrating excellent performance with timestamps
- **Areas for Improvement**: Specific moments showing areas needing development with timestamps
- **Compliance Highlights**: Examples of proper protocol adherence with timestamps
- **Concerns Identified**: Specific safety or quality concerns with timestamps and detailed descriptions
- **Overall Pattern**: Summary of consistent patterns (positive or negative) observed throughout

**6. EVIDENCE INTEGRITY STANDARDS**
- **Only Assess What You Can See**: If something is not visible, state "Not observable in video"
- **Acknowledge Limitations**: Clearly note when video quality or angles limit assessment
- **No Assumptions**: Never infer behaviors not clearly demonstrated in the video
- **Comprehensive Coverage**: Analyze the entire video, not just select moments
- **Balance**: Provide both positive and developmental observations

**7. DETAILED RECOMMENDATIONS**
Based on your comprehensive analysis:
- **Specific Improvements**: Exact actions to improve, referenced to specific video moments
- **Best Practices**: Recommendations based on observed best moments in the video
- **Training Priorities**: Areas requiring focused training based on video evidence
- **Strengths to Maintain**: Positive behaviors to reinforce and build upon

**ANALYSIS PROCESS:**
1. Review the ENTIRE video systematically from start to finish
2. Identify and timestamp EVERY significant moment related to competency assessment
3. Categorize each observation by competency area
4. Provide detailed descriptions for each significant moment
5. Synthesize patterns and overall performance indicators
6. Calculate accurate scores based on comprehensive evidence
7. Generate detailed, actionable recommendations

**CRITICAL REMINDERS:**
- Accuracy: Base ALL assessments on actual video content visible
- Detail: Provide comprehensive, specific observations with timestamps
- Justice: Ensure fair, balanced evaluation recognizing both strengths and improvement needs
- Honesty: Acknowledge when aspects cannot be assessed due to video limitations
- Evidence-Based: Every conclusion must be supported by specific video evidence

${videoDataNote}

**Your analysis must be thorough, accurate, detailed, and just. Analyze every observable moment with precision and fairness.**`
    } else {
      // No video - simulated analysis
      userPrompt = `**COMPREHENSIVE COMPETENCY EVALUATION - DETAILED ASSESSMENT**

Provide a thorough, accurate, detailed, and just competency evaluation for the following scenario:

**ASSESSMENT CONTEXT:**
- Staff Role: ${staffRole}
- Competency Area: ${competencyArea}
- Assessment Duration: ${request.duration} seconds
- Assessment Type: Comprehensive Competency Review

**EVALUATION REQUIREMENTS:**

Since video/audio data is not provided, generate a realistic, comprehensive competency evaluation as if you had analyzed a complete live video feed. Base your assessment on realistic performance expectations and typical professional standards for ${staffRole} performing ${competencyArea} tasks.

**CRITICAL EVALUATION STANDARDS:**
1. **ACCURACY**: Base scores on realistic, evidence-based expectations for this role and competency area
2. **DETAIL**: Provide comprehensive, specific observations, recommendations, and evidence
3. **JUSTICE**: Ensure fair, balanced assessment that recognizes realistic strengths and improvement areas

**REQUIRED ASSESSMENT STRUCTURE:**

Provide a detailed analysis with the following comprehensive structure:

{
  "competencyScores": [
    {
      "category": "Clinical Skills",
      "score": <0-100> (realistic score based on role expectations),
      "confidence": <0-100> (reflects that this is a simulated assessment),
      "observations": [
        "Specific, detailed observation 1 with concrete details",
        "Specific, detailed observation 2 with concrete details",
        "Additional specific observations..."
      ],
      "recommendations": [
        "Actionable, specific recommendation 1 with clear guidance",
        "Actionable, specific recommendation 2 with clear guidance",
        "Additional specific recommendations..."
      ],
      "evidence": [
        {
          "timestamp": "00:01:30",
          "description": "Detailed description of specific competency demonstration moment",
          "confidence": <0-100>
        },
        {
          "timestamp": "00:03:45",
          "description": "Another specific evidence point with detailed description",
          "confidence": <0-100>
        }
      ]
    },
    {
      "category": "Communication",
      "score": <0-100>,
      "confidence": <0-100>,
      "observations": [
        "Specific communication observation 1",
        "Specific communication observation 2",
        "Additional specific observations..."
      ],
      "recommendations": [
        "Specific communication improvement recommendation 1",
        "Specific communication improvement recommendation 2",
        "Additional specific recommendations..."
      ],
      "evidence": [
        {
          "timestamp": "00:02:15",
          "description": "Specific communication evidence with detailed description",
          "confidence": <0-100>
        }
      ]
    },
    {
      "category": "Safety & Compliance",
      "score": <0-100>,
      "confidence": <0-100>,
      "observations": [
        "Specific safety/compliance observation 1",
        "Specific safety/compliance observation 2",
        "Additional specific observations..."
      ],
      "recommendations": [
        "Specific safety improvement recommendation 1",
        "Specific safety improvement recommendation 2",
        "Additional specific recommendations..."
      ],
      "evidence": [
        {
          "timestamp": "00:00:45",
          "description": "Specific safety compliance evidence with detailed description",
          "confidence": <0-100>
        }
      ]
    },
    {
      "category": "Documentation",
      "score": <0-100>,
      "confidence": <0-100>,
      "observations": [
        "Specific documentation observation 1",
        "Specific documentation observation 2",
        "Additional specific observations..."
      ],
      "recommendations": [
        "Specific documentation improvement recommendation 1",
        "Specific documentation improvement recommendation 2",
        "Additional specific recommendations..."
      ],
      "evidence": [
        {
          "timestamp": "00:05:20",
          "description": "Specific documentation evidence with detailed description",
          "confidence": <0-100>
        }
      ]
    }
  ],
  "strengths": [
    "Specific, detailed strength 1 with concrete examples",
    "Specific, detailed strength 2 with concrete examples",
    "Additional specific strengths (3-5 total)"
  ],
  "developmentAreas": [
    "Specific, detailed development area 1 with actionable guidance",
    "Specific, detailed development area 2 with actionable guidance",
    "Additional specific development areas (2-4 total)"
  ],
  "riskFactors": [
    "Specific risk factor 1 (only if identified)",
    "Specific risk factor 2 (only if identified)"
  ]
}

**EVALUATION GUIDELINES:**

1. **Realistic Performance Expectations**: Base your evaluation on standard professional expectations for ${staffRole} performing ${competencyArea} tasks
2. **Comprehensive Detail**: Provide specific, concrete observations rather than generic statements
3. **Fair Assessment**: Ensure balanced evaluation that recognizes both strengths and realistic improvement areas
4. **Actionable Recommendations**: Provide specific, actionable guidance that can be implemented
5. **Evidence-Based Scoring**: Base scores on realistic performance standards for this role and competency area
6. **Confidence Adjustment**: Set confidence levels appropriately lower since this is a simulated assessment (typically 50-70)
7. **Professional Standards**: Align evaluation with healthcare industry standards and best practices

**SPECIFIC REQUIREMENTS:**
- Use realistic scores (typically 70-90 range for competent professionals, with variation based on role)
- Provide 3-5 detailed observations per competency area
- Provide 2-4 specific recommendations per competency area
- Include 2-3 evidence points per competency area with timestamps
- List 3-5 comprehensive strengths
- Identify 2-4 specific development areas
- Only include risk factors if genuine concerns are identified

Base your evaluation on realistic, professional performance expectations for a ${staffRole} performing ${competencyArea} tasks. Provide specific, actionable, detailed feedback that is accurate, comprehensive, and just.`
    }

    // Define Zod schema for AI analysis response
    const aiAnalysisSchema = z.object({
      competencyScores: z.array(
        z.object({
          category: z.string(),
          score: z.number().min(0).max(100), // Maximum is 100% - scores cannot exceed 100
          // AI should provide its own confidence - no default, or use 50 for uncertainty
          // Maximum is 100% - confidence cannot exceed 100
          confidence: z.number().min(0).max(100).optional(),
          observations: z.array(z.string()).optional().default([]),
          recommendations: z.array(z.string()).optional().default([]),
          evidence: z.array(
            z.object({
              timestamp: z.string(),
              description: z.string(),
              confidence: z.number().min(0).max(100)
            })
          ).optional().default([])
        })
      ).min(1).max(10), // Ensure at least 1 score, max 10
      strengths: z.array(z.string()).optional().default([]),
      developmentAreas: z.array(z.string()).optional().default([]),
      riskFactors: z.array(z.string()).optional().default([]),
      trainingRecommendations: z.array(z.string()).optional().default([]),
      overallPerformanceScore: z.number().min(1).max(5).optional(),
      overallPerformanceJustification: z.string().optional()
    })

    // Add explicit JSON structure example to prompt
    const jsonStructureExample = `\n\n**CRITICAL: You MUST return a valid JSON object matching this EXACT structure:**

{
  "competencyScores": [
    {
      "category": "Hand Hygiene",
      "score": 85,
      "confidence": 87,
      "observations": ["observation1", "observation2"],
      "recommendations": ["recommendation1"],
      "evidence": [{"timestamp": "00:01:30", "description": "description", "confidence": 85}]
    },
    {
      "category": "Patient Identification",
      "score": 80,
      "confidence": 82,
      "observations": ["observation1"],
      "recommendations": ["recommendation1"],
      "evidence": [{"timestamp": "00:02:00", "description": "description", "confidence": 80}]
    },
    {
      "category": "Communication",
      "score": 75,
      "confidence": 78,
      "observations": ["observation1"],
      "recommendations": ["recommendation1"],
      "evidence": [{"timestamp": "00:00:45", "description": "description", "confidence": 75}]
    },
    {
      "category": "Documentation",
      "score": 70,
      "confidence": 72,
      "observations": ["observation1"],
      "recommendations": ["recommendation1"],
      "evidence": [{"timestamp": "00:05:20", "description": "description", "confidence": 70}]
    },
    {
      "category": "Equipment",
      "score": 88,
      "confidence": 90,
      "observations": ["observation1"],
      "recommendations": ["recommendation1"],
      "evidence": [{"timestamp": "00:03:15", "description": "description", "confidence": 88}]
    }
  ],
  "strengths": ["strength1", "strength2"],
  "developmentAreas": ["area1", "area2"],
  "riskFactors": ["risk1"],
  "trainingRecommendations": ["Specific training recommendation 1", "Specific training recommendation 2"],
  "overallPerformanceScore": 4,
  "overallPerformanceJustification": "Detailed justification explaining why this score (1-5) was assigned based on all competency areas assessed"
}

**IMPORTANT:**
- Each element in competencyScores MUST be a complete object with category, score, confidence, observations, recommendations, and evidence
- Do NOT mix strings and objects in the competencyScores array
- All scores must be numbers between 0-100
- **CRITICAL - CONFIDENCE VARIATION REQUIRED**: All confidence values must be DIFFERENT numbers between 0-100
  * DO NOT use the same confidence value (like 30) for multiple competencies
  * Each competency MUST have a UNIQUE confidence value based on what you can see
  * Example: Hand Hygiene: 28%, Patient Identification: 32%, Communication: 35%, Documentation: 30%, Equipment: 27%
  * **FORBIDDEN**: All confidences being the same value (like all 30 or all 40)
- overallPerformanceScore must be a number between 1-5 (1=Poor, 2=Below Average, 3=Average, 4=Good, 5=Excellent)
- overallPerformanceJustification must provide detailed explanation for the overall score
- trainingRecommendations must be specific, actionable training or coaching suggestions
- Return ONLY valid JSON - no additional text or formatting`

    // Call OpenAI Medical AI (GPT-4o) using AI SDK with Zod schema
    // Note: OpenAI API key is automatically read from OPENAI_API_KEY environment variable
    // Using GPT-4o with medical AI expertise for healthcare competency evaluation
    console.log(hasVideo ? '🏥 Calling OpenAI Medical AI (GPT-4o) with VIDEO ANALYSIS...' : '🏥 Calling OpenAI Medical AI (GPT-4o) for healthcare competency evaluation...')
    
    // For video analysis, we need to process differently
    // Note: Currently GPT-4o via AI SDK may need video frames extracted
    // For now, we enhance the prompt with video context
    let aiAnalysis: z.infer<typeof aiAnalysisSchema>
    
    if (hasVideo && request.videoData) {
      console.log('Processing video/frame analysis with enhanced accuracy requirements...')
      
      // Enhanced prompt specifically for video/frame accuracy
      // isFrame is already defined above - use it here
      const frameSource = isLiveFrame ? 'live camera feed' : 'extracted from a recorded video'
      const videoAnalysisPrompt = `${systemPrompt}\n\n${userPrompt}\n\n**${isFrame ? 'IMAGE FRAME' : 'VIDEO'} DATA PROVIDED**: ${isFrame ? `A base64 encoded image frame from the ${frameSource}` : 'Base64 encoded video data'} has been included. ${isFrame ? 'Analyze this single frame' : 'Analyze this video frame-by-frame'} with maximum accuracy. Your scores must reflect ONLY what is observable in the actual ${isFrame ? 'frame' : 'video'} content.\n\n**CRITICAL CONFIDENCE REQUIREMENT - NO HARDCODED VALUES**:\n- You MUST provide DIFFERENT confidence values for each competency area based on what YOU can actually see\n- DO NOT use the same confidence value (like 30%) for all competency areas\n- Each competency should have its own confidence: Hand Hygiene might be 28%, Communication might be 35%, Clinical Skills might be 32%, etc.\n- If person is idle: confidence should vary (e.g., 25%, 28%, 32%, 30%, 27%) - NOT all 30%\n- If person is doing medical work: confidence should vary based on clarity (e.g., 75%, 82%, 68%, 90%, 79%)\n- **REQUIRED**: At least 3 different confidence values must be used across the 5 competency areas\n- **FORBIDDEN**: Using the same confidence value (like 30) for all competencies\n\n**CRITICAL SCORING RULES**: If the person in the frame is idle, not doing medical work, not talking, or just sitting/standing doing nothing, you MUST give LOW scores (20-40). 

**CRITICAL CONFIDENCE RULES (INDEPENDENT OF MEDICAL RULES)**: 
- Confidence is INDEPENDENT of whether content is medical or not
- Confidence reflects YOUR certainty in YOUR assessment accuracy (max 100%)
- If you can clearly see the person is idle: confidence can be HIGH (85-95%) because you're very certain of your assessment
- If you can clearly see they're not doing medical work: confidence can be HIGH (85-95%) because you're very certain
- If video is unclear: confidence should be LOW (20-40%) because you're uncertain
- Each competency should have DIFFERENT confidence values based on how certain YOU are (vary them: 25%, 28%, 32%, 30%, 27%, 85%, 90%, etc.)
- DO NOT tie confidence to medical rules - confidence is purely about YOUR certainty in YOUR analysis${jsonStructureExample}`
      
      // For image frames (live camera), use OpenAI Vision API
      // Add retry logic for malformed responses
      let retryCount = 0
      const maxRetries = 2
      let aiAnalysisAttempt: any = null
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`🟢 [AI Analysis] Attempt ${retryCount + 1}/${maxRetries + 1} for ${isLiveFrame ? 'live frame' : 'video'} analysis`)
          
          // For frames (from live camera OR extracted from recorded video), use Vision API with messages format
          if (isFrame && request.videoData) {
            // Use Vision API with image
            const { object } = await generateObject({
              model: openai("gpt-4o"), // Using GPT-4o - OpenAI's most advanced model with medical AI capabilities (max score: 100%)
              schema: aiAnalysisSchema,
              messages: [
                {
                  role: 'system',
                  content: 'You are a MEDICAL AI expert from OpenAI specializing in healthcare competency evaluation. You have deep knowledge of medical protocols, clinical standards, and patient safety requirements. Analyze medical activities with precision and provide accurate, evidence-based assessments.\n\n**SCORING SCALE: 0-100% (Maximum is 100%)**\n- All scores must be between 0-100 (100% is the absolute maximum)\n- All confidence values must be between 0-100 (100% is the absolute maximum)\n\n**CRITICAL CONFIDENCE REQUIREMENT**: You MUST provide DIFFERENT confidence values for each competency area. DO NOT use the same confidence value (like 30%) for all competencies. Each competency should have its own unique confidence based on what you can actually see. For example: Hand Hygiene: 28%, Patient Identification: 32%, Communication: 35%, Documentation: 30%, Equipment: 27%. Using the same confidence for all competencies is FORBIDDEN and indicates you are not properly assessing each area individually.'
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: retryCount > 0 
                        ? `${videoAnalysisPrompt}\n\n**RETRY ATTEMPT**: Please ensure your response is valid JSON with all competencyScores elements as complete objects. Each object must have: category (string), score (number 0-100), confidence (number 0-100), observations (array of strings), recommendations (array of strings), evidence (array of objects with timestamp, description, confidence).`
                        : videoAnalysisPrompt
                    },
                    {
                      type: 'image',
                      image: `data:image/jpeg;base64,${request.videoData}`
                    }
                  ]
                }
              ],
              temperature: 0.3 // Moderate temperature to encourage confidence variation while maintaining medical accuracy
            })
            
            aiAnalysisAttempt = object
          } else {
            // This should not happen - frames should be handled above
            // But if we get here, it means we have video data but no frame
            // Fall back to text-only analysis (less accurate)
            console.warn('⚠️ Video data provided but no frame extracted. Using text-only analysis (less accurate).')
            console.warn('⚠️ For best results, extract a frame from the video on the frontend before sending.')
            
            const { object } = await generateObject({
              model: openai("gpt-4o"), // GPT-4o with medical AI capabilities
              schema: aiAnalysisSchema,
              system: 'You are a medical AI expert specializing in healthcare competency evaluation. You have deep knowledge of medical protocols, clinical standards, and patient safety requirements. Analyze medical activities with precision and provide accurate, evidence-based assessments. When analyzing video content, focus on what is actually visible - if the person is idle, not doing medical work, or not talking, give LOW scores (20-40).',
              prompt: retryCount > 0 
                ? `${videoAnalysisPrompt}\n\n**RETRY ATTEMPT**: Please ensure your response is valid JSON with all competencyScores elements as complete objects. Each object must have: category (string), score (number 0-100), confidence (number 0-100), observations (array of strings), recommendations (array of strings), evidence (array of objects with timestamp, description, confidence).\n\n**CRITICAL**: Without visual data, you cannot accurately assess. Give LOW scores (20-40) with LOW confidence (20-40) since you cannot see what actually happened.`
                : `${videoAnalysisPrompt}\n\n**CRITICAL**: Video data was provided but no frame image is available. Without visual data, you cannot accurately assess medical competencies. Give LOW scores (20-40) with LOW confidence (20-40) and state that visual analysis is required for accurate evaluation.`,
              temperature: 0.3 // Moderate temperature to encourage confidence variation while maintaining medical accuracy
            })
            
            aiAnalysisAttempt = object
          }
          
          break // Success, exit retry loop
        } catch (error: any) {
          console.error(`❌ [AI Analysis] Attempt ${retryCount + 1} failed:`, error?.message || error?.cause?.message)
          
          if (retryCount < maxRetries && (error?.name === 'AI_NoObjectGeneratedError' || error?.cause?.name === 'ZodError')) {
            retryCount++
            console.log(`🔄 [AI Analysis] Retrying... (${retryCount}/${maxRetries})`)
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            continue
          } else {
            // Max retries reached or different error, throw
            throw error
          }
        }
      }
      
      if (!aiAnalysisAttempt) {
        throw new Error('Failed to generate valid AI analysis after retries')
      }
      
      aiAnalysis = aiAnalysisAttempt
    } else {
      // No video - standard analysis
      const standardPrompt = `${systemPrompt}\n\n${userPrompt}${jsonStructureExample}`
      
      let retryCount = 0
      const maxRetries = 2
      let aiAnalysisAttempt: any = null
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`🟢 [AI Analysis] Attempt ${retryCount + 1}/${maxRetries + 1} for standard analysis`)
          
          const { object } = await generateObject({
              model: openai("gpt-4o"), // Using GPT-4o - OpenAI's most advanced model with medical AI capabilities (max score: 100%)
            schema: aiAnalysisSchema,
              system: 'You are a MEDICAL AI expert from OpenAI specializing in healthcare competency evaluation. You have deep knowledge of medical protocols, clinical standards, and patient safety requirements. Analyze medical activities with precision and provide accurate, evidence-based assessments.\n\n**SCORING SCALE: 0-100% (Maximum is 100%)**\n- All scores must be between 0-100 (100% is the absolute maximum)\n- All confidence values must be between 0-100 (100% is the absolute maximum)',
            prompt: retryCount > 0
              ? `${standardPrompt}\n\n**RETRY ATTEMPT**: Please ensure your response is valid JSON with all competencyScores elements as complete objects.`
              : standardPrompt,
            temperature: 0.3 // Moderate temperature to encourage confidence variation while maintaining medical accuracy
          })
          
          aiAnalysisAttempt = object
          break // Success, exit retry loop
        } catch (error: any) {
          console.error(`❌ [AI Analysis] Attempt ${retryCount + 1} failed:`, error?.message || error?.cause?.message)
          
          if (retryCount < maxRetries && (error?.name === 'AI_NoObjectGeneratedError' || error?.cause?.name === 'ZodError')) {
            retryCount++
            console.log(`🔄 [AI Analysis] Retrying... (${retryCount}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            continue
          } else {
            throw error
          }
        }
      }
      
      if (!aiAnalysisAttempt) {
        throw new Error('Failed to generate valid AI analysis after retries')
      }
      
      aiAnalysis = aiAnalysisAttempt
    }
    
      console.log('🏥 OpenAI Medical AI analysis completed successfully', hasVideo ? '(with video analysis)' : '(standard healthcare competency evaluation)')

    // Transform OpenAI response to our format
    // With Zod schema, data is already validated and typed correctly
    const competencyScores: CompetencyScore[] = aiAnalysis.competencyScores.map((score) => ({
      category: score.category,
      score: Math.min(100, Math.max(0, score.score)),
      // Use AI-provided confidence, or 50 if not provided (indicates uncertainty)
      // Do NOT use high default like 85 - let AI determine its own confidence
      // Log if AI didn't provide confidence
      confidence: (() => {
        const aiConfidence = score.confidence ?? 50
        if (!score.confidence) {
          console.warn(`⚠️ AI did not provide confidence for ${score.category}, using default 50`)
        }
        return Math.min(100, Math.max(0, aiConfidence))
      })(),
      observations: score.observations || [],
      recommendations: score.recommendations || [],
      evidence: score.evidence || []
    }))

    // Calculate overall score (weighted average by confidence)
    const overallScore = competencyScores.length > 0
      ? Math.round(
          competencyScores.reduce((sum, s) => sum + (s.score * (s.confidence / 100)), 0) /
          competencyScores.reduce((sum, s) => sum + (s.confidence / 100), 0)
        )
      : 85

    // Calculate average AI confidence from competency scores
    // IMPORTANT: This should be based on ACTUAL AI-provided confidence, not hardcoded
    // AI confidence reflects how confident the AI is in its analysis accuracy
    console.log('🔍 Calculating AI confidence from competency scores:', {
      scoresCount: competencyScores.length,
      confidences: competencyScores.map(s => ({ category: s.category, confidence: s.confidence }))
    })
    
    // Check if all confidences are the same (indicates hardcoded values)
    const uniqueConfidences = new Set(competencyScores.map(s => s.confidence))
    if (uniqueConfidences.size === 1 && competencyScores.length > 1) {
      const sameValue = Array.from(uniqueConfidences)[0]
      console.warn(`⚠️ WARNING: All competency confidences are the same (${sameValue}%) - this suggests hardcoded values!`)
      console.warn(`⚠️ AI should provide VARIED confidence values based on what it can see for each competency`)
      console.warn(`⚠️ Expected: Different values like 28%, 32%, 35%, 30%, 27% - NOT all ${sameValue}%`)
    } else {
      console.log(`✅ Good: Found ${uniqueConfidences.size} different confidence values - AI is providing varied assessments`)
    }
    
    const avgConfidence = competencyScores.length > 0
      ? Math.round(competencyScores.reduce((sum, s) => sum + s.confidence, 0) / competencyScores.length)
      : 50 // Lower default (50) if no scores - indicates uncertainty, not hardcoded high value
    
    console.log('✅ Calculated average AI confidence:', avgConfidence, '%')

    // Extract strengths and development areas (already validated by Zod)
    const strengths = aiAnalysis.strengths || []
    const developmentAreas = aiAnalysis.developmentAreas || []
    const riskFactors = aiAnalysis.riskFactors || []
    const trainingRecommendations = aiAnalysis.trainingRecommendations || []
    const overallPerformanceScore = aiAnalysis.overallPerformanceScore
    const overallPerformanceJustification = aiAnalysis.overallPerformanceJustification || ''

    return {
      evaluationId: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      staffId: request.staffId,
      overallScore,
      competencyScores,
      riskFactors,
      strengths: strengths.slice(0, 5),
      developmentAreas: developmentAreas.slice(0, 4),
      trainingRecommendations: trainingRecommendations.slice(0, 6),
      overallPerformanceScore,
      overallPerformanceJustification,
      aiConfidence: avgConfidence, // Average confidence from all competency score assessments
      evaluationTime: request.duration,
      timestamp: new Date().toISOString(),
      status: "completed",
    };
  } catch (error: any) {
    console.error('OpenAI API Error:', error)
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      cause: error?.cause
    })
    // Fall back to mock analysis if OpenAI fails
    console.log('Falling back to mock analysis due to OpenAI error')
    return await performMockAIAnalysis(request)
  }
}

// Mock AI analysis function (fallback) - NOW WITH STRICT RULES
async function performMockAIAnalysis(request: EvaluationRequest): Promise<AIEvaluationResult> {
  // Simulate AI processing time
  await new Promise((resolve) => setTimeout(resolve, 2000))

  console.warn('⚠️ USING MOCK ANALYSIS - OpenAI API key not configured or API failed')
  console.warn('⚠️ Mock analysis will give LOW scores (20-30) to ensure accuracy')
  console.warn('⚠️ To enable real AI analysis, configure OPENAI_API_KEY in .env.local')

  // IMPORTANT: Mock analysis follows STRICT RULES - gives LOW scores by default
  // This ensures accuracy - mock cannot properly analyze video, so it gives conservative low scores
  // Only real AI can properly detect medical activity vs idle/non-medical content

  // Check if video data was provided - if yes, we can't analyze it in mock mode, so give low scores
  const hasVideoData = !!(request.videoData || request.videoUrl)
  
  // For mock analysis, we give LOW scores (20-30) because:
  // 1. We cannot actually analyze video content without real AI
  // 2. Better to be conservative and give low scores than false high scores
  // 3. This encourages users to configure OpenAI for real analysis
  
  const baseScore = hasVideoData ? 25 : 30 // Lower if video was provided but can't be analyzed
  const baseConfidence = 30 // Low confidence for mock analysis

  // Generate mock competency scores with LOW scores (following strict rules)
  const competencyScores: CompetencyScore[] = [
    {
      category: "Hand Hygiene",
      score: Math.round(baseScore + Math.random() * 5), // 25-30 range
      confidence: baseConfidence,
      observations: [
        "⚠️ MOCK ANALYSIS: Cannot properly evaluate without real AI. Configure OpenAI API key for accurate analysis.",
        "Video analysis requires real AI - mock mode gives conservative scores",
      ],
      recommendations: [
        "Configure OPENAI_API_KEY in .env.local for real AI analysis",
        "Real AI can properly detect hand hygiene compliance from video",
      ],
      evidence: [],
    },
    {
      category: "Patient Identification",
      score: Math.round(baseScore + Math.random() * 5), // 25-30 range
      confidence: baseConfidence,
      observations: [
        "⚠️ MOCK ANALYSIS: Cannot properly evaluate without real AI",
        "Real AI needed to detect patient identification protocols in video",
      ],
      recommendations: [
        "Enable real AI analysis for accurate patient identification assessment",
      ],
      evidence: [],
    },
    {
      category: "Communication",
      score: Math.round(baseScore + Math.random() * 5), // 25-30 range
      confidence: baseConfidence,
      observations: [
        "⚠️ MOCK ANALYSIS: Cannot detect if person is talking/communicating without real AI",
        "Real AI needed to analyze communication in video",
      ],
      recommendations: [
        "Configure OpenAI API for real communication analysis",
      ],
      evidence: [],
    },
    {
      category: "Documentation",
      score: Math.round(baseScore + Math.random() * 5), // 25-30 range
      confidence: baseConfidence,
      observations: [
        "⚠️ MOCK ANALYSIS: Cannot evaluate documentation without real AI",
      ],
      recommendations: [
        "Enable real AI for documentation assessment",
      ],
      evidence: [],
    },
    {
      category: "Equipment",
      score: Math.round(baseScore + Math.random() * 5), // 25-30 range
      confidence: baseConfidence,
      observations: [
        "⚠️ MOCK ANALYSIS: Cannot evaluate equipment usage without real AI",
      ],
      recommendations: [
        "Configure OpenAI API for real equipment usage analysis",
      ],
      evidence: [],
    },
  ]

  // Calculate overall score (will be low - 25-30 range)
  const overallScore = Math.round(
    competencyScores.reduce((sum, score) => sum + score.score, 0) / competencyScores.length,
  )

  // Generate AI insights - MOCK MODE (low scores)
  const strengths: string[] = [] // No strengths in mock mode - cannot properly evaluate
  const developmentAreas = [
    "⚠️ MOCK ANALYSIS MODE: Configure OpenAI API key for real AI analysis",
    "Real AI analysis required to properly evaluate medical competencies",
    "Video analysis cannot be performed without OpenAI API",
  ]

  const riskFactors = [
    "⚠️ Using mock analysis - real AI not configured",
    "Cannot properly evaluate medical competencies without real AI",
    "Configure OPENAI_API_KEY for accurate assessment"
  ]

  // Generate training recommendations - focused on enabling real AI
  const trainingRecommendations = [
    "⚠️ CRITICAL: Configure OPENAI_API_KEY in .env.local file",
    "Enable real AI analysis for accurate medical competency evaluation",
    "Real AI can properly detect medical activity vs idle/non-medical content",
    "Without real AI, accurate evaluation is not possible",
    "See OPENAI_SETUP.md for configuration instructions"
  ]

  // Calculate overall performance score (1-5) - MOCK MODE gives LOW score
  // Since mock cannot analyze video, it gives score 1 (Poor) to indicate analysis not possible
  const overallPerformanceScore = 1
  const overallPerformanceJustification = `⚠️ MOCK ANALYSIS MODE (Score: 1 - Poor). Cannot properly evaluate medical competencies without real AI analysis. Overall score of ${overallScore}% reflects that mock analysis cannot accurately assess video content. To get accurate evaluation: 1) Configure OPENAI_API_KEY in .env.local file, 2) Restart the server, 3) Real AI will properly detect medical activity, communication, and give accurate scores based on actual video content. Mock mode gives conservative low scores to avoid false positives.`

  return {
    evaluationId: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    staffId: request.staffId,
    overallScore,
    competencyScores,
    riskFactors,
    strengths: strengths.slice(0, 4),
    developmentAreas: developmentAreas.slice(0, 3),
    trainingRecommendations: trainingRecommendations.slice(0, 6),
    overallPerformanceScore,
    overallPerformanceJustification,
    // Calculate average confidence from competency scores (all are 30 in mock mode)
    aiConfidence: Math.round(
      competencyScores.length > 0
        ? competencyScores.reduce((sum, s) => sum + s.confidence, 0) / competencyScores.length
        : 30 // Mock mode default
    ),
    evaluationTime: request.duration,
    timestamp: new Date().toISOString(),
    status: "completed",
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if request contains FormData (video upload)
    const contentType = request.headers.get('content-type') || ''
    let body: EvaluationRequest
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData with video file or live camera frame
      const formData = await request.formData()
      const videoFile = formData.get('video') as File | null
      const frameImage = formData.get('frameImage') as File | null
      const isLiveFrame = formData.get('isLiveFrame') === 'true'
      
      body = {
        staffId: formData.get('staffId') as string,
        evaluatorId: formData.get('evaluatorId') as string,
        evaluationType: (formData.get('evaluationType') as 'live' | 'recorded') || (isLiveFrame ? 'live' : 'recorded'),
        competencyArea: formData.get('competencyArea') as string || undefined,
        duration: parseInt(formData.get('duration') as string) || (isLiveFrame ? 10 : 600),
        notes: formData.get('notes') as string || undefined,
        videoUrl: undefined,
      }

      // Process frame image (from live camera OR extracted from recorded video)
      if (frameImage) {
        const frameSource = isLiveFrame ? 'live camera' : 'extracted from recorded video'
        console.log(`📸 Frame image received (${frameSource}):`, frameImage.name, frameImage.size, 'bytes')
        // Convert frame image to base64 for OpenAI Vision
        const arrayBuffer = await frameImage.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        body.videoData = buffer.toString('base64') // Frame image data for OpenAI Vision API
        body.videoUrl = isLiveFrame ? `live_frame_${Date.now()}.jpg` : `video_frame_${Date.now()}.jpg`
        console.log(`✅ Frame prepared for OpenAI Vision API analysis (${frameSource})`)
        
        // If this is from a recorded video, we have the frame, so we can proceed
        // The video file is also sent but Vision API will use the frame image
        if (!isLiveFrame && videoFile) {
          console.log('📹 Recorded video file also provided (for reference):', videoFile.size, 'bytes')
        }
      }
      // Process video file if provided
      else if (videoFile) {
        console.log('📹 VIDEO FILE RECEIVED:', {
          name: videoFile.name,
          size: videoFile.size,
          type: videoFile.type,
          sizeMB: (videoFile.size / (1024 * 1024)).toFixed(2)
        })
        
        // VERIFY: Check if video is actually valid
        if (videoFile.size < 1000) {
          console.error('❌ ERROR: Video file is too small (', videoFile.size, 'bytes). This suggests no actual video was recorded.')
          return NextResponse.json({ 
            error: "Invalid video: Video file is too small. Please ensure you actually recorded video content before stopping recording.",
            details: `Video size: ${videoFile.size} bytes (expected at least 10KB for a valid recording)`
          }, { status: 400 })
        }
        
        // Convert video to base64 for OpenAI Vision API
        console.log('🔄 Converting video to base64 for OpenAI Medical AI analysis...')
        const arrayBuffer = await videoFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        body.videoData = buffer.toString('base64')
        body.videoUrl = `video_${Date.now()}_${videoFile.name}`
        
        console.log('✅ Video data prepared for OpenAI Medical AI:', {
          base64Length: body.videoData.length,
          videoUrl: body.videoUrl,
          willSendToOpenAI: true
        })
        
        // Update duration based on video if available
        // Note: In production, you'd extract actual video duration using ffmpeg or similar
      }

    // Validate request
      if (!body.staffId) {
        return NextResponse.json({ error: "Missing required field: staffId" }, { status: 400 })
      }
    } else {
      // Handle JSON request (no video)
      body = await request.json()

      // Validate request
      if (!body.staffId) {
        return NextResponse.json({ error: "Missing required field: staffId" }, { status: 400 })
      }
    }

    // Check if this is a finalization request
    const finalizeAssessment = body.finalizeAssessment === true && body.assessmentId
    
    // Perform AI analysis (with video if provided)
    console.log('🔍 Starting AI analysis...', {
      hasVideo: !!(body.videoData || body.videoUrl),
      evaluationType: body.competencyArea,
      openaiConfigured: !!(openaiApiKey && openaiApiKey.trim() !== '')
    })
    const result = await performAIAnalysis(body)
    console.log('✅ AI analysis completed', {
      overallScore: result.overallScore,
      overallPerformanceScore: result.overallPerformanceScore,
      isMock: result.overallPerformanceJustification?.includes('MOCK ANALYSIS')
    })
    
    // If finalizing, update existing assessment instead of creating new
    if (finalizeAssessment) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      
      const { data: updated } = await supabase
        .from('staff_ai_assessments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          overall_score: result.overallScore,
          ai_confidence: result.aiConfidence
        })
        .eq('id', body.assessmentId)
        .select()
        .single()
      
      if (updated) {
        return NextResponse.json({
          success: true,
          data: { ...result, evaluationId: updated.id },
          message: "Live assessment finalized successfully",
        })
      }
    }

    // Store results in database
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    try {
      // Validate UUIDs - check if they're valid UUID format
      const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(str)
      }

      // Get actual UUID from staff if needed
      let staffIdUuid = body.staffId
      let evaluatorIdUuid = body.evaluatorId || null
      
      // If staffId is not a UUID, try to find the staff record to get valid UUID
      if (!isValidUUID(body.staffId)) {
        console.log(`staffId "${body.staffId}" is not a valid UUID, attempting to resolve...`)
        
        // Try to find staff by the provided ID first (in case it's stored differently)
        let staffMember = null
        
        // Try direct ID match
        const { data: directMatch } = await supabase
          .from('staff')
          .select('id')
          .eq('id', body.staffId)
          .maybeSingle()
        
        if (directMatch) {
          staffMember = directMatch
        } else {
          // Try email match
          const { data: emailMatch } = await supabase
            .from('staff')
            .select('id')
            .eq('email', body.staffId)
            .maybeSingle()
          
          if (emailMatch) {
            staffMember = emailMatch
          } else {
            // Try as text/numeric ID conversion - check if staff table has non-UUID ids
            // Get all staff and see if any match
            const { data: allStaff } = await supabase
              .from('staff')
              .select('id')
              .limit(100)
            
            // If still not found, check if it might be an index
            const numericId = parseInt(body.staffId, 10)
            if (!isNaN(numericId) && allStaff && allStaff.length > numericId - 1) {
              staffMember = allStaff[numericId - 1]
            }
          }
        }
        
        if (staffMember?.id && isValidUUID(staffMember.id)) {
          staffIdUuid = staffMember.id
          console.log(`Resolved staffId to UUID: ${staffIdUuid}`)
        } else {
          // If still not found, log warning and skip save but still return success
          console.warn(`Could not resolve staffId to UUID: ${body.staffId}, skipping database save`)
          // Still return success - AI assessment completed, just not saved to DB
          return NextResponse.json({
            success: true,
            data: result,
            message: "AI competency evaluation completed successfully (not saved - could not resolve staff ID to UUID)",
          })
        }
      }

      // If evaluatorId is not a UUID, set to null
      if (evaluatorIdUuid && !isValidUUID(evaluatorIdUuid)) {
        evaluatorIdUuid = null
      }

      // Validate competencyEvaluationId if provided
      let competencyEvalId = body.competencyEvaluationId || null
      if (competencyEvalId && !isValidUUID(competencyEvalId)) {
        competencyEvalId = null
      }

      // Create AI assessment record
      // For live frames, we update existing assessment or create new one
      const assessmentData: any = {
        staff_id: staffIdUuid,
        competency_evaluation_id: competencyEvalId,
        evaluator_id: evaluatorIdUuid,
        assessment_type: body.evaluationType,
        competency_area: body.competencyArea || 'general',
        overall_score: result.overallScore,
        ai_confidence: result.aiConfidence,
        evaluation_time: body.duration,
        video_url: body.videoUrl || null,
        status: body.evaluationType === 'live' ? 'in_progress' : 'completed',
        notes: body.notes || null
      }
      
      // Only set completed_at if not live
      if (body.evaluationType !== 'live') {
        assessmentData.completed_at = new Date().toISOString()
      }

      // For live frames, check if there's an existing assessment in progress
      let assessment = null
      if (body.evaluationType === 'live' && body.videoUrl?.includes('live_frame')) {
        const frameNumber = parseInt(body.notes?.match(/Frame (\d+)/)?.[1] || '0')
        if (frameNumber === 1) {
          // First frame - create new assessment
          const { data: newAssessment, error: newError } = await supabase
            .from('staff_ai_assessments')
            .insert({
              ...assessmentData,
              status: 'in_progress'
            })
            .select()
            .single()
          
          if (!newError && newAssessment) {
            assessment = newAssessment
            console.log('Created new live assessment record:', assessment.id)
          } else {
            console.error('Error creating live assessment:', newError)
            // Log detailed error for debugging
            if (newError) {
              console.error('Error details:', {
                code: newError.code,
                message: newError.message,
                details: newError.details,
                hint: newError.hint
              })
            }
            // Continue processing even if DB save fails - return AI result anyway
          }
        } else {
          // Subsequent frames - find existing assessment
          const { data: existing } = await supabase
            .from('staff_ai_assessments')
            .select('*')
            .eq('staff_id', staffIdUuid)
            .eq('assessment_type', 'live')
            .eq('status', 'in_progress')
            .eq('competency_area', body.competencyArea || 'general')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (existing) {
            assessment = existing
            // Update existing assessment
            const { data: updated } = await supabase
              .from('staff_ai_assessments')
              .update({
                overall_score: result.overallScore,
                ai_confidence: result.aiConfidence,
                evaluation_time: (existing.evaluation_time || 0) + body.duration
              })
              .eq('id', existing.id)
              .select()
              .single()
            
            if (updated) {
              assessment = updated
              console.log('Updated live assessment record:', assessment.id)
            }
          }
        }
      } else {
        // Regular assessment - create new record
        const { data: newAssessment, error: assessmentError } = await supabase
          .from('staff_ai_assessments')
          .insert(assessmentData)
          .select()
          .single()

        if (!assessmentError && newAssessment) {
          assessment = newAssessment
          console.log('Created new AI assessment record:', assessment.id)
        } else {
          console.error('Error saving AI assessment:', assessmentError)
          // Log detailed error for debugging
          if (assessmentError) {
            console.error('Error details:', {
              code: assessmentError.code,
              message: assessmentError.message,
              details: assessmentError.details,
              hint: assessmentError.hint
            })
          }
          // Continue anyway - return result even if save fails
        }
      }

      if (assessment) {
        // Save detailed scores
        for (const score of result.competencyScores) {
          const { data: scoreRecord } = await supabase
            .from('staff_ai_assessment_scores')
            .insert({
              assessment_id: assessment.id,
              category: score.category,
              score: score.score,
              confidence: score.confidence
            })
            .select()
            .single()

          // Save observations
          if (score.observations && score.observations.length > 0) {
            for (const observation of score.observations) {
              await supabase
                .from('staff_ai_observations')
                .insert({
                  assessment_id: assessment.id,
                  category: score.category,
                  observation: observation,
                  confidence: score.confidence
                })
            }
          }

          // Save recommendations
          if (score.recommendations && score.recommendations.length > 0) {
            for (const recommendation of score.recommendations) {
              await supabase
                .from('staff_ai_recommendations')
                .insert({
                  assessment_id: assessment.id,
                  category: score.category,
                  recommendation: recommendation,
                  type: 'improvement'
                })
            }
          }

          // Save evidence
          if (score.evidence && score.evidence.length > 0) {
            for (const evidence of score.evidence) {
              await supabase
                .from('staff_ai_evidence')
                .insert({
                  assessment_id: assessment.id,
                  score_id: scoreRecord?.id || null,
                  timestamp: evidence.timestamp,
                  description: evidence.description,
                  confidence: evidence.confidence
                })
            }
          }
        }

        // Save strengths and development areas as recommendations
        if (result.strengths && result.strengths.length > 0) {
          for (const strength of result.strengths) {
            await supabase
              .from('staff_ai_recommendations')
              .insert({
                assessment_id: assessment.id,
                category: 'Overall',
                recommendation: strength,
                type: 'strength'
              })
          }
        }

        if (result.developmentAreas && result.developmentAreas.length > 0) {
          for (const area of result.developmentAreas) {
            await supabase
              .from('staff_ai_recommendations')
              .insert({
                assessment_id: assessment.id,
                category: 'Overall',
                recommendation: area,
                type: 'improvement'
              })
          }
        }

        // Update result with database ID
        result.evaluationId = assessment.id
      }
    } catch (error) {
      console.error('Error storing AI assessment:', error)
      // Continue - return result even if storage fails
    }

    // Check if mock analysis was used
    const isMockMode = result.overallPerformanceJustification?.includes('MOCK ANALYSIS') || 
                       result.competencyScores[0]?.observations?.some((obs: string) => obs.includes('MOCK ANALYSIS'))

    return NextResponse.json({
      success: true,
      data: result,
      evaluationId: result.evaluationId || null, // Include AI assessment ID for saving to competency
      message: isMockMode 
        ? "⚠️ MOCK ANALYSIS MODE: OpenAI API key not configured. Configure OPENAI_API_KEY in .env.local for real AI analysis. Mock mode gives low scores (20-30) to ensure accuracy."
        : "AI competency evaluation completed successfully",
      isMockMode: isMockMode
    })
  } catch (error) {
    console.error("AI Competency Evaluation Error:", error)
    return NextResponse.json(
      {
        error: "Failed to process AI competency evaluation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const evaluationId = searchParams.get("evaluationId")
    const staffId = searchParams.get("staffId")
    const limit = parseInt(searchParams.get("limit") || "10")

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    if (evaluationId) {
      // Return specific evaluation with all details
      const { data: assessment, error } = await supabase
        .from('staff_ai_assessments')
        .select(`
          *,
          scores:staff_ai_assessment_scores(*),
          observations:staff_ai_observations(*),
          recommendations:staff_ai_recommendations(*),
          evidence:staff_ai_evidence(*)
        `)
        .eq('id', evaluationId)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!assessment) {
        return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
      }

      // Transform to match API format
      const competencyScores = (assessment.scores || []).map((score: any) => ({
        category: score.category,
        score: parseFloat(score.score),
        confidence: parseFloat(score.confidence || 0),
        observations: (assessment.observations || [])
          .filter((obs: any) => obs.category === score.category)
          .map((obs: any) => obs.observation),
        recommendations: (assessment.recommendations || [])
          .filter((rec: any) => rec.category === score.category)
          .map((rec: any) => rec.recommendation),
        evidence: (assessment.evidence || [])
          .filter((ev: any) => ev.score_id === score.id)
          .map((ev: any) => ({
            timestamp: ev.timestamp,
            description: ev.description,
            confidence: parseFloat(ev.confidence || 0)
          }))
      }))

      return NextResponse.json({
        success: true,
        data: {
          evaluationId: assessment.id,
          staffId: assessment.staff_id,
          overallScore: parseFloat(assessment.overall_score || 0),
          competencyScores,
          riskFactors: (assessment.recommendations || [])
            .filter((r: any) => r.type === 'improvement')
            .map((r: any) => r.recommendation),
          strengths: (assessment.recommendations || [])
            .filter((r: any) => r.type === 'strength')
            .map((r: any) => r.recommendation),
          developmentAreas: (assessment.recommendations || [])
            .filter((r: any) => r.type === 'improvement')
            .slice(0, 3)
            .map((r: any) => r.recommendation),
          aiConfidence: parseFloat(assessment.ai_confidence || 0),
          evaluationTime: assessment.evaluation_time,
          timestamp: assessment.completed_at || assessment.created_at,
          status: assessment.status,
          competencyArea: assessment.competency_area
        }
      })
    }

    if (staffId) {
      // Return evaluation history for staff member
      const { data: assessments, error } = await supabase
        .from('staff_ai_assessments')
        .select('*')
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: {
          staffId,
          evaluations: (assessments || []).map((assessment: any) => ({
            id: assessment.id,
            overallScore: parseFloat(assessment.overall_score || 0),
            aiConfidence: parseFloat(assessment.ai_confidence || 0),
            competencyArea: assessment.competency_area,
            evaluationTime: assessment.evaluation_time,
            status: assessment.status,
            completedAt: assessment.completed_at,
            createdAt: assessment.created_at
          }))
        },
      })
    }

    return NextResponse.json({ error: "Missing required parameter: evaluationId or staffId" }, { status: 400 })
  } catch (error) {
    console.error("Get Evaluation Error:", error)
    return NextResponse.json({ error: "Failed to retrieve evaluation data" }, { status: 500 })
  }
}
