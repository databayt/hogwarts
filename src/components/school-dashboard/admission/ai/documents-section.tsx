"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { FileText } from "lucide-react"

import { DocumentReviewPanel } from "./document-review-panel"
import type { ProcessedDocument } from "./types"

interface DocumentsSectionProps {
  documents: ProcessedDocument[]
  photoUrl?: string | null
  signatureUrl?: string | null
  dictionary: Record<string, any>
  applicationId: string
}

const defaultDocTypeLabels: Record<string, string> = {
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
            <div className="group-hover:border-foreground/30 h-24 w-24 overflow-hidden rounded-full border-2 transition-colors">
              <img
                src={photoUrl}
                alt={t?.photo || "Photo"}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-xs font-medium">{t?.photo || "Photo"}</p>
          </a>
        )}
        {/* Signature — thumbnail card with glass label */}
        {signatureUrl && (
          <a
            href={signatureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex h-32 items-center overflow-hidden rounded-lg border transition-colors"
          >
            <img
              src={signatureUrl}
              alt={t?.signature || "Signature"}
              className="h-full w-full object-cover"
            />
            <p
              className="absolute inset-x-0 bottom-0 z-10 truncate px-2 pt-4 pb-1.5 text-center text-sm font-medium text-black dark:text-white"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 40%, transparent 100%)",
                backdropFilter: "blur(8px) saturate(110%)",
                WebkitBackdropFilter: "blur(8px) saturate(110%)",
                maskImage:
                  "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
              }}
            >
              {t?.signature || "Signature"}
            </p>
          </a>
        )}
        {/* Documents — thumbnail card with glass label */}
        {documents.map((doc, i) => {
          const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(doc.url || "")
          const typeLabel =
            dictionary?.admission?.documentTypes?.[doc.type] ??
            defaultDocTypeLabels[doc.type] ??
            doc.type
          const displayName =
            doc.fileName ||
            `${dictionary?.admission?.ai?.document ?? "Document"} ${i + 1}`

          const isPdf = /\.pdf$/i.test(doc.url || "")

          return (
            <a
              key={doc.url || i}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-32 items-center overflow-hidden rounded-lg border transition-colors"
              onClick={(e) => {
                if (doc.status === "completed" && doc.extractedData) {
                  e.preventDefault()
                  setReviewDoc(doc)
                }
              }}
            >
              {isImage ? (
                <img
                  src={doc.url}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : isPdf ? (
                <object
                  data={`${doc.url}#page=1&view=FitH`}
                  type="application/pdf"
                  className="pointer-events-none h-full w-full"
                  aria-label={displayName}
                >
                  <div className="flex h-full w-full items-center justify-center">
                    <FileText className="text-muted-foreground h-10 w-10" />
                  </div>
                </object>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FileText className="text-muted-foreground h-10 w-10" />
                </div>
              )}
              <p
                className="absolute inset-x-0 bottom-0 z-10 truncate px-2 pt-4 pb-1.5 text-center text-sm font-medium text-black dark:text-white"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 40%, transparent 100%)",
                  backdropFilter: "blur(8px) saturate(110%)",
                  WebkitBackdropFilter: "blur(8px) saturate(110%)",
                  maskImage:
                    "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
                }}
              >
                {typeLabel}
              </p>
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
