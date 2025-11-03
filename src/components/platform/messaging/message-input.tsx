"use client"

import { useState, useRef, useEffect } from "react"
import { Paperclip, Send, Smile, X } from "lucide-react"
import type { MessageDTO } from "./types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

export interface MessageInputProps {
  conversationId: string
  locale?: "ar" | "en"
  placeholder?: string
  replyTo?: MessageDTO | null
  disabled?: boolean
  maxLength?: number
  onSend: (content: string, replyToId?: string) => Promise<void>
  onCancelReply?: () => void
  onFileUpload?: (file: File) => Promise<void>
  onTypingStart?: () => void
  onTypingStop?: () => void
  className?: string
}

export function MessageInput({
  conversationId,
  locale = "en",
  placeholder,
  replyTo,
  disabled = false,
  maxLength = 4000,
  onSend,
  onCancelReply,
  onFileUpload,
  onTypingStart,
  onTypingStop,
  className,
}: MessageInputProps) {
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const defaultPlaceholder = locale === "ar" ? "اكتب رسالة..." : "Type a message..."

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  // Handle typing indicators
  useEffect(() => {
    if (content && !isTyping) {
      setIsTyping(true)
      onTypingStart?.()
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        onTypingStop?.()
      }
    }, 3000)

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [content])

  const handleSend = async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent || isSending) return

    setIsSending(true)
    try {
      await onSend(trimmedContent, replyTo?.id)
      setContent("")
      onCancelReply?.()
      textareaRef.current?.focus()
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل إرسال الرسالة" : "Failed to send message",
      })
    } finally {
      setIsSending(false)
      if (isTyping) {
        setIsTyping(false)
        onTypingStop?.()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "حجم الملف كبير جداً (الحد الأقصى 50 ميجابايت)" : "File too large (max 50MB)",
      })
      return
    }

    try {
      await onFileUpload?.(file)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل رفع الملف" : "Failed to upload file",
      })
    }
  }

  const handleEmojiClick = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + emoji + content.substring(end)

    setContent(newContent)
    setShowEmojiPicker(false)

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
    <div className={cn("border-t border-border bg-background", className)}>
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
        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || defaultPlaceholder}
            disabled={disabled || isSending}
            maxLength={maxLength}
            rows={1}
            className={cn(
              "min-h-[40px] max-h-[200px] resize-none pr-10",
              locale === "ar" && "text-right"
            )}
          />
          {/* Character count */}
          {content.length > maxLength * 0.8 && (
            <div
              className={cn(
                "absolute bottom-2 text-xs text-muted-foreground",
                locale === "ar" ? "left-2" : "right-2"
              )}
            >
              {content.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Emoji picker toggle */}
        <div className="relative flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
          >
            <Smile className="h-5 w-5" />
          </Button>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowEmojiPicker(false)}
              />
              {/* Picker */}
              <div className="absolute bottom-full right-0 mb-2 p-2 bg-background border border-border rounded-lg shadow-lg z-20 w-64">
                <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
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

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!content.trim() || disabled || isSending}
          size="icon"
          className="flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
