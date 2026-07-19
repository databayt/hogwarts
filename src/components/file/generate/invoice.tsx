// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Unified File Block - Invoice Template
 *
 * Milan Vučković minimalist-monospace design: IBM Plex Mono, letterspaced
 * micro-labels, hairline rules, generous whitespace, one big bold TOTAL.
 * Arabic invoices keep Rubik for prose (Plex Mono has no Arabic glyphs).
 * Data contract (InvoiceData / TemplateStyle) is unchanged — visual restyle
 * only; mapInvoiceToInvoiceData + DownloadInvoiceButton wiring untouched.
 */

import React from "react"
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import type { InvoiceData, TemplateStyle } from "./types"

// ============================================================================
// Font Registration
// ============================================================================

Font.register({
  family: "Rubik",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4i1UE80V4bVkA.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4hAVU80V4bVkA.ttf",
      fontWeight: "bold",
    },
  ],
})

// Static TTFs verified against fonts.googleapis.com/css2 (v20, 2026-07).
Font.register({
  family: "IBMPlexMono",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n5ig.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3twJ8lc.ttf",
      fontWeight: "medium",
    },
    {
      src: "https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3pQP8lc.ttf",
      fontWeight: "bold",
    },
  ],
})

// ============================================================================
// Styles
// ============================================================================

const INK = "#111111"
const MUTED = "#6b7280"
const HAIRLINE = "#e5e7eb"

const createStyles = (locale: string = "en") => {
  const isRTL = locale === "ar"
  const fontFamily = isRTL ? "Rubik" : "IBMPlexMono"
  const mono = "IBMPlexMono"
  // react-pdf resolves neither `dir` nor logical properties — flip by hand.
  const row = isRTL ? ("row-reverse" as const) : ("row" as const)
  const start = isRTL ? ("right" as const) : ("left" as const)
  const end = isRTL ? ("left" as const) : ("right" as const)
  // Wide tracking suits Latin capitals only; Arabic letters must connect.
  const tracking = isRTL ? 0.5 : 2.5

  return StyleSheet.create({
    page: {
      paddingVertical: 56,
      paddingHorizontal: 48,
      fontFamily,
      fontSize: 9,
      color: INK,
      backgroundColor: "#ffffff",
    },
    header: {
      flexDirection: row,
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    logo: {
      width: 52,
      height: 52,
      objectFit: "contain",
    },
    logoFallback: {
      width: 52,
      height: 52,
      backgroundColor: INK,
      alignItems: "center",
      justifyContent: "center",
    },
    logoFallbackText: {
      fontFamily: mono,
      color: "#ffffff",
      fontSize: 20,
      fontWeight: "bold",
    },
    headerEnd: {
      maxWidth: 230,
      textAlign: end,
    },
    label: {
      fontSize: 7.5,
      fontWeight: "bold",
      letterSpacing: tracking,
      color: INK,
    },
    mutedLine: {
      fontSize: 8.5,
      lineHeight: 1.7,
      color: MUTED,
    },
    partiesRow: {
      flexDirection: row,
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginTop: 48,
    },
    recipientBlock: {
      maxWidth: 250,
      textAlign: start,
    },
    titleBlock: {
      textAlign: end,
    },
    invoiceTitle: {
      fontSize: 26,
      fontWeight: "bold",
      letterSpacing: isRTL ? 0 : 1.5,
    },
    invoiceNumber: {
      fontFamily: mono,
      fontSize: 8.5,
      color: MUTED,
      marginTop: 4,
    },
    statusText: {
      fontSize: 7.5,
      fontWeight: "bold",
      letterSpacing: tracking,
      marginTop: 10,
    },
    table: {
      marginTop: 48,
    },
    tableHeader: {
      flexDirection: row,
      paddingBottom: 10,
    },
    tableRow: {
      flexDirection: row,
      paddingVertical: 8,
    },
    colDate: { width: "16%", textAlign: start },
    colDescription: { width: "40%", textAlign: start, paddingRight: 8 },
    colPrice: { width: "16%", textAlign: end },
    colQty: { width: "10%", textAlign: end },
    colAmount: { width: "18%", textAlign: end },
    cellText: {
      fontSize: 8.5,
      lineHeight: 1.5,
      color: MUTED,
    },
    totalsRule: {
      borderTopWidth: 0.75,
      borderTopColor: HAIRLINE,
      marginTop: 12,
      paddingTop: 16,
      flexDirection: row,
      justifyContent: "flex-end",
    },
    totalsBlock: {
      width: 220,
    },
    totalRow: {
      flexDirection: row,
      justifyContent: "space-between",
      paddingVertical: 3,
    },
    totalLabel: {
      fontSize: 8.5,
      color: INK,
    },
    totalValue: {
      fontSize: 8.5,
      color: MUTED,
      textAlign: end,
    },
    grandTotalRow: {
      flexDirection: row,
      justifyContent: "space-between",
      alignItems: "baseline",
      paddingTop: 14,
    },
    grandTotalLabel: {
      fontSize: 11,
      fontWeight: "bold",
      letterSpacing: isRTL ? 0 : 1,
    },
    grandTotalValue: {
      fontSize: 14,
      fontWeight: "bold",
    },
    notesSection: {
      marginTop: 56,
    },
    notesText: {
      fontSize: 8.5,
      lineHeight: 1.7,
      color: MUTED,
      marginTop: 12,
    },
    footer: {
      position: "absolute",
      bottom: 40,
      left: 48,
      right: 48,
      borderTopWidth: 0.75,
      borderTopColor: HAIRLINE,
      paddingTop: 12,
    },
    footerText: {
      fontSize: 7.5,
      color: MUTED,
      textAlign: start,
    },
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatCurrency = (
  amount: number,
  currency: string,
  locale: string
): string => {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

const formatDate = (date: Date, locale: string): string => {
  const s = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
  return locale === "ar" ? s : s.toUpperCase()
}

// ============================================================================
// Invoice Template Component
// ============================================================================

interface InvoiceTemplateProps {
  data: InvoiceData
  style?: TemplateStyle
}

export function InvoiceTemplate({
  data,
  style = "modern",
}: InvoiceTemplateProps) {
  const locale = data.locale || "en"
  const styles = createStyles(locale)
  const isRTL = locale === "ar"

  const labels = {
    invoice: isRTL ? "فاتورة" : "INVOICE",
    invoiceNumber: isRTL ? "رقم الفاتورة" : "INVOICE NUMBER",
    invoiceDate: isRTL ? "تاريخ الفاتورة" : "INVOICE DATE",
    recipient: isRTL ? "المستلم" : "RECIPIENT",
    student: isRTL ? "الطالب" : "Student",
    class: isRTL ? "الفصل" : "Class",
    description: isRTL ? "البيان" : "DESCRIPTION",
    quantity: isRTL ? "الكمية" : "QTY",
    unitPrice: isRTL ? "السعر" : "PRICE",
    amount: isRTL ? "المبلغ" : "AMOUNT",
    subtotal: isRTL ? "المجموع الفرعي" : "Subtotal",
    tax: isRTL ? "الضريبة" : "Tax",
    discount: isRTL ? "الخصم" : "Discount",
    grandTotal: isRTL ? "الإجمالي" : "TOTAL",
    amountPaid: isRTL ? "المدفوع" : "Paid",
    balance: isRTL ? "الرصيد المستحق" : "Balance due",
    notes: isRTL ? "ملاحظات" : "NOTES",
    dueBy: isRTL ? "يُستحق السداد بحلول" : "Payment is due by",
    bankDetails: isRTL ? "تفاصيل البنك" : "BANK DETAILS",
  }

  const statusLabels: Record<string, string> = {
    paid: isRTL ? "مدفوع" : "PAID",
    pending: isRTL ? "غير مدفوع" : "UNPAID",
    overdue: isRTL ? "متأخر" : "OVERDUE",
    draft: isRTL ? "مسودة" : "DRAFT",
    cancelled: isRTL ? "ملغي" : "CANCELLED",
  }
  const statusColor =
    data.status === "paid" ? INK : data.status === "overdue" ? "#b91c1c" : MUTED

  const schoolName = isRTL
    ? data.schoolNameAr || data.schoolName
    : data.schoolName
  const logoInitial = (schoolName || "•").trim().charAt(0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header — logo start, school identity end */}
        <View style={styles.header}>
          {data.schoolLogo ? (
            <Image src={data.schoolLogo} style={styles.logo} />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={styles.logoFallbackText}>{logoInitial}</Text>
            </View>
          )}
          <View style={styles.headerEnd}>
            <Text style={styles.label}>{schoolName}</Text>
            <View style={{ marginTop: 14 }}>
              {data.schoolEmail && (
                <Text style={styles.mutedLine}>{data.schoolEmail}</Text>
              )}
              {data.schoolPhone && (
                <Text style={styles.mutedLine}>{data.schoolPhone}</Text>
              )}
              {data.schoolAddress && (
                <Text style={styles.mutedLine}>{data.schoolAddress}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Recipient start — INVOICE end */}
        <View style={styles.partiesRow}>
          <View style={styles.recipientBlock}>
            <Text style={styles.label}>{labels.recipient}</Text>
            <View style={{ marginTop: 14 }}>
              <Text style={{ fontSize: 9, lineHeight: 1.7 }}>
                {data.clientName}
              </Text>
              {data.clientAddress && (
                <Text style={styles.mutedLine}>{data.clientAddress}</Text>
              )}
              {data.studentName && (
                <Text style={styles.mutedLine}>
                  {labels.student}: {data.studentName}
                </Text>
              )}
              {data.className && (
                <Text style={styles.mutedLine}>
                  {labels.class}: {data.className}
                </Text>
              )}
            </View>
            <View style={{ marginTop: 12 }}>
              {data.clientEmail && (
                <Text style={styles.mutedLine}>{data.clientEmail}</Text>
              )}
              {data.clientPhone && (
                <Text style={styles.mutedLine}>{data.clientPhone}</Text>
              )}
            </View>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.invoiceTitle}>{labels.invoice}</Text>
            <Text style={[styles.label, { marginTop: 18 }]}>
              {labels.invoiceNumber}
            </Text>
            <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabels[data.status] ?? data.status}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.label, styles.colDate]}>
              {labels.invoiceDate}
            </Text>
            <Text style={[styles.label, styles.colDescription]}>
              {labels.description}
            </Text>
            <Text style={[styles.label, styles.colPrice]}>
              {labels.unitPrice}
            </Text>
            <Text style={[styles.label, styles.colQty]}>{labels.quantity}</Text>
            <Text style={[styles.label, styles.colAmount]}>
              {labels.amount}
            </Text>
          </View>

          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.cellText, styles.colDate]}>
                {index === 0 ? formatDate(data.issueDate, locale) : ""}
              </Text>
              <Text style={[styles.cellText, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.cellText, styles.colPrice]}>
                {formatCurrency(item.unitPrice, data.currency, locale)}
              </Text>
              <Text style={[styles.cellText, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.cellText, styles.colAmount]}>
                {formatCurrency(item.total, data.currency, locale)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals — hairline, end-aligned block, big bold TOTAL */}
        <View style={styles.totalsRule}>
          <View style={styles.totalsBlock}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{labels.subtotal}</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(data.subtotal, data.currency, locale)}
              </Text>
            </View>

            {data.discount !== undefined && data.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{labels.discount}</Text>
                <Text style={styles.totalValue}>
                  -{formatCurrency(data.discount, data.currency, locale)}
                </Text>
              </View>
            )}

            {data.taxAmount !== undefined && data.taxAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{labels.tax}</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(data.taxAmount, data.currency, locale)}
                </Text>
              </View>
            )}

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>{labels.grandTotal}</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(data.total, data.currency, locale)}
              </Text>
            </View>

            {data.amountPaid !== undefined && data.amountPaid > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{labels.amountPaid}</Text>
                <Text style={styles.totalValue}>
                  -{formatCurrency(data.amountPaid, data.currency, locale)}
                </Text>
              </View>
            )}

            {data.balance !== undefined && data.balance > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { fontWeight: "bold" }]}>
                  {labels.balance}
                </Text>
                <Text
                  style={[
                    styles.totalValue,
                    { fontWeight: "bold", color: INK },
                  ]}
                >
                  {formatCurrency(data.balance, data.currency, locale)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.label}>{labels.notes}</Text>
          <Text style={styles.notesText}>
            {data.notes ||
              `${labels.dueBy} ${formatDate(data.dueDate, locale)}.`}
          </Text>
          {data.bankDetails && (
            <>
              <Text style={[styles.label, { marginTop: 16 }]}>
                {labels.bankDetails}
              </Text>
              <Text style={styles.notesText}>{data.bankDetails}</Text>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {schoolName}
            {data.schoolEmail ? `  •  ${data.schoolEmail}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export { createStyles }
