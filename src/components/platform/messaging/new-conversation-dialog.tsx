"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, MessageSquare, X, Check, Loader2 } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"
import type { ConversationType } from "./types"
import { CONVERSATION_TYPE_CONFIG } from "./config"
import { createConversation } from "./actions"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

type UserResult = {
  id: string
  username: string | null
  email: string | null
  image: string | null
  role: string
}

export interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale?: "ar" | "en"
  currentUserId: string
  onConversationCreated?: (conversationId: string) => void
}

export function NewConversationDialog({
  open,
  onOpenChange,
  locale = "en",
  currentUserId,
  onConversationCreated,
}: NewConversationDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([])
  const [conversationType, setConversationType] = useState<"direct" | "group">("direct")
  const [groupName, setGroupName] = useState("")

  // Debounced search function
  const searchUsers = useDebouncedCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        // Filter out current user and already selected users
        const filtered = data.users?.filter(
          (u: UserResult) => u.id !== currentUserId && !selectedUsers.find(s => s.id === u.id)
        ) || []
        setSearchResults(filtered)
      }
    } catch (error) {
      console.error("Failed to search users:", error)
    } finally {
      setIsSearching(false)
    }
  }, 300)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    searchUsers(value)
  }

  const handleSelectUser = (user: UserResult) => {
    if (conversationType === "direct") {
      // For direct messages, only one user
      setSelectedUsers([user])
    } else {
      // For groups, multiple users
      setSelectedUsers(prev => [...prev, user])
    }
    setSearchQuery("")
    setSearchResults([])
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId))
  }

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "الرجاء اختيار مستخدم واحد على الأقل" : "Please select at least one user",
      })
      return
    }

    if (conversationType === "group" && !groupName.trim()) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "الرجاء إدخال اسم المجموعة" : "Please enter a group name",
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await createConversation({
          type: conversationType,
          title: conversationType === "group" ? groupName : undefined,
          participantIds: selectedUsers.map(u => u.id),
        })

        if (result.success) {
          toast({
            title: locale === "ar" ? "تم بنجاح" : "Success",
            description: locale === "ar"
              ? conversationType === "direct" ? "تم إنشاء المحادثة" : "تم إنشاء المجموعة"
              : conversationType === "direct" ? "Conversation created" : "Group created",
          })

          onOpenChange(false)
          resetForm()

          if (onConversationCreated) {
            onConversationCreated(result.data.id)
          } else {
            router.push(`/messages?conversation=${result.data.id}`)
          }
        } else {
          toast({
            title: locale === "ar" ? "خطأ" : "Error",
            description: result.error,
          })
        }
      } catch (error) {
        toast({
          title: locale === "ar" ? "خطأ" : "Error",
          description: locale === "ar" ? "حدث خطأ أثناء الإنشاء" : "An error occurred",
        })
      }
    })
  }

  const resetForm = () => {
    setSearchQuery("")
    setSearchResults([])
    setSelectedUsers([])
    setGroupName("")
    setConversationType("direct")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {locale === "ar" ? "محادثة جديدة" : "New Conversation"}
          </DialogTitle>
          <DialogDescription>
            {locale === "ar"
              ? "ابدأ محادثة مباشرة أو أنشئ مجموعة"
              : "Start a direct message or create a group"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Conversation Type Tabs */}
          <Tabs value={conversationType} onValueChange={(v) => {
            setConversationType(v as "direct" | "group")
            setSelectedUsers([])
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="direct" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                {locale === "ar" ? "مباشر" : "Direct"}
              </TabsTrigger>
              <TabsTrigger value="group" className="gap-2">
                <Users className="h-4 w-4" />
                {locale === "ar" ? "مجموعة" : "Group"}
              </TabsTrigger>
            </TabsList>

            {/* Group Name Input */}
            <TabsContent value="group" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">
                  {locale === "ar" ? "اسم المجموعة" : "Group Name"}
                </Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={locale === "ar" ? "أدخل اسم المجموعة..." : "Enter group name..."}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <Badge
                  key={user.id}
                  variant="secondary"
                  className="pl-1 pr-2 py-1 gap-1"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{user.username || user.email}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveUser(user.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={locale === "ar" ? "ابحث عن مستخدم..." : "Search for a user..."}
              className="pl-9"
              disabled={conversationType === "direct" && selectedUsers.length > 0}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <ScrollArea className="h-48 rounded-md border border-border">
              <div className="p-2 space-y-1">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-md",
                      "hover:bg-accent transition-colors",
                      "text-left"
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>
                        {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {user.username || user.email}
                      </p>
                      {user.username && user.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Empty Search State */}
          {searchQuery && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              {locale === "ar" ? "لم يتم العثور على مستخدمين" : "No users found"}
            </div>
          )}

          {/* Initial State - Help Text */}
          {!searchQuery && selectedUsers.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {locale === "ar"
                ? conversationType === "direct"
                  ? "ابحث عن شخص لبدء محادثة"
                  : "ابحث عن أشخاص لإضافتهم إلى المجموعة"
                : conversationType === "direct"
                ? "Search for someone to start a conversation"
                : "Search for people to add to the group"}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {locale === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              isPending ||
              selectedUsers.length === 0 ||
              (conversationType === "group" && !groupName.trim())
            }
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : conversationType === "direct" ? (
              <MessageSquare className="h-4 w-4 mr-2" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            {locale === "ar"
              ? conversationType === "direct" ? "بدء المحادثة" : "إنشاء المجموعة"
              : conversationType === "direct" ? "Start Chat" : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
