import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patient_id")
    const patientName = searchParams.get("patient_name")

    if (!patientId && !patientName) {
      return NextResponse.json(
        { error: "Patient ID or patient name is required" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Build query to find visits for this patient
    let query = supabase
      .from("staff_visits")
      .select(`
        id,
        staff_id,
        scheduled_time,
        start_time,
        end_time,
        visit_type,
        patient_name,
        patient_address,
        status,
        notes,
        staff:staff_id (
          id,
          name,
          role_id,
          department,
          credentials,
          phone_number
        )
      `)
      .order("scheduled_time", { ascending: true, nullsLast: true })
      .order("start_time", { ascending: true, nullsLast: true })

    // Filter by patient name (since staff_visits uses patient_name, not patient_id)
    if (patientName) {
      query = query.ilike("patient_name", `%${patientName}%`)
    }

    // Also check visits table if it exists and has patient_id
    const { data: visits, error: visitsError } = await query

    if (visitsError) {
      console.error("Error fetching visits:", visitsError)
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      )
    }

    // Also check the visits table (if patient_id is available)
    let visitsFromVisitsTable: any[] = []
    if (patientId) {
      const { data: visitsData, error: visitsTableError } = await supabase
        .from("visits")
        .select(`
          id,
          visit_date,
          discipline,
          duration_minutes,
          notes,
          status,
          staff:staff_id (
            id,
            name,
            department,
            credentials
          )
        `)
        .eq("patient_id", patientId)
        .gte("visit_date", new Date().toISOString().split("T")[0]) // Only future visits
        .order("visit_date", { ascending: true })

      if (!visitsTableError && visitsData) {
        visitsFromVisitsTable = visitsData.map((visit: any) => {
          const visitDate = visit.visit_date ? new Date(visit.visit_date) : null
          const now = new Date()
          
          // Determine status for visits table
          let appointmentStatus = "Pending"
          if (visit.status === "completed") {
            appointmentStatus = "Completed"
          } else if (visit.status === "cancelled") {
            appointmentStatus = "Cancelled"
          } else if (visit.status === "scheduled" && visitDate) {
            const hoursUntilAppointment = (visitDate.getTime() - now.getTime()) / (1000 * 60 * 60)
            
            // If scheduled and within 7 days, mark as "Confirmed"
            if (visitDate >= now && hoursUntilAppointment <= 168) {
              appointmentStatus = "Confirmed"
            } else if (visitDate >= now) {
              appointmentStatus = "Scheduled"
            } else {
              appointmentStatus = "Pending"
            }
          } else if (visitDate && visitDate >= now) {
            appointmentStatus = "Scheduled"
          }
          
          return {
            id: visit.id,
            date: visit.visit_date,
            time: "TBD", // visits table doesn't have time
            provider: visit.staff?.name || "Staff Member",
            type: visit.discipline || "Visit",
            status: appointmentStatus,
            location: "Home Visit",
            staffId: visit.staff?.id,
            notes: visit.notes,
          }
        })
      }
    }

    // Transform staff_visits data
    const transformedVisits = (visits || [])
      .filter((visit: any) => {
        // Only show scheduled or in_progress visits (future appointments)
        const scheduledTime = visit.scheduled_time ? new Date(visit.scheduled_time) : null
        const startTime = visit.start_time ? new Date(visit.start_time) : null
        const now = new Date()
        
        // Include if scheduled in future, or in progress, or started today
        if (visit.status === "in_progress") return true
        if (scheduledTime && scheduledTime >= now) return true
        if (startTime && startTime >= now) return true
        if (startTime && startTime.toDateString() === now.toDateString()) return true // Today's visits
        
        return false
      })
      .map((visit: any) => {
        const scheduledTime = visit.scheduled_time ? new Date(visit.scheduled_time) : null
        const startTime = visit.start_time ? new Date(visit.start_time) : null
        const timeToUse = scheduledTime || startTime || new Date()

        // Determine status based on visit status and timing
        let appointmentStatus = "Pending"
        if (visit.status === "in_progress") {
          appointmentStatus = "In Progress"
        } else if (visit.status === "completed") {
          appointmentStatus = "Completed"
        } else if (visit.status === "cancelled") {
          appointmentStatus = "Cancelled"
        } else if (visit.status === "scheduled" && scheduledTime) {
          const now = new Date()
          const hoursUntilAppointment = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60)
          
          // If scheduled and within 7 days, mark as "Confirmed"
          // If scheduled but more than 7 days away, mark as "Scheduled"
          if (scheduledTime >= now && hoursUntilAppointment <= 168) { // 168 hours = 7 days
            appointmentStatus = "Confirmed"
          } else if (scheduledTime >= now) {
            appointmentStatus = "Scheduled"
          } else {
            appointmentStatus = "Pending"
          }
        } else if (scheduledTime && scheduledTime >= new Date()) {
          appointmentStatus = "Scheduled"
        }

        return {
          id: visit.id,
          date: timeToUse.toISOString().split("T")[0],
          time: timeToUse.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          provider: visit.staff?.name || "Healthcare Provider",
          type: visit.visit_type || "Home Visit",
          status: appointmentStatus,
          location: visit.patient_address || "Home Visit",
          staffId: visit.staff_id,
          notes: visit.notes,
        }
      })

    // Combine and deduplicate
    const allAppointments = [...transformedVisits, ...visitsFromVisitsTable]
    
    // Remove duplicates based on id
    const uniqueAppointments = Array.from(
      new Map(allAppointments.map((apt) => [apt.id, apt])).values()
    )

    // Sort by date and time
    uniqueAppointments.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`)
      const dateB = new Date(`${b.date} ${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })

    return NextResponse.json({
      success: true,
      appointments: uniqueAppointments,
      count: uniqueAppointments.length,
    })
  } catch (error: any) {
    console.error("Error fetching patient appointments:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch appointments" },
      { status: 500 }
    )
  }
}

