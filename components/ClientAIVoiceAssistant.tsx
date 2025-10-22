"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"

const AIVoiceAssistant = dynamic(
  () => import("@/components/ai-voice-assistant").then((mod) => ({ default: mod.AIVoiceAssistant })),
  {
    ssr: false,
  },
)

export default function ClientAIVoiceAssistant() {
  const router = useRouter()

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return <AIVoiceAssistant userRole="staff" onNavigate={handleNavigate} />
}
