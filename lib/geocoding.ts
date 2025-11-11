// Free OpenStreetMap Nominatim Geocoding (No API key required!)
// Rate limit: 1 request per second (we'll add delay if needed)

// AI-Powered Address Validation: Detects fake/invalid addresses
function isValidAddressFormat(address: string): boolean {
  if (!address || address.trim().length < 5) return false
  
  const trimmed = address.trim().toLowerCase()
  
  // Reject obvious fake addresses (repeated characters, nonsense words)
  const fakePatterns = [
    /^(.)\1{4,}$/, // Repeated single character (aaaaa, 11111)
    /^(asd|dasd|test|fake|dummy|sample|example|xxx|aaa|111|123)[\s\w]*$/i, // Common fake patterns
    /^[a-z]{1,3}$/, // Too short (1-3 letters only)
    /^\d+$/, // Numbers only
  ]
  
  // Check for short alphanumeric nonsense separately
  if (/^[a-z]+\d+[a-z]+$/i.test(trimmed) && trimmed.length < 8) {
    console.warn(`❌ Rejected short alphanumeric nonsense: "${address}"`)
    return false
  }
  
  for (const pattern of fakePatterns) {
    if (pattern.test(trimmed)) {
      console.warn(`❌ Rejected fake address pattern: "${address}"`)
      return false
    }
  }
  
  // Must contain at least one number (street number) or be a recognizable place name
  const hasNumber = /\d/.test(address)
  const hasStreetWords = /\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|place|pl)\b/i.test(address)
  const hasCityWords = /\b(city|town|village|barangay|municipality)\b/i.test(address)
  
  // Valid address should have: number + street, OR recognizable place name
  if (!hasNumber && !hasStreetWords && !hasCityWords && trimmed.length < 10) {
    console.warn(`❌ Address too vague or missing street info: "${address}"`)
    return false
  }
  
  return true
}

// Geocoding function using OpenStreetMap Nominatim (FREE, no API key needed)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; validated: boolean } | null> {
  if (!address || address.trim().length === 0) {
    console.warn('❌ Empty address provided')
    return null
  }
  
  // First, validate address format (AI detection of fake addresses)
  if (!isValidAddressFormat(address)) {
    console.warn(`❌ Address failed format validation: "${address}"`)
    return null
  }
  
  try {
    // Use OpenStreetMap Nominatim - completely free, no API key needed
    // Format: address, city, state, country for best results
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'MASE-AI-Intelligence/1.0' // Required by Nominatim
        }
      }
    )

    if (!response.ok) {
      console.error(`❌ Geocoding failed: HTTP ${response.status}`)
      return null
    }

    const data = await response.json()
    
    if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
      const result = data[0]
      const importance = result.importance || 0
      
      // Check if result has good confidence (importance > 0.3 for real addresses)
      if (importance < 0.3) {
        console.warn(`⚠️ Low confidence geocoding result for "${address}" (importance: ${importance})`)
      }
      
      console.log(`✅ Address validated: "${address}" -> "${result.display_name}" at ${result.lat}, ${result.lon} (importance: ${importance})`)
      
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        validated: true
      }
    } else {
      console.warn(`❌ Address not found in OpenStreetMap: "${address}" - This is NOT a real address`)
      return null
    }
  } catch (error) {
    console.error("❌ Geocoding error:", error)
    return null
  }
}

// Reverse Geocoding: Convert GPS coordinates to actual address
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'MASE-AI-Intelligence/1.0' // Required by Nominatim
        }
      }
    )

    if (!response.ok) {
      console.error(`❌ Reverse geocoding failed: HTTP ${response.status}`)
      return null
    }

    const data = await response.json()
    
    if (data?.display_name) {
      console.log(`✅ Reverse geocoded: ${lat}, ${lng} -> "${data.display_name}"`)
      return data.display_name
    }
    
    return null
  } catch (error) {
    console.error("❌ Reverse geocoding error:", error)
    return null
  }
}

export { geocodeAddress, isValidAddressFormat, reverseGeocode }