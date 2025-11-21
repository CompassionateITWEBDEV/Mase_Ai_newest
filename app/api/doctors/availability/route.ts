import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')

    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get doctor's current availability status
    const { data: doctor, error } = await supabase
      .from('physicians')
      .select('id, is_available, availability_mode, telehealth_enabled')
      .eq('id', doctorId)
      .single()

    if (error) {
      console.error('❌ [AVAILABILITY] Error fetching doctor:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    console.log('✅ [AVAILABILITY] Fetched availability for doctor:', doctorId, {
      isAvailable: doctor.is_available,
      mode: doctor.availability_mode
    })

    return NextResponse.json({
      success: true,
      availability: {
        isAvailable: doctor.is_available || false,
        availabilityMode: doctor.availability_mode || 'immediate',
        telehealthEnabled: doctor.telehealth_enabled || false
      }
    })
  } catch (error: any) {
    console.error("❌ [AVAILABILITY] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch availability" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { doctorId, isAvailable, availabilityMode } = body

    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 })
    }

    // Validate availability mode
    const validModes = ['immediate', 'scheduled', 'both']
    const mode = availabilityMode || 'immediate'
    
    if (!validModes.includes(mode)) {
      return NextResponse.json({ 
        error: `Invalid availability mode. Must be one of: ${validModes.join(', ')}` 
      }, { status: 400 })
    }

    const supabase = createServiceClient()

    console.log('🔄 [AVAILABILITY] Updating availability:', {
      doctorId,
      isAvailable,
      availabilityMode: mode
    })

    // Update doctor's availability in database
    const { data, error } = await supabase
      .from('physicians')
      .update({
        is_available: isAvailable,
        availability_mode: mode,
        updated_at: new Date().toISOString()
      })
      .eq('id', doctorId)
      .select()
      .single()

    if (error) {
      console.error('❌ [AVAILABILITY] Error updating:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ [AVAILABILITY] Updated successfully for doctor:', doctorId)

    return NextResponse.json({
      success: true,
      message: `Availability status updated to ${isAvailable ? 'Available' : 'Offline'}`,
      availability: {
        isAvailable: data.is_available,
        availabilityMode: data.availability_mode
      }
    })
  } catch (error: any) {
    console.error("❌ [AVAILABILITY] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to update availability" }, { status: 500 })
  }
}

