"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { Eye, FileText, RotateCw, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ConfidenceScoreDisplay,
  ProcessingStatusBadge,
} from "@/components/school-dashboard/shared"

import type { ProcessedDocument } from "./types"

interface DocumentCardProps {
  document: ProcessedDocument
  index: number
  dictionary: Record<string, any>
  onReprocess?: (url: string) => Promise<void>
  onReview?: (document: ProcessedDocument) => void
}

const docTypeLabels: Record<string, string> = {
  degree: "Degree",
  transcript: "Transcript",
  national_id: "National ID",
  resume: "Resume",
  bank_receipt: "Bank Receipt",
  other: "Document",
}

export function DocumentCard({
  document: doc,
  index,
  dictionary,
  onReprocess,
  onReview,
}: DocumentCardProps) {
  const [isPending, startTransition] = useTransition()
  const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(doc.url || "")

  const statusMap: Record<
    string,
    "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  > = {
    pending: "PENDING",
    processing: "PROCESSING",
    completed: "COMPLETED",
    failed: "FAILED",
  }

  const typeLabel =
    dictionary?.admission?.documentTypes?.[doc.type] ??
    docTypeLabels[doc.type] ??
    doc.type

  return (
    <div className="group hover:border-foreground/20 relative flex flex-col overflow-hidden rounded-lg border transition-colors">
      {/* Thumbnail / Icon */}
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-muted/30 flex h-28 items-center justify-center overflow-hidden"
      >
        {isImage ? (
          <img
            src={doc.url}
            alt={doc.fileName || `Document ${index + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <FileText className="text-muted-foreground h-10 w-10" />
        )}
      </a>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <p className="line-clamp-1 text-xs font-medium">
          {doc.fileName || `Document ${index + 1}`}
        </p>

        {/* Type badge */}
        <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
          {typeLabel}
        </span>

        {/* Status */}
        {doc.status && (
          <ProcessingStatusBadge
            status={statusMap[doc.status] ?? "PENDING"}
            dictionary={dictionary}
            className="w-fit text-[10px]"
          />
        )}

        {/* Confidence */}
        {doc.status === "completed" && doc.confidence != null && (
          <ConfidenceScoreDisplay
            confidence={doc.confidence}
            size="sm"
            dictionary={dictionary}
          />
        )}

        {/* Error */}
        {doc.status === "failed" && doc.error && (
          <p className="text-destructive line-clamp-2 text-[10px]">
            {doc.error}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-1 pt-1">
          {doc.status === "completed" && doc.extractedData && onReview && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px]"
              onClick={() => onReview(doc)}
            >
              <Eye className="mr-0.5 h-3 w-3" />
              {dictionary?.admission?.ai?.review ?? "Review"}
            </Button>
          )}
          {(doc.status === "failed" || doc.status === "completed") &&
            onReprocess && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px]"
                disabled={isPending}
                onClick={() => startTransition(() => onReprocess(doc.url))}
              >
                <RotateCw
                  className={cn("mr-0.5 h-3 w-3", isPending && "animate-spin")}
                />
                {dictionary?.admission?.ai?.reprocess ?? "Retry"}
              </Button>
            )}
          {!doc.status && onReprocess && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px]"
              disabled={isPending}
              onClick={() => startTransition(() => onReprocess(doc.url))}
            >
              <Sparkles className="mr-0.5 h-3 w-3" />
              {dictionary?.admission?.ai?.process ?? "Process"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
