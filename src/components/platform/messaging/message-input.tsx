"use client"

import { useRef, useEffect, useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Paperclip, Send, Smile, X } from "lucide-react"
import type { MessageDTO } from "./types"
import { sendMessageFromForm, type MessageFormState } from "./actions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileUploader, ACCEPT_ALL, type UploadedFileResult } from "@/components/file"

export interface MessageInputProps {
  conversationId: string
  locale?: "ar" | "en"
  placeholder?: string
  replyTo?: MessageDTO | null
  disabled?: boolean
  maxLength?: number
  onCancelReply?: () => void
  /** Called when files are uploaded successfully with file IDs and URLs */
  onFileUpload?: (files: UploadedFileResult[]) => void
  onTypingStart?: () => void
  onTypingStop?: () => void
  onOptimisticSend?: (content: string, replyToId?: string) => void
  className?: string
}

/**
 * MessageInput with React 19 useActionState pattern
 *
 * **Modern Patterns**:
 * - useActionState for form state management (no useState for content/loading)
 * - useFormStatus for loading states
 * - Uncontrolled inputs with ref
 * - Form auto-reset on success
 * - Direct server action integration
 *
 * **Retained Features**:
 * - Emoji picker
 * - File upload
 * - Typing indicators
 * - Reply context
 * - Auto-resize textarea
 * - Character count
 */
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
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showFileUpload, setShowFileUpload] = useState(false)

  const [state, formAction] = useActionState<MessageFormState, FormData>(
    sendMessageFromForm,
    { success: false }
  )

  // Wrap formAction to add optimistic message before submission
  const handleFormAction = async (formData: FormData) => {
    const content = formData.get("content") as string
    const replyToId = formData.get("replyToId") as string | null

    // Add optimistic message
    if (content?.trim()) {
      onOptimisticSend?.(content.trim(), replyToId || undefined)
    }

    // Call the actual server action
    return formAction(formData)
  }

  const defaultPlaceholder = locale === "ar" ? "اكتب رسالة..." : "Type a message..."

  // Auto-reset form on successful send
  useEffect(() => {
    if (state.success && state.messageId) {
      formRef.current?.reset()
      onCancelReply?.()
      textareaRef.current?.focus()

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }

      // Stop typing indicator
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
        title: locale === "ar" ? "خطأ" : "Error",
        description: state.error,
      })
    }
  }, [state.success, state.error, locale])

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Auto-resize
    e.target.style.height = "auto"
    e.target.style.height = `${e.target.scrollHeight}px`

    // Typing indicators
    const hasContent = e.target.value.trim().length > 0

    if (hasContent) {
      onTypingStart?.()

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set new timeout (3 seconds of inactivity)
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

      // Get form data and validate
      const content = textareaRef.current?.value.trim()
      if (!content) return

      // Submit form (optimistic message will be added by handleFormAction)
      formRef.current?.requestSubmit()
    }
  }

  const handleUploadComplete = (files: UploadedFileResult[]) => {
    onFileUpload?.(files)
    setShowFileUpload(false)
    toast({
      title: locale === "ar" ? "نجح" : "Success",
      description: locale === "ar" ? `تم رفع ${files.length} ملف` : `Uploaded ${files.length} file(s)`,
    })
  }

  const handleUploadError = (error: string) => {
    toast({
      title: locale === "ar" ? "خطأ" : "Error",
      description: error,
    })
  }

  const handleEmojiClick = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = textarea.value || ""
    const newValue = currentValue.substring(0, start) + emoji + currentValue.substring(end)

    textarea.value = newValue

    // Trigger change event for auto-resize and typing indicators
    const event = new Event("change", { bubbles: true })
    textarea.dispatchEvent(event)

    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  const commonEmojis = [
    "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊",
    "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘",
    "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪",
    "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒",
    "👍", "👎", "👌", "✌️", "🤞", "🤝", "👏", "🙌",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
  ]

  return (
    <form
      ref={formRef}
      action={handleFormAction}
      className={cn("border-t border-border bg-background", className)}
    >
      {/* Hidden inputs */}
      <input type="hidden" name="conversationId" value={conversationId} />
      {replyTo && <input type="hidden" name="replyToId" value={replyTo.id} />}

      {/* Reply context */}
      {replyTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {locale === "ar" ? "الرد على" : "Replying to"} {replyTo.sender.username || replyTo.sender.email}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {replyTo.isDeleted
                ? locale === "ar"
                  ? "تم حذف الرسالة"
                  : "Message deleted"
                : replyTo.content}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancelReply}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-4">
        {/* File upload button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowFileUpload(true)}
          disabled={disabled}
          className="flex-shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Text input */}
        <div className="flex-1 relative">
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
              "min-h-[40px] max-h-[200px] resize-none pr-10",
              locale === "ar" && "text-right"
            )}
          />
        </div>

        {/* Emoji picker */}
        <EmojiPickerButton
          emojis={commonEmojis}
          onEmojiClick={handleEmojiClick}
          disabled={disabled}
        />

        {/* Send button */}
        <SubmitButton locale={locale} disabled={disabled} />
      </div>

      {/* File upload dialog */}
      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {locale === "ar" ? "رفع الملفات" : "Upload Files"}
            </DialogTitle>
          </DialogHeader>
          <FileUploader
            category="OTHER"
            folder={`messages/${conversationId}`}
            accept={ACCEPT_ALL}
            maxFiles={5}
            multiple={true}
            maxSize={50 * 1024 * 1024} // 50MB max
            optimizeImages={true}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </DialogContent>
      </Dialog>
    </form>
  )
}

/**
 * Submit button with useFormStatus for loading state
 */
function SubmitButton({ locale, disabled }: { locale?: "ar" | "en"; disabled?: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      size="icon"
      className="flex-shrink-0"
    >
      {pending ? (
        <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
      ) : (
        <Send className="h-5 w-5" />
      )}
    </Button>
  )
}

/**
 * Emoji picker button with dropdown
 */
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
      >
        <Smile className="h-5 w-5" />
      </Button>

      {/* Emoji picker */}
      {showPicker && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowPicker(false)}
          />
          {/* Picker */}
          <div className="absolute bottom-full right-0 mb-2 p-2 bg-background border border-border rounded-lg shadow-lg z-20 w-64">
            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onEmojiClick(emoji)
                    setShowPicker(false)
                  }}
                  className="p-2 hover:bg-muted rounded transition-colors text-xl"
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
