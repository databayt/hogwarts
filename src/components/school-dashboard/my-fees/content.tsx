// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { PreferredMethodPicker } from "./form"
import {
  getAssignmentsForStudents,
  getBillingStudentsForUser,
  type MyFeeAssignment,
} from "./queries"

interface Props {
  lang: Locale
  dictionary: Dictionary
}

const METHOD_DICT_KEYS: Record<string, keyof MyFeesMethodDict> = {
  CASH: "cash",
  CHEQUE: "cheque",
  BANK_TRANSFER: "bankTransfer",
  CREDIT_CARD: "creditCard",
  DEBIT_CARD: "debitCard",
  UPI: "upi",
  NET_BANKING: "netBanking",
  WALLET: "wallet",
  OTHER: "other",
}

interface MyFeesMethodDict {
  cash?: string
  cheque?: string
  bankTransfer?: string
  creditCard?: string
  debitCard?: string
  upi?: string
  netBanking?: string
  wallet?: string
  other?: string
}

interface MyFeesDict {
  title?: string
  description?: string
  preferredMethodLabel?: string
  preferredMethodUpdated?: string
  preferredMethodFailed?: string
  preferredMethodNone?: string
  preferredMethodPlaceholder?: string
  noAssignments?: string
  noAccess?: string
  signInRequired?: string
  missingSchoolContext?: string
  missingSchoolContextDesc?: string
  originalPrice?: string
  methods?: MyFeesMethodDict
  status?: Record<string, string>
}

function formatMoney(value: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

export default async function MyFeesContent({ lang, dictionary }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${lang}/login`)
  }

  const { schoolId } = await getTenantContext()
  const tEarly = ((dictionary?.school as Record<string, unknown>)?.myFees ??
    {}) as MyFeesDict
  if (!schoolId) {
    return (
      <Alert>
        <AlertTitle>
          {tEarly.missingSchoolContext || "Missing school context"}
        </AlertTitle>
        <AlertDescription>
          {tEarly.missingSchoolContextDesc ||
            "You must access this page from your school's subdomain."}
        </AlertDescription>
      </Alert>
    )
  }

  const t = ((dictionary?.school as Record<string, unknown>)?.myFees ??
    {}) as MyFeesDict
  const methodDict: MyFeesMethodDict = t.methods ?? {}
  const statusDict = t.status ?? {}

  const [students, school, admission] = await Promise.all([
    getBillingStudentsForUser(session.user.id, schoolId),
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
    db.admissionSettings.findUnique({
      where: { schoolId },
      select: { paymentMethods: true },
    }),
  ])

  if (students.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">{t.title || "My Fees"}</h1>
          <p className="text-muted-foreground text-sm">
            {t.description ||
              "View assigned fees and pick your preferred payment method."}
          </p>
        </div>
        <Alert>
          <AlertDescription>
            {t.noAccess ||
              "No student record is linked to your account. Contact the school admin."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const currency = school?.currency ?? "USD"
  const assignmentsByStudent = await getAssignmentsForStudents(
    schoolId,
    students.map((s) => s.id)
  )

  // Build method options from AdmissionSettings.paymentMethods (lowercase tokens)
  // mapped to the Prisma PaymentMethod enum used for storage.
  const enabledAppMethods = (admission?.paymentMethods as string[] | null) ?? [
    "stripe",
    "cash",
  ]
  const methodOptions = buildMethodOptions(enabledAppMethods, methodDict)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title || "My Fees"}</h1>
        <p className="text-muted-foreground text-sm">
          {t.description ||
            "View assigned fees and pick your preferred payment method."}
        </p>
      </div>

      {students.map((student) => {
        const assignments = assignmentsByStudent[student.id] ?? []
        return (
          <Card key={student.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {student.firstName} {student.lastName}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t.preferredMethodLabel || "Preferred payment method"}
                  </p>
                </div>
                <PreferredMethodPicker
                  studentId={student.id}
                  currentMethod={student.preferredPaymentMethod}
                  options={methodOptions}
                  dictionary={{
                    noneLabel: t.preferredMethodNone || "None",
                    placeholder:
                      t.preferredMethodPlaceholder || "Pick a method",
                    updatedToast:
                      t.preferredMethodUpdated || "Preferred method updated.",
                    failedToast:
                      t.preferredMethodFailed || "Failed to update method.",
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {t.noAssignments ||
                      "No fees have been assigned yet. The school will set them up shortly."}
                  </AlertDescription>
                </Alert>
              ) : (
                <AssignmentList
                  assignments={assignments}
                  currency={currency}
                  locale={lang}
                  statusDict={statusDict}
                  originalPriceLabel={t.originalPrice}
                />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function AssignmentList({
  assignments,
  currency,
  locale,
  statusDict,
  originalPriceLabel,
}: {
  assignments: MyFeeAssignment[]
  currency: string
  locale: string
  statusDict: Record<string, string>
  originalPriceLabel?: string
}) {
  return (
    <dl className="space-y-4">
      {assignments.map((a) => (
        <div key={a.id} className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">{a.feeStructureName}</div>
              <div className="text-muted-foreground text-xs">
                {a.academicYear} ·{" "}
                <Badge variant="outline" className="ms-1">
                  {statusDict[a.status.toLowerCase()] || a.status}
                </Badge>
              </div>
            </div>
            <div className="text-end">
              <div className="text-lg font-semibold tabular-nums">
                {formatMoney(a.finalAmount, currency, locale)}
              </div>
              {a.totalDiscount > 0 && (
                <div className="text-muted-foreground text-xs tabular-nums">
                  {originalPriceLabel
                    ? `${originalPriceLabel} ${formatMoney(a.totalAmount, currency, locale)}`
                    : `(was ${formatMoney(a.totalAmount, currency, locale)})`}
                </div>
              )}
            </div>
          </div>
          {a.discounts.length > 0 && (
            <div className="bg-muted/40 space-y-0.5 rounded-md p-2 text-xs">
              {a.discounts.map((d, i) => (
                <div
                  key={`${d.type}-${i}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground">
                    {d.type}
                    {d.reason ? ` · ${d.reason}` : ""}
                  </span>
                  <span className="tabular-nums">
                    −{formatMoney(d.amount, currency, locale)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Separator />
        </div>
      ))}
    </dl>
  )
}

function buildMethodOptions(
  enabledAppMethods: string[],
  methodDict: MyFeesMethodDict
): Array<{ value: string; label: string }> {
  // App-level gateway tokens → Prisma PaymentMethod enum values + a label.
  // stripe/tap → CREDIT_CARD (online card paths)
  // cash → CASH
  // bank_transfer → BANK_TRANSFER
  // bankak/cashi → BANK_TRANSFER; these Sudan wallet rails settle as a
  //   transfer to the school's account. Their specific identity is preserved
  //   on Payment.gatewayMethod (as Tap does for MADA/KNET), not in this enum.
  const mapping: Record<string, string> = {
    stripe: "CREDIT_CARD",
    tap: "CREDIT_CARD",
    cash: "CASH",
    bank_transfer: "BANK_TRANSFER",
    bankak: "BANK_TRANSFER",
    cashi: "BANK_TRANSFER",
  }
  const seen = new Set<string>()
  const options: Array<{ value: string; label: string }> = []
  for (const appMethod of enabledAppMethods) {
    const enumValue = mapping[appMethod]
    if (!enumValue || seen.has(enumValue)) continue
    seen.add(enumValue)
    const dictKey = METHOD_DICT_KEYS[enumValue]
    options.push({
      value: enumValue,
      label: methodDict[dictKey] ?? defaultMethodLabel(enumValue),
    })
  }
  return options
}

function defaultMethodLabel(method: string): string {
  switch (method) {
    case "CASH":
      return "Cash"
    case "CHEQUE":
      return "Cheque"
    case "BANK_TRANSFER":
      return "Bank Transfer"
    case "CREDIT_CARD":
      return "Credit / Debit Card"
    case "DEBIT_CARD":
      return "Debit Card"
    case "UPI":
      return "UPI"
    case "NET_BANKING":
      return "Net Banking"
    case "WALLET":
      return "Mobile Wallet"
    default:
      return "Other"
  }
}
