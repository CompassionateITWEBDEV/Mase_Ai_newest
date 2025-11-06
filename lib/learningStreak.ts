/**
 * Calculate learning streak based on completion dates
 * A streak is maintained when user completes at least one module/training on consecutive days
 */

interface CompletionDate {
  date: string | Date
  trainingId?: string
  moduleId?: string
}

/**
 * Calculate current learning streak from completion dates
 * @param completionDates Array of completion dates (from database)
 * @returns Current streak in days (minimum 1)
 */
export function calculateLearningStreak(completionDates: CompletionDate[]): number {
  if (!completionDates || completionDates.length === 0) {
    return 1 // Default to 1 day streak
  }

  // Convert all dates to Date objects and sort (newest first)
  const dates = completionDates
    .map(c => {
      const date = typeof c.date === 'string' ? new Date(c.date) : c.date
      return date
    })
    .filter(date => !isNaN(date.getTime())) // Filter invalid dates
    .sort((a, b) => b.getTime() - a.getTime()) // Sort descending (newest first)

  if (dates.length === 0) {
    return 1
  }

  // Get unique dates (same day completions count as one day)
  const uniqueDates = new Set<string>()
  dates.forEach(date => {
    const dateStr = formatDateToDay(date)
    uniqueDates.add(dateStr)
  })

  const sortedUniqueDates = Array.from(uniqueDates)
    .map(str => parseDayString(str))
    .sort((a, b) => b.getTime() - a.getTime())

  // Check if most recent completion was today or yesterday
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const mostRecent = sortedUniqueDates[0]
  const mostRecentDay = new Date(mostRecent)
  mostRecentDay.setHours(0, 0, 0, 0)

  // If most recent completion is not today or yesterday, streak is broken
  if (mostRecentDay.getTime() < yesterday.getTime()) {
    return 1 // Streak broken, start at 1
  }

  // Calculate consecutive days
  let streak = 1
  let currentDate = new Date(mostRecentDay)

  for (let i = 1; i < sortedUniqueDates.length; i++) {
    const nextDate = new Date(sortedUniqueDates[i])
    nextDate.setHours(0, 0, 0, 0)

    const expectedDate = new Date(currentDate)
    expectedDate.setDate(expectedDate.getDate() - 1)

    // Check if next date is exactly one day before current
    if (nextDate.getTime() === expectedDate.getTime()) {
      streak++
      currentDate = nextDate
    } else {
      // Streak broken
      break
    }
  }

  return Math.max(1, streak) // Minimum streak is 1
}

/**
 * Format date to day string (YYYY-MM-DD)
 */
function formatDateToDay(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse day string (YYYY-MM-DD) to Date
 */
function parseDayString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Get completion dates from enrollment data
 * Extracts completion dates from various sources
 */
export function extractCompletionDates(enrollment: any, completions: any[] = []): CompletionDate[] {
  const dates: CompletionDate[] = []

  // Add enrollment completion date if exists
  if (enrollment?.completionDate) {
    dates.push({ date: enrollment.completionDate })
  }

  // Add completion records
  if (completions && Array.isArray(completions)) {
    completions.forEach(completion => {
      if (completion.completion_date || completion.completionDate) {
        dates.push({
          date: completion.completion_date || completion.completionDate,
          trainingId: completion.training_id || completion.trainingId,
        })
      }
    })
  }

  // Extract from module completion data
  if (enrollment?.completedModules) {
    const moduleData = enrollment.completedModules
    if (typeof moduleData === 'string') {
      try {
        const parsed = JSON.parse(moduleData)
        if (Array.isArray(parsed)) {
          // If it's an array of module IDs, we don't have dates
          // But we can use last_accessed or updated_at as proxy
          if (enrollment.updated_at) {
            dates.push({ date: enrollment.updated_at })
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  // Use last_accessed as fallback if no completion dates
  if (dates.length === 0 && enrollment?.last_accessed) {
    dates.push({ date: enrollment.last_accessed })
  }

  return dates
}

