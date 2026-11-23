"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// «مشرفو الحصص المباشرة» — an admin picks, per school stage, the people who are
// told when a class has no teacher (admins always are). One card per stage:
// chips for who is picked, a search box for who to add. Phone-first: cards
// stack, every tap target is 44px, only logical (start/end) classes.
import { useEffect, useRef, useState, useTransition } from "react"
import { Loader2, Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ErrorToast } from "@/components/atom/toast"

import {
  addLiveSupervisor,
  removeLiveSupervisor,
  searchSupervisorCandidates,
  type SupervisorPerson,
  type SupervisorsByStage,
} from "./actions/supervisors"
import { LIVE_STAGES, type LiveStage } from "./stage"

export interface SupervisorsLabels {
  title: string
  description: string
  stages: Record<LiveStage, string>
  roles: Record<string, string>
  search: string
  searchHint: string
  noResults: string
  none: string
  add: string
  remove: string
  error: string
}

function StageCard({
  stage,
  people,
  labels,
  onChange,
}: {
  stage: LiveStage
  people: SupervisorPerson[]
  labels: SupervisorsLabels
  onChange: (next: SupervisorPerson[]) => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SupervisorPerson[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [pending, startTransition] = useTransition()
  const requestId = useRef(0)
  const picked = new Set(people.map((p) => p.userId))

  // Debounced search: a slow reply never overwrites a newer one.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults(null)
      return
    }
    const id = ++requestId.current
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchSupervisorCandidates(q)
        if (id !== requestId.current) return
        setResults("success" in res && res.success ? res.data : [])
      } catch {
        if (id === requestId.current) setResults([])
      } finally {
        if (id === requestId.current) setSearching(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  function add(person: SupervisorPerson) {
    const before = people
    onChange([...people, person])
    setQuery("")
    setResults(null)
    startTransition(async () => {
      const res = await addLiveSupervisor(stage, person.userId)
      if (!("success" in res) || !res.success) {
        onChange(before)
        ErrorToast(labels.error)
      }
    })
  }

  function remove(person: SupervisorPerson) {
    const before = people
    onChange(people.filter((p) => p.userId !== person.userId))
    startTransition(async () => {
      const res = await removeLiveSupervisor(stage, person.userId)
      if (!("success" in res) || !res.success) {
        onChange(before)
        ErrorToast(labels.error)
      }
    })
  }

  const inputId = `supervisor-search-${stage}`
  const shown = (results ?? []).filter((r) => !picked.has(r.userId))

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="font-medium">{labels.stages[stage]}</p>

      {people.length === 0 ? (
        <p className="text-muted-foreground text-sm">{labels.none}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {people.map((p) => (
            <li
              key={p.userId}
              className="bg-muted flex min-h-11 items-center gap-1 rounded-full ps-4 pe-1 text-sm"
            >
              <span className="truncate">
                <bdi dir="auto">{p.name}</bdi>
                <span className="text-muted-foreground ms-1.5 text-xs">
                  {labels.roles[p.role] ?? p.role}
                </span>
              </span>
              <button
                type="button"
                className="hover:bg-background inline-flex size-11 shrink-0 items-center justify-center rounded-full"
                aria-label={labels.remove.replace("{name}", p.name)}
                disabled={pending}
                onClick={() => remove(p)}
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <label htmlFor={inputId} className="sr-only">
          {labels.search}
        </label>
        <div className="relative">
          <Input
            id={inputId}
            type="search"
            className="min-h-11"
            placeholder={labels.search}
            value={query}
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
          {searching ? (
            <Loader2
              className="text-muted-foreground absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin"
              aria-hidden
            />
          ) : null}
        </div>

        {results === null ? (
          query.trim().length > 0 ? (
            <p className="text-muted-foreground text-xs">{labels.searchHint}</p>
          ) : null
        ) : shown.length === 0 && !searching ? (
          <p className="text-muted-foreground text-sm">{labels.noResults}</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {shown.map((r) => (
              <li key={r.userId}>
                <button
                  type="button"
                  className={cn(
                    "hover:bg-muted flex min-h-11 w-full items-center justify-between gap-3 px-3 text-start text-sm"
                  )}
                  disabled={pending}
                  onClick={() => add(r)}
                >
                  <span className="truncate">
                    <bdi dir="auto">{r.name}</bdi>
                    <span className="text-muted-foreground ms-1.5 text-xs">
                      {labels.roles[r.role] ?? r.role}
                    </span>
                  </span>
                  <span className="text-primary flex shrink-0 items-center gap-1 text-xs font-medium">
                    <Plus className="size-4" aria-hidden />
                    {labels.add}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function LiveSupervisorsPanel({
  initial,
  labels,
}: {
  initial: SupervisorsByStage
  labels: SupervisorsLabels
}) {
  const [state, setState] = useState<SupervisorsByStage>(initial)
  return (
    <section className="w-full space-y-3 border-t pt-6">
      <div className="space-y-1">
        <h3 className="font-medium">{labels.title}</h3>
        <p className="text-muted-foreground text-sm">{labels.description}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {LIVE_STAGES.map((stage) => (
          <StageCard
            key={stage}
            stage={stage}
            people={state[stage]}
            labels={labels}
            onChange={(next) => setState((s) => ({ ...s, [stage]: next }))}
          />
        ))}
      </div>
    </section>
  )
}
