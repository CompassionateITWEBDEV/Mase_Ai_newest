import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// GET - Fetch care team for a patient
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('patient_care_team')
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          email,
          phone_number,
          credentials,
          department,
          specialties
        )
      `)
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('is_assigned_staff', { ascending: false })
      .order('added_date', { ascending: true })
    
    if (error) {
      console.error('Error fetching care team:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    // Format the response
    const careTeam = (data || []).map((item: any) => ({
      id: item.id,
      patientId: item.patient_id,
      staffId: item.staff_id,
      role: item.role,
      specialty: item.specialty,
      isPrimary: item.is_primary,
      isAssignedStaff: item.is_assigned_staff,
      addedDate: item.added_date,
      notes: item.notes,
      staff: item.staff ? {
        id: item.staff.id,
        name: item.staff.name,
        email: item.staff.email,
        phone: item.staff.phone_number,
        credentials: item.staff.credentials,
        department: item.staff.department,
        specialties: item.staff.specialties || []
      } : null
    }))
    
    return NextResponse.json({
      success: true,
      careTeam,
      count: careTeam.length
    })
  } catch (error: any) {
    console.error('Error in GET care team:', error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch care team" },
      { status: 500 }
    )
  }
}

// POST - Add staff member to care team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params
    const body = await request.json()
    const { staffId, role, specialty, isPrimary, isAssignedStaff, notes } = body
    
    if (!staffId) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 }
      )
    }
    
    const supabase = createServiceClient()
    
    // Get staff details to determine role if not provided
    let finalRole = role
    if (!finalRole) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('credentials, department')
        .eq('id', staffId)
        .single()
      
      if (staffData) {
        finalRole = staffData.credentials || staffData.department || "Healthcare Provider"
      } else {
        finalRole = "Healthcare Provider"
      }
    }
    
    // Check if assignment already exists (check by staff_id only since role is auto-determined)
    const { data: existing } = await supabase
      .from('patient_care_team')
      .select('id, role')
      .eq('patient_id', patientId)
      .eq('staff_id', staffId)
      .eq('is_active', true)
      .single()
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: "This staff member is already assigned to this patient's care team" },
        { status: 400 }
      )
    }
    
    // If setting as primary, unset other primary providers
    if (isPrimary) {
      await supabase
        .from('patient_care_team')
        .update({ is_primary: false })
        .eq('patient_id', patientId)
        .eq('is_active', true)
    }
    
    // If setting as assigned staff, unset other assigned staff
    if (isAssignedStaff) {
      await supabase
        .from('patient_care_team')
        .update({ is_assigned_staff: false })
        .eq('patient_id', patientId)
        .eq('is_active', true)
    }
    
    // Insert new care team member
    const { data: newMember, error: insertError } = await supabase
      .from('patient_care_team')
      .insert({
        patient_id: patientId,
        staff_id: staffId,
        role: finalRole,
        specialty: specialty || null,
        is_primary: isPrimary || false,
        is_assigned_staff: isAssignedStaff || false,
        notes: notes || null,
        is_active: true
      })
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          email,
          phone_number,
          credentials,
          department,
          specialties
        )
      `)
      .single()
    
    if (insertError) {
      console.error('Error adding care team member:', insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }
    
    // Update patients table if needed
    if (isPrimary) {
      await supabase
        .from('patients')
        .update({ primary_provider_id: staffId })
        .eq('id', patientId)
    }
    
    if (isAssignedStaff) {
      await supabase
        .from('patients')
        .update({ assigned_staff_id: staffId })
        .eq('id', patientId)
    }
    
    return NextResponse.json({
      success: true,
      message: "Care team member added successfully",
      careTeamMember: {
        id: newMember.id,
        patientId: newMember.patient_id,
        staffId: newMember.staff_id,
        role: newMember.role,
        specialty: newMember.specialty,
        isPrimary: newMember.is_primary,
        isAssignedStaff: newMember.is_assigned_staff,
        staff: newMember.staff
      }
    })
  } catch (error: any) {
    console.error('Error in POST care team:', error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add care team member" },
      { status: 500 }
    )
  }
}

// DELETE - Remove staff member from care team (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params
    const { searchParams } = new URL(request.url)
    const careTeamId = searchParams.get('careTeamId')
    
    if (!careTeamId) {
      return NextResponse.json(
        { success: false, error: "Care team ID is required" },
        { status: 400 }
      )
    }
    
    const supabase = createServiceClient()
    
    // Soft delete (set is_active = false)
    const { error } = await supabase
      .from('patient_care_team')
      .update({
        is_active: false,
        removed_date: new Date().toISOString()
      })
      .eq('id', careTeamId)
      .eq('patient_id', patientId)
    
    if (error) {
      console.error('Error removing care team member:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: "Care team member removed successfully"
    })
  } catch (error: any) {
    console.error('Error in DELETE care team:', error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove care team member" },
      { status: 500 }
    )
  }
}

// PATCH - Update care team member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params
    const body = await request.json()
    const { careTeamId, role, specialty, isPrimary, isAssignedStaff, notes, staffId } = body
    
    if (!careTeamId) {
      return NextResponse.json(
        { success: false, error: "Care team ID is required" },
        { status: 400 }
      )
    }
    
    const supabase = createServiceClient()
    
    // Get staff details to determine role if not provided and staff changed
    let finalRole = role
    if (!finalRole && staffId) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('credentials, department')
        .eq('id', staffId)
        .single()
      
      if (staffData) {
        finalRole = staffData.credentials || staffData.department || "Healthcare Provider"
      }
    }
    
    // If role still not set, get from existing care team member
    if (!finalRole) {
      const { data: existingMember } = await supabase
        .from('patient_care_team')
        .select('role')
        .eq('id', careTeamId)
        .single()
      
      if (existingMember) {
        finalRole = existingMember.role
      } else {
        finalRole = "Healthcare Provider"
      }
    }
    
    // If setting as primary, unset other primary providers
    if (isPrimary) {
      await supabase
        .from('patient_care_team')
        .update({ is_primary: false })
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .neq('id', careTeamId)
    }
    
    // If setting as assigned staff, unset other assigned staff
    if (isAssignedStaff) {
      await supabase
        .from('patient_care_team')
        .update({ is_assigned_staff: false })
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .neq('id', careTeamId)
    }
    
    // Update care team member
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (finalRole) updateData.role = finalRole
    if (specialty !== undefined) updateData.specialty = specialty
    if (isPrimary !== undefined) updateData.is_primary = isPrimary
    if (isAssignedStaff !== undefined) updateData.is_assigned_staff = isAssignedStaff
    if (notes !== undefined) updateData.notes = notes
    
    const { data: updated, error } = await supabase
      .from('patient_care_team')
      .update(updateData)
      .eq('id', careTeamId)
      .eq('patient_id', patientId)
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          email,
          phone_number,
          credentials,
          department,
          specialties
        )
      `)
      .single()
    
    if (error) {
      console.error('Error updating care team member:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    // Update patients table if needed
    if (isPrimary && updated.staff_id) {
      await supabase
        .from('patients')
        .update({ primary_provider_id: updated.staff_id })
        .eq('id', patientId)
    }
    
    if (isAssignedStaff && updated.staff_id) {
      await supabase
        .from('patients')
        .update({ assigned_staff_id: updated.staff_id })
        .eq('id', patientId)
    }
    
    return NextResponse.json({
      success: true,
      message: "Care team member updated successfully",
      careTeamMember: {
        id: updated.id,
        patientId: updated.patient_id,
        staffId: updated.staff_id,
        role: updated.role,
        specialty: updated.specialty,
        isPrimary: updated.is_primary,
        isAssignedStaff: updated.is_assigned_staff,
        staff: updated.staff
      }
    })
  } catch (error: any) {
    console.error('Error in PATCH care team:', error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update care team member" },
      { status: 500 }
    )
  }
}

