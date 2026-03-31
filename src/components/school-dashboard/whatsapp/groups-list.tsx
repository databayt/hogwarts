"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { Loader2, Plus, Trash2, Users, Wand2 } from "lucide-react"
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
  createAutoGroup,
  createWhatsAppGroup,
  deleteWhatsAppGroup,
} from "./actions"
import type { WhatsAppGroupDTO } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

const GROUP_TYPE_STYLES: Record<string, string> = {
  section_parents:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  class_parents:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  teachers:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  announcement:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  custom: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

interface GroupsListProps {
  groups: WhatsAppGroupDTO[]
  isConnected: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: any
}

export function GroupsList({
  groups,
  isConnected,
  dictionary,
}: GroupsListProps) {
  const d: Dict | undefined = useMemo(
    () => dictionary?.school?.whatsapp,
    [dictionary]
  )

  const [isPending, startTransition] = useTransition()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [autoDialogOpen, setAutoDialogOpen] = useState(false)

  // Create group form state
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [groupType, setGroupType] = useState("custom")
  const [participants, setParticipants] = useState("")

  // Auto group form state
  const [autoType, setAutoType] = useState<"section_parents" | "class_parents">(
    "section_parents"
  )
  const [autoSectionId, setAutoSectionId] = useState("")
  const [autoClassId, setAutoClassId] = useState("")

  const activeGroups = useMemo(() => groups.filter((g) => g.isActive), [groups])

  const getGroupTypeLabel = useCallback(
    (type: string) => {
      const labels: Record<string, string> = {
        section_parents: d?.groupTypes?.sectionParents || "Section Parents",
        class_parents: d?.groupTypes?.classParents || "Class Parents",
        teachers: d?.groupTypes?.teachers || "Teachers",
        announcement: d?.groupTypes?.announcement || "Announcement",
        custom: d?.groupTypes?.custom || "Custom",
      }
      return labels[type] || type
    },
    [d]
  )

  const handleCreateGroup = useCallback(() => {
    const phoneList = participants
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean)

    if (!groupName || phoneList.length === 0) {
      toast.error(d?.toast?.fillRequired || "Please fill all required fields")
      return
    }

    startTransition(async () => {
      const result = await createWhatsAppGroup({
        name: groupName,
        description: groupDescription || undefined,
        type: groupType,
        participants: phoneList,
      })

      if (result.success) {
        toast.success(d?.toast?.groupCreated || "Group created successfully")
        setCreateDialogOpen(false)
        setGroupName("")
        setGroupDescription("")
        setGroupType("custom")
        setParticipants("")
      } else {
        toast.error(d?.toast?.groupCreateFailed || "Failed to create group")
      }
    })
  }, [groupName, groupDescription, groupType, participants, d, startTransition])

  const handleAutoGroup = useCallback(() => {
    startTransition(async () => {
      const result = await createAutoGroup({
        type: autoType,
        sectionId:
          autoType === "section_parents"
            ? autoSectionId || undefined
            : undefined,
        classId:
          autoType === "class_parents" ? autoClassId || undefined : undefined,
      })

      if (result.success) {
        toast.success(
          d?.toast?.autoGroupCreated || "Auto group created successfully"
        )
        setAutoDialogOpen(false)
        setAutoSectionId("")
        setAutoClassId("")
      } else {
        const errorMessages: Record<string, string> = {
          NO_GUARDIAN_PHONES:
            d?.toast?.noGuardianPhones || "No guardian phone numbers found",
          GROUP_ALREADY_EXISTS: d?.toast?.groupExists || "Group already exists",
        }
        toast.error(
          (result.code && errorMessages[result.code]) ||
            d?.toast?.autoGroupFailed ||
            "Failed to create auto group"
        )
      }
    })
  }, [autoType, autoSectionId, autoClassId, d, startTransition])

  const handleDeleteGroup = useCallback(
    (groupId: string) => {
      startTransition(async () => {
        const result = await deleteWhatsAppGroup(groupId)
        if (result.success) {
          toast.success(d?.toast?.groupDeleted || "Group deleted")
        } else {
          toast.error(d?.toast?.groupDeleteFailed || "Failed to delete group")
        }
      })
    },
    [d, startTransition]
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{d?.groups?.title || "WhatsApp Groups"}</CardTitle>
            <CardDescription>
              {d?.groups?.description || "Manage your school WhatsApp groups"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {/* Auto-create dialog */}
            <Dialog open={autoDialogOpen} onOpenChange={setAutoDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isConnected || isPending}
                >
                  <Wand2 className="me-2 h-4 w-4" />
                  {d?.groups?.autoCreate || "Auto-create"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {d?.groups?.autoCreateTitle ||
                      "Auto-create Group from Enrollment"}
                  </DialogTitle>
                  <DialogDescription>
                    {d?.groups?.autoCreateDescription ||
                      "Automatically create a WhatsApp group with guardian phone numbers from enrollment data"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {d?.groups?.type || "Group Type"}
                    </label>
                    <Select
                      value={autoType}
                      onValueChange={(v) =>
                        setAutoType(v as "section_parents" | "class_parents")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="section_parents">
                          {d?.groupTypes?.sectionParents || "Section Parents"}
                        </SelectItem>
                        <SelectItem value="class_parents">
                          {d?.groupTypes?.classParents || "Class Parents"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {autoType === "section_parents" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {d?.groups?.sectionId || "Section ID"}
                      </label>
                      <Input
                        value={autoSectionId}
                        onChange={(e) => setAutoSectionId(e.target.value)}
                        placeholder={
                          d?.groups?.sectionIdPlaceholder || "Enter section ID"
                        }
                      />
                    </div>
                  )}

                  {autoType === "class_parents" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {d?.groups?.classId || "Class ID"}
                      </label>
                      <Input
                        value={autoClassId}
                        onChange={(e) => setAutoClassId(e.target.value)}
                        placeholder={
                          d?.groups?.classIdPlaceholder || "Enter class ID"
                        }
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">
                      {d?.common?.cancel || "Cancel"}
                    </Button>
                  </DialogClose>
                  <Button onClick={handleAutoGroup} disabled={isPending}>
                    {isPending && (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    )}
                    {d?.groups?.create || "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Manual create dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!isConnected || isPending}>
                  <Plus className="me-2 h-4 w-4" />
                  {d?.groups?.createGroup || "Create Group"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {d?.groups?.createGroupTitle || "Create WhatsApp Group"}
                  </DialogTitle>
                  <DialogDescription>
                    {d?.groups?.createGroupDescription ||
                      "Create a new WhatsApp group with specified participants"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {d?.groups?.name || "Group Name"}
                    </label>
                    <Input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder={
                        d?.groups?.namePlaceholder || "e.g., Grade 1-A Parents"
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {d?.groups?.descriptionLabel || "Description"}
                    </label>
                    <Textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder={
                        d?.groups?.descriptionPlaceholder ||
                        "Optional group description"
                      }
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {d?.groups?.type || "Group Type"}
                    </label>
                    <Select value={groupType} onValueChange={setGroupType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="section_parents">
                          {d?.groupTypes?.sectionParents || "Section Parents"}
                        </SelectItem>
                        <SelectItem value="class_parents">
                          {d?.groupTypes?.classParents || "Class Parents"}
                        </SelectItem>
                        <SelectItem value="teachers">
                          {d?.groupTypes?.teachers || "Teachers"}
                        </SelectItem>
                        <SelectItem value="announcement">
                          {d?.groupTypes?.announcement || "Announcement"}
                        </SelectItem>
                        <SelectItem value="custom">
                          {d?.groupTypes?.custom || "Custom"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {d?.groups?.participants || "Participants"}
                    </label>
                    <Textarea
                      value={participants}
                      onChange={(e) => setParticipants(e.target.value)}
                      placeholder={
                        d?.groups?.participantsPlaceholder ||
                        "Enter phone numbers (E.164 format), one per line\n+966501234567\n+966509876543"
                      }
                      rows={4}
                    />
                    <p className="text-muted-foreground text-xs">
                      {d?.groups?.participantsHelp ||
                        "One phone number per line in E.164 format (e.g., +966501234567)"}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">
                      {d?.common?.cancel || "Cancel"}
                    </Button>
                  </DialogClose>
                  <Button onClick={handleCreateGroup} disabled={isPending}>
                    {isPending && (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    )}
                    {d?.groups?.create || "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {activeGroups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Users className="text-muted-foreground h-12 w-12" />
            <p className="text-muted-foreground text-sm">
              {d?.groups?.noGroups ||
                "No groups yet. Create your first group to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activeGroups.map((group) => (
              <div
                key={group.id}
                className="flex flex-col gap-3 rounded-lg border p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium">{group.name}</h4>
                    {group.description && (
                      <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
                    onClick={() => handleDeleteGroup(group.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      GROUP_TYPE_STYLES[group.type] || GROUP_TYPE_STYLES.custom
                    )}
                  >
                    {getGroupTypeLabel(group.type)}
                  </Badge>
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Users className="h-3 w-3" />
                    {group.memberCount} {d?.groups?.members || "members"}
                  </span>
                </div>

                {(group.sectionName || group.className) && (
                  <p className="text-muted-foreground text-xs">
                    {group.sectionName || group.className}
                  </p>
                )}

                <p className="text-muted-foreground mt-auto text-xs">
                  {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
