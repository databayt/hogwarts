"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useActionState, useCallback, useEffect, useRef, useState } from "react"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { Mic, Paperclip, Send, Smile, Square, X } from "lucide-react"
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
        const file = new File(
          [audioBlob],
          `voice-${Date.now()}.webm`,
          { type: "audio/webm" }
        )
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
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((t) => t.stop())
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
      className={cn("bg-msg-header-bg border-border border-t", className)}
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
        <div className="flex items-end gap-1.5 px-3 py-2">
          {/* Emoji picker — emoji-mart */}
          <EmojiPickerButton
            onEmojiClick={handleEmojiClick}
            disabled={disabled}
            locale={locale}
          />

          {/* File upload */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowFileUpload(true)}
            disabled={disabled}
            className="h-10 w-10 flex-shrink-0 rounded-full"
          >
            <Paperclip className="text-muted-foreground h-5 w-5" />
          </Button>

          {/* Text input — WhatsApp pill shape */}
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              name="content"
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || defaultPlaceholder}
              disabled={disabled}
              maxLength={maxLength}
              rows={1}
              className={cn(
                "bg-msg-input-bg max-h-[120px] min-h-[42px] resize-none rounded-[21px] border-none px-4 py-2.5 text-sm",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                locale === "ar" && "text-end"
              )}
            />
          </div>

          {/* Send / Mic toggle — WhatsApp: send when text, mic when empty */}
          {hasContent ? (
            <div className="relative">
              <SubmitButton locale={locale} disabled={disabled} />
              {whatsappEnabled && (
                <span className="absolute -end-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 text-[7px] font-bold text-white">
                  W
                </span>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={startRecording}
              className="h-10 w-10 flex-shrink-0 rounded-full"
            >
              <Mic className="text-muted-foreground h-5 w-5" />
            </Button>
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
      className="bg-msg-unread-badge hover:bg-msg-unread-badge/90 h-10 w-10 flex-shrink-0 rounded-full text-white"
    >
      {pending ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <Send className="h-5 w-5" />
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
        className="h-10 w-10 rounded-full"
      >
        <Smile className="text-muted-foreground h-5 w-5" />
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
