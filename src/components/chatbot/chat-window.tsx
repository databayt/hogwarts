"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

import { asset } from "@/lib/asset-url"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

import { CHAT_WINDOW_POSITIONS, CHAT_WINDOW_SIZE } from "./constant"
import { InfoIcon, PriceIcon, SendIcon, ServicesIcon, TimeIcon } from "./icons"
import type { ChatWindowProps, CtaChip } from "./type"

export const ChatWindow = memo(function ChatWindow({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
  error,
  locale,
  dictionary,
  promptType = "saasMarketing",
  schoolContext,
}: ChatWindowProps) {
  const [input, setInput] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isRTL = locale === "ar"

  const quickAskButtons = useMemo(() => {
    if (promptType === "schoolSite") {
      const buttons = [
        {
          label: dictionary.schoolAdmission,
          question: dictionary.schoolAdmissionQuestion,
          icon: ServicesIcon,
        },
        {
          label: dictionary.schoolFees,
          question: dictionary.schoolFeesQuestion,
          icon: PriceIcon,
        },
      ]

      // Context-aware: show scholarships or events when available
      if (schoolContext?.hasScholarships) {
        buttons.push({
          label: dictionary.schoolScholarships || "Scholarships",
          question:
            dictionary.schoolScholarshipsQuestion ||
            "What scholarships are available?",
          icon: PriceIcon,
        })
      }

      if (schoolContext?.hasUpcomingEvents) {
        buttons.push({
          label: dictionary.schoolEvents || "Events",
          question:
            dictionary.schoolEventsQuestion ||
            "What upcoming events does the school have?",
          icon: TimeIcon,
        })
      }

      // Fill remaining slots with defaults
      if (buttons.length < 4) {
        buttons.push({
          label: dictionary.schoolPrograms,
          question: dictionary.schoolProgramsQuestion,
          icon: TimeIcon,
        })
      }
      if (buttons.length < 4) {
        buttons.push({
          label: dictionary.schoolContact,
          question: dictionary.schoolContactQuestion,
          icon: InfoIcon,
        })
      }

      return buttons.slice(0, 4)
    }
    return [
      {
        label: dictionary.saasFeatures,
        question: dictionary.saasFeaturesQuestion,
        icon: ServicesIcon,
      },
      {
        label: dictionary.saasPricing,
        question: dictionary.saasPricingQuestion,
        icon: PriceIcon,
      },
      {
        label: dictionary.saasGetStarted,
        question: dictionary.saasGetStartedQuestion,
        icon: TimeIcon,
      },
      {
        label: dictionary.saasOpenSource,
        question: dictionary.saasOpenSourceQuestion,
        icon: InfoIcon,
      },
    ]
  }, [promptType, dictionary, schoolContext])

  // Personalised welcome — school name in school mode, generic SaaS line otherwise
  const welcomeText = useMemo(() => {
    if (promptType === "schoolSite" && schoolContext) {
      const name =
        locale === "ar" ? schoolContext.schoolNameAr : schoolContext.schoolName
      return dictionary.welcomeSchoolTemplate.replace("{name}", name)
    }
    return dictionary.welcomeSaas
  }, [promptType, schoolContext, locale, dictionary])

  // Mode-aware CTA chips — derived from promptType + live school context.
  // Paths use `/${locale}/...` only — never `/s/${subdomain}/...` (gotcha #11).
  const ctaChips = useMemo<CtaChip[]>(() => {
    if (promptType === "saasMarketing") {
      return [
        { label: dictionary.ctaTryFree, href: `/${locale}/onboarding` },
        { label: dictionary.ctaSeePricing, href: `/${locale}/pricing` },
        { label: dictionary.ctaViewFeatures, href: `/${locale}/features` },
      ]
    }
    const chips: CtaChip[] = []
    if (schoolContext?.admissionOpen) {
      chips.push({
        label: dictionary.ctaStartApplication,
        href: `/${locale}/application`,
      })
    }
    chips.push({
      label: dictionary.ctaBookTour,
      href: `/${locale}/tour`,
    })
    chips.push({
      label: dictionary.ctaSendInquiry,
      href: `/${locale}/inquiry`,
    })
    if (schoolContext?.hasScholarships) {
      chips.push({
        label: dictionary.ctaViewScholarships,
        href: `/${locale}/admissions#scholarships`,
      })
    }
    return chips.slice(0, 3)
  }, [promptType, schoolContext, locale, dictionary])

  // Index of the most recent assistant message — chips render only below it.
  const lastAssistantIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return i
    }
    return -1
  }, [messages])

  // Inline assistant avatars use the generic robot — the chatbot is uniform
  // across every tenant, never school-branded (falls back to "AI" text if the
  // image fails to load).
  const assistantAvatarSrc = asset("/illustrations/robot.png")
  const assistantAvatarAlt = "AI"

  // Auto focus input when chat opens on desktop
  useEffect(() => {
    if (isOpen && !isMobile && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, isMobile])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Handle keyboard visibility on mobile
  useEffect(() => {
    if (!isMobile) return

    const initialViewportHeight =
      window.visualViewport?.height || window.innerHeight

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight
      const heightDifference = initialViewportHeight - currentHeight
      setKeyboardOpen(heightDifference > 150)
    }

    const handleFocus = () => {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          })
        }
      }, 300)
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange)
    } else {
      window.addEventListener("resize", handleViewportChange)
    }

    const inputElement = inputRef.current
    if (inputElement) {
      inputElement.addEventListener("focus", handleFocus)
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          "resize",
          handleViewportChange
        )
      } else {
        window.removeEventListener("resize", handleViewportChange)
      }
      if (inputElement) {
        inputElement.removeEventListener("focus", handleFocus)
      }
    }
  }, [isMobile])

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      )
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: "smooth",
        })
      }
    }
  }, [messages])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        onSendMessage(input.trim())
        setInput("")
      }
    },
    [input, isLoading, onSendMessage]
  )

  return (
    <div
      ref={chatWindowRef}
      className={cn(
        // Mobile: Full screen overlay, Desktop: Bottom right position
        isMobile
          ? "bg-background fixed inset-0 z-[10000] flex flex-col"
          : cn(
              CHAT_WINDOW_POSITIONS["bottom-right"],
              CHAT_WINDOW_SIZE.width,
              CHAT_WINDOW_SIZE.height,
              "bg-background z-[9999] flex flex-col rounded-lg border shadow-2xl",
              "max-h-[80vh]"
            ),
        "transform transition-all duration-700 ease-in-out",
        isRTL ? "sm:origin-bottom-left" : "sm:origin-bottom-right",
        isOpen
          ? "visible scale-100 opacity-100"
          : "pointer-events-none invisible scale-0 opacity-0"
      )}
      style={{
        transformOrigin: isMobile
          ? "center"
          : isRTL
            ? "bottom left"
            : "bottom right",
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        ...(isMobile && isOpen
          ? {
              height: keyboardOpen ? "100vh" : "100dvh",
              minHeight: "100vh",
            }
          : {}),
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Mobile Back Arrow Header */}
      {isMobile && (
        <div className="flex items-center justify-start p-4">
          <button
            onClick={onClose}
            className="hover:bg-accent flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(isRTL && "rotate-180")}
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>
      )}

      <ScrollArea
        className={cn(
          "flex-1 overflow-x-hidden overflow-y-auto",
          isMobile ? "px-4 pt-2 pb-1" : "px-4 pt-2 pb-1"
        )}
        ref={scrollAreaRef}
      >
        <div className="flex h-full flex-col">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col">
              {isMobile ? (
                <div className="flex flex-1 flex-col items-center justify-end pb-8">
                  <p className="mb-2 text-center text-sm font-medium">
                    {welcomeText}
                  </p>
                  <p className="text-muted-foreground mb-6 text-center text-xs">
                    {dictionary.chooseQuestion}
                  </p>
                  <div className="grid w-full max-w-sm grid-cols-2 gap-2 px-2">
                    {quickAskButtons.map((btn, i) => (
                      <Button
                        key={i}
                        variant="secondary"
                        size="sm"
                        onClick={() => onSendMessage(btn.question)}
                        className="bg-muted hover:bg-muted/80 flex h-auto items-center gap-2 border-0 px-3 py-2.5 text-xs"
                      >
                        <btn.icon size={16} />
                        <span>{btn.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-end px-4 pb-8 text-center">
                  <p className="mb-1 text-sm font-medium">{welcomeText}</p>
                  <p className="text-muted-foreground text-xs">
                    {dictionary.chooseQuestion}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {messages.map((message, index) => {
                const isAssistant = message.role === "assistant"
                const isLastAssistant =
                  isAssistant && index === lastAssistantIndex
                return (
                  <div key={index} className="space-y-2">
                    <div
                      className={cn(
                        "flex gap-2",
                        message.role === "user"
                          ? isRTL
                            ? "flex-row"
                            : "flex-row-reverse"
                          : ""
                      )}
                    >
                      {isAssistant && (
                        <Avatar className="h-7 w-7 shrink-0">
                          {assistantAvatarSrc ? (
                            <AvatarImage
                              src={assistantAvatarSrc}
                              alt={assistantAvatarAlt}
                            />
                          ) : null}
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            AI
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 break-words",
                          message.role === "user"
                            ? "bg-primary ms-auto text-white"
                            : "bg-muted"
                        )}
                      >
                        <p
                          className={cn(
                            "text-sm whitespace-pre-wrap",
                            message.role === "user" && "text-white"
                          )}
                        >
                          {message.content}
                        </p>
                      </div>
                    </div>
                    {isLastAssistant && ctaChips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 ps-9">
                        {ctaChips.map((chip) => (
                          <Link
                            key={chip.href}
                            href={chip.href}
                            className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                            onClick={onClose}
                          >
                            {chip.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div
        className={cn(
          "bg-background",
          isMobile ? "px-3 py-3" : "px-3 pt-2 pb-2",
          isMobile && keyboardOpen && "pb-1"
        )}
        style={{
          ...(isMobile && keyboardOpen
            ? {
                position: "fixed",
                bottom: "0",
                left: "0",
                right: "0",
                zIndex: 10001,
              }
            : {}),
        }}
      >
        {/* Desktop preconfigured questions */}
        {!isMobile && messages.length === 0 && (
          <div className="mb-3">
            <div className="grid w-full grid-cols-2 gap-2">
              {quickAskButtons.map((btn, i) => (
                <Button
                  key={i}
                  variant="secondary"
                  size="sm"
                  onClick={() => onSendMessage(btn.question)}
                  className="bg-muted hover:bg-muted/80 flex h-auto items-center gap-2 border-0 px-3 py-2 text-xs"
                >
                  <btn.icon size={14} />
                  <span>{btn.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Single rounded pill — input with inline mic + send, concise */}
          <div
            className={cn(
              "border-muted-foreground bg-background flex items-center gap-1 rounded-full border",
              isMobile ? "py-1.5 ps-4 pe-1.5" : "py-1 ps-4 pe-1"
            )}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder={dictionary.placeholder}
              className={cn(
                "placeholder:text-muted-foreground/60 min-w-0 flex-1 border-none bg-transparent outline-none",
                isMobile ? "h-9 text-[16px]" : "h-7 text-sm"
              )}
              dir={isRTL ? "rtl" : "ltr"}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              inputMode="text"
            />

            {/* Send — primary filled command button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label={dictionary.sendMessage}
              title={dictionary.sendMessage}
              className={cn(
                "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100",
                isMobile ? "h-9 w-9" : "h-7 w-7"
              )}
            >
              <SendIcon
                size={isMobile ? 18 : 15}
                className={cn(isRTL && "scale-x-[-1]")}
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})
