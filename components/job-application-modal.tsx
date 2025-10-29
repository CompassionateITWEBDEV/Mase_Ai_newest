"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Upload,
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Phone,
  Shield,
  AlertTriangle,
  Heart,
  X,
} from "lucide-react"

interface ProfileData {
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  profession?: string
  experience?: string
  education?: string
  certifications?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  documents?: any[]
}

interface JobApplicationProps {
  prefilledData?: ProfileData
  jobId?: string
  onClose?: () => void
}
// Updated interface to include jobId

export default function JobApplication({ prefilledData, jobId, onClose }: JobApplicationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const totalSteps = 7

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string
    type: string
    size: number
    file: File
  }>>([])

  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    ssn: '',
    desiredPosition: '',
    employmentType: 'full-time',
    availability: '',
    yearsExperience: '',
    workHistory: '',
    specialties: '',
    highSchool: '',
    hsGradYear: '',
    college: '',
    degree: '',
    major: '',
    collegeGradYear: '',
    license: '',
    licenseState: '',
    licenseExpiry: '',
    cpr: '',
    otherCerts: '',
    // Healthcare Compliance & Background
    hipaaTraining: false,
    hipaaDetails: '',
    conflictInterest: false,
    conflictDetails: '',
    relationshipConflict: false,
    relationshipDetails: '',
    convictionHistory: false,
    convictionDetails: '',
    registryHistory: false,
    backgroundConsent: false,
    
    // Health & Safety
    tbTestStatus: '',
    tbTestDate: '',
    tbHistoryDetails: '',
    infectionTraining: false,
    infectionDetails: '',
    physicalAccommodation: false,
    physicalDetails: '',
    hepBVaccination: '',
    fluVaccination: '',
    immunizationDetails: '',
    
    // Emergency Contact
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    emergencyEmail: '',
    emergencyAddress: '',
    
    // References
    reference1Name: '',
    reference1Phone: '',
    reference1Relationship: '',
    reference1Company: '',
    reference1Email: '',
    reference2Name: '',
    reference2Phone: '',
    reference2Relationship: '',
    reference2Company: '',
    reference2Email: '',
    reference3Name: '',
    reference3Phone: '',
    reference3Relationship: '',
    reference3Company: '',
    reference3Email: '',
    
    // Terms & Conditions
    termsAgreed: false,
    employmentAtWill: false,
    drugTestingConsent: false,
    
    // Additional Information
    additionalInfo: '',
  })

  // Pre-fill form data when component mounts or prefilledData changes
  useEffect(() => {
    if (prefilledData) {
      setFormData(prev => ({
        ...prev,
        firstName: prefilledData.firstName || '',
        lastName: prefilledData.lastName || '',
        email: prefilledData.email || '',
        phone: prefilledData.phone || '',
        address: prefilledData.address || '',
        city: prefilledData.city || '',
        state: prefilledData.state || '',
        zipCode: prefilledData.zipCode || '',
        // Map experience level to years
        yearsExperience: mapExperienceToYears(prefilledData.experience || ''),
        // Map education level
        degree: mapEducationToDegree(prefilledData.education || ''),
        // Map certifications
        otherCerts: prefilledData.certifications || '',
        // Map profession to position
        desiredPosition: mapProfessionToPosition(prefilledData.profession || ''),
      }))
    }
  }, [prefilledData])

  // Helper functions to map profile data to form fields
  const mapExperienceToYears = (experience: string) => {
    const experienceMap: { [key: string]: string } = {
      'entry': '0-1',
      'junior': '2-5',
      'mid': '6-10',
      'senior': '11-15',
      'expert': '16+'
    }
    return experienceMap[experience.toLowerCase()] || ''
  }

  const mapEducationToDegree = (education: string) => {
    const educationMap: { [key: string]: string } = {
      'high school': '',
      'associate': 'Associate Degree',
      'bachelor': 'Bachelor Degree',
      'master': 'Master Degree',
      'doctorate': 'Doctorate'
    }
    return educationMap[education.toLowerCase()] || ''
  }

  const mapProfessionToPosition = (profession: string) => {
    const professionMap: { [key: string]: string } = {
      'registered nurse': 'rn',
      'rn': 'rn',
      'physical therapist': 'pt',
      'pt': 'pt',
      'occupational therapist': 'ot',
      'ot': 'ot',
      'speech therapist': 'st',
      'st': 'st',
      'home health aide': 'hha',
      'hha': 'hha',
      'social worker': 'msw',
      'msw': 'msw'
    }
    return professionMap[profession.toLowerCase()] || ''
  }

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // File upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0]
    if (file) {
      const newFile = {
        name: file.name,
        type: documentType,
        size: file.size,
        file: file
      }
      setUploadedFiles(prev => [...prev, newFile])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // First, create the job application record
      const applicationResponse = await fetch('/api/applications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_posting_id: jobId,
          applicant_id: prefilledData?.id,
          cover_letter: formData.workHistory || null,
          resume_url: null, // Will be set from uploaded documents
        }),
      })

      const applicationResult = await applicationResponse.json()

      if (!applicationResult.success) {
        throw new Error(applicationResult.error || 'Failed to create application')
      }

      // Then, save the detailed form data
      const formDataToSubmit = {
        job_application_id: applicationResult.application.id,
        // Personal Information
        first_name: formData.firstName,
        middle_initial: formData.middleInitial,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        date_of_birth: formData.dateOfBirth,
        ssn: formData.ssn,

        // Position & Experience
        desired_position: formData.desiredPosition,
        employment_type: formData.employmentType,
        availability: formData.availability,
        years_experience: formData.yearsExperience,
        work_history: formData.workHistory,
        specialties: formData.specialties,

        // Education
        high_school: formData.highSchool,
        hs_grad_year: formData.hsGradYear ? parseInt(formData.hsGradYear) : null,
        college: formData.college,
        degree: formData.degree,
        major: formData.major,
        college_grad_year: formData.collegeGradYear ? parseInt(formData.collegeGradYear) : null,

        // Licenses & Certifications
        license: formData.license,
        license_state: formData.licenseState,
        license_expiry: formData.licenseExpiry,
        cpr: formData.cpr,
        other_certs: formData.otherCerts,

        // Healthcare Compliance & Background
        hipaa_training: formData.hipaaTraining || false,
        hipaa_details: formData.hipaaDetails || '',
        conflict_interest: formData.conflictInterest || false,
        conflict_details: formData.conflictDetails || '',
        relationship_conflict: formData.relationshipConflict || false,
        relationship_details: formData.relationshipDetails || '',
        conviction_history: formData.convictionHistory || false,
        conviction_details: formData.convictionDetails || '',
        registry_history: formData.registryHistory || false,
        background_consent: formData.backgroundConsent || false,

        // Health & Safety
        tb_test_status: formData.tbTestStatus || '',
        tb_test_date: formData.tbTestDate || null,
        tb_history_details: formData.tbHistoryDetails || '',
        infection_training: formData.infectionTraining || false,
        infection_details: formData.infectionDetails || '',
        physical_accommodation: formData.physicalAccommodation || false,
        physical_details: formData.physicalDetails || '',
        hep_b_vaccination: formData.hepBVaccination || '',
        flu_vaccination: formData.fluVaccination || '',
        immunization_details: formData.immunizationDetails || '',

        // Emergency Contact
        emergency_name: formData.emergencyName || '',
        emergency_phone: formData.emergencyPhone || '',
        emergency_relationship: formData.emergencyRelationship || '',
        emergency_email: formData.emergencyEmail || '',
        emergency_address: formData.emergencyAddress || '',

        // References
        reference_1_name: formData.reference1Name || '',
        reference_1_phone: formData.reference1Phone || '',
        reference_1_relationship: formData.reference1Relationship || '',
        reference_1_company: formData.reference1Company || '',
        reference_1_email: formData.reference1Email || '',
        reference_2_name: formData.reference2Name || '',
        reference_2_phone: formData.reference2Phone || '',
        reference_2_relationship: formData.reference2Relationship || '',
        reference_2_company: formData.reference2Company || '',
        reference_2_email: formData.reference2Email || '',
        reference_3_name: formData.reference3Name || '',
        reference_3_phone: formData.reference3Phone || '',
        reference_3_relationship: formData.reference3Relationship || '',
        reference_3_company: formData.reference3Company || '',
        reference_3_email: formData.reference3Email || '',

        // Terms & Conditions
        terms_agreed: formData.termsAgreed || false,
        employment_at_will: formData.employmentAtWill || false,
        drug_testing_consent: formData.drugTestingConsent || false,

        // Additional Information
        additional_info: formData.additionalInfo || '',
      }

      const formResponse = await fetch('/api/applications/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataToSubmit),
      })

      const formResult = await formResponse.json()

      if (!formResult.success) {
        console.error('Form save failed, but application was created:', formResult)
        // Don't fail the whole submission if form save fails
      }

      // Upload documents to applicant_documents table
      if (uploadedFiles.length > 0) {
        console.log('Uploading documents:', uploadedFiles.length)
        
        for (const fileData of uploadedFiles) {
          try {
            // Create FormData for file upload
            const formData = new FormData()
            formData.append('file', fileData.file)
            formData.append('applicant_id', applicationResult.application.applicant_id)
            formData.append('document_type', fileData.type)
            formData.append('file_name', fileData.name)
            formData.append('file_size', fileData.size.toString())

            const documentResponse = await fetch('/api/applicants/documents/upload', {
              method: 'POST',
              body: formData,
            })

            const documentResult = await documentResponse.json()
            
            if (!documentResult.success) {
              console.error('Document upload failed:', documentResult.error)
            } else {
              console.log('Document uploaded successfully:', fileData.name)
            }
          } catch (error) {
            console.error('Error uploading document:', fileData.name, error)
          }
        }
      }

      alert(`Thank you for your application! Your application has been submitted successfully. We will contact you within 2-3 business days.`)
      if (onClose) onClose()

    } catch (error) {
      console.error('Submission error:', error)
      alert('There was an error submitting your application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                {currentStep === 1 && <User className="h-5 w-5 mr-2" />}
                {currentStep === 2 && <Briefcase className="h-5 w-5 mr-2" />}
                {currentStep === 3 && <GraduationCap className="h-5 w-5 mr-2" />}
                {currentStep === 4 && <FileText className="h-5 w-5 mr-2" />}
                {currentStep === 5 && <Shield className="h-5 w-5 mr-2" />}
                {currentStep === 6 && <Heart className="h-5 w-5 mr-2" />}
                {currentStep === 7 && <Phone className="h-5 w-5 mr-2" />}
                {currentStep === 1 && "Personal Information"}
                {currentStep === 2 && "Position & Experience"}
                {currentStep === 3 && "Education & Certifications"}
                {currentStep === 4 && "Healthcare Compliance"}
                {currentStep === 5 && "References & Contact"}
                {currentStep === 6 && "Health & Safety Requirements"}
                {currentStep === 7 && "Document Upload"}
              </div>
              {onClose && (
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Please provide your basic personal information"}
              {currentStep === 2 && "Tell us about your desired position and work experience"}
              {currentStep === 3 && "Share your educational background and certifications"}
              {currentStep === 4 && "Upload required documents and certifications"}
              {currentStep === 5 && "Complete healthcare compliance requirements"}
              {currentStep === 6 && "Health screening and safety requirements"}
              {currentStep === 7 && "Provide references and emergency contact information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input 
                      id="firstName" 
                      name="firstName" 
                      placeholder="Enter your first name" 
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="middleInitial">Middle Initial</Label>
                    <Input 
                      id="middleInitial" 
                      name="middleInitial" 
                      placeholder="M" 
                      maxLength={1}
                      value={formData.middleInitial}
                      onChange={(e) => handleInputChange('middleInitial', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName" 
                      name="lastName" 
                      placeholder="Enter your last name" 
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="your.email@example.com" 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      type="tel" 
                      placeholder="(248) 555-0123" 
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input 
                    id="address" 
                    name="address" 
                    placeholder="Street address" 
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input 
                      id="city" 
                      name="city" 
                      placeholder="City" 
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select name="state" value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input 
                      id="zipCode" 
                      name="zipCode" 
                      placeholder="48342" 
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input 
                    id="dateOfBirth" 
                    name="dateOfBirth" 
                    type="date" 
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required 
                  />
                </div>

                <div>
                  <Label htmlFor="ssn">Social Security Number *</Label>
                  <Input 
                    id="ssn" 
                    name="ssn" 
                    placeholder="XXX-XX-XXXX" 
                    maxLength={11} 
                    value={formData.ssn}
                    onChange={(e) => handleInputChange('ssn', e.target.value)}
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required for background check and employment verification
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Position & Experience */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="position">Position Applying For *</Label>
                  <Select name="desiredPosition" value={formData.desiredPosition} onValueChange={(value) => handleInputChange('desiredPosition', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rn">Registered Nurse (RN)</SelectItem>
                      <SelectItem value="pt">Physical Therapist (PT)</SelectItem>
                      <SelectItem value="ot">Occupational Therapist (OT)</SelectItem>
                      <SelectItem value="st">Speech Therapist (ST)</SelectItem>
                      <SelectItem value="hha">Home Health Aide (HHA)</SelectItem>
                      <SelectItem value="msw">Master of Social Work (MSW)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <RadioGroup name="employmentType" value={formData.employmentType} onValueChange={(value) => handleInputChange('employmentType', value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full-time" id="full-time" />
                      <Label htmlFor="full-time">Full-time</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="part-time" id="part-time" />
                      <Label htmlFor="part-time">Part-time</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="per-diem" id="per-diem" />
                      <Label htmlFor="per-diem">Per Diem</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="availability">Availability *</Label>
                  <Textarea
                    id="availability"
                    name="availability"
                    placeholder="Please describe your availability (days, hours, shifts)"
                    rows={3}
                    value={formData.availability}
                    onChange={(e) => handleInputChange('availability', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Select name="yearsExperience" value={formData.yearsExperience} onValueChange={(value) => handleInputChange('yearsExperience', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 years</SelectItem>
                      <SelectItem value="2-5">2-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="11-15">11-15 years</SelectItem>
                      <SelectItem value="16+">16+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workHistory">Work History</Label>
                  <Textarea
                    id="workHistory"
                    name="workHistory"
                    placeholder="Please provide a brief overview of your relevant work experience"
                    rows={4}
                    value={formData.workHistory}
                    onChange={(e) => handleInputChange('workHistory', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="specialties">Specialties/Areas of Expertise</Label>
                  <Textarea
                    id="specialties"
                    name="specialties"
                    placeholder="List any specialties, certifications, or areas of expertise"
                    rows={3}
                    value={formData.specialties}
                    onChange={(e) => handleInputChange('specialties', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Education & Certifications */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Education</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="highSchool">High School *</Label>
                        <Input 
                          id="highSchool" 
                          name="highSchool" 
                          placeholder="High school name" 
                          value={formData.highSchool}
                          onChange={(e) => handleInputChange('highSchool', e.target.value)}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="hsGradYear">Graduation Year</Label>
                        <Input 
                          id="hsGradYear" 
                          name="hsGradYear" 
                          type="number" 
                          placeholder="2020" 
                          min="1950" 
                          max="2030"
                          value={formData.hsGradYear}
                          onChange={(e) => handleInputChange('hsGradYear', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="college">College/University</Label>
                        <Input 
                          id="college" 
                          name="college" 
                          placeholder="Institution name" 
                          value={formData.college}
                          onChange={(e) => handleInputChange('college', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="degree">Degree</Label>
                        <Input 
                          id="degree" 
                          name="degree" 
                          placeholder="e.g., BSN, DPT, MSW" 
                          value={formData.degree}
                          onChange={(e) => handleInputChange('degree', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="major">Major/Field of Study</Label>
                        <Input 
                          id="major" 
                          name="major" 
                          placeholder="Field of study" 
                          value={formData.major}
                          onChange={(e) => handleInputChange('major', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="collegeGradYear">Graduation Year</Label>
                        <Input 
                          id="collegeGradYear" 
                          name="collegeGradYear" 
                          type="number" 
                          placeholder="2024" 
                          min="1950" 
                          max="2030"
                          value={formData.collegeGradYear}
                          onChange={(e) => handleInputChange('collegeGradYear', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Professional Licenses & Certifications</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="license">Professional License Number</Label>
                        <Input 
                          id="license" 
                          name="license" 
                          placeholder="License number" 
                          value={formData.license}
                          onChange={(e) => handleInputChange('license', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="licenseState">License State</Label>
                        <Select name="licenseState" value={formData.licenseState} onValueChange={(value) => handleInputChange('licenseState', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MI">Michigan</SelectItem>
                            <SelectItem value="OH">Ohio</SelectItem>
                            <SelectItem value="IN">Indiana</SelectItem>
                            <SelectItem value="IL">Illinois</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="licenseExpiry">License Expiration Date</Label>
                        <Input 
                          id="licenseExpiry" 
                          type="date" 
                          value={formData.licenseExpiry}
                          onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpr">CPR Certification</Label>
                        <Select value={formData.cpr} onValueChange={(value) => handleInputChange('cpr', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="CPR status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="current">Current</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="none">Not Certified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="otherCerts">Other Certifications</Label>
                      <Textarea
                        id="otherCerts"
                        placeholder="List any additional certifications (ACLS, BLS, etc.)"
                        rows={3}
                        value={formData.otherCerts}
                        onChange={(e) => handleInputChange('otherCerts', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Document Upload */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: "Resume/CV", required: true, description: "Current resume or curriculum vitae" },
                    {
                      name: "Professional License",
                      required: true,
                      description: "Copy of current professional license",
                    },
                    { name: "Degree/Diploma", required: true, description: "Educational credentials" },
                    { name: "CPR Certification", required: true, description: "Current CPR/ACLS certification" },
                    { name: "TB Test Results", required: true, description: "Tuberculosis screening results" },
                    { name: "Driver's License", required: true, description: "Valid driver's license" },
                    {
                      name: "Social Security Card",
                      required: true,
                      description: "Social Security Administration issued card",
                    },
                    { name: "Car Insurance", required: true, description: "Current automobile insurance certificate" },
                  ].map((doc, index) => {
                    // Check if resume is already uploaded
                    const isResume = doc.name === "Resume/CV"
                    const uploadedResume = prefilledData?.documents?.find((d: any) => d.document_type === 'resume')
                    
                    return (
                      <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <h3 className="font-medium text-sm">
                            {doc.name} {doc.required && <span className="text-red-500">*</span>}
                          </h3>
                          <p className="text-xs text-gray-500 mb-3">{doc.description}</p>
                          {isResume && uploadedResume ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                              <p className="text-xs text-green-800 font-medium">✓ Resume Already Uploaded</p>
                              <p className="text-xs text-green-600">{uploadedResume.file_name}</p>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm">
                              Choose File
                            </Button>
                          )}
                          <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG (Max 10MB)</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Document Requirements</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• All documents must be current and valid</li>
                    <li>• Professional licenses must not be expired</li>
                    <li>• TB test results must be within the last 12 months</li>
                    <li>• CPR certification must be current</li>
                    <li>• All documents will be verified during the hiring process</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 5: Healthcare Compliance */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <h3 className="font-medium text-red-900">Healthcare Compliance Requirements</h3>
                  </div>
                  <p className="text-sm text-red-800">
                    All healthcare positions require compliance with federal and state regulations. Please complete all
                    sections carefully.
                  </p>
                </div>

                {/* HIPAA Compliance */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    HIPAA Compliance & Privacy Training
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <Label>Have you completed HIPAA training in the past 12 months? *</Label>
                      <RadioGroup className="mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="hipaa-yes" />
                          <Label htmlFor="hipaa-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="hipaa-no" />
                          <Label htmlFor="hipaa-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="hipaa-cert">HIPAA Certification Details</Label>
                      <Textarea
                        id="hipaa-cert"
                        placeholder="Provide details about your HIPAA training (date, provider, certificate number if available)"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hipaa-agreement" required />
                      <Label htmlFor="hipaa-agreement" className="text-sm">
                        I understand and agree to comply with all HIPAA privacy and security requirements *
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Conflict of Interest */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Conflict of Interest Disclosure</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>
                        Do you have any financial interests in healthcare facilities, suppliers, or related businesses?
                        *
                      </Label>
                      <RadioGroup className="mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="conflict-yes" />
                          <Label htmlFor="conflict-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="conflict-no" />
                          <Label htmlFor="conflict-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="conflict-details">If yes, please provide details</Label>
                      <Textarea
                        id="conflict-details"
                        placeholder="Describe any potential conflicts of interest"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>
                        Are you related to or have personal relationships with any IrishTriplets employees, patients, or
                        board members? *
                      </Label>
                      <RadioGroup className="mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="relationship-yes" />
                          <Label htmlFor="relationship-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="relationship-no" />
                          <Label htmlFor="relationship-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="relationship-details">If yes, please provide details</Label>
                      <Textarea
                        id="relationship-details"
                        placeholder="Describe any relationships that could present conflicts"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Background Check Consent */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Background Check Authorization</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>Have you ever been convicted of a felony or misdemeanor? *</Label>
                      <RadioGroup className="mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="conviction-yes" />
                          <Label htmlFor="conviction-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="conviction-no" />
                          <Label htmlFor="conviction-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="conviction-details">If yes, please provide details</Label>
                      <Textarea
                        id="conviction-details"
                        placeholder="Provide details about any convictions, including dates and circumstances"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>
                        Have you ever been listed on any state abuse registry or had professional sanctions? *
                      </Label>
                      <RadioGroup className="mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="registry-yes" />
                          <Label htmlFor="registry-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="registry-no" />
                          <Label htmlFor="registry-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="background-consent" required />
                      <Label htmlFor="background-consent" className="text-sm">
                        I authorize IrishTriplets to conduct a comprehensive background check including criminal
                        history, employment verification, and professional references *
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Health & Safety Requirements */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <Heart className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="font-medium text-green-900">Health & Safety Requirements</h3>
                  </div>
                  <p className="text-sm text-green-800">
                    Healthcare workers must meet specific health and safety requirements to protect patients and
                    colleagues.
                  </p>
                </div>

                {/* TB Screening */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Tuberculosis (TB) Screening</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>TB Test Status *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select TB test status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="negative-recent">Negative (within 12 months)</SelectItem>
                          <SelectItem value="negative-old">Negative (over 12 months)</SelectItem>
                          <SelectItem value="positive-treated">Positive - Previously treated</SelectItem>
                          <SelectItem value="positive-current">Positive - Currently under treatment</SelectItem>
                          <SelectItem value="not-tested">Not tested</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tb-date">Date of Last TB Test</Label>
                      <Input id="tb-date" type="date" />
                    </div>
                    <div>
                      <Label htmlFor="tb-details">Additional TB History Details</Label>
                      <Textarea
                        id="tb-details"
                        placeholder="Provide any additional information about TB testing or treatment history"
                        rows={3}
                      />
                    </div>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> All healthcare workers must have a negative TB test within 12 months of
                        employment. If your test is older or you haven't been tested, you will need to complete testing
                        before starting work.
                      </p>
                    </div>
                  </div>
                </div>

                {/* HAPP Statement */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Healthcare Associated Prevention Program (HAPP) Statement</h4>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-2">HAPP Commitment Statement</h5>
                      <p className="text-sm text-blue-800 mb-3">
                        IrishTriplets is committed to preventing healthcare-associated infections and promoting patient
                        safety. All employees must adhere to evidence-based infection prevention practices.
                      </p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Follow proper hand hygiene protocols</li>
                        <li>• Use personal protective equipment (PPE) appropriately</li>
                        <li>• Adhere to isolation precautions</li>
                        <li>• Report potential infections or safety concerns immediately</li>
                        <li>• Participate in ongoing infection prevention training</li>
                      </ul>
                    </div>
                    <div>
                      <Label>Have you received training in infection prevention and control? *</Label>
                      <RadioGroup className="mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="infection-training-yes" />
                          <Label htmlFor="infection-training-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="infection-training-no" />
                          <Label htmlFor="infection-training-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="infection-training-details">Training Details</Label>
                      <Textarea
                        id="infection-training-details"
                        placeholder="Describe your infection prevention training (dates, provider, topics covered)"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="happ-agreement" required />
                      <Label htmlFor="happ-agreement" className="text-sm">
                        I commit to following all HAPP guidelines and infection prevention protocols *
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Physical Requirements */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Physical Requirements & Accommodations</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>
                        Can you perform the essential functions of the position with or without reasonable
                        accommodation? *
                      </Label>
                      <RadioGroup className="mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="physical-yes" />
                          <Label htmlFor="physical-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="with-accommodation" id="physical-accommodation" />
                          <Label htmlFor="physical-accommodation">Yes, with reasonable accommodation</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="physical-no" />
                          <Label htmlFor="physical-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="accommodation-details">If accommodation is needed, please describe</Label>
                      <Textarea
                        id="accommodation-details"
                        placeholder="Describe any accommodations you may need to perform job duties"
                        rows={3}
                      />
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <h5 className="font-medium text-gray-900 mb-2">Essential Physical Requirements Include:</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Lifting up to 50 pounds occasionally</li>
                        <li>• Standing and walking for extended periods</li>
                        <li>• Bending, stooping, and reaching</li>
                        <li>• Manual dexterity for patient care tasks</li>
                        <li>• Visual and auditory acuity for patient assessment</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Immunization Status */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Immunization Requirements</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Hepatitis B Vaccination *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="complete">Complete series</SelectItem>
                            <SelectItem value="in-progress">In progress</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                            <SelectItem value="immune">Naturally immune</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Influenza Vaccination (Current Season) *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="current">Current</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                            <SelectItem value="medical-exemption">Medical exemption</SelectItem>
                            <SelectItem value="not-received">Not received</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="immunization-details">Additional Immunization Information</Label>
                      <Textarea
                        id="immunization-details"
                        placeholder="Provide details about immunization status, exemptions, or medical contraindications"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: References & Contact */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Professional References</h3>
                  <p className="text-sm text-gray-600 mb-4">Please provide at least 3 professional references</p>

                  {[1, 2, 3].map((refNum) => (
                    <div key={refNum} className="border rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-3">Reference {refNum}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`ref${refNum}Name`}>Full Name *</Label>
                          <Input id={`ref${refNum}Name`} placeholder="Reference name" required />
                        </div>
                        <div>
                          <Label htmlFor={`ref${refNum}Relationship`}>Relationship *</Label>
                          <Input id={`ref${refNum}Relationship`} placeholder="e.g., Former Supervisor" required />
                        </div>
                        <div>
                          <Label htmlFor={`ref${refNum}Company`}>Company/Organization *</Label>
                          <Input id={`ref${refNum}Company`} placeholder="Company name" required />
                        </div>
                        <div>
                          <Label htmlFor={`ref${refNum}Phone`}>Phone Number *</Label>
                          <Input id={`ref${refNum}Phone`} type="tel" placeholder="(248) 555-0123" required />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor={`ref${refNum}Email`}>Email Address</Label>
                          <Input id={`ref${refNum}Email`} type="email" placeholder="reference@email.com" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
                  <div className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergencyName">Full Name *</Label>
                        <Input id="emergencyName" placeholder="Emergency contact name" required />
                      </div>
                      <div>
                        <Label htmlFor="emergencyRelationship">Relationship *</Label>
                        <Input id="emergencyRelationship" placeholder="e.g., Spouse, Parent" required />
                      </div>
                      <div>
                        <Label htmlFor="emergencyPhone">Phone Number *</Label>
                        <Input id="emergencyPhone" type="tel" placeholder="(248) 555-0123" required />
                      </div>
                      <div>
                        <Label htmlFor="emergencyEmail">Email Address</Label>
                        <Input id="emergencyEmail" type="email" placeholder="emergency@email.com" />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="emergencyAddress">Address</Label>
                        <Input id="emergencyAddress" placeholder="Emergency contact address" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Application Review</h3>
                  <p className="text-sm text-green-800">
                    Please review all information before submitting. Once submitted, you will receive a confirmation
                    email and our HR team will contact you within 2-3 business days.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" required />
                    <Label htmlFor="terms" className="text-sm">
                      I certify that all information provided is true and complete to the best of my knowledge *
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="employment-at-will" required />
                    <Label htmlFor="employment-at-will" className="text-sm">
                      I understand that employment with IrishTriplets is at-will and may be terminated by either party
                      at any time *
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="drug-testing" required />
                    <Label htmlFor="drug-testing" className="text-sm">
                      I consent to pre-employment drug testing and random drug testing as required *
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Document Upload */}
            {currentStep === 7 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Document Upload</h3>
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Required Documents</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Please upload the following documents. You can upload them now or later, but they must be submitted before your application can be processed.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Resume Upload */}
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4">
                        <div className="text-center">
                          <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                          <h5 className="font-medium text-gray-900 mb-1">Resume/CV</h5>
                          <p className="text-sm text-gray-600 mb-3">Upload your professional resume</p>
                          <input
                            type="file"
                            id="resume"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'resume')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('resume')?.click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      </div>

                      {/* License Upload */}
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4">
                        <div className="text-center">
                          <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                          <h5 className="font-medium text-gray-900 mb-1">Professional License</h5>
                          <p className="text-sm text-gray-600 mb-3">Upload your professional license</p>
                          <input
                            type="file"
                            id="license"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'license')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('license')?.click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      </div>

                      {/* Certification Upload */}
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4">
                        <div className="text-center">
                          <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                          <h5 className="font-medium text-gray-900 mb-1">Certifications</h5>
                          <p className="text-sm text-gray-600 mb-3">Upload relevant certifications</p>
                          <input
                            type="file"
                            id="certification"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'certification')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('certification')?.click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      </div>

                      {/* Background Check Upload */}
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4">
                        <div className="text-center">
                          <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                          <h5 className="font-medium text-gray-900 mb-1">Background Check</h5>
                          <p className="text-sm text-gray-600 mb-3">Upload background check results</p>
                          <input
                            type="file"
                            id="background_check"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'background_check')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('background_check')?.click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-6">
                        <h5 className="font-medium text-gray-900 mb-3">Uploaded Files</h5>
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <div>
                                  <p className="font-medium text-sm">{file.name}</p>
                                  <p className="text-xs text-gray-500">{file.type} • {(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
