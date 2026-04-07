"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ConfidenceScoreDisplay,
  ProcessingStatusBadge,
} from "@/components/school-dashboard/shared"

import type { ProcessedDocument } from "./types"

interface DocumentReviewPanelProps {
  document: ProcessedDocument
  dictionary: Record<string, any>
  onClose: () => void
}

export function DocumentReviewPanel({
  document: doc,
  dictionary,
  onClose,
}: DocumentReviewPanelProps) {
  const d = dictionary?.admission?.ai ?? {}

  return (
    <div className="bg-background fixed inset-y-0 end-0 z-50 w-full max-w-md overflow-y-auto border-l shadow-lg sm:w-96">
      {/* Header */}
      <div className="bg-background sticky top-0 z-10 flex items-center justify-between border-b p-4">
        <div>
          <h3 className="text-sm font-semibold">
            {d.extractedData ?? "Extracted Data"}
          </h3>
          <p className="text-muted-foreground text-xs">{doc.fileName}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Status + Confidence */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {doc.status && (
          <ProcessingStatusBadge
            status={
              doc.status === "completed"
                ? "COMPLETED"
                : doc.status === "failed"
                  ? "FAILED"
                  : doc.status === "processing"
                    ? "PROCESSING"
                    : "PENDING"
            }
            dictionary={dictionary}
          />
        )}
        {doc.confidence != null && (
          <ConfidenceScoreDisplay
            confidence={doc.confidence}
            dictionary={dictionary}
          />
        )}
      </div>

      {/* Extracted Fields */}
      <div className="space-y-1 p-4">
        {doc.extractedData ? (
          <ExtractedFieldsList
            data={doc.extractedData as Record<string, unknown>}
            dictionary={dictionary}
          />
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {d.noData ?? "No extracted data available"}
          </p>
        )}
      </div>
    </div>
  )
}

function ExtractedFieldsList({
  data,
  dictionary,
}: {
  data: Record<string, unknown>
  dictionary: Record<string, any>
}) {
  const entries = Object.entries(data).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  )

  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        {dictionary?.admission?.ai?.noFields ?? "No fields extracted"}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="py-1">
          <span className="text-muted-foreground text-xs capitalize">
            {formatFieldName(key)}
          </span>
          {Array.isArray(value) ? (
            <div className="mt-1 space-y-1">
              {value.map((item, i) =>
                typeof item === "object" && item !== null ? (
                  <div
                    key={i}
                    className="bg-muted/30 rounded border p-2 text-xs"
                  >
                    {Object.entries(item)
                      .filter(([, v]) => v != null && v !== "")
                      .map(([k, v]) => (
                        <div key={k}>
                          <span className="text-muted-foreground capitalize">
                            {formatFieldName(k)}:
                          </span>{" "}
                          {String(v)}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p key={i} className="text-sm">
                    {String(item)}
                  </p>
                )
              )}
            </div>
          ) : (
            <p className="text-sm font-medium">{String(value)}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
}
