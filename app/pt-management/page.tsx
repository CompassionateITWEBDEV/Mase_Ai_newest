"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Dumbbell, Plus, User, Calendar, Trash2, Upload, Sparkles, Loader2, Edit, AlertCircle } from "lucide-react"

export default function PTManagement() {
  const [patients, setPatients] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [therapistId, setTherapistId] = useState<string>("")
  const [uploadingVideo, setUploadingVideo] = useState<number | null>(null)
  const [generatingAI, setGeneratingAI] = useState<number | null>(null)
  const [editingProgram, setEditingProgram] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null)
  const { toast } = useToast()

  const [programForm, setProgramForm] = useState({
    patientId: "",
    programName: "",
    totalWeeks: 8,
    totalSessions: 24,
    nextSessionDate: "",
    notes: "",
    exercises: [
      {
        name: "",
        description: "",
        duration: "",
        repetitions: "",
        sets: 3,
        difficulty: "Moderate",
        videoUrl: "",
        aiTips: ""
      }
    ],
    weeklyGoals: ["Complete 3 exercise sessions", "Practice daily", "Log progress"]
  })

  // Load therapist from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setTherapistId(user.id)
      loadPrograms(user.id)
    }
  }, [])

  // Load patients
  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error('Error loading patients:', error)
    }
  }

  const loadPrograms = async (therapistId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/staff/pt-exercises?therapistId=${therapistId}`)
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
      }
    } catch (error) {
      console.error('Error loading programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProgram = async () => {
    if (!programForm.patientId || !programForm.programName) {
      toast({
        title: "Missing Information",
        description: "Please select a patient and enter a program name",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/staff/pt-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: programForm.patientId,
          therapistId: therapistId,
          programName: programForm.programName,
          totalWeeks: programForm.totalWeeks,
          totalSessions: programForm.totalSessions,
          nextSessionDate: programForm.nextSessionDate || null,
          notes: programForm.notes,
          exercises: programForm.exercises.filter(ex => ex.name && ex.description),
          weeklyGoals: programForm.weeklyGoals.filter(g => g.trim())
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create program')
      }

      toast({
        title: "Success! 🎉",
        description: "Exercise program created successfully"
      })

      setShowCreateDialog(false)
      loadPrograms(therapistId)
      
      // Reset form
      setProgramForm({
        patientId: "",
        programName: "",
        totalWeeks: 8,
        totalSessions: 24,
        nextSessionDate: "",
        notes: "",
        exercises: [{ name: "", description: "", duration: "", repetitions: "", sets: 3, difficulty: "Moderate", videoUrl: "", aiTips: "" }],
        weeklyGoals: ["Complete 3 exercise sessions", "Practice daily", "Log progress"]
      })
    } catch (error) {
      console.error('Error creating program:', error)
      toast({
        title: "Error",
        description: "Failed to create exercise program",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addExercise = () => {
    setProgramForm(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        name: "",
        description: "",
        duration: "",
        repetitions: "",
        sets: 3,
        difficulty: "Moderate",
        videoUrl: "",
        aiTips: ""
      }]
    }))
  }

  const removeExercise = (index: number) => {
    setProgramForm(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }))
  }

  const updateExercise = (index: number, field: string, value: any) => {
    setProgramForm(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }))
  }

  // Upload video function
  const handleVideoUpload = async (index: number, file: File) => {
    if (!file) return

    try {
      setUploadingVideo(index)
      
      const formData = new FormData()
      formData.append('video', file)
      formData.append('exerciseName', programForm.exercises[index].name || 'exercise')

      const response = await fetch('/api/staff/pt-exercises/upload-video', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      
      // Update exercise with video URL
      updateExercise(index, 'videoUrl', data.videoUrl)
      
      toast({
        title: "Video Uploaded! 🎥",
        description: `${file.name} uploaded successfully`,
      })
    } catch (error: any) {
      console.error('Video upload error:', error)
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload video",
        variant: "destructive"
      })
    } finally {
      setUploadingVideo(null)
    }
  }

  // Generate AI tips function
  const generateAITips = async (index: number) => {
    const exercise = programForm.exercises[index]
    
    if (!exercise.name) {
      toast({
        title: "Exercise Name Required",
        description: "Please enter the exercise name first",
        variant: "destructive"
      })
      return
    }

    try {
      setGeneratingAI(index)
      
      const response = await fetch('/api/staff/pt-exercises/generate-ai-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName: exercise.name,
          description: exercise.description,
          difficulty: exercise.difficulty,
          repetitions: exercise.repetitions,
          sets: exercise.sets
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'AI generation failed')
      }

      const data = await response.json()
      
      // Update exercise with AI tips
      updateExercise(index, 'aiTips', data.aiTips)
      
      toast({
        title: "AI Tips Generated! ✨",
        description: "Coaching tips created by AI",
      })
    } catch (error: any) {
      console.error('AI generation error:', error)
      toast({
        title: "AI Generation Failed",
        description: error.message || "Could not generate AI tips",
        variant: "destructive"
      })
    } finally {
      setGeneratingAI(null)
    }
  }

  // Edit program function
  const startEditProgram = async (programId: string) => {
    try {
      setLoading(true)
      
      // Fetch full program details with exercises
      const response = await fetch(`/api/staff/pt-exercises/${programId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load program details')
      }
      
      const data = await response.json()
      
      // Populate form with existing data
      setProgramForm({
        patientId: data.program.patient_id,
        programName: data.program.program_name,
        totalWeeks: data.program.total_weeks,
        totalSessions: data.program.total_sessions,
        nextSessionDate: data.program.next_session_date || "",
        notes: data.program.notes || "",
        exercises: data.exercises.map((ex: any) => ({
          id: ex.id,
          name: ex.name,
          description: ex.description || "",
          duration: ex.duration || "",
          repetitions: ex.repetitions || "",
          sets: ex.sets || 3,
          difficulty: ex.difficulty || "Moderate",
          videoUrl: ex.video_url || "",
          aiTips: ex.ai_tips || ""
        })),
        weeklyGoals: data.goals?.map((g: any) => g.goal_text) || []
      })
      
      setEditingProgram(data.program)
      setShowEditDialog(true)
      
    } catch (error: any) {
      console.error('Error loading program:', error)
      toast({
        title: "Error",
        description: "Could not load program details: " + error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Update program function
  const updateProgram = async () => {
    if (!editingProgram) return
    
    try {
      setLoading(true)
      
      // Clean exercises data (remove id field if exists)
      const cleanExercises = programForm.exercises.map(ex => ({
        name: ex.name,
        description: ex.description,
        duration: ex.duration,
        repetitions: ex.repetitions,
        sets: ex.sets,
        difficulty: ex.difficulty,
        videoUrl: ex.videoUrl,
        aiTips: ex.aiTips
      }))

      const response = await fetch(`/api/staff/pt-exercises/${editingProgram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programName: programForm.programName,
          totalWeeks: programForm.totalWeeks,
          totalSessions: programForm.totalSessions,
          nextSessionDate: programForm.nextSessionDate,
          notes: programForm.notes,
          exercises: cleanExercises,
          weeklyGoals: programForm.weeklyGoals
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Update API error:', error)
        throw new Error(error.error || 'Update failed')
      }
      
      const result = await response.json()
      console.log('Update successful:', result)
      
      toast({
        title: "Program Updated! ✅",
        description: "Exercise program has been updated successfully"
      })
      
      setShowEditDialog(false)
      setEditingProgram(null)
      
      // Reset form
      setProgramForm({
        patientId: "",
        programName: "",
        totalWeeks: 8,
        totalSessions: 24,
        nextSessionDate: "",
        notes: "",
        exercises: [{
          name: "",
          description: "",
          duration: "",
          repetitions: "",
          sets: 3,
          difficulty: "Moderate",
          videoUrl: "",
          aiTips: ""
        }],
        weeklyGoals: ["Complete 3 exercise sessions", "Practice daily", "Log progress"]
      })
      
      // Reload programs
      if (therapistId) {
        await loadPrograms(therapistId)
      }
      
    } catch (error: any) {
      console.error('Update error:', error)
      toast({
        title: "Update Failed",
        description: error.message || "Could not update program",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Delete program function
  const deleteProgram = async (programId: string, programName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${programName}"?\n\nThis will permanently delete:\n- The exercise program\n- All exercises\n- All weekly goals\n- All completion records\n\nThis action cannot be undone.`
    )
    
    if (!confirmed) return
    
    try {
      setDeletingProgramId(programId)
      
      const response = await fetch(`/api/staff/pt-exercises/${programId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }
      
      toast({
        title: "Program Deleted 🗑️",
        description: `"${programName}" has been permanently deleted`
      })
      
      // Reload programs
      if (therapistId) {
        await loadPrograms(therapistId)
      }
      
    } catch (error: any) {
      console.error('Delete error:', error)
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete program",
        variant: "destructive"
      })
    } finally {
      setDeletingProgramId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <Toaster />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center">
              <Dumbbell className="h-10 w-10 mr-3 text-blue-600" />
              PT Exercise Management
            </h1>
            <p className="text-gray-600 mt-2">Create and manage physical therapy exercise programs</p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create New Program
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Exercise Program</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Patient</Label>
                    <Select value={programForm.patientId} onValueChange={(val) => setProgramForm(prev => ({ ...prev, patientId: val }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Program Name</Label>
                    <Input 
                      placeholder="e.g., Post-Surgery Rehab"
                      value={programForm.programName}
                      onChange={(e) => setProgramForm(prev => ({ ...prev, programName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Total Weeks</Label>
                    <Input 
                      type="number"
                      value={programForm.totalWeeks}
                      onChange={(e) => setProgramForm(prev => ({ ...prev, totalWeeks: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Total Sessions</Label>
                    <Input 
                      type="number"
                      value={programForm.totalSessions}
                      onChange={(e) => setProgramForm(prev => ({ ...prev, totalSessions: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Next Session Date</Label>
                    <Input 
                      type="date"
                      value={programForm.nextSessionDate}
                      onChange={(e) => setProgramForm(prev => ({ ...prev, nextSessionDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Program notes..."
                    value={programForm.notes}
                    onChange={(e) => setProgramForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-lg">Exercises</Label>
                    <Button type="button" size="sm" onClick={addExercise}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Exercise
                    </Button>
                  </div>

                  {programForm.exercises.map((exercise, index) => (
                    <Card key={index} className="mb-3">
                      <CardContent className="pt-4">
                        <div className="flex justify-between mb-3">
                          <Label className="font-semibold">Exercise {index + 1}</Label>
                          {programForm.exercises.length > 1 && (
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="destructive"
                              onClick={() => removeExercise(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Input 
                            placeholder="Exercise name"
                            value={exercise.name}
                            onChange={(e) => updateExercise(index, 'name', e.target.value)}
                          />
                          <Input 
                            placeholder="Duration (e.g., 2 minutes)"
                            value={exercise.duration}
                            onChange={(e) => updateExercise(index, 'duration', e.target.value)}
                          />
                          <Textarea 
                            placeholder="Description"
                            value={exercise.description}
                            onChange={(e) => updateExercise(index, 'description', e.target.value)}
                            className="col-span-2"
                          />
                          <Input 
                            placeholder="Repetitions (e.g., 10-15)"
                            value={exercise.repetitions}
                            onChange={(e) => updateExercise(index, 'repetitions', e.target.value)}
                          />
                          <Input 
                            type="number"
                            placeholder="Sets"
                            value={exercise.sets}
                            onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                          />
                          <Select value={exercise.difficulty} onValueChange={(val) => updateExercise(index, 'difficulty', val)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Easy">Easy</SelectItem>
                              <SelectItem value="Moderate">Moderate</SelectItem>
                              <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {/* Video Upload Section */}
                          <div className="col-span-2 space-y-2">
                            <Label className="text-sm font-medium">Exercise Video</Label>
                            <div className="flex gap-2">
                              <Input 
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleVideoUpload(index, file)
                                }}
                                disabled={uploadingVideo === index}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploadingVideo === index}
                              >
                                {uploadingVideo === index ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload
                                  </>
                                )}
                              </Button>
                            </div>
                            {exercise.videoUrl && (
                              <p className="text-xs text-green-600">
                                ✓ Video uploaded successfully
                              </p>
                            )}
                          </div>

                          {/* AI Tips Section */}
                          <div className="col-span-2 space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm font-medium">AI Coach Tips</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => generateAITips(index)}
                                disabled={generatingAI === index || !exercise.name}
                              >
                                {generatingAI === index ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate with AI
                                  </>
                                )}
                              </Button>
                            </div>
                            <Textarea 
                              placeholder="AI-generated coaching tips will appear here..."
                              value={exercise.aiTips}
                              onChange={(e) => updateExercise(index, 'aiTips', e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button 
                  onClick={createProgram} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Program"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Program Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Exercise Program</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Program Details - same as create but without patient selection */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-programName">Program Name</Label>
                    <Input
                      id="edit-programName"
                      value={programForm.programName}
                      onChange={(e) => setProgramForm({ ...programForm, programName: e.target.value })}
                      placeholder="e.g., Post-Surgery Recovery Program"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-totalWeeks">Total Weeks</Label>
                      <Input
                        id="edit-totalWeeks"
                        type="number"
                        value={programForm.totalWeeks}
                        onChange={(e) => setProgramForm({ ...programForm, totalWeeks: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-totalSessions">Total Sessions</Label>
                      <Input
                        id="edit-totalSessions"
                        type="number"
                        value={programForm.totalSessions}
                        onChange={(e) => setProgramForm({ ...programForm, totalSessions: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-nextSessionDate">Next Session Date</Label>
                    <Input
                      id="edit-nextSessionDate"
                      type="date"
                      value={programForm.nextSessionDate}
                      onChange={(e) => setProgramForm({ ...programForm, nextSessionDate: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-notes">Notes</Label>
                    <Textarea
                      id="edit-notes"
                      value={programForm.notes}
                      onChange={(e) => setProgramForm({ ...programForm, notes: e.target.value })}
                      placeholder="Additional notes or instructions..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Exercises */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Exercises</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExercise}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Exercise
                    </Button>
                  </div>
                  
                  {programForm.exercises.map((exercise, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Exercise {index + 1}</h4>
                          {programForm.exercises.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExercise(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Exercise Name</Label>
                            <Input
                              value={exercise.name}
                              onChange={(e) => updateExercise(index, 'name', e.target.value)}
                              placeholder="e.g., Ankle Pumps"
                            />
                          </div>
                          <div>
                            <Label>Difficulty</Label>
                            <Select
                              value={exercise.difficulty}
                              onValueChange={(value) => updateExercise(index, 'difficulty', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Easy">Easy</SelectItem>
                                <SelectItem value="Moderate">Moderate</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={exercise.description}
                            onChange={(e) => updateExercise(index, 'description', e.target.value)}
                            placeholder="Describe how to perform this exercise..."
                            rows={2}
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Duration</Label>
                            <Input
                              value={exercise.duration}
                              onChange={(e) => updateExercise(index, 'duration', e.target.value)}
                              placeholder="e.g., 2 minutes"
                            />
                          </div>
                          <div>
                            <Label>Repetitions</Label>
                            <Input
                              value={exercise.repetitions}
                              onChange={(e) => updateExercise(index, 'repetitions', e.target.value)}
                              placeholder="e.g., 10-15"
                            />
                          </div>
                          <div>
                            <Label>Sets</Label>
                            <Input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Video (Upload File)</Label>
                          {exercise.videoUrl ? (
                            <div className="flex items-center space-x-2">
                              <Input value={exercise.videoUrl} disabled className="flex-1" />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateExercise(index, 'videoUrl', '')}
                              >
                                Clear
                              </Button>
                            </div>
                          ) : (
                            <Input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleVideoUpload(index, file)
                              }}
                              disabled={uploadingVideo === index}
                            />
                          )}
                          {uploadingVideo === index && (
                            <p className="text-sm text-gray-600 mt-1">
                              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                              Uploading video...
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label>AI Coach Tips</Label>
                          <div className="flex space-x-2">
                            <Textarea
                              value={exercise.aiTips}
                              onChange={(e) => updateExercise(index, 'aiTips', e.target.value)}
                              placeholder="Tips for proper form..."
                              rows={2}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => generateAITips(index)}
                              disabled={generatingAI === index || !exercise.name}
                            >
                              {generatingAI === index ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Weekly Goals */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Weekly Goals</h3>
                  {programForm.weeklyGoals.map((goal, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        value={goal}
                        onChange={(e) => {
                          const newGoals = [...programForm.weeklyGoals]
                          newGoals[index] = e.target.value
                          setProgramForm({ ...programForm, weeklyGoals: newGoals })
                        }}
                        placeholder={`Goal ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newGoals = programForm.weeklyGoals.filter((_, i) => i !== index)
                          setProgramForm({ ...programForm, weeklyGoals: newGoals })
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProgramForm({
                      ...programForm,
                      weeklyGoals: [...programForm.weeklyGoals, ""]
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Goal
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false)
                    setEditingProgram(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateProgram}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Program'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Programs List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && programs.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading programs...</p>
                </div>
              </CardContent>
            </Card>
          ) : programs.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Dumbbell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Programs Yet</h3>
                <p className="text-gray-600 mb-4">Create your first exercise program to get started</p>
              </CardContent>
            </Card>
          ) : (
            programs.map((program) => (
              <Card key={program.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{program.program_name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      program.status === 'active' ? 'bg-green-100 text-green-800' :
                      program.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {program.status}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      {program.patient?.name || 'Unknown Patient'}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Week {program.current_week}/{program.total_weeks}
                    </div>
                    <div className="text-gray-600">
                      Sessions: {program.completed_sessions}/{program.total_sessions}
                    </div>
                    <div className="mt-4 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(program.completed_sessions / program.total_sessions) * 100}%` }}
                      />
                    </div>
                    
                    {/* Edit and Delete Buttons */}
                    <div className="flex space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => startEditProgram(program.id)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteProgram(program.id, program.program_name)}
                        disabled={deletingProgramId === program.id}
                      >
                        {deletingProgramId === program.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

