"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { FileText, Signature } from "lucide-react"

import { DocumentReviewPanel } from "./document-review-panel"
import type { ProcessedDocument } from "./types"

interface DocumentsSectionProps {
  documents: ProcessedDocument[]
  photoUrl?: string | null
  signatureUrl?: string | null
  dictionary: Record<string, any>
  applicationId: string
}

const docTypeLabels: Record<string, string> = {
  degree: "Degree",
  transcript: "Transcript",
  national_id: "National ID",
  resume: "Resume",
  bank_receipt: "Bank Receipt",
  other: "Document",
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {/* Photo — circle */}
        {photoUrl && (
          <a
            href={photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-36 flex-col items-center justify-center gap-2"
          >
            <div className="h-24 w-24 overflow-hidden rounded-full border-2 transition-colors group-hover:border-foreground/30">
              <img
                src={photoUrl}
                alt={t?.photo || "Photo"}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-xs font-medium">{t?.photo || "Photo"}</p>
          </a>
        )}
        {/* Signature — box with title at bottom */}
        {signatureUrl && (
          <a
            href={signatureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-36 flex-col items-center overflow-hidden rounded-lg border transition-colors hover:border-foreground/20"
          >
            <div className="bg-muted/30 flex flex-1 items-center justify-center p-4">
              <Signature className="text-muted-foreground h-10 w-10" />
            </div>
            <div className="w-full border-t px-2 py-2 text-center">
              <p className="text-xs font-medium">{t?.signature || "Signature"}</p>
            </div>
          </a>
        )}
        {/* Documents — image in circle, others in box with title at bottom */}
        {documents.map((doc, i) => {
          const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(doc.url || "")
          const typeLabel =
            dictionary?.admission?.documentTypes?.[doc.type] ??
            docTypeLabels[doc.type] ??
            doc.type
          const displayName = doc.fileName || `Document ${i + 1}`

          if (isImage) {
            return (
              <a
                key={doc.url || i}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-36 flex-col items-center justify-center gap-2"
                onClick={(e) => {
                  if (doc.status === "completed" && doc.extractedData) {
                    e.preventDefault()
                    setReviewDoc(doc)
                  }
                }}
              >
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 transition-colors group-hover:border-foreground/30">
                  <img
                    src={doc.url}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="line-clamp-1 max-w-full text-xs font-medium">
                  {typeLabel}
                </p>
              </a>
            )
          }

          return (
            <a
              key={doc.url || i}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-36 flex-col items-center overflow-hidden rounded-lg border transition-colors hover:border-foreground/20"
              onClick={(e) => {
                if (doc.status === "completed" && doc.extractedData) {
                  e.preventDefault()
                  setReviewDoc(doc)
                }
              }}
            >
              <div className="bg-muted/30 flex flex-1 items-center justify-center">
                <FileText className="text-muted-foreground h-10 w-10" />
              </div>
              <div className="w-full border-t px-2 py-2 text-center">
                <p className="line-clamp-1 text-xs font-medium">{typeLabel}</p>
              </div>
            </a>
          )
        })}
        {/* Empty state */}
        {!hasAnyContent && (
          <div className="col-span-full flex h-36 items-center justify-center rounded-lg border border-dashed">
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
