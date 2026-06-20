"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Admin review queue for guardian "skip pickup" requests. Only APPROVED skips
// drop a student from the nightly run, so this is the safety gate.
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { reviewTransportSkip } from "../actions/skips"
import type { PendingTransportSkip } from "../actions/skips"

interface Props {
  skips: PendingTransportSkip[]
  locale: string
  dictionary: Dictionary
}

export function TripSkipApprovals({ skips, locale, dictionary }: Props) {
  const t = dictionary.transportation.trips.skipApprovals
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  })

  // Nothing pending → render nothing (keeps the trips page clean).
  if (skips.length === 0) return null

  function review(id: string, decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await reviewTransportSkip({ id, decision })
      if (result.success) {
        toast.success(decision === "APPROVED" ? t.approved : t.rejected)
        router.refresh()
      } else {
        toast.error(t.failed)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {skips.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0"
            >
              <div>
                <p className="font-medium">
                  {s.studentFirstName} {s.studentLastName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {fmt.format(new Date(s.dateFrom))}
                  {s.dateTo !== s.dateFrom
                    ? ` – ${fmt.format(new Date(s.dateTo))}`
                    : ""}
                  {s.description ? ` · ${s.description}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => review(s.id, "REJECTED")}
                  disabled={pending}
                >
                  {t.reject}
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => review(s.id, "APPROVED")}
                  disabled={pending}
                >
                  {t.approve}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
