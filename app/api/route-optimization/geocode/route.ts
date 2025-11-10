import { type NextRequest, NextResponse } from "next/server"
import { geocodeAddress } from "@/lib/geocoding"

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }
    
    const coordinates = await geocodeAddress(address)
    
    if (!coordinates) {
      return NextResponse.json({ error: "Could not geocode address" }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: coordinates
    })
  } catch (error: any) {
    console.error("Error geocoding address:", error)
    return NextResponse.json({ error: error.message || "Failed to geocode address" }, { status: 500 })
  }
}