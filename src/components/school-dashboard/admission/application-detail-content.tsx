// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Image from "next/image"
import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import type { Role } from "@/lib/rbac/types"
import { normalizeUploadUrl } from "@/lib/upload-url"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getFields } from "@/components/translation/display"

import { DocumentsSection } from "./ai/documents-section"
import type {
  DocumentProcessingStatus,
  ExtractedDocumentData,
  ProcessedDocument,
} from "./ai/types"
import ApplicationDetailActions from "./application-detail-actions"
import { getUIConfigForRole } from "./permissions"
import { getApplicationDetail } from "./queries"
import { ScoreEntryInline } from "./score-entry-inline"

// Legacy/loosely-typed shape of one entry in the raw Application.documents
// JSON blob, before the read-time AI-extraction merge below.
interface RawDocumentEntry {
  type?: string
  url?: string
  fileName?: string
  name?: string
  status?: string
  confidence?: number
  extractedData?: unknown
  jobId?: string
  error?: string
  processedAt?: string
}

const JOB_STATUS_MAP: Record<string, DocumentProcessingStatus> = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  applicationId: string
  dictionary: Dictionary["school"]
  lang: Locale
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusVariant(status: string) {
  switch (status) {
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "outline"
    case "SHORTLISTED":
    case "ENTRANCE_SCHEDULED":
    case "INTERVIEW_SCHEDULED":
      return "secondary"
    case "SELECTED":
    case "ADMITTED":
      return "default"
    case "WAITLISTED":
      return "outline"
    case "REJECTED":
    case "WITHDRAWN":
    case "EXPIRED":
      return "destructive"
    default:
      return "outline"
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "" || value === "null")
    return null
  return (
    <div className="py-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-sm font-medium">{String(value)}</p>
    </div>
  )
}

function formatISOName(
  code: string | null | undefined,
  locale: string = "en"
): string | null {
  if (!code) return null
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "region" })
    return displayNames.of(code) || code
  } catch {
    return code
  }
}

function formatDate(
  date: Date | string | null | undefined,
  locale?: string
): string | null {
  if (!date) return null
  return new Date(date).toLocaleDateString(locale)
}

function formatDateTime(
  date: Date | string | null | undefined,
  locale?: string
): string | null {
  if (!date) return null
  return new Date(date).toLocaleString(locale)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default async function ApplicationDetailContent({
  applicationId,
  dictionary,
  lang,
}: Props) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    notFound()
  }

  // Read-only roles (ACCOUNTANT) must not see mutating controls that the
  // server would reject anyway — drive the UI off the same role config the
  // permission layer defines.
  const uiConfig = getUIConfigForRole(
    (session?.user?.role ?? null) as Role | null
  )

  const application = await getApplicationDetail(schoolId, applicationId)

  if (!application) {
    notFound()
  }

  const t = dictionary.admission
  const statusLabel =
    t?.status?.[application.status as keyof typeof t.status] ||
    application.status

  // Safely look up enum labels from apply.form.options (e.g. gender.MALE → "ذكر")
  const applyForm = (t?.apply as Record<string, unknown>)?.form as
    | Record<string, unknown>
    | undefined
  const applyOptions = applyForm?.options as
    | Record<string, Record<string, string>>
    | undefined
  const enumLabel = (group: string, value: string | null | undefined) =>
    value ? applyOptions?.[group]?.[value] : undefined

  // Content language is the stored Application.lang column (written on
  // submit) \u2014 same normalization submitApplication applies on the write side.
  const contentLang: "ar" | "en" = application.lang === "en" ? "en" : "ar"

  // Translate display fields if viewer lang differs from content lang
  const translatableFields = [
    "firstName",
    "middleName",
    "lastName",
    "applyingForClass",
    "gender",
    "religion",
    "category",
    "preferredStream",
    "secondLanguage",
    "thirdLanguage",
    "achievements",
    "previousSchool",
    "previousClass",
    "fatherName",
    "fatherOccupation",
    "motherName",
    "motherOccupation",
    "guardianName",
    "guardianRelation",
    "reviewNotes",
  ]
  const translated = await getFields(
    application as unknown as Record<string, unknown>,
    translatableFields,
    contentLang,
    lang as "ar" | "en",
    schoolId
  )

  // Helper to get translated value or fall back to original
  const d = (field: string): string | null => {
    const t_val = translated[field]
    if (t_val !== undefined && t_val !== "") return t_val
    const raw = (application as Record<string, unknown>)[field]
    return typeof raw === "string" ? raw : null
  }

  const fullName = [d("firstName"), d("middleName"), d("lastName")]
    .filter(Boolean)
    .join(" ")

  // Resolve reviewedBy user ID to name
  let reviewerName: string | null = null
  if (application.reviewedBy) {
    const reviewer = await db.user.findFirst({
      where: { id: application.reviewedBy, schoolId },
      select: { username: true, email: true },
    })
    reviewerName =
      reviewer?.username || reviewer?.email || application.reviewedBy
  }

  // Parse documents JSON — supports both legacy {name, url} and
  // ProcessedDocument formats — then merge in the latest AI extraction
  // status/result from application.documentJobs. That merge happens at read
  // time in getApplicationDetail (queries.ts), matched by fileUrl, because
  // getDocumentProcessingStatus (ai/actions.ts) — the write-back variant that
  // syncs job status onto Application.documents — currently has no callers,
  // so the stored JSON never advances past status:"pending" on its own.
  let documents: ProcessedDocument[] = []
  if (application.documents) {
    try {
      const parsed =
        typeof application.documents === "string"
          ? JSON.parse(application.documents)
          : application.documents
      if (Array.isArray(parsed)) {
        const jobByUrl = new Map(
          application.documentJobs.map((job) => [job.fileUrl, job] as const)
        )
        documents = (parsed as RawDocumentEntry[]).map((doc) => {
          const job = doc.url ? jobByUrl.get(doc.url) : undefined

          const mergedStatus: DocumentProcessingStatus =
            (job ? JOB_STATUS_MAP[job.status] : undefined) ??
            (doc.status as DocumentProcessingStatus | undefined) ??
            "pending"

          const mergedExtractedData: ExtractedDocumentData | undefined =
            job && job.status === "COMPLETED" && job.resultData != null
              ? (job.resultData as unknown as ExtractedDocumentData)
              : (doc.extractedData as ExtractedDocumentData | undefined)

          return {
            type: (doc.type as ProcessedDocument["type"]) ?? "other",
            url: normalizeUploadUrl(doc.url ?? ""),
            fileName: doc.fileName ?? doc.name ?? "",
            status: mergedStatus,
            confidence: job?.confidence ?? doc.confidence ?? undefined,
            extractedData: mergedExtractedData,
            jobId: doc.jobId ?? undefined,
            // documentJobSelect doesn't pull errorMessage (not requested), so
            // a FAILED job has no fresher error text to merge in — keep
            // whatever was already stored on the document entry.
            error: doc.error ?? undefined,
            processedAt: doc.processedAt ?? undefined,
          }
        })
      }
    } catch {
      // ignore parse errors
    }
  }

  // Merit & Scores is only meaningful once scoring has begun. Hide the whole
  // section when nothing has been recorded — scores are entered from the Merit
  // tab (ScoreEntryDialog / EditableScoreCell), so nothing is lost here.
  const hasMeritData =
    application.entranceScore != null ||
    application.interviewScore != null ||
    application.meritScore != null ||
    application.meritRank != null ||
    application.waitlistNumber != null

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-12">
      {/* Sidebar — 30% */}
      <div className="w-full space-y-4 md:w-[30%] md:shrink-0">
        {/* Photo + Name */}
        <div>
          {application.photoUrl ? (
            <Image
              src={normalizeUploadUrl(application.photoUrl)}
              alt={fullName}
              width={208}
              height={208}
              className="h-52 w-52 rounded-full border object-cover"
              unoptimized
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex h-52 w-52 items-center justify-center rounded-full border text-4xl font-semibold">
              {(application.firstName?.[0] || "?").toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1 text-sm">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">{fullName}</h1>
            <Badge variant={getStatusVariant(application.status)}>
              {statusLabel}
            </Badge>
          </div>
          {application.email && <p>{application.email}</p>}
          {application.phone && <p>{application.phone}</p>}
          {application.alternatePhone && <p>{application.alternatePhone}</p>}
          {(application.country || application.city) && (
            <p className="text-muted-foreground">
              {[formatISOName(application.country, lang), application.city]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>
        <Separator className="!w-52" />
        <ApplicationDetailActions
          applicationId={applicationId}
          currentStatus={application.status}
          dictionary={dictionary}
          readOnly={uiConfig.readOnlyMode}
        />
      </div>

      {/* Main Content — 70% */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {application.applicationNumber}
            {application.campaign?.name && (
              <>
                {" · "}
                {application.campaign.name}
                {application.campaign.academicYear &&
                  ` (${application.campaign.academicYear})`}
              </>
            )}
            {d("applyingForClass") && (
              <>
                {" · "} {d("applyingForClass")}
              </>
            )}
            {application.submittedAt && (
              <>
                {" · "} {formatDate(application.submittedAt, lang)}
              </>
            )}
          </p>
          <ApplicationDetailActions
            applicationId={applicationId}
            currentStatus={application.status}
            dictionary={dictionary}
            placement="header"
          />
        </div>

        {/* Personal Information */}
        <section>
          <h2 className="text-lg font-semibold">
            {t?.applicationDetail?.personal || "Personal Information"}
          </h2>
          <Separator className="my-3" />
          <div className="grid gap-x-8 gap-y-0.5 sm:grid-cols-2">
            <InfoRow
              label={t?.applicationDetail?.fullName || "Full Name"}
              value={fullName}
            />
            <InfoRow
              label={t?.applicationDetail?.dateOfBirth || "Date of Birth"}
              value={formatDate(application.dateOfBirth, lang)}
            />
            <InfoRow
              label={t?.applicationDetail?.gender || "Gender"}
              value={enumLabel("gender", application.gender) || d("gender")}
            />
            <InfoRow
              label={t?.applicationDetail?.nationality || "Nationality"}
              value={formatISOName(application.nationality, lang)}
            />
            <InfoRow
              label={t?.applicationDetail?.religion || "Religion"}
              value={
                enumLabel("religion", application.religion) || d("religion")
              }
            />
            <InfoRow
              label={t?.applicationDetail?.category || "Category"}
              value={
                enumLabel("category", application.category) || d("category")
              }
            />
          </div>
        </section>

        {/* Guardian Information */}
        <section>
          <h2 className="text-lg font-semibold">
            {t?.applicationDetail?.guardian || "Guardian Information"}
          </h2>
          <Separator className="my-3" />
          <div className="grid gap-x-8 gap-y-0.5 sm:grid-cols-2">
            <InfoRow
              label={t?.applicationDetail?.father || "Father"}
              value={d("fatherName")}
            />
            <InfoRow
              label={t?.applicationDetail?.occupation || "Occupation"}
              value={d("fatherOccupation")}
            />
            <InfoRow
              label={t?.applicationDetail?.phone || "Phone"}
              value={application.fatherPhone}
            />
            <InfoRow
              label={t?.applicationDetail?.email || "Email"}
              value={application.fatherEmail}
            />
            <InfoRow
              label={t?.applicationDetail?.mother || "Mother"}
              value={d("motherName")}
            />
            <InfoRow
              label={t?.applicationDetail?.occupation || "Occupation"}
              value={d("motherOccupation")}
            />
            <InfoRow
              label={t?.applicationDetail?.phone || "Phone"}
              value={application.motherPhone}
            />
            <InfoRow
              label={t?.applicationDetail?.email || "Email"}
              value={application.motherEmail}
            />
            <InfoRow
              label={t?.applicationDetail?.guardianLabel || "Guardian"}
              value={d("guardianName")}
            />
            <InfoRow
              label={t?.applicationDetail?.relation || "Relation"}
              value={
                enumLabel("guardianRelation", application.guardianRelation) ||
                d("guardianRelation")
              }
            />
            <InfoRow
              label={t?.applicationDetail?.phone || "Phone"}
              value={application.guardianPhone}
            />
            <InfoRow
              label={t?.applicationDetail?.email || "Email"}
              value={application.guardianEmail}
            />
          </div>
        </section>

        {/* Academic Information */}
        <section>
          <h2 className="text-lg font-semibold">
            {t?.applicationDetail?.academic || "Academic Information"}
          </h2>
          <Separator className="my-3" />
          <div className="grid gap-x-8 gap-y-0.5 sm:grid-cols-2">
            <InfoRow
              label={
                t?.applicationDetail?.applyingForClass || "Applying for Class"
              }
              value={d("applyingForClass")}
            />
            <InfoRow
              label={
                t?.applicationDetail?.preferredStream || "Preferred Stream"
              }
              value={
                enumLabel("stream", application.preferredStream) ||
                d("preferredStream")
              }
            />
            <InfoRow
              label={t?.applicationDetail?.secondLanguage || "Second Language"}
              value={
                enumLabel("language", application.secondLanguage) ||
                d("secondLanguage")
              }
            />
            <InfoRow
              label={t?.applicationDetail?.thirdLanguage || "Third Language"}
              value={
                enumLabel("language", application.thirdLanguage) ||
                d("thirdLanguage")
              }
            />
            <InfoRow
              label={t?.applicationDetail?.previousSchool || "Previous School"}
              value={d("previousSchool")}
            />
            <InfoRow
              label={t?.applicationDetail?.previousClass || "Previous Class"}
              value={d("previousClass")}
            />
            <InfoRow
              label={t?.applicationDetail?.previousMarks || "Previous Marks"}
              value={application.previousMarks?.toString()}
            />
            <InfoRow
              label={
                t?.applicationDetail?.previousPercentage ||
                "Previous Percentage"
              }
              value={
                application.previousPercentage
                  ? `${application.previousPercentage}%`
                  : null
              }
            />
            <InfoRow
              label={t?.applicationDetail?.achievements || "Achievements"}
              value={d("achievements")}
            />
          </div>
        </section>

        {/* Merit & Scores — hidden until scoring has begun */}
        {hasMeritData && (
          <section>
            <h2 className="text-lg font-semibold">
              {t?.applicationDetail?.merit || "Merit & Scores"}
            </h2>
            <Separator className="my-3" />
            {/* Editable score entry for entrance + interview */}
            <ScoreEntryInline
              applicationId={applicationId}
              entranceScore={
                application.entranceScore != null
                  ? Number(application.entranceScore)
                  : null
              }
              interviewScore={
                application.interviewScore != null
                  ? Number(application.interviewScore)
                  : null
              }
              dictionary={dictionary.admission}
            />
            <div className="mt-3 grid gap-x-8 gap-y-0.5 sm:grid-cols-2">
              <InfoRow
                label={t?.applicationDetail?.meritScore || "Merit Score"}
                value={application.meritScore?.toString()}
              />
              <InfoRow
                label={t?.applicationDetail?.meritRank || "Merit Rank"}
                value={
                  application.meritRank ? `#${application.meritRank}` : null
                }
              />
              <InfoRow
                label={
                  t?.applicationDetail?.waitlistNumber || "Waitlist Number"
                }
                value={application.waitlistNumber}
              />
            </div>
          </section>
        )}

        {/* Admission & Payment */}
        <section>
          <h2 className="text-lg font-semibold">
            {t?.applicationDetail?.admission || "Admission"}
          </h2>
          <Separator className="my-3" />
          <div className="grid gap-x-8 gap-y-0.5 sm:grid-cols-2">
            <InfoRow
              label={
                t?.applicationDetail?.admissionOffered || "Admission Offered"
              }
              value={
                application.admissionOffered
                  ? t?.applicationDetail?.yes || "Yes"
                  : t?.applicationDetail?.no || "No"
              }
            />
            <InfoRow
              label={t?.applicationDetail?.offerDate || "Offer Date"}
              value={formatDate(application.offerDate, lang)}
            />
            <InfoRow
              label={t?.applicationDetail?.offerExpiryDate || "Offer Expiry"}
              value={formatDate(application.offerExpiryDate, lang)}
            />
            <InfoRow
              label={
                t?.applicationDetail?.admissionConfirmed ||
                "Admission Confirmed"
              }
              value={
                application.admissionConfirmed
                  ? t?.applicationDetail?.yes || "Yes"
                  : t?.applicationDetail?.no || "No"
              }
            />
            <InfoRow
              label={
                t?.applicationDetail?.confirmationDate || "Confirmation Date"
              }
              value={formatDate(application.confirmationDate, lang)}
            />
            <InfoRow
              label={
                t?.applicationDetail?.enrollmentNumber || "Enrollment Number"
              }
              value={application.enrollmentNumber}
            />
            <InfoRow
              label={t?.applicationDetail?.feePaid || "Application Fee Paid"}
              value={
                application.applicationFeePaid
                  ? t?.applicationDetail?.yes || "Yes"
                  : t?.applicationDetail?.no || "No"
              }
            />
            <InfoRow
              label={t?.applicationDetail?.offerAccepted || "Offer Accepted"}
              value={
                application.offerAccepted
                  ? t?.applicationDetail?.yes || "Yes"
                  : t?.applicationDetail?.no || "No"
              }
            />
            <InfoRow
              label={
                t?.applicationDetail?.offerAcceptedAt || "Offer Accepted At"
              }
              value={formatDate(application.offerAcceptedAt, lang)}
            />
            <InfoRow
              label={
                t?.applicationDetail?.registrationFeePaid ||
                "Registration Fee Paid"
              }
              value={
                application.registrationFeePaid
                  ? t?.applicationDetail?.yes || "Yes"
                  : t?.applicationDetail?.no || "No"
              }
            />
            <InfoRow
              label={
                t?.applicationDetail?.registrationFeeAmount ||
                "Registration Fee Amount"
              }
              value={
                application.registrationFeeAmount != null
                  ? String(application.registrationFeeAmount)
                  : null
              }
            />
            <InfoRow
              label={
                t?.applicationDetail?.registrationFeeMethod ||
                "Registration Fee Method"
              }
              value={application.registrationFeeMethod}
            />
            <InfoRow
              label={
                t?.applicationDetail?.registrationFeeReference ||
                "Registration Fee Reference"
              }
              value={application.registrationFeeReference}
            />
            <InfoRow
              label={
                t?.applicationDetail?.registrationFeeDate ||
                "Registration Fee Date"
              }
              value={formatDate(application.registrationFeeDate, lang)}
            />
            <InfoRow
              label={t?.applicationDetail?.paymentId || "Payment ID"}
              value={application.paymentId}
            />
            <InfoRow
              label={t?.applicationDetail?.paymentDate || "Payment Date"}
              value={formatDate(application.paymentDate, lang)}
            />
          </div>
        </section>

        {/* Review */}
        <section>
          <h2 className="text-lg font-semibold">
            {t?.applicationDetail?.review || "Review"}
          </h2>
          <Separator className="my-3" />
          <div className="grid gap-x-8 gap-y-0.5 sm:grid-cols-2">
            <InfoRow
              label={t?.applicationDetail?.reviewNotes || "Review Notes"}
              value={d("reviewNotes")}
            />
            <InfoRow
              label={t?.applicationDetail?.reviewedBy || "Reviewed By"}
              value={reviewerName}
            />
            <InfoRow
              label={t?.applicationDetail?.reviewedAt || "Reviewed At"}
              value={formatDateTime(application.reviewedAt, lang)}
            />
            <InfoRow
              label={t?.applicationDetail?.createdAt || "Created"}
              value={formatDateTime(application.createdAt, lang)}
            />
            <InfoRow
              label={t?.applicationDetail?.updatedAt || "Last Updated"}
              value={formatDateTime(application.updatedAt, lang)}
            />
          </div>
        </section>

        {/* Documents */}
        <section>
          <h2 className="text-lg font-semibold">
            {t?.applicationDetail?.documents || "Documents"}
          </h2>
          <Separator className="my-3" />
          <DocumentsSection
            documents={documents}
            photoUrl={normalizeUploadUrl(application.photoUrl)}
            signatureUrl={normalizeUploadUrl(application.signatureUrl)}
            dictionary={dictionary}
            applicationId={applicationId}
          />
        </section>
      </div>
    </div>
  )
}
