// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { FileText, Signature } from "lucide-react"

import { getDisplayFields } from "@/lib/content-display"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import ApplicationDetailActions from "./application-detail-actions"
import { getApplicationDetail } from "./queries"

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
      return "destructive"
    default:
      return "outline"
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div className="py-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-sm font-medium">{String(value)}</p>
    </div>
  )
}

const ISO_NAMES: Record<string, string> = {
  SA: "Saudi Arabia",
  SD: "Sudan",
  AE: "United Arab Emirates",
  EG: "Egypt",
  JO: "Jordan",
  KW: "Kuwait",
  QA: "Qatar",
  BH: "Bahrain",
  OM: "Oman",
  IQ: "Iraq",
  US: "United States",
  GB: "United Kingdom",
  DZ: "Algeria",
  MA: "Morocco",
  TN: "Tunisia",
  LB: "Lebanon",
  SY: "Syria",
  YE: "Yemen",
  LY: "Libya",
  PS: "Palestine",
  PK: "Pakistan",
  IN: "India",
  TR: "Turkey",
  DE: "Germany",
  FR: "France",
  CA: "Canada",
  AU: "Australia",
}

function formatISOName(code: string | null | undefined): string | null {
  if (!code) return null
  return ISO_NAMES[code] || code
}

function formatDate(date: Date | string | null | undefined): string | null {
  if (!date) return null
  return new Date(date).toLocaleDateString()
}

function formatDateTime(date: Date | string | null | undefined): string | null {
  if (!date) return null
  return new Date(date).toLocaleString()
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

  const application = await getApplicationDetail(schoolId, applicationId)

  if (!application) {
    notFound()
  }

  const t = dictionary.admission
  const statusLabel =
    t?.status?.[application.status as keyof typeof t.status] ||
    application.status

  // Get school's content language for translation
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { preferredLanguage: true },
  })
  const contentLang = (school?.preferredLanguage || "ar") as "ar" | "en"

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
  const translated = await getDisplayFields(
    application as unknown as Record<string, unknown>,
    translatableFields,
    contentLang,
    lang as "ar" | "en",
    schoolId
  )

  // Helper to get translated value or fall back to original
  const d = (field: string): string | null => {
    const val =
      translated[field] || (application as Record<string, unknown>)[field]
    return typeof val === "string" ? val : null
  }

  const fullName = [d("firstName"), d("middleName"), d("lastName")]
    .filter(Boolean)
    .join(" ")

  // Resolve reviewedBy user ID to name
  let reviewerName: string | null = null
  if (application.reviewedBy) {
    const reviewer = await db.user.findUnique({
      where: { id: application.reviewedBy },
      select: { username: true, email: true },
    })
    reviewerName =
      reviewer?.username || reviewer?.email || application.reviewedBy
  }

  // Parse documents JSON
  let documents: Array<{ name: string; url: string }> = []
  if (application.documents) {
    try {
      const parsed =
        typeof application.documents === "string"
          ? JSON.parse(application.documents)
          : application.documents
      if (Array.isArray(parsed)) {
        documents = parsed
      }
    } catch {
      // ignore parse errors
    }
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-12">
      {/* Sidebar — 30% */}
      <div className="w-full space-y-4 md:w-[30%] md:shrink-0">
        {/* Photo + Name */}
        <div>
          {application.photoUrl ? (
            <img
              src={application.photoUrl}
              alt={fullName}
              className="h-52 w-52 rounded-full border object-cover"
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
              {[formatISOName(application.country), application.city]
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
                {" · "} {formatDate(application.submittedAt)}
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
              value={formatDate(application.dateOfBirth)}
            />
            <InfoRow
              label={t?.applicationDetail?.gender || "Gender"}
              value={d("gender")}
            />
            <InfoRow
              label={t?.applicationDetail?.nationality || "Nationality"}
              value={formatISOName(application.nationality)}
            />
            <InfoRow
              label={t?.applicationDetail?.religion || "Religion"}
              value={d("religion")}
            />
            <InfoRow
              label={t?.applicationDetail?.category || "Category"}
              value={d("category")}
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
              value={d("guardianRelation")}
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
              value={d("preferredStream")}
            />
            <InfoRow
              label={t?.applicationDetail?.secondLanguage || "Second Language"}
              value={d("secondLanguage")}
            />
            <InfoRow
              label={t?.applicationDetail?.thirdLanguage || "Third Language"}
              value={d("thirdLanguage")}
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

        {/* Merit & Scores */}
        <section>
          <h2 className="text-lg font-semibold">
            {t?.applicationDetail?.merit || "Merit & Scores"}
          </h2>
          <Separator className="my-3" />
          <div className="grid gap-x-8 gap-y-0.5 sm:grid-cols-2">
            <InfoRow
              label={t?.applicationDetail?.entranceScore || "Entrance Score"}
              value={application.entranceScore?.toString()}
            />
            <InfoRow
              label={t?.applicationDetail?.interviewScore || "Interview Score"}
              value={application.interviewScore?.toString()}
            />
            <InfoRow
              label={t?.applicationDetail?.meritScore || "Merit Score"}
              value={application.meritScore?.toString()}
            />
            <InfoRow
              label={t?.applicationDetail?.meritRank || "Merit Rank"}
              value={application.meritRank ? `#${application.meritRank}` : null}
            />
            <InfoRow
              label={t?.applicationDetail?.waitlistNumber || "Waitlist Number"}
              value={application.waitlistNumber}
            />
          </div>
        </section>

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
              value={formatDate(application.offerDate)}
            />
            <InfoRow
              label={t?.applicationDetail?.offerExpiryDate || "Offer Expiry"}
              value={formatDate(application.offerExpiryDate)}
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
              value={formatDate(application.confirmationDate)}
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
              label={t?.applicationDetail?.paymentId || "Payment ID"}
              value={application.paymentId}
            />
            <InfoRow
              label={t?.applicationDetail?.paymentDate || "Payment Date"}
              value={formatDate(application.paymentDate)}
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
              value={formatDateTime(application.reviewedAt)}
            />
            <InfoRow
              label={t?.applicationDetail?.createdAt || "Created"}
              value={formatDateTime(application.createdAt)}
            />
            <InfoRow
              label={t?.applicationDetail?.updatedAt || "Last Updated"}
              value={formatDateTime(application.updatedAt)}
            />
          </div>
        </section>

        {/* Documents */}
        <section>
          <h2 className="text-lg font-semibold">
            {t?.applicationDetail?.documents || "Documents"}
          </h2>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {/* Photo */}
            {application.photoUrl && (
              <a
                href={application.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group hover:border-foreground/20 flex h-32 flex-col items-center justify-center overflow-hidden rounded-lg border transition-colors"
              >
                <img
                  src={application.photoUrl}
                  alt={t?.applicationDetail?.photo || "Photo"}
                  className="h-full w-full object-cover"
                />
              </a>
            )}
            {/* Signature */}
            {application.signatureUrl && (
              <a
                href={application.signatureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group hover:border-foreground/20 flex h-32 flex-col items-center justify-center gap-2 rounded-lg border p-4 transition-colors"
              >
                <Signature className="text-muted-foreground h-8 w-8" />
                <p className="text-sm font-medium">
                  {t?.applicationDetail?.signature || "Signature"}
                </p>
              </a>
            )}
            {/* Uploaded documents */}
            {documents.map((doc, i) => {
              const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(
                doc.url || ""
              )
              return (
                <a
                  key={i}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group hover:border-foreground/20 flex h-32 flex-col items-center justify-center overflow-hidden rounded-lg border transition-colors"
                >
                  {isImage ? (
                    <img
                      src={doc.url}
                      alt={doc.name || `Document ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4">
                      <FileText className="text-muted-foreground h-8 w-8" />
                      <p className="max-w-full truncate text-sm font-medium">
                        {doc.name || `Document ${i + 1}`}
                      </p>
                    </div>
                  )}
                </a>
              )
            })}
            {/* Empty state */}
            {!application.photoUrl &&
              !application.signatureUrl &&
              documents.length === 0 && (
                <div className="col-span-full flex h-32 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-muted-foreground text-sm">
                    {t?.applicationDetail?.noDocuments ||
                      "No documents uploaded"}
                  </p>
                </div>
              )}
          </div>
        </section>
      </div>
    </div>
  )
}
