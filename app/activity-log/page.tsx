"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DatePicker } from "@/components/ui/date-picker" // Assuming a date picker component exists
import { Checkbox } from "@/components/ui/checkbox"
import { PlusCircle, Trash2, Loader2 } from "lucide-react"

const disciplineCodes = [
  { code: "010", label: "Nurse – LPN" },
  { code: "015", label: "Nurse – RN" },
  { code: "016", label: "IV Therapy" },
  { code: "017", label: "Lab Draw" },
  { code: "020", label: "PT" },
  { code: "030", label: "Speech Therapy" },
  { code: "040", label: "O.T" },
  { code: "050", label: "M.S.W" },
  { code: "060", label: "Home Health Aid" },
]

const visitCodes = [
  { code: "116", label: "Cancel Visit" },
  { code: "117", label: "In Hospital" },
  { code: "119", label: "Refused Care" },
  { code: "177", label: "Discharge Care" },
  { code: "188", label: "SOC/ROC/F/U" },
  { code: "189", label: "Eval Non-Admit" },
  { code: "198", label: "Supervisory Only" },
  { code: "199", label: "Sup. W/010" },
]

const payorCodes = [
  { code: "MC", label: "Medicare" },
  { code: "MA", label: "Medicaid" },
  { code: "PV", label: "Private" },
]

type ActivityEntry = {
  id: number
  patientName: string
  mrn: string
  city: string
  sun: { in: string; out: string; visitCode: string; payor: string }
  mon: { in: string; out: string; visitCode: string; payor: string }
  tue: { in: string; out: string; visitCode: string; payor: string }
  wed: { in: string; out: string; visitCode: string; payor: string }
  thu: { in: string; out: string; visitCode: string; payor: string }
  fri: { in: string; out: string; visitCode: string; payor: string }
  sat: { in: string; out: string; visitCode: string; payor: string }
}

export default function ActivityLogPage() {
  const [employeeName, setEmployeeName] = useState("Sarah Johnson (RN-2024-001)")
  const [weekEnding, setWeekEnding] = useState<Date | undefined>(new Date())
  const [activities, setActivities] = useState<ActivityEntry[]>([
    {
      id: 1,
      patientName: "",
      mrn: "",
      city: "",
      sun: { in: "", out: "", visitCode: "", payor: "" },
      mon: { in: "", out: "", visitCode: "", payor: "" },
      tue: { in: "", out: "", visitCode: "", payor: "" },
      wed: { in: "", out: "", visitCode: "", payor: "" },
      thu: { in: "", out: "", visitCode: "", payor: "" },
      fri: { in: "", out: "", visitCode: "", payor: "" },
      sat: { in: "", out: "", visitCode: "", payor: "" },
    },
  ])
  const [mileage, setMileage] = useState({ begin: "", end: "" })
  const [visitCount, setVisitCount] = useState({ newOpening: 0, continued: 0 })
  const [isCertified, setIsCertified] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalMileage = useMemo(() => {
    const begin = Number.parseFloat(mileage.begin) || 0
    const end = Number.parseFloat(mileage.end) || 0
    return end > begin ? end - begin : 0
  }, [mileage])

  const totalVisits = useMemo(() => visitCount.newOpening + visitCount.continued, [visitCount])

  const handleActivityChange = (index: number, field: keyof ActivityEntry, value: any) => {
    const newActivities = [...activities]
    ;(newActivities[index] as any)[field] = value
    setActivities(newActivities)
  }

  const handleDayChange = (
    activityIndex: number,
    day: keyof Omit<ActivityEntry, "id" | "patientName" | "mrn" | "city">,
    field: "in" | "out" | "visitCode" | "payor",
    value: string,
  ) => {
    const newActivities = [...activities]
    newActivities[activityIndex][day][field] = value
    setActivities(newActivities)
  }

  const addActivityRow = () => {
    setActivities([
      ...activities,
      {
        id: Date.now(),
        patientName: "",
        mrn: "",
        city: "",
        sun: { in: "", out: "", visitCode: "", payor: "" },
        mon: { in: "", out: "", visitCode: "", payor: "" },
        tue: { in: "", out: "", visitCode: "", payor: "" },
        wed: { in: "", out: "", visitCode: "", payor: "" },
        thu: { in: "", out: "", visitCode: "", payor: "" },
        fri: { in: "", out: "", visitCode: "", payor: "" },
        sat: { in: "", out: "", visitCode: "", payor: "" },
      },
    ])
  }

  const removeActivityRow = (index: number) => {
    const newActivities = activities.filter((_, i) => i !== index)
    setActivities(newActivities)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // In a real app, you would send this data to your backend
    // await fetch('/api/activity-log/submit', { method: 'POST', body: JSON.stringify({ ... }) })
    console.log({
      employeeName,
      weekEnding,
      activities,
      mileage: { ...mileage, total: totalMileage },
      visitCount: { ...visitCount, total: totalVisits },
    })
    setTimeout(() => {
      setIsSubmitting(false)
      alert("Activity log submitted successfully!")
    }, 2000)
  }

  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">COMPASSIONATE HOME HEALTH SERVICES</CardTitle>
            <p className="text-sm text-gray-600">PH: 248-681-1211 FAX: 248-681-2832</p>
            <h2 className="text-xl font-semibold mt-4">Weekly Activity Log</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="employeeName">Employee Name</Label>
              <Input id="employeeName" value={employeeName} readOnly className="bg-gray-100" />
            </div>
            <div>
              <Label htmlFor="weekEnding">Week Ending</Label>
              <DatePicker date={weekEnding} setDate={setWeekEnding} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Patient Name, MRN #, City</TableHead>
                  {days.map((day) => (
                    <TableHead key={day} className="text-center capitalize w-[200px]">
                      {day}
                    </TableHead>
                  ))}
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity, index) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <Input
                        placeholder="Patient Name"
                        value={activity.patientName}
                        onChange={(e) => handleActivityChange(index, "patientName", e.target.value)}
                        className="mb-1"
                      />
                      <Input
                        placeholder="Medical Record #"
                        value={activity.mrn}
                        onChange={(e) => handleActivityChange(index, "mrn", e.target.value)}
                        className="mb-1"
                      />
                      <Input
                        placeholder="City"
                        value={activity.city}
                        onChange={(e) => handleActivityChange(index, "city", e.target.value)}
                      />
                    </TableCell>
                    {days.map((day) => (
                      <TableCell key={day} className="align-top">
                        <div className="flex items-center space-x-1 mb-1">
                          <Input
                            type="time"
                            value={activity[day].in}
                            onChange={(e) => handleDayChange(index, day, "in", e.target.value)}
                            aria-label={`${day} in time`}
                          />
                          <Input
                            type="time"
                            value={activity[day].out}
                            onChange={(e) => handleDayChange(index, day, "out", e.target.value)}
                            aria-label={`${day} out time`}
                          />
                        </div>
                        <div className="flex items-center space-x-1">
                          <Select
                            value={activity[day].visitCode}
                            onValueChange={(value) => handleDayChange(index, day, "visitCode", value)}
                          >
                            <SelectTrigger aria-label={`${day} visit code`}>
                              <SelectValue placeholder="Visit" />
                            </SelectTrigger>
                            <SelectContent>
                              {visitCodes.map((vc) => (
                                <SelectItem key={vc.code} value={vc.code}>
                                  {vc.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={activity[day].payor}
                            onValueChange={(value) => handleDayChange(index, day, "payor", value)}
                          >
                            <SelectTrigger aria-label={`${day} payor code`}>
                              <SelectValue placeholder="Ins" />
                            </SelectTrigger>
                            <SelectContent>
                              {payorCodes.map((pc) => (
                                <SelectItem key={pc.code} value={pc.code}>
                                  {pc.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeActivityRow(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button variant="outline" size="sm" onClick={addActivityRow} className="mt-2 bg-transparent">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Patient
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 border-t pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visit Count</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="newOpening">New Opening</Label>
                  <Input
                    id="newOpening"
                    type="number"
                    className="w-20"
                    value={visitCount.newOpening}
                    onChange={(e) => setVisitCount({ ...visitCount, newOpening: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="continued">Continued Visit</Label>
                  <Input
                    id="continued"
                    type="number"
                    className="w-20"
                    value={visitCount.continued}
                    onChange={(e) => setVisitCount({ ...visitCount, continued: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center justify-between font-bold pt-2 border-t">
                  <span>Total Visits</span>
                  <span>{totalVisits}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mileage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mileageEnd">End</Label>
                  <Input
                    id="mileageEnd"
                    type="number"
                    className="w-28"
                    placeholder="e.g., 15234"
                    value={mileage.end}
                    onChange={(e) => setMileage({ ...mileage, end: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mileageBegin">Begin</Label>
                  <Input
                    id="mileageBegin"
                    type="number"
                    className="w-28"
                    placeholder="e.g., 15010"
                    value={mileage.begin}
                    onChange={(e) => setMileage({ ...mileage, begin: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between font-bold pt-2 border-t">
                  <span>Total Miles</span>
                  <span>{totalMileage}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Codes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="font-bold">Discipline:</p>
                <p>{disciplineCodes.map((d) => `${d.code}-${d.label}`).join(", ")}</p>
                <p className="font-bold mt-2">Payor:</p>
                <p>{payorCodes.map((p) => `${p.code}-${p.label}`).join(", ")}</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 border-t pt-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="certification"
                checked={isCertified}
                onCheckedChange={(checked) => setIsCertified(!!checked)}
              />
              <Label
                htmlFor="certification"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I certify that the above information is true & correct.
              </Label>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="font-medium">Employee Signature:</p>
                <p className="text-lg font-semibold text-gray-800">{isCertified ? employeeName : ""}</p>
              </div>
              <Button onClick={handleSubmit} disabled={!isCertified || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Activity Log
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
