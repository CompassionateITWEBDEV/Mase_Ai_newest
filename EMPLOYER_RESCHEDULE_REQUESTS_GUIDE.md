# Employer Reschedule Requests Feature

## Summary
Added functionality for employers to see and respond to interview reschedule requests from applicants.

## What Was Added

### 1. API Endpoint
- **File**: `app/api/interviews/reschedule-list/route.ts`
- **Purpose**: Fetches all reschedule requests for an employer
- **Endpoint**: `GET /api/interviews/reschedule-list?employer_id={id}`
- **Returns**: List of reschedule requests with applicant, job posting, and interview details

### 2. Employer Dashboard Updates Needed
The following needs to be added to `app/employer-dashboard/page.tsx`:

#### A. State Variables (already added at line 101-102):
```typescript
const [rescheduleRequests, setRescheduleRequests] = useState<any[]>([])
const [isLoadingRescheduleRequests, setIsLoadingRescheduleRequests] = useState(false)
```

#### B. Function to Load Reschedule Requests
Add this function after `loadInterviews`:

```typescript
const loadRescheduleRequests = async () => {
  if (!employerId) return
  
  try {
    setIsLoadingRescheduleRequests(true)
    const response = await fetch(`/api/interviews/reschedule-list?employer_id=${employerId}&status=pending`)
    
    const data = await response.json()
    
    if (data.success && data.rescheduleRequests) {
      setRescheduleRequests(data.rescheduleRequests)
      console.log(`✅ Loaded ${data.rescheduleRequests.length} reschedule requests`)
    } else {
      setRescheduleRequests([])
    }
  } catch (error) {
    console.error('Error loading reschedule requests:', error)
    setRescheduleRequests([])
  } finally {
    setIsLoadingRescheduleRequests(false)
  }
}
```

#### C. Function to Respond to Requests
```typescript
const respondToRescheduleRequest = async (requestId: string, action: 'approved' | 'rejected') => {
  try {
    const response = await fetch('/api/interviews/reschedule-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        action,
        employerId
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      // Reload reschedule requests and interviews
      await loadRescheduleRequests()
      await loadInterviews()
      alert(action === 'approved' ? 'Reschedule request approved!' : 'Reschedule request rejected')
    } else {
      alert('Failed to respond to request: ' + data.error)
    }
  } catch (error) {
    console.error('Error responding to reschedule request:', error)
    alert('Failed to respond to request')
  }
}
```

#### D. Call loadRescheduleRequests in useEffect
Add to the useEffect that loads data when activeTab changes:
```typescript
if (activeTab === 'interviews' && employerId) {
  loadRescheduleRequests()
}
```

#### E. Display Section in Interviews Tab
Add this section before the existing interviews list (around line 3210):

```typescript
{/* Reschedule Requests Section */}
{rescheduleRequests.length > 0 && (
  <div className="mb-6">
    <h3 className="text-xl font-bold mb-4 text-orange-600 flex items-center gap-2">
      <AlertTriangle className="h-5 w-5" />
      Pending Reschedule Requests ({rescheduleRequests.length})
    </h3>
    
    <div className="grid gap-4">
      {rescheduleRequests.map((request) => (
        <Card key={request.id} className="border-orange-300 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-lg">
                    {request.applicant?.first_name} {request.applicant?.last_name}
                  </h4>
                  <Badge variant="outline" className="bg-orange-100">
                    {request.job_posting?.title || 'Job Position'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Current Schedule:</p>
                    <p className="font-medium">
                      {request.original_date ? new Date(request.original_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Proposed New Schedule:</p>
                    <p className="font-medium text-blue-600">
                      {request.proposed_date ? new Date(request.proposed_date).toLocaleDateString() : 'N/A'} 
                      {request.proposed_time ? ` at ${request.proposed_time}` : ''}
                    </p>
                  </div>
                </div>
                
                {request.reason && (
                  <div className="bg-white p-3 rounded border mb-3">
                    <p className="text-sm text-gray-600 mb-1">Reason:</p>
                    <p className="text-sm">{request.reason}</p>
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  Requested: {new Date(request.created_at).toLocaleString()}
                </p>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => respondToRescheduleRequest(request.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => respondToRescheduleRequest(request.id, 'rejected')}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)}
```

## How It Works

1. **Applicant requests reschedule** → Creates record in `interview_reschedule_requests` table
2. **Employer sees notification** → Notification appears in employer dashboard
3. **Employer opens Interviews tab** → Sees pending reschedule requests section
4. **Employer reviews request** → Sees applicant name, job, current schedule, proposed schedule, and reason
5. **Employer responds**:
   - **Approve**: Updates interview schedule with new date/time, notifies applicant
   - **Reject**: Keeps original schedule, notifies applicant

## Database Schema
Uses existing `interview_reschedule_requests` table with these key fields:
- `id` - Unique identifier
- `interview_id` - Reference to interview being rescheduled
- `applicant_id` - Who requested the reschedule
- `employer_id` - Who needs to approve
- `original_date` - Current scheduled date
- `proposed_date` - New requested date
- `proposed_time` - New requested time
- `reason` - Why they want to reschedule
- `status` - 'pending', 'approved', or 'rejected'
- `created_at` - When request was made
- `review_date` - When employer responded
- `review_by` - Employer who reviewed

## Testing

1. Have applicant submit a reschedule request
2. Login as employer
3. Go to Interviews tab
4. Should see "Pending Reschedule Requests" section
5. Click Approve or Reject
6. Verify notification sent to applicant
7. If approved, verify interview schedule updated

## API Endpoints Used

- `GET /api/interviews/reschedule-list` - List reschedule requests for employer
- `POST /api/interviews/reschedule-response` - Approve or reject a request (already exists)

## Next Steps

Add the code sections above to complete the implementation in the employer dashboard.

