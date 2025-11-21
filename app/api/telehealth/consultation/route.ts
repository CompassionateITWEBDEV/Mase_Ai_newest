import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// POST - Create new consultation request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      patientName,
      patientInitials,
      patientAge,
      nurseId,
      nurseName,
      reasonForConsult,
      urgencyLevel,
      symptoms,
      vitalSigns,
      chiefComplaint,
      estimatedDuration,
      compensationAmount
    } = body

    // Validation
    if (!patientName || !nurseId || !nurseName || !reasonForConsult || !urgencyLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['low', 'medium', 'high', 'critical'].includes(urgencyLevel)) {
      return NextResponse.json(
        { error: 'Invalid urgency level' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Create consultation request
    const { data: consultation, error: consultError } = await supabase
      .from('telehealth_consultations')
      .insert({
        patient_id: patientId || null,
        patient_name: patientName,
        patient_initials: patientInitials || patientName.split(' ').map(n => n[0]).join('.') + '.',
        patient_age: patientAge || null,
        nurse_id: nurseId,
        nurse_name: nurseName,
        reason_for_consult: reasonForConsult,
        urgency_level: urgencyLevel,
        symptoms: symptoms || [],
        vital_signs: vitalSigns || {},
        chief_complaint: chiefComplaint || reasonForConsult,
        estimated_duration: estimatedDuration || 15,
        compensation_amount: compensationAmount || 125.00,
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single()

    if (consultError) {
      console.error('Database error:', consultError)
      return NextResponse.json(
        { error: 'Failed to create consultation request' },
        { status: 500 }
      )
    }

    // TODO: Send real-time notification to available doctors
    // This will be handled by Supabase Realtime subscriptions on the client side

    return NextResponse.json({
      success: true,
      consultation,
      message: 'Consultation request created successfully'
    })

  } catch (error) {
    console.error('Create consultation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Fetch consultations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const nurseId = searchParams.get('nurseId')
    const doctorId = searchParams.get('doctorId')
    const urgencyLevel = searchParams.get('urgencyLevel')

    const supabase = createServiceClient()

    let query = supabase
      .from('telehealth_consultations')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (nurseId) {
      query = query.eq('nurse_id', nurseId)
    }
    if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }
    if (urgencyLevel) {
      query = query.eq('urgency_level', urgencyLevel)
    }

    const { data: consultations, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch consultations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      consultations: consultations || []
    })

  } catch (error) {
    console.error('Fetch consultations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update consultation (accept, reject, complete)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      consultationId,
      action, // 'accept', 'reject', 'complete', 'cancel'
      doctorId,
      doctorName,
      doctorNotes,
      ordersGiven,
      diagnosis,
      treatmentPlan,
      rating,
      feedback,
      cancellationReason
    } = body

    if (!consultationId || !action) {
      return NextResponse.json(
        { error: 'consultationId and action are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    let updateData: any = {}

    switch (action) {
      case 'accept':
        if (!doctorId || !doctorName) {
          return NextResponse.json(
            { error: 'doctorId and doctorName required for accept action' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'accepted',
          doctor_id: doctorId,
          doctor_name: doctorName,
          accepted_at: new Date().toISOString()
        }
        break

      case 'reject':
        updateData = {
          status: 'rejected',
          cancellation_reason: cancellationReason || 'Rejected by doctor'
        }
        break

      case 'complete':
        updateData = {
          status: 'completed',
          completed_at: new Date().toISOString(),
          doctor_notes: doctorNotes,
          orders_given: ordersGiven,
          diagnosis,
          treatment_plan: treatmentPlan
        }
        break

      case 'cancel':
        updateData = {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellationReason || 'Cancelled by nurse'
        }
        break

      case 'rate':
        updateData = {
          rating,
          feedback
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const { data: consultation, error } = await supabase
      .from('telehealth_consultations')
      .update(updateData)
      .eq('id', consultationId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update consultation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      consultation,
      message: `Consultation ${action}ed successfully`
    })

  } catch (error) {
    console.error('Update consultation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
