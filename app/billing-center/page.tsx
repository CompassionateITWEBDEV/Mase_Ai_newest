"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Search,
  FileCheck2,
  FileWarning,
  FileClock,
  User,
  ShieldCheck,
  Receipt,
  FileText,
} from "lucide-react"
import Link from "next/link"

interface PatientBillingInfo {
  id: string
  name: string
  insurance: string
  eligibilityStatus: "Eligible" | "Ineligible" | "Not Checked"
  priorAuthStatus: "Approved" | "Denied" | "Pending" | "Not Required"
  copay: number
  deductibleRemaining: number
  oopMaxRemaining: number
  lastChecked: string
}

const initialBillingData: PatientBillingInfo[] = [
  {
    id: "PT-2024-001",
    name: "Margaret Anderson",
    insurance: "Medicare",
    eligibilityStatus: "Eligible",
    priorAuthStatus: "Approved",
    copay: 20,
    deductibleRemaining: 250,
    oopMaxRemaining: 2500,
    lastChecked: "2024-07-09",
  },
  {
    id: "PT-2024-002",
    name: "Robert Thompson",
    insurance: "Blue Cross",
    eligibilityStatus: "Eligible",
    priorAuthStatus: "Pending",
    copay: 40,
    deductibleRemaining: 500,
    oopMaxRemaining: 4500,
    lastChecked: "2024-07-08",
  },
  {
    id: "PT-2024-003",
    name: "Dorothy Williams",
    insurance: "Medicaid",
    eligibilityStatus: "Not Checked",
    priorAuthStatus: "Not Required",
    copay: 0,
    deductibleRemaining: 0,
    oopMaxRemaining: 0,
    lastChecked: "N/A",
  },
]

export default function BillingCenterPage() {
  const [billingData, setBillingData] = useState<PatientBillingInfo[]>(initialBillingData)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = useMemo(() => {
    if (!searchTerm) return billingData
    return billingData.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [billingData, searchTerm])

  const getEligibilityColor = (status: string) => {
    switch (status) {
      case "Eligible":
        return "bg-green-100 text-green-800"
      case "Ineligible":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAuthColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Denied":
        return "bg-red-100 text-red-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAuthIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <FileCheck2 className="h-4 w-4 mr-2" />
      case "Denied":
        return <FileWarning className="h-4 w-4 mr-2" />
      case "Pending":
        return <FileClock className="h-4 w-4 mr-2" />
      default:
        return <FileText className="h-4 w-4 mr-2" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/patient-tracking">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Patient Tracking
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Billing Center</h1>
              <p className="text-gray-600">Manage patient eligibility, co-pays, and prior authorizations.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Patient Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by patient name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {filteredData.map((patient) => (
            <Card key={patient.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      {patient.name}
                    </CardTitle>
                    <CardDescription>
                      {patient.id} • {patient.insurance}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className={getEligibilityColor(patient.eligibilityStatus)}>
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      {patient.eligibilityStatus}
                    </Badge>
                    <Badge className={getAuthColor(patient.priorAuthStatus)}>
                      {getAuthIcon(patient.priorAuthStatus)}
                      {patient.priorAuthStatus}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Co-Pay</p>
                    <p className="text-2xl font-bold">${patient.copay}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Deductible Remaining</p>
                    <p className="text-2xl font-bold">${patient.deductibleRemaining}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Out-of-Pocket Remaining</p>
                    <p className="text-2xl font-bold">${patient.oopMaxRemaining}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Last checked: {patient.lastChecked}</p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Check Eligibility
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileClock className="h-4 w-4 mr-2" />
                      Submit Prior Auth
                    </Button>
                    <Button size="sm">
                      <Receipt className="h-4 w-4 mr-2" />
                      Generate Bill
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
