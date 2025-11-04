# In-Service Training System - Complete Workflow Guide

## Overview

This guide explains how the in-service training system tracks progress and how staff can complete trainings. The system uses a multi-step workflow: **Assignment → Enrollment → Progress Tracking → Completion**.

---

## Database Tables & Flow

### 1. **in_service_trainings**
- Stores all available training courses/modules
- Contains training content, modules (PDFs, documents), CEU hours, target roles, etc.

### 2. **in_service_assignments** 
- Created when admin assigns a training to employees
- Can assign to: "all", specific role, or individual employees
- Creates enrollment records automatically

### 3. **in_service_enrollments**
- Created when employee is assigned or starts a training
- Tracks: `status` ('enrolled', 'in_progress', 'completed', 'cancelled'), `progress` (0-100%), `last_accessed`
- This is where progress bars get their data from!

### 4. **in_service_completions**
- Created when employee completes a training
- Stores: completion date, score, CEU hours earned, certificate number
- Updates employee training requirements

### 5. **employee_training_requirements**
- Tracks annual requirement hours per employee
- Calculates: completed hours, in-progress hours, remaining hours
- Updates automatically when trainings are completed

---

## How Progress is Tracked

### Current System Status

The system has **backend APIs** ready but needs a **staff-facing training page** where employees can:
1. View their assigned trainings
2. Start/enroll in trainings
3. View training modules (PDFs, documents)
4. Update progress as they complete modules
5. Take quizzes (if configured)
6. Complete trainings

### Progress Tracking Flow

```
1. Admin assigns training → Creates in_service_assignments
   ↓
2. Assignment creates enrollment → Creates in_service_enrollments (status: 'enrolled')
   ↓
3. Staff clicks "Start Training" → Updates enrollment (status: 'in_progress', progress: 0%)
   ↓
4. Staff views modules, completes sections → Updates enrollment (progress: 25%, 50%, 75%...)
   ↓
5. Staff completes all modules + quiz → Updates enrollment (status: 'completed', progress: 100%)
   ↓
6. System creates completion record → Creates in_service_completions
   ↓
7. Employee training requirements updated → Updates employee_training_requirements
```

---

## API Endpoints Available

### `/api/in-service/employee-progress` (POST)

**Actions:**
- `"enroll"` - Create enrollment record
- `"start"` - Start a training (change status to 'in_progress')
- `"progress"` - Update progress percentage (0-100)
- `"complete"` - Mark training as completed

**Example: Start Training**
```javascript
await fetch('/api/in-service/employee-progress', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: 'staff-uuid',
    trainingId: 'training-uuid',
    action: 'start'
  })
})
```

**Example: Update Progress**
```javascript
await fetch('/api/in-service/employee-progress', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: 'staff-uuid',
    trainingId: 'training-uuid',
    action: 'progress',
    data: { progress: 50 } // 50% complete
  })
})
```

**Example: Complete Training**
```javascript
await fetch('/api/in-service/employee-progress', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: 'staff-uuid',
    trainingId: 'training-uuid',
    action: 'complete',
    data: {
      score: 85, // Quiz score (0-100)
      ceuHours: 2.0,
      quizAttempts: 1
    }
  })
})
```

### `/api/in-service/employee-progress` (GET)

**Fetches:**
- Employee's completed trainings
- Employee's in-progress trainings  
- Employee's upcoming deadlines
- Annual requirement hours
- Progress percentages

---

## How Staff Should Complete Trainings

### Step-by-Step Implementation Needed

#### 1. **Create Staff Training Page** (`app/staff-training/page.tsx` or similar)

This page should:
- Fetch employee's assigned trainings from `/api/in-service/employee-progress`
- Display trainings with status badges (Not Started, In Progress, Completed)
- Show progress bars for in-progress trainings
- Allow staff to click "Start" or "Continue" on trainings

#### 2. **Training Detail Page** (`app/staff-training/[trainingId]/page.tsx`)

This page should:
- Fetch training details (title, description, modules, CEU hours)
- Fetch enrollment status and progress
- Display training modules (PDFs, documents) with preview/download
- Track which modules are viewed/completed
- Update progress as modules are completed
- Show quiz (if training has quiz configured)
- Allow completion submission

#### 3. **Progress Tracking Logic**

```typescript
// When staff views a module
const markModuleViewed = async (moduleId: string) => {
  // Calculate new progress based on modules viewed
  const totalModules = training.modules.length
  const viewedModules = completedModules.length + 1
  const newProgress = Math.round((viewedModules / totalModules) * 100)
  
  // Update progress in database
  await fetch('/api/in-service/employee-progress', {
    method: 'POST',
    body: JSON.stringify({
      employeeId: currentStaffId,
      trainingId: trainingId,
      action: 'progress',
      data: { progress: newProgress }
    })
  })
}

// When staff completes all modules
const completeTraining = async (quizScore: number) => {
  await fetch('/api/in-service/employee-progress', {
    method: 'POST',
    body: JSON.stringify({
      employeeId: currentStaffId,
      trainingId: trainingId,
      action: 'complete',
      data: {
        score: quizScore,
        ceuHours: training.ceuHours,
        quizAttempts: 1
      }
    })
  })
}
```

---

## Example Implementation

### Staff Training List Page

```typescript
// app/staff-training/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function StaffTrainingPage() {
  const [trainings, setTrainings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchTrainings()
  }, [])
  
  const fetchTrainings = async () => {
    try {
      // Get current staff ID from session/auth
      const staffId = await getCurrentStaffId()
      
      const response = await fetch(`/api/in-service/employee-progress?employeeId=${staffId}`)
      const data = await response.json()
      
      if (data.success) {
        // Combine assigned, in-progress, and completed trainings
        const allTrainings = [
          ...data.employees[0].inProgressTrainings,
          ...data.employees[0].completedTrainings,
          ...data.employees[0].upcomingDeadlines.map((d: any) => ({
            id: d.trainingId,
            title: d.training,
            status: 'assigned',
            progress: 0
          }))
        ]
        setTrainings(allTrainings)
      }
    } catch (error) {
      console.error('Error fetching trainings:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const startTraining = async (trainingId: string) => {
    try {
      const staffId = await getCurrentStaffId()
      await fetch('/api/in-service/employee-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: staffId,
          trainingId: trainingId,
          action: 'start'
        })
      })
      fetchTrainings() // Refresh
    } catch (error) {
      console.error('Error starting training:', error)
    }
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Trainings</h1>
      
      <div className="space-y-4">
        {trainings.map((training) => (
          <Card key={training.id}>
            <CardHeader>
              <CardTitle>{training.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge>
                  {training.status === 'completed' ? 'Completed' :
                   training.status === 'in_progress' ? 'In Progress' :
                   'Not Started'}
                </Badge>
                {training.progress !== undefined && (
                  <span>{training.progress}%</span>
                )}
              </div>
              
              {training.progress !== undefined && training.progress < 100 && (
                <Progress value={training.progress} className="mb-4" />
              )}
              
              <Button
                onClick={() => {
                  if (training.status === 'assigned' || training.status === 'enrolled') {
                    startTraining(training.id)
                  } else {
                    window.location.href = `/staff-training/${training.id}`
                  }
                }}
              >
                {training.status === 'completed' ? 'View Certificate' :
                 training.status === 'in_progress' ? 'Continue Training' :
                 'Start Training'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### Training Detail/View Page

```typescript
// app/staff-training/[trainingId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function TrainingDetailPage() {
  const params = useParams()
  const trainingId = params.trainingId as string
  const [training, setTraining] = useState<any>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [completedModules, setCompletedModules] = useState<string[]>([])
  
  useEffect(() => {
    fetchTraining()
    fetchEnrollment()
  }, [trainingId])
  
  const fetchTraining = async () => {
    const response = await fetch(`/api/in-service/trainings`)
    const data = await response.json()
    const training = data.trainings.find((t: any) => t.id === trainingId)
    setTraining(training)
  }
  
  const fetchEnrollment = async () => {
    const staffId = await getCurrentStaffId()
    const response = await fetch(`/api/in-service/employee-progress?employeeId=${staffId}`)
    const data = await response.json()
    const enrollment = data.employees[0].inProgressTrainings.find(
      (t: any) => t.id === trainingId
    )
    setEnrollment(enrollment)
  }
  
  const markModuleComplete = async (moduleId: string) => {
    const staffId = await getCurrentStaffId()
    const totalModules = training.modules.length
    const newCompleted = [...completedModules, moduleId]
    setCompletedModules(newCompleted)
    
    const newProgress = Math.round((newCompleted.length / totalModules) * 100)
    
    await fetch('/api/in-service/employee-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: staffId,
        trainingId: trainingId,
        action: 'progress',
        data: { progress: newProgress }
      })
    })
  }
  
  const completeTraining = async (quizScore: number) => {
    const staffId = await getCurrentStaffId()
    await fetch('/api/in-service/employee-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: staffId,
        trainingId: trainingId,
        action: 'complete',
        data: {
          score: quizScore,
          ceuHours: training.ceuHours,
          quizAttempts: 1
        }
      })
    })
    // Redirect to completion page
  }
  
  if (!training) return <div>Loading...</div>
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{training.title}</h1>
      
      {/* Progress Bar */}
      {enrollment && (
        <div className="mb-6">
          <Progress value={enrollment.progress || 0} />
          <p className="text-sm text-gray-600 mt-2">
            {enrollment.progress || 0}% Complete
          </p>
        </div>
      )}
      
      {/* Training Modules */}
      <div className="space-y-4 mb-6">
        <h2 className="text-xl font-semibold">Modules</h2>
        {training.modules?.map((module: any, index: number) => (
          <Card key={module.id || index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{module.title}</h3>
                  <p className="text-sm text-gray-600">
                    Duration: {module.duration} minutes
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {completedModules.includes(module.id) && (
                    <Badge className="bg-green-100 text-green-800">✓ Completed</Badge>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Open module file (PDF, etc.)
                      if (module.fileUrl) {
                        window.open(module.fileUrl, '_blank')
                        // Mark as viewed/completed after viewing
                        markModuleComplete(module.id)
                      }
                    }}
                  >
                    {completedModules.includes(module.id) ? 'Review' : 'View Module'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Quiz Section (if training has quiz) */}
      {training.quiz && enrollment && enrollment.progress >= 100 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Final Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Quiz component here */}
            <Button onClick={() => completeTraining(85)}>
              Submit Quiz & Complete Training
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

## How Progress Bars Work

### Current Display (Admin View)

In `/app/in-service/page.tsx` (Employee Progress tab):
- Progress bars show `completedHours / annualRequirement * 100`
- In-progress trainings show `enrollment.progress` (0-100%)
- Completed trainings show 100%

### Data Flow

1. **Admin assigns training** → Creates `in_service_assignments` and `in_service_enrollments`
2. **Staff starts training** → Updates `in_service_enrollments.status = 'in_progress'`
3. **Staff views modules** → Updates `in_service_enrollments.progress = X%`
4. **Staff completes training** → Updates `in_service_enrollments.status = 'completed'`, creates `in_service_completions`
5. **System calculates hours** → Updates `employee_training_requirements.completed_hours`
6. **Admin views progress** → Sees updated progress bars and completion status

---

## What Needs to be Built

### ✅ Already Built (Backend)
- Database tables
- API endpoints for enrollment, progress, completion
- Admin view to assign trainings
- Admin view to see employee progress

### ❌ Needs to be Built (Frontend)
1. **Staff Training List Page** - Where staff see their assigned trainings
2. **Training Detail/View Page** - Where staff can view modules and complete trainings
3. **Module Viewer** - Preview/download PDFs and documents
4. **Progress Tracking UI** - Update progress as modules are viewed
5. **Quiz Component** - If training has quiz configured
6. **Completion Flow** - Submit quiz, mark training complete

---

## Quick Start Implementation

1. **Create staff training route**: `app/staff-training/page.tsx`
2. **Create training detail route**: `app/staff-training/[trainingId]/page.tsx`
3. **Add navigation link** in staff dashboard to `/staff-training`
4. **Implement progress tracking** using the existing API endpoints
5. **Test the flow**: Assign → Start → Progress → Complete

---

## Testing the System

1. **Admin assigns training** in `/in-service` → Assignments tab
2. **Check enrollment created** in `in_service_enrollments` table
3. **Staff navigates to training page** (needs to be built)
4. **Staff starts training** → Status changes to 'in_progress'
5. **Staff views modules** → Progress updates (25%, 50%, 75%...)
6. **Staff completes training** → Status changes to 'completed', completion record created
7. **Check admin view** → Progress bars update, completion shows in employee progress tab

---

## Summary

The **backend is ready** - all APIs exist for tracking progress. The **frontend needs to be built** so staff can:
- See their assigned trainings
- Start trainings
- View training modules
- Update progress as they complete modules
- Complete trainings and earn CEU hours

Once the staff-facing pages are built, the progress bars and all tracking features will work automatically!

