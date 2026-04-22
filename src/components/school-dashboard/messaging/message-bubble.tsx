"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import {
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Copy,
  Download,
  FileText,
  Forward,
  Pause,
  Pencil,
  Play,
  Reply,
  Smile,
  Star,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { LinkPreview, type LinkPreviewData } from "./link-preview"
import type { MessageDTO } from "./types"

export interface MessageBubbleProps {
  message: MessageDTO
  currentUserId: string
  locale?: "ar" | "en"
  showSender?: boolean
  compact?: boolean
  isStarred?: boolean
  onReply?: (message: MessageDTO) => void
  onEdit?: (message: MessageDTO) => void
  onDelete?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onRemoveReaction?: (reactionId: string) => void
  onForward?: (message: MessageDTO) => void
  onStar?: (messageId: string) => void
  onUnstar?: (messageId: string) => void
  onRetry?: (messageId: string) => void
}

export interface MessageBubbleOptimizedProps extends MessageBubbleProps {
  showAvatar?: boolean
  showSenderName?: boolean
  showTimestamp?: boolean
  showTail?: boolean
  isFirstInGroup?: boolean
  isLastInGroup?: boolean
}

// Deterministic color for sender names in group chats
const SENDER_NAME_COLORS = [
  "text-emerald-600 dark:text-emerald-400",
  "text-sky-600 dark:text-sky-400",
  "text-violet-600 dark:text-violet-400",
  "text-rose-600 dark:text-rose-400",
  "text-amber-600 dark:text-amber-400",
  "text-teal-600 dark:text-teal-400",
  "text-indigo-600 dark:text-indigo-400",
  "text-pink-600 dark:text-pink-400",
]

function getSenderColor(senderId: string): string {
  let hash = 0
  for (let i = 0; i < senderId.length; i++) {
    hash = senderId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return SENDER_NAME_COLORS[Math.abs(hash) % SENDER_NAME_COLORS.length]
}

// Read receipt indicator (WhatsApp style)
function ReadReceiptIcon({ status }: { status: string }) {
  switch (status) {
    case "sending":
      return <Clock className="h-3 w-3 animate-pulse text-current" />
    case "sent":
      return <Check className="h-3 w-3 text-current" />
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-current" />
    case "read":
      return <CheckCheck className="text-msg-read-check h-3 w-3" />
    case "failed":
      return (
        <span className="text-destructive text-[10px] font-bold" title="Failed">
          !
        </span>
      )
    default:
      return null
  }
}

// WhatsApp delivery status indicator (small "W" badge)
function WhatsAppStatusIcon({ status }: { status: string }) {
  const color =
    status === "read"
      ? "text-green-500"
      : status === "delivered"
        ? "text-green-400"
        : status === "sent"
          ? "text-muted-foreground"
          : status === "failed"
            ? "text-destructive"
            : "text-muted-foreground"

  return (
    <span
      className={cn("text-[9px] leading-none font-bold", color)}
      title={`WhatsApp: ${status}`}
    >
      W
    </span>
  )
}

const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

function isImageType(fileType: string): boolean {
  return fileType.startsWith("image/")
}

function isVideoType(fileType: string): boolean {
  return fileType.startsWith("video/")
}

function isAudioType(fileType: string): boolean {
  return fileType.startsWith("audio/")
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export const MessageBubble = memo(function MessageBubble({
  message,
  currentUserId,
  locale = "en",
  isStarred = false,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRemoveReaction,
  onForward,
  onStar,
  onUnstar,
  onRetry,
  showAvatar = false,
  showSenderName = true,
  showTimestamp = true,
  showTail = true,
  isFirstInGroup = true,
  isLastInGroup = true,
}: MessageBubbleOptimizedProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const [showReactions, setShowReactions] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioSpeed, setAudioSpeed] = useState(1)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const toggleAudio = useCallback(
    (attachmentId: string, url: string) => {
      if (playingAudioId === attachmentId && audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
        setPlayingAudioId(null)
        setAudioProgress(0)
        setAudioDuration(0)
        return
      }
      // Stop any existing playback
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      const audio = new Audio(url)
      audio.playbackRate = audioSpeed
      audio.onloadedmetadata = () => setAudioDuration(audio.duration)
      audio.ontimeupdate = () => {
        if (audio.duration) setAudioProgress(audio.currentTime / audio.duration)
      }
      audio.onended = () => {
        audioRef.current = null
        setPlayingAudioId(null)
        setAudioProgress(0)
      }
      audio.play()
      audioRef.current = audio
      setPlayingAudioId(attachmentId)
    },
    [playingAudioId, audioSpeed]
  )

  const cycleAudioSpeed = useCallback(() => {
    const speeds = [1, 1.5, 2]
    const next = speeds[(speeds.indexOf(audioSpeed) + 1) % speeds.length]
    setAudioSpeed(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }, [audioSpeed])

  const isOwnMessage = message.senderId === currentUserId
  const isDeleted = message.isDeleted
  const isEdited = message.isEdited && !isDeleted
  const isPending = message.status === "sending"
  const dateLocale = locale === "ar" ? ar : enUS

  // Detect if message is media-only (image/video with no text)
  const hasMedia =
    message.attachments?.some(
      (a) => isImageType(a.fileType) || isVideoType(a.fileType)
    ) ?? false
  const isMediaOnly = hasMedia && !message.content?.trim()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({ title: m?.ui?.copied || "Copied" })
    } catch {
      toast({ title: m?.ui?.copy_failed || "Failed to copy" })
    }
  }

  const handleReactionClick = (emoji: string) => {
    const existingReaction = message.reactions.find(
      (r) => r.userId === currentUserId && r.emoji === emoji
    )

    if (existingReaction) {
      onRemoveReaction?.(existingReaction.id)
    } else {
      onReact?.(message.id, emoji)
    }
  }

  // Group reactions by emoji
  const reactionGroups = message.reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = []
      }
      acc[reaction.emoji].push(reaction)
      return acc
    },
    {} as Record<string, typeof message.reactions>
  )

  const hasReactions = Object.keys(reactionGroups).length > 0

  return (
    <div
      className={cn(
        "group flex w-full px-4",
        isOwnMessage ? "justify-end" : "justify-start",
        isLastInGroup ? "pb-[3px]" : "pb-[1px]"
      )}
    >
      <div
        className={cn(
          "flex gap-1.5",
          isOwnMessage ? "flex-row-reverse" : "flex-row",
          "max-w-[65%] md:max-w-[60%]"
        )}
      >
        {/* Avatar — only for received messages in groups, on first message */}
        {!isOwnMessage && showAvatar && isFirstInGroup && (
          <Avatar className="h-7 w-7 flex-shrink-0 self-start">
            <AvatarImage
              src={message.sender.image || undefined}
              alt={message.sender.username || ""}
            />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {message.sender.username?.[0]?.toUpperCase() ||
                message.sender.email?.[0]?.toUpperCase() ||
                "U"}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Spacer when no avatar to maintain alignment */}
        {!isOwnMessage && showAvatar && !isFirstInGroup && (
          <div className="h-7 w-7 flex-shrink-0" />
        )}

        <div
          className={cn(
            "flex flex-col",
            isOwnMessage ? "items-end" : "items-start"
          )}
        >
          {/* Sender name — group chats, first message in group */}
          {!isOwnMessage && showSenderName && isFirstInGroup && (
            <span
              className={cn(
                "mb-0.5 px-2 text-xs font-medium",
                getSenderColor(message.senderId)
              )}
            >
              {message.sender.username || message.sender.email}
            </span>
          )}

          {/* Reply context */}
          {message.replyTo && (
            <div
              className={cn(
                "mb-0.5 max-w-full rounded-lg border-s-2 px-2.5 py-1 text-xs",
                isOwnMessage
                  ? "border-msg-incoming/60 bg-msg-outgoing/80"
                  : "border-msg-unread-badge bg-msg-incoming/80"
              )}
            >
              <p
                className={cn(
                  "mb-0.5 text-[10px] font-medium",
                  getSenderColor(message.replyTo.senderId)
                )}
              >
                {message.replyTo.sender.username ||
                  message.replyTo.sender.email}
              </p>
              <p className="text-muted-foreground truncate">
                {message.replyTo.isDeleted
                  ? m?.ui?.message_deleted || "Message deleted"
                  : message.replyTo.content}
              </p>
            </div>
          )}

          {/* Message bubble */}
          <div className="group/bubble relative">
            <div
              className={cn(
                "relative break-words",
                // Own messages use tighter corners (WhatsApp-style),
                // received messages keep the softer rounding.
                isOwnMessage ? "rounded-sm" : "rounded-md",
                isMediaOnly ? "p-[3px]" : "px-2.5 py-1.5",
                isOwnMessage ? "text-foreground" : "text-foreground bg-white",
                isDeleted && "italic opacity-60",
                isPending && ""
              )}
              style={isOwnMessage ? { backgroundColor: "#D9FDD4" } : undefined}
            >
              {/* Forwarded label */}
              {message.forwardedFromId && !isDeleted && (
                <div className="text-msg-timestamp flex items-center gap-1 px-2 pt-1.5 text-[11px] italic">
                  <Forward className="h-3 w-3" />
                  <span>{m?.ui?.forwarded || "Forwarded"}</span>
                </div>
              )}

              {/* Star indicator */}
              {isStarred && !isDeleted && (
                <Star className="text-msg-timestamp absolute end-1 top-1 h-3 w-3" />
              )}

              {/* Message content */}
              {isDeleted ? (
                <span className="text-muted-foreground text-sm">
                  {m?.ui?.this_message_deleted || "This message was deleted"}
                </span>
              ) : (
                <>
                  {/* Attachments FIRST — WhatsApp stacks caption below the image */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div
                      className={cn(
                        "space-y-0.5",
                        hasMedia ? "-mx-[7px] -mt-[3px]" : "-mx-2 -mt-1.5 mb-1"
                      )}
                    >
                      {message.attachments.map((attachment) => {
                        // Inline images — click opens lightbox
                        if (isImageType(attachment.fileType)) {
                          return (
                            <button
                              key={attachment.id}
                              type="button"
                              onClick={() => setLightboxUrl(attachment.url)}
                              className="relative block w-full cursor-pointer overflow-hidden rounded-md text-start"
                            >
                              <img
                                src={attachment.thumbnail || attachment.url}
                                alt={attachment.fileName}
                                className="max-h-[330px] min-h-[100px] w-full object-cover"
                                loading="lazy"
                              />
                            </button>
                          )
                        }

                        // Inline videos
                        if (isVideoType(attachment.fileType)) {
                          return (
                            <a
                              key={attachment.id}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative block overflow-hidden rounded-md"
                            >
                              {attachment.thumbnail ? (
                                <img
                                  src={attachment.thumbnail}
                                  alt={attachment.fileName}
                                  className="max-h-[330px] min-h-[100px] w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="bg-foreground/10 flex h-[200px] w-full items-center justify-center">
                                  <Play className="h-12 w-12 text-white drop-shadow-lg" />
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40">
                                  <Play className="h-6 w-6 text-white" />
                                </div>
                              </div>
                              <div className="absolute start-2 bottom-2 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-white">
                                {formatFileSize(attachment.fileSize)}
                              </div>
                            </a>
                          )
                        }

                        // Audio messages — WhatsApp-style with progress, speed, duration
                        if (isAudioType(attachment.fileType)) {
                          const isPlaying = playingAudioId === attachment.id
                          const progress = isPlaying ? audioProgress : 0
                          const duration = isPlaying ? audioDuration : 0
                          return (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-3 px-2 py-2"
                            >
                              <button
                                onClick={() =>
                                  toggleAudio(attachment.id, attachment.url)
                                }
                                className="bg-msg-unread-badge flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white"
                              >
                                {isPlaying ? (
                                  <Pause className="h-5 w-5" />
                                ) : (
                                  <Play className="h-5 w-5 ps-0.5" />
                                )}
                              </button>
                              <div className="flex flex-1 flex-col gap-1">
                                {/* Progress bar */}
                                <div className="bg-foreground/20 relative h-1.5 w-full cursor-pointer rounded-full">
                                  <div
                                    className="bg-msg-unread-badge h-1.5 rounded-full transition-all duration-100"
                                    style={{
                                      width: `${Math.max(progress * 100, 0)}%`,
                                    }}
                                  />
                                  {/* Thumb indicator */}
                                  {isPlaying && (
                                    <div
                                      className="bg-msg-unread-badge absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full shadow-sm"
                                      style={{
                                        left: `calc(${progress * 100}% - 6px)`,
                                      }}
                                    />
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-msg-timestamp text-[11px]">
                                    {isPlaying && duration > 0
                                      ? formatDuration(progress * duration)
                                      : formatFileSize(attachment.fileSize)}
                                  </span>
                                  {isPlaying && duration > 0 && (
                                    <span className="text-msg-timestamp text-[11px]">
                                      {formatDuration(duration)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Speed toggle */}
                              {isPlaying && (
                                <button
                                  onClick={cycleAudioSpeed}
                                  className="bg-foreground/10 hover:bg-foreground/20 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors"
                                >
                                  {audioSpeed}x
                                </button>
                              )}
                            </div>
                          )
                        }

                        // File attachments — WhatsApp document card
                        return (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-foreground/5 hover:bg-foreground/10 mx-2 mt-1.5 flex items-center gap-3 rounded-lg p-2.5 transition-colors"
                          >
                            <div className="bg-msg-unread-badge/20 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded">
                              <FileText className="text-msg-unread-badge h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {attachment.fileName}
                              </p>
                              <p className="text-msg-timestamp text-xs">
                                {formatFileSize(attachment.fileSize)} &middot;{" "}
                                {attachment.fileType
                                  .split("/")[1]
                                  ?.toUpperCase() || "FILE"}
                              </p>
                            </div>
                            <Download className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                          </a>
                        )
                      })}
                    </div>
                  )}

                  {/* Link preview — from OG metadata stored in message.metadata */}
                  {(message.metadata as Record<string, unknown>)
                    ?.linkPreview && (
                    <LinkPreview
                      preview={
                        (message.metadata as Record<string, unknown>)
                          .linkPreview as LinkPreviewData
                      }
                      isOwnMessage={isOwnMessage}
                    />
                  )}

                  {/* Caption + timestamp share a single row (WhatsApp style).
                     For media-only messages the timestamp floats on the image;
                     everywhere else it sits inline at the end of the caption row. */}
                  {(() => {
                    const timestampNode = showTimestamp ? (
                      <>
                        {isEdited && (
                          <span className="me-0.5">
                            {m?.ui?.edited || "edited"}
                          </span>
                        )}
                        <span>
                          {format(new Date(message.createdAt), "p", {
                            locale: dateLocale,
                          })}
                        </span>
                        {isOwnMessage && (
                          <span className="ms-0.5 flex items-center gap-0.5">
                            <ReadReceiptIcon status={message.status} />
                            {message.status === "failed" && onRetry && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onRetry(message.id)
                                }}
                                className="text-destructive hover:text-destructive/80 ms-0.5 text-[10px] underline"
                              >
                                {m?.ui?.retry || "Retry"}
                              </button>
                            )}
                            {message.whatsappStatus && (
                              <WhatsAppStatusIcon
                                status={message.whatsappStatus}
                              />
                            )}
                          </span>
                        )}
                      </>
                    ) : null

                    // Media-only: stamp floats on the image as a pill.
                    if (isMediaOnly) {
                      return timestampNode ? (
                        <span className="absolute end-2 bottom-2 flex items-center gap-0.5 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-white">
                          {timestampNode}
                        </span>
                      ) : null
                    }

                    // Caption + timestamp inline row. Caption flex-1, timestamp
                    // flex-shrink-0 stuck to the end. Long captions wrap; the
                    // timestamp stays anchored on the last line visually.
                    return (
                      <div
                        className={cn(
                          "flex items-end justify-end gap-2",
                          hasMedia && "pt-1"
                        )}
                      >
                        {message.content?.trim() && (
                          <p className="min-w-0 flex-1 text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                        {timestampNode && (
                          <span
                            className={cn(
                              "flex flex-shrink-0 items-center gap-0.5 self-end text-[11px]",
                              isOwnMessage
                                ? "text-foreground/40"
                                : "text-muted-foreground"
                            )}
                          >
                            {timestampNode}
                          </span>
                        )}
                      </div>
                    )
                  })()}
                </>
              )}
            </div>

            {/* Hover action — dropdown arrow at top corner */}
            {!isDeleted && (
              <div
                className={cn(
                  "absolute top-1 z-10 opacity-0 transition-opacity group-hover/bubble:opacity-100",
                  isOwnMessage ? "start-1" : "end-1"
                )}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full",
                        isOwnMessage
                          ? "bg-msg-outgoing/80 hover:bg-msg-outgoing"
                          : "bg-msg-incoming/80 hover:bg-msg-incoming"
                      )}
                    >
                      <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="bottom"
                    align={isOwnMessage ? "end" : "start"}
                    collisionPadding={16}
                    className="w-40"
                  >
                    <DropdownMenuItem
                      onClick={() => setShowReactions(!showReactions)}
                    >
                      <Smile className="me-2 h-4 w-4" />
                      {m?.actions?.react || "React"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReply?.(message)}>
                      <Reply className="me-2 h-4 w-4" />
                      {m?.actions?.reply || "Reply"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="me-2 h-4 w-4" />
                      {m?.actions?.copy || "Copy"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onForward?.(message)}>
                      <Forward className="me-2 h-4 w-4" />
                      {m?.actions?.forward || "Forward"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        isStarred
                          ? onUnstar?.(message.id)
                          : onStar?.(message.id)
                      }
                    >
                      <Star
                        className={cn(
                          "me-2 h-4 w-4",
                          isStarred && "fill-current"
                        )}
                      />
                      {isStarred
                        ? m?.actions?.unstar || "Unstar"
                        : m?.actions?.star || "Star"}
                    </DropdownMenuItem>
                    {isOwnMessage && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit?.(message)}>
                          <Pencil className="me-2 h-4 w-4" />
                          {m?.actions?.edit || "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete?.(message.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {m?.actions?.delete || "Delete"}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Reactions — below bubble, overlapping slightly */}
          {hasReactions && (
            <div className="ms-2 -mt-1.5 flex flex-wrap gap-1">
              {Object.entries(reactionGroups).map(([emoji, reactions]) => {
                const hasUserReacted = reactions.some(
                  (r) => r.userId === currentUserId
                )
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className={cn(
                      "bg-card border-border inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs shadow-sm transition-colors",
                      hasUserReacted &&
                        "border-msg-unread-badge bg-msg-unread-badge/10"
                    )}
                  >
                    <span>{emoji}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {reactions.length}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Quick reaction picker */}
          {showReactions && !isDeleted && (
            <div className="bg-card border-border mt-1 flex gap-1 rounded-full border px-2 py-1 shadow-lg">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleReactionClick(emoji)
                    setShowReactions(false)
                  }}
                  className="hover:bg-muted rounded-full p-1 text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Image lightbox */}
      {lightboxUrl && (
        <Dialog open onOpenChange={() => setLightboxUrl(null)}>
          <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-[90vw]">
            <DialogTitle className="sr-only">
              {m?.ui?.image_preview || "Image preview"}
            </DialogTitle>
            <img
              src={lightboxUrl}
              alt=""
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
})
