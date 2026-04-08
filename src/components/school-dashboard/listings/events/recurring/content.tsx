// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { type Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
}

export default async function RecurringEventsContent({
  searchParams,
  dictionary,
}: Props) {
  const d = dictionary?.events

  return (
    <div className="space-y-6">
      <div className="space-y-2 p-1">
        <h3 className="text-lg font-semibold">
          {d?.recurring?.title || "Recurring Events"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {d?.recurring?.description ||
            "Manage recurring event patterns and schedules."}
        </p>
      </div>
    </div>
  )
}
