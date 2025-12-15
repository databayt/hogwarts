"use client"

import * as React from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { domainCreate } from "@/components/operator/domains/actions"

const schema = z.object({
  schoolId: z.string().min(1),
  domain: z.string().min(3),
  notes: z.string().optional(),
})

type Props = {
  tenants: Array<{ id: string; name: string }>
}

export function CreateDomainRequest({ tenants }: Props) {
  const [schoolId, setSchoolId] = React.useState(tenants[0]?.id ?? "")
  const [domain, setDomain] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = schema.safeParse({ schoolId, domain, notes })
    if (!parsed.success) return
    setSubmitting(true)
    try {
      const result = await domainCreate(parsed.data)
      if (result.success) {
        SuccessToast("Domain request created successfully")
        setDomain("")
        setNotes("")
      } else {
        ErrorToast(result.error.message)
      }
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : "Failed to create request")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="muted mb-1 block">School</label>
          <Select value={schoolId} onValueChange={setSchoolId}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select school" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-1">
          <label className="muted mb-1 block">Domain</label>
          <Input
            className="h-8"
            placeholder="example.school.app"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
        </div>
        <div className="md:col-span-1">
          <label className="muted mb-1 block">Notes</label>
          <Input
            className="h-8"
            placeholder="Optional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <Button size="sm" disabled={submitting || !schoolId || !domain}>
            Create request
          </Button>
        </div>
      </form>
    </Card>
  )
}
