"use client"

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

type AuditLogWithPerformer = AuditLog & {
  performer: {
    id: string
    username: string | null
    email: string | null
    role: string
  }
}

interface Props {
  logs: AuditLogWithPerformer[]
  total: number
  lang: Locale
}

export function AuditTable({ logs, total, lang }: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLogWithPerformer | null>(
    null
  )

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Audit Log</h3>
            <p className="text-muted-foreground text-sm">
              {total} total events
            </p>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No audit events recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {log.performer.username || log.performer.email}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {log.performer.role}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.entityType && (
                        <span className="text-muted-foreground text-xs">
                          {log.entityType}
                          {log.entityId && `: ${log.entityId.slice(0, 8)}...`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(log.previousValue || log.newValue) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
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
            <DialogTitle>Audit Event Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Action</p>
                  <p className="font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">
                    {selectedLog.performer.username ||
                      selectedLog.performer.email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entity</p>
                  <p className="font-medium">
                    {selectedLog.entityType || "N/A"}
                    {selectedLog.entityId && ` (${selectedLog.entityId})`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedLog.ip && (
                  <div>
                    <p className="text-muted-foreground">IP Address</p>
                    <p className="font-medium">{selectedLog.ip}</p>
                  </div>
                )}
              </div>

              {selectedLog.previousValue && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    Previous Value
                  </p>
                  <pre className="bg-muted max-h-40 overflow-auto rounded p-3 text-xs">
                    {formatJson(selectedLog.previousValue)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    New Value
                  </p>
                  <pre className="bg-muted max-h-40 overflow-auto rounded p-3 text-xs">
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
