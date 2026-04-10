"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Plus, Send, Smile, Square, X } from "lucide-react"

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

import { sendMessage } from "./actions"
import type { MessageDTO } from "./types"
import { uploadMessageAttachment } from "./upload-actions"

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
  onOptimisticSend?: (content: string, replyToId?: string) => string | void
  onMessageConfirmed?: (nonce: string, messageId: string) => void
  onMessageFailed?: (nonce: string) => void
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
  onMessageConfirmed,
  onMessageFailed,
  className,
}: MessageInputProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isUploadingVoice, setIsUploadingVoice] = useState(false)

  const defaultPlaceholder = m?.form?.message_placeholder || "Type a message..."

  // Direct send — no useActionState, instant optimistic + inline confirm
  const handleSend = useCallback(async () => {
    const content = textareaRef.current?.value.trim()
    if (!content || isSending) return

    const replyToId = replyTo?.id

    // 1. Optimistic: add to cache instantly
    const nonce = onOptimisticSend?.(content, replyToId)

    // 2. Clear form immediately (don't wait for server)
    if (textareaRef.current) {
      textareaRef.current.value = ""
      textareaRef.current.style.height = "auto"
    }
    setHasContent(false)
    onCancelReply?.()
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    onTypingStop?.()
    textareaRef.current?.focus()

    // 3. Send to server
    setIsSending(true)
    try {
      const result = await sendMessage({
        conversationId,
        content,
        contentType: "text",
        replyToId: replyToId || undefined,
        clientNonce: nonce || undefined,
      })

      if (result.success && nonce) {
        // 4a. Confirm: swap temp → real in-place (only status icon changes)
        onMessageConfirmed?.(nonce, result.data.id)
      } else if (!result.success && nonce) {
        // 4b. Failed: mark as failed
        onMessageFailed?.(nonce)
        toast({
          title: m?.notifications?.error || "Error",
          description:
            result.error || m?.errors?.send_failed || "Failed to send",
        })
      }
    } catch {
      if (nonce) onMessageFailed?.(nonce)
      toast({
        title: m?.notifications?.error || "Error",
        description: m?.errors?.send_failed || "Failed to send message",
      })
    } finally {
      setIsSending(false)
    }
  }, [
    conversationId,
    isSending,
    replyTo?.id,
    onOptimisticSend,
    onMessageConfirmed,
    onMessageFailed,
    onCancelReply,
    onTypingStop,
    m,
  ])

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
      handleSend()
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

  // Native photo/video picker — uploads and sends directly like WhatsApp
  const handlePhotoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files?.length) return

      for (const file of Array.from(files)) {
        setIsUploadingVoice(true) // reuse uploading state for visual feedback
        try {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("conversationId", conversationId)

          const uploadResult = await uploadMessageAttachment(formData)

          if (!uploadResult.success) {
            toast({
              title: m?.notifications?.error || "Error",
              description: uploadResult.error || "Failed to upload",
            })
            continue
          }

          const { fileUrl, fileName, fileSize, fileType } = uploadResult.data
          const contentType = fileType.startsWith("video/") ? "video" : "image"

          const nonce = onOptimisticSend?.(fileUrl)
          const msgResult = await sendMessage({
            conversationId,
            content: fileUrl,
            contentType,
            clientNonce: nonce || undefined,
            attachments: [{ fileUrl, fileName, fileSize, fileType }],
          })

          if (msgResult.success && nonce) {
            onMessageConfirmed?.(nonce, msgResult.data.id)
          } else if (!msgResult.success && nonce) {
            onMessageFailed?.(nonce)
          }
        } catch {
          toast({
            title: m?.notifications?.error || "Error",
            description: m?.errors?.send_failed || "Failed to send",
          })
        } finally {
          setIsUploadingVoice(false)
        }
      }

      // Reset input so same file can be selected again
      if (photoInputRef.current) photoInputRef.current.value = ""
    },
    [conversationId, onOptimisticSend, onMessageConfirmed, onMessageFailed, m]
  )

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = useCallback(async () => {
    try {
      // Check for secure context and mediaDevices API availability
      if (!navigator.mediaDevices?.getUserMedia) {
        toast({
          title: m?.notifications?.error || "Error",
          description:
            m?.errors?.microphone_access ||
            "Microphone requires HTTPS. Please use a secure connection.",
        })
        return
      }
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        })
        stream.getTracks().forEach((t) => t.stop())

        // Upload to server, then send as message with attachment
        setIsUploadingVoice(true)
        try {
          const file = new File([audioBlob], `voice-${Date.now()}.webm`, {
            type: "audio/webm",
          })
          const formData = new FormData()
          formData.append("file", file)
          formData.append("conversationId", conversationId)

          const uploadResult = await uploadMessageAttachment(formData)

          if (!uploadResult.success) {
            toast({
              title: m?.notifications?.error || "Error",
              description:
                uploadResult.error ||
                m?.errors?.send_failed ||
                "Failed to upload voice message",
            })
            return
          }

          const { fileUrl, fileName, fileSize, fileType } = uploadResult.data

          // Send message with audio attachment
          const nonce = onOptimisticSend?.(fileUrl)
          const msgResult = await sendMessage({
            conversationId,
            content: fileUrl,
            contentType: "audio",
            clientNonce: nonce || undefined,
            attachments: [{ fileUrl, fileName, fileSize, fileType }],
          })

          if (msgResult.success && nonce) {
            onMessageConfirmed?.(nonce, msgResult.data.id)
          } else if (!msgResult.success && nonce) {
            onMessageFailed?.(nonce)
            toast({
              title: m?.notifications?.error || "Error",
              description:
                msgResult.error ||
                m?.errors?.send_failed ||
                "Failed to send voice message",
            })
          }
        } catch {
          toast({
            title: m?.notifications?.error || "Error",
            description:
              m?.errors?.send_failed || "Failed to send voice message",
          })
        } finally {
          setIsUploadingVoice(false)
        }
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingDuration(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1)
      }, 1000)
    } catch (err) {
      const errorName = err instanceof DOMException ? err.name : ""
      const description =
        errorName === "NotAllowedError"
          ? "Microphone permission denied. Allow microphone access in your browser settings."
          : errorName === "NotFoundError"
            ? "No microphone found. Please connect a microphone."
            : m?.errors?.microphone_access ||
              `Could not access microphone${errorName ? `: ${errorName}` : ""}`
      toast({
        title: m?.notifications?.error || "Error",
        description,
      })
    }
  }, [conversationId, onOptimisticSend, onMessageConfirmed, onMessageFailed, m])

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
      onSubmit={(e) => {
        e.preventDefault()
        handleSend()
      }}
      className={cn("border-border border-t", className)}
      style={{ backgroundColor: "#F5F0EA" }}
    >
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
      {isUploadingVoice ? (
        /* Voice uploading indicator */
        <div className="flex items-center justify-center gap-2 px-3 py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1FA961]/30 border-t-[#1FA961]" />
          <span className="text-muted-foreground text-sm">
            {(m?.ui as Record<string, string>)?.uploading ||
              "Sending voice message..."}
          </span>
        </div>
      ) : isRecording ? (
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
                        <img
                          src="/folder.png"
                          alt=""
                          className="h-5 w-5 object-contain"
                        />
                      ),
                      action: () => {
                        setShowAttachMenu(false)
                        setShowFileUpload(true)
                      },
                    },
                    {
                      label: m?.ui?.photos_videos || "Photos and videos",
                      icon: (
                        <img
                          src="/photo.png"
                          alt=""
                          className="h-6 w-6 object-contain"
                        />
                      ),
                      action: () => {
                        setShowAttachMenu(false)
                        photoInputRef.current?.click()
                      },
                    },
                    {
                      label: m?.ui?.contact || "Contact",
                      icon: (
                        <img
                          src="/account.png"
                          alt=""
                          className="h-6 w-6 object-contain"
                        />
                      ),
                      action: () => setShowAttachMenu(false),
                    },
                    {
                      label: m?.ui?.poll || "Poll",
                      icon: (
                        <img
                          src="/poll.png"
                          alt=""
                          className="h-5 w-5 object-contain"
                        />
                      ),
                      action: () => setShowAttachMenu(false),
                    },
                    {
                      label: m?.ui?.event || "Event",
                      icon: (
                        <img
                          src="/calendar.png"
                          alt=""
                          className="h-5 w-5 object-contain"
                        />
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
                "text-start"
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
            <SubmitButton
              locale={locale}
              disabled={disabled}
              isSending={isSending}
            />
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

      {/* Hidden native file input for photos/videos */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handlePhotoSelect}
      />

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
  isSending,
}: {
  locale?: "ar" | "en"
  disabled?: boolean
  isSending?: boolean
}) {
  return (
    <Button
      type="submit"
      disabled={disabled || isSending}
      size="icon"
      className="mb-1 flex-shrink-0 rounded-full text-white"
      style={{ backgroundColor: "#1FA961", height: "32px", width: "32px" }}
    >
      {isSending ? (
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

// Lazy-loaded emoji picker — ~300KB loaded only when opened
const LazyEmojiPicker = dynamic(
  () =>
    Promise.all([import("@emoji-mart/data"), import("@emoji-mart/react")]).then(
      ([dataModule, pickerModule]) => {
        const data = dataModule.default
        const Picker = pickerModule.default
        return {
          default: function EmojiPickerInner({
            onEmojiSelect,
            locale,
          }: {
            onEmojiSelect: (emoji: { native: string }) => void
            locale: string
          }) {
            return (
              <Picker
                data={data}
                onEmojiSelect={onEmojiSelect}
                locale={locale}
                theme="auto"
                set="native"
                previewPosition="none"
                skinTonePosition="search"
                maxFrequentRows={2}
                perLine={8}
              />
            )
          },
        }
      }
    ),
  { ssr: false }
)

// Emoji picker button — powered by emoji-mart (lazy-loaded)
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
          <div className="absolute end-0 bottom-full z-20 mb-2">
            <LazyEmojiPicker
              onEmojiSelect={(emoji: { native: string }) => {
                onEmojiClick(emoji.native)
                setShowPicker(false)
              }}
              locale={locale === "ar" ? "ar" : "en"}
            />
          </div>
        </>
      )}
    </div>
  )
}
