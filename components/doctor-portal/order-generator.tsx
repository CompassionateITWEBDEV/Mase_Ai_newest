"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function OrderGenerator() {
  const [orderType, setOrderType] = useState("prescription")
  const [orderDetails, setOrderDetails] = useState("")

  const handleGenerateOrder = () => {
    // Implement order generation logic here
    console.log("Generating order:", { orderType, orderDetails })
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">Order Generator</h3>
      <div className="space-y-2">
        <Label htmlFor="order-type">Order Type</Label>
        <select
          id="order-type"
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="prescription">Prescription</option>
          <option value="dme">DME</option>
          <option value="lab">Lab</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="order-details">Order Details</Label>
        <Input
          type="text"
          id="order-details"
          value={orderDetails}
          onChange={(e) => setOrderDetails(e.target.value)}
          placeholder="Enter order details"
        />
      </div>
      <Button onClick={handleGenerateOrder}>Generate Order</Button>
    </div>
  )
}
