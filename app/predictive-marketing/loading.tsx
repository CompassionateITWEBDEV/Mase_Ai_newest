"use client"

import { BrainCircuit } from "lucide-react"

export default function PredictiveMarketingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <BrainCircuit className="h-8 w-8 text-white animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Predictive Marketing Intelligence</h2>
        <p className="text-gray-600 mb-4">Analyzing admission patterns and optimizing routes...</p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
        </div>
      </div>
    </div>
  )
}
