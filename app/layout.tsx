import type React from "react"
import type { Metadata } from "next"
import { ConditionalLayout } from "@/components/conditional-layout"
import ClientAIVoiceAssistant from "@/components/client-ai-voice-assistant"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mase AI Neural Hub - Healthcare Intelligence Platform",
  description: "Advanced AI-powered healthcare staffing management with neural network optimization",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ConditionalLayout>{children}</ConditionalLayout>
        <ClientAIVoiceAssistant />
      </body>
    </html>
  )
}
