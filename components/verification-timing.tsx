'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle } from 'lucide-react'

interface VerificationTimingProps {
  status: 'pending' | 'verified' | 'rejected'
  uploadedAt: string
  verifiedAt?: string
}

export default function VerificationTiming({ 
  status, 
  uploadedAt, 
  verifiedAt 
}: VerificationTimingProps) {
  const [elapsedTime, setElapsedTime] = useState('')

  useEffect(() => {
    const updateElapsedTime = () => {
      const uploadTime = new Date(uploadedAt).getTime()
      const currentTime = new Date().getTime()
      const elapsed = currentTime - uploadTime
      
      const minutes = Math.floor(elapsed / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      
      if (minutes > 0) {
        setElapsedTime(`${minutes}m ${seconds}s`)
      } else {
        setElapsedTime(`${seconds}s`)
      }
    }

    updateElapsedTime()
    const interval = setInterval(updateElapsedTime, 1000)

    return () => clearInterval(interval)
  }, [uploadedAt])

  const getStatusIcon = () => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'verified':
        return 'Verified'
      case 'rejected':
        return 'Rejected'
      case 'pending':
      default:
        return 'Under Review'
    }
  }

  const getTimingText = () => {
    if (status === 'verified' || status === 'rejected') {
      if (verifiedAt) {
        const uploadTime = new Date(uploadedAt).getTime()
        const verifyTime = new Date(verifiedAt).getTime()
        const totalTime = verifyTime - uploadTime
        const minutes = Math.floor(totalTime / 60000)
        const seconds = Math.floor((totalTime % 60000) / 1000)
        
        if (minutes > 0) {
          return `Completed in ${minutes}m ${seconds}s`
        } else {
          return `Completed in ${seconds}s`
        }
      }
      return 'Completed'
    } else {
      return `Reviewing for ${elapsedTime}`
    }
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {getStatusIcon()}
      <span className="font-medium">{getStatusText()}</span>
      <span className="text-gray-500">•</span>
      <span className="text-gray-600">{getTimingText()}</span>
    </div>
  )
}
