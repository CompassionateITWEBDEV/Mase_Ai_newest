import { type NextRequest, NextResponse } from "next/server"

interface DrugInteractionRequest {
  newMedication: {
    name: string
    genericName?: string
    ndc?: string
    category?: string
  }
  currentMedications: Array<{
    name: string
    genericName?: string
    dosage?: string
  }>
  patientId?: string
}

interface DrugInteraction {
  drug1: string
  drug2: string
  severity: "minor" | "moderate" | "major" | "contraindicated"
  description: string
  clinicalEffect: string
  mechanism: string
  management: string
  references: string[]
  riskFactors?: string[]
  monitoring?: string[]
}

interface DrugInteractionResponse {
  success: boolean
  interactions: DrugInteraction[]
  riskLevel: "low" | "moderate" | "high" | "critical"
  recommendations: string[]
  requiresPharmacistReview: boolean
  processingTime: number
}

export async function POST(request: NextRequest): Promise<NextResponse<DrugInteractionResponse>> {
  const startTime = Date.now()

  try {
    const body: DrugInteractionRequest = await request.json()
    const { newMedication, currentMedications, patientId } = body

    if (!newMedication?.name) {
      return NextResponse.json(
        {
          success: false,
          interactions: [],
          riskLevel: "low" as const,
          recommendations: [],
          requiresPharmacistReview: false,
          processingTime: Date.now() - startTime,
        },
        { status: 400 },
      )
    }

    console.log(`Checking interactions for ${newMedication.name} with ${currentMedications.length} current medications`)

    // Check for drug interactions
    const interactions = await checkDrugInteractions(newMedication, currentMedications)

    // Determine overall risk level
    const riskLevel = determineRiskLevel(interactions)

    // Generate recommendations
    const recommendations = generateRecommendations(interactions, newMedication, currentMedications)

    // Determine if pharmacist review is required
    const requiresPharmacistReview = interactions.some(
      (interaction) => interaction.severity === "major" || interaction.severity === "contraindicated",
    )

    const result: DrugInteractionResponse = {
      success: true,
      interactions,
      riskLevel,
      recommendations,
      requiresPharmacistReview,
      processingTime: Date.now() - startTime,
    }

    console.log(`Interaction check completed: ${interactions.length} interactions found, risk level: ${riskLevel}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Drug interaction check error:", error)

    return NextResponse.json(
      {
        success: false,
        interactions: [],
        riskLevel: "low" as const,
        recommendations: ["Unable to check interactions. Please consult pharmacist."],
        requiresPharmacistReview: true,
        processingTime: Date.now() - startTime,
      },
      { status: 500 },
    )
  }
}

// Comprehensive drug interaction database
const drugInteractionDatabase: DrugInteraction[] = [
  // ACE Inhibitors + Potassium
  {
    drug1: "lisinopril",
    drug2: "potassium",
    severity: "major",
    description:
      "ACE inhibitors can increase potassium levels, leading to hyperkalemia when combined with potassium supplements.",
    clinicalEffect: "Hyperkalemia (elevated potassium levels) which can cause dangerous heart rhythm abnormalities.",
    mechanism: "ACE inhibitors reduce aldosterone production, decreasing potassium excretion by the kidneys.",
    management:
      "Monitor serum potassium levels closely. Consider reducing or discontinuing potassium supplements. Monitor ECG for signs of hyperkalemia.",
    references: ["Clinical Pharmacology Database", "Drug Interaction Facts 2024"],
    riskFactors: ["Kidney disease", "Dehydration", "Advanced age"],
    monitoring: ["Serum potassium", "Kidney function", "ECG monitoring"],
  },

  // Warfarin + Aspirin
  {
    drug1: "warfarin",
    drug2: "aspirin",
    severity: "major",
    description: "Concurrent use significantly increases bleeding risk through multiple mechanisms.",
    clinicalEffect: "Increased risk of major bleeding, including gastrointestinal and intracranial hemorrhage.",
    mechanism:
      "Warfarin inhibits vitamin K-dependent clotting factors while aspirin inhibits platelet aggregation and can displace warfarin from protein binding sites.",
    management:
      "Use with extreme caution. Consider alternative antiplatelet agents. Monitor INR more frequently. Watch for signs of bleeding.",
    references: ["American College of Cardiology Guidelines", "Anticoagulation Therapy Guidelines"],
    riskFactors: ["History of bleeding", "Advanced age", "Kidney disease", "Liver disease"],
    monitoring: ["INR levels", "Complete blood count", "Signs of bleeding"],
  },

  // Metformin + Contrast Dye
  {
    drug1: "metformin",
    drug2: "contrast",
    severity: "major",
    description:
      "Contrast agents can cause acute kidney injury, leading to metformin accumulation and lactic acidosis.",
    clinicalEffect: "Risk of life-threatening lactic acidosis due to metformin accumulation.",
    mechanism:
      "Contrast-induced nephropathy reduces metformin clearance, leading to drug accumulation and lactic acidosis.",
    management:
      "Discontinue metformin 48 hours before contrast procedures. Resume only after confirming normal kidney function.",
    references: ["American Diabetes Association Guidelines", "Radiology Safety Guidelines"],
    riskFactors: ["Pre-existing kidney disease", "Dehydration", "Heart failure", "Advanced age"],
    monitoring: ["Serum creatinine", "Lactate levels", "Kidney function"],
  },

  // Digoxin + Furosemide
  {
    drug1: "digoxin",
    drug2: "furosemide",
    severity: "moderate",
    description: "Furosemide can cause electrolyte imbalances that increase digoxin toxicity risk.",
    clinicalEffect: "Increased risk of digoxin toxicity due to hypokalemia and hypomagnesemia.",
    mechanism: "Furosemide causes potassium and magnesium loss, which increases myocardial sensitivity to digoxin.",
    management: "Monitor electrolytes closely. Supplement potassium and magnesium as needed. Monitor digoxin levels.",
    references: ["Heart Failure Guidelines", "Clinical Pharmacology Database"],
    riskFactors: ["Kidney disease", "Advanced age", "Poor nutrition"],
    monitoring: ["Digoxin levels", "Serum potassium", "Serum magnesium", "ECG"],
  },

  // Statins + Grapefruit
  {
    drug1: "atorvastatin",
    drug2: "grapefruit",
    severity: "moderate",
    description: "Grapefruit juice inhibits CYP3A4 enzyme, increasing statin levels and toxicity risk.",
    clinicalEffect: "Increased risk of muscle toxicity (myopathy and rhabdomyolysis).",
    mechanism: "Grapefruit juice inhibits CYP3A4 metabolism of statins, leading to increased drug levels.",
    management: "Avoid grapefruit juice or switch to a statin not metabolized by CYP3A4 (pravastatin, rosuvastatin).",
    references: ["FDA Drug Safety Communications", "Clinical Pharmacology Database"],
    riskFactors: ["High statin doses", "Advanced age", "Kidney disease", "Hypothyroidism"],
    monitoring: ["Muscle symptoms", "CK levels", "Liver function tests"],
  },

  // NSAIDs + ACE Inhibitors
  {
    drug1: "ibuprofen",
    drug2: "lisinopril",
    severity: "moderate",
    description: "NSAIDs can reduce the antihypertensive effect of ACE inhibitors and increase kidney toxicity risk.",
    clinicalEffect: "Reduced blood pressure control and increased risk of acute kidney injury.",
    mechanism: "NSAIDs inhibit prostaglandin synthesis, reducing vasodilation and increasing sodium retention.",
    management:
      "Monitor blood pressure closely. Use lowest effective NSAID dose for shortest duration. Monitor kidney function.",
    references: ["Hypertension Guidelines", "Nephrology Clinical Practice"],
    riskFactors: ["Pre-existing kidney disease", "Dehydration", "Advanced age", "Heart failure"],
    monitoring: ["Blood pressure", "Serum creatinine", "Fluid balance"],
  },

  // Antibiotics + Warfarin
  {
    drug1: "ciprofloxacin",
    drug2: "warfarin",
    severity: "major",
    description: "Many antibiotics can significantly increase warfarin effect, leading to bleeding risk.",
    clinicalEffect: "Dramatically increased INR and bleeding risk.",
    mechanism: "Antibiotics can inhibit warfarin metabolism and reduce vitamin K production by gut bacteria.",
    management: "Monitor INR closely (every 2-3 days). Consider warfarin dose reduction. Watch for bleeding signs.",
    references: ["Anticoagulation Management Guidelines", "Clinical Pharmacology Database"],
    riskFactors: ["Advanced age", "Liver disease", "Poor nutrition", "Recent illness"],
    monitoring: ["INR levels", "Signs of bleeding", "Complete blood count"],
  },

  // Insulin + Alcohol
  {
    drug1: "insulin",
    drug2: "alcohol",
    severity: "major",
    description: "Alcohol can mask hypoglycemia symptoms and impair glucose counter-regulation.",
    clinicalEffect: "Increased risk of severe, prolonged hypoglycemia.",
    mechanism: "Alcohol inhibits gluconeogenesis and can mask hypoglycemia symptoms.",
    management: "Educate patient about risks. Monitor blood glucose more frequently. Avoid alcohol on empty stomach.",
    references: ["American Diabetes Association Guidelines", "Endocrinology Clinical Practice"],
    riskFactors: ["Irregular eating", "Kidney disease", "Liver disease", "Advanced age"],
    monitoring: ["Blood glucose levels", "Hypoglycemia symptoms", "Alcohol consumption patterns"],
  },

  // Beta-blockers + Calcium Channel Blockers
  {
    drug1: "metoprolol",
    drug2: "verapamil",
    severity: "major",
    description: "Combination can cause severe bradycardia, heart block, and hypotension.",
    clinicalEffect: "Risk of severe bradycardia, AV block, and cardiovascular collapse.",
    mechanism: "Additive effects on cardiac conduction and contractility.",
    management: "Use with extreme caution. Monitor heart rate and blood pressure closely. Consider alternative agents.",
    references: ["Cardiology Guidelines", "Clinical Pharmacology Database"],
    riskFactors: ["Pre-existing conduction abnormalities", "Heart failure", "Advanced age"],
    monitoring: ["Heart rate", "Blood pressure", "ECG monitoring", "Signs of heart failure"],
  },

  // Lithium + Diuretics
  {
    drug1: "lithium",
    drug2: "hydrochlorothiazide",
    severity: "major",
    description: "Diuretics can increase lithium levels by reducing renal clearance.",
    clinicalEffect: "Risk of lithium toxicity with neurological and cardiac effects.",
    mechanism: "Diuretics cause sodium depletion, leading to increased lithium reabsorption in the kidneys.",
    management: "Monitor lithium levels closely. Consider dose reduction. Watch for toxicity signs.",
    references: ["Psychiatric Medication Guidelines", "Clinical Pharmacology Database"],
    riskFactors: ["Dehydration", "Kidney disease", "Advanced age", "Low sodium diet"],
    monitoring: ["Lithium levels", "Kidney function", "Neurological symptoms", "Fluid balance"],
  },
]

async function checkDrugInteractions(
  newMedication: { name: string; genericName?: string; category?: string },
  currentMedications: Array<{ name: string; genericName?: string }>,
): Promise<DrugInteraction[]> {
  const interactions: DrugInteraction[] = []

  // Normalize medication names for comparison
  const newMedName = normalizeMedicationName(newMedication.name)
  const newGenericName = newMedication.genericName ? normalizeMedicationName(newMedication.genericName) : null

  for (const currentMed of currentMedications) {
    const currentMedName = normalizeMedicationName(currentMed.name)
    const currentGenericName = currentMed.genericName ? normalizeMedicationName(currentMed.genericName) : null

    // Check for interactions in database
    for (const interaction of drugInteractionDatabase) {
      const drug1 = interaction.drug1.toLowerCase()
      const drug2 = interaction.drug2.toLowerCase()

      // Check all possible name combinations
      const isInteraction =
        (matchesDrug(newMedName, newGenericName, drug1) && matchesDrug(currentMedName, currentGenericName, drug2)) ||
        (matchesDrug(newMedName, newGenericName, drug2) && matchesDrug(currentMedName, currentGenericName, drug1))

      if (isInteraction) {
        // Create interaction with proper drug names
        const interactionCopy = {
          ...interaction,
          drug1: matchesDrug(newMedName, newGenericName, drug1) ? newMedication.name : currentMed.name,
          drug2: matchesDrug(newMedName, newGenericName, drug1) ? currentMed.name : newMedication.name,
        }
        interactions.push(interactionCopy)
      }
    }
  }

  return interactions
}

function normalizeMedicationName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "")
}

function matchesDrug(medName: string, genericName: string | null, drugName: string): boolean {
  const normalizedDrugName = drugName.toLowerCase()
  return (
    medName.includes(normalizedDrugName) ||
    normalizedDrugName.includes(medName) ||
    (genericName && (genericName.includes(normalizedDrugName) || normalizedDrugName.includes(genericName)))
  )
}

function determineRiskLevel(interactions: DrugInteraction[]): "low" | "moderate" | "high" | "critical" {
  if (interactions.length === 0) return "low"

  const hasContraindicated = interactions.some((i) => i.severity === "contraindicated")
  const hasMajor = interactions.some((i) => i.severity === "major")
  const hasModerate = interactions.some((i) => i.severity === "moderate")

  if (hasContraindicated) return "critical"
  if (hasMajor) return "high"
  if (hasModerate) return "moderate"
  return "low"
}

function generateRecommendations(
  interactions: DrugInteraction[],
  newMedication: { name: string },
  currentMedications: Array<{ name: string }>,
): string[] {
  const recommendations: string[] = []

  if (interactions.length === 0) {
    recommendations.push("No significant drug interactions detected.")
    recommendations.push("Continue monitoring for any unexpected effects.")
    return recommendations
  }

  const severityGroups = {
    contraindicated: interactions.filter((i) => i.severity === "contraindicated"),
    major: interactions.filter((i) => i.severity === "major"),
    moderate: interactions.filter((i) => i.severity === "moderate"),
    minor: interactions.filter((i) => i.severity === "minor"),
  }

  if (severityGroups.contraindicated.length > 0) {
    recommendations.push("⚠️ CONTRAINDICATED: Do not administer this medication combination.")
    recommendations.push("Contact prescriber immediately for alternative therapy.")
    recommendations.push("Document interaction and rationale for any decisions.")
  }

  if (severityGroups.major.length > 0) {
    recommendations.push("🚨 MAJOR INTERACTION: Requires immediate clinical attention.")
    recommendations.push("Consider alternative medications or enhanced monitoring.")
    recommendations.push("Consult with pharmacist or prescriber before administration.")
  }

  if (severityGroups.moderate.length > 0) {
    recommendations.push("⚠️ MODERATE INTERACTION: Enhanced monitoring required.")
    recommendations.push("Monitor for signs and symptoms of interaction effects.")
    recommendations.push("Consider dose adjustments or timing modifications.")
  }

  if (severityGroups.minor.length > 0) {
    recommendations.push("ℹ️ MINOR INTERACTION: Monitor for potential effects.")
    recommendations.push("Document any unusual symptoms or effects.")
  }

  // Add specific monitoring recommendations
  const allMonitoring = interactions.flatMap((i) => i.monitoring || [])
  const uniqueMonitoring = [...new Set(allMonitoring)]

  if (uniqueMonitoring.length > 0) {
    recommendations.push(`Monitor: ${uniqueMonitoring.join(", ")}`)
  }

  return recommendations
}

// GET endpoint for interaction database queries
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const drug1 = searchParams.get("drug1")
    const drug2 = searchParams.get("drug2")

    if (!drug1 || !drug2) {
      return NextResponse.json(
        { success: false, message: "Both drug1 and drug2 parameters are required" },
        { status: 400 },
      )
    }

    const interactions = drugInteractionDatabase.filter(
      (interaction) =>
        (interaction.drug1.toLowerCase().includes(drug1.toLowerCase()) &&
          interaction.drug2.toLowerCase().includes(drug2.toLowerCase())) ||
        (interaction.drug1.toLowerCase().includes(drug2.toLowerCase()) &&
          interaction.drug2.toLowerCase().includes(drug1.toLowerCase())),
    )

    return NextResponse.json({
      success: true,
      interactions,
      count: interactions.length,
    })
  } catch (error) {
    console.error("Drug interaction query error:", error)
    return NextResponse.json({ success: false, message: "Failed to query drug interactions" }, { status: 500 })
  }
}
