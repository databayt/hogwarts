"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ThumbsDown, ThumbsUp } from "lucide-react"

import { cn } from "@/lib/utils"

import type { ChatbotDictionary, ChatMessage, PromptType } from "./type"

export type NextStep = "rephrase" | "report" | "email" | "school" | "team"

const STEPS: Record<PromptType, NextStep[]> = {
  schoolSupport: ["rephrase", "report", "email"],
  schoolSite: ["rephrase", "school"],
  saasMarketing: ["rephrase", "team"],
}

const LABEL: Record<NextStep, string> = {
  rephrase: "rephrase",
  report: "reportProblem",
  email: "ctaEmailSupport",
  school: "contactSchool",
  team: "talkToTeam",
}

const CHIP =
  "bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-3 py-1 text-xs font-medium transition-colors"

/**
 * Helpful / not helpful under the latest answer. "Not helpful" turns into
 * the next steps for this bot — ask it differently, then the one human
 * route that fits: a report on the desk, the school on its site, our team
 * on the sales site. Each is one tap.
 */
export function Feedback({
  message,
  dictionary,
  promptType,
  onRate,
  onStep,
}: {
  message: ChatMessage
  dictionary: ChatbotDictionary
  promptType: PromptType
  onRate: (messageId: string, value: 1 | -1) => void
  onStep: (step: NextStep) => void
}) {
  const id = message.serverId
  if (!id) return null
  const button = (value: 1 | -1, label: string, Icon: typeof ThumbsUp) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={message.feedback === value}
      onClick={() => onRate(id, value)}
      className={cn(
        "hover:bg-accent text-muted-foreground flex h-7 w-7 items-center justify-center rounded-full transition-colors",
        message.feedback === value && "text-foreground bg-accent"
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </button>
  )
  return (
    <div className="space-y-2 ps-9">
      <div className="flex items-center gap-1">
        {button(1, dictionary.helpful, ThumbsUp)}
        {button(-1, dictionary.notHelpful, ThumbsDown)}
        {message.feedback === 1 && (
          <span className="text-muted-foreground ps-1 text-xs">
            {dictionary.thanksFeedback}
          </span>
        )}
      </div>
      {message.feedback === -1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-xs">
            {dictionary.nextSteps}
          </span>
          {STEPS[promptType].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => onStep(step)}
              className={CHIP}
            >
              {dictionary[LABEL[step]]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
