import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract form data
    const applicationData = {
      id: `APP-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      personalInfo: {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        middleInitial: formData.get('middleInitial') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zipCode: formData.get('zipCode') as string,
        dateOfBirth: formData.get('dateOfBirth') as string,
        ssn: formData.get('ssn') as string,
      },
      position: {
        desired: formData.get('desiredPosition') as string,
        availability: formData.get('availability') as string,
        startDate: formData.get('startDate') as string,
        salary: formData.get('desiredSalary') as string,
      },
      experience: {
        years: formData.get('yearsExperience') as string,
        previousEmployer: formData.get('previousEmployer') as string,
        currentlyEmployed: formData.get('currentlyEmployed') as string,
      },
      education: {
        highSchool: formData.get('highSchool') as string,
        college: formData.get('college') as string,
        degree: formData.get('degree') as string,
        graduationYear: formData.get('graduationYear') as string,
      },
      // Handle file uploads
      documents: {
        resume: formData.get('resume') as File,
        license: formData.get('license') as File,
        certifications: formData.get('certifications') as File,
        driversLicense: formData.get('driversLicense') as File,
        socialSecurityCard: formData.get('socialSecurityCard') as File,
        carInsurance: formData.get('carInsurance') as File,
      },
      status: 'new',
      statusHistory: [
        {
          status: 'new',
          timestamp: new Date().toISOString(),
          user: 'System',
          notes: 'Application submitted online'
        }
      ]
    }

    // In a real application, you would:
    // 1. Validate the data
    // 2. Store in database
    // 3. Send notification emails to HR
    // 4. Store uploaded files securely
    // 5. Generate confirmation number

    console.log('New application received:', applicationData)

    // Simulate sending notification to HR team
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      await fetch(`${baseUrl}/api/notifications/new-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: `${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`,
          position: applicationData.position.desired,
          email: applicationData.personalInfo.email,
          applicationId: applicationData.id,
          submittedAt: applicationData.submittedAt
        })
      })
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
      // Don't fail the application submission if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: applicationData.id,
      confirmationNumber: `CONF-${Date.now()}`
    }, { status: 200 })

  } catch (error) {
    console.error('Application submission error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to submit application. Please try again.'
    }, { status: 500 })
  }
}
