"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestTrackingPage() {
  const [invitationId, setInvitationId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testTracking = async (action: 'open' | 'click') => {
    if (!invitationId) {
      alert('Please enter an invitation ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/debug-tracking?id=${invitationId}&action=${action}`)
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to test tracking', details: error })
    } finally {
      setLoading(false)
    }
  }

  const getInvitationDetails = async () => {
    if (!invitationId) {
      alert('Please enter an invitation ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/debug-tracking?id=${invitationId}`)
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to get invitation details', details: error })
    } finally {
      setLoading(false)
    }
  }

  const testDirectTracking = async (action: 'open' | 'click') => {
    if (!invitationId) {
      alert('Please enter an invitation ID')
      return
    }

    setLoading(true)
    try {
      const url = `/api/invitations/track?action=${action}&id=${invitationId}`
      if (action === 'click') {
        window.open(url, '_blank')
      } else {
        const response = await fetch(url)
        const data = await response.json()
        setResult(data)
      }
    } catch (error) {
      setResult({ error: 'Failed to test direct tracking', details: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Email Tracking Debug Tool</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Invitation ID:</label>
              <Input
                value={invitationId}
                onChange={(e) => setInvitationId(e.target.value)}
                placeholder="Enter invitation ID from database"
              />
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={() => getInvitationDetails()}
                disabled={loading}
                variant="outline"
              >
                Get Invitation Details
              </Button>
              
              <Button 
                onClick={() => testTracking('open')}
                disabled={loading}
                variant="outline"
              >
                Test Open Tracking
              </Button>
              
              <Button 
                onClick={() => testTracking('click')}
                disabled={loading}
                variant="outline"
              >
                Test Click Tracking
              </Button>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => testDirectTracking('open')}
                disabled={loading}
                variant="secondary"
              >
                Test Direct Open (Image)
              </Button>
              
              <Button 
                onClick={() => testDirectTracking('click')}
                disabled={loading}
                variant="secondary"
              >
                Test Direct Click (Redirect)
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              <li>Send an invitation using your invite system</li>
              <li>Check the database for the invitation ID</li>
              <li>Enter the invitation ID above</li>
              <li>Test the tracking functions</li>
              <li>Check the database to see if the timestamps were updated</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
