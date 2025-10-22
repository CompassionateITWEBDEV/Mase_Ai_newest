"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestEmployerPage() {
  const [employerInfo, setEmployerInfo] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load employer info from localStorage
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setEmployerInfo(user)
        console.log('Employer info loaded:', user)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  const testEmployerLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john.smith@serenityrehab.com',
          password: 'test123',
          accountType: 'employer'
        })
      })

      const data = await response.json()
      console.log('Login response:', data)

      if (data.success) {
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        setEmployerInfo(data.user)
        alert('Employer login successful! Check the employer dashboard.')
      } else {
        alert('Login failed: ' + data.error)
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Login error: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const testApplications = async () => {
    if (!employerInfo?.id) {
      alert('Please login as employer first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/applications/employer?employer_id=${employerInfo.id}`)
      const data = await response.json()
      console.log('Applications response:', data)
      setApplications(data.applications || [])
    } catch (error) {
      console.error('Applications error:', error)
      alert('Error loading applications: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const testJobs = async () => {
    if (!employerInfo?.id) {
      alert('Please login as employer first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/jobs/list?employer_id=${employerInfo.id}`)
      const data = await response.json()
      console.log('Jobs response:', data)
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Jobs error:', error)
      alert('Error loading jobs: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const clearData = () => {
    localStorage.removeItem('currentUser')
    setEmployerInfo(null)
    setApplications([])
    setJobs([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Employer Dashboard Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Employer Info</CardTitle>
            </CardHeader>
            <CardContent>
              {employerInfo ? (
                <div className="space-y-2">
                  <p><strong>ID:</strong> {employerInfo.id}</p>
                  <p><strong>Name:</strong> {employerInfo.firstName} {employerInfo.lastName}</p>
                  <p><strong>Email:</strong> {employerInfo.email}</p>
                  <p><strong>Company:</strong> {employerInfo.companyName}</p>
                  <p><strong>Account Type:</strong> {employerInfo.accountType}</p>
                </div>
              ) : (
                <p>No employer logged in</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testEmployerLogin}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Logging in...' : 'Login as Test Employer'}
              </Button>
              
              <Button 
                onClick={testApplications}
                disabled={!employerInfo || loading}
                variant="outline"
                className="w-full"
              >
                Test Applications API
              </Button>
              
              <Button 
                onClick={testJobs}
                disabled={!employerInfo || loading}
                variant="outline"
                className="w-full"
              >
                Test Jobs API
              </Button>
              
              <Button 
                onClick={clearData}
                variant="destructive"
                className="w-full"
              >
                Clear Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Applications */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Applications ({applications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app, index) => (
                  <div key={index} className="border p-4 rounded-lg">
                    <p><strong>Applicant:</strong> {app.applicant?.full_name || 'Unknown'}</p>
                    <p><strong>Job:</strong> {app.job_posting?.title || 'Unknown'}</p>
                    <p><strong>Status:</strong> {app.status}</p>
                    <p><strong>Applied:</strong> {new Date(app.applied_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No applications found</p>
            )}
          </CardContent>
        </Card>

        {/* Jobs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Jobs ({jobs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job, index) => (
                  <div key={index} className="border p-4 rounded-lg">
                    <p><strong>Title:</strong> {job.title}</p>
                    <p><strong>Department:</strong> {job.department}</p>
                    <p><strong>Type:</strong> {job.job_type}</p>
                    <p><strong>Salary:</strong> ${job.salary_min} - ${job.salary_max}</p>
                    <p><strong>Location:</strong> {job.city}, {job.state}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No jobs found</p>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              <li>First, run the SQL script to add test employer: <code>scripts/025-add-test-employer.sql</code></li>
              <li>Click "Login as Test Employer" to login with the test employer account</li>
              <li>Test the Applications and Jobs APIs to see if they return data</li>
              <li>Check the browser console for detailed logs</li>
              <li>Go to the employer dashboard to see if it works properly</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
