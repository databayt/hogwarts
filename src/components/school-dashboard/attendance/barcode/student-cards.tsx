"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * ID cards (admin): which card belongs to which student. One inset list
 * with search, "Add a card" (pick the section, then the student), export,
 * and import from a CSV through bulkImportBarcodes.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CreditCard, Download, Plus, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"

import {
  addStudentIdentifier,
  deleteStudentIdentifier,
  getAttendanceList,
  getSectionsForSelection,
  getStudentIdentifiers,
} from "../actions"
import { localCalendarDay } from "../core/local-date"
import { bulkImportBarcodes } from "./actions"

interface Card {
  id: string
  studentId: string
  studentName?: string
  value: string
  isActive: boolean
  expiresAt?: string
}

interface StudentCardsProps {
  t: Record<string, string>
  lang: string
}

const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""))

/**
 * A suggested card number. There is no server generator; uniqueness is
 * enforced when the card is saved ("already assigned" otherwise).
 */
function suggestCode(): string {
  const n = new Uint32Array(1)
  crypto.getRandomValues(n)
  return `STU${String(n[0] % 1_000_000_000).padStart(9, "0")}`
}

export function StudentCards({ t, lang }: StudentCardsProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const num = new Intl.NumberFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US")
  const dateFmt = new Intl.DateTimeFormat(
    lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { dateStyle: "medium" }
  )

  const load = useCallback(async () => {
    const res = await getStudentIdentifiers()
    if ("identifiers" in res && res.identifiers) {
      setCards(
        res.identifiers
          .filter((i) => i.type === "BARCODE")
          .map((i) => ({
            id: i.id,
            studentId: i.studentId,
            studentName: i.studentName,
            value: i.value,
            isActive: i.isActive,
            expiresAt: i.expiresAt,
          }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cards
    return cards.filter(
      (c) =>
        c.value.toLowerCase().includes(q) ||
        c.studentName?.toLowerCase().includes(q)
    )
  }, [cards, query])

  const remove = async (card: Card) => {
    const res = await deleteStudentIdentifier(card.id)
    if (res && "success" in res && res.success === false) {
      ErrorToast(t.removeFailed ?? "Couldn't remove the card.")
      return
    }
    setCards((c) => c.filter((x) => x.id !== card.id))
  }

  const exportCsv = () => {
    const rows = [
      ["student", "barcode", "expiry_date"],
      ...cards.map((c) => [
        c.studentName ?? c.studentId,
        c.value,
        c.expiresAt?.slice(0, 10) ?? "",
      ]),
    ]
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const url = URL.createObjectURL(
      new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    )
    const a = document.createElement("a")
    a.href = url
    a.download = "student-cards.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const importCsv = async (file: File) => {
    setImporting(true)
    try {
      const res = await bulkImportBarcodes(await file.text())
      if (!res.success || !("data" in res) || !res.data) {
        ErrorToast(t.importFailed ?? "Couldn't import the file.")
        return
      }
      const { successful, failed } = res.data
      ;(failed ? ErrorToast : SuccessToast)(
        fill(t.importResult ?? "{ok} cards added · {failed} skipped", {
          ok: num.format(successful),
          failed: num.format(failed),
        })
      )
      await load()
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const now = Date.now()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search ?? "Search by name or card number"}
          aria-label={t.search ?? "Search by name or card number"}
          className="h-9 w-full rounded-full sm:w-72"
        />
        <div className="ms-auto flex gap-2">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            <Upload className="size-4" />
            {t.import ?? "Import"}
          </Button>
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={exportCsv}
            disabled={cards.length === 0}
          >
            <Download className="size-4" />
            {t.export ?? "Export"}
          </Button>
          <Button className="rounded-full" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            {t.add ?? "Add a card"}
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importCsv(f)
          }}
        />
      </div>

      <section className="space-y-2">
        <h3 className="text-muted-foreground px-4 text-xs font-medium">
          {fill(t.count ?? "{n} cards", { n: num.format(cards.length) })}
        </h3>
        {loading ? null : filtered.length === 0 ? (
          <div className="bg-card flex flex-col items-center gap-2 rounded-2xl border px-4 py-10 text-center">
            <CreditCard className="text-muted-foreground size-6" />
            <p className="text-muted-foreground text-sm">
              {query
                ? (t.noMatch ?? "No card matches your search.")
                : (t.empty ?? "No cards yet. Add one, or import a file.")}
            </p>
          </div>
        ) : (
          <ul className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
            {filtered.map((c) => {
              const expired = c.expiresAt
                ? new Date(c.expiresAt).getTime() < now
                : false
              return (
                <li
                  key={c.id}
                  className="flex min-h-14 items-center gap-3 px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {c.studentName ?? c.studentId}
                    </p>
                    <p
                      className="text-muted-foreground font-mono text-xs"
                      dir="ltr"
                    >
                      {c.value}
                    </p>
                  </div>
                  <span
                    className={
                      expired || !c.isActive
                        ? "text-destructive text-xs"
                        : "text-muted-foreground text-xs"
                    }
                  >
                    {expired
                      ? (t.expired ?? "Expired")
                      : !c.isActive
                        ? (t.inactive ?? "Inactive")
                        : c.expiresAt
                          ? fill(t.until ?? "Until {date}", {
                              date: dateFmt.format(new Date(c.expiresAt)),
                            })
                          : (t.active ?? "Active")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => void remove(c)}
                    aria-label={t.remove ?? "Remove card"}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
        <p className="text-muted-foreground px-4 text-xs">
          {t.importHint ??
            "Import a CSV with columns: register number, card number, expiry date (optional)."}
        </p>
      </section>

      <AddCardDialog
        open={adding}
        onOpenChange={setAdding}
        t={t}
        lang={lang}
        onAdded={() => void load()}
      />
    </div>
  )
}

function AddCardDialog({
  open,
  onOpenChange,
  t,
  lang,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  t: Record<string, string>
  lang: string
  onAdded: () => void
}) {
  const [sections, setSections] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [sectionId, setSectionId] = useState("")
  const [students, setStudents] = useState<
    Array<{ studentId: string; name: string }>
  >([])
  const [studentId, setStudentId] = useState("")
  const [value, setValue] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || sections.length) return
    void getSectionsForSelection().then((res) => {
      if (res.success && res.data) setSections(res.data.sections)
    })
  }, [open, sections.length])

  useEffect(() => {
    setStudentId("")
    setStudents([])
    if (!sectionId) return
    void getAttendanceList({
      sectionId,
      date: localCalendarDay(),
      lang,
    }).then((res) => {
      if (res.success && res.data) setStudents(res.data.rows)
    })
  }, [sectionId, lang])

  const save = async () => {
    if (!studentId || !value.trim()) return
    setSaving(true)
    try {
      const res = await addStudentIdentifier({
        studentId,
        type: "BARCODE",
        value: value.trim(),
        isActive: true,
        expiresAt: expiresAt || undefined,
      })
      if (!res.success) {
        ErrorToast(
          res.error?.toLowerCase().includes("unique")
            ? (t.duplicate ?? "That card number is already in use.")
            : (t.addFailed ?? "Couldn't add the card.")
        )
        return
      }
      onOpenChange(false)
      setValue("")
      setExpiresAt("")
      setStudentId("")
      onAdded()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.add ?? "Add a card"}</DialogTitle>
          <DialogDescription>
            {t.addDesc ?? "Give a student a card they can scan at the desk."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t.section ?? "Section"}</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t.pickSection ?? "Choose a section"}
                />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.student ?? "Student"}</Label>
            <Select
              value={studentId}
              onValueChange={setStudentId}
              disabled={!sectionId}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t.pickStudent ?? "Choose a student"}
                />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.studentId} value={s.studentId}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.cardNumber ?? "Card number"}</Label>
            <div className="flex gap-2">
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="font-mono"
                dir="ltr"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setValue(suggestCode())}
              >
                {t.suggest ?? "Suggest"}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.expiry ?? "Expires (optional)"}</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel ?? "Cancel"}
          </Button>
          <Button
            onClick={() => void save()}
            disabled={saving || !studentId || !value.trim()}
          >
            {t.save ?? "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
