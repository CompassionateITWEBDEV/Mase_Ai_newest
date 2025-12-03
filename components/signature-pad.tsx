"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PenTool, Type, Eraser, Check, RotateCcw } from "lucide-react"

interface SignaturePadProps {
  onSign: (signatureData: string, signerName: string) => void
  onCancel: () => void
  signerName?: string
  documentName?: string
}

export function SignaturePad({ onSign, onCancel, signerName = "", documentName }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [name, setName] = useState(signerName)
  const [typedSignature, setTypedSignature] = useState("")
  const [activeTab, setActiveTab] = useState("draw")

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)

    // Set drawing style
    ctx.strokeStyle = "#1e3a5f"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Fill white background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw signature line
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(20, rect.height - 40)
    ctx.lineTo(rect.width - 20, rect.height - 40)
    ctx.stroke()

    // Reset stroke style for signature
    ctx.strokeStyle = "#1e3a5f"
    ctx.lineWidth = 2.5
  }, [])

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)
    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()

    // Clear and redraw background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Redraw signature line
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(20, rect.height - 40)
    ctx.lineTo(rect.width - 20, rect.height - 40)
    ctx.stroke()

    // Reset stroke style
    ctx.strokeStyle = "#1e3a5f"
    ctx.lineWidth = 2.5

    setHasSignature(false)
  }

  const handleSign = () => {
    if (activeTab === "draw") {
      if (!hasSignature || !name.trim()) return
      
      const canvas = canvasRef.current
      if (!canvas) return
      
      const signatureData = canvas.toDataURL("image/png")
      onSign(signatureData, name.trim())
    } else {
      if (!typedSignature.trim() || !name.trim()) return
      
      // Create signature from typed text
      const canvas = document.createElement("canvas")
      canvas.width = 400
      canvas.height = 150
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw typed signature
      ctx.font = "italic 48px 'Brush Script MT', cursive, serif"
      ctx.fillStyle = "#1e3a5f"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2)

      const signatureData = canvas.toDataURL("image/png")
      onSign(signatureData, name.trim())
    }
  }

  const canSign = activeTab === "draw" 
    ? hasSignature && name.trim().length > 0
    : typedSignature.trim().length > 0 && name.trim().length > 0

  return (
    <div className="space-y-4">
      {documentName && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Signing document:</span> {documentName}
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="signer-name">Full Legal Name *</Label>
        <Input
          id="signer-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          className="mt-1"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Draw Signature
          </TabsTrigger>
          <TabsTrigger value="type" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Type Signature
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="mt-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50">
            <canvas
              ref={canvasRef}
              className="w-full h-40 bg-white rounded cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              Draw your signature above the line
            </p>
            <Button variant="ghost" size="sm" onClick={clearCanvas}>
              <Eraser className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="type" className="mt-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="typed-signature">Type Your Signature</Label>
              <Input
                id="typed-signature"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Type your name as signature"
                className="mt-1 text-2xl italic font-serif"
                style={{ fontFamily: "'Brush Script MT', cursive, serif" }}
              />
            </div>
            {typedSignature && (
              <div className="p-4 bg-white border rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                <p 
                  className="text-3xl text-[#1e3a5f] italic text-center"
                  style={{ fontFamily: "'Brush Script MT', cursive, serif" }}
                >
                  {typedSignature}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-xs text-amber-800">
          ⚠️ By signing, you agree that this electronic signature is legally binding 
          and has the same legal effect as a handwritten signature.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSign} 
          disabled={!canSign}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <Check className="h-4 w-4 mr-2" />
          Sign Document
        </Button>
      </div>
    </div>
  )
}

