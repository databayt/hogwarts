"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo } from "react"
import Link from "next/link"
import { RotateCcw } from "lucide-react"

import { asset } from "@/lib/asset-url"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { MarkdownLite } from "./markdown-lite"
import { ResourceCards } from "./resource-cards"
import { mailHref } from "./starters"
import type { ChatbotDictionary, ChatMessage, CtaChip } from "./type"
import { TypingDots } from "./typing-dots"

// The assistant is uniform across tenants — the generic robot, never a
// school's logo (falls back to "AI" if the image fails to load).
const AVATAR = asset("/illustrations/robot-fill.png")

const CHIP =
  "bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-3 py-1 text-xs font-medium transition-colors"

export const MessageRow = memo(function MessageRow({
  message,
  dictionary,
  locale,
  pending,
  chips,
  onRetry,
  onNavigate,
}: {
  message: ChatMessage
  dictionary: ChatbotDictionary
  locale: "en" | "ar"
  /** The answer hasn't started yet: dots instead of an empty bubble. */
  pending: boolean
  /** CTA chips — only under the latest finished answer. */
  chips: CtaChip[]
  /** Only on the latest answer, when it failed or broke off. */
  onRetry?: () => void
  onNavigate: () => void
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  const failed = message.kind === "error"
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={AVATAR} alt={dictionary.assistantAvatarAlt} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            AI
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "max-w-[85%] min-w-0 rounded-2xl px-3 py-2",
            failed ? "bg-destructive/10 text-destructive" : "bg-muted"
          )}
        >
          {pending && !message.content ? (
            <TypingDots label={dictionary.typing} />
          ) : failed ? (
            <p className="text-sm">{message.content}</p>
          ) : (
            <MarkdownLite text={message.content} />
          )}
          {(message.partial || onRetry) && (
            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs">
              {message.partial && message.notice && (
                <span>{message.notice}</span>
              )}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden />
                  {dictionary.retry}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {message.resources?.length ? (
        <ResourceCards
          resources={message.resources}
          dictionary={dictionary}
          onNavigate={onNavigate}
          lang={locale}
        />
      ) : null}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 ps-9">
          {chips.map((chip) =>
            chip.external ? (
              <a
                key={chip.href}
                href={chip.href}
                target={chip.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                // The mail carries the page the member is on now — read at
                // click time, never cached at render.
                onClick={
                  chip.href.startsWith("mailto:")
                    ? (e) => {
                        e.currentTarget.href = mailHref(dictionary)
                      }
                    : undefined
                }
                className={CHIP}
              >
                {chip.label}
              </a>
            ) : (
              <Link
                key={chip.href}
                href={chip.href}
                onClick={onNavigate}
                className={CHIP}
              >
                {chip.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  )
})
