import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || ""

export const dynamic = 'force-dynamic'

// AI Schema for schedule optimization
const aiScheduleOptimizationSchema = z.object({
  optimizedOrder: z.array(z.object({
    visitId: z.string(),
    suggestedTime: z.string(),
    reasoning: z.string().describe("AI's reasoning for this time slot"),
    priority: z.enum(["high", "medium", "low"]).describe("Visit priority based on analysis"),
    estimatedTravelTime: z.number().describe("Estimated travel time in minutes"),
    efficiencyScore: z.number().min(0).max(100).describe("Efficiency score for this visit placement")
  })),
  overallOptimization: z.object({
    totalTimeSaved: z.number().describe("Total time saved in minutes compared to original"),
    efficiencyGain: z.number().describe("Efficiency improvement percentage"),
    recommendations: z.array(z.string()).describe("AI recommendations for better scheduling"),
    riskFactors: z.array(z.string()).optional().describe("Potential risks or issues detected")
  })
})

// Haversine formula to calculate distance between two coordinates (in miles)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Calculate travel time in minutes (assuming average speed of 25 mph)
function calculateTravelTime(lat1: number, lon1: number, lat2: number, lon2: number, considerTraffic: boolean = false, currentTime?: Date): number {
  const distance = calculateDistance(lat1, lon1, lat2, lon2)
  let baseSpeed = 25 // mph - average speed
  
  // Traffic pattern simulation based on time of day
  if (considerTraffic && currentTime) {
    const hour = currentTime.getHours()
    // Rush hours: 7-9 AM and 5-7 PM have slower speeds
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) {
      baseSpeed = 15 // Rush hour speed
    } else if (hour >= 9 && hour < 17) {
      baseSpeed = 30 // Mid-day speed
    } else {
      baseSpeed = 35 // Off-peak speed
    }
  }
  
  const timeInHours = distance / baseSpeed
  return Math.ceil(timeInHours * 60) // Convert to minutes and round up
}

// Get staff working hours for a specific day
// Note: staff_shifts table uses 0=Monday, 1=Tuesday... 6=Sunday
// JavaScript getDay() returns 0=Sunday, 1=Monday... 6=Saturday
async function getStaffWorkingHours(supabase: any, staffId: string, date: Date): Promise<{ start: string, end: string } | null> {
  const jsDayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
  // Convert JavaScript day (0=Sun, 1=Mon...) to database format (0=Mon, 1=Tue... 6=Sun)
  // Sunday (0) becomes 6, Monday (1) becomes 0, Tuesday (2) becomes 1, etc.
  const dbDayOfWeek = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1
  
  const { data: shift, error } = await supabase
    .from('staff_shifts')
    .select('start_time, end_time')
    .eq('staff_id', staffId)
    .eq('day_of_week', dbDayOfWeek)
    .maybeSingle()
  
  if (error) {
    console.warn(`Error fetching shift for staff ${staffId} on day ${dbDayOfWeek}:`, error)
  }
  
  if (!shift) {
    // Default working hours if no shift found: 8 AM - 5 PM
    console.log(`No shift found for staff ${staffId} on day ${dbDayOfWeek}, using default 8 AM - 5 PM`)
    return { start: '08:00', end: '17:00' }
  }
  
  return { start: shift.start_time, end: shift.end_time }
}

// Parse time string (HH:MM) to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// Convert minutes from midnight to Date object for a specific day
function minutesToDate(minutes: number, baseDate: Date): Date {
  const date = new Date(baseDate)
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  date.setHours(hours, mins, 0, 0)
  return date
}

export async function POST(request: NextRequest) {
  try {
    const { staffId, optimizedOrder, considerTraffic } = await request.json()

    if (!staffId || !optimizedOrder || !Array.isArray(optimizedOrder)) {
      return NextResponse.json({ error: "Staff ID and optimized order are required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get all visits with their locations
    const { data: visits, error: visitsError } = await supabase
      .from('staff_visits')
      .select('id, patient_name, visit_location, scheduled_time, duration')
      .eq('staff_id', staffId)
      .in('id', optimizedOrder)
      .neq('status', 'cancelled')

    if (visitsError) {
      console.error('Error fetching visits:', visitsError)
      return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 })
    }

    if (!visits || visits.length === 0) {
      return NextResponse.json({ error: "No visits found" }, { status: 404 })
    }

    // Create a map of visit ID to visit data
    const visitMap = new Map(visits.map(v => [v.id, v]))
    
    // Get waypoints in optimized order with coordinates
    const waypoints = optimizedOrder
      .map(id => {
        const visit = visitMap.get(id)
        if (!visit || !visit.visit_location) return null
        
        const loc = visit.visit_location as any
        const lat = loc?.lat || (Array.isArray(loc) ? loc[0] : null)
        const lng = loc?.lng || (Array.isArray(loc) ? loc[1] : null)
        
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null
        
        // Ensure duration is reasonable - minimum 15 minutes, default 30, max 2 hours
        let duration = visit.duration || 30
        if (duration < 15) {
          duration = 30 // Fix unreasonably short durations
        }
        if (duration > 240) {
          duration = 120 // Cap at 2 hours max for single visit
        }
        
        return {
          id: visit.id,
          name: visit.patient_name,
          lat: parseFloat(lat.toString()),
          lng: parseFloat(lng.toString()),
          duration: duration,
          currentScheduledTime: visit.scheduled_time
        }
      })
      .filter(Boolean) as Array<{
        id: string
        name: string
        lat: number
        lng: number
        duration: number
        currentScheduledTime: string | null
      }>

    if (waypoints.length === 0) {
      return NextResponse.json({ error: "No valid waypoints with location data" }, { status: 400 })
    }

    // Determine the date to schedule (use today or first visit's scheduled date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Check if any visit has a scheduled time, use that date
    let scheduleDate = today
    const firstScheduled = waypoints.find(w => w.currentScheduledTime)
    if (firstScheduled && firstScheduled.currentScheduledTime) {
      scheduleDate = new Date(firstScheduled.currentScheduledTime)
      scheduleDate.setHours(0, 0, 0, 0)
    }

    // Get staff working hours for this day
    const workingHours = await getStaffWorkingHours(supabase, staffId, scheduleDate)
    if (!workingHours) {
      return NextResponse.json({ error: "Could not determine staff working hours" }, { status: 500 })
    }

    const startMinutes = timeToMinutes(workingHours.start)
    const endMinutes = timeToMinutes(workingHours.end)
    const workingDuration = endMinutes - startMinutes

    // Get ALL staff tasks/appointments during working hours (complete workload)
    const scheduleStart = new Date(scheduleDate)
    scheduleStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0)
    const scheduleEnd = new Date(scheduleDate)
    scheduleEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0)

    // Fetch training sessions scheduled for this day
    const { data: trainings, error: trainingsError } = await supabase
      .from('in_service_enrollments')
      .select(`
        id,
        start_date,
        estimated_completion_date,
        status,
        in_service_trainings (
          id,
          title,
          duration,
          ceu_hours
        )
      `)
      .eq('employee_id', staffId)
      .in('status', ['enrolled', 'in_progress'])
      .not('start_date', 'is', null)

    // Fetch training assignments with due dates
    // Note: assigned_employee_ids is an array, so we use contains operator
    const { data: trainingAssignments, error: assignmentsError } = await supabase
      .from('in_service_assignments')
      .select(`
        id,
        due_date,
        priority,
        status,
        assigned_to_type,
        assigned_to_value,
        assigned_employee_ids,
        in_service_trainings (
          id,
          title,
          duration
        )
      `)
      .eq('status', 'active')
      .or(`assigned_to_type.eq.all,assigned_to_type.eq.individual,assigned_employee_ids.cs.{${staffId}}`)
      .gte('due_date', scheduleDate.toISOString().split('T')[0])
      .lte('due_date', new Date(scheduleDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    // Get all existing scheduled visits (not just the ones being optimized)
    const { data: existingVisits, error: existingVisitsError } = await supabase
      .from('staff_visits')
      .select('id, patient_name, scheduled_time, duration, status')
      .eq('staff_id', staffId)
      .neq('status', 'cancelled')
      .not('scheduled_time', 'is', null)
      .gte('scheduled_time', scheduleStart.toISOString())
      .lte('scheduled_time', scheduleEnd.toISOString())

    // Build complete workload list
    const existingTasks: Array<{
      type: string
      title: string
      startTime: string
      endTime: string
      duration: number
      priority?: string
    }> = []

    // Add existing scheduled visits (excluding the ones being optimized)
    if (existingVisits) {
      existingVisits
        .filter(v => !optimizedOrder.includes(v.id)) // Exclude visits being optimized
        .forEach(visit => {
          if (visit.scheduled_time) {
            const start = new Date(visit.scheduled_time)
            const duration = visit.duration || 30
            const end = new Date(start.getTime() + duration * 60 * 1000)
            existingTasks.push({
              type: 'patient_visit',
              title: `Patient Visit: ${visit.patient_name}`,
              startTime: start.toISOString(),
              endTime: end.toISOString(),
              duration: duration
            })
          }
        })
    }

    // Add training sessions
    if (trainings) {
      trainings.forEach(training => {
        if (training.start_date) {
          const start = new Date(training.start_date)
          const duration = training.in_service_trainings?.duration || 60
          const end = new Date(start.getTime() + duration * 60 * 1000)
          
          // Only include if it's on the schedule date
          if (start.toISOString().split('T')[0] === scheduleDate.toISOString().split('T')[0]) {
            existingTasks.push({
              type: 'training',
              title: `Training: ${training.in_service_trainings?.title || 'Training Session'}`,
              startTime: start.toISOString(),
              endTime: end.toISOString(),
              duration: duration
            })
          }
        }
      })
    }

    // Add training assignments (if they have scheduled times or are due soon)
    // Note: Training assignments might not have specific times, but we can add them as reminders
    if (trainingAssignments) {
      trainingAssignments.forEach(assignment => {
        // If assignment is due today or soon, we could add it as a task
        // For now, we'll skip assignments without specific times since they're not blocking
        // This can be enhanced later if assignments have scheduled times
      })
    }

    // Sort existing tasks by start time
    existingTasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    console.log('📋 Complete Workload Analysis:')
    console.log(`  - Existing scheduled visits: ${existingVisits?.filter(v => !optimizedOrder.includes(v.id)).length || 0}`)
    console.log(`  - Training sessions: ${trainings?.length || 0}`)
    console.log(`  - Training assignments: ${trainingAssignments?.length || 0}`)
    console.log(`  - Total existing tasks: ${existingTasks.length}`)
    if (existingTasks.length > 0) {
      console.log('  Existing Tasks:')
      existingTasks.forEach((task, idx) => {
        const start = new Date(task.startTime)
        const end = new Date(task.endTime)
        console.log(`    ${idx + 1}. ${task.title} - ${start.toLocaleTimeString()} to ${end.toLocaleTimeString()} (${task.duration} min)`)
      })
    }

    // AI-Powered Schedule Optimization
    let aiOptimizedSchedule: any[] = []
    let aiRecommendations: string[] = []
    let aiEfficiencyGain = 0
    let useAI = !!openaiApiKey && openaiApiKey.trim() !== ''
    
    // Log AI connection status
    console.log('='.repeat(80))
    console.log('🤖 AI SCHEDULE OPTIMIZATION - CONNECTION CHECK')
    console.log('='.repeat(80))
    console.log('✅ OpenAI API Key Present:', useAI ? 'YES' : 'NO')
    console.log('✅ API Key Length:', openaiApiKey ? `${openaiApiKey.length} characters` : '0')
    console.log('✅ Waypoints Count:', waypoints.length)
    console.log('✅ Will Use AI:', useAI && waypoints.length > 1 ? 'YES' : 'NO')
    console.log('='.repeat(80))

    if (useAI && waypoints.length > 1) {
      try {
        console.log('')
        console.log('🚀 AI SCHEDULE OPTIMIZATION - STARTING ANALYSIS')
        console.log('='.repeat(80))
        console.log('📊 Input Data:')
        console.log('  - Staff ID:', staffId)
        console.log('  - Total Visits:', waypoints.length)
        console.log('  - Working Hours:', `${workingHours.start} - ${workingHours.end}`)
        console.log('  - Working Duration:', `${workingDuration} minutes`)
        console.log('  - Schedule Date:', scheduleDate.toISOString().split('T')[0])
        console.log('  - Traffic Consideration:', considerTraffic ? 'Enabled' : 'Disabled')
        console.log('')
        console.log('📍 Visit Locations:')
        waypoints.forEach((w, idx) => {
          console.log(`  Visit ${idx + 1}: ${w.name} - Duration: ${w.duration}min - Location: (${w.lat.toFixed(6)}, ${w.lng.toFixed(6)})`)
        })
        console.log('')
        console.log('🔄 Calling OpenAI GPT-4o API...')
        const aiStartTime = Date.now()
        
        // Prepare data for AI analysis
        const scheduleContext = {
          waypoints: waypoints.map(w => ({
            id: w.id,
            name: w.name,
            lat: w.lat,
            lng: w.lng,
            duration: w.duration,
            currentScheduledTime: w.currentScheduledTime
          })),
          workingHours: {
            start: workingHours.start,
            end: workingHours.end,
            duration: workingDuration
          },
          considerTraffic: considerTraffic || false,
          scheduleDate: scheduleDate.toISOString().split('T')[0]
        }

        // Calculate distances between all waypoints for AI
        const distanceMatrix: number[][] = []
        for (let i = 0; i < waypoints.length; i++) {
          distanceMatrix[i] = []
          for (let j = 0; j < waypoints.length; j++) {
            if (i === j) {
              distanceMatrix[i][j] = 0
            } else {
              distanceMatrix[i][j] = calculateDistance(
                waypoints[i].lat, waypoints[i].lng,
                waypoints[j].lat, waypoints[j].lng
              )
            }
          }
        }

        const existingTasksText = existingTasks.length > 0 
          ? `\nEXISTING TASKS/APPOINTMENTS (Already Scheduled - DO NOT OVERLAP):\n${existingTasks.map((task, idx) => {
              const start = new Date(task.startTime)
              const end = new Date(task.endTime)
              return `${idx + 1}. ${task.title}\n   Time: ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()} (${task.duration} min)\n   Type: ${task.type}${task.priority ? `\n   Priority: ${task.priority}` : ''}`
            }).join('\n')}`
          : '\nEXISTING TASKS: None (all time slots are available)'

        const aiPrompt = `You are an expert healthcare schedule optimization AI. Analyze and optimize a staff member's patient visit schedule to maximize efficiency, minimize travel time, and ensure optimal time utilization.

SCHEDULE DATA:
- Working Hours: ${workingHours.start} - ${workingHours.end} (${workingDuration} minutes total)
- Date: ${scheduleDate.toISOString().split('T')[0]}
- Traffic Consideration: ${considerTraffic ? 'Yes' : 'No'}
- Total Visits to Schedule: ${waypoints.length}
- Existing Tasks/Appointments: ${existingTasks.length}${existingTasksText}

VISITS TO SCHEDULE:
${waypoints.map((w, idx) => `
Visit ${idx + 1}:
- Patient: ${w.name}
- Duration: ${w.duration} minutes
- Current Scheduled: ${w.currentScheduledTime || 'Not scheduled'}
- Location: (${w.lat.toFixed(6)}, ${w.lng.toFixed(6)})
`).join('')}

DISTANCE MATRIX (miles between visits):
${distanceMatrix.map((row, i) => 
  `Visit ${i + 1} to others: ${row.map((d, j) => j !== i ? d.toFixed(2) : '0').join(', ')}`
).join('\n')}

OPTIMIZATION GOALS:
1. Minimize total travel time and distance
2. Maximize working hours utilization (aim for 70-85%)
3. **CRITICAL: Avoid ALL conflicts with existing tasks/appointments** - DO NOT schedule visits during training sessions, meetings, or other appointments
4. Minimize gaps between visits (but allow reasonable buffers)
5. Consider traffic patterns if enabled
6. Ensure visits fit within working hours
7. Prioritize visits that may have time constraints
8. Work around existing commitments (trainings, meetings, etc.)

CONSTRAINTS:
- Each visit requires its duration + 5-15 min buffer (longer travel = more buffer)
- Travel time between visits: ~${Math.round(25 * 60 / 25)} minutes per mile (25 mph average, adjust for traffic)
- Start time: ${workingHours.start} (add 5 min preparation buffer)
- End time: ${workingHours.end}
- Cannot schedule visits outside working hours
- **MUST AVOID overlapping with existing tasks listed above**
- If existing tasks block time slots, schedule visits before or after them

ANALYZE AND PROVIDE:
1. Optimal visit order (considering distances AND existing tasks)
2. Suggested start time for each visit (ensuring no conflicts with existing tasks)
3. Reasoning for each time slot (explain how it avoids conflicts)
4. Priority level for each visit
5. Overall efficiency improvements
6. Recommendations for better scheduling
7. Any risk factors or potential issues (especially conflicts with existing tasks)

Return a detailed optimization plan with specific times and reasoning.`

        const { object: aiResult } = await generateObject({
          model: openai("gpt-4o"),
          schema: aiScheduleOptimizationSchema,
          prompt: aiPrompt,
          temperature: 0.3, // Lower temperature for more consistent, logical results
        })

        const aiEndTime = Date.now()
        const aiDuration = ((aiEndTime - aiStartTime) / 1000).toFixed(2)
        
        console.log('')
        console.log('✅ AI API CALL SUCCESSFUL!')
        console.log('='.repeat(80))
        console.log('⏱️  AI Processing Time:', `${aiDuration} seconds`)
        console.log('🤖 AI Model Used: GPT-4o')
        console.log('📦 AI Response Received: YES')
        console.log('')
        console.log('📊 AI Optimization Results:')
        console.log('  - Optimized Visits:', aiResult.optimizedOrder.length)
        console.log('  - Total Time Saved:', `${aiResult.overallOptimization.totalTimeSaved} minutes`)
        console.log('  - Efficiency Gain:', `${aiResult.overallOptimization.efficiencyGain}%`)
        console.log('  - Recommendations Count:', aiResult.overallOptimization.recommendations?.length || 0)
        console.log('  - Risk Factors:', aiResult.overallOptimization.riskFactors?.length || 0)
        console.log('')
        console.log('📋 AI-Optimized Visit Order:')
        aiResult.optimizedOrder.forEach((item, idx) => {
          console.log(`  ${idx + 1}. Visit ID: ${item.visitId}`)
          console.log(`     Suggested Time: ${item.suggestedTime}`)
          console.log(`     Priority: ${item.priority}`)
          console.log(`     Efficiency Score: ${item.efficiencyScore}%`)
          console.log(`     Travel Time: ${item.estimatedTravelTime} min`)
          console.log(`     Reasoning: ${item.reasoning.substring(0, 100)}...`)
        })
        console.log('')
        if (aiResult.overallOptimization.recommendations && aiResult.overallOptimization.recommendations.length > 0) {
          console.log('💡 AI Recommendations:')
          aiResult.overallOptimization.recommendations.forEach((rec, idx) => {
            console.log(`  ${idx + 1}. ${rec}`)
          })
          console.log('')
        }
        if (aiResult.overallOptimization.riskFactors && aiResult.overallOptimization.riskFactors.length > 0) {
          console.log('⚠️  AI Risk Factors:')
          aiResult.overallOptimization.riskFactors.forEach((risk, idx) => {
            console.log(`  ${idx + 1}. ${risk}`)
          })
          console.log('')
        }
        console.log('='.repeat(80))
        console.log('✅ AI SCHEDULE OPTIMIZATION - COMPLETE')
        console.log('='.repeat(80))
        console.log('')

        // Use AI-optimized order if available
        if (aiResult.optimizedOrder && aiResult.optimizedOrder.length > 0) {
          console.log('🔄 Applying AI-Optimized Order to Waypoints...')
          const originalOrder = waypoints.map(w => w.id)
          
          // Reorder waypoints based on AI suggestion
          const aiOrderMap = new Map(aiResult.optimizedOrder.map((item, idx) => [item.visitId, idx]))
          waypoints.sort((a, b) => {
            const aIdx = aiOrderMap.get(a.id) ?? Infinity
            const bIdx = aiOrderMap.get(b.id) ?? Infinity
            return aIdx - bIdx
          })
          
          const newOrder = waypoints.map(w => w.id)
          const orderChanged = JSON.stringify(originalOrder) !== JSON.stringify(newOrder)
          
          console.log('📊 Order Comparison:')
          console.log('  Original Order:', originalOrder)
          console.log('  AI-Optimized Order:', newOrder)
          console.log('  Order Changed:', orderChanged ? 'YES ✅' : 'NO')
          console.log('')
          
          aiOptimizedSchedule = aiResult.optimizedOrder
          aiRecommendations = aiResult.overallOptimization.recommendations || []
          aiEfficiencyGain = aiResult.overallOptimization.efficiencyGain || 0
          
          console.log('✅ AI Optimization Applied Successfully!')
          console.log('')
        } else {
          console.log('⚠️  AI returned empty optimization order, using original order')
          console.log('')
        }
      } catch (aiError: any) {
        console.error('')
        console.error('❌ AI SCHEDULE OPTIMIZATION - ERROR')
        console.error('='.repeat(80))
        console.error('⚠️  AI Optimization Failed!')
        console.error('Error Type:', aiError.constructor.name)
        console.error('Error Message:', aiError.message)
        console.error('Error Stack:', aiError.stack)
        console.error('')
        console.error('🔄 Falling back to algorithm-based optimization...')
        console.error('='.repeat(80))
        console.error('')
        // Continue with non-AI optimization if AI fails
      }
    } else {
      if (!useAI) {
        console.log('')
        console.log('⚠️  AI OPTIMIZATION SKIPPED')
        console.log('='.repeat(80))
        console.log('Reason: OpenAI API key not configured')
        console.log('Action: Using algorithm-based optimization instead')
        console.log('='.repeat(80))
        console.log('')
      } else if (waypoints.length <= 1) {
        console.log('')
        console.log('⚠️  AI OPTIMIZATION SKIPPED')
        console.log('='.repeat(80))
        console.log('Reason: Only 1 or fewer visits (AI optimization requires 2+ visits)')
        console.log('Action: Using algorithm-based optimization instead')
        console.log('='.repeat(80))
        console.log('')
      }
    }

    // Helper function to check if a time slot conflicts with existing tasks
    const hasConflict = (startTime: Date, duration: number): boolean => {
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000)
      return existingTasks.some(task => {
        const taskStart = new Date(task.startTime)
        const taskEnd = new Date(task.endTime)
        // Check for overlap: new task starts before existing ends AND new task ends after existing starts
        return (startTime < taskEnd && endTime > taskStart)
      })
    }

    // Helper function to find next available time slot
    const findNextAvailableSlot = (fromTime: Date, duration: number): Date => {
      let candidateTime = new Date(fromTime)
      let attempts = 0
      const maxAttempts = 100 // Prevent infinite loop
      
      while (hasConflict(candidateTime, duration) && attempts < maxAttempts) {
        // Find the next task that conflicts
        const conflictingTask = existingTasks.find(task => {
          const taskStart = new Date(task.startTime)
          const taskEnd = new Date(task.endTime)
          return candidateTime < taskEnd && new Date(candidateTime.getTime() + duration * 60 * 1000) > taskStart
        })
        
        if (conflictingTask) {
          // Move to after the conflicting task ends
          candidateTime = new Date(conflictingTask.endTime)
          candidateTime.setMinutes(candidateTime.getMinutes() + 5) // Add 5 min buffer after task
        } else {
          candidateTime.setMinutes(candidateTime.getMinutes() + 15) // Move forward 15 min
        }
        attempts++
      }
      
      return candidateTime
    }

    // Calculate optimal schedule with intelligent time management
    const optimizedSchedule: Array<{
      visitId: string
      patientName: string
      suggestedTime: string
      travelTime: number
      visitDuration: number
      currentTime: string | null
      efficiency: string
    }> = []

    // Start at working hours beginning
    let currentTime = new Date(scheduleDate)
    currentTime.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0)
    
    // Add minimal buffer at start (5 minutes for preparation)
    currentTime.setMinutes(currentTime.getMinutes() + 5)

    // Track total time used for efficiency calculation
    let totalScheduledTime = 0
    let totalTravelTime = 0
    let totalVisitTime = 0

    for (let i = 0; i < waypoints.length; i++) {
      const waypoint = waypoints[i]
      
      // Calculate travel time from previous waypoint
      let travelTime = 0
      if (i > 0) {
        const prevWaypoint = waypoints[i - 1]
        
        // Check if visits are at the same location (within 50 meters = same building)
        const distance = calculateDistance(
          prevWaypoint.lat, prevWaypoint.lng,
          waypoint.lat, waypoint.lng
        )
        
        if (distance < 0.03) { // Less than 0.03 miles (~50 meters) = same location
          travelTime = 0
        } else {
          travelTime = calculateTravelTime(
            prevWaypoint.lat, prevWaypoint.lng,
            waypoint.lat, waypoint.lng,
            considerTraffic || false,
            currentTime
          )
        }
      }

      totalTravelTime += travelTime

      // Add travel time to current time
      if (travelTime > 0) {
        currentTime.setMinutes(currentTime.getMinutes() + travelTime)
      }

      // Check if we're still within working hours
      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
      if (currentMinutes > endMinutes) {
        // If we exceed working hours, schedule for next day
        scheduleDate.setDate(scheduleDate.getDate() + 1)
        const nextDayWorkingHours = await getStaffWorkingHours(supabase, staffId, scheduleDate)
        if (nextDayWorkingHours) {
          const nextStartMinutes = timeToMinutes(nextDayWorkingHours.start)
          currentTime = new Date(scheduleDate)
          currentTime.setHours(Math.floor(nextStartMinutes / 60), nextStartMinutes % 60, 0, 0)
          currentTime.setMinutes(currentTime.getMinutes() + 5) // Minimal buffer
        }
      }

      // Ensure visit duration is reasonable (minimum 15 minutes, default 30)
      const visitDuration = Math.max(waypoint.duration || 30, 15)
      totalVisitTime += visitDuration

      // Check for conflicts with existing tasks and find next available slot
      if (hasConflict(currentTime, visitDuration)) {
        console.log(`⚠️  Conflict detected for ${waypoint.name} at ${currentTime.toLocaleTimeString()}, finding next available slot...`)
        currentTime = findNextAvailableSlot(currentTime, visitDuration)
        console.log(`✅ Next available slot: ${currentTime.toLocaleTimeString()}`)
      }

      const suggestedTime = currentTime.toISOString()
      const currentScheduled = waypoint.currentScheduledTime

      // Calculate efficiency indicator
      let efficiency = "Optimal"
      if (i > 0) {
        const prevScheduled = optimizedSchedule[i - 1]
        const timeBetween = (new Date(suggestedTime).getTime() - new Date(prevScheduled.suggestedTime).getTime()) / 60000
        const expectedTime = prevScheduled.visitDuration + prevScheduled.travelTime + travelTime + 5 // 5 min buffer
        
        if (timeBetween > expectedTime + 30) {
          efficiency = "Gap Detected"
        } else if (timeBetween < expectedTime - 10) {
          efficiency = "Tight Schedule"
        }
      }

      optimizedSchedule.push({
        visitId: waypoint.id,
        patientName: waypoint.name,
        suggestedTime,
        travelTime,
        visitDuration,
        currentTime: currentScheduled,
        efficiency
      })

      // Move to end of visit with smart buffer calculation
      // Buffer depends on travel time: longer travel = more buffer needed
      const bufferTime = travelTime > 30 ? 15 : (travelTime > 10 ? 10 : 5) // Adaptive buffer
      currentTime.setMinutes(currentTime.getMinutes() + visitDuration + bufferTime)
      totalScheduledTime += travelTime + visitDuration + bufferTime
    }

    // Calculate comprehensive efficiency metrics
    const totalVisits = optimizedSchedule.length
    const avgTimeBetweenVisits = totalVisits > 1 
      ? totalTravelTime / (totalVisits - 1)
      : 0
    
    // Calculate utilization rate (how much of working time is used)
    // Note: workingDuration was already calculated above at line 183
    const utilizationRate = workingDuration > 0 
      ? ((totalScheduledTime / workingDuration) * 100).toFixed(1)
      : "0"
    
    // Calculate average visit duration
    const avgVisitDuration = totalVisits > 0 
      ? Math.round(totalVisitTime / totalVisits)
      : 0
    
    // Calculate time efficiency (visit time vs travel time ratio)
    const timeEfficiency = totalTravelTime > 0
      ? ((totalVisitTime / totalTravelTime) * 100).toFixed(1)
      : "100"
    
    // Detect conflicts or overlaps
    const conflicts: string[] = []
    for (let i = 1; i < optimizedSchedule.length; i++) {
      const prev = optimizedSchedule[i - 1]
      const curr = optimizedSchedule[i]
      const prevEnd = new Date(prev.suggestedTime)
      prevEnd.setMinutes(prevEnd.getMinutes() + prev.visitDuration)
      const currStart = new Date(curr.suggestedTime)
      
      if (currStart < prevEnd) {
        conflicts.push(`${prev.patientName} overlaps with ${curr.patientName}`)
      }
    }

    // Enhance schedule with AI insights if available
    const enhancedSchedule = optimizedSchedule.map((item) => {
      const aiInsight = aiOptimizedSchedule.find(ai => ai.visitId === item.visitId)
      return {
        ...item,
        aiReasoning: aiInsight?.reasoning,
        aiPriority: aiInsight?.priority,
        aiEfficiencyScore: aiInsight?.efficiencyScore
      }
    })

    // Final logging summary
    console.log('')
    console.log('📊 FINAL SCHEDULE OPTIMIZATION SUMMARY')
    console.log('='.repeat(80))
    console.log('✅ Total Visits Scheduled:', totalVisits)
    console.log('✅ Total Scheduled Time:', `${Math.round(totalScheduledTime)} minutes`)
    console.log('✅ Total Travel Time:', `${Math.round(totalTravelTime)} minutes`)
    console.log('✅ Total Visit Time:', `${Math.round(totalVisitTime)} minutes`)
    console.log('✅ Utilization Rate:', `${utilizationRate}%`)
    console.log('✅ Efficiency Score:', conflicts.length === 0 && parseFloat(utilizationRate) > 70 ? "Excellent" :
                 conflicts.length === 0 && parseFloat(utilizationRate) > 50 ? "Good" :
                 conflicts.length > 0 ? "Needs Review" : "Fair")
    console.log('✅ Conflicts Detected:', conflicts.length)
    console.log('')
    console.log('🤖 AI Optimization Status:')
    console.log('  - AI Enabled:', useAI ? 'YES ✅' : 'NO ❌')
    console.log('  - AI Used:', useAI && aiOptimizedSchedule.length > 0 ? 'YES ✅' : 'NO')
    console.log('  - AI Efficiency Gain:', aiEfficiencyGain > 0 ? `+${aiEfficiencyGain.toFixed(1)}% ✅` : 'N/A')
    console.log('  - AI Recommendations:', aiRecommendations.length)
    console.log('='.repeat(80))
    console.log('')

    return NextResponse.json({
      success: true,
      schedule: enhancedSchedule,
      metrics: {
        totalVisits,
        totalTime: Math.round(totalScheduledTime),
        totalTravelTime: Math.round(totalTravelTime),
        totalVisitTime: Math.round(totalVisitTime),
        avgTimeBetweenVisits: Math.round(avgTimeBetweenVisits),
        avgVisitDuration,
        utilizationRate: `${utilizationRate}%`,
        timeEfficiency: `${timeEfficiency}%`,
        conflicts: conflicts.length > 0 ? conflicts : null,
        workingHours: {
          start: workingHours.start,
          end: workingHours.end,
          duration: workingDuration
        },
        efficiency: {
          score: conflicts.length === 0 && parseFloat(utilizationRate) > 70 ? "Excellent" :
                 conflicts.length === 0 && parseFloat(utilizationRate) > 50 ? "Good" :
                 conflicts.length > 0 ? "Needs Review" : "Fair"
        },
        aiOptimization: useAI ? {
          enabled: true,
          efficiencyGain: aiEfficiencyGain,
          recommendations: aiRecommendations,
          optimizedOrder: aiOptimizedSchedule.length > 0
        } : {
          enabled: false,
          message: "AI optimization not available (OpenAI API key not configured)"
        },
        existingTasks: existingTasks.map(task => ({
          type: task.type,
          title: task.title,
          startTime: task.startTime,
          endTime: task.endTime,
          duration: task.duration
        }))
      }
    })
  } catch (error: any) {
    console.error("Error optimizing schedule:", error)
    return NextResponse.json({ error: error.message || "Failed to optimize schedule" }, { status: 500 })
  }
}

