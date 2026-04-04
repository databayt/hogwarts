"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useActionState, useCallback, useEffect, useRef, useState } from "react"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { Plus, Send, Smile, Square, X } from "lucide-react"
import { useFormStatus } from "react-dom"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { MicFilledIcon } from "@/components/atom/icons"
import {
  ACCEPT_ALL,
  FileUploader,
  type UploadedFileResult,
} from "@/components/file"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { sendMessageFromForm, type MessageFormState } from "./actions"
import type { MessageDTO } from "./types"

export interface MessageInputProps {
  conversationId: string
  locale?: "ar" | "en"
  placeholder?: string
  replyTo?: MessageDTO | null
  disabled?: boolean
  maxLength?: number
  whatsappEnabled?: boolean
  onCancelReply?: () => void
  onFileUpload?: (files: UploadedFileResult[]) => void
  onTypingStart?: () => void
  onTypingStop?: () => void
  onOptimisticSend?: (content: string, replyToId?: string) => void
  className?: string
}

export function MessageInput({
  conversationId,
  locale = "en",
  placeholder,
  replyTo,
  disabled = false,
  maxLength = 4000,
  whatsappEnabled = false,
  onCancelReply,
  onFileUpload,
  onTypingStart,
  onTypingStop,
  onOptimisticSend,
  className,
}: MessageInputProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [hasContent, setHasContent] = useState(false)

  const [state, formAction] = useActionState<MessageFormState, FormData>(
    sendMessageFromForm,
    { success: false }
  )

  const handleFormAction = async (formData: FormData) => {
    const content = formData.get("content") as string
    const replyToId = formData.get("replyToId") as string | null

    if (content?.trim()) {
      onOptimisticSend?.(content.trim(), replyToId || undefined)
    }

    return formAction(formData)
  }

  const defaultPlaceholder = m?.form?.message_placeholder || "Type a message..."

  // Auto-reset form on successful send
  useEffect(() => {
    if (state.success && state.messageId) {
      // Explicitly clear the textarea value before form reset
      if (textareaRef.current) {
        textareaRef.current.value = ""
        textareaRef.current.style.height = "auto"
      }
      formRef.current?.reset()
      setHasContent(false)
      onCancelReply?.()
      textareaRef.current?.focus()

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      onTypingStop?.()
    }
  }, [state.success, state.messageId, onCancelReply, onTypingStop])

  // Show error toast
  useEffect(() => {
    if (!state.success && state.error) {
      toast({
        title: m?.notifications?.error || "Error",
        description: state.error,
      })
    }
  }, [state.success, state.error, locale])

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Auto-resize
    e.target.style.height = "auto"
    e.target.style.height = `${e.target.scrollHeight}px`

    const contentExists = e.target.value.trim().length > 0
    setHasContent(contentExists)

    if (contentExists) {
      onTypingStart?.()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop?.()
      }, 3000)
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      onTypingStop?.()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const content = textareaRef.current?.value.trim()
      if (!content) return
      formRef.current?.requestSubmit()
    }
  }

  const handleUploadComplete = (files: UploadedFileResult[]) => {
    onFileUpload?.(files)
    setShowFileUpload(false)
    toast({
      title: m?.notifications?.success || "Success",
      description: (
        m?.notifications?.upload_success || "Uploaded {count} file(s)"
      ).replace("{count}", String(files.length)),
    })
  }

  const handleUploadError = (error: string) => {
    toast({
      title: m?.notifications?.error || "Error",
      description: error,
    })
  }

  const handleEmojiClick = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = textarea.value || ""
    const newValue =
      currentValue.substring(0, start) + emoji + currentValue.substring(end)

    textarea.value = newValue
    setHasContent(newValue.trim().length > 0)

    const event = new Event("change", { bubbles: true })
    textarea.dispatchEvent(event)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        })
        stream.getTracks().forEach((t) => t.stop())

        // Create a File from the blob and trigger upload
        const file = new File([audioBlob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        })
        // Upload via the same file upload pipeline
        const blobUrl = URL.createObjectURL(audioBlob)
        onFileUpload?.([
          {
            fileId: `voice-${Date.now()}`,
            url: blobUrl,
            fileName: file.name,
            fileUrl: blobUrl,
            fileSize: audioBlob.size,
            fileType: "audio/webm",
            category: "OTHER" as const,
          } as UploadedFileResult,
        ])
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingDuration(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1)
      }, 1000)
    } catch {
      toast({
        title: m?.notifications?.error || "Error",
        description: "Could not access microphone",
      })
    }
  }, [onFileUpload, m])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
  }, [])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop())
      mediaRecorderRef.current = null
    }
    audioChunksRef.current = []
    setIsRecording(false)
    setRecordingDuration(0)
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <form
      ref={formRef}
      action={handleFormAction}
      className={cn("border-border border-t", className)}
      style={{ backgroundColor: "#F5F0EA" }}
    >
      {/* Hidden inputs */}
      <input type="hidden" name="conversationId" value={conversationId} />
      {replyTo && <input type="hidden" name="replyToId" value={replyTo.id} />}

      {/* Reply context — WhatsApp style with colored left border */}
      {replyTo && (
        <div className="mx-3 mt-2">
          <div className="bg-msg-incoming border-msg-unread-badge flex items-center justify-between rounded-lg border-s-4 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-msg-unread-badge truncate text-sm font-medium">
                {replyTo.sender.username || replyTo.sender.email}
              </p>
              <p className="text-muted-foreground truncate text-sm">
                {replyTo.isDeleted
                  ? m?.ui?.message_deleted || "Message deleted"
                  : replyTo.content}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancelReply}
              className="h-7 w-7 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input area — WhatsApp layout: [Emoji] [Paperclip] [Input] [Send/Mic] */}
      {isRecording ? (
        /* Voice recording UI */
        <div className="flex items-center gap-3 px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={cancelRecording}
            className="h-10 w-10 flex-shrink-0 rounded-full"
          >
            <X className="text-destructive h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm font-medium tabular-nums">
              {formatDuration(recordingDuration)}
            </span>
            <div className="flex flex-1 items-center gap-0.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-msg-unread-badge/60 w-1 rounded-full"
                  style={{
                    height: `${Math.random() * 20 + 4}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            onClick={stopRecording}
            className="bg-msg-unread-badge hover:bg-msg-unread-badge/90 h-10 w-10 flex-shrink-0 rounded-full text-white"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-end gap-2 px-3 py-1.5">
          {/* Plus / Close icon — attachment menu toggle */}
          <div className="relative mb-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              disabled={disabled}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#E0DEDA]"
            >
              <svg
                className="h-7 w-7 transition-transform duration-200"
                style={{
                  transform: showAttachMenu ? "rotate(-45deg)" : "rotate(0deg)",
                }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#666462"
                strokeWidth="1.2"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            {/* Attachment menu popover */}
            {showAttachMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowAttachMenu(false)}
                />
                <div className="absolute start-0 bottom-full z-20 mb-2 w-56 overflow-hidden rounded-xl bg-white shadow-lg">
                  {[
                    {
                      label: m?.ui?.file || "File",
                      icon: (
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="3"
                            fill="#E8B931"
                            opacity="0.15"
                          />
                          <path
                            d="M6 4.5C6 3.67 6.67 3 7.5 3h5.586a1.5 1.5 0 011.06.44l3.415 3.414A1.5 1.5 0 0118 7.914V19.5c0 .83-.67 1.5-1.5 1.5h-9A1.5 1.5 0 016 19.5V4.5z"
                            fill="#E8B931"
                          />
                          <path
                            d="M13 3v4.5a1.5 1.5 0 001.5 1.5H18"
                            fill="#F5D76E"
                          />
                        </svg>
                      ),
                      action: () => {
                        setShowAttachMenu(false)
                        setShowFileUpload(true)
                      },
                    },
                    {
                      label: m?.ui?.photos_videos || "Photos and videos",
                      icon: (
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <rect
                            x="2"
                            y="4"
                            width="20"
                            height="16"
                            rx="3"
                            fill="#1FA961"
                          />
                          <circle cx="8.5" cy="10" r="2" fill="#fff" />
                          <path
                            d="M2 17l5-4 3 2.5 4-5 8 6.5v2a3 3 0 01-3 3H5a3 3 0 01-3-3v-1z"
                            fill="#15824B"
                          />
                        </svg>
                      ),
                      action: () => {
                        setShowAttachMenu(false)
                        setShowFileUpload(true)
                      },
                    },
                    {
                      label: m?.ui?.contact || "Contact",
                      icon: (
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle cx="12" cy="12" r="10" fill="#FF9500" />
                          <circle cx="12" cy="9.5" r="3" fill="#fff" />
                          <path
                            d="M6.5 18.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
                            stroke="#fff"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      ),
                      action: () => setShowAttachMenu(false),
                    },
                    {
                      label: m?.ui?.poll || "Poll",
                      icon: (
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <rect
                            x="2"
                            y="4"
                            width="20"
                            height="16"
                            rx="3"
                            fill="#FF9500"
                          />
                          <rect
                            x="5"
                            y="8"
                            width="10"
                            height="2"
                            rx="1"
                            fill="#fff"
                          />
                          <rect
                            x="5"
                            y="11"
                            width="14"
                            height="2"
                            rx="1"
                            fill="#fff"
                          />
                          <rect
                            x="5"
                            y="14"
                            width="7"
                            height="2"
                            rx="1"
                            fill="#fff"
                          />
                        </svg>
                      ),
                      action: () => setShowAttachMenu(false),
                    },
                    {
                      label: m?.ui?.event || "Event",
                      icon: (
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="17"
                            rx="3"
                            fill="#FF3B30"
                          />
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="5"
                            rx="3"
                            fill="#FF3B30"
                          />
                          <rect
                            x="3"
                            y="8"
                            width="18"
                            height="13"
                            rx="0"
                            fill="#fff"
                          />
                          <rect
                            x="3"
                            y="17"
                            width="18"
                            height="4"
                            rx="3"
                            fill="#fff"
                          />
                          <rect
                            x="6"
                            y="11"
                            width="3"
                            height="3"
                            rx="0.5"
                            fill="#FF3B30"
                            opacity="0.3"
                          />
                          <rect
                            x="10.5"
                            y="11"
                            width="3"
                            height="3"
                            rx="0.5"
                            fill="#FF3B30"
                            opacity="0.3"
                          />
                          <rect
                            x="15"
                            y="11"
                            width="3"
                            height="3"
                            rx="0.5"
                            fill="#FF3B30"
                            opacity="0.3"
                          />
                        </svg>
                      ),
                      action: () => setShowAttachMenu(false),
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-gray-50"
                    >
                      {item.icon}
                      <span className="text-sm text-gray-800">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Input with emoji icon inside */}
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              name="content"
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder=""
              disabled={disabled}
              maxLength={maxLength}
              rows={1}
              className={cn(
                "max-h-[120px] min-h-[38px] resize-none rounded-[21px] border border-[#DDD] bg-white py-2 ps-4 pe-12 text-sm",
                "hover:border-[#DDD] focus-visible:border-[#DDD] focus-visible:ring-0 focus-visible:ring-offset-0",
                locale === "ar" && "text-end"
              )}
              style={{ caretColor: "#1FA961" }}
            />
            <div className="absolute end-1 bottom-1">
              <EmojiPickerButton
                onEmojiClick={handleEmojiClick}
                disabled={disabled}
                locale={locale}
              />
            </div>
          </div>

          {/* Mic / Send */}
          {hasContent ? (
            <SubmitButton locale={locale} disabled={disabled} />
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={startRecording}
              className="mb-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full hover:bg-[#E0DEDA]"
            >
              <MicFilledIcon className="h-6 w-6" style={{ color: "#666462" }} />
            </button>
          )}
        </div>
      )}

      {/* File upload dialog */}
      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{m?.ui?.upload_files || "Upload Files"}</DialogTitle>
          </DialogHeader>
          <FileUploader
            category="OTHER"
            folder={`messages/${conversationId}`}
            accept={ACCEPT_ALL}
            maxFiles={5}
            multiple={true}
            maxSize={50 * 1024 * 1024}
            optimizeImages={true}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </DialogContent>
      </Dialog>
    </form>
  )
}

// Green circular send button (WhatsApp style)
function SubmitButton({
  locale,
  disabled,
}: {
  locale?: "ar" | "en"
  disabled?: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      size="icon"
      className="mb-1 flex-shrink-0 rounded-full text-white"
      style={{ backgroundColor: "#1FA961", height: "32px", width: "32px" }}
    >
      {pending ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path
            fill="currentColor"
            d="m12.815 12.197l-7.532 1.255a.5.5 0 0 0-.386.318L2.3 20.728c-.248.64.421 1.25 1.035.942l18-9a.75.75 0 0 0 0-1.341l-18-9c-.614-.307-1.283.303-1.035.942l2.598 6.958a.5.5 0 0 0 .386.318l7.532 1.255a.2.2 0 0 1 0 .395"
          />
        </svg>
      )}
    </Button>
  )
}

// Emoji picker button — powered by emoji-mart
function EmojiPickerButton({
  onEmojiClick,
  disabled,
  locale,
}: {
  onEmojiClick: (emoji: string) => void
  disabled?: boolean
  locale?: "ar" | "en"
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="relative flex-shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShowPicker(!showPicker)}
        disabled={disabled}
        className="h-7 w-7 rounded-full"
      >
        <img
          src="/smiley.svg"
          alt=""
          className="h-5 w-5"
          style={{
            filter:
              "brightness(0) saturate(100%) invert(40%) sepia(6%) saturate(800%) hue-rotate(20deg) brightness(92%)",
          }}
        />
      </Button>

      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute start-0 bottom-full z-20 mb-2">
            <Picker
              data={data}
              onEmojiSelect={(emoji: { native: string }) => {
                onEmojiClick(emoji.native)
                setShowPicker(false)
              }}
              locale={locale === "ar" ? "ar" : "en"}
              theme="auto"
              set="native"
              previewPosition="none"
              skinTonePosition="search"
              maxFrequentRows={2}
              perLine={8}
            />
          </div>
        </>
      )}
    </div>
  )
}
