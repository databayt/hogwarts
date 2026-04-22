"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import {
  Crop,
  FileText,
  Images,
  Mic,
  Pencil,
  Plus,
  RotateCw,
  Send,
  Smile,
  Square,
  Sticker,
  Type,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { MicFilledIcon } from "@/components/atom/icons"
import { type UploadedFileResult } from "@/components/file"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { sendMessage } from "./actions"
import type { MessageAttachmentDTO, MessageDTO } from "./types"
import { uploadMessageAttachment } from "./upload-actions"

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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
  onOptimisticSend?: (
    content: string,
    replyToId?: string,
    attachments?: MessageAttachmentDTO[]
  ) => string | void
  onMessageConfirmed?: (
    nonce: string,
    messageId: string,
    serverMessage?: MessageDTO
  ) => void
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const captionRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<
    "image" | "video" | "document"
  >("image")
  const [isSendingPreview, setIsSendingPreview] = useState(false)
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
    setShowFileUpload(false)
    onFileUpload?.(files)
  }

  const handleUploadError = (error: string) => {
    toast({ title: error, variant: "destructive" })
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

  // File preview — opens native picker, shows WhatsApp-style preview before sending
  const handleFilePreview = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      setPreviewFile(file)

      if (file.type.startsWith("image/")) setPreviewType("image")
      else if (file.type.startsWith("video/")) setPreviewType("video")
      else setPreviewType("document")

      e.target.value = ""
    },
    []
  )

  const closePreview = useCallback(() => {
    setPreviewFile(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setIsSendingPreview(false)
  }, [])

  const handlePreviewSend = useCallback(async () => {
    if (!previewFile || isSendingPreview) return

    const file = previewFile
    const localUrl = previewUrl!
    const caption = captionRef.current?.value?.trim() || ""
    const fileType = file.type || "application/octet-stream"
    const contentType = fileType.startsWith("video/")
      ? "video"
      : fileType.startsWith("image/")
        ? "image"
        : "text"

    // Optimistic: show image in chat immediately using local blob URL
    const optimisticAttachment: MessageAttachmentDTO = {
      id: `temp-att-${Date.now()}`,
      messageId: "",
      url: localUrl,
      fileUrl: localUrl,
      name: file.name,
      fileName: file.name,
      size: file.size,
      fileSize: file.size,
      fileType,
      thumbnail: null,
      uploadedAt: new Date(),
    }
    // Use space as content for media-only messages — invisible in UI
    // (message.content?.trim() is falsy) but passes server validation
    const messageContent = caption || " "

    const nonce = onOptimisticSend?.(caption, undefined, [optimisticAttachment])

    // Close preview immediately — image is now in the chat
    setPreviewFile(null)
    setPreviewUrl(null) // Don't revoke — blob URL is used by optimistic message
    setIsSendingPreview(false)

    // Upload + send in background
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("conversationId", conversationId)

      const uploadResult = await uploadMessageAttachment(formData)

      if (!uploadResult.success) {
        if (nonce) onMessageFailed?.(nonce)
        toast({
          title: m?.notifications?.error || "Error",
          description: uploadResult.error || "Failed to upload",
        })
        URL.revokeObjectURL(localUrl)
        return
      }

      const uploaded = uploadResult.data
      const msgResult = await sendMessage({
        conversationId,
        content: messageContent,
        contentType,
        clientNonce: nonce || undefined,
        attachments: [
          {
            fileUrl: uploaded.fileUrl,
            fileName: uploaded.fileName,
            fileSize: uploaded.fileSize,
            fileType: uploaded.fileType,
          },
        ],
      })

      if (msgResult.success && nonce) {
        onMessageConfirmed?.(
          nonce,
          msgResult.data.id,
          msgResult.data.message as MessageDTO | undefined
        )
        // Revoke blob URL after React commits the server URLs, not before.
        // Revoking synchronously races with the re-render and leaves a
        // broken-image fallback visible during the swap.
        requestAnimationFrame(() => URL.revokeObjectURL(localUrl))
      } else if (!msgResult.success && nonce) {
        onMessageFailed?.(nonce)
        toast({
          title: m?.notifications?.error || "Error",
          description:
            msgResult.error || m?.errors?.send_failed || "Failed to send",
        })
        URL.revokeObjectURL(localUrl)
      }
    } catch (err) {
      if (nonce) onMessageFailed?.(nonce)
      toast({
        title: m?.notifications?.error || "Error",
        description:
          (err instanceof Error ? err.message : null) ||
          m?.errors?.send_failed ||
          "Failed to send",
      })
      URL.revokeObjectURL(localUrl)
    }
  }, [
    previewFile,
    previewUrl,
    isSendingPreview,
    conversationId,
    onOptimisticSend,
    onMessageConfirmed,
    onMessageFailed,
    m,
  ])

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [micDenied, setMicDenied] = useState(false)
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
      setMicDenied(false)
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
          const nonce = onOptimisticSend?.("")
          const msgResult = await sendMessage({
            conversationId,
            content: " ",
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
      if (errorName === "NotAllowedError") {
        setMicDenied(true)
      } else {
        toast({
          title: m?.notifications?.error || "Error",
          description:
            errorName === "NotFoundError"
              ? "No microphone found. Please connect a microphone."
              : m?.errors?.microphone_access ||
                `Could not access microphone${errorName ? `: ${errorName}` : ""}`,
        })
      }
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

      {/* Mic permission denied CTA */}
      {micDenied && (
        <div className="border-border flex items-center gap-3 border-b bg-amber-50 px-4 py-2.5 dark:bg-amber-950/30">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Mic className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-muted-foreground flex-1 text-xs">
            {(m?.ui as Record<string, string>)?.mic_denied ||
              "Microphone access is blocked. Click the lock icon in your browser's address bar and allow microphone."}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMicDenied(false)
                startRecording()
              }}
              className="rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
            >
              {(m?.ui as Record<string, string>)?.try_again || "Try Again"}
            </button>
            <button
              type="button"
              onClick={() => setMicDenied(false)}
              className="text-muted-foreground hover:text-foreground rounded-full p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
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
                        fileInputRef.current?.click()
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

      {/* Hidden native file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFilePreview}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFilePreview}
      />

      {/* File preview overlay — WhatsApp style */}
      {previewFile && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: "#1B1B1B" }}
        >
          {/* Top bar: close (left) + image tools (right) */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={closePreview}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#313131] text-white/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {previewType === "image" && (
              <div className="flex items-center gap-1">
                {[Crop, Sticker, Type, Pencil, RotateCw].map((Icon, i) => (
                  <button
                    key={i}
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Image / video / document preview */}
          <div className="flex flex-1 items-center justify-center overflow-hidden px-4">
            {previewType === "image" ? (
              <img
                src={previewUrl}
                alt={previewFile.name}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            ) : previewType === "video" ? (
              <video
                src={previewUrl}
                controls
                className="max-h-full max-w-full rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-white">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10">
                  <FileText className="h-12 w-12" />
                </div>
                <span className="max-w-xs truncate text-lg">
                  {previewFile.name}
                </span>
                <span className="text-sm text-white/60">
                  {formatFileSize(previewFile.size)}
                </span>
              </div>
            )}
          </div>

          {/* Caption input — fixed, centered pill with icons on both ends */}
          <div className="pointer-events-none fixed inset-x-0 bottom-16 z-[60] flex justify-center px-4">
            <div className="pointer-events-auto flex w-full max-w-xs items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 backdrop-blur-md">
              <button
                type="button"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => photoInputRef.current?.click()}
                aria-label={m?.ui?.photos_videos || "Add media"}
              >
                <Images className="h-5 w-5" />
              </button>
              <input
                ref={captionRef}
                type="text"
                autoFocus
                placeholder={
                  (m?.ui as Record<string, string>)?.add_caption ||
                  "Add a caption..."
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handlePreviewSend()
                  } else if (e.key === "Escape") {
                    closePreview()
                  }
                }}
                className="min-w-0 flex-1 border-0 bg-transparent px-1 text-start text-sm text-white placeholder:text-white/50 focus:ring-0 focus:outline-none"
                style={{ caretColor: "#ffffff" }}
              />
              <button
                type="button"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Emoji"
              >
                <Smile className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Footer — compact bar, "You" pill + black send icon on light circle */}
          <div
            className="flex items-center justify-between px-4 py-1.5"
            style={{
              backgroundColor: "rgba(20, 20, 20, 0.9)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <span className="rounded-full bg-[#2A2A2A] px-3 py-1 text-xs font-medium text-white">
              {(m?.ui as Record<string, string>)?.you || "You"}
            </span>
            <button
              type="button"
              onClick={handlePreviewSend}
              disabled={isSendingPreview}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white disabled:opacity-60"
              style={{ backgroundColor: "#1FA961" }}
            >
              {isSendingPreview ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <HorizontalSendIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}
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

// Horizontal paper plane — matches WhatsApp's preview send button (not tilted).
function HorizontalSendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}
