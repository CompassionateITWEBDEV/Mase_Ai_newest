"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Certificate } from "./Certificate"
import { Trophy, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface CertificateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffName: string
  trainingTitle: string
  completionDate: string
  ceuHours?: number
  score?: number
  certificateId: string
  staffId?: string
}

export function CertificateModal({
  open,
  onOpenChange,
  staffName,
  trainingTitle,
  completionDate,
  ceuHours,
  score,
  certificateId,
  staffId,
}: CertificateModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleBackToDashboard = () => {
    onOpenChange(false)
    if (staffId) {
      router.push(`/staff-dashboard?staff_id=${encodeURIComponent(staffId)}#training`)
    } else {
      router.push('/staff-dashboard')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Congratulations! You've Earned Your Certificate!
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Certificate
              staffName={staffName}
              trainingTitle={trainingTitle}
              completionDate={completionDate}
              ceuHours={ceuHours}
              score={score}
              certificateId={certificateId}
              onBackToDashboard={handleBackToDashboard}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        .confetti-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          opacity: 0;
          animation: confetti-fall 3s linear forwards;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}

