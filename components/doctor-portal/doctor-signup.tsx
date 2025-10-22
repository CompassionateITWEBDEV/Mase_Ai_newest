"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function DoctorSignup() {
  const [npi, setNpi] = useState("")
  const [dea, setDea] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement signup logic here
    console.log("Signing up with:", { npi, dea, email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="npi">NPI</Label>
        <Input type="text" id="npi" value={npi} onChange={(e) => setNpi(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="dea">DEA</Label>
        <Input type="text" id="dea" value={dea} onChange={(e) => setDea(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit">Sign Up</Button>
    </form>
  )
}
