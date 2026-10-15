"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import type { AuditLog } from "@prisma/client"
import { Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  formatConsoleDateTime,
  formatConsoleNumber,
} from "@/components/school-dashboard/school/format"

type AuditLogWithPerformer = AuditLog & {
  performer: {
    id: string
    username: string | null
    email: string | null
    role: string
  } | null
}

interface Props {
  logs: AuditLogWithPerformer[]
  total: number
  lang: Locale
}

export function AuditTable({ logs, total, lang }: Props) {
  const dictionary = useDictionaryFallback()
  const t = dictionary.schoolConsole.audit
  const [selectedLog, setSelectedLog] = useState<AuditLogWithPerformer | null>(
    null
  )

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t.title}</h3>
            <p className="text-muted-foreground text-sm">
              {fill(t.totalEvents, {
                count: formatConsoleNumber(total, lang),
              })}
            </p>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.columns.time}</TableHead>
                <TableHead>{t.columns.user}</TableHead>
                <TableHead>{t.columns.action}</TableHead>
                <TableHead>{t.columns.entity}</TableHead>
                <TableHead className="w-[60px]">
                  <span className="sr-only">{t.columns.details}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-8 text-center"
                  >
                    {t.empty}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatConsoleDateTime(log.createdAt, lang)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {log.performer ? (
                            <bdi dir="auto">
                              {log.performer.username || log.performer.email}
                            </bdi>
                          ) : (
                            t.system
                          )}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {log.performer
                            ? enumLabel(t.roles, log.performer.role)
                            : "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" dir="ltr">
                        {enumLabel(t.actions, log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.entityType && (
                        <span className="text-muted-foreground text-xs">
                          <bdi dir="ltr">
                            {log.entityType}
                            {log.entityId && `: ${log.entityId.slice(0, 8)}...`}
                          </bdi>
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(log.previousValue || log.newValue) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                          aria-label={t.viewDetails}
                          title={t.viewDetails}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.detailsTitle}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t.columns.action}</p>
                  <p className="font-medium" dir="ltr">
                    {enumLabel(t.actions, selectedLog.action)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.columns.user}</p>
                  <p className="font-medium">
                    {selectedLog.performer ? (
                      <bdi dir="auto">
                        {selectedLog.performer.username ||
                          selectedLog.performer.email}
                      </bdi>
                    ) : (
                      t.system
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.columns.entity}</p>
                  <p className="font-medium" dir="ltr">
                    {selectedLog.entityType || t.notAvailable}
                    {selectedLog.entityId && ` (${selectedLog.entityId})`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.columns.time}</p>
                  <p className="font-medium">
                    {formatConsoleDateTime(selectedLog.createdAt, lang)}
                  </p>
                </div>
                {selectedLog.ip && (
                  <div>
                    <p className="text-muted-foreground">{t.ipAddress}</p>
                    <p className="font-medium" dir="ltr">
                      {selectedLog.ip}
                    </p>
                  </div>
                )}
              </div>

              {selectedLog.previousValue && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    {t.previousValue}
                  </p>
                  <pre
                    dir="ltr"
                    className="bg-muted max-h-40 overflow-auto rounded p-3 text-start text-xs"
                  >
                    {formatJson(selectedLog.previousValue)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    {t.newValue}
                  </p>
                  <pre
                    dir="ltr"
                    className="bg-muted max-h-40 overflow-auto rounded p-3 text-start text-xs"
                  >
                    {formatJson(selectedLog.newValue)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function formatJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}
