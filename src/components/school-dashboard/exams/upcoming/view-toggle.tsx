"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Toggle between list and calendar views
import { useState } from "react"
import { CalendarDays, List } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { CalendarExam } from "./calendar-view"
import { CalendarView } from "./calendar-view"

interface ViewToggleProps {
  exams: CalendarExam[]
  listView: React.ReactNode
}

export function ViewToggle({ exams, listView }: ViewToggleProps) {
  const [view, setView] = useState<"list" | "calendar">("list")

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex gap-1 rounded-md border p-0.5">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className="h-7 gap-1.5 px-2.5"
          >
            <List className="h-3.5 w-3.5" />
            List
          </Button>
          <Button
            variant={view === "calendar" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("calendar")}
            className="h-7 gap-1.5 px-2.5"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendar
          </Button>
        </div>
      </div>

      {view === "list" ? listView : <CalendarView exams={exams} />}
    </div>
  )
}
