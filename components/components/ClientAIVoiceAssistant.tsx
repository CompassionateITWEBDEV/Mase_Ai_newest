"use client";
import dynamic from "next/dynamic";
const AIVoiceAssistant = dynamic(
  () => import("@/components/ai-voice-assistant").then((mod) => ({ default: mod.AIVoiceAssistant })),
  { ssr: false }
);
export default AIVoiceAssistant;
