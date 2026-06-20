"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Guardian/student "skip pickup" control: request a day off the bus (creates a
// PENDING request an admin confirms) and withdraw still-pending requests.
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  cancelTransportSkip,
  requestTransportSkip,
  type MyTransportSkip,
} from "../actions/me"

interface Props {
  studentId: string
  skips: MyTransportSkip[]
  locale: string
  dictionary: Dictionary
}

export function TransportSkipControl({
  studentId,
  skips,
  locale,
  dictionary,
}: Props) {
  const t = dictionary.transportation.me.skip
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [date, setDate] = useState("")

  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  })

  function handleRequest() {
    if (!date) return
    startTransition(async () => {
      const result = await requestTransportSkip({
        studentId,
        dateFrom: new Date(date),
      })
      if (result.success) {
        toast.success(t.requested)
        setDate("")
        router.refresh()
      } else {
        toast.error(t.failed)
      }
    })
  }

  function handleCancel(id: string) {
    startTransition(async () => {
      const result = await cancelTransportSkip(id)
      if (result.success) {
        toast.success(t.cancelled)
        router.refresh()
      } else {
        toast.error(t.failed)
      }
    })
  }

  return (
    <section>
      <h3 className="mb-1 text-sm font-medium">{t.heading}</h3>
      <p className="text-muted-foreground mb-3 text-xs">{t.description}</p>

      <div className="flex items-end gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-[12rem]"
          aria-label={t.dateLabel}
        />
        <Button
          size="sm"
          type="button"
          onClick={handleRequest}
          disabled={pending || !date}
        >
          {t.request}
        </Button>
      </div>

      {skips.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-xs">{t.none}</p>
      ) : (
        <ul className="mt-3 space-y-1 text-sm">
          {skips.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between border-b py-1.5 last:border-b-0"
            >
              <span>
                {fmt.format(new Date(s.dateFrom))}
                {s.dateTo !== s.dateFrom
                  ? ` – ${fmt.format(new Date(s.dateTo))}`
                  : ""}
              </span>
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {t.status[s.status as keyof typeof t.status] ?? s.status}
                </Badge>
                {s.status === "PENDING" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => handleCancel(s.id)}
                    disabled={pending}
                  >
                    {t.cancel}
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
