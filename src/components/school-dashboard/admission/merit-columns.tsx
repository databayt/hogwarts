"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import { updateApplicationScores, updateApplicationStatus } from "./actions"

export type MeritRow = {
  id: string
  applicationNumber: string
  applicantName: string
  firstName: string
  lastName: string
  applyingForClass: string
  category: string | null
  status: string
  meritScore: string | null
  meritRank: number | null
  entranceScore: string | null
  interviewScore: string | null
  campaignName: string
  campaignId: string
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "SELECTED":
      return "default"
    case "WAITLISTED":
      return "secondary"
    case "REJECTED":
      return "destructive"
    default:
      return "outline"
  }
}

// ---------------------------------------------------------------------------
// Score Entry Dialog
// ---------------------------------------------------------------------------

function ScoreEntryDialog({
  merit,
  open,
  onOpenChange,
  dictionary,
  onSaved,
}: {
  merit: MeritRow
  open: boolean
  onOpenChange: (open: boolean) => void
  dictionary: Dictionary["school"]["admission"]
  onSaved: () => void
}) {
  const t = dictionary
  const [isPending, startTransition] = useTransition()
  const [entrance, setEntrance] = useState(merit.entranceScore ?? "")
  const [interview, setInterview] = useState(merit.interviewScore ?? "")

  const handleSave = () => {
    startTransition(async () => {
      const entranceNum = entrance !== "" ? parseFloat(entrance) : null
      const interviewNum = interview !== "" ? parseFloat(interview) : null

      const result = await updateApplicationScores({
        id: merit.id,
        entranceScore: entranceNum,
        interviewScore: interviewNum,
      })
      if (result.success) {
        SuccessToast(t?.meritList?.scoresUpdated || "Scores updated")
        onOpenChange(false)
        onSaved()
      } else {
        ErrorToast(result.error || "Failed to update scores")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {t?.meritList?.editScores || "Edit Scores"} — {merit.applicantName}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="entrance-score">
              {t?.columns?.entrance || "Entrance Score"}
            </Label>
            <Input
              id="entrance-score"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={entrance}
              onChange={(e) => setEntrance(e.target.value)}
              placeholder="0–100"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="interview-score">
              {t?.columns?.interview || "Interview Score"}
            </Label>
            <Input
              id="interview-score"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={interview}
              onChange={(e) => setInterview(e.target.value)}
              placeholder="0–100"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t?.toolbar?.cancel || "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending
              ? t?.toolbar?.saving || "Saving…"
              : t?.toolbar?.save || "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Actions cell
// ---------------------------------------------------------------------------

function MeritActionsCell({
  merit,
  dictionary,
  locale,
}: {
  merit: MeritRow
  dictionary: Dictionary["school"]["admission"]
  locale: Locale
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false)
  const t = dictionary

  const onView = () => {
    router.push(`/${locale}/admission/applications/${merit.id}`)
  }

  const onStatusChange = (status: string) => {
    startTransition(async () => {
      const result = await updateApplicationStatus({
        id: merit.id,
        status,
      })
      if (result.success) {
        SuccessToast(t?.applicationDetail?.statusUpdated || "Status updated")
        router.refresh()
      } else {
        ErrorToast(
          t?.applicationDetail?.statusUpdateFailed ||
            result.error ||
            "Failed to update status"
        )
      }
    })
  }

  return (
    <>
      <ScoreEntryDialog
        merit={merit}
        open={scoreDialogOpen}
        onOpenChange={setScoreDialogOpen}
        dictionary={t}
        onSaved={() => router.refresh()}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
            <Ellipsis className="h-4 w-4" />
            <span className="sr-only">
              {t?.toolbar?.openMenu || "Open menu"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {t?.columns?.actions || "Actions"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onView}>
            {t?.meritList?.viewApplication || "View Application"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setScoreDialogOpen(true)}>
            <Pencil className="me-2 h-4 w-4" />
            {t?.meritList?.editScores || "Edit Scores"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onStatusChange("SELECTED")}>
            {t?.meritList?.markSelected || "Mark as Selected"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange("WAITLISTED")}>
            {t?.meritList?.markWaitlisted || "Mark as Waitlisted"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onStatusChange("REJECTED")}
          >
            {t?.meritList?.markRejected || "Mark as Rejected"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

// ---------------------------------------------------------------------------
// Inline score cell with click-to-edit
// ---------------------------------------------------------------------------

function EditableScoreCell({
  merit,
  field,
  dictionary,
}: {
  merit: MeritRow
  field: "entranceScore" | "interviewScore"
  dictionary: Dictionary["school"]["admission"]
}) {
  const [open, setOpen] = useState(false)
  const score = merit[field]

  return (
    <>
      <ScoreEntryDialog
        merit={merit}
        open={open}
        onOpenChange={setOpen}
        dictionary={dictionary}
        onSaved={() => {}}
      />
      <button
        className="hover:bg-muted group flex items-center gap-1 rounded px-1 transition-colors"
        onClick={() => setOpen(true)}
        title={dictionary?.meritList?.editScores || "Edit scores"}
      >
        {score ? (
          <span className="text-sm tabular-nums">
            {parseFloat(score).toFixed(1)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
        <Pencil className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    </>
  )
}

export const getMeritColumns = (
  dictionary: Dictionary["school"]["admission"],
  locale: Locale
): ColumnDef<MeritRow>[] => {
  const t = dictionary

  return [
    {
      accessorKey: "meritRank",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.rank || "Rank"}
        />
      ),
      cell: ({ getValue }) => {
        const rank = getValue<number | null>()
        return <span className="text-lg font-bold tabular-nums">#{rank}</span>
      },
    },
    {
      accessorKey: "applicantName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.applicant || "Applicant"}
        />
      ),
      meta: { label: t?.columns?.applicant || "Applicant", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "applicationNumber",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.applicationNumber || "Application #"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground font-mono text-sm">
          {getValue<string>()}
        </span>
      ),
    },
    // category column kept for display (shows school-configured category) but
    // the India-centric General/OBC/SC/ST filter options are removed.
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.category || "Category"}
        />
      ),
      cell: ({ getValue }) => {
        const category = getValue<string | null>()
        return category ? (
          <Badge variant="outline">{category}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
      // enableColumnFilter: false — no filter options; category is school-defined
      enableColumnFilter: false,
    },
    {
      accessorKey: "meritScore",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.score || "Merit Score"}
        />
      ),
      cell: ({ getValue }) => {
        const score = getValue<string | null>()
        return score ? (
          <span className="font-semibold tabular-nums">
            {parseFloat(score).toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "entranceScore",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.entrance || "Entrance"}
        />
      ),
      cell: ({ row }) => (
        <EditableScoreCell
          merit={row.original}
          field="entranceScore"
          dictionary={dictionary}
        />
      ),
    },
    {
      accessorKey: "interviewScore",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.interview || "Interview"}
        />
      ),
      cell: ({ row }) => (
        <EditableScoreCell
          merit={row.original}
          field="interviewScore"
          dictionary={dictionary}
        />
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t?.columns?.status || "Status"}
        />
      ),
      cell: ({ getValue }) => {
        const status = getValue<string>()
        const label = t?.status?.[status as keyof typeof t.status] || status
        return <Badge variant={getStatusVariant(status)}>{label}</Badge>
      },
      meta: {
        label: t?.columns?.status || "Status",
        variant: "select",
        options: [
          {
            label: t?.status?.SHORTLISTED || "Shortlisted",
            value: "SHORTLISTED",
          },
          { label: t?.status?.SELECTED || "Selected", value: "SELECTED" },
          { label: t?.status?.WAITLISTED || "Waitlisted", value: "WAITLISTED" },
          { label: t?.status?.REJECTED || "Rejected", value: "REJECTED" },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only">{t?.columns?.actions || "Actions"}</span>
      ),
      cell: ({ row }) => (
        <MeritActionsCell
          merit={row.original}
          dictionary={dictionary}
          locale={locale}
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}
