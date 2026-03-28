"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { FileText, Signature } from "lucide-react"

import { DocumentCard } from "./document-card"
import { DocumentReviewPanel } from "./document-review-panel"
import type { ProcessedDocument } from "./types"

interface DocumentsSectionProps {
  documents: ProcessedDocument[]
  photoUrl?: string | null
  signatureUrl?: string | null
  dictionary: Record<string, any>
  applicationId: string
}

export function DocumentsSection({
  documents,
  photoUrl,
  signatureUrl,
  dictionary,
  applicationId,
}: DocumentsSectionProps) {
  const [reviewDoc, setReviewDoc] = useState<ProcessedDocument | null>(null)
  const t = dictionary?.admission?.applicationDetail ?? {}

  const hasAnyContent = photoUrl || signatureUrl || documents.length > 0

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {/* Photo */}
        {photoUrl && (
          <a
            href={photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group hover:border-foreground/20 flex h-32 flex-col items-center justify-center overflow-hidden rounded-lg border transition-colors"
          >
            <img
              src={photoUrl}
              alt={t?.photo || "Photo"}
              className="h-full w-full object-cover"
            />
          </a>
        )}
        {/* Signature */}
        {signatureUrl && (
          <a
            href={signatureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group hover:border-foreground/20 flex h-32 flex-col items-center justify-center gap-2 rounded-lg border p-4 transition-colors"
          >
            <Signature className="text-muted-foreground h-8 w-8" />
            <p className="text-sm font-medium">{t?.signature || "Signature"}</p>
          </a>
        )}
        {/* AI-processed documents */}
        {documents.map((doc, i) => (
          <DocumentCard
            key={doc.url || i}
            document={doc}
            index={i}
            dictionary={dictionary}
            onReview={(d) => setReviewDoc(d)}
          />
        ))}
        {/* Empty state */}
        {!hasAnyContent && (
          <div className="col-span-full flex h-32 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground text-sm">
              {t?.noDocuments || "No documents uploaded"}
            </p>
          </div>
        )}
      </div>

      {/* Review Panel (slide-over) */}
      {reviewDoc && (
        <DocumentReviewPanel
          document={reviewDoc}
          dictionary={dictionary}
          onClose={() => setReviewDoc(null)}
        />
      )}
    </>
  )
}
