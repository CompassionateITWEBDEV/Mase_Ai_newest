import { NextResponse } from "next/server"

// In a real app, this data would be calculated from your database
// based on synced Axxess data (OASIS, claims, HHCAHPS surveys).
const mockStarRatingData = {
  overallRating: {
    current: 4.5,
    previous: 4.0,
    nationalAverage: 3.5,
    goal: 5.0,
  },
  qualityOfPatientCare: {
    current: 4.0,
    previous: 3.5,
    nationalAverage: 3.0,
    metrics: [
      { name: "Timely Initiation of Care", value: 98, goal: 99, trend: "up" },
      { name: "Improvement in Ambulation", value: 72, goal: 75, trend: "up" },
      { name: "Improvement in Bed Transferring", value: 85, goal: 88, trend: "down" },
      { name: "Improvement in Bathing", value: 78, goal: 80, trend: "up" },
      { name: "Reduction in Re-hospitalization", value: 14, goal: 12, trend: "down" }, // Lower is better
    ],
  },
  patientSatisfaction: {
    current: 4.5,
    previous: 4.2,
    nationalAverage: 3.8,
    metrics: [
      { name: "Professionalism & Communication", value: 95, goal: 96, trend: "up" },
      { name: "Care Quality & Skills", value: 92, goal: 94, trend: "up" },
      { name: "Specific Care Issues", value: 88, goal: 90, trend: "down" },
      { name: "Willingness to Recommend", value: 96, goal: 97, trend: "up" },
    ],
  },
  actionableInsights: [
    {
      id: "INS-001",
      type: "OASIS",
      description:
        "OASIS for Margaret Anderson has 3 potential coding improvements that could increase reimbursement by $250.",
      priority: "High",
      link: "/oasis-qa",
    },
    {
      id: "INS-002",
      type: "Re-hospitalization",
      description: "Robert Thompson is at high risk for re-hospitalization. Review care plan for preventive measures.",
      priority: "High",
      link: "/patient-tracking",
    },
    {
      id: "INS-003",
      type: "LUPA",
      description: "Helen Rodriguez is at risk for LUPA. 2 more RN visits needed this episode.",
      priority: "Medium",
      link: "/patient-tracking",
    },
    {
      id: "INS-004",
      type: "Compliance",
      description: "Sarah Johnson's RN license expires in 15 days. Ensure renewal is submitted.",
      priority: "Medium",
      link: "/hr-files",
    },
  ],
  oasisAccuracy: {
    averageScore: 91,
    submissionsPendingReview: 5,
    rejectionRate: 4, // in percent
  },
}

export async function GET() {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return NextResponse.json(mockStarRatingData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch star rating data" }, { status: 500 })
  }
}
