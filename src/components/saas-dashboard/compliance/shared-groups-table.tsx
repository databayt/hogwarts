"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ComplianceProvider } from "@prisma/client"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { createSharedCredentialGroup } from "@/components/school-dashboard/compliance/actions"
import { resolveComplianceError } from "@/components/school-dashboard/compliance/error-map"

type ComplianceDict = NonNullable<Dictionary["compliance"]>

interface GroupRow {
  id: string
  name: string
  provider: ComplianceProvider
  keyVersion: number
  circuitBreakerState: string
  recentFailures: number
  circuitOpenedAt: Date | null
  rotatedAt: Date | null
  lastUsedAt: Date | null
  createdAt: Date
  schoolCount: number
}

interface SharedGroupsTableProps {
  dict: ComplianceDict
  groups: GroupRow[]
}

const BREAKER_VARIANT: Record<string, "default" | "outline" | "destructive"> = {
  CLOSED: "default",
  HALF_OPEN: "outline",
  OPEN: "destructive",
}

export function SharedGroupsTable({ dict, groups }: SharedGroupsTableProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [provider, setProvider] = useState<ComplianceProvider>(
    ComplianceProvider.ADEK_ESIS
  )
  const [secretJson, setSecretJson] = useState(
    '{"username": "", "password": "", "esisLoginUrl": ""}'
  )
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await createSharedCredentialGroup({
        name,
        provider,
        secretJson,
      })
      if (result.success) {
        toast.success("Group created")
        setOpen(false)
        setName("")
        setSecretJson('{"username": "", "password": "", "esisLoginUrl": ""}')
        router.refresh()
      } else {
        toast.error(resolveComplianceError(dict, result.errorCode))
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add credential group</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>New shared credential group</DialogTitle>
                <DialogDescription>
                  Secret is encrypted server-side with AES-256-GCM before
                  storage. The plaintext is never logged. Only the
                  COMPLIANCE_ENCRYPTION_KEY can decrypt it.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Label htmlFor="name">Group name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Aldar Education Group"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Regulator</Label>
                <Select
                  value={provider}
                  onValueChange={(value) =>
                    setProvider(value as ComplianceProvider)
                  }
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ComplianceProvider.ADEK_ESIS}>
                      {dict.providers.ADEK_ESIS}
                    </SelectItem>
                    <SelectItem value={ComplianceProvider.CUSTOM}>
                      {dict.providers.CUSTOM}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">Credentials JSON</Label>
                <Textarea
                  id="secret"
                  rows={6}
                  value={secretJson}
                  onChange={(event) => setSecretJson(event.target.value)}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">
            No shared credential groups yet.
          </p>
        </div>
      ) : (
        <div className="bg-card overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Regulator</TableHead>
                <TableHead>Schools</TableHead>
                <TableHead>Breaker</TableHead>
                <TableHead>Failures</TableHead>
                <TableHead>Key v</TableHead>
                <TableHead>Last used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell>{dict.providers[g.provider]}</TableCell>
                  <TableCell>{g.schoolCount}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        BREAKER_VARIANT[g.circuitBreakerState] ?? "outline"
                      }
                    >
                      {dict.circuitBreaker[
                        g.circuitBreakerState as keyof typeof dict.circuitBreaker
                      ] ?? g.circuitBreakerState}
                    </Badge>
                  </TableCell>
                  <TableCell>{g.recentFailures}</TableCell>
                  <TableCell>{g.keyVersion}</TableCell>
                  <TableCell>
                    {g.lastUsedAt ? (
                      g.lastUsedAt.toISOString().slice(0, 10)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
