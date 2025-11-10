import { supabase } from "@/lib/supabase-client"

// Replace with your Google Maps API key
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

// Geocoding function using Google Maps API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || !GOOGLE_MAPS_API_KEY) return null
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    )
    const data = await response.json()
    
    if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location
    }
    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}

export { geocodeAddress }