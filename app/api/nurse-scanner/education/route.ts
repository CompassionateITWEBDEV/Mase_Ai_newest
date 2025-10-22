import { type NextRequest, NextResponse } from "next/server"

interface EducationContent {
  id: string
  category: string
  title: string
  content: string
  tips: string[]
  warnings: string[]
  resources: string[]
  lastUpdated: string
  tags: string[]
}

interface EducationResponse {
  success: boolean
  education?: EducationContent[]
  message: string
  total: number
}

export async function GET(request: NextRequest): Promise<NextResponse<EducationResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const medication = searchParams.get("medication")
    const search = searchParams.get("search")

    console.log(`Fetching education content - Category: ${category}, Medication: ${medication}, Search: ${search}`)

    // Simulate database query
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Comprehensive medication education database
    const educationDatabase: EducationContent[] = [
      {
        id: "EDU-001",
        category: "Diabetes Medications",
        title: "Metformin Administration and Monitoring",
        content:
          "Metformin is the first-line medication for Type 2 diabetes mellitus. It works primarily by decreasing hepatic glucose production and improving peripheral insulin sensitivity. It does not cause hypoglycemia when used alone.",
        tips: [
          "Administer with meals to reduce gastrointestinal side effects",
          "Start with low dose (500mg once or twice daily) and titrate gradually",
          "Monitor kidney function (eGFR) before starting and periodically",
          "Check vitamin B12 levels annually due to potential deficiency",
          "Educate patients about signs of lactic acidosis (rare but serious)",
        ],
        warnings: [
          "Contraindicated in severe kidney disease (eGFR < 30 mL/min/1.73m²)",
          "Hold 48 hours before and after contrast procedures",
          "Discontinue if patient develops acute illness with dehydration",
          "Monitor for signs of lactic acidosis: muscle pain, difficulty breathing, stomach pain",
          "Use caution in elderly patients and those with liver disease",
        ],
        resources: [
          "ADA Standards of Medical Care in Diabetes",
          "Metformin Patient Education Handout",
          "Lactic Acidosis Recognition Guide",
          "Diabetes Self-Management Education Materials",
        ],
        lastUpdated: "2024-01-15T00:00:00Z",
        tags: ["diabetes", "metformin", "biguanide", "first-line", "monitoring"],
      },
      {
        id: "EDU-002",
        category: "Cardiovascular Medications",
        title: "ACE Inhibitors: Clinical Considerations",
        content:
          "ACE inhibitors like lisinopril are cornerstone therapy for hypertension, heart failure, and diabetic nephropathy. They block the conversion of angiotensin I to angiotensin II, reducing vasoconstriction and aldosterone secretion.",
        tips: [
          "Take at the same time daily for consistent blood pressure control",
          "Monitor blood pressure regularly, especially during dose adjustments",
          "Check serum potassium and creatinine within 1-2 weeks of starting",
          "Educate about dry cough (10-15% incidence) - usually resolves with discontinuation",
          "Take first dose at bedtime to minimize first-dose hypotension",
        ],
        warnings: [
          "Risk of hyperkalemia - monitor potassium levels regularly",
          "Angioedema is rare (0.1-0.7%) but potentially life-threatening",
          "Contraindicated in pregnancy - can cause fetal harm",
          "Use caution in patients with bilateral renal artery stenosis",
          "May cause acute kidney injury in volume-depleted patients",
        ],
        resources: [
          "AHA/ACC Hypertension Guidelines",
          "ACE Inhibitor Patient Counseling Points",
          "Angioedema Recognition and Management",
          "Blood Pressure Monitoring Log",
        ],
        lastUpdated: "2024-01-15T00:00:00Z",
        tags: ["hypertension", "heart failure", "ace inhibitor", "lisinopril", "cardiovascular"],
      },
      {
        id: "EDU-003",
        category: "Anticoagulation",
        title: "Warfarin Management and Monitoring",
        content:
          "Warfarin is a vitamin K antagonist used for anticoagulation in atrial fibrillation, venous thromboembolism, and mechanical heart valves. It requires careful monitoring due to narrow therapeutic window and multiple drug interactions.",
        tips: [
          "Take at the same time each day, preferably in the evening",
          "Maintain consistent vitamin K intake through diet",
          "Regular INR monitoring is essential - frequency depends on stability",
          "Keep a medication and INR log for healthcare providers",
          "Wear medical alert identification indicating anticoagulant use",
        ],
        warnings: [
          "Major bleeding risk - monitor for signs of bleeding",
          "Numerous drug and food interactions - review all medications",
          "INR target varies by indication (2.0-3.0 for most, 2.5-3.5 for mechanical valves)",
          "Avoid activities with high bleeding risk",
          "Pregnancy category X - teratogenic effects",
        ],
        resources: [
          "Warfarin Dosing Guidelines",
          "Drug Interaction Checker",
          "Vitamin K Content in Foods",
          "Bleeding Risk Assessment Tools",
          "Patient Anticoagulation Wallet Card",
        ],
        lastUpdated: "2024-01-15T00:00:00Z",
        tags: ["anticoagulation", "warfarin", "inr", "bleeding", "monitoring"],
      },
      {
        id: "EDU-004",
        category: "Pain Management",
        title: "Opioid Safety and Monitoring",
        content:
          "Opioid medications are effective for moderate to severe pain but carry significant risks including respiratory depression, dependence, and overdose. Proper assessment, monitoring, and patient education are critical.",
        tips: [
          "Assess pain using validated pain scales (0-10 numeric scale)",
          "Start with lowest effective dose and titrate carefully",
          "Monitor respiratory rate, sedation level, and oxygen saturation",
          "Educate about proper storage and disposal of unused medications",
          "Consider non-pharmacological pain management strategies",
        ],
        warnings: [
          "Risk of respiratory depression - monitor closely, especially in opioid-naive patients",
          "Potential for physical dependence and addiction",
          "Avoid concurrent use with alcohol or other CNS depressants",
          "Use caution in elderly patients and those with respiratory conditions",
          "Naloxone should be readily available for overdose reversal",
        ],
        resources: [
          "CDC Opioid Prescribing Guidelines",
          "Pain Assessment Tools",
          "Naloxone Administration Guide",
          "Non-Pharmacological Pain Management Techniques",
          "Opioid Safety Patient Education",
        ],
        lastUpdated: "2024-01-15T00:00:00Z",
        tags: ["pain management", "opioids", "safety", "monitoring", "naloxone"],
      },
      {
        id: "EDU-005",
        category: "Antibiotics",
        title: "Antibiotic Stewardship and Administration",
        content:
          "Proper antibiotic use is crucial for treating bacterial infections while minimizing resistance development. Understanding spectrum of activity, dosing, and monitoring parameters is essential for safe administration.",
        tips: [
          "Verify allergies before administration - document type and severity of reaction",
          "Administer at evenly spaced intervals to maintain therapeutic levels",
          "Complete full course even if symptoms improve",
          "Monitor for signs of superinfection (C. diff, fungal infections)",
          "Educate patients about proper use and completion of therapy",
        ],
        warnings: [
          "Penicillin allergy is common - verify cross-reactivity with other beta-lactams",
          "Risk of Clostridioides difficile infection with broad-spectrum antibiotics",
          "Monitor kidney function with nephrotoxic antibiotics (aminoglycosides, vancomycin)",
          "Some antibiotics require therapeutic drug monitoring",
          "Drug interactions with warfarin, oral contraceptives, and other medications",
        ],
        resources: [
          "Antibiotic Allergy Assessment Guide",
          "C. diff Prevention Protocols",
          "Therapeutic Drug Monitoring Guidelines",
          "Antibiotic Spectrum Chart",
          "Patient Education on Antibiotic Use",
        ],
        lastUpdated: "2024-01-15T00:00:00Z",
        tags: ["antibiotics", "stewardship", "allergies", "resistance", "monitoring"],
      },
      {
        id: "EDU-006",
        category: "Mental Health",
        title: "Antidepressant Safety and Monitoring",
        content:
          "Antidepressants are used to treat depression, anxiety, and other mental health conditions. Different classes have varying mechanisms of action, side effect profiles, and monitoring requirements.",
        tips: [
          "Monitor for suicidal ideation, especially in patients under 25",
          "Therapeutic effects may take 4-6 weeks to appear",
          "Start with low doses and titrate gradually",
          "Educate about common side effects and when to report concerns",
          "Avoid abrupt discontinuation - taper gradually to prevent withdrawal",
        ],
        warnings: [
          "Black box warning for increased suicidal thoughts in young adults",
          "Serotonin syndrome risk with multiple serotonergic medications",
          "Sexual side effects are common and may affect adherence",
          "Weight gain and metabolic effects with some antidepressants",
          "Drug interactions with MAOIs, tramadol, and other medications",
        ],
        resources: [
          "Depression Screening Tools (PHQ-9, GAD-7)",
          "Suicide Risk Assessment Guidelines",
          "Serotonin Syndrome Recognition",
          "Antidepressant Comparison Chart",
          "Mental Health Crisis Resources",
        ],
        lastUpdated: "2024-01-15T00:00:00Z",
        tags: ["mental health", "antidepressants", "suicide risk", "serotonin syndrome", "monitoring"],
      },
    ]

    // Filter education content based on search parameters
    let filteredEducation = educationDatabase

    if (category) {
      filteredEducation = filteredEducation.filter((edu) => edu.category.toLowerCase().includes(category.toLowerCase()))
    }

    if (medication) {
      filteredEducation = filteredEducation.filter(
        (edu) =>
          edu.title.toLowerCase().includes(medication.toLowerCase()) ||
          edu.content.toLowerCase().includes(medication.toLowerCase()) ||
          edu.tags.some((tag) => tag.toLowerCase().includes(medication.toLowerCase())),
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredEducation = filteredEducation.filter(
        (edu) =>
          edu.title.toLowerCase().includes(searchLower) ||
          edu.content.toLowerCase().includes(searchLower) ||
          edu.category.toLowerCase().includes(searchLower) ||
          edu.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      )
    }

    const response: EducationResponse = {
      success: true,
      education: filteredEducation,
      message: `Found ${filteredEducation.length} education resources`,
      total: filteredEducation.length,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching education content:", error)

    const errorResponse: EducationResponse = {
      success: false,
      message: "Failed to fetch education content",
      total: 0,
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// Add new education content (for admin use)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: Omit<EducationContent, "id" | "lastUpdated"> = await request.json()

    // Validate required fields
    if (!body.category || !body.title || !body.content) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Generate new education content
    const newEducation: EducationContent = {
      ...body,
      id: `EDU-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    }

    console.log("Adding new education content:", newEducation.title)

    // In production, this would save to database
    return NextResponse.json({
      success: true,
      education: newEducation,
      message: "Education content added successfully",
    })
  } catch (error) {
    console.error("Error adding education content:", error)
    return NextResponse.json({ success: false, message: "Failed to add education content" }, { status: 500 })
  }
}
