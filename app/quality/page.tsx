"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { useRouter } from "next/navigation"

const QualityPage = () => {
  const router = useRouter()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">Quality Assurance</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Comprehensive Chart QA Card */}
        <Card>
          <CardHeader>
            <CardTitle>Comprehensive Chart QA</CardTitle>
            <CardDescription>Complete patient chart quality assurance review - beyond OASIS</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <FileText className="h-10 w-10" />
            <Button onClick={() => router.push("/comprehensive-qa")}>Go to Comprehensive QA</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default QualityPage
