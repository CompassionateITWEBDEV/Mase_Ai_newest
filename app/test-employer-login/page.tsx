'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Users, FileText, CheckCircle } from 'lucide-react'

export default function TestEmployerLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleTestLogin = async () => {
    setIsLoading(true)
    
    try {
      // Create test employer data
      const testEmployer = {
        id: 'emp_test_001',
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        email: 'john.smith@serenityrehab.com',
        first_name: 'John',
        last_name: 'Smith',
        company_name: 'Serenity Rehabilitation Center',
        company_type: 'healthcare',
        hiring_plan: 'enterprise',
        is_verified: true,
        city: 'Detroit',
        state: 'MI'
      }

      // Store in localStorage
      localStorage.setItem('currentUser', JSON.stringify({
        type: 'employer',
        ...testEmployer
      }))

      // Redirect to employer dashboard
      router.push('/employer-dashboard')
      
    } catch (error) {
      console.error('Test login failed:', error)
      alert('Test login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Test Employer Login</CardTitle>
          <CardDescription>
            Login as a test employer to test the dashboard functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Test Employer Details:</Label>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                <p><strong>Name:</strong> John Smith</p>
                <p><strong>Company:</strong> Serenity Rehabilitation Center</p>
                <p><strong>Email:</strong> john.smith@serenityrehab.com</p>
                <p><strong>Type:</strong> Healthcare</p>
                <p><strong>Plan:</strong> Enterprise</p>
              </div>
            </div>
            
            <Button 
              onClick={handleTestLogin}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Logging in...' : 'Login as Test Employer'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              This will log you in as a test employer with sample data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



