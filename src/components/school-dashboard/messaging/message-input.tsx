"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useActionState, useEffect, useRef, useState } from "react"
import { Mic, Paperclip, Send, Smile, X } from "lucide-react"
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

  const commonEmojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
    "😏",
    "😒",
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤝",
    "👏",
    "🙌",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
  ]

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
      <div className="flex items-end gap-1.5 px-3 py-2">
        {/* Emoji picker */}
        <EmojiPickerButton
          emojis={commonEmojis}
          onEmojiClick={handleEmojiClick}
          disabled={disabled}
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

        {/* Send / Mic toggle */}
        {hasContent ? (
          <SubmitButton locale={locale} disabled={disabled} />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="h-10 w-10 flex-shrink-0 rounded-full"
          >
            <Mic className="text-muted-foreground h-5 w-5" />
          </Button>
        )}
      </div>

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

// Emoji picker button
function EmojiPickerButton({
  emojis,
  onEmojiClick,
  disabled,
}: {
  emojis: string[]
  onEmojiClick: (emoji: string) => void
  disabled?: boolean
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
          <div className="bg-card border-border absolute end-0 bottom-full z-20 mb-2 w-72 rounded-xl border p-3 shadow-lg">
            <div className="grid max-h-52 grid-cols-8 gap-0.5 overflow-y-auto">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onEmojiClick(emoji)
                    setShowPicker(false)
                  }}
                  className="hover:bg-muted flex items-center justify-center rounded-lg p-1.5 text-xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
