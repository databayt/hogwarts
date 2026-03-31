"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { deleteWhatsAppTemplate, saveWhatsAppTemplate } from "./actions"
import type { WhatsAppTemplateDTO } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

interface TemplatesListProps {
  templates: WhatsAppTemplateDTO[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: any
  locale: string
}

export function TemplatesList({
  templates,
  dictionary,
  locale,
}: TemplatesListProps) {
  const d: Dict | undefined = useMemo(
    () => dictionary?.school?.whatsapp,
    [dictionary]
  )

  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] =
    useState<WhatsAppTemplateDTO | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState("general")
  const [lang, setLang] = useState<"ar" | "en">((locale as "ar" | "en") || "ar")
  const [isActive, setIsActive] = useState(true)

  const resetForm = useCallback(() => {
    setName("")
    setContent("")
    setType("general")
    setLang((locale as "ar" | "en") || "ar")
    setIsActive(true)
    setEditingTemplate(null)
  }, [locale])

  const openCreateDialog = useCallback(() => {
    resetForm()
    setDialogOpen(true)
  }, [resetForm])

  const openEditDialog = useCallback((template: WhatsAppTemplateDTO) => {
    setEditingTemplate(template)
    setName(template.name)
    setContent(template.content)
    setType(template.type)
    setLang(template.lang as "ar" | "en")
    setIsActive(template.isActive)
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(() => {
    if (!name.trim() || !content.trim()) {
      toast.error(d?.toast?.fillRequired || "Please fill all required fields")
      return
    }

    startTransition(async () => {
      const result = await saveWhatsAppTemplate({
        id: editingTemplate?.id,
        name: name.trim(),
        content: content.trim(),
        type,
        lang,
        isActive,
      })

      if (result.success) {
        toast.success(
          editingTemplate
            ? d?.toast?.templateUpdated || "Template updated"
            : d?.toast?.templateCreated || "Template created"
        )
        setDialogOpen(false)
        resetForm()
      } else {
        toast.error(d?.toast?.templateSaveFailed || "Failed to save template")
      }
    })
  }, [
    name,
    content,
    type,
    lang,
    isActive,
    editingTemplate,
    d,
    resetForm,
    startTransition,
  ])

  const handleDelete = useCallback(
    (templateId: string) => {
      startTransition(async () => {
        const result = await deleteWhatsAppTemplate(templateId)
        if (result.success) {
          toast.success(d?.toast?.templateDeleted || "Template deleted")
        } else {
          toast.error(
            d?.toast?.templateDeleteFailed || "Failed to delete template"
          )
        }
      })
    },
    [d, startTransition]
  )

  const getTemplateTypeLabel = useCallback(
    (templateType: string) => {
      const labels: Record<string, string> = {
        general: d?.templateTypes?.general || "General",
        attendance: d?.templateTypes?.attendance || "Attendance",
        fee_reminder: d?.templateTypes?.feeReminder || "Fee Reminder",
        exam_notification:
          d?.templateTypes?.examNotification || "Exam Notification",
        announcement: d?.templateTypes?.announcement || "Announcement",
        event: d?.templateTypes?.event || "Event",
      }
      return labels[templateType] || templateType
    },
    [d]
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{d?.templates?.title || "Message Templates"}</CardTitle>
            <CardDescription>
              {d?.templates?.description ||
                "Create and manage reusable message templates"}
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="me-2 h-4 w-4" />
                {d?.templates?.add || "Add Template"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate
                    ? d?.templates?.editTitle || "Edit Template"
                    : d?.templates?.createTitle || "Create Template"}
                </DialogTitle>
                <DialogDescription>
                  {d?.templates?.formDescription ||
                    "Create a reusable message template with placeholders"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {d?.templates?.name || "Template Name"}
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      d?.templates?.namePlaceholder || "e.g., Fee Reminder"
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {d?.templates?.type || "Type"}
                    </label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">
                          {d?.templateTypes?.general || "General"}
                        </SelectItem>
                        <SelectItem value="attendance">
                          {d?.templateTypes?.attendance || "Attendance"}
                        </SelectItem>
                        <SelectItem value="fee_reminder">
                          {d?.templateTypes?.feeReminder || "Fee Reminder"}
                        </SelectItem>
                        <SelectItem value="exam_notification">
                          {d?.templateTypes?.examNotification ||
                            "Exam Notification"}
                        </SelectItem>
                        <SelectItem value="announcement">
                          {d?.templateTypes?.announcement || "Announcement"}
                        </SelectItem>
                        <SelectItem value="event">
                          {d?.templateTypes?.event || "Event"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {d?.templates?.language || "Language"}
                    </label>
                    <Select
                      value={lang}
                      onValueChange={(v) => setLang(v as "ar" | "en")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">
                          {d?.templates?.arabic || "Arabic"}
                        </SelectItem>
                        <SelectItem value="en">
                          {d?.templates?.english || "English"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {d?.templates?.content || "Content"}
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      d?.templates?.contentPlaceholder ||
                      "Type your template content..."
                    }
                    rows={5}
                  />
                  <p className="text-muted-foreground text-xs">
                    {d?.templates?.contentHelp ||
                      "Use {{name}}, {{date}}, {{amount}} as placeholders"}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <label className="text-sm font-medium">
                      {d?.templates?.active || "Active"}
                    </label>
                    <p className="text-muted-foreground text-xs">
                      {d?.templates?.activeDescription ||
                        "Inactive templates are hidden from the template picker"}
                    </p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">
                    {d?.common?.cancel || "Cancel"}
                  </Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={isPending}>
                  {isPending && (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  )}
                  {editingTemplate
                    ? d?.common?.save || "Save"
                    : d?.templates?.create || "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {templates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <FileText className="text-muted-foreground h-12 w-12" />
            <p className="text-muted-foreground text-sm">
              {d?.templates?.noTemplates ||
                "No templates yet. Create your first template."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-medium">{template.name}</h4>
                    <Badge variant="outline" className="shrink-0">
                      {getTemplateTypeLabel(template.type)}
                    </Badge>
                    <Badge variant="outline" className="shrink-0 uppercase">
                      {template.lang}
                    </Badge>
                    {!template.isActive && (
                      <Badge variant="secondary" className="shrink-0">
                        {d?.templates?.inactive || "Inactive"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {template.content}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(template)}
                    disabled={isPending}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                    onClick={() => handleDelete(template.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
