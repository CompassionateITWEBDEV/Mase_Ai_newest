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
  ArrowLeft,
  Upload,
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Phone,
  Shield,
  AlertTriangle,
  Heart,
} from "lucide-react"
import Link from "next/link"

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
}

export default function JobApplication({ prefilledData, jobId }: JobApplicationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const totalSteps = 7
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>({})

  // Form data state - persisted across step navigation
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
    // Healthcare Compliance fields
    hipaa_training: false,
    hipaa_details: '',
    hipaa_agreement: false,
    conflict_interest: false,
    conflict_details: '',
    relationship_conflict: false,
    relationship_details: '',
    conviction_history: false,
    conviction_details: '',
    registry_history: false,
    background_consent: false,
    // Health & Safety fields
    tb_test_status: '',
    tb_test_date: '',
    tb_history_details: '',
    infection_training: false,
    infection_details: '',
    happ_agreement: false,
    physical_accommodation: '', // 'yes', 'accommodation', or 'no'
    physical_details: '',
    hep_b_vaccination: '',
    flu_vaccination: '',
    immunization_details: '',
    // References fields
    reference_1_name: '',
    reference_1_relationship: '',
    reference_1_company: '',
    reference_1_phone: '',
    reference_1_email: '',
    reference_2_name: '',
    reference_2_relationship: '',
    reference_2_company: '',
    reference_2_phone: '',
    reference_2_email: '',
    reference_3_name: '',
    reference_3_relationship: '',
    reference_3_company: '',
    reference_3_phone: '',
    reference_3_email: '',
    // Emergency Contact fields
    emergency_name: '',
    emergency_relationship: '',
    emergency_phone: '',
    emergency_email: '',
    emergency_address: '',
    // Agreement fields
    terms_agreed: false,
    employment_at_will: false,
    drug_testing_consent: false,
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

  // Handle form field changes - using functional update to ensure we always have latest state
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const nextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle file selection
  const handleFileChange = (docKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    event.stopPropagation()
    
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File size exceeds 10MB limit. Please choose a smaller file.`)
        // Reset the input
        event.target.value = ''
        return
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type. Please upload PDF, JPG, or PNG files only.`)
        // Reset the input
        event.target.value = ''
        return
      }
      setSelectedFiles(prev => ({
        ...prev,
        [docKey]: file
      }))
    }
  }

  // Remove selected file
  const removeSelectedFile = (docKey: string) => {
    setSelectedFiles(prev => {
      const newFiles = { ...prev }
      delete newFiles[docKey]
      return newFiles
    })
    // Reset the file input
    const fileInput = document.getElementById(`file-${docKey}`) as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // Reset form to initial state
  const resetForm = () => {
    // Clear selected files
    setSelectedFiles({})
    setFormData({
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
      // Healthcare Compliance fields
      hipaa_training: false,
      hipaa_details: '',
      hipaa_agreement: false,
      conflict_interest: false,
      conflict_details: '',
      relationship_conflict: false,
      relationship_details: '',
      conviction_history: false,
      conviction_details: '',
      registry_history: false,
      background_consent: false,
      // Health & Safety fields
      tb_test_status: '',
      tb_test_date: '',
      tb_history_details: '',
      infection_training: false,
      infection_details: '',
      happ_agreement: false,
      physical_accommodation: '',
      physical_details: '',
      hep_b_vaccination: '',
      flu_vaccination: '',
      immunization_details: '',
      // References fields
      reference_1_name: '',
      reference_1_relationship: '',
      reference_1_company: '',
      reference_1_phone: '',
      reference_1_email: '',
      reference_2_name: '',
      reference_2_relationship: '',
      reference_2_company: '',
      reference_2_phone: '',
      reference_2_email: '',
      reference_3_name: '',
      reference_3_relationship: '',
      reference_3_company: '',
      reference_3_phone: '',
      reference_3_email: '',
      // Emergency Contact fields
      emergency_name: '',
      emergency_relationship: '',
      emergency_phone: '',
      emergency_email: '',
      emergency_address: '',
      // Agreement fields
      terms_agreed: false,
      employment_at_will: false,
      drug_testing_consent: false,
    })
    
    // Clear selected files
    setSelectedFiles({})
    
    // Reset file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]')
    fileInputs.forEach((input) => {
      (input as HTMLInputElement).value = ''
    })
    
    // Reset form step
    setCurrentStep(1)
    
    // Reset the HTML form element (find by form id or just the form)
    setTimeout(() => {
      const formElement = document.querySelector('form') as HTMLFormElement
      if (formElement) {
        formElement.reset()
      }
    }, 100)
  }

  // Form validation
  const validateForm = (): string[] => {
    const errors: string[] = []

    // Step 1: Personal Information
    if (!formData.firstName?.trim()) errors.push('First name is required')
    if (!formData.lastName?.trim()) errors.push('Last name is required')
    if (!formData.email?.trim()) errors.push('Email is required')
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address')
    }
    if (!formData.phone?.trim()) errors.push('Phone number is required')
    if (!formData.address?.trim()) errors.push('Address is required')
    if (!formData.city?.trim()) errors.push('City is required')
    if (!formData.state?.trim()) errors.push('State is required')
    if (!formData.zipCode?.trim()) errors.push('Zip code is required')
    if (!formData.desiredPosition?.trim()) errors.push('Desired position is required')

    // Step 2: Education & Experience - basic validation
    if (!formData.yearsExperience?.trim()) errors.push('Years of experience is required')

    // Step 3: Licenses & Certifications - basic validation
    if (!formData.license?.trim()) errors.push('Professional license information is required')

    // Step 4: Document Upload - files are optional but noted

    // Step 5: Healthcare Compliance
    if (formData.hipaa_training === undefined || formData.hipaa_training === null) {
      errors.push('HIPAA training question must be answered')
    }
    if (!formData.hipaa_agreement) errors.push('HIPAA agreement must be accepted')
    if (formData.conflict_interest === undefined || formData.conflict_interest === null) {
      errors.push('Conflict of interest question must be answered')
    }
    if (formData.relationship_conflict === undefined || formData.relationship_conflict === null) {
      errors.push('Relationship conflict question must be answered')
    }
    if (formData.conviction_history === undefined || formData.conviction_history === null) {
      errors.push('Conviction history question must be answered')
    }
    if (formData.registry_history === undefined || formData.registry_history === null) {
      errors.push('Registry history question must be answered')
    }
    if (!formData.background_consent) errors.push('Background check consent is required')

    // Step 6: Health & Safety
    if (!formData.tb_test_status?.trim()) errors.push('TB test status is required')
    if (formData.infection_training === undefined || formData.infection_training === null) {
      errors.push('Infection prevention training question must be answered')
    }
    if (!formData.happ_agreement) errors.push('HAPP agreement must be accepted')
    if (!formData.physical_accommodation?.trim()) {
      errors.push('Physical accommodation question must be answered')
    }
    // If "Yes, with reasonable accommodation" is selected, details must be provided
    if (formData.physical_accommodation === 'accommodation' && !formData.physical_details?.trim()) {
      errors.push('Please describe the accommodations needed')
    }
    if (!formData.hep_b_vaccination?.trim()) errors.push('Hepatitis B vaccination status is required')
    if (!formData.flu_vaccination?.trim()) errors.push('Influenza vaccination status is required')

    // Step 7: References & Emergency Contact
    if (!formData.reference_1_name?.trim()) errors.push('At least one reference (Name) is required')
    if (!formData.reference_1_phone?.trim()) errors.push('At least one reference (Phone) is required')
    if (!formData.emergency_name?.trim()) errors.push('Emergency contact name is required')
    if (!formData.emergency_relationship?.trim()) errors.push('Emergency contact relationship is required')
    if (!formData.emergency_phone?.trim()) errors.push('Emergency contact phone is required')
    if (!formData.terms_agreed) errors.push('Terms and conditions must be accepted')
    if (!formData.employment_at_will) errors.push('Employment at will acknowledgment is required')
    if (!formData.drug_testing_consent) errors.push('Drug testing consent is required')

    return errors
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.warn('Form submission already in progress, ignoring duplicate submit')
      return
    }
    
    // Validate form before submission
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      const errorMessage = `Please fix the following errors:\n\n${validationErrors.join('\n')}`
      alert(errorMessage)
      // Navigate to the first step with errors
      if (validationErrors.some(err => err.includes('First name') || err.includes('Email') || err.includes('Phone'))) {
        setCurrentStep(1)
      } else if (validationErrors.some(err => err.includes('experience') || err.includes('education'))) {
        setCurrentStep(2)
      } else if (validationErrors.some(err => err.includes('license') || err.includes('certification'))) {
        setCurrentStep(3)
      } else if (validationErrors.some(err => err.includes('HIPAA') || err.includes('Conflict') || err.includes('Conviction'))) {
        setCurrentStep(5)
      } else if (validationErrors.some(err => err.includes('TB') || err.includes('Infection') || err.includes('Physical') || err.includes('vaccination'))) {
        setCurrentStep(6)
      } else if (validationErrors.some(err => err.includes('reference') || err.includes('Emergency') || err.includes('Terms'))) {
        setCurrentStep(7)
      }
      return
    }
    
    setIsSubmitting(true)

    try {
      const formDataToSubmit = new FormData(e.currentTarget)
      
      // First submit basic application data
      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formDataToSubmit,
      })

      const result = await response.json()

      if (result.success) {
        // Now submit detailed form data - use formData state instead of FormData
        // This ensures all controlled component values are included
        const formObject: any = {}
        
        // Helper to convert camelCase to snake_case, but preserve already snake_case keys
        const toSnakeCase = (str: string) => {
          // If already contains underscore, assume it's already snake_case
          if (str.includes('_')) {
            return str
          }
          // Otherwise convert camelCase to snake_case
          return str.replace(/([A-Z])/g, '_$1').toLowerCase()
        }
        
        // Convert formData state to snake_case keys and merge with FormData
        Object.entries(formData).forEach(([key, value]) => {
          const snakeKey = toSnakeCase(key)
          // Include all values except undefined and null
          // Include false booleans, 0 numbers, and empty strings (they might be defaults)
          if (value !== undefined && value !== null) {
            formObject[snakeKey] = value
          }
        })
        
        // Also merge any values from FormData that might not be in state
        for (let [key, value] of formDataToSubmit.entries()) {
          if (!formObject[key]) {
            // Convert string values to appropriate types
            // FormDataEntryValue can be string | File
            if (typeof value === 'string') {
              if (value === 'true') {
                formObject[key] = true
              } else if (value === 'false') {
                formObject[key] = false
              } else {
                formObject[key] = value
              }
            } else {
              // Skip File objects - they're handled separately
              formObject[key] = value
            }
          }
        }

        // Add job_application_id
        formObject.job_application_id = result.applicationId || result.id || 'temp-id'

        // Submit detailed form data
        const detailedResponse = await fetch('/api/applications/form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formObject),
        })

        const detailedResult = await detailedResponse.json()

        if (detailedResult.success) {
          // Upload all selected files
          const jobApplicationId = result.applicationId || result.id || result.application?.id
          const applicantId = result.applicant_id || result.application?.applicant_id
          
          if (jobApplicationId && applicantId && Object.keys(selectedFiles).length > 0) {
            console.log('Uploading documents:', Object.keys(selectedFiles).length, 'files')
            
            // Map document keys to document types
            const documentTypeMap: { [key: string]: string } = {
              'resume_cv': 'resume',
              'professional_license': 'license',
              'degree_diploma': 'certification',
              'cpr_certification': 'certification',
              'tb_test_results': 'certification',
              'drivers_license': 'other',
              'social_security_card': 'other',
              'car_insurance': 'other'
            }
            
            // Upload each file
            const uploadPromises = Object.entries(selectedFiles).map(async ([docKey, file]) => {
              try {
                const documentType = documentTypeMap[docKey] || 'other'
                
                // Create FormData for file upload
                const fileFormData = new FormData()
                fileFormData.append('file', file)
                fileFormData.append('applicant_id', applicantId)
                fileFormData.append('job_application_id', jobApplicationId)
                fileFormData.append('application_form_id', detailedResult.form_id || '')
                fileFormData.append('document_type', documentType)
                fileFormData.append('document_name', docKey.replace(/_/g, ' '))
                fileFormData.append('file_name', file.name)
                fileFormData.append('file_size', file.size.toString())

                const documentResponse = await fetch('/api/applications/documents/upload', {
                  method: 'POST',
                  body: fileFormData,
                })

                const documentResult = await documentResponse.json()
                
                if (!documentResult.success) {
                  console.error('Document upload failed:', docKey, documentResult.error)
                  return { success: false, docKey, error: documentResult.error }
                } else {
                  console.log('Document uploaded successfully:', docKey, file.name)
                  return { success: true, docKey, fileName: file.name }
                }
              } catch (error: any) {
                console.error('Error uploading document:', docKey, error)
                return { success: false, docKey, error: error.message }
              }
            })
            
            // Wait for all uploads to complete
            const uploadResults = await Promise.all(uploadPromises)
            const successfulUploads = uploadResults.filter(r => r.success).length
            const failedUploads = uploadResults.filter(r => !r.success)
            
            if (failedUploads.length > 0) {
              console.warn('Some documents failed to upload:', failedUploads)
              alert(`Application submitted successfully! ${successfulUploads} of ${uploadResults.length} documents uploaded. Some documents may need to be uploaded separately.`)
            } else {
              console.log('All documents uploaded successfully')
            }
          }
          
          // Data successfully saved to database - now clear the form
          alert(`Thank you for your application! Your confirmation number is: ${result.confirmationNumber || 'N/A'}. We will contact you within 2-3 business days.`)
          
          // Clear form fields after successful submission to prevent duplicate submission on refresh
          resetForm()
        } else {
          console.error('Detailed form submission failed:', detailedResult)
          alert('Application submitted but detailed form data failed to save. Please contact support.')
        }
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('There was an error submitting your application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Job Application</h1>
              <p className="text-gray-600">Apply for a position at IrishTriplets Healthcare</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} noValidate>
        {/* Progress Bar */}
        <div className="mb-8">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
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
              {currentStep === 4 && "Document Upload"}
              {currentStep === 5 && "Healthcare Compliance"}
              {currentStep === 6 && "Health & Safety Requirements"}
              {currentStep === 7 && "References & Contact"}
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
            <div className={`space-y-4 ${currentStep !== 1 ? 'hidden' : ''}`}>
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
                    <Select key="state" name="state" value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
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

            {/* Step 2: Position & Experience */}
            <div className={`space-y-4 ${currentStep !== 2 ? 'hidden' : ''}`}>
                <div>
                  <Label htmlFor="position">Position Applying For *</Label>
                  <Select key="desiredPosition" name="desiredPosition" value={formData.desiredPosition} onValueChange={(value) => handleInputChange('desiredPosition', value)}>
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
                  <Select key="yearsExperience" name="yearsExperience" value={formData.yearsExperience} onValueChange={(value) => handleInputChange('yearsExperience', value)}>
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

            {/* Step 3: Education & Certifications */}
            <div className={`space-y-6 ${currentStep !== 3 ? 'hidden' : ''}`}>
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
                        <Select key="licenseState" name="licenseState" value={formData.licenseState} onValueChange={(value) => handleInputChange('licenseState', value)}>
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
                          name="licenseExpiry"
                          type="date" 
                          value={formData.licenseExpiry}
                          onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpr">CPR Certification</Label>
                        <Select key="cpr" name="cpr" value={formData.cpr} onValueChange={(value) => handleInputChange('cpr', value)}>
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

            {/* Step 4: Document Upload */}
            <div className={`space-y-6 ${currentStep !== 4 ? 'hidden' : ''}`}>
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
                    const docKey = doc.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
                    const selectedFile = selectedFiles[docKey]
                    
                    return (
                      <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <h3 className="font-medium text-sm">
                            {doc.name} {doc.required && <span className="text-red-500">*</span>}
                          </h3>
                          <p className="text-xs text-gray-500 mb-3">{doc.description}</p>
                          {selectedFile ? (
                            <div className="space-y-2">
                              <div className="bg-gray-100 p-2 rounded flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-700 truncate mr-2">
                                  {selectedFile.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    removeSelectedFile(docKey)
                                  }}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                              <p className="text-xs text-blue-600">
                                File selected: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <input
                                id={`file-${docKey}`}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleFileChange(docKey, e)
                                }}
                                className="hidden"
                              />
                              <label htmlFor={`file-${docKey}`}>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    const fileInput = document.getElementById(`file-${docKey}`) as HTMLInputElement
                                    if (fileInput) {
                                      fileInput.click()
                                    }
                                  }}
                                  className="cursor-pointer"
                                >
                                  Choose File
                                </Button>
                              </label>
                            </div>
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

            {/* Step 5: Healthcare Compliance */}
            <div className={`space-y-6 ${currentStep !== 5 ? 'hidden' : ''}`}>
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
                      <RadioGroup name="hipaa_training" value={formData.hipaa_training ? 'true' : 'false'} onValueChange={(value) => handleInputChange('hipaa_training', value === 'true')} className="mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="hipaa-yes" />
                          <Label htmlFor="hipaa-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="hipaa-no" />
                          <Label htmlFor="hipaa-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="hipaa-cert">HIPAA Certification Details</Label>
                      <Textarea
                        id="hipaa-cert"
                        name="hipaa_details"
                        placeholder="Provide details about your HIPAA training (date, provider, certificate number if available)"
                        rows={3}
                        value={formData.hipaa_details}
                        onChange={(e) => handleInputChange('hipaa_details', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="hipaa-agreement" 
                        name="hipaa_agreement" 
                        checked={formData.hipaa_agreement}
                        onCheckedChange={(checked) => handleInputChange('hipaa_agreement', checked)}
                        required 
                      />
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
                      <RadioGroup 
                        name="conflict_interest" 
                        value={formData.conflict_interest ? 'true' : 'false'} 
                        onValueChange={(value) => handleInputChange('conflict_interest', value === 'true')} 
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="conflict-yes" />
                          <Label htmlFor="conflict-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="conflict-no" />
                          <Label htmlFor="conflict-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="conflict-details">If yes, please provide details</Label>
                      <Textarea
                        id="conflict-details"
                        name="conflict_details"
                        placeholder="Describe any potential conflicts of interest"
                        rows={3}
                        value={formData.conflict_details}
                        onChange={(e) => handleInputChange('conflict_details', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>
                        Are you related to or have personal relationships with any IrishTriplets employees, patients, or
                        board members? *
                      </Label>
                      <RadioGroup 
                        name="relationship_conflict" 
                        value={formData.relationship_conflict ? 'true' : 'false'} 
                        onValueChange={(value) => handleInputChange('relationship_conflict', value === 'true')} 
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="relationship-yes" />
                          <Label htmlFor="relationship-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="relationship-no" />
                          <Label htmlFor="relationship-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="relationship-details">If yes, please provide details</Label>
                      <Textarea
                        id="relationship-details"
                        name="relationship_details"
                        placeholder="Describe any relationships that could present conflicts"
                        rows={3}
                        value={formData.relationship_details}
                        onChange={(e) => handleInputChange('relationship_details', e.target.value)}
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
                      <RadioGroup 
                        name="conviction_history"
                        value={formData.conviction_history ? 'true' : 'false'} 
                        onValueChange={(value) => handleInputChange('conviction_history', value === 'true')}
                        className="mt-2"
                        required
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="conviction-yes" />
                          <Label htmlFor="conviction-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="conviction-no" />
                          <Label htmlFor="conviction-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="conviction-details">If yes, please provide details</Label>
                      <Textarea
                        id="conviction-details"
                        name="conviction_details"
                        placeholder="Provide details about any convictions, including dates and circumstances"
                        rows={3}
                        value={formData.conviction_details}
                        onChange={(e) => handleInputChange('conviction_details', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>
                        Have you ever been listed on any state abuse registry or had professional sanctions? *
                      </Label>
                      <RadioGroup 
                        name="registry_history" 
                        value={formData.registry_history ? 'true' : 'false'} 
                        onValueChange={(value) => handleInputChange('registry_history', value === 'true')} 
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="registry-yes" />
                          <Label htmlFor="registry-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="registry-no" />
                          <Label htmlFor="registry-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="background-consent" 
                        name="background_consent" 
                        checked={formData.background_consent}
                        onCheckedChange={(checked) => handleInputChange('background_consent', checked === true)} 
                        required 
                      />
                      <Label htmlFor="background-consent" className="text-sm">
                        I authorize IrishTriplets to conduct a comprehensive background check including criminal
                        history, employment verification, and professional references *
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

            {/* Step 6: Health & Safety Requirements */}
            <div className={`space-y-6 ${currentStep !== 6 ? 'hidden' : ''}`}>
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
                      <Select 
                        key="tb_test_status"
                        name="tb_test_status"
                        value={formData.tb_test_status}
                        onValueChange={(value) => handleInputChange('tb_test_status', value)}
                      >
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
                      <Input 
                        id="tb-date" 
                        name="tb_test_date" 
                        type="date" 
                        value={formData.tb_test_date}
                        onChange={(e) => handleInputChange('tb_test_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tb-details">Additional TB History Details</Label>
                      <Textarea
                        id="tb-details"
                        name="tb_history_details"
                        placeholder="Provide any additional information about TB testing or treatment history"
                        rows={3}
                        value={formData.tb_history_details}
                        onChange={(e) => handleInputChange('tb_history_details', e.target.value)}
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
                      <RadioGroup 
                        name="infection_training" 
                        value={formData.infection_training ? 'true' : 'false'} 
                        onValueChange={(value) => handleInputChange('infection_training', value === 'true')} 
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="infection-training-yes" />
                          <Label htmlFor="infection-training-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="infection-training-no" />
                          <Label htmlFor="infection-training-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="infection-training-details">Training Details</Label>
                      <Textarea
                        id="infection-training-details"
                        name="infection_details"
                        placeholder="Describe your infection prevention training (dates, provider, topics covered)"
                        rows={3}
                        value={formData.infection_details}
                        onChange={(e) => handleInputChange('infection_details', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="happ-agreement" 
                        name="happ_agreement" 
                        checked={formData.happ_agreement}
                        onCheckedChange={(checked) => handleInputChange('happ_agreement', checked === true)} 
                        required 
                      />
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
                      <RadioGroup 
                        name="physical_accommodation" 
                        value={formData.physical_accommodation || ''} 
                        onValueChange={(value) => handleInputChange('physical_accommodation', value)} 
                        className="mt-2"
                        required
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="physical-yes" />
                          <Label htmlFor="physical-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="accommodation" id="physical-accommodation" />
                          <Label htmlFor="physical-accommodation">Yes, with reasonable accommodation</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="physical-no" />
                          <Label htmlFor="physical-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {formData.physical_accommodation === 'accommodation' && (
                      <div>
                        <Label htmlFor="accommodation-details">If accommodation is needed, please describe *</Label>
                        <Textarea
                          id="accommodation-details"
                          name="physical_details"
                          placeholder="Describe any accommodations you may need to perform job duties"
                          rows={3}
                          value={formData.physical_details}
                          onChange={(e) => handleInputChange('physical_details', e.target.value)}
                          required={formData.physical_accommodation === 'accommodation'}
                        />
                      </div>
                    )}
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
                        <Select 
                          key="hep_b_vaccination"
                          name="hep_b_vaccination"
                          value={formData.hep_b_vaccination}
                          onValueChange={(value) => handleInputChange('hep_b_vaccination', value)}
                        >
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
                        <Select 
                          key="flu_vaccination"
                          name="flu_vaccination"
                          value={formData.flu_vaccination}
                          onValueChange={(value) => handleInputChange('flu_vaccination', value)}
                        >
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
                        name="immunization_details"
                        placeholder="Provide details about immunization status, exemptions, or medical contraindications"
                        rows={3}
                        value={formData.immunization_details}
                        onChange={(e) => handleInputChange('immunization_details', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

            {/* Step 7: References & Contact */}
            <div className={`space-y-6 ${currentStep !== 7 ? 'hidden' : ''}`}>
                <div>
                  <h3 className="text-lg font-medium mb-4">Professional References</h3>
                  <p className="text-sm text-gray-600 mb-4">Please provide at least 3 professional references</p>

                  {[1, 2, 3].map((refNum) => (
                    <div key={refNum} className="border rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-3">Reference {refNum}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`ref${refNum}Name`}>Full Name *</Label>
                          <Input 
                            id={`ref${refNum}Name`} 
                            name={`reference_${refNum}_name`} 
                            placeholder="Reference name" 
                            value={formData[`reference_${refNum}_name` as keyof typeof formData] as string || ''}
                            onChange={(e) => handleInputChange(`reference_${refNum}_name`, e.target.value)}
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor={`ref${refNum}Relationship`}>Relationship *</Label>
                          <Input 
                            id={`ref${refNum}Relationship`} 
                            name={`reference_${refNum}_relationship`} 
                            placeholder="e.g., Former Supervisor" 
                            value={formData[`reference_${refNum}_relationship` as keyof typeof formData] as string || ''}
                            onChange={(e) => handleInputChange(`reference_${refNum}_relationship`, e.target.value)}
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor={`ref${refNum}Company`}>Company/Organization *</Label>
                          <Input 
                            id={`ref${refNum}Company`} 
                            name={`reference_${refNum}_company`} 
                            placeholder="Company name" 
                            value={formData[`reference_${refNum}_company` as keyof typeof formData] as string || ''}
                            onChange={(e) => handleInputChange(`reference_${refNum}_company`, e.target.value)}
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor={`ref${refNum}Phone`}>Phone Number *</Label>
                          <Input 
                            id={`ref${refNum}Phone`} 
                            name={`reference_${refNum}_phone`} 
                            type="tel" 
                            placeholder="(248) 555-0123" 
                            value={formData[`reference_${refNum}_phone` as keyof typeof formData] as string || ''}
                            onChange={(e) => handleInputChange(`reference_${refNum}_phone`, e.target.value)}
                            required 
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor={`ref${refNum}Email`}>Email Address</Label>
                          <Input 
                            id={`ref${refNum}Email`} 
                            name={`reference_${refNum}_email`} 
                            type="email" 
                            placeholder="reference@email.com" 
                            value={formData[`reference_${refNum}_email` as keyof typeof formData] as string || ''}
                            onChange={(e) => handleInputChange(`reference_${refNum}_email`, e.target.value)}
                          />
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
                        <Input 
                          id="emergencyName" 
                          name="emergency_name" 
                          placeholder="Emergency contact name" 
                          value={formData.emergency_name}
                          onChange={(e) => handleInputChange('emergency_name', e.target.value)}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyRelationship">Relationship *</Label>
                        <Input 
                          id="emergencyRelationship" 
                          name="emergency_relationship" 
                          placeholder="e.g., Spouse, Parent" 
                          value={formData.emergency_relationship}
                          onChange={(e) => handleInputChange('emergency_relationship', e.target.value)}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyPhone">Phone Number *</Label>
                        <Input 
                          id="emergencyPhone" 
                          name="emergency_phone" 
                          type="tel" 
                          placeholder="(248) 555-0123" 
                          value={formData.emergency_phone}
                          onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyEmail">Email Address</Label>
                        <Input 
                          id="emergencyEmail" 
                          name="emergency_email" 
                          type="email" 
                          placeholder="emergency@email.com" 
                          value={formData.emergency_email}
                          onChange={(e) => handleInputChange('emergency_email', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="emergencyAddress">Address</Label>
                        <Input 
                          id="emergencyAddress" 
                          name="emergency_address" 
                          placeholder="Emergency contact address" 
                          value={formData.emergency_address}
                          onChange={(e) => handleInputChange('emergency_address', e.target.value)}
                        />
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
                    <Checkbox 
                      id="terms" 
                      name="terms_agreed" 
                      checked={formData.terms_agreed}
                      onCheckedChange={(checked) => handleInputChange('terms_agreed', checked)}
                      required 
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I certify that all information provided is true and complete to the best of my knowledge *
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="employment-at-will" 
                      name="employment_at_will" 
                      checked={formData.employment_at_will}
                      onCheckedChange={(checked) => handleInputChange('employment_at_will', checked)}
                      required 
                    />
                    <Label htmlFor="employment-at-will" className="text-sm">
                      I understand that employment with IrishTriplets is at-will and may be terminated by either party
                      at any time *
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="drug-testing" 
                      name="drug_testing_consent" 
                      checked={formData.drug_testing_consent}
                      onCheckedChange={(checked) => handleInputChange('drug_testing_consent', checked)}
                      required 
                    />
                    <Label htmlFor="drug-testing" className="text-sm">
                      I consent to pre-employment drug testing and random drug testing as required *
                    </Label>
                  </div>
                </div>
              </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault()
                  prevStep(e)
                }} 
                disabled={currentStep === 1} 
                className="bg-transparent"
              >
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault()
                    nextStep(e)
                  }}
                >
                  Next Step
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        </form>
      </main>
    </>
  )
}
