// Simple test script to verify job ratings API
const testJobRatings = async () => {
  try {
    // First, get some job IDs from the jobs API
    const jobsResponse = await fetch('http://localhost:3000/api/jobs/list?status=active&limit=5')
    const jobsData = await jobsResponse.json()
    
    if (jobsData.success && jobsData.jobs.length > 0) {
      const jobIds = jobsData.jobs.map(job => job.id)
      console.log('Testing with job IDs:', jobIds)
      
      // Test the ratings API
      const ratingsResponse = await fetch(`http://localhost:3000/api/jobs/ratings?job_ids=${jobIds.join(',')}`)
      const ratingsData = await ratingsResponse.json()
      
      console.log('Ratings API Response:', ratingsData)
      
      if (ratingsData.success) {
        console.log('✅ Job ratings API is working!')
        console.log('Ratings:', ratingsData.ratings)
      } else {
        console.log('❌ Job ratings API failed:', ratingsData.error)
      }
    } else {
      console.log('No jobs found to test with')
    }
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testJobRatings()
