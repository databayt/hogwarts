"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import {
  Calendar,
  Clock,
  Copy,
  FileText,
  MoreVertical,
  Plus,
  Star,
  Trash2,
  Users,
} from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

import {
  deleteTemplate,
  listTimetableTemplates,
  setDefaultTemplate,
} from "../actions"
import { ApplyTemplateDialog } from "./apply-template-dialog"
import { CreateTemplateDialog } from "./create-template-dialog"

interface Template {
  id: string
  name: string
  description: string | null
  version: number
  isDefault: boolean
  rotationType: string
  stats: {
    totalSlots: number
    classCount: number
    teacherCount: number
  }
  source: string | null
  createdBy: string | undefined
  createdAt: Date
}

interface TemplatesContentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary?: Record<string, any>
  termId: string
}

export function TemplatesContent({
  dictionary,
  termId,
}: TemplatesContentProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  )
  const { toast } = useToast()

  const t = dictionary?.templates || {}

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const result = await listTimetableTemplates()
      setTemplates(result.templates as Template[])
    } catch {
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const handleSetDefault = useCallback(
    (template: Template) => {
      startTransition(async () => {
        try {
          await setDefaultTemplate({ templateId: template.id })
          await loadTemplates()
          toast({
            title: "Success",
            description: `"${template.name}" is now the default template`,
          })
        } catch {
          toast({
            title: "Error",
            description: "Failed to set default template",
            variant: "destructive",
          })
        }
      })
    },
    [loadTemplates, toast]
  )

  const handleDelete = useCallback(
    (template: Template) => {
      if (!confirm(t.confirmDelete || `Delete template "${template.name}"?`)) {
        return
      }

      startTransition(async () => {
        try {
          await deleteTemplate({ templateId: template.id })
          await loadTemplates()
          toast({
            title: "Deleted",
            description: `Template "${template.name}" has been deleted`,
          })
        } catch {
          toast({
            title: "Error",
            description: "Failed to delete template",
            variant: "destructive",
          })
        }
      })
    },
    [loadTemplates, toast, t.confirmDelete]
  )

  const handleApply = useCallback((template: Template) => {
    setSelectedTemplate(template)
    setApplyDialogOpen(true)
  }, [])

  const getRotationLabel = (type: string) => {
    const labels = t.rotationType || {}
    switch (type) {
      case "SINGLE_WEEK":
        return labels.SINGLE_WEEK || "Single Week"
      case "BIWEEKLY":
        return labels.BIWEEKLY || "Bi-Weekly"
      case "ROTATING":
        return labels.ROTATING || "Rotating"
      default:
        return type
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>{t.title || "Timetable Templates"}</h2>
          <p className="text-muted-foreground">
            {t.description ||
              "Save and reuse timetable configurations across terms"}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          {t.createNew || "Create Template"}
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <FileText className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-4">{t.noTemplates || "No Templates Yet"}</h3>
            <p className="text-muted-foreground mt-2">
              {t.noTemplatesDescription ||
                "Create your first template from an existing term schedule"}
            </p>
            <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="me-2 h-4 w-4" />
              {t.createNew || "Create Template"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              {template.isDefault && (
                <Badge className="absolute end-3 top-3" variant="secondary">
                  <Star className="me-1 h-3 w-3" />
                  {t.defaultBadge || "Default"}
                </Badge>
              )}

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {template.name}
                </CardTitle>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted rounded-md p-2">
                    <p className="text-lg font-semibold">
                      {template.stats.totalSlots}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t.slots || "Slots"}
                    </p>
                  </div>
                  <div className="bg-muted rounded-md p-2">
                    <p className="text-lg font-semibold">
                      {template.stats.classCount}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t.classes || "Classes"}
                    </p>
                  </div>
                  <div className="bg-muted rounded-md p-2">
                    <p className="text-lg font-semibold">
                      {template.stats.teacherCount}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t.teachers || "Teachers"}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="text-muted-foreground space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {t.version || "Version"} {template.version}
                    </span>
                    <span className="mx-1">-</span>
                    <span>{getRotationLabel(template.rotationType)}</span>
                  </div>

                  {template.source && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {t.sourceTerm || "From"} {template.source}
                      </span>
                    </div>
                  )}

                  {template.createdBy && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {t.createdBy || "Created by"} {template.createdBy}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <span className="text-muted-foreground text-xs">
                  {formatDate(template.createdAt)}
                </span>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApply(template)}
                  >
                    <Copy className="me-2 h-4 w-4" />
                    {t.applyToTerm || "Apply"}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!template.isDefault && (
                        <DropdownMenuItem
                          onClick={() => handleSetDefault(template)}
                          disabled={isPending}
                        >
                          <Star className="me-2 h-4 w-4" />
                          {t.setAsDefault || "Set as Default"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(template)}
                        disabled={isPending}
                        className="text-destructive"
                      >
                        <Trash2 className="me-2 h-4 w-4" />
                        {t.delete || "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadTemplates}
        currentTermId={termId}
        dictionary={dictionary}
      />

      {selectedTemplate && (
        <ApplyTemplateDialog
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
          template={selectedTemplate}
          onSuccess={loadTemplates}
          dictionary={dictionary}
        />
      )}
    </div>
  )
}
