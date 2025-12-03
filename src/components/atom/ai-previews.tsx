// @ts-nocheck
"use client"

import { AiPromptInput } from "./ai/ai-prompt-input"
import { AiStatusIndicator } from "./ai/ai-status-indicator"
import { AiStreamingText } from "./ai/ai-streaming-text"

export function AiPromptInputPreview() {
  return (
    <AiPromptInput
      onSubmit={(prompt) => console.log("Submitted:", prompt)}
      placeholder="Type your message..."
    />
  )
}

export function AiStatusIndicatorPreview() {
  return (
    <div className="space-y-4">
      <AiStatusIndicator status="idle" />
      <AiStatusIndicator status="loading" />
      <AiStatusIndicator status="processing" />
      <AiStatusIndicator status="streaming" />
      <AiStatusIndicator status="success" />
      <AiStatusIndicator status="error" />
    </div>
  )
}

export function AiStreamingTextPreview() {
  return (
    <AiStreamingText
      text="Hello! This is a demonstration of streaming text animation. Each character appears one by one, creating a typewriter effect."
      speed={30}
    />
  )
}
