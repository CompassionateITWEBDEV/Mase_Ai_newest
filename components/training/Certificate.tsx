"use client"

import { useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Share2, Award, CheckCircle, Star } from "lucide-react"

interface CertificateProps {
  staffName: string
  trainingTitle: string
  completionDate: string
  ceuHours?: number
  score?: number
  certificateId: string
  organizationName?: string
}

export function Certificate({
  staffName,
  trainingTitle,
  completionDate,
  ceuHours,
  score,
  certificateId,
  organizationName = "M.A.S.E Healthcare",
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (certificateRef.current) {
      // Import html2canvas dynamically
      const html2canvas = (await import("html2canvas")).default
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `${trainingTitle.replace(/[^a-z0-9]/gi, "_")}_Certificate_${certificateId}.png`
          link.click()
          URL.revokeObjectURL(url)
        }
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      {/* Certificate Preview */}
      <div
        ref={certificateRef}
        className="bg-white p-12 rounded-lg shadow-2xl border-8 border-double border-blue-600 relative overflow-hidden print:border-blue-600"
        style={{ minHeight: "600px" }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1" fill="#3B82F6" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-6">
          {/* Header */}
          <div className="border-b-4 border-blue-600 pb-6 mb-6">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Award className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2" style={{ fontFamily: "serif" }}>
              Certificate of Completion
            </h1>
            <p className="text-lg text-gray-600">{organizationName}</p>
          </div>

          {/* Body */}
          <div className="space-y-6 py-6">
            <p className="text-lg text-gray-700">This is to certify that</p>
            
            <div className="py-4 px-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
              <h2 className="text-4xl font-bold text-blue-900" style={{ fontFamily: "serif" }}>
                {staffName}
              </h2>
            </div>

            <p className="text-lg text-gray-700">has successfully completed the training course</p>

            <div className="py-4 px-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
              <h3 className="text-2xl font-bold text-green-900">
                {trainingTitle}
              </h3>
            </div>

            <div className="flex justify-center gap-8 pt-4">
              {ceuHours && (
                <div className="text-center">
                  <Badge className="bg-purple-600 text-white px-4 py-2 text-base">
                    <Award className="h-4 w-4 mr-2 inline" />
                    {ceuHours} CEU Hours
                  </Badge>
                </div>
              )}
              {score !== undefined && (
                <div className="text-center">
                  <Badge className="bg-green-600 text-white px-4 py-2 text-base">
                    <Star className="h-4 w-4 mr-2 inline" />
                    Score: {score}%
                  </Badge>
                </div>
              )}
            </div>

            <div className="pt-6">
              <p className="text-gray-600">Completed on</p>
              <p className="text-xl font-semibold text-gray-900">
                {new Date(completionDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-4 border-blue-600 pt-8 mt-8">
            <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="border-t-2 border-gray-400 pt-2">
                <p className="text-sm font-semibold text-gray-900">Authorized Signature</p>
                <p className="text-xs text-gray-600 mt-1">Training Administrator</p>
              </div>
              <div className="border-t-2 border-gray-400 pt-2">
                <p className="text-sm font-semibold text-gray-900">Date Issued</p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(completionDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs text-gray-500">Certificate ID: {certificateId}</p>
              <div className="flex items-center justify-center mt-2">
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                <p className="text-xs text-green-700 font-semibold">Verified Completion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-blue-600"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-blue-600"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-blue-600"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-blue-600"></div>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button onClick={handleDownload} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-5 w-5 mr-2" />
              Download Certificate
            </Button>
            <Button onClick={handlePrint} size="lg" variant="outline">
              <Download className="h-5 w-5 mr-2" />
              Print Certificate
            </Button>
            <Button size="lg" variant="outline">
              <Share2 className="h-5 w-5 mr-2" />
              Share on LinkedIn
            </Button>
          </div>
          <p className="text-center text-sm text-gray-600 mt-4">
            Your certificate has been saved to your profile and can be accessed anytime.
          </p>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:border-blue-600,
          .print\\:border-blue-600 * {
            visibility: visible;
          }
          .print\\:border-blue-600 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            page-break-after: avoid;
          }
        }
      `}</style>
    </div>
  )
}

