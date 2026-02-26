"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

import { CHAT_WINDOW_POSITIONS, CHAT_WINDOW_SIZE } from "./constant"
import {
  InfoIcon,
  PriceIcon,
  SendIcon,
  ServicesIcon,
  TimeIcon,
  VoiceIcon,
  VolumeIcon,
  VolumeOffIcon,
} from "./icons"
import type { ChatWindowProps } from "./type"

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
}: ChatWindowProps) {
  const [input, setInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const prevMessagesLengthRef = useRef(messages.length)
  const isRTL = locale === "ar"

  const quickAskButtons = useMemo(() => {
    if (promptType === "schoolSite") {
      return [
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
        {
          label: dictionary.schoolContact,
          question: dictionary.schoolContactQuestion,
          icon: InfoIcon,
        },
        {
          label: dictionary.schoolPrograms,
          question: dictionary.schoolProgramsQuestion,
          icon: TimeIcon,
        },
      ]
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
  }, [promptType, dictionary])

  // Initialize SpeechRecognition once, re-init on locale change
  useEffect(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as unknown as any).webkitSpeechRecognition ||
      (window as unknown as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = locale === "ar" ? "ar-SA" : "en-US"
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (finalTranscript) {
        setTranscript("")
        setIsListening(false)
        onSendMessage(finalTranscript.trim())
      } else if (interimTranscript) {
        setTranscript(interimTranscript)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      setTranscript("")
    }

    recognition.onend = () => {
      setIsListening(false)
      setTranscript("")
    }

    recognitionRef.current = recognition

    return () => {
      try {
        recognition.stop()
      } catch {
        // ignore if not started
      }
      recognitionRef.current = null
    }
  }, [locale, onSendMessage])

  // Speak new assistant messages when TTS is enabled
  useEffect(() => {
    if (
      !ttsEnabled ||
      messages.length <= prevMessagesLengthRef.current ||
      !("speechSynthesis" in window)
    ) {
      prevMessagesLengthRef.current = messages.length
      return
    }

    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === "assistant" && lastMessage.content) {
      const utterance = new SpeechSynthesisUtterance(lastMessage.content)
      utterance.lang = locale === "ar" ? "ar-SA" : "en-US"

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices()
      const langPrefix = locale === "ar" ? "ar" : "en"
      const matchingVoice = voices.find((v) => v.lang.startsWith(langPrefix))
      if (matchingVoice) {
        utterance.voice = matchingVoice
      }

      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    }

    prevMessagesLengthRef.current = messages.length
  }, [messages, ttsEnabled, locale])

  // Cancel TTS when disabled
  useEffect(() => {
    if (!ttsEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }, [ttsEnabled])

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

    let initialViewportHeight =
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

  const handleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) {
      alert(dictionary.speechNotSupported)
      return
    }

    if (isLoading) return

    if (isListening) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      setIsListening(false)
      setTranscript("")
      return
    }

    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
      setTranscript("")
    }
  }, [isListening, isLoading, dictionary.speechNotSupported])

  const handleTtsToggle = useCallback(() => {
    setTtsEnabled((prev) => !prev)
  }, [])

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
                <div className="flex flex-1 flex-col items-center justify-center">
                  <p className="text-muted-foreground mb-6 text-center text-sm font-medium">
                    <span>{dictionary.chooseQuestion}</span>
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
                <div className="flex-1" />
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-2",
                    message.role === "user"
                      ? isRTL
                        ? "flex-row"
                        : "flex-row-reverse"
                      : ""
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-7 w-7 shrink-0">
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
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Interim transcript display */}
      {transcript && (
        <div className="text-muted-foreground bg-muted/50 px-4 py-2 text-sm italic">
          {transcript}
        </div>
      )}

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

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div
            className={cn(
              "border-muted-foreground bg-background relative flex flex-1 items-center rounded-lg border px-3"
            )}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder={isMobile ? "" : ""}
              className={cn(
                "w-full border-none bg-transparent outline-none",
                isMobile ? "h-10 py-2 text-[16px]" : "h-8 py-2 text-sm"
              )}
              dir={isRTL ? "rtl" : "ltr"}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              inputMode="text"
            />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "shrink-0 transition-transform hover:scale-110 disabled:opacity-50 disabled:hover:scale-100",
                isMobile ? "h-12 w-12" : "h-10 w-10"
              )}
              title={dictionary.sendMessage}
            >
              <SendIcon
                size={isMobile ? 32 : 20}
                className={cn(isRTL && "scale-x-[-1]")}
              />
            </button>

            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isLoading}
              className={cn(
                "shrink-0 transition-transform hover:scale-110 disabled:opacity-50",
                isMobile ? "h-12 w-12" : "h-10 w-10",
                isListening && "animate-pulse text-red-500"
              )}
              title={isListening ? dictionary.listening : dictionary.voiceInput}
            >
              <VoiceIcon size={isMobile ? 32 : 20} />
            </button>

            <button
              type="button"
              onClick={handleTtsToggle}
              className={cn(
                "shrink-0 transition-transform hover:scale-110",
                isMobile ? "h-12 w-12" : "h-10 w-10",
                ttsEnabled && "text-primary"
              )}
              title={
                ttsEnabled ? dictionary.ttsEnabled : dictionary.ttsDisabled
              }
            >
              {ttsEnabled ? (
                <VolumeIcon size={isMobile ? 32 : 20} />
              ) : (
                <VolumeOffIcon size={isMobile ? 32 : 20} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})
