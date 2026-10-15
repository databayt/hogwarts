"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState, useTransition } from "react"
import type { NotificationTemplate } from "@prisma/client"
import { Pencil, Plus, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/components/internationalization/config"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import {
  enumLabel,
  fill,
  formatConsoleNumber,
} from "@/components/school-dashboard/school/format"

import { deleteTemplate } from "./actions"
import { TemplateFormDialog } from "./form"

interface Props {
  templates: NotificationTemplate[]
  lang: Locale
}

export function TemplateTable({ templates, lang }: Props) {
  const dictionary = useDictionaryFallback()
  const t = dictionary.schoolConsole.templates
  const [editTemplate, setEditTemplate] = useState<NotificationTemplate | null>(
    null
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!deleteId) return
    startTransition(async () => {
      try {
        await deleteTemplate(deleteId)
        setDeleteId(null)
      } catch (err) {
        console.error("deleteTemplate failed:", err)
        setDeleteError(t.deleteFailed)
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t.heading}</h3>
          <p className="text-muted-foreground text-sm">
            {fill(t.configuredCount, {
              count: formatConsoleNumber(templates.length, lang),
            })}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="me-2 h-4 w-4" />
          {t.createTemplate}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.columns.type}</TableHead>
              <TableHead>{t.columns.channel}</TableHead>
              <TableHead>{t.columns.title}</TableHead>
              <TableHead>{t.columns.status}</TableHead>
              <TableHead className="w-[100px]">{t.columns.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-8 text-center"
                >
                  {t.empty}
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    {enumLabel(t.types, template.type)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {enumLabel(t.channels, template.channel)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {template.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.active ? "default" : "secondary"}>
                      {template.active ? t.active : t.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditTemplate(template)}
                        aria-label={t.editTemplate}
                        title={t.editTemplate}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeleteError("")
                          setDeleteId(template.id)
                        }}
                        aria-label={t.deleteTemplate}
                        title={t.deleteTemplate}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <TemplateFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        lang={lang}
      />

      {/* Edit dialog */}
      {editTemplate && (
        <TemplateFormDialog
          open={!!editTemplate}
          onOpenChange={(open) => !open && setEditTemplate(null)}
          template={editTemplate}
          lang={lang}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTemplate}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteConfirm}</AlertDialogDescription>
            {deleteError && (
              <p className="text-sm text-red-500">{deleteError}</p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? t.deleting : t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
