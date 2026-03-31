"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { Loader2, MessageSquare, Phone, Send, Users } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { sendBroadcast, sendWhatsAppMessage } from "./actions"
import type { WhatsAppGroupDTO, WhatsAppMessageDTO } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

const MESSAGE_STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delivered:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  read: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

interface MessageComposerProps {
  groups: WhatsAppGroupDTO[]
  messages: WhatsAppMessageDTO[]
  isConnected: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: any
}

export function MessageComposer({
  groups,
  messages,
  isConnected,
  dictionary,
}: MessageComposerProps) {
  const d: Dict | undefined = useMemo(
    () => dictionary?.school?.whatsapp,
    [dictionary]
  )

  const [isPending, startTransition] = useTransition()
  const [recipientType, setRecipientType] = useState<"phone" | "group">("phone")
  const [phone, setPhone] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [content, setContent] = useState("")
  const [broadcastGroupIds, setBroadcastGroupIds] = useState<string[]>([])
  const [isBroadcastMode, setIsBroadcastMode] = useState(false)

  const activeGroups = useMemo(() => groups.filter((g) => g.isActive), [groups])

  const getStatusLabel = useCallback(
    (status: string) => {
      const labels: Record<string, string> = {
        pending: d?.messageStatus?.pending || "Pending",
        sent: d?.messageStatus?.sent || "Sent",
        delivered: d?.messageStatus?.delivered || "Delivered",
        read: d?.messageStatus?.read || "Read",
        failed: d?.messageStatus?.failed || "Failed",
      }
      return labels[status] || status
    },
    [d]
  )

  const handleSend = useCallback(() => {
    if (!content.trim()) {
      toast.error(d?.toast?.messageRequired || "Please enter a message")
      return
    }

    if (isBroadcastMode) {
      if (broadcastGroupIds.length === 0) {
        toast.error(
          d?.toast?.selectGroups || "Please select at least one group"
        )
        return
      }

      startTransition(async () => {
        const result = await sendBroadcast({
          groupIds: broadcastGroupIds,
          content: content.trim(),
        })

        if (result.success && result.data) {
          toast.success(
            `${d?.toast?.broadcastSent || "Broadcast sent"}: ${result.data.sent} ${d?.toast?.succeeded || "succeeded"}, ${result.data.failed} ${d?.toast?.failed || "failed"}`
          )
          setContent("")
          setBroadcastGroupIds([])
        } else {
          toast.error(d?.toast?.broadcastFailed || "Failed to send broadcast")
        }
      })
      return
    }

    if (recipientType === "phone" && !phone.trim()) {
      toast.error(d?.toast?.phoneRequired || "Please enter a phone number")
      return
    }
    if (recipientType === "group" && !selectedGroupId) {
      toast.error(d?.toast?.selectGroup || "Please select a group")
      return
    }

    startTransition(async () => {
      const result = await sendWhatsAppMessage({
        recipientPhone: recipientType === "phone" ? phone.trim() : undefined,
        groupId: recipientType === "group" ? selectedGroupId : undefined,
        content: content.trim(),
        contentType: "text",
      })

      if (result.success) {
        toast.success(d?.toast?.messageSent || "Message sent")
        setContent("")
        setPhone("")
      } else {
        const errorMessages: Record<string, string> = {
          RATE_LIMITED:
            d?.toast?.rateLimited || "Rate limit reached. Try again later.",
          NOT_CONNECTED: d?.toast?.notConnected || "WhatsApp is not connected",
        }
        toast.error(
          (result.code && errorMessages[result.code]) ||
            d?.toast?.messageFailed ||
            "Failed to send message"
        )
      }
    })
  }, [
    content,
    isBroadcastMode,
    broadcastGroupIds,
    recipientType,
    phone,
    selectedGroupId,
    d,
    startTransition,
  ])

  const toggleBroadcastGroup = useCallback((groupId: string) => {
    setBroadcastGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    )
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Composer */}
      <Card>
        <CardHeader>
          <CardTitle>{d?.messages?.compose || "Compose Message"}</CardTitle>
          <CardDescription>
            {d?.messages?.composeDescription ||
              "Send a message to a phone number or group"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={!isBroadcastMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsBroadcastMode(false)}
            >
              <MessageSquare className="me-2 h-4 w-4" />
              {d?.messages?.directMessage || "Direct"}
            </Button>
            <Button
              variant={isBroadcastMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsBroadcastMode(true)}
            >
              <Users className="me-2 h-4 w-4" />
              {d?.messages?.broadcast || "Broadcast"}
            </Button>
          </div>

          {!isBroadcastMode ? (
            <>
              {/* Recipient type */}
              <div className="flex gap-2">
                <Button
                  variant={recipientType === "phone" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecipientType("phone")}
                >
                  <Phone className="me-2 h-4 w-4" />
                  {d?.messages?.phone || "Phone"}
                </Button>
                <Button
                  variant={recipientType === "group" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecipientType("group")}
                >
                  <Users className="me-2 h-4 w-4" />
                  {d?.messages?.group || "Group"}
                </Button>
              </div>

              {recipientType === "phone" ? (
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={d?.messages?.phonePlaceholder || "+966501234567"}
                  dir="ltr"
                />
              ) : (
                <Select
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={d?.messages?.selectGroup || "Select a group"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.memberCount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          ) : (
            /* Broadcast group selection */
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {d?.messages?.selectGroups || "Select Groups"}
              </label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                {activeGroups.length === 0 ? (
                  <p className="text-muted-foreground py-2 text-center text-sm">
                    {d?.messages?.noGroups || "No groups available"}
                  </p>
                ) : (
                  activeGroups.map((group) => (
                    <label
                      key={group.id}
                      className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded px-2 py-1.5"
                    >
                      <input
                        type="checkbox"
                        checked={broadcastGroupIds.includes(group.id)}
                        onChange={() => toggleBroadcastGroup(group.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{group.name}</span>
                      <span className="text-muted-foreground ms-auto text-xs">
                        {group.memberCount}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Message content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              d?.messages?.messagePlaceholder || "Type your message..."
            }
            rows={4}
          />

          <Button
            onClick={handleSend}
            disabled={isPending || !isConnected || !content.trim()}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="me-2 h-4 w-4" />
            )}
            {isBroadcastMode
              ? `${d?.messages?.sendBroadcast || "Send Broadcast"} (${broadcastGroupIds.length})`
              : d?.messages?.send || "Send Message"}
          </Button>

          {!isConnected && (
            <p className="text-destructive text-center text-sm">
              {d?.messages?.connectFirst ||
                "Connect WhatsApp first to send messages"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent messages */}
      <Card>
        <CardHeader>
          <CardTitle>{d?.messages?.recent || "Recent Messages"}</CardTitle>
          <CardDescription>
            {d?.messages?.recentDescription || "Last 20 messages sent"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <MessageSquare className="text-muted-foreground h-12 w-12" />
              <p className="text-muted-foreground text-sm">
                {d?.messages?.noMessages || "No messages sent yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="space-y-1 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground truncate text-xs">
                      {message.groupName ||
                        message.recipientPhone ||
                        d?.messages?.unknown ||
                        "Unknown"}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "shrink-0 text-[10px]",
                        MESSAGE_STATUS_STYLES[message.status] ||
                          MESSAGE_STATUS_STYLES.pending
                      )}
                    >
                      {getStatusLabel(message.status)}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm">{message.content}</p>
                  <p className="text-muted-foreground text-xs">
                    {message.sentAt
                      ? new Date(message.sentAt).toLocaleString()
                      : new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
