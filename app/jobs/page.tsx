"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, MapPin, Clock, DollarSign, Users, Star, Heart, Briefcase, Building2, ArrowRight, Eye, X } from "lucide-react"
import Link from "next/link"

interface JobPosting {
  id: string
  title: string
  description: string
  department: string
  job_type: string
  position_type: string
  experience_required: string
  education_required: string
  requirements: string
  benefits: string
  salary_min: number
  salary_max: number
  salary_type: string
  location_type: string
  city: string
  state: string
  zip_code: string
  status: string
  is_featured: boolean
  is_urgent: boolean
  views_count: number
  applications_count: number
  posted_date: string
  created_at: string
  employer?: {
    company_name: string
    city: string
    state: string
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [jobRatings, setJobRatings] = useState<Record<string, number>>({})
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Handle job details modal
  const handleJobDetails = (job: any) => {
    setSelectedJob(job)
    setIsDetailsOpen(true)
  }

  // Load job ratings
  const loadJobRatings = async (jobIds: string[]) => {
    try {
      const response = await fetch(`/api/jobs/ratings?job_ids=${jobIds.join(',')}`)
      const data = await response.json()

      if (data.success && data.ratings) {
        setJobRatings(data.ratings)
        console.log('✅ Loaded job ratings:', data.ratings)
        console.log(`📊 Ratings loaded for ${Object.keys(data.ratings).length} jobs`)
      } else {
        console.log('⚠️ No ratings data received, using default ratings')
      }
    } catch (error) {
      console.error('Error loading job ratings:', error)
    }
  }

  // Load jobs from database
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setIsLoadingJobs(true)
        const response = await fetch('/api/jobs/list?status=active&limit=100')
        const data = await response.json()

        if (data.success && data.jobs) {
          setJobs(data.jobs)
          console.log(`Loaded ${data.jobs.length} jobs from database`)
          // Track views for all loaded jobs (anonymous views)
          trackJobViews(data.jobs)
          // Load ratings for all jobs
          const jobIds = data.jobs.map((job: JobPosting) => job.id)
          loadJobRatings(jobIds)
        }
      } catch (error) {
        console.error('Error loading jobs:', error)
      } finally {
        setIsLoadingJobs(false)
      }
    }

    loadJobs()
  }, [])

  // Track job views (anonymous)
  const trackJobViews = async (jobs: any[]) => {
    try {
      // Track views for all jobs in parallel
      const viewPromises = jobs.map(job => 
        fetch('/api/jobs/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_posting_id: job.id,
            user_type: 'anonymous',
            user_id: null
          })
        }).catch(error => {
          console.error('Error tracking view for job:', job.id, error)
          return null
        })
      )

      await Promise.all(viewPromises)
    } catch (error) {
      console.error('Error tracking job views:', error)
    }
  }

  // Transform jobs to match the expected format for the UI
  // Featured jobs = jobs with high applicant rates (top 25% by application count)
  const sortedJobsByApplications = [...jobs].sort((a, b) => (b.applications_count || 0) - (a.applications_count || 0))
  const top25Percent = Math.max(1, Math.ceil(sortedJobsByApplications.length * 0.25))
  const featuredJobs = sortedJobsByApplications.slice(0, top25Percent).map(job => ({
    id: job.id,
    title: job.title,
    company: job.employer?.company_name || 'Healthcare Facility',
    location: `${job.city}, ${job.state}`,
    type: job.job_type,
    department: job.department,
    salary: `$${job.salary_min || 0}-${job.salary_max || 0}/${job.salary_type}`,
    description: job.description,
    requirements: job.requirements ? job.requirements.split(',').map(r => r.trim()).filter(r => r) : ['No specific requirements'],
    benefits: job.benefits ? job.benefits.split(',').map(b => b.trim()).filter(b => b) : ['Competitive benefits'],
    posted: new Date(job.posted_date).toLocaleDateString(),
    applications: job.applications_count || 0,
    featured: job.is_featured,
    urgent: job.is_urgent,
    companyRating: jobRatings[job.id] || 3.0, // Use actual rating from saved jobs data
    companyLogo: "/placeholder.svg?height=60&width=60&text=" + (job.employer?.company_name?.substring(0, 2) || 'HC'),
  }))

  const allJobsData = jobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.employer?.company_name || 'Healthcare Facility',
    location: `${job.city}, ${job.state}`,
    type: job.job_type,
    department: job.department,
    salary: `$${job.salary_min || 0}-${job.salary_max || 0}/${job.salary_type}`,
    description: job.description,
    requirements: job.requirements ? job.requirements.split(',').map(r => r.trim()).filter(r => r) : ['No specific requirements'],
    benefits: job.benefits ? job.benefits.split(',').map(b => b.trim()).filter(b => b) : ['Competitive benefits'],
    posted: new Date(job.posted_date).toLocaleDateString(),
    applications: job.applications_count || 0,
    featured: job.is_featured,
    urgent: job.is_urgent,
    companyRating: jobRatings[job.id] || 3.0, // Use actual rating from saved jobs data
    companyLogo: "/placeholder.svg?height=60&width=60&text=" + (job.employer?.company_name?.substring(0, 2) || 'HC'),
  }))

  // Combine featured and all jobs for filtering
  // Remove featured jobs from allJobsData to avoid duplication
  const featuredJobIds = new Set(featuredJobs.map(job => job.id))
  const nonFeaturedJobs = allJobsData.filter(job => !featuredJobIds.has(job.id))
  const allJobsForFiltering = [...featuredJobs, ...nonFeaturedJobs]

  // Get unique locations and types from jobs data for filters
  const uniqueLocations = Array.from(new Set(jobs.map(job => `${job.city}, ${job.state}`))).sort()
  const uniqueTypes = Array.from(new Set(jobs.map(job => job.job_type))).sort()
  const uniqueDepartments = Array.from(new Set(jobs.map(job => job.department))).sort()

  const filteredJobs = allJobsForFiltering.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = locationFilter === "all" || job.location === locationFilter
    const matchesType = typeFilter === "all" || job.type === typeFilter
    const matchesDepartment = departmentFilter === "all" || job.department === departmentFilter

    return matchesSearch && matchesLocation && matchesType && matchesDepartment
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">IrishTriplets</h1>
              </Link>
              <div className="hidden md:block">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Job Board
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/register">
                <Button variant="outline">Create Account</Button>
              </Link>
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Next Healthcare Career</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover opportunities with top healthcare facilities across Florida. Join our network of dedicated
            professionals making a difference in patient care.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{allJobsForFiltering.length}+</div>
              <div className="text-gray-600">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">50+</div>
              <div className="text-gray-600">Healthcare Facilities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">98%</div>
              <div className="text-gray-600">Placement Success</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center mt-4">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600">{filteredJobs.length} jobs found</div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoadingJobs && (
          <div className="mb-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading job opportunities...</p>
            </div>
          </div>
        )}

        {/* Featured Jobs - High Applicant Rate Jobs */}
        {!isLoadingJobs && featuredJobs.some((job) => filteredJobs.includes(job)) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Star className="h-6 w-6 text-yellow-500 mr-2" />
              Featured Opportunities (High Applicant Rate)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredJobs
                .filter((job) => filteredJobs.includes(job))
                .map((job) => (
                  <Card
                    key={job.id}
                    className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Building2 className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                            <CardDescription className="flex items-center space-x-2">
                              <span>{job.company}</span>
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                                <span className="text-xs font-medium">{job.companyRating}</span>
                                <span className="text-xs text-gray-500 ml-1">★</span>
                              </div>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className="bg-green-100 text-green-800">High Demand</Badge>
                          {job.urgent && <Badge variant="destructive">Urgent</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-gray-700">{job.description}</p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {job.location}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {job.type}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="h-4 w-4 mr-2" />
                            {job.salary}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            {job.applications} applicants
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <h4 className="font-medium text-sm mb-1">Requirements:</h4>
                            <div className="flex flex-wrap gap-1">
                              {job.requirements.slice(0, 3).map((req) => (
                                <Badge key={req} variant="secondary" className="text-xs">
                                  {req}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-1">Benefits:</h4>
                            <div className="flex flex-wrap gap-1">
                              {job.benefits.slice(0, 3).map((benefit) => (
                                <Badge key={benefit} variant="outline" className="text-xs">
                                  {benefit}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Posted {job.posted}</span>
                            <div className="flex items-center text-green-600 font-semibold">
                              <Users className="h-4 w-4 mr-1" />
                              {job.applications} applicants
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleJobDetails(job)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                            <Link href="/register">
                              <Button size="sm">
                                Apply Now
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* All Jobs */}
        {!isLoadingJobs && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Opportunities</h2>
            <div className="space-y-4">
              {filteredJobs
                .filter((job) => !job.featured)
                .map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            {job.urgent && (
                              <Badge variant="destructive" className="text-xs">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-gray-600">{job.company}</span>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium text-gray-600">{job.companyRating}</span>
                              <span className="text-xs text-gray-500 ml-1">★</span>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{job.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {job.type}
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {job.salary}
                            </div>
                            <div className="flex items-center">
                              <Briefcase className="h-4 w-4 mr-1" />
                              {job.department}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {job.requirements.slice(0, 4).map((req) => (
                              <Badge key={req} variant="secondary" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">{job.applications} applicants</div>
                          <div className="text-sm text-gray-600">Posted {job.posted}</div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleJobDetails(job)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Link href="/register">
                            <Button size="sm">
                              Apply
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-blue-500 to-green-500 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Your Healthcare Career?</h2>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of healthcare professionals who have found their perfect job through IrishTriplets.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Create Your Profile
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Job Details Modal */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                <span>{selectedJob?.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
              <DialogDescription className="text-lg">
                {selectedJob?.company} • {selectedJob?.location}
              </DialogDescription>
            </DialogHeader>
            
            {selectedJob && (
              <div className="space-y-6">
                {/* Job Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{selectedJob.location}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{selectedJob.type}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>{selectedJob.salary}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2" />
                      <span>{selectedJob.department}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{selectedJob.applications} applicants</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Star className="h-4 w-4 mr-2 text-yellow-400 fill-current" />
                      <span>Company Rating: {selectedJob.companyRating}/5</span>
                    </div>
                    <div className="text-gray-600">
                      <span>Posted: {selectedJob.posted}</span>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
                </div>

                {/* Requirements */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.requirements.map((req: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Benefits</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.benefits.map((benefit: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                  >
                    Close
                  </Button>
                  <Link href="/register">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Apply Now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
