// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { PaymentDetailActions } from "@/components/school-dashboard/finance/fees/payment-detail-actions"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"
import { getName } from "@/components/translation/person"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.finance?.fees?.payment?.paymentDetails || "Payment Details",
  }
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "SUCCESS":
      return "default"
    case "PENDING":
      return "secondary"
    case "FAILED":
    case "CANCELLED":
      return "destructive"
    case "REFUNDED":
      return "outline"
    default:
      return "outline"
  }
}

export default async function PaymentDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.fees?.payment
  const { schoolId, can } = await resolveFinanceAccess("fees", ["view"])

  if (!schoolId) notFound()

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="fees" />
  }

  // School name + currency drive the receipt header and money formatting —
  // never hardcode "School" or a default currency on a financial document.
  const [payment, school] = await Promise.all([
    db.payment.findFirst({
      where: { id, schoolId },
      include: {
        student: { select: { firstName: true, lastName: true } },
        feeAssignment: {
          select: {
            id: true,
            academicYear: true,
            finalAmount: true,
            status: true,
            feeStructure: { select: { name: true } },
          },
        },
      },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { name: true, currency: true },
    }),
  ])

  if (!payment) notFound()

  const currency = school?.currency ?? "USD"

  const studentName = payment.student
    ? await getName(payment.student, lang, schoolId)
    : ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {d?.paymentDetails ?? "Payment Details"}
          </h1>
          <p className="text-muted-foreground">{payment.paymentNumber}</p>
        </div>
        <div className="flex gap-2">
          <PaymentDetailActions
            paymentId={payment.id}
            dictionary={
              (
                dictionary?.finance?.fees as
                  | { paymentActions?: Record<string, string> }
                  | undefined
              )?.paymentActions
            }
            receiptData={{
              paymentNumber: payment.paymentNumber,
              receiptNumber: payment.receiptNumber,
              amount: formatCurrency(Number(payment.amount), lang, currency),
              paymentDate: payment.paymentDate
                ? formatDate(payment.paymentDate, lang)
                : "-",
              paymentMethod: payment.paymentMethod,
              status: payment.status,
              transactionId: payment.transactionId || undefined,
              studentName,
              schoolName: school?.name,
              feeStructureName:
                payment.feeAssignment?.feeStructure?.name || "-",
              academicYear: payment.feeAssignment?.academicYear || "-",
            }}
          />
          <Button variant="outline" asChild>
            <Link href={`/${lang}/finance/fees/payments`}>
              {d?.back ?? "Back"}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {d?.paymentInformation ?? "Payment Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.paymentNumber ?? "Payment Number"}
              </span>
              <span className="font-medium">{payment.paymentNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.receiptNumber ?? "Receipt Number"}
              </span>
              <span className="font-medium">
                {payment.receiptNumber || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.amount ?? "Amount"}
              </span>
              <span className="text-xl font-bold">
                {formatCurrency(Number(payment.amount), lang, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{d?.date ?? "Date"}</span>
              <span className="font-medium">
                {payment.paymentDate
                  ? formatDate(payment.paymentDate, lang)
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.method ?? "Method"}
              </span>
              <span className="font-medium">
                {payment.paymentMethod}
                {payment.gatewayMethod && (
                  <span className="text-muted-foreground ms-2 text-xs uppercase">
                    {payment.gatewayMethod}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.status ?? "Status"}
              </span>
              <Badge variant={statusVariant(payment.status)}>
                {payment.status}
              </Badge>
            </div>
            {payment.transactionId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.transactionId ?? "Transaction ID"}
                </span>
                <span className="font-mono text-sm">
                  {payment.transactionId}
                </span>
              </div>
            )}
            {payment.bankName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.bank ?? "Bank"}
                </span>
                <span className="font-medium">{payment.bankName}</span>
              </div>
            )}
            {payment.chequeNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.chequeNumber ?? "Cheque Number"}
                </span>
                <span className="font-medium">{payment.chequeNumber}</span>
              </div>
            )}
            {payment.cardLastFour && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.card ?? "Card"}
                </span>
                <span className="font-medium">**** {payment.cardLastFour}</span>
              </div>
            )}
            {payment.depositBankBranch && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.depositBankBranch ?? "Branch"}
                </span>
                <span className="font-medium">{payment.depositBankBranch}</span>
              </div>
            )}
            {payment.depositorIban && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.depositorIban ?? "Sender IBAN"}
                </span>
                <span className="font-mono text-sm">
                  {payment.depositorIban}
                </span>
              </div>
            )}
            {payment.verifiedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.verifiedAt ?? "Verified"}
                </span>
                <span className="font-medium">
                  {formatDate(payment.verifiedAt, lang)}
                </span>
              </div>
            )}
            {payment.remarks && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.remarks ?? "Remarks"}
                </span>
                <span>{payment.remarks}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proof of transfer — the bursar cannot verify a Bankak/Cashi/bank
            payment without seeing what the payer sent. Images render inline;
            a PDF proof opens in a new tab. */}
        {payment.depositSlipUrl && (
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle>{d?.proof ?? "Proof of payment"}</CardTitle>
              <CardDescription>
                {d?.proofDescription ??
                  "Submitted by the payer. Compare the amount and reference before clearing."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/\.(png|jpe?g|webp|gif|heic)(\?|$)/i.test(
                payment.depositSlipUrl
              ) ? (
                // eslint-disable-next-line @next/next/no-img-element -- user upload on the CDN, arbitrary dimensions
                <img
                  src={payment.depositSlipUrl}
                  alt={d?.proof ?? "Proof of payment"}
                  className="max-h-[32rem] w-auto max-w-full rounded-md border"
                />
              ) : null}
              <Button variant="outline" size="sm" asChild>
                <a
                  href={payment.depositSlipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {d?.openProof ?? "Open proof in new tab"}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {d?.relatedInformation ?? "Related Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.student ?? "Student"}
              </span>
              <span className="font-medium">{studentName}</span>
            </div>
            {payment.feeAssignment && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {d?.feeStructure ?? "Fee Structure"}
                  </span>
                  <span className="font-medium">
                    {payment.feeAssignment.feeStructure?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {d?.academicYear ?? "Academic Year"}
                  </span>
                  <span className="font-medium">
                    {payment.feeAssignment.academicYear}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {d?.totalFee ?? "Total Fee"}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(
                      Number(payment.feeAssignment.finalAmount),
                      lang,
                      currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {d?.assignmentStatus ?? "Assignment Status"}
                  </span>
                  <Badge variant="outline">
                    {payment.feeAssignment.status}
                  </Badge>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/${lang}/finance/fees/assignments/${payment.feeAssignment.id}`}
                    >
                      {d?.viewAssignment ?? "View Assignment"}
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
