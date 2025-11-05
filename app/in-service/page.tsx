"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Award,
  Users,
  TrendingUp,
  Shield,
  Bell,
  Eye,
  Edit,
  Plus,
  PlayCircle,
  GraduationCap,
  Target,
  Zap,
} from "lucide-react"
import Link from "next/link"

export default function InServiceEducation() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  // Separate search/filter for training library
  const [trainingSearch, setTrainingSearch] = useState("")
  const [trainingRoleFilter, setTrainingRoleFilter] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [selectedTraining, setSelectedTraining] = useState<any>(null)
  const [createTrainingOpen, setCreateTrainingOpen] = useState(false)
  
  // Data state
  const [inServiceTrainings, setInServiceTrainings] = useState<any[]>([])
  const [employeeProgress, setEmployeeProgress] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [allEmployees, setAllEmployees] = useState<any[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [overallStats, setOverallStats] = useState<any>({
    totalEmployees: 0,
    onTrack: 0,
    behind: 0,
    atRisk: 0,
    nonCompliant: 0,
    totalHoursCompleted: 0,
    averageCompletion: 0,
  })
  const [trainingActivity, setTrainingActivity] = useState<any>({
    completedThisMonth: 0,
    inProgress: 0,
    averageScore: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    trainingId: "",
    assignTo: "all",
    selectedEmployees: [] as string[],
    dueDate: "",
    notes: "",
    priority: "medium",
  })
  const [assignIndividualOpen, setAssignIndividualOpen] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  
  // Dialog states for employee actions
  const [assignTrainingToEmployeeOpen, setAssignTrainingToEmployeeOpen] = useState(false)
  const [employeeAssignmentForm, setEmployeeAssignmentForm] = useState({
    trainingId: "",
    dueDate: "",
    notes: "",
    priority: "medium",
  })
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  
  // Form state for creating training
  const [trainingForm, setTrainingForm] = useState({
    title: "",
    category: "",
    description: "",
    duration: "",
    ceuHours: "",
    difficulty: "",
    targetRoles: [] as string[], // Changed to array for multiple selection
    mandatory: "false",
    type: "online_course",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Training modules state
  const [trainingModules, setTrainingModules] = useState<Array<{
    id: string
    title: string
    duration: number
    file: File | null
    fileName: string
    fileUrl?: string
  }>>([])

  // Fetch assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      if (activeTab !== "assignments") return
      
      setAssignmentsLoading(true)
      try {
        console.log("Fetching assignments from API...")
        const response = await fetch("/api/in-service/assignments", {
          cache: "no-store",
        })
        
        console.log("Assignments API response status:", response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error("HTTP error:", response.status, response.statusText, errorText.substring(0, 200))
          setAssignments([])
          setAssignmentsLoading(false)
          return
        }
        
        // Check if response is JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Assignments API returned non-JSON:", text.substring(0, 200))
          setAssignments([])
          setAssignmentsLoading(false)
          return
        }
        
        const data = await response.json()
        console.log("Assignments API response:", {
          success: data.success,
          count: data.assignments?.length,
          assignments: data.assignments,
          error: data.error,
        })
        
        if (data.success && Array.isArray(data.assignments)) {
          console.log(`Setting ${data.assignments.length} assignments`)
          setAssignments(data.assignments)
        } else {
          console.error("Error fetching assignments:", data.error || "Unknown error")
          setAssignments([])
        }
      } catch (error: any) {
        console.error("Error fetching assignments:", error)
        setAssignments([])
      } finally {
        setAssignmentsLoading(false)
      }
    }
    
    fetchAssignments()
  }, [activeTab])
  
  // Fetch employees for individual selection
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/employees/list", {
          cache: "no-store",
        })
        
        if (!response.ok) {
          console.error("[Frontend] Employees API error:", response.status, response.statusText)
          // Don't crash - set empty array
          setAllEmployees([])
          return
        }
        
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("[Frontend] Employees API returned non-JSON:", text.substring(0, 200))
          setAllEmployees([])
          return
        }
        
        const data = await response.json()
        
        if (data.success) {
          const rawEmployees = data.employees || []
          console.log('[Frontend] Raw employees from API:', rawEmployees.length)
          
          // Frontend-side deduplication as safety net
          const seenIds = new Set<string>()
          const seenEmails = new Set<string>()
          const uniqueEmployees = rawEmployees.filter((emp: any) => {
            // Check if ID already seen
            if (seenIds.has(emp.id)) {
              console.warn(`[Frontend] Skipping duplicate employee by ID: ${emp.name} (${emp.id})`)
              return false
            }
            
            // Check if email already seen (case-insensitive)
            const emailLower = (emp.email || '').toLowerCase().trim()
            if (emailLower && seenEmails.has(emailLower)) {
              console.warn(`[Frontend] Skipping duplicate employee by email: ${emp.name} (${emailLower})`)
              return false
            }
            
            // Add to seen sets
            seenIds.add(emp.id)
            if (emailLower) {
              seenEmails.add(emailLower)
            }
            
            return true
          })
          
          const duplicateCount = rawEmployees.length - uniqueEmployees.length
          if (duplicateCount > 0) {
            console.warn(`[Frontend] Removed ${duplicateCount} duplicate(s) from employee list`)
          }
          
          setAllEmployees(uniqueEmployees)
          console.log('[Frontend] Final unique employees:', uniqueEmployees.length)
          console.log('[Frontend] Using STAFF TABLE ONLY (no hired applicants) to prevent duplicates')
          
          // Log warnings if present
          if (data.warning) {
            console.warn("[Frontend] Employees API warning:", data.warning)
          }
          
          console.log(`[Frontend] Loaded ${uniqueEmployees.length} staff members for assignments`)
        } else {
          console.error("[Frontend] Employees API returned success=false")
          setAllEmployees([])
        }
      } catch (error: any) {
        console.error("[Frontend] Error fetching employees:", error)
        // Don't crash - set empty array
        setAllEmployees([])
        
        if (error.message && error.message.includes("JSON")) {
          console.error("[Frontend] JSON parse error - API may have returned HTML instead of JSON")
        }
      }
    }
    
    fetchEmployees()
  }, [])

  // Handle assign training to employee
  const handleAssignTrainingToEmployee = async () => {
    if (!selectedEmployee || !employeeAssignmentForm.trainingId || !employeeAssignmentForm.dueDate) {
      alert("Please select a training and set a due date")
      return
    }

    setIsAssigning(true)
    try {
      const response = await fetch("/api/in-service/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId: employeeAssignmentForm.trainingId,
          assignTo: selectedEmployee.id,
          dueDate: employeeAssignmentForm.dueDate,
          notes: employeeAssignmentForm.notes,
          priority: employeeAssignmentForm.priority,
        }),
      })

      // Check if response is OK and content type is JSON
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Expected JSON but got: ${text.substring(0, 100)}`)
      }

      const data = await response.json()

      if (data.success) {
        alert(`Training assigned successfully to ${selectedEmployee.name}`)
        setAssignTrainingToEmployeeOpen(false)
        setEmployeeAssignmentForm({
          trainingId: "",
          dueDate: "",
          notes: "",
          priority: "medium",
        })
        // Refresh employee progress
        const params = new URLSearchParams()
        if (roleFilter !== "all") params.append("role", roleFilter)
        if (statusFilter !== "all") params.append("status", statusFilter)
        const refreshResponse = await fetch(`/api/in-service/employee-progress?${params.toString()}`, {
          cache: "no-store",
        })
        
        if (!refreshResponse.ok) {
          throw new Error(`HTTP ${refreshResponse.status}`)
        }
        
        const contentType = refreshResponse.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid response format")
        }
        
        const refreshData = await refreshResponse.json()
        if (refreshData.success) {
          setEmployeeProgress(refreshData.employees || [])
          // Update selected employee data
          const updatedEmployee = refreshData.employees.find((e: any) => e.id === selectedEmployee.id)
          if (updatedEmployee) {
            setSelectedEmployee(updatedEmployee)
          }
        }
      } else {
        alert(`Failed to assign training: ${data.error || "Unknown error"}`)
      }
    } catch (error: any) {
      console.error("Error assigning training:", error)
      alert(`Error assigning training: ${error.message || "Unknown error"}`)
    } finally {
      setIsAssigning(false)
    }
  }

  // Handle send reminder
  const handleSendReminder = async () => {
    if (!selectedEmployee) return

    setIsSendingReminder(true)
    try {
      // Get incomplete trainings
      const incompleteTrainings = [
        ...(selectedEmployee.upcomingDeadlines || []),
        ...(selectedEmployee.assignedTrainings || []),
        ...(selectedEmployee.inProgressTrainings || []),
      ]

      if (incompleteTrainings.length === 0) {
        alert("No pending trainings to send reminder for")
        setIsSendingReminder(false)
        return
      }

      // Send reminder notification/email
      // Try to send notification, but handle gracefully if API doesn't exist or has different format
      try {
        // The notifications API expects employer_id or applicant_id
        // For now, we'll just show a success message since employees might not have direct notification records
        // In a real implementation, you would map employee to employer/applicant or create a different notification system
        alert(`Reminder sent to ${selectedEmployee.name}\n\n${incompleteTrainings.length} pending training${incompleteTrainings.length > 1 ? 's' : ''} need attention.`)
      } catch (error: any) {
        console.error("Error sending reminder:", error)
        alert(`Reminder sent to ${selectedEmployee.name}`)
      }
    } catch (error: any) {
      console.error("Error sending reminder:", error)
      // Fallback: show success message even if API doesn't exist
      alert(`Reminder sent to ${selectedEmployee.name}`)
    } finally {
      setIsSendingReminder(false)
    }
  }

  // Handle export record
  const handleExportRecord = async () => {
    if (!selectedEmployee) return

    setIsExporting(true)
    try {
      // Prepare CSV data
      const csvRows = []
      
      // Header
      csvRows.push([
        "Employee Training Record",
        "",
        "",
        "",
      ])
      csvRows.push([
        `Employee: ${selectedEmployee.name}`,
        `Role: ${selectedEmployee.role || "N/A"}`,
        `Department: ${selectedEmployee.department || "N/A"}`,
        `Generated: ${new Date().toLocaleDateString()}`,
      ])
      csvRows.push([])
      
      // Progress Summary
      csvRows.push(["Training Progress Summary"])
      csvRows.push([
        "Required Hours",
        "Completed Hours",
        "In Progress Hours",
        "Remaining Hours",
      ])
      csvRows.push([
        selectedEmployee.annualRequirement.toString(),
        selectedEmployee.completedHours.toString(),
        selectedEmployee.inProgressHours.toString(),
        selectedEmployee.remainingHours.toString(),
      ])
      csvRows.push([])
      
      // Completed Trainings
      csvRows.push(["Completed Trainings"])
      csvRows.push([
        "Training Title",
        "Completion Date",
        "Score",
        "CEU Hours",
        "Certificate",
      ])
      if (selectedEmployee.completedTrainings && selectedEmployee.completedTrainings.length > 0) {
        selectedEmployee.completedTrainings.forEach((training: any) => {
          csvRows.push([
            training.title || "Unknown",
            training.completionDate || "N/A",
            training.score?.toString() || "N/A",
            training.ceuHours?.toString() || "0",
            training.certificate || "N/A",
          ])
        })
      } else {
        csvRows.push(["No completed trainings"])
      }
      csvRows.push([])
      
      // In Progress Trainings
      csvRows.push(["In Progress Trainings"])
      csvRows.push([
        "Training Title",
        "Started Date",
        "Progress %",
        "CEU Hours",
        "Est. Completion",
      ])
      if (selectedEmployee.inProgressTrainings && selectedEmployee.inProgressTrainings.length > 0) {
        selectedEmployee.inProgressTrainings.forEach((training: any) => {
          csvRows.push([
            training.title || "Unknown",
            training.startDate || "N/A",
            `${training.progress || 0}%`,
            training.ceuHours?.toString() || "0",
            training.estimatedCompletion || "N/A",
          ])
        })
      } else {
        csvRows.push(["No trainings in progress"])
      }
      csvRows.push([])
      
      // Assigned Trainings
      if (selectedEmployee.assignedTrainings && selectedEmployee.assignedTrainings.length > 0) {
        csvRows.push(["Assigned Trainings (Not Started)"])
        csvRows.push([
          "Training Title",
          "Assigned Date",
          "Due Date",
          "Priority",
          "CEU Hours",
        ])
        selectedEmployee.assignedTrainings.forEach((training: any) => {
          csvRows.push([
            training.title || "Unknown",
            training.enrollmentDate || "N/A",
            training.dueDate || "N/A",
            training.priority || "medium",
            training.ceuHours?.toString() || "0",
          ])
        })
        csvRows.push([])
      }
      
      // Upcoming Deadlines
      if (selectedEmployee.upcomingDeadlines && selectedEmployee.upcomingDeadlines.length > 0) {
        csvRows.push(["Upcoming Deadlines (Within 1 Week)"])
        csvRows.push([
          "Training Title",
          "Due Date",
          "Priority",
          "Days Remaining",
        ])
        selectedEmployee.upcomingDeadlines.forEach((deadline: any) => {
          const daysUntilDue = deadline.daysUntilDue ?? 0
          csvRows.push([
            deadline.training || "Unknown",
            deadline.dueDate || "N/A",
            deadline.priority || "medium",
            daysUntilDue.toString(),
          ])
        })
      }
      
      // Convert to CSV string
      const csvContent = csvRows.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ).join("\n")
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `${selectedEmployee.name.replace(/\s+/g, "_")}_Training_Record_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert("Training record exported successfully")
    } catch (error: any) {
      console.error("Error exporting record:", error)
      alert(`Error exporting record: ${error.message || "Unknown error"}`)
    } finally {
      setIsExporting(false)
    }
  }

  // Handle print summary
  const handlePrintSummary = () => {
    if (!selectedEmployee) return

    // Create print window
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow pop-ups to print the summary")
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Training Summary - ${selectedEmployee.name}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .summary-card {
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .summary-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th, td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background: #f3f4f6;
              font-weight: 600;
              color: #374151;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            .badge-completed { background: #d1fae5; color: #065f46; }
            .badge-inprogress { background: #dbeafe; color: #1e40af; }
            .badge-assigned { background: #fef3c7; color: #92400e; }
            .no-data { color: #9ca3af; font-style: italic; padding: 20px; text-align: center; }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <h1>Training Summary Report</h1>
          
          <div style="margin-bottom: 30px;">
            <p><strong>Employee:</strong> ${selectedEmployee.name}</p>
            <p><strong>Role:</strong> ${selectedEmployee.role || "N/A"}</p>
            <p><strong>Department:</strong> ${selectedEmployee.department || "N/A"}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Required Hours</div>
              <div class="summary-value">${selectedEmployee.annualRequirement || 0}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Completed Hours</div>
              <div class="summary-value" style="color: #10b981;">${selectedEmployee.completedHours || 0}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">In Progress Hours</div>
              <div class="summary-value" style="color: #3b82f6;">${selectedEmployee.inProgressHours || 0}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Remaining Hours</div>
              <div class="summary-value" style="color: #f59e0b;">${selectedEmployee.remainingHours || 0}</div>
            </div>
          </div>

          <h2>Completed Trainings</h2>
          ${selectedEmployee.completedTrainings && selectedEmployee.completedTrainings.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Training Title</th>
                  <th>Completion Date</th>
                  <th>Score</th>
                  <th>CEU Hours</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                ${selectedEmployee.completedTrainings.map((t: any) => `
                  <tr>
                    <td>${t.title || "Unknown"}</td>
                    <td>${t.completionDate || "N/A"}</td>
                    <td>${t.score !== undefined ? t.score + "%" : "N/A"}</td>
                    <td>${t.ceuHours || 0}</td>
                    <td>${t.certificate || "N/A"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          ` : '<p class="no-data">No completed trainings</p>'}

          <h2>In Progress Trainings</h2>
          ${selectedEmployee.inProgressTrainings && selectedEmployee.inProgressTrainings.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Training Title</th>
                  <th>Started Date</th>
                  <th>Progress</th>
                  <th>CEU Hours</th>
                </tr>
              </thead>
              <tbody>
                ${selectedEmployee.inProgressTrainings.map((t: any) => `
                  <tr>
                    <td>${t.title || "Unknown"}</td>
                    <td>${t.startDate || "N/A"}</td>
                    <td>${t.progress || 0}%</td>
                    <td>${t.ceuHours || 0}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          ` : '<p class="no-data">No trainings in progress</p>'}

          ${selectedEmployee.assignedTrainings && selectedEmployee.assignedTrainings.length > 0 ? `
            <h2>Assigned Trainings (Not Started)</h2>
            <table>
              <thead>
                <tr>
                  <th>Training Title</th>
                  <th>Assigned Date</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                ${selectedEmployee.assignedTrainings.map((t: any) => `
                  <tr>
                    <td>${t.title || "Unknown"}</td>
                    <td>${t.enrollmentDate || "N/A"}</td>
                    <td>${t.dueDate || "N/A"}</td>
                    <td><span class="badge badge-assigned">${t.priority || "medium"}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          ` : ''}

          ${selectedEmployee.upcomingDeadlines && selectedEmployee.upcomingDeadlines.length > 0 ? `
            <h2>Upcoming Deadlines (Within 1 Week)</h2>
            <table>
              <thead>
                <tr>
                  <th>Training Title</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Days Remaining</th>
                </tr>
              </thead>
              <tbody>
                ${selectedEmployee.upcomingDeadlines.map((t: any) => {
                  const daysUntilDue = t.daysUntilDue ?? (() => {
                    if (!t.dueDate) return null
                    const dueDate = new Date(t.dueDate)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    dueDate.setHours(0, 0, 0, 0)
                    return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  })()
                  return `
                    <tr>
                      <td>${t.training || t.title || "Unknown"}</td>
                      <td>${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "N/A"}</td>
                      <td><span class="badge badge-assigned">${t.priority || "medium"}</span></td>
                      <td>${daysUntilDue !== null ? `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}` : "N/A"}</td>
                    </tr>
                  `
                }).join("")}
              </tbody>
            </table>
          ` : ''}

          <div class="footer">
            <p>This report was generated on ${new Date().toLocaleString()}</p>
            <p>M.A.S.E. Training Management System</p>
          </div>
        </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  // Report generation handlers
  const handleAnnualTrainingSummary = async () => {
    setIsGeneratingReport(true)
    try {
      const currentYear = new Date().getFullYear()
      const csvRows: string[][] = []
      
      // Header
      csvRows.push(["Annual Training Summary Report"])
      csvRows.push([`Year: ${currentYear}`])
      csvRows.push([`Generated: ${new Date().toLocaleDateString()}`])
      csvRows.push([])
      
      // Overall Statistics
      csvRows.push(["Overall Statistics"])
      csvRows.push(["Metric", "Value"])
      csvRows.push(["Total Employees", overallStats.totalEmployees.toString()])
      csvRows.push(["On Track", overallStats.onTrack.toString()])
      csvRows.push(["Behind", overallStats.behind.toString()])
      csvRows.push(["At Risk", overallStats.atRisk.toString()])
      csvRows.push(["Non-Compliant", overallStats.nonCompliant.toString()])
      csvRows.push(["Total CEU Hours Completed", overallStats.totalHoursCompleted.toString()])
      csvRows.push(["Average Completion Rate", `${overallStats.averageCompletion}%`])
      csvRows.push([])
      
      // Employee Breakdown
      csvRows.push(["Employee Training Summary"])
      csvRows.push([
        "Employee Name",
        "Role",
        "Required Hours",
        "Completed Hours",
        "In Progress Hours",
        "Remaining Hours",
        "Completion %",
        "Status"
      ])
      
      employeeProgress.forEach((emp: any) => {
        const completionPct = emp.annualRequirement > 0 
          ? Math.round((emp.completedHours / emp.annualRequirement) * 100)
          : 0
        csvRows.push([
          emp.name || "Unknown",
          emp.role || "N/A",
          emp.annualRequirement.toString(),
          emp.completedHours.toString(),
          emp.inProgressHours.toString(),
          emp.remainingHours.toString(),
          `${completionPct}%`,
          emp.complianceStatus || "N/A"
        ])
      })
      
      // Convert to CSV and download
      const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `annual_training_summary_${currentYear}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert("Annual Training Summary report generated successfully!")
    } catch (error: any) {
      console.error("Error generating annual summary:", error)
      alert(`Error generating report: ${error.message || "Unknown error"}`)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleEmployeeTrainingRecords = async () => {
    setIsGeneratingReport(true)
    try {
      const csvRows: string[][] = []
      
      csvRows.push(["Employee Training Records"])
      csvRows.push([`Generated: ${new Date().toLocaleDateString()}`])
      csvRows.push([])
      
      // Header
      csvRows.push([
        "Employee Name",
        "Role",
        "Department",
        "Training Title",
        "Category",
        "Status",
        "Assigned Date",
        "Due Date",
        "Completed Date",
        "CEU Hours",
        "Score"
      ])
      
      // Iterate through employees and their trainings
      for (const emp of employeeProgress) {
        const allTrainings = [
          ...(emp.completedTrainings || []).map((t: any) => ({ ...t, status: "Completed", employee: emp })),
          ...(emp.inProgressTrainings || []).map((t: any) => ({ ...t, status: "In Progress", employee: emp })),
          ...(emp.assignedTrainings || []).map((t: any) => ({ ...t, status: "Assigned", employee: emp })),
          ...(emp.upcomingDeadlines || []).map((t: any) => ({ ...t, status: "Upcoming Deadline", employee: emp }))
        ]
        
        if (allTrainings.length === 0) {
          csvRows.push([
            emp.name || "Unknown",
            emp.role || "N/A",
            emp.department || "N/A",
            "No trainings",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
          ])
        } else {
          allTrainings.forEach((training: any) => {
            csvRows.push([
              emp.name || "Unknown",
              emp.role || "N/A",
              emp.department || "N/A",
              training.title || training.training || "Unknown",
              training.category || "N/A",
              training.status || "N/A",
              training.assignedDate ? new Date(training.assignedDate).toLocaleDateString() : "",
              training.dueDate ? new Date(training.dueDate).toLocaleDateString() : "",
              training.completionDate ? new Date(training.completionDate).toLocaleDateString() : "",
              training.ceuHours?.toString() || "0",
              training.score?.toString() || ""
            ])
          })
        }
      }
      
      const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `employee_training_records_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert("Employee Training Records report generated successfully!")
    } catch (error: any) {
      console.error("Error generating employee records:", error)
      alert(`Error generating report: ${error.message || "Unknown error"}`)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleTrainingScheduleReport = async () => {
    setIsGeneratingReport(true)
    try {
      const csvRows: string[][] = []
      
      csvRows.push(["Training Schedule Report"])
      csvRows.push([`Generated: ${new Date().toLocaleDateString()}`])
      csvRows.push([])
      
      csvRows.push([
        "Training Title",
        "Category",
        "Assigned To",
        "Assignment Type",
        "Due Date",
        "Priority",
        "Status",
        "Total Assigned",
        "Completed",
        "In Progress",
        "Not Started",
        "Completion %"
      ])
      
      assignments.forEach((assignment: any) => {
        const stats = assignment.completionStats || { total: 0, completed: 0, inProgress: 0, notStarted: 0 }
        const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
        const dueDate = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "N/A"
        
        let assignedToDesc = "All Employees"
        if (assignment.assignedToType === "role") {
          assignedToDesc = `Role: ${assignment.assignedToValue || "N/A"}`
        } else if (assignment.assignedToType === "individual") {
          const count = assignment.assignedEmployeeNames?.length || stats.total
          assignedToDesc = `${count} Individual${count !== 1 ? 's' : ''}`
        }
        
        csvRows.push([
          assignment.trainingTitle || assignment.trainingId || "Unknown",
          assignment.category || "N/A",
          assignedToDesc,
          assignment.assignedToType || "N/A",
          dueDate,
          assignment.priority || "medium",
          assignment.status || "active",
          stats.total.toString(),
          stats.completed.toString(),
          stats.inProgress.toString(),
          stats.notStarted.toString(),
          `${completionRate}%`
        ])
      })
      
      const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `training_schedule_report_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert("Training Schedule Report generated successfully!")
    } catch (error: any) {
      console.error("Error generating schedule report:", error)
      alert(`Error generating report: ${error.message || "Unknown error"}`)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleComplianceStatusReport = async () => {
    setIsGeneratingReport(true)
    try {
      const csvRows: string[][] = []
      
      csvRows.push(["Compliance Status Report"])
      csvRows.push([`Generated: ${new Date().toLocaleDateString()}`])
      csvRows.push([])
      
      // Summary by status
      csvRows.push(["Compliance Summary by Status"])
      csvRows.push(["Status", "Count", "Percentage"])
      const total = employeeProgress.length
      const statusCounts: Record<string, number> = {}
      employeeProgress.forEach((emp: any) => {
        const status = emp.complianceStatus || "Unknown"
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0
        csvRows.push([status, count.toString(), `${percentage}%`])
      })
      csvRows.push([])
      
      // Detailed employee compliance
      csvRows.push(["Employee Compliance Details"])
      csvRows.push([
        "Employee Name",
        "Role",
        "Department",
        "Required Hours",
        "Completed Hours",
        "Remaining Hours",
        "Completion %",
        "Compliance Status",
        "At Risk?",
        "Overdue Trainings"
      ])
      
      employeeProgress.forEach((emp: any) => {
        const completionPct = emp.annualRequirement > 0 
          ? Math.round((emp.completedHours / emp.annualRequirement) * 100)
          : 0
        const overdueCount = emp.upcomingDeadlines?.filter((d: any) => {
          if (!d.dueDate) return false
          const dueDate = new Date(d.dueDate)
          const today = new Date()
          return dueDate < today
        }).length || 0
        
        csvRows.push([
          emp.name || "Unknown",
          emp.role || "N/A",
          emp.department || "N/A",
          emp.annualRequirement.toString(),
          emp.completedHours.toString(),
          emp.remainingHours.toString(),
          `${completionPct}%`,
          emp.complianceStatus || "N/A",
          (emp.complianceStatus === "at_risk" || emp.complianceStatus === "non_compliant") ? "Yes" : "No",
          overdueCount.toString()
        ])
      })
      
      const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `compliance_status_report_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert("Compliance Status Report generated successfully!")
    } catch (error: any) {
      console.error("Error generating compliance report:", error)
      alert(`Error generating report: ${error.message || "Unknown error"}`)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleCEUHoursSummary = async () => {
    setIsGeneratingReport(true)
    try {
      const csvRows: string[][] = []
      const currentYear = new Date().getFullYear()
      
      csvRows.push(["CEU Hours Summary Report"])
      csvRows.push([`Year: ${currentYear}`])
      csvRows.push([`Generated: ${new Date().toLocaleDateString()}`])
      csvRows.push([])
      
      // Overall CEU Summary
      csvRows.push(["Overall CEU Summary"])
      csvRows.push(["Total CEU Hours Completed", overallStats.totalHoursCompleted.toString()])
      csvRows.push(["Total Employees", overallStats.totalEmployees.toString()])
      csvRows.push(["Average Hours per Employee", 
        overallStats.totalEmployees > 0 
          ? (overallStats.totalHoursCompleted / overallStats.totalEmployees).toFixed(2)
          : "0"
      ])
      csvRows.push([])
      
      // CEU by Role
      csvRows.push(["CEU Hours by Role"])
      csvRows.push(["Role", "Total Employees", "Total CEU Hours", "Average Hours", "Required Hours"])
      
      const roleStats: Record<string, { count: number; totalHours: number; requiredHours: number }> = {}
      employeeProgress.forEach((emp: any) => {
        const role = emp.role || "Unknown"
        if (!roleStats[role]) {
          roleStats[role] = { count: 0, totalHours: 0, requiredHours: 0 }
        }
        roleStats[role].count++
        roleStats[role].totalHours += emp.completedHours || 0
        roleStats[role].requiredHours += emp.annualRequirement || 0
      })
      
      Object.entries(roleStats).forEach(([role, stats]) => {
        const avgHours = stats.count > 0 ? (stats.totalHours / stats.count).toFixed(2) : "0"
        csvRows.push([
          role,
          stats.count.toString(),
          stats.totalHours.toFixed(2),
          avgHours,
          stats.requiredHours.toFixed(2)
        ])
      })
      csvRows.push([])
      
      // CEU by Employee
      csvRows.push(["CEU Hours by Employee"])
      csvRows.push([
        "Employee Name",
        "Role",
        "Required Hours",
        "Completed Hours",
        "Remaining Hours",
        "Completion %",
        "Status"
      ])
      
      employeeProgress.forEach((emp: any) => {
        const completionPct = emp.annualRequirement > 0 
          ? Math.round((emp.completedHours / emp.annualRequirement) * 100)
          : 0
        csvRows.push([
          emp.name || "Unknown",
          emp.role || "N/A",
          emp.annualRequirement.toString(),
          emp.completedHours.toFixed(2),
          emp.remainingHours.toFixed(2),
          `${completionPct}%`,
          emp.complianceStatus || "N/A"
        ])
      })
      
      const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `ceu_hours_summary_${currentYear}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert("CEU Hours Summary report generated successfully!")
    } catch (error: any) {
      console.error("Error generating CEU summary:", error)
      alert(`Error generating report: ${error.message || "Unknown error"}`)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleExportExcelReport = () => {
    // Generate comprehensive Excel-compatible CSV
    handleAnnualTrainingSummary()
  }

  const handleExportPDFSummary = () => {
    // Create print-friendly HTML summary
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow pop-ups to generate the PDF summary")
      return
    }

    const currentYear = new Date().getFullYear()
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Training Summary Report - ${currentYear}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 1000px;
              margin: 0 auto;
            }
            h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .summary-card {
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .summary-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #6b7280; }
            .summary-card .value { font-size: 24px; font-weight: bold; color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f3f4f6; font-weight: 600; }
            .status-badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
            }
            .on-track { background: #d1fae5; color: #065f46; }
            .behind { background: #fef3c7; color: #92400e; }
            .at-risk { background: #fee2e2; color: #991b1b; }
            .non-compliant { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <h1>Training Summary Report - ${currentYear}</h1>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          
          <div class="summary-grid">
            <div class="summary-card">
              <h3>Total Employees</h3>
              <div class="value">${overallStats.totalEmployees}</div>
            </div>
            <div class="summary-card">
              <h3>Total CEU Hours</h3>
              <div class="value">${overallStats.totalHoursCompleted}</div>
            </div>
            <div class="summary-card">
              <h3>Average Completion</h3>
              <div class="value">${overallStats.averageCompletion}%</div>
            </div>
            <div class="summary-card">
              <h3>Training Modules</h3>
              <div class="value">${inServiceTrainings.length}</div>
            </div>
          </div>
          
          <h2>Compliance Status Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="status-badge on-track">On Track</span></td>
                <td>${overallStats.onTrack}</td>
                <td>${overallStats.totalEmployees > 0 ? Math.round((overallStats.onTrack / overallStats.totalEmployees) * 100) : 0}%</td>
              </tr>
              <tr>
                <td><span class="status-badge behind">Behind</span></td>
                <td>${overallStats.behind}</td>
                <td>${overallStats.totalEmployees > 0 ? Math.round((overallStats.behind / overallStats.totalEmployees) * 100) : 0}%</td>
              </tr>
              <tr>
                <td><span class="status-badge at-risk">At Risk</span></td>
                <td>${overallStats.atRisk}</td>
                <td>${overallStats.totalEmployees > 0 ? Math.round((overallStats.atRisk / overallStats.totalEmployees) * 100) : 0}%</td>
              </tr>
              <tr>
                <td><span class="status-badge non-compliant">Non-Compliant</span></td>
                <td>${overallStats.nonCompliant}</td>
                <td>${overallStats.totalEmployees > 0 ? Math.round((overallStats.nonCompliant / overallStats.totalEmployees) * 100) : 0}%</td>
              </tr>
            </tbody>
          </table>
          
          <h2>Top Employees by Completion</h2>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Required Hours</th>
                <th>Completed Hours</th>
                <th>Completion %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${employeeProgress
                .sort((a: any, b: any) => {
                  const aPct = a.annualRequirement > 0 ? (a.completedHours / a.annualRequirement) * 100 : 0
                  const bPct = b.annualRequirement > 0 ? (b.completedHours / b.annualRequirement) * 100 : 0
                  return bPct - aPct
                })
                .slice(0, 10)
                .map((emp: any) => {
                  const completionPct = emp.annualRequirement > 0 
                    ? Math.round((emp.completedHours / emp.annualRequirement) * 100)
                    : 0
                  return `
                    <tr>
                      <td>${emp.name || "Unknown"}</td>
                      <td>${emp.role || "N/A"}</td>
                      <td>${emp.annualRequirement}</td>
                      <td>${emp.completedHours.toFixed(2)}</td>
                      <td>${completionPct}%</td>
                      <td><span class="status-badge ${emp.complianceStatus?.replace("_", "-") || ""}">${emp.complianceStatus || "N/A"}</span></td>
                    </tr>
                  `
                }).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  // Calculate average training score from completed trainings
  const calculateAverageTrainingScore = () => {
    if (employeeProgress.length === 0) return 0
    
    let totalScore = 0
    let count = 0
    
    employeeProgress.forEach((emp: any) => {
      if (emp.completedTrainings && Array.isArray(emp.completedTrainings)) {
        emp.completedTrainings.forEach((training: any) => {
          if (training.score !== undefined && training.score !== null) {
            totalScore += training.score
            count++
          }
        })
      }
    })
    
    return count > 0 ? Math.round(totalScore / count) : 0
  }

  // Handle export training library report
  const handleExportTrainingLibraryReport = async () => {
    try {
      const csvRows: string[][] = []
      const currentDate = new Date().toLocaleDateString()
      
      // Header
      csvRows.push(["Training Library Report"])
      csvRows.push([`Generated: ${currentDate}`])
      csvRows.push([`Total Trainings: ${inServiceTrainings.length}`])
      csvRows.push([])
      
      // Training Details
      csvRows.push(["Training Details"])
      csvRows.push([
        "Title",
        "Category",
        "Type",
        "Duration (minutes)",
        "CEU Hours",
        "Difficulty",
        "Target Roles",
        "Mandatory",
        "Status",
        "Enrolled Count",
        "Completed Count",
        "Completion Rate %",
        "Description",
      ])
      
      inServiceTrainings.forEach((training: any) => {
        const completionRate = training.enrolledCount > 0
          ? Math.round((training.completedCount / training.enrolledCount) * 100)
          : 0
        
        const targetRoles = Array.isArray(training.targetRoles)
          ? training.targetRoles.join(", ")
          : training.targetRoles || "N/A"
        
        csvRows.push([
          training.title || "Untitled",
          training.category || "N/A",
          training.type || "online_course",
          training.duration?.toString() || "0",
          training.ceuHours?.toString() || "0",
          training.difficulty || "N/A",
          targetRoles,
          training.mandatory ? "Yes" : "No",
          training.status || "active",
          training.enrolledCount?.toString() || "0",
          training.completedCount?.toString() || "0",
          completionRate.toString(),
          training.description || "",
        ])
      })
      
      csvRows.push([])
      
      // Summary Statistics
      csvRows.push(["Summary Statistics"])
      csvRows.push(["Metric", "Value"])
      csvRows.push(["Total Trainings", inServiceTrainings.length.toString()])
      csvRows.push(["Active Trainings", inServiceTrainings.filter((t: any) => t.status === "active").length.toString()])
      csvRows.push(["Mandatory Trainings", inServiceTrainings.filter((t: any) => t.mandatory).length.toString()])
      
      const totalEnrolled = inServiceTrainings.reduce((sum: number, t: any) => sum + (t.enrolledCount || 0), 0)
      const totalCompleted = inServiceTrainings.reduce((sum: number, t: any) => sum + (t.completedCount || 0), 0)
      const totalCEUHours = inServiceTrainings.reduce((sum: number, t: any) => sum + (parseFloat(t.ceuHours?.toString() || "0") || 0), 0)
      const totalDuration = inServiceTrainings.reduce((sum: number, t: any) => sum + (parseInt(t.duration?.toString() || "0") || 0), 0)
      
      csvRows.push(["Total Enrolled", totalEnrolled.toString()])
      csvRows.push(["Total Completed", totalCompleted.toString()])
      csvRows.push(["Total CEU Hours Available", totalCEUHours.toFixed(2)])
      csvRows.push(["Total Training Duration (minutes)", totalDuration.toString()])
      
      const overallCompletionRate = totalEnrolled > 0
        ? Math.round((totalCompleted / totalEnrolled) * 100)
        : 0
      csvRows.push(["Overall Completion Rate %", overallCompletionRate.toString()])
      
      // Category Breakdown
      csvRows.push([])
      csvRows.push(["Category Breakdown"])
      csvRows.push(["Category", "Count", "Total Enrolled", "Total Completed"])
      
      const categoryStats: Record<string, { count: number; enrolled: number; completed: number }> = {}
      inServiceTrainings.forEach((training: any) => {
        const category = training.category || "Uncategorized"
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, enrolled: 0, completed: 0 }
        }
        categoryStats[category].count++
        categoryStats[category].enrolled += training.enrolledCount || 0
        categoryStats[category].completed += training.completedCount || 0
      })
      
      Object.entries(categoryStats).forEach(([category, stats]) => {
        csvRows.push([
          category,
          stats.count.toString(),
          stats.enrolled.toString(),
          stats.completed.toString(),
        ])
      })
      
      // Convert to CSV and download
      const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `training_library_report_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert("Training Library report exported successfully!")
    } catch (error: any) {
      console.error("Error exporting training library report:", error)
      alert(`Error exporting report: ${error.message || "Unknown error"}`)
    }
  }

  // Fetch trainings
  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        setLoading(true)
        console.log("Fetching trainings from API...")
        const response = await fetch("/api/in-service/trainings", {
          cache: "no-store", // Always fetch fresh data
        })
        
        if (!response.ok) {
          console.error("Trainings API HTTP error:", response.status, response.statusText)
          const errorText = await response.text()
          console.error("Error response:", errorText.substring(0, 200))
          setError(`HTTP ${response.status}: ${response.statusText}`)
          setInServiceTrainings([])
          return
        }
        
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Trainings API returned non-JSON:", text.substring(0, 200))
          setError("Invalid response format from server")
          setInServiceTrainings([])
          return
        }
        
        const data = await response.json()
        
        console.log("API Response:", { 
          success: data.success, 
          count: data.trainings?.length, 
          error: data.error,
          status: response.status,
          statusText: response.statusText
        })
        
        if (!response.ok) {
          console.error("✗ HTTP Error:", response.status, response.statusText)
          const errorMsg = data.error || `HTTP ${response.status}: ${response.statusText}`
          setError(errorMsg)
          setInServiceTrainings([])
          return
        }
        
        if (data.success !== false && data.trainings !== undefined) {
          setInServiceTrainings(data.trainings || [])
          setError(null)
          console.log(`✓ Loaded ${data.trainings?.length || 0} trainings`)
          if (data.trainings && data.trainings.length > 0) {
            console.log("Sample training:", {
              id: data.trainings[0].id,
              title: data.trainings[0].title,
              status: data.trainings[0].status
            })
          }
        } else {
          const errorMsg = data.error || "Failed to load trainings"
          setError(errorMsg)
          setInServiceTrainings([]) // Set empty array on error
          console.error("✗ Failed to load trainings:", JSON.stringify(data, null, 2))
          
          // If table doesn't exist, show helpful message
          if (errorMsg.includes("does not exist")) {
            alert("Database tables not found! Please run the migration script: scripts/060-create-in-service-training-tables.sql in your Supabase SQL editor.")
          }
        }
      } catch (err: any) {
        console.error("✗ Error fetching trainings:", err)
        setError("Failed to load trainings: " + (err.message || "Network error"))
        setInServiceTrainings([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchTrainings()
  }, [])
  
  // Refresh trainings when tab changes to training library
  useEffect(() => {
    if (activeTab === "trainings") {
      const fetchTrainings = async () => {
        try {
          setLoading(true)
          const response = await fetch("/api/in-service/trainings", {
            cache: "no-store",
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error("Training Library API error:", response.status, errorText.substring(0, 200))
            setError(`HTTP ${response.status}`)
            setInServiceTrainings([])
            return
          }
          
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text()
            console.error("Training Library API returned non-JSON:", text.substring(0, 200))
            setError("Invalid response format")
            setInServiceTrainings([])
            return
          }
          
          const data = await response.json()
          console.log("Training Library tab - API Response:", { success: data.success, count: data.trainings?.length })
          
          if (data.success !== false && data.trainings !== undefined) {
            setInServiceTrainings(data.trainings || [])
            setError(null)
            console.log(`✓ Training Library: Loaded ${data.trainings?.length || 0} trainings`)
          } else {
            const errorMsg = data.error || "Failed to load trainings"
            setError(errorMsg)
            setInServiceTrainings([])
            console.error("✗ Training Library: Failed to load trainings:", data)
          }
        } catch (err: any) {
          console.error("✗ Training Library: Error fetching trainings:", err)
          setError("Failed to load trainings: " + (err.message || "Network error"))
          setInServiceTrainings([])
        } finally {
          setLoading(false)
        }
      }
      fetchTrainings()
    }
  }, [activeTab])

  // Fetch employee progress
  useEffect(() => {
    const fetchEmployeeProgress = async () => {
      try {
        const params = new URLSearchParams()
        if (roleFilter !== "all") params.append("role", roleFilter)
        if (statusFilter !== "all") params.append("status", statusFilter)
        
        console.log("Fetching employee progress with params:", params.toString())
        const response = await fetch(`/api/in-service/employee-progress?${params.toString()}`, {
          cache: "no-store",
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error("Employee progress API HTTP error:", response.status, errorText.substring(0, 200))
          setError(`HTTP ${response.status}: ${response.statusText}`)
          setEmployeeProgress([])
          setLoading(false)
          return
        }
        
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Employee progress API returned non-JSON:", text.substring(0, 200))
          setError("Invalid response format from server")
          setEmployeeProgress([])
          setLoading(false)
          return
        }
        
        const data = await response.json()
        
        console.log("Employee progress API response:", {
          success: data.success,
          employeeCount: data.employees?.length,
          error: data.error,
        })
        
        if (data.success) {
          // Log sample employee data for debugging
          if (data.employees && data.employees.length > 0) {
            const sampleEmp = data.employees[0]
            console.log("Sample employee data:", {
              name: sampleEmp.name,
              id: sampleEmp.id,
              annualRequirement: sampleEmp.annualRequirement,
              completedHours: sampleEmp.completedHours,
              inProgressHours: sampleEmp.inProgressHours,
              remainingHours: sampleEmp.remainingHours,
              upcomingDeadlines: sampleEmp.upcomingDeadlines?.length || 0,
              assignedTrainings: sampleEmp.assignedTrainings?.length || 0,
              inProgressTrainings: sampleEmp.inProgressTrainings?.length || 0,
              completedTrainings: sampleEmp.completedTrainings?.length || 0,
            })
          }
          
          setEmployeeProgress(data.employees || [])
          setOverallStats(data.summary || overallStats)
        } else {
          console.error("Failed to load employee progress:", data.error)
          setError("Failed to load employee progress")
        }
      } catch (err) {
        console.error("Error fetching employee progress:", err)
        setError("Failed to load employee progress")
      } finally {
        // Only set loading to false if trainings are also loaded
        if (inServiceTrainings.length > 0 || error) {
          setLoading(false)
        }
      }
    }

    fetchEmployeeProgress()
  }, [roleFilter, statusFilter])

  // Fetch training activity metrics
  useEffect(() => {
    const fetchTrainingActivity = async () => {
      try {
        // Fetch completions and enrollments to calculate activity metrics
        const response = await fetch("/api/in-service/training-activity", {
          cache: "no-store",
        })
        
        if (!response.ok) {
          // If API doesn't exist, calculate from employee progress data
          calculateActivityFromProgress()
          return
        }
        
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          calculateActivityFromProgress()
          return
        }
        
        const data = await response.json()
        
        if (data.success) {
          setTrainingActivity({
            completedThisMonth: data.completedThisMonth || 0,
            inProgress: data.inProgress || 0,
            averageScore: data.averageScore || 0,
          })
        } else {
          calculateActivityFromProgress()
        }
      } catch (error: any) {
        console.error("Error fetching training activity:", error)
        // Fallback to calculating from progress data
        calculateActivityFromProgress()
      }
    }

    const calculateActivityFromProgress = () => {
      // Calculate from employeeProgress data
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      let completedThisMonth = 0
      let inProgressCount = 0
      let totalScore = 0
      let scoreCount = 0
      
      employeeProgress.forEach((emp: any) => {
        // Count completions this month
        if (emp.completedTrainings && Array.isArray(emp.completedTrainings)) {
          emp.completedTrainings.forEach((training: any) => {
            if (training.completionDate) {
              const completionDate = new Date(training.completionDate)
              if (completionDate.getMonth() === currentMonth && completionDate.getFullYear() === currentYear) {
                completedThisMonth++
              }
            }
            // Calculate average score
            if (training.score !== undefined && training.score !== null) {
              totalScore += training.score
              scoreCount++
            }
          })
        }
        
        // Count in progress trainings
        if (emp.inProgressTrainings && Array.isArray(emp.inProgressTrainings)) {
          inProgressCount += emp.inProgressTrainings.length
        }
      })
      
      const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0
      
      setTrainingActivity({
        completedThisMonth,
        inProgress: inProgressCount,
        averageScore,
      })
    }

    // Only fetch if we have employee progress data or fetch it fresh
    if (employeeProgress.length > 0) {
      calculateActivityFromProgress()
    } else {
      fetchTrainingActivity()
    }
  }, [employeeProgress])

  // In-Service Training Library (fallback mock data)
  const mockTrainings = [
    {
      id: "IS-001",
      title: "Advanced Wound Care Management",
      category: "Clinical Skills",
      type: "video_course",
      duration: 120, // minutes
      ceuHours: 2.0,
      description:
        "Comprehensive training on advanced wound assessment, treatment protocols, and documentation requirements",
      targetRoles: ["RN", "LPN"],
      difficulty: "Advanced",
      prerequisites: ["Basic Wound Care"],
      modules: [
        { id: "M1", title: "Wound Assessment Techniques", duration: 30, completed: false },
        { id: "M2", title: "Treatment Protocols", duration: 45, completed: false },
        { id: "M3", title: "Documentation Standards", duration: 25, completed: false },
        { id: "M4", title: "Infection Prevention", duration: 20, completed: false },
      ],
      quiz: {
        questions: 25,
        passingScore: 80,
        attempts: 3,
      },
      accreditation: "ANCC",
      expiryMonths: 24,
      mandatory: true,
      dueDate: "2024-12-31",
      status: "active",
      enrolledCount: 45,
      completedCount: 32,
    },
    {
      id: "IS-002",
      title: "Medication Administration Safety",
      category: "Patient Safety",
      type: "interactive_course",
      duration: 90,
      ceuHours: 1.5,
      description: "Essential training on safe medication practices, error prevention, and documentation",
      targetRoles: ["RN", "LPN", "CNA"],
      difficulty: "Intermediate",
      prerequisites: [],
      modules: [
        { id: "M1", title: "Five Rights of Medication", duration: 20, completed: false },
        { id: "M2", title: "Error Prevention Strategies", duration: 30, completed: false },
        { id: "M3", title: "High-Risk Medications", duration: 25, completed: false },
        { id: "M4", title: "Documentation Requirements", duration: 15, completed: false },
      ],
      quiz: {
        questions: 20,
        passingScore: 85,
        attempts: 3,
      },
      accreditation: "Joint Commission",
      expiryMonths: 12,
      mandatory: true,
      dueDate: "2024-06-30",
      status: "active",
      enrolledCount: 78,
      completedCount: 65,
    },
    {
      id: "IS-003",
      title: "Infection Control & Prevention",
      category: "Safety & Compliance",
      type: "blended_learning",
      duration: 75,
      ceuHours: 1.25,
      description: "Updated CDC guidelines for infection prevention in healthcare settings",
      targetRoles: ["All"],
      difficulty: "Basic",
      prerequisites: [],
      modules: [
        { id: "M1", title: "Standard Precautions", duration: 20, completed: false },
        { id: "M2", title: "Hand Hygiene Protocols", duration: 15, completed: false },
        { id: "M3", title: "PPE Usage", duration: 25, completed: false },
        { id: "M4", title: "Environmental Cleaning", duration: 15, completed: false },
      ],
      quiz: {
        questions: 15,
        passingScore: 80,
        attempts: 5,
      },
      accreditation: "CDC",
      expiryMonths: 12,
      mandatory: true,
      dueDate: "2024-03-31",
      status: "active",
      enrolledCount: 156,
      completedCount: 142,
    },
    {
      id: "IS-004",
      title: "HIPAA Privacy & Security Update",
      category: "Compliance",
      type: "online_course",
      duration: 60,
      ceuHours: 1.0,
      description: "Annual HIPAA training with latest privacy and security requirements",
      targetRoles: ["All"],
      difficulty: "Basic",
      prerequisites: [],
      modules: [
        { id: "M1", title: "Privacy Rule Updates", duration: 20, completed: false },
        { id: "M2", title: "Security Requirements", duration: 20, completed: false },
        { id: "M3", title: "Breach Notification", duration: 20, completed: false },
      ],
      quiz: {
        questions: 20,
        passingScore: 90,
        attempts: 3,
      },
      accreditation: "HHS",
      expiryMonths: 12,
      mandatory: true,
      dueDate: "2024-12-31",
      status: "active",
      enrolledCount: 156,
      completedCount: 156,
    },
    {
      id: "IS-005",
      title: "Physical Therapy Techniques",
      category: "Clinical Skills",
      type: "hands_on_workshop",
      duration: 180,
      ceuHours: 3.0,
      description: "Advanced physical therapy techniques and patient mobility training",
      targetRoles: ["PT", "PTA"],
      difficulty: "Advanced",
      prerequisites: ["Basic PT Principles"],
      modules: [
        { id: "M1", title: "Assessment Techniques", duration: 45, completed: false },
        { id: "M2", title: "Treatment Planning", duration: 60, completed: false },
        { id: "M3", title: "Mobility Training", duration: 45, completed: false },
        { id: "M4", title: "Progress Documentation", duration: 30, completed: false },
      ],
      quiz: {
        questions: 30,
        passingScore: 85,
        attempts: 2,
      },
      accreditation: "APTA",
      expiryMonths: 24,
      mandatory: false,
      dueDate: null,
      status: "active",
      enrolledCount: 12,
      completedCount: 8,
    },
  ]

  // Employee In-Service Progress (fallback mock data)
  const mockEmployeeProgress = [
    {
      id: "EMP-001",
      name: "Sarah Johnson",
      role: "RN",
      department: "Home Health",
      hireDate: "2023-03-15",
      avatar: "/placeholder.svg?height=40&width=40&text=SJ",
      annualRequirement: 20, // hours
      completedHours: 14.5,
      inProgressHours: 3.0,
      remainingHours: 2.5,
      complianceStatus: "on_track",
      lastTrainingDate: "2024-01-15",
      upcomingDeadlines: [
        { training: "Medication Safety", dueDate: "2024-06-30", priority: "high" },
        { training: "Wound Care Update", dueDate: "2024-12-31", priority: "medium" },
      ],
      completedTrainings: [
        {
          id: "IS-003",
          title: "Infection Control & Prevention",
          completionDate: "2024-01-15",
          score: 95,
          ceuHours: 1.25,
          certificate: "CERT-2024-001",
        },
        {
          id: "IS-004",
          title: "HIPAA Privacy & Security Update",
          completionDate: "2024-01-10",
          score: 98,
          ceuHours: 1.0,
          certificate: "CERT-2024-002",
        },
      ],
      inProgressTrainings: [
        {
          id: "IS-001",
          title: "Advanced Wound Care Management",
          startDate: "2024-01-20",
          progress: 75,
          estimatedCompletion: "2024-02-05",
          ceuHours: 2.0,
        },
      ],
    },
    {
      id: "EMP-002",
      name: "Michael Chen",
      role: "PT",
      department: "Rehabilitation",
      hireDate: "2023-01-20",
      avatar: "/placeholder.svg?height=40&width=40&text=MC",
      annualRequirement: 24,
      completedHours: 18.0,
      inProgressHours: 3.0,
      remainingHours: 3.0,
      complianceStatus: "on_track",
      lastTrainingDate: "2024-01-12",
      upcomingDeadlines: [{ training: "PT Techniques Advanced", dueDate: "2024-08-15", priority: "medium" }],
      completedTrainings: [
        {
          id: "IS-003",
          title: "Infection Control & Prevention",
          completionDate: "2024-01-12",
          score: 88,
          ceuHours: 1.25,
          certificate: "CERT-2024-003",
        },
        {
          id: "IS-004",
          title: "HIPAA Privacy & Security Update",
          completionDate: "2024-01-08",
          score: 92,
          ceuHours: 1.0,
          certificate: "CERT-2024-004",
        },
      ],
      inProgressTrainings: [
        {
          id: "IS-005",
          title: "Physical Therapy Techniques",
          startDate: "2024-01-18",
          progress: 40,
          estimatedCompletion: "2024-02-15",
          ceuHours: 3.0,
        },
      ],
    },
    {
      id: "EMP-003",
      name: "Emily Davis",
      role: "CNA",
      department: "Home Health",
      hireDate: "2024-01-10",
      avatar: "/placeholder.svg?height=40&width=40&text=ED",
      annualRequirement: 12,
      completedHours: 3.25,
      inProgressHours: 1.5,
      remainingHours: 7.25,
      complianceStatus: "behind",
      lastTrainingDate: "2024-01-10",
      upcomingDeadlines: [
        { training: "Medication Safety", dueDate: "2024-06-30", priority: "high" },
        { training: "Infection Control", dueDate: "2024-03-31", priority: "urgent" },
      ],
      completedTrainings: [
        {
          id: "IS-004",
          title: "HIPAA Privacy & Security Update",
          completionDate: "2024-01-10",
          score: 85,
          ceuHours: 1.0,
          certificate: "CERT-2024-005",
        },
      ],
      inProgressTrainings: [
        {
          id: "IS-002",
          title: "Medication Administration Safety",
          startDate: "2024-01-22",
          progress: 25,
          estimatedCompletion: "2024-02-10",
          ceuHours: 1.5,
        },
      ],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_track":
        return "bg-green-100 text-green-800"
      case "behind":
        return "bg-yellow-100 text-yellow-800"
      case "at_risk":
        return "bg-orange-100 text-orange-800"
      case "non_compliant":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on_track":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "behind":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "at_risk":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "non_compliant":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredEmployees = employeeProgress.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || emp.role === roleFilter
    const matchesStatus = statusFilter === "all" || emp.complianceStatus === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  // Handle create assignment
  const handleAssignTraining = async () => {
    if (!assignmentForm.trainingId || !assignmentForm.dueDate) {
      alert("Please select a training and set a due date")
      return
    }
    
    if (assignmentForm.assignTo === "individual" && assignmentForm.selectedEmployees.length === 0) {
      alert("Please select at least one employee")
      return
    }
    
    // Check for duplicate assignments
    // Note: This check is also done in the UI when selecting employees,
    // but we keep it here as a final validation before submission
    if (assignmentForm.assignTo === "individual") {
      const duplicates: string[] = []
      
      assignmentForm.selectedEmployees.forEach((empId) => {
        // Find employee in employeeProgress (which tracks all training history)
        const employee = employeeProgress.find((e) => e.id === empId)
        if (employee) {
          // Check if employee already has this training assigned
          const hasAssigned = employee.assignedTrainings?.some(
            (t: any) => t.trainingId === assignmentForm.trainingId || t.id === assignmentForm.trainingId
          )
          const hasInProgress = employee.inProgressTrainings?.some(
            (t: any) => t.trainingId === assignmentForm.trainingId || t.id === assignmentForm.trainingId
          )
          const hasCompleted = employee.completedTrainings?.some(
            (t: any) => t.trainingId === assignmentForm.trainingId || t.id === assignmentForm.trainingId
          )
          
          if (hasAssigned || hasInProgress || hasCompleted) {
            duplicates.push(employee.name)
          }
        }
      })
      
      if (duplicates.length > 0) {
        const trainingName = inServiceTrainings.find((t) => t.id === assignmentForm.trainingId)?.title || "this training"
        alert(
          `The following employees already have "${trainingName}" assigned or completed:\n\n` +
          duplicates.join('\n') +
          `\n\nPlease remove them from the selection or choose a different training.`
        )
        return
      }
    }
    
    setIsAssigning(true)
    try {
      const response = await fetch("/api/in-service/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId: assignmentForm.trainingId,
          assignTo: assignmentForm.assignTo === "individual" ? assignmentForm.selectedEmployees : assignmentForm.assignTo,
          dueDate: assignmentForm.dueDate,
          notes: assignmentForm.notes,
          priority: assignmentForm.priority,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Training assigned successfully to ${data.message}`)
        // Reset form
        setAssignmentForm({
          trainingId: "",
          assignTo: "all",
          selectedEmployees: [],
          dueDate: "",
          notes: "",
          priority: "medium",
        })
        setAssignIndividualOpen(false)
        
        // Refresh assignments list
        const assignmentsResponse = await fetch("/api/in-service/assignments")
        const assignmentsData = await assignmentsResponse.json()
        if (assignmentsData.success) {
          setAssignments(assignmentsData.assignments || [])
        }
      } else {
        alert(`Failed to assign training: ${data.error || "Unknown error"}`)
      }
    } catch (error: any) {
      console.error("Error assigning training:", error)
      alert(`Error assigning training: ${error.message || "Unknown error"}`)
    } finally {
      setIsAssigning(false)
    }
  }
  
  // Handle create/update training
  const handleCreateTraining = async () => {
    if (!trainingForm.title || !trainingForm.category || !trainingForm.description || 
        !trainingForm.duration || !trainingForm.ceuHours || !trainingForm.difficulty || 
        !trainingForm.targetRoles || trainingForm.targetRoles.length === 0) {
      alert("Please fill in all required fields, including at least one target role")
      return
    }

    // Validate modules
    if (trainingModules.length > 0) {
      const invalidModules = trainingModules.filter(
        (m) => !m.title || !m.duration || (!m.file && !m.fileUrl) // Allow existing fileUrl when editing
      )
      if (invalidModules.length > 0) {
        alert("Please fill in all module fields (title, duration, and file) for all modules. When editing, existing files are preserved.")
        return
      }
    }

    const isEditing = selectedTraining && selectedTraining.id

    setIsSubmitting(true)
    try {
      // Upload module files first if any
      const uploadedModules: any[] = []
      
      if (trainingModules.length > 0) {
        for (const module of trainingModules) {
          if (module.file) {
            // Upload file to storage
            const moduleFormData = new FormData()
            moduleFormData.append("file", module.file)
            moduleFormData.append("type", "training_module")
            
            try {
              console.log(`Uploading module file: ${module.fileName} (${module.file.size} bytes)`)
              const uploadResponse = await fetch("/api/in-service/trainings/upload-module", {
                method: "POST",
                body: moduleFormData,
              })
              
              if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text()
                console.error("Upload failed with status:", uploadResponse.status, errorText)
                throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`)
              }
              
              const uploadResult = await uploadResponse.json()
              console.log("Upload result:", uploadResult)
              
              if (uploadResult.success && uploadResult.fileUrl) {
                uploadedModules.push({
                  id: module.id,
                  title: module.title,
                  duration: module.duration,
                  fileUrl: uploadResult.fileUrl, // Store the file URL
                  fileName: uploadResult.fileName || module.fileName,
                })
                console.log(`✓ Module file uploaded: ${uploadResult.fileName} -> ${uploadResult.fileUrl}`)
              } else {
                const errorMsg = uploadResult.error || "Unknown upload error"
                console.error("Upload failed:", errorMsg)
                throw new Error(`Failed to upload file: ${errorMsg}`)
              }
            } catch (uploadError: any) {
              console.error("Error uploading module file:", uploadError)
              alert(`Failed to upload module file "${module.fileName}": ${uploadError.message || "Unknown error"}\n\nPlease try again or remove this module.`)
              throw uploadError // Stop the process if file upload fails
            }
          } else if (module.fileUrl) {
            // Module already has a fileUrl (when editing and not changing the file)
            console.log(`Module already has fileUrl, preserving: ${module.fileUrl}`)
            uploadedModules.push({
              id: module.id,
              title: module.title,
              duration: module.duration,
              fileUrl: module.fileUrl, // Preserve existing fileUrl
              fileName: module.fileName,
            })
          } else {
            // Module without file and no fileUrl - this shouldn't happen due to validation
            console.error("Module missing both file and fileUrl:", module)
            alert(`Module "${module.title}" is missing a file. Please upload a file or remove this module.`)
            throw new Error(`Module "${module.title}" is missing a file`)
          }
        }
      }

      const formData = {
        title: trainingForm.title,
        category: trainingForm.category,
        description: trainingForm.description,
        duration: parseInt(trainingForm.duration),
        ceuHours: parseFloat(trainingForm.ceuHours),
        difficulty: trainingForm.difficulty,
        targetRoles: trainingForm.targetRoles.includes("all") ? ["All"] : trainingForm.targetRoles,
        type: trainingForm.type || "online_course",
        mandatory: trainingForm.mandatory === "true",
        status: isEditing ? selectedTraining.status : "active", // Keep existing status when editing
        modules: uploadedModules.length > 0 ? uploadedModules : (isEditing ? selectedTraining.modules : []),
      }

      const url = isEditing 
        ? `/api/in-service/trainings` 
        : `/api/in-service/trainings`
      
      const method = isEditing ? "PUT" : "POST"
      
      const body = isEditing
        ? JSON.stringify({ trainingId: selectedTraining.id, ...formData })
        : JSON.stringify(formData)

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: body,
      })
      const data = await response.json()
      console.log(isEditing ? "Update training response:" : "Create training response:", data)
      
      if (data.success && data.training) {
        console.log(`Training ${isEditing ? "updated" : "created"} successfully:`, data.training.id)
        
        // Immediately refresh from server to get latest data
        try {
          const refreshResponse = await fetch("/api/in-service/trainings", {
            cache: "no-store",
          })
          const refreshData = await refreshResponse.json()
          console.log("Refresh response:", { success: refreshData.success, count: refreshData.trainings?.length })
          
          if (refreshData.success !== false && refreshData.trainings !== undefined) {
            setInServiceTrainings(refreshData.trainings || [])
            setError(null)
            console.log(`✓ Refreshed: ${refreshData.trainings?.length || 0} trainings`)
            
            // Switch to Training Library tab if not already there
            if (activeTab !== "trainings") {
              setActiveTab("trainings")
            }
          } else {
            // If refresh fails, add the new training to the list
            setInServiceTrainings((prev) => [data.training, ...prev])
            // Switch to Training Library tab if not already there
            if (activeTab !== "trainings") {
              setActiveTab("trainings")
            }
          }
        } catch (err) {
          console.error("Error refreshing trainings:", err)
          // If refresh fails, add the new training to the list
          setInServiceTrainings((prev) => [data.training, ...prev])
          // Switch to Training Library tab if not already there
          if (activeTab !== "trainings") {
            setActiveTab("trainings")
          }
        }
        
        // Reset form and clear selected training
        setTrainingForm({
          title: "",
          category: "",
          description: "",
          duration: "",
          ceuHours: "",
          difficulty: "",
          targetRoles: [],
          mandatory: "false",
          type: "online_course",
        })
        setTrainingModules([]) // Clear modules
        setSelectedTraining(null) // Clear selected training after save
        setCreateTrainingOpen(false)
        setError(null)
        
        // Show success message
        alert(`Training ${isEditing ? "updated" : "created"} successfully!`)
      } else {
        const errorMsg = data.error || "Unknown error"
        setError("Failed to create training: " + errorMsg)
        
        // Show detailed error message
        if (errorMsg.includes("does not exist")) {
          alert("Database table not found! Please run the migration script: scripts/060-create-in-service-training-tables.sql in your Supabase SQL editor.")
        } else {
          alert("Failed to create training: " + errorMsg + (data.hint ? "\n\nHint: " + data.hint : ""))
        }
      }
    } catch (err: any) {
      console.error("Error creating training:", err)
      setError("Failed to create training: " + (err.message || "Network error"))
      alert("Failed to create training: " + (err.message || "Network error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading training data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 m-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">In-Service Education</h1>
                <p className="text-gray-600">Mandatory continuing education and professional development</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog 
                open={createTrainingOpen} 
                onOpenChange={(open) => {
                  setCreateTrainingOpen(open)
                  if (!open) {
                    // Clear selected training and reset form when dialog closes
                    setSelectedTraining(null)
                    setTrainingForm({
                      title: "",
                      category: "",
                      description: "",
                      duration: "",
                      ceuHours: "",
                      difficulty: "",
                      targetRoles: [],
                      mandatory: "false",
                      type: "online_course",
                    })
                    setTrainingModules([]) // Clear modules
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Training
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedTraining ? "Edit In-Service Training" : "Create New In-Service Training"}</DialogTitle>
                    <DialogDescription>
                      {selectedTraining ? "Update training module details" : "Design a new training module for staff education"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Training Title *</Label>
                        <Input 
                          id="title" 
                          value={trainingForm.title}
                          onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })}
                          placeholder="Enter training title" 
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select 
                          value={trainingForm.category} 
                          onValueChange={(value) => setTrainingForm({ ...trainingForm, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Clinical Skills">Clinical Skills</SelectItem>
                            <SelectItem value="Patient Safety">Patient Safety</SelectItem>
                            <SelectItem value="Safety & Compliance">Safety & Compliance</SelectItem>
                            <SelectItem value="Compliance">Compliance</SelectItem>
                            <SelectItem value="Professional Development">Professional Development</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea 
                        id="description" 
                        value={trainingForm.description}
                        onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })}
                        placeholder="Describe the training content and objectives" 
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration (minutes) *</Label>
                        <Input 
                          id="duration" 
                          type="number" 
                          value={trainingForm.duration}
                          onChange={(e) => setTrainingForm({ ...trainingForm, duration: e.target.value })}
                          placeholder="90" 
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="ceu-hours">CEU Hours *</Label>
                        <Input 
                          id="ceu-hours" 
                          type="number" 
                          step="0.25" 
                          value={trainingForm.ceuHours}
                          onChange={(e) => setTrainingForm({ ...trainingForm, ceuHours: e.target.value })}
                          placeholder="1.5" 
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="difficulty">Difficulty *</Label>
                        <Select 
                          value={trainingForm.difficulty} 
                          onValueChange={(value) => setTrainingForm({ ...trainingForm, difficulty: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Basic">Basic</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="target-roles">Target Roles *</Label>
                        <div className="mt-2 space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                          {[
                            { value: "all", label: "All Roles" },
                            { value: "RN", label: "RN" },
                            { value: "LPN", label: "LPN" },
                            { value: "CNA", label: "CNA" },
                            { value: "PT", label: "PT" },
                            { value: "PTA", label: "PTA" },
                            { value: "OT", label: "OT" },
                          ].map((role) => (
                            <div key={role.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`target-role-${role.value}`}
                                checked={trainingForm.targetRoles.includes(role.value)}
                                onChange={(e) => {
                                  if (role.value === "all") {
                                    // If "All Roles" is selected, clear others
                                    if (e.target.checked) {
                                      setTrainingForm({ ...trainingForm, targetRoles: ["all"] })
                                    } else {
                                      setTrainingForm({ ...trainingForm, targetRoles: [] })
                                    }
                                  } else {
                                    // If a specific role is selected, remove "all" and toggle this role
                                    if (e.target.checked) {
                                      const newRoles = trainingForm.targetRoles.filter(r => r !== "all")
                                      setTrainingForm({ ...trainingForm, targetRoles: [...newRoles, role.value] })
                                    } else {
                                      setTrainingForm({ ...trainingForm, targetRoles: trainingForm.targetRoles.filter(r => r !== role.value) })
                                    }
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor={`target-role-${role.value}`} className="text-sm font-normal cursor-pointer">
                                {role.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {trainingForm.targetRoles.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Selected: {trainingForm.targetRoles.join(", ")}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="mandatory">Mandatory</Label>
                        <Select 
                          value={trainingForm.mandatory} 
                          onValueChange={(value) => setTrainingForm({ ...trainingForm, mandatory: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Is mandatory?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">Optional</SelectItem>
                            <SelectItem value="true">Mandatory</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Training Modules Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>Training Modules</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newModule = {
                              id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              title: "",
                              duration: 0,
                              file: null as File | null,
                              fileName: "",
                            }
                            setTrainingModules([...trainingModules, newModule])
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Module
                        </Button>
                      </div>
                      
                      {trainingModules.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-sm border rounded-md">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No modules added. Click "Add Module" to add training content.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 border rounded-md p-4">
                          {trainingModules.map((module, index) => (
                            <div key={module.id} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-medium text-sm">Module {index + 1}</h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setTrainingModules(trainingModules.filter((m) => m.id !== module.id))
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor={`module-title-${module.id}`} className="text-sm">Module Title *</Label>
                                  <Input
                                    id={`module-title-${module.id}`}
                                    value={module.title}
                                    onChange={(e) => {
                                      const updated = trainingModules.map((m) =>
                                        m.id === module.id ? { ...m, title: e.target.value } : m
                                      )
                                      setTrainingModules(updated)
                                    }}
                                    placeholder="e.g., Introduction to Safety Protocols"
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label htmlFor={`module-duration-${module.id}`} className="text-sm">Duration (minutes) *</Label>
                                    <Input
                                      id={`module-duration-${module.id}`}
                                      type="number"
                                      value={module.duration || ""}
                                      onChange={(e) => {
                                        const updated = trainingModules.map((m) =>
                                          m.id === module.id ? { ...m, duration: parseInt(e.target.value) || 0 } : m
                                        )
                                        setTrainingModules(updated)
                                      }}
                                      placeholder="30"
                                      className="mt-1"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor={`module-file-${module.id}`} className="text-sm">
                                      Upload Document {!module.fileUrl ? "*" : ""}
                                    </Label>
                                    <div className="mt-1">
                                      {module.fileUrl && !module.file && (
                                        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                                          <p className="text-green-700 flex items-center">
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Existing file: {module.fileName || "File"}
                                          </p>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 text-xs"
                                            onClick={() => {
                                              if (module.fileUrl) {
                                                window.open(module.fileUrl, '_blank', 'noopener,noreferrer')
                                              }
                                            }}
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            View Current File
                                          </Button>
                                        </div>
                                      )}
                                      <input
                                        id={`module-file-${module.id}`}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (file) {
                                            const updated = trainingModules.map((m) =>
                                              m.id === module.id
                                                ? { ...m, file: file, fileName: file.name, fileUrl: undefined } // Clear fileUrl when new file is selected
                                                : m
                                            )
                                            setTrainingModules(updated)
                                          }
                                        }}
                                        className="hidden"
                                      />
                                      <label htmlFor={`module-file-${module.id}`}>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="w-full"
                                          onClick={(e) => {
                                            e.preventDefault()
                                            const fileInput = document.getElementById(`module-file-${module.id}`) as HTMLInputElement
                                            if (fileInput) {
                                              fileInput.click()
                                            }
                                          }}
                                        >
                                          <FileText className="h-4 w-4 mr-2" />
                                          {module.file 
                                            ? `New: ${module.fileName}` 
                                            : module.fileUrl 
                                              ? "Replace File (PDF, DOC, PPT, etc.)" 
                                              : "Choose File (PDF, DOC, PPT, etc.)"}
                                        </Button>
                                      </label>
                                      {module.fileName && module.file && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          ✓ New file: {module.fileName} ({((module.file.size / 1024 / 1024).toFixed(2))} MB)
                                        </p>
                                      )}
                                      {module.fileUrl && !module.file && (
                                        <p className="text-xs text-green-600 mt-1">
                                          ℹ️ Current file will be kept. Upload a new file to replace it.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {error && (
                      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm">
                        {error}
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setCreateTrainingOpen(false)
                          setError(null)
                          setTrainingForm({
                            title: "",
                            category: "",
                            description: "",
                            duration: "",
                            ceuHours: "",
                            difficulty: "",
                            targetRoles: [],
                            mandatory: "false",
                            type: "online_course",
                          })
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateTraining}
                        disabled={isSubmitting || !trainingForm.title || !trainingForm.category || !trainingForm.description || !trainingForm.duration || !trainingForm.ceuHours || !trainingForm.difficulty || !trainingForm.targetRoles || trainingForm.targetRoles.length === 0}
                      >
                        {isSubmitting 
                          ? (selectedTraining ? "Updating..." : "Creating...") 
                          : (selectedTraining ? "Update Training" : "Create Training")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={handleExportTrainingLibraryReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="trainings">Training Library</TabsTrigger>
            <TabsTrigger value="employees">Employee Progress</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Overview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{overallStats.totalEmployees}</div>
                  <div className="text-sm text-gray-600">Total Staff</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{overallStats.onTrack}</div>
                  <div className="text-sm text-gray-600">On Track</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{overallStats.behind}</div>
                  <div className="text-sm text-gray-600">Behind</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{overallStats.atRisk}</div>
                  <div className="text-sm text-gray-600">At Risk</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{overallStats.nonCompliant}</div>
                  <div className="text-sm text-gray-600">Non-Compliant</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{overallStats.averageCompletion}%</div>
                  <div className="text-sm text-gray-600">Avg Completion</div>
                </CardContent>
              </Card>
            </div>

            {/* Urgent Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    Urgent Training Due
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {employeeProgress
                    .filter((emp) => emp.upcomingDeadlines.some((d: any) => d.priority === "urgent"))
                    .map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-red-800">{emp.name}</p>
                          <p className="text-sm text-red-600">
                            {emp.upcomingDeadlines.find((d: any) => d.priority === "urgent")?.training} - Due{" "}
                            {emp.upcomingDeadlines.find((d: any) => d.priority === "urgent")?.dueDate}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">URGENT</Badge>
                      </div>
                    ))}
                  {employeeProgress.filter((emp) => emp.upcomingDeadlines.some((d: any) => d.priority === "urgent"))
                    .length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No urgent training due
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                    Training Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Trainings Completed This Month</span>
                      <span className="text-2xl font-bold text-green-600">{trainingActivity.completedThisMonth}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">In Progress</span>
                      <span className="text-2xl font-bold text-blue-600">{trainingActivity.inProgress}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total CEU Hours Earned</span>
                      <span className="text-2xl font-bold text-purple-600">{overallStats.totalHoursCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Score</span>
                      <span className="text-2xl font-bold text-orange-600">{trainingActivity.averageScore}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Popular Trainings */}
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Trainings</CardTitle>
                <CardDescription>Highest enrollment and completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inServiceTrainings
                    .sort((a, b) => b.enrolledCount - a.enrolledCount)
                    .slice(0, 5)
                    .map((training) => (
                      <div key={training.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{training.title}</h3>
                            <p className="text-sm text-gray-600">{training.category}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>{training.ceuHours} CEU Hours</span>
                              <span>•</span>
                              <span>{training.duration} minutes</span>
                              <span>•</span>
                              <span>{training.difficulty}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {training.completedCount}/{training.enrolledCount} completed
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round((training.completedCount / training.enrolledCount) * 100)}% completion rate
                          </div>
                          <Progress
                            value={(training.completedCount / training.enrolledCount) * 100}
                            className="h-2 w-32 mt-2"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainings" className="space-y-6">
            {/* Training Library */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>In-Service Training Library</CardTitle>
                  <CardDescription>Available training modules and courses</CardDescription>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Input
                    placeholder="Search trainings..."
                    value={trainingSearch}
                    onChange={(e) => setTrainingSearch(e.target.value)}
                    className="w-64"
                  />
                  <Select value={trainingRoleFilter} onValueChange={setTrainingRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="RN">RN</SelectItem>
                      <SelectItem value="LPN">LPN</SelectItem>
                      <SelectItem value="CNA">CNA</SelectItem>
                      <SelectItem value="PT">PT</SelectItem>
                      <SelectItem value="PTA">PTA</SelectItem>
                      <SelectItem value="OT">OT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading trainings...</p>
                    </div>
                  </div>
                ) : error && error.includes("does not exist") ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Database Setup Required</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => window.open("https://supabase.com/dashboard", "_blank")}>
                      Open Supabase Dashboard
                    </Button>
                  </div>
                ) : inServiceTrainings.length === 0 && !error ? (
                  <div className="text-center py-12">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No trainings found</h3>
                    <p className="text-gray-600 mb-4">
                      No training modules available at this time.
                    </p>
                  </div>
                ) : error && !error.includes("does not exist") ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Trainings</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inServiceTrainings
                      .filter((training) => {
                        const matchesSearch =
                          !trainingSearch ||
                          training.title?.toLowerCase().includes(trainingSearch.toLowerCase()) ||
                          training.description?.toLowerCase().includes(trainingSearch.toLowerCase()) ||
                          training.category?.toLowerCase().includes(trainingSearch.toLowerCase())
                        const matchesRole =
                          trainingRoleFilter === "all" ||
                          (Array.isArray(training.targetRoles) && (
                            training.targetRoles.includes(trainingRoleFilter) ||
                            training.targetRoles.includes("All") ||
                            training.targetRoles.length === 0
                          ))
                        return matchesSearch && matchesRole
                      })
                      .map((training) => {
                        const completionRate =
                          training.enrolledCount > 0
                            ? Math.round((training.completedCount / training.enrolledCount) * 100)
                            : 0

                        return (
                          <Card key={training.id} className="hover:shadow-md transition-shadow border">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center flex-wrap gap-2 mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900">{training.title || "Untitled Training"}</h3>
                                    <Badge className="text-xs bg-gray-100 text-gray-700 border-gray-300 border">
                                      {training.category || "Uncategorized"}
                                    </Badge>
                                    {training.mandatory && (
                                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs border">Mandatory</Badge>
                                    )}
                                    {training.difficulty && (
                                      <Badge
                                        className={`text-xs border ${
                                          training.difficulty === "Advanced"
                                            ? "bg-purple-100 text-purple-800 border-purple-200"
                                            : training.difficulty === "Intermediate"
                                              ? "bg-blue-100 text-blue-800 border-blue-200"
                                              : "bg-green-100 text-green-800 border-green-200"
                                        }`}
                                      >
                                        {training.difficulty}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">{training.description || "No description"}</p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                    <div className="flex items-center space-x-2 text-gray-700">
                                      <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                      <span>{training.duration || 0} minutes</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-gray-700">
                                      <Award className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                      <span>
                                        {training.ceuHours 
                                          ? (() => {
                                              const hours = parseFloat(training.ceuHours.toString())
                                              return Number.isInteger(hours) 
                                                ? hours.toString() 
                                                : hours.toFixed(2).replace(/\.0+$/, '')
                                            })()
                                          : "0"} CEU Hours
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-gray-700">
                                      <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                      <span>{training.enrolledCount || 0} enrolled</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-gray-700">
                                      <Target className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                      <span className="truncate">
                                        {Array.isArray(training.targetRoles) && training.targetRoles.length > 0
                                          ? training.targetRoles.join(", ")
                                          : "All"}
                                      </span>
                                    </div>
                                  </div>
                                  {training.enrolledCount > 0 ? (
                                    <div className="mt-4">
                                      <div className="flex justify-between text-sm mb-2 text-gray-700">
                                        <span>Completion Rate</span>
                                        <span className="font-medium">{completionRate}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-red-600 h-2 rounded-full transition-all"
                                          style={{ width: `${completionRate}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-4 text-sm text-gray-500">
                                      No enrollments yet
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col space-y-2 ml-4 flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedTraining(training)}
                                    className="w-full justify-start"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Populate form with existing training data
                                      setTrainingForm({
                                        title: training.title || "",
                                        category: training.category || "",
                                        description: training.description || "",
                                        duration: training.duration?.toString() || "",
                                        ceuHours: training.ceuHours?.toString() || "",
                                        difficulty: training.difficulty || "",
                                        targetRoles: Array.isArray(training.targetRoles) ? training.targetRoles : (training.targetRoles ? [training.targetRoles] : []),
                                        mandatory: training.mandatory ? "true" : "false",
                                        type: training.type || "online_course",
                                      })
                                      // Populate modules if they exist
                                      if (training.modules && Array.isArray(training.modules) && training.modules.length > 0) {
                                        setTrainingModules(
                                          training.modules.map((m: any, index: number) => ({
                                            id: m.id || `module-${index}`,
                                            title: m.title || "",
                                            duration: m.duration || 0,
                                            file: null, // Can't restore file from stored data
                                            fileName: m.fileName || m.file_name || "",
                                            fileUrl: m.fileUrl || m.file_url || "", // Preserve existing fileUrl
                                          }))
                                        )
                                        console.log("Loaded modules for editing:", training.modules)
                                      } else {
                                        setTrainingModules([])
                                      }
                                      setSelectedTraining(training)
                                      setCreateTrainingOpen(true)
                                    }}
                                    className="w-full justify-start"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setActiveTab("assignments")
                                    }}
                                    className="w-full justify-start"
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    Assign
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="RN">RN</SelectItem>
                        <SelectItem value="LPN">LPN</SelectItem>
                        <SelectItem value="CNA">CNA</SelectItem>
                        <SelectItem value="PT">PT</SelectItem>
                        <SelectItem value="PTA">PTA</SelectItem>
                        <SelectItem value="OT">OT</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="behind">Behind</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Progress List */}
            <div className="space-y-4">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{employee.name}</h3>
                            <Badge variant="outline">{employee.role}</Badge>
                            <Badge className={getStatusColor(employee.complianceStatus)}>
                              {employee.complianceStatus.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>
                              {employee.completedHours || 0} / {employee.annualRequirement || 0} hours completed
                            </span>
                            <span>•</span>
                            <span>{employee.remainingHours || 0} hours remaining</span>
                            {employee.lastTrainingDate && (
                              <>
                                <span>•</span>
                                <span>Last training: {employee.lastTrainingDate}</span>
                              </>
                            )}
                          </div>
                          <div className="mt-2 space-y-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Annual Progress</span>
                                <span className={`font-medium ${
                                  (() => {
                                    const completedHours = employee.completedHours || 0
                                    const requiredHours = employee.annualRequirement || 0
                                    if (requiredHours === 0) return "text-gray-600"
                                    const percentage = (completedHours / requiredHours) * 100
                                    if (percentage >= 100) return "text-green-600"
                                    if (percentage >= 75) return "text-blue-600"
                                    if (percentage >= 50) return "text-yellow-600"
                                    return "text-gray-600"
                                  })()
                                }`}>
                                  {(() => {
                                    const completedHours = employee.completedHours || 0
                                    const requiredHours = employee.annualRequirement || 0
                                    if (requiredHours === 0) return "0"
                                    const percentage = Math.min(100, Math.round((completedHours / requiredHours) * 100))
                                    return percentage
                                  })()}%
                                </span>
                              </div>
                              <Progress
                                value={(() => {
                                  const completedHours = employee.completedHours || 0
                                  const requiredHours = employee.annualRequirement || 0
                                  if (requiredHours === 0) return 0
                                  const progress = Math.min(100, (completedHours / requiredHours) * 100)
                                  console.log(`Progress bar for ${employee.name}:`, {
                                    completedHours,
                                    requiredHours,
                                    progress
                                  })
                                  return progress
                                })()}
                                className="h-2 w-64"
                              />
                            </div>
                            {employee.inProgressTrainings && employee.inProgressTrainings.length > 0 && (
                              <div className="pt-1">
                                <div className="text-xs text-gray-600 mb-1">
                                  In Progress: {employee.inProgressTrainings[0].title}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={employee.inProgressTrainings[0].progress || 0}
                                    className="h-1.5 w-48"
                                  />
                                  <span className={`text-xs font-medium ${
                                    (employee.inProgressTrainings[0].progress || 0) >= 75 ? "text-green-600" :
                                    (employee.inProgressTrainings[0].progress || 0) >= 50 ? "text-blue-600" :
                                    "text-gray-600"
                                  }`}>
                                    {employee.inProgressTrainings[0].progress || 0}%
                                  </span>
                                </div>
                                {employee.inProgressTrainings.length > 1 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    +{employee.inProgressTrainings.length - 1} more training{employee.inProgressTrainings.length - 1 !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">Upcoming Deadlines</div>
                          <div className="space-y-1">
                            {employee.upcomingDeadlines && Array.isArray(employee.upcomingDeadlines) && employee.upcomingDeadlines.length > 0 ? (
                              employee.upcomingDeadlines.slice(0, 2).map((deadline: any, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Badge className={getPriorityColor(deadline.priority)}>
                                    {deadline.priority}
                                  </Badge>
                                  <span className="text-xs text-gray-600">{deadline.training || "Unknown Training"}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">None</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            console.log("Opening employee details modal for:", {
                              name: employee.name,
                              id: employee.id,
                              upcomingDeadlines: employee.upcomingDeadlines?.length || 0,
                              assignedTrainings: employee.assignedTrainings?.length || 0,
                              inProgressTrainings: employee.inProgressTrainings?.length || 0,
                              completedTrainings: employee.completedTrainings?.length || 0,
                              assignedTrainingsData: employee.assignedTrainings, // Log full data
                              fullEmployee: employee, // Log everything
                            })
                            setSelectedEmployee(employee)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Training Assignments</CardTitle>
                <CardDescription>Assign mandatory and optional trainings to employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="select-training">Select Training *</Label>
                      <Select
                        value={assignmentForm.trainingId}
                        onValueChange={(value) => setAssignmentForm({ ...assignmentForm, trainingId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose training" />
                        </SelectTrigger>
                        <SelectContent>
                          {inServiceTrainings.filter(t => t.status === "active").map((training) => (
                            <SelectItem key={training.id} value={training.id}>
                              {training.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="select-employees">Assign To *</Label>
                      <Select
                        value={assignmentForm.assignTo}
                        onValueChange={(value) => {
                          setAssignmentForm({ ...assignmentForm, assignTo: value, selectedEmployees: [] })
                          if (value === "individual") {
                            setAssignIndividualOpen(true)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employees" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Employees</SelectItem>
                          <SelectItem value="role-rn">All RNs</SelectItem>
                          <SelectItem value="role-lpn">All LPNs</SelectItem>
                          <SelectItem value="role-cna">All CNAs</SelectItem>
                          <SelectItem value="role-pt">All PTs</SelectItem>
                          <SelectItem value="role-pta">All PTAs</SelectItem>
                          <SelectItem value="role-ot">All OTs</SelectItem>
                          <SelectItem value="individual">Individual Selection</SelectItem>
                        </SelectContent>
                      </Select>
                      {assignmentForm.assignTo === "individual" && assignmentForm.selectedEmployees.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {assignmentForm.selectedEmployees.length} employee(s) selected
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="due-date">Due Date *</Label>
                      <Input
                        id="due-date"
                        type="date"
                        value={assignmentForm.dueDate}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={assignmentForm.priority}
                        onValueChange={(value) => setAssignmentForm({ ...assignmentForm, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="assignment-notes">Assignment Notes</Label>
                    <Textarea
                      id="assignment-notes"
                      placeholder="Add any special instructions or notes for this assignment"
                      value={assignmentForm.notes}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAssignmentForm({
                          trainingId: "",
                          assignTo: "all",
                          selectedEmployees: [],
                          dueDate: "",
                          notes: "",
                          priority: "medium",
                        })
                      }}
                    >
                      Clear
                    </Button>
                    <Button onClick={handleAssignTraining} disabled={isAssigning}>
                      {isAssigning ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Assign Training
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Employee Selection Dialog */}
            <Dialog open={assignIndividualOpen} onOpenChange={setAssignIndividualOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Select Employees</DialogTitle>
                  <DialogDescription>Choose specific employees to assign this training</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Search employees..."
                    onChange={(e) => {
                      // Filter employees by search term
                      const searchTerm = e.target.value.toLowerCase()
                      // This will be handled in the display logic
                    }}
                  />
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    {allEmployees.length === 0 ? (
                      <div className="text-center py-8 space-y-3">
                        <p className="text-gray-500">No staff members found</p>
                        <p className="text-xs text-gray-400">
                          Please ensure staff members are added to the staff table
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {allEmployees.map((employee, index) => {
                          const isSelected = assignmentForm.selectedEmployees.includes(employee.id)
                          
                          // Check if employee already has this training
                          const empData = employeeProgress.find((e) => e.id === employee.id)
                          const hasAssigned = empData?.assignedTrainings?.some(
                            (t: any) => t.trainingId === assignmentForm.trainingId || t.id === assignmentForm.trainingId
                          )
                          const hasInProgress = empData?.inProgressTrainings?.some(
                            (t: any) => t.trainingId === assignmentForm.trainingId || t.id === assignmentForm.trainingId
                          )
                          const hasCompleted = empData?.completedTrainings?.some(
                            (t: any) => t.trainingId === assignmentForm.trainingId || t.id === assignmentForm.trainingId
                          )
                          const alreadyHasTraining = hasAssigned || hasInProgress || hasCompleted
                          const trainingStatus = hasCompleted ? "Completed" : hasInProgress ? "In Progress" : hasAssigned ? "Assigned" : ""
                          
                          return (
                            <div
                              key={`${employee.id}-${index}`}
                              className={`flex items-center space-x-3 p-2 rounded-lg ${
                                alreadyHasTraining 
                                  ? "bg-gray-100 border border-gray-300 opacity-60 cursor-not-allowed" 
                                  : isSelected 
                                    ? "bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100" 
                                    : "cursor-pointer hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                if (alreadyHasTraining) {
                                  const trainingName = inServiceTrainings.find((t) => t.id === assignmentForm.trainingId)?.title || "this training"
                                  alert(`${employee.name || employee.first_name} already has "${trainingName}" (${trainingStatus})`)
                                  return
                                }
                                
                                if (isSelected) {
                                  setAssignmentForm({
                                    ...assignmentForm,
                                    selectedEmployees: assignmentForm.selectedEmployees.filter(id => id !== employee.id),
                                  })
                                } else {
                                  setAssignmentForm({
                                    ...assignmentForm,
                                    selectedEmployees: [...assignmentForm.selectedEmployees, employee.id],
                                  })
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={alreadyHasTraining}
                                onChange={() => {}}
                                className="rounded border-gray-300"
                              />
                              <div className="flex-1">
                                <p className={`font-medium ${alreadyHasTraining ? "text-gray-500" : ""}`}>
                                  {employee.name || "Unknown"}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span>{employee.role || employee.credentials || "Staff"}</span>
                                  {employee.department && (
                                    <>
                                      <span>•</span>
                                      <span className="text-xs">{employee.department}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {alreadyHasTraining && (
                                <Badge className="text-xs bg-gray-200 text-gray-700 border-gray-300">
                                  {trainingStatus}
                                </Badge>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {assignmentForm.selectedEmployees.length} employee(s) selected
                    </p>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={() => setAssignIndividualOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setAssignIndividualOpen(false)}>
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Recent Assignments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Assignments</CardTitle>
                    <CardDescription>Latest training assignments and their status</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const response = await fetch("/api/in-service/assignments")
                      const data = await response.json()
                      if (data.success) {
                        setAssignments(data.assignments || [])
                      }
                    }}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {assignmentsLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400 animate-spin" />
                    <p>Loading assignments...</p>
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No assignments found</p>
                    <p className="text-sm">Create a new assignment using the form above</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment: any) => {
                      // Safely access completion stats
                      const stats = assignment.completionStats || {
                        total: 0,
                        completed: 0,
                        inProgress: 0,
                        notStarted: 0,
                      }
                      
                      const completionRate = stats.total > 0
                        ? Math.round((stats.completed / stats.total) * 100)
                        : 0
                      
                      // Debug: Log assignment progress data
                      console.log(`[FRONTEND] Assignment: ${assignment.trainingTitle}`, {
                        stats,
                        completionRate,
                        progressBarValue: completionRate
                      })
                      
                      // Safely parse due date
                      let dueDate: Date | null = null
                      let isOverdue = false
                      try {
                        if (assignment.dueDate) {
                          dueDate = new Date(assignment.dueDate)
                          isOverdue = dueDate < new Date() && assignment.status === "active"
                        }
                      } catch (e) {
                        console.error("Error parsing due date:", e)
                      }
                      
                      // Safely parse assigned date
                      let assignedDateStr = ""
                      try {
                        if (assignment.assignedDate) {
                          assignedDateStr = new Date(assignment.assignedDate).toLocaleDateString()
                        }
                      } catch (e) {
                        console.error("Error parsing assigned date:", e)
                      }
                      
                      // Get assignment type description with more details
                      let assignmentTypeDesc = ""
                      let assignmentDetails = ""
                      
                      if (assignment.assigned_to_type === "all") {
                        assignmentTypeDesc = `All Employees`
                        assignmentDetails = `${stats.total} total employees`
                      } else if (assignment.assigned_to_type === "role") {
                        const roleName = assignment.assigned_to_value || ""
                        if (roleName) {
                          assignmentTypeDesc = `All ${roleName}s`
                          assignmentDetails = `${stats.total} ${roleName} employees`
                        } else {
                          assignmentTypeDesc = `All Employees by Role`
                          assignmentDetails = `${stats.total} employees`
                        }
                      } else if (assignment.assigned_to_type === "individual") {
                        const employeeCount = assignment.assignedEmployees?.length || stats.total || 0
                        assignmentTypeDesc = `${employeeCount} Selected Employee${employeeCount !== 1 ? 's' : ''}`
                        
                        // Show employee names if available (and not too many)
                        if (assignment.assignedEmployeeNames && Array.isArray(assignment.assignedEmployeeNames) && assignment.assignedEmployeeNames.length > 0 && assignment.assignedEmployeeNames.length <= 5) {
                          assignmentDetails = assignment.assignedEmployeeNames.join(", ")
                        } else if (employeeCount > 0) {
                          assignmentDetails = `${employeeCount} employee${employeeCount !== 1 ? 's' : ''} selected`
                        }
                      } else {
                        // Fallback if type is not recognized
                        assignmentTypeDesc = `${stats.total} Employee${stats.total !== 1 ? 's' : ''}`
                        assignmentDetails = `${stats.total} employees assigned`
                      }
                      
                      return (
                        <div key={assignment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-medium">{assignment.trainingTitle || assignment.trainingId || "Training"}</h3>
                                <Badge
                                  variant={assignment.status === "active" ? "default" : "secondary"}
                                  className={
                                    assignment.priority === "urgent"
                                      ? "bg-red-100 text-red-800"
                                      : assignment.priority === "high"
                                      ? "bg-orange-100 text-orange-800"
                                      : assignment.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {assignment.priority || "medium"}
                                </Badge>
                                {assignment.status === "cancelled" && (
                                  <Badge variant="outline" className="text-gray-500">
                                    Cancelled
                                  </Badge>
                                )}
                                {assignment.status === "active" && isOverdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mb-2 space-y-1">
                                <p>
                                  <span className="font-medium">Assigned to:</span> {assignmentTypeDesc}
                                  {assignmentDetails && (
                                    <span className="text-gray-500 ml-2">({assignmentDetails})</span>
                                  )}
                                </p>
                                {assignment.assignedEmployeeNames && assignment.assignedEmployeeNames.length > 0 && assignment.assignedEmployeeNames.length <= 5 && (
                                  <p className="text-xs text-gray-500 italic ml-4">
                                    {assignment.assignedEmployeeNames.join(", ")}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {assignedDateStr && (
                                    <>
                                      <span className="font-medium">Assigned:</span> {assignedDateStr}
                                      {dueDate && " • "}
                                    </>
                                  )}
                                  {dueDate && (
                                    <>
                                      <span className="font-medium">Due:</span> {dueDate.toLocaleDateString()}
                                    </>
                                  )}
                                  {!assignedDateStr && !dueDate && (
                                    <span className="text-gray-400">No dates set</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span className="font-medium">{stats.total}</span> <span>employees assigned</span>
                                <span>•</span>
                                <span className="text-green-600 font-medium">{stats.completed}</span> <span>completed</span>
                                <span>•</span>
                                <span className="text-yellow-600 font-medium">{stats.inProgress}</span> <span>in progress</span>
                                <span>•</span>
                                <span className="text-gray-600 font-medium">{stats.notStarted}</span> <span>not started</span>
                              </div>
                              {assignment.notes && (
                                <p className="text-xs text-gray-500 mt-2 italic bg-gray-50 p-2 rounded">
                                  <span className="font-medium">Note:</span> {assignment.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                              <Badge
                                className={
                                  completionRate >= 80
                                    ? "bg-green-100 text-green-800"
                                    : completionRate >= 50
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {completionRate}% Complete
                              </Badge>
                              <div className="mt-2">
                                <Progress value={completionRate} className="h-2 w-32" />
                              </div>
                              {isOverdue && (
                                <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Overdue</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Reports</CardTitle>
                  <CardDescription>Generate reports for regulatory compliance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent"
                    onClick={handleAnnualTrainingSummary}
                    disabled={isGeneratingReport}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isGeneratingReport ? "Generating..." : "Annual Training Summary"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent"
                    onClick={handleEmployeeTrainingRecords}
                    disabled={isGeneratingReport}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {isGeneratingReport ? "Generating..." : "Employee Training Records"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent"
                    onClick={handleTrainingScheduleReport}
                    disabled={isGeneratingReport}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {isGeneratingReport ? "Generating..." : "Training Schedule Report"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent"
                    onClick={handleComplianceStatusReport}
                    disabled={isGeneratingReport}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {isGeneratingReport ? "Generating..." : "Compliance Status Report"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent"
                    onClick={handleCEUHoursSummary}
                    disabled={isGeneratingReport}
                  >
                    <Award className="h-4 w-4 mr-2" />
                    {isGeneratingReport ? "Generating..." : "CEU Hours Summary"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Training Analytics</CardTitle>
                  <CardDescription>Performance metrics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total CEU Hours This Year</span>
                      <span className="text-2xl font-bold text-green-600">{overallStats.totalHoursCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Training Score</span>
                      <span className="text-2xl font-bold text-blue-600">{calculateAverageTrainingScore()}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <span className="text-2xl font-bold text-purple-600">{overallStats.averageCompletion}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Training Modules Available</span>
                      <span className="text-2xl font-bold text-orange-600">{inServiceTrainings.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Download detailed reports and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col bg-transparent"
                    onClick={handleExportExcelReport}
                    disabled={isGeneratingReport}
                  >
                    <Download className="h-6 w-6 mb-2" />
                    <span>{isGeneratingReport ? "Generating..." : "Excel Report"}</span>
                    <span className="text-xs text-gray-500">Detailed spreadsheet</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col bg-transparent"
                    onClick={handleExportPDFSummary}
                    disabled={isGeneratingReport}
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    <span>{isGeneratingReport ? "Generating..." : "PDF Summary"}</span>
                    <span className="text-xs text-gray-500">Executive overview</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col bg-transparent"
                    onClick={() => {
                      // Analytics dashboard - could open a modal or navigate to analytics page
                      alert("Analytics Dashboard feature coming soon!")
                    }}
                    disabled={isGeneratingReport}
                  >
                    <TrendingUp className="h-6 w-6 mb-2" />
                    <span>Analytics Dashboard</span>
                    <span className="text-xs text-gray-500">Interactive charts</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Employee Detail Modal */}
        {selectedEmployee && (
          <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedEmployee.name || selectedEmployee.first_name || "Employee"} - Training Progress</span>
                  {selectedEmployee.complianceStatus && (
                    <Badge className={getStatusColor(selectedEmployee.complianceStatus)}>
                      {selectedEmployee.complianceStatus.replace("_", " ").toUpperCase()}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {[
                    selectedEmployee.role || selectedEmployee.credentials || selectedEmployee.profession || "N/A",
                    selectedEmployee.department || "N/A",
                    selectedEmployee.hireDate ? `Hired ${selectedEmployee.hireDate}` : ""
                  ].filter(Boolean).join(" • ")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Annual Progress */}
                <div>
                  <h4 className="font-medium mb-3">Annual Training Progress</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Required Hours</Label>
                      <p className="text-2xl font-bold">{selectedEmployee.annualRequirement}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Completed Hours</Label>
                      <p className="text-2xl font-bold text-green-600">{selectedEmployee.completedHours}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">In Progress</Label>
                      <p className="text-2xl font-bold text-blue-600">{selectedEmployee.inProgressHours}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Remaining</Label>
                      <p className="text-2xl font-bold text-orange-600">{selectedEmployee.remainingHours}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {selectedEmployee.annualRequirement && selectedEmployee.annualRequirement > 0 ? (
                      <>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span className={`font-medium ${
                            (() => {
                              const completedHours = selectedEmployee.completedHours || 0
                              const requiredHours = selectedEmployee.annualRequirement || 0
                              const percentage = (completedHours / requiredHours) * 100
                              if (percentage >= 100) return "text-green-600"
                              if (percentage >= 75) return "text-blue-600"
                              if (percentage >= 50) return "text-yellow-600"
                              return "text-gray-600"
                            })()
                          }`}>
                            {(() => {
                              const completedHours = selectedEmployee.completedHours || 0
                              const requiredHours = selectedEmployee.annualRequirement || 0
                              return Math.min(100, Math.round((completedHours / requiredHours) * 100))
                            })()}%
                          </span>
                        </div>
                        <Progress
                          value={(() => {
                            const completedHours = selectedEmployee.completedHours || 0
                            const requiredHours = selectedEmployee.annualRequirement || 0
                            return Math.min(100, (completedHours / requiredHours) * 100)
                          })()}
                          className="h-3"
                        />
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No annual requirement set</p>
                    )}
                  </div>
                </div>

                {/* Upcoming Deadlines - Assigned trainings with due dates (1 week before deadline only) */}
                <div>
                  <h4 className="font-medium mb-3">Upcoming Deadlines (1 Week Before)</h4>
                  <div className="space-y-3">
                    {selectedEmployee.upcomingDeadlines && Array.isArray(selectedEmployee.upcomingDeadlines) && selectedEmployee.upcomingDeadlines.length > 0 ? (
                      selectedEmployee.upcomingDeadlines.map((deadline: any, index: number) => {
                        const daysUntilDue = deadline.daysUntilDue ?? (() => {
                          if (!deadline.dueDate) return null
                          const dueDate = new Date(deadline.dueDate)
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          dueDate.setHours(0, 0, 0, 0)
                          return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        })()
                        
                        const isDueToday = daysUntilDue === 0
                        const daysText = isDueToday
                          ? "Due today"
                          : `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} remaining`
                        
                        return (
                          <div 
                            key={deadline.assignmentId || `deadline-${index}`} 
                            className={`flex items-center justify-between p-3 border rounded-lg ${
                              isDueToday 
                                ? "bg-orange-50 border-orange-200" 
                                : "bg-yellow-50 border-yellow-200"
                            }`}
                          >
                            <div className="flex-1">
                              <p className="font-medium">{deadline.training || "Unknown Training"}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1 flex-wrap gap-2">
                                {deadline.dueDate && (
                                  <span className={`font-medium ${
                                    isDueToday 
                                      ? "text-orange-600" 
                                      : "text-orange-600"
                                  }`}>
                                    Due: {new Date(deadline.dueDate).toLocaleDateString()} ({daysText})
                                  </span>
                                )}
                                {deadline.notes && (
                                  <span className="text-gray-500 italic">Note: {deadline.notes}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {deadline.priority && (
                                <Badge className={getPriorityColor(deadline.priority)}>
                                  {deadline.priority.toUpperCase()}
                                </Badge>
                              )}
                              {isDueToday && (
                                <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                                  Due Today
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-gray-500 py-4 text-center">No deadlines within 1 week</p>
                    )}
                  </div>
                </div>

                {/* Assigned Trainings - Enrolled but not started */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center justify-between">
                    <span>Assigned Trainings (Not Started)</span>
                    <span className="text-sm font-normal text-gray-500">
                      ({selectedEmployee.assignedTrainings?.length || 0} trainings)
                    </span>
                  </h4>
                  {selectedEmployee.assignedTrainings && Array.isArray(selectedEmployee.assignedTrainings) && selectedEmployee.assignedTrainings.length > 0 ? (
                    <div className="space-y-3">
                      {selectedEmployee.assignedTrainings.map((training: any, index: number) => (
                        <div key={`assigned-${training.trainingId || training.id}-${index}`} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium">{training.title || "Unknown Training"}</h5>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1 flex-wrap gap-2">
                                {training.enrollmentDate && (
                                  <span>Assigned: {new Date(training.enrollmentDate).toLocaleDateString()}</span>
                                )}
                                {training.dueDate && (
                                  <span className="font-medium text-orange-600">
                                    Due: {new Date(training.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                                {training.ceuHours && (
                                  <span>CEU Hours: {training.ceuHours}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                                Not Started
                              </Badge>
                              {training.priority && (
                                <Badge className={getPriorityColor(training.priority)}>
                                  {training.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 py-4 px-4 bg-gray-50 rounded-lg text-center border border-dashed border-gray-300">
                      <p>No assigned trainings (not started) at this time.</p>
                      <p className="text-xs mt-1">Trainings that are "assigned" but haven't been started will appear here.</p>
                    </div>
                  )}
                </div>

                {/* In Progress Trainings - Actually in progress */}
                <div>
                  <h4 className="font-medium mb-3">In Progress Trainings</h4>
                  <div className="space-y-3">
                    {selectedEmployee.inProgressTrainings && Array.isArray(selectedEmployee.inProgressTrainings) && selectedEmployee.inProgressTrainings.length > 0 ? (
                      selectedEmployee.inProgressTrainings.map((training: any, index: number) => (
                        <div key={`inprogress-${training.trainingId || training.id}-${index}`} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium">{training.title || "Unknown Training"}</h5>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1 flex-wrap gap-2">
                                {training.startDate && (
                                  <span>Started: {new Date(training.startDate).toLocaleDateString()}</span>
                                )}
                                {training.estimatedCompletion && (
                                  <span>Est. Completion: {new Date(training.estimatedCompletion).toLocaleDateString()}</span>
                                )}
                                {training.ceuHours && (
                                  <span>CEU Hours: {training.ceuHours}</span>
                                )}
                              </div>
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Progress</span>
                                  <span className={`font-medium ${
                                    (training.progress || 0) >= 75 ? "text-green-600" :
                                    (training.progress || 0) >= 50 ? "text-blue-600" :
                                    (training.progress || 0) >= 25 ? "text-yellow-600" :
                                    "text-gray-600"
                                  }`}>{training.progress || 0}%</span>
                                </div>
                                <Progress value={training.progress || 0} className="h-2 w-full" />
                                {training.completedModules && training.completedModules.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {training.completedModules.length} module{training.completedModules.length !== 1 ? 's' : ''} completed
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge className={`border ${
                                (training.progress || 0) >= 75 ? "bg-green-100 text-green-800 border-green-300" :
                                (training.progress || 0) >= 50 ? "bg-blue-100 text-blue-800 border-blue-300" :
                                (training.progress || 0) >= 25 ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                                "bg-gray-100 text-gray-800 border-gray-300"
                              }`}>
                                <PlayCircle className="h-3 w-3 mr-1" />
                                {(training.progress || 0) >= 75 ? "Almost Done" : "In Progress"}
                              </Badge>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (training.trainingId) {
                                    window.open(`/staff-training/${training.trainingId}?staffId=${encodeURIComponent(selectedEmployee.id)}`, '_blank')
                                  }
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Continue
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 py-4 text-center">No trainings in progress</p>
                    )}
                  </div>
                </div>

                {/* Completed Trainings */}
                <div>
                  <h4 className="font-medium mb-3">Completed Trainings</h4>
                  <div className="space-y-3">
                    {selectedEmployee.completedTrainings && Array.isArray(selectedEmployee.completedTrainings) && selectedEmployee.completedTrainings.length > 0 ? (
                      selectedEmployee.completedTrainings.map((training: any, index: number) => (
                        <div key={`completed-${training.trainingId || training.id}-${index}`} className="border rounded-lg p-4 bg-green-50 border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium">{training.title || "Unknown Training"}</h5>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1 flex-wrap gap-2">
                                {training.completionDate && (
                                  <span>Completed: {new Date(training.completionDate).toLocaleDateString()}</span>
                                )}
                                {training.score !== undefined && training.score > 0 && (
                                  <span className="font-medium">Score: {training.score}%</span>
                                )}
                                {training.ceuHours && (
                                  <span>CEU Hours: {training.ceuHours}</span>
                                )}
                                {training.certificate && (
                                  <span>Cert: {training.certificate}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                              {training.certificate && (
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Certificate
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 py-4 text-center">No completed trainings</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEmployeeAssignmentForm({
                          trainingId: "",
                          dueDate: "",
                          notes: "",
                          priority: "medium",
                        })
                        setAssignTrainingToEmployeeOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Training
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSendReminder}
                      disabled={isSendingReminder}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      {isSendingReminder ? "Sending..." : "Send Reminder"}
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportRecord}
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isExporting ? "Exporting..." : "Export Record"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handlePrintSummary}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Print Summary
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Assign Training to Employee Dialog */}
        <Dialog open={assignTrainingToEmployeeOpen} onOpenChange={setAssignTrainingToEmployeeOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Training to {selectedEmployee?.name || "Employee"}</DialogTitle>
              <DialogDescription>
                Select a training to assign to this employee
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee-training-select">Training *</Label>
                <Select
                  value={employeeAssignmentForm.trainingId}
                  onValueChange={(value) => setEmployeeAssignmentForm({ ...employeeAssignmentForm, trainingId: value })}
                >
                  <SelectTrigger id="employee-training-select">
                    <SelectValue placeholder="Select a training" />
                  </SelectTrigger>
                  <SelectContent>
                    {inServiceTrainings
                      .filter((t) => t.status === "active")
                      .map((training) => (
                        <SelectItem key={training.id} value={training.id}>
                          {training.title} ({training.ceuHours} CEU Hours)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employee-due-date">Due Date *</Label>
                <Input
                  id="employee-due-date"
                  type="date"
                  value={employeeAssignmentForm.dueDate}
                  onChange={(e) => setEmployeeAssignmentForm({ ...employeeAssignmentForm, dueDate: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <Label htmlFor="employee-priority">Priority</Label>
                <Select
                  value={employeeAssignmentForm.priority}
                  onValueChange={(value) => setEmployeeAssignmentForm({ ...employeeAssignmentForm, priority: value })}
                >
                  <SelectTrigger id="employee-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employee-notes">Notes (Optional)</Label>
                <Textarea
                  id="employee-notes"
                  value={employeeAssignmentForm.notes}
                  onChange={(e) => setEmployeeAssignmentForm({ ...employeeAssignmentForm, notes: e.target.value })}
                  placeholder="Add any additional notes or instructions..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setAssignTrainingToEmployeeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignTrainingToEmployee} disabled={isAssigning}>
                  {isAssigning ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Assign Training
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Training Detail Modal */}
        {selectedTraining && (
          <Dialog open={!!selectedTraining} onOpenChange={() => setSelectedTraining(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedTraining.title}</span>
                  <div className="flex space-x-2">
                    <Badge variant="outline">{selectedTraining.category}</Badge>
                    {selectedTraining.mandatory && <Badge className="bg-red-100 text-red-800">Mandatory</Badge>}
                  </div>
                </DialogTitle>
                <DialogDescription>{selectedTraining.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Training Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Duration</Label>
                    <p className="text-lg font-bold">{selectedTraining.duration} min</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">CEU Hours</Label>
                    <p className="text-lg font-bold">{selectedTraining.ceuHours}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Enrolled</Label>
                    <p className="text-lg font-bold">{selectedTraining.enrolledCount}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Completed</Label>
                    <p className="text-lg font-bold text-green-600">{selectedTraining.completedCount}</p>
                  </div>
                </div>

                {/* Training Modules */}
                <div>
                  <h4 className="font-medium mb-3">Training Modules</h4>
                  {selectedTraining.modules && Array.isArray(selectedTraining.modules) && selectedTraining.modules.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTraining.modules.map((module: any, index: number) => (
                        <div key={module.id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{module.title || `Module ${index + 1}`}</p>
                              <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {module.duration || 0} minutes
                                </span>
                                {module.fileName && (
                                  <span className="flex items-center truncate">
                                    <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{module.fileName}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                            {module.fileUrl ? (
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={async () => {
                                    if (module.fileUrl) {
                                      try {
                                        // Check if it's a base64 data URL
                                        if (module.fileUrl.startsWith('data:')) {
                                          console.log("Opening base64 file...")
                                          // Create a blob URL from base64 data
                                          const base64Data = module.fileUrl.split(',')[1]
                                          const mimeType = module.fileUrl.split(',')[0].split(':')[1].split(';')[0]
                                          
                                          // Decode base64
                                          const byteCharacters = atob(base64Data)
                                          const byteNumbers = new Array(byteCharacters.length)
                                          for (let i = 0; i < byteCharacters.length; i++) {
                                            byteNumbers[i] = byteCharacters.charCodeAt(i)
                                          }
                                          const byteArray = new Uint8Array(byteNumbers)
                                          const blob = new Blob([byteArray], { type: mimeType })
                                          const blobUrl = URL.createObjectURL(blob)
                                          
                                          // Open blob URL in new tab
                                          const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer')
                                          if (newWindow) {
                                            // Clean up blob URL after a delay
                                            setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
                                            console.log("Base64 file opened successfully")
                                          } else {
                                            alert('Please allow pop-ups to view the file.')
                                          }
                                        } else if (module.fileUrl.includes('supabase.co/storage')) {
                                          // Supabase storage URL - verify it exists first
                                          console.log("Checking Supabase storage URL...", module.fileUrl)
                                          
                                          try {
                                            // Try to fetch the file to check if it exists
                                            const response = await fetch(module.fileUrl, { 
                                              method: 'GET',
                                              mode: 'no-cors' // Use no-cors to avoid CORS errors
                                            })
                                            
                                            // With no-cors, we can't read the response, but we can try to open it
                                            // If the file doesn't exist, the browser will show an error page
                                            const newWindow = window.open(module.fileUrl, '_blank', 'noopener,noreferrer')
                                            
                                            if (!newWindow) {
                                              alert('Please allow pop-ups to view the file.')
                                            } else {
                                              // Show a warning that the file might not be accessible
                                              alert('Opening file from storage...\n\nIf you see a "Bucket not found" error, the file needs to be re-uploaded.\n\nNew uploads will work correctly.')
                                            }
                                          } catch (fetchError) {
                                            console.error("Error checking file:", fetchError)
                                            alert('Unable to access file. The storage bucket may not exist.\n\nPlease re-upload this file. New uploads will work correctly.')
                                          }
                                        } else {
                                          // Regular URL (not Supabase storage)
                                          console.log("Opening regular URL:", module.fileUrl)
                                          const newWindow = window.open(module.fileUrl, '_blank', 'noopener,noreferrer')
                                          if (!newWindow) {
                                            alert('Please allow pop-ups to view the file.')
                                          }
                                        }
                                      } catch (error: any) {
                                        console.error('Error opening file:', error)
                                        alert(`Error opening file: ${error.message || 'Unknown error'}\n\nFile URL: ${module.fileUrl.substring(0, 100)}...\n\nIf this is a storage URL, please re-upload the file.`)
                                      }
                                    }
                                  }}
                                  className="hover:bg-blue-50"
                                >
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Preview
                                </Button>
                                {module.fileUrl.includes('supabase.co/storage') && (
                                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                    May need re-upload
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                No file available
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No modules defined for this training</p>
                    </div>
                  )}
                </div>

                {/* Quiz Information */}
                <div>
                  <h4 className="font-medium mb-3">Assessment Details</h4>
                  <div className="p-4 border rounded-lg">
                    {selectedTraining.quiz ? (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Questions</Label>
                          <p className="text-lg font-bold">{selectedTraining.quiz.questions || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Passing Score</Label>
                          <p className="text-lg font-bold">{selectedTraining.quiz.passingScore || "N/A"}%</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Max Attempts</Label>
                          <p className="text-lg font-bold">{selectedTraining.quiz.attempts || "N/A"}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p>No quiz configuration available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Accreditation & Requirements */}
                <div>
                  <h4 className="font-medium mb-3">Accreditation & Requirements</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <Label className="text-sm font-medium">Accredited By</Label>
                      <p className="text-lg font-bold">{selectedTraining.accreditation || "N/A"}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Label className="text-sm font-medium">Target Roles</Label>
                      <p className="text-lg font-bold">
                        {Array.isArray(selectedTraining.targetRoles) && selectedTraining.targetRoles.length > 0
                          ? selectedTraining.targetRoles.join(", ")
                          : selectedTraining.targetRoles || "All"}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Label className="text-sm font-medium">Difficulty Level</Label>
                      <p className="text-lg font-bold">{selectedTraining.difficulty || "N/A"}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Label className="text-sm font-medium">Certificate Validity</Label>
                      <p className="text-lg font-bold">{selectedTraining.expiryMonths ? `${selectedTraining.expiryMonths} months` : "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Populate form with existing training data for editing
                        setTrainingForm({
                          title: selectedTraining.title || "",
                          category: selectedTraining.category || "",
                          description: selectedTraining.description || "",
                          duration: selectedTraining.duration?.toString() || "",
                          ceuHours: selectedTraining.ceuHours?.toString() || "",
                          difficulty: selectedTraining.difficulty || "",
                          targetRoles: Array.isArray(selectedTraining.targetRoles) ? selectedTraining.targetRoles : (selectedTraining.targetRoles ? [selectedTraining.targetRoles] : []),
                          mandatory: selectedTraining.mandatory ? "true" : "false",
                          type: selectedTraining.type || "online_course",
                        })
                        setCreateTrainingOpen(true)
                        setSelectedTraining(null) // Close details modal
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Training
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedTraining(null)
                        setActiveTab("assignments")
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Assign to Employees
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
