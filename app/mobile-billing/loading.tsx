"use client"

import { RefreshCw, Smartphone } from "lucide-react"

export default function MobileBillingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <Smartphone className="h-16 w-16 mx-auto text-blue-600" />
          <RefreshCw className="h-6 w-6 absolute -top-1 -right-1 animate-spin text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Loading Mobile Billing</h2>
          <p className="text-gray-600">Optimizing for your device...</p>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  )
}
