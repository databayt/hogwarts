/**
 * Unified File Block - Invoice Template
 * PDF template for invoices
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

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2",
      fontWeight: "bold",
    },
  ],
})

// ============================================================================
// Styles
// ============================================================================

const createStyles = (locale: string = "en") => {
  const isRTL = locale === "ar"
  const fontFamily = isRTL ? "Rubik" : "Inter"

  return StyleSheet.create({
    page: {
      padding: 40,
      fontFamily,
      fontSize: 10,
      direction: isRTL ? "rtl" : "ltr",
      backgroundColor: "#ffffff",
    },
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginBottom: 30,
      paddingBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: "#e5e5e5",
    },
    logo: {
      width: 80,
      height: 80,
    },
    schoolInfo: {
      textAlign: isRTL ? "left" : "right",
      maxWidth: 200,
    },
    schoolName: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 5,
    },
    schoolDetail: {
      fontSize: 9,
      color: "#666",
      marginBottom: 2,
    },
    invoiceTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#111827",
      marginBottom: 20,
      textAlign: isRTL ? "right" : "left",
    },
    infoSection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    infoBlock: {
      width: "45%",
    },
    label: {
      fontSize: 9,
      color: "#6b7280",
      marginBottom: 2,
      textTransform: "uppercase",
    },
    value: {
      fontSize: 11,
      marginBottom: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      fontSize: 9,
      fontWeight: "bold",
      alignSelf: "flex-start",
    },
    statusPaid: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    statusPending: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    statusOverdue: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    },
    table: {
      marginBottom: 30,
    },
    tableHeader: {
      flexDirection: isRTL ? "row-reverse" : "row",
      backgroundColor: "#f3f4f6",
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
    },
    tableRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#f3f4f6",
    },
    colDescription: {
      width: "45%",
      textAlign: isRTL ? "right" : "left",
    },
    colQty: {
      width: "15%",
      textAlign: "center",
    },
    colPrice: {
      width: "20%",
      textAlign: isRTL ? "left" : "right",
    },
    colTotal: {
      width: "20%",
      textAlign: isRTL ? "left" : "right",
    },
    headerText: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#374151",
      textTransform: "uppercase",
    },
    cellText: {
      fontSize: 10,
    },
    totalsSection: {
      alignItems: isRTL ? "flex-start" : "flex-end",
      marginTop: 20,
    },
    totalRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      width: 200,
      paddingVertical: 5,
    },
    totalLabel: {
      fontSize: 10,
      color: "#6b7280",
    },
    totalValue: {
      fontSize: 10,
      textAlign: isRTL ? "left" : "right",
    },
    grandTotal: {
      borderTopWidth: 2,
      borderTopColor: "#111827",
      paddingTop: 10,
      marginTop: 10,
    },
    grandTotalLabel: {
      fontSize: 12,
      fontWeight: "bold",
    },
    grandTotalValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#111827",
    },
    footer: {
      position: "absolute",
      bottom: 40,
      left: 40,
      right: 40,
    },
    notesSection: {
      marginBottom: 20,
    },
    notesTitle: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#374151",
      marginBottom: 5,
    },
    notesText: {
      fontSize: 9,
      color: "#6b7280",
    },
    bankDetails: {
      backgroundColor: "#f9fafb",
      padding: 15,
      borderRadius: 4,
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
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

const getStatusStyle = (
  status: string,
  styles: ReturnType<typeof createStyles>
) => {
  switch (status) {
    case "paid":
      return styles.statusPaid
    case "overdue":
      return styles.statusOverdue
    default:
      return styles.statusPending
  }
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
    invoiceNumber: isRTL ? "رقم الفاتورة" : "Invoice Number",
    issueDate: isRTL ? "تاريخ الإصدار" : "Issue Date",
    dueDate: isRTL ? "تاريخ الاستحقاق" : "Due Date",
    status: isRTL ? "الحالة" : "Status",
    billTo: isRTL ? "فاتورة إلى" : "Bill To",
    student: isRTL ? "الطالب" : "Student",
    class: isRTL ? "الفصل" : "Class",
    description: isRTL ? "الوصف" : "Description",
    quantity: isRTL ? "الكمية" : "Qty",
    unitPrice: isRTL ? "السعر" : "Price",
    total: isRTL ? "المجموع" : "Total",
    subtotal: isRTL ? "المجموع الفرعي" : "Subtotal",
    tax: isRTL ? "الضريبة" : "Tax",
    discount: isRTL ? "الخصم" : "Discount",
    grandTotal: isRTL ? "المجموع الكلي" : "Grand Total",
    amountPaid: isRTL ? "المبلغ المدفوع" : "Amount Paid",
    balance: isRTL ? "الرصيد المستحق" : "Balance Due",
    notes: isRTL ? "ملاحظات" : "Notes",
    paymentTerms: isRTL ? "شروط الدفع" : "Payment Terms",
    bankDetails: isRTL ? "تفاصيل البنك" : "Bank Details",
  }

  const statusLabels: Record<string, string> = {
    paid: isRTL ? "مدفوع" : "Paid",
    pending: isRTL ? "معلق" : "Pending",
    overdue: isRTL ? "متأخر" : "Overdue",
    draft: isRTL ? "مسودة" : "Draft",
    cancelled: isRTL ? "ملغي" : "Cancelled",
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {data.schoolLogo && (
              <Image src={data.schoolLogo} style={styles.logo} />
            )}
          </View>
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>
              {isRTL ? data.schoolNameAr || data.schoolName : data.schoolName}
            </Text>
            {data.schoolAddress && (
              <Text style={styles.schoolDetail}>{data.schoolAddress}</Text>
            )}
            {data.schoolPhone && (
              <Text style={styles.schoolDetail}>{data.schoolPhone}</Text>
            )}
            {data.schoolEmail && (
              <Text style={styles.schoolDetail}>{data.schoolEmail}</Text>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.invoiceTitle}>{labels.invoice}</Text>

        {/* Invoice Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>{labels.invoiceNumber}</Text>
            <Text style={styles.value}>{data.invoiceNumber}</Text>

            <Text style={styles.label}>{labels.issueDate}</Text>
            <Text style={styles.value}>
              {formatDate(data.issueDate, locale)}
            </Text>

            <Text style={styles.label}>{labels.dueDate}</Text>
            <Text style={styles.value}>{formatDate(data.dueDate, locale)}</Text>

            <Text style={styles.label}>{labels.status}</Text>
            <View
              style={[styles.statusBadge, getStatusStyle(data.status, styles)]}
            >
              <Text>{statusLabels[data.status]}</Text>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>{labels.billTo}</Text>
            <Text style={[styles.value, { fontWeight: "bold" }]}>
              {data.clientName}
            </Text>
            {data.clientEmail && (
              <Text style={styles.value}>{data.clientEmail}</Text>
            )}
            {data.clientPhone && (
              <Text style={styles.value}>{data.clientPhone}</Text>
            )}
            {data.clientAddress && (
              <Text style={styles.value}>{data.clientAddress}</Text>
            )}

            {data.studentName && (
              <>
                <Text style={[styles.label, { marginTop: 10 }]}>
                  {labels.student}
                </Text>
                <Text style={styles.value}>{data.studentName}</Text>
              </>
            )}
            {data.className && (
              <>
                <Text style={styles.label}>{labels.class}</Text>
                <Text style={styles.value}>{data.className}</Text>
              </>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colDescription]}>
              {labels.description}
            </Text>
            <Text style={[styles.headerText, styles.colQty]}>
              {labels.quantity}
            </Text>
            <Text style={[styles.headerText, styles.colPrice]}>
              {labels.unitPrice}
            </Text>
            <Text style={[styles.headerText, styles.colTotal]}>
              {labels.total}
            </Text>
          </View>

          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.cellText, styles.colDescription]}>
                {isRTL
                  ? item.descriptionAr || item.description
                  : item.description}
              </Text>
              <Text style={[styles.cellText, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.cellText, styles.colPrice]}>
                {formatCurrency(item.unitPrice, data.currency, locale)}
              </Text>
              <Text style={[styles.cellText, styles.colTotal]}>
                {formatCurrency(item.total, data.currency, locale)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{labels.subtotal}</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(data.subtotal, data.currency, locale)}
            </Text>
          </View>

          {data.taxAmount !== undefined && data.taxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{labels.tax}</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(data.taxAmount, data.currency, locale)}
              </Text>
            </View>
          )}

          {data.discount !== undefined && data.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{labels.discount}</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(data.discount, data.currency, locale)}
              </Text>
            </View>
          )}

          <View style={[styles.totalRow, styles.grandTotal]}>
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

          {data.balance !== undefined && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { fontWeight: "bold" }]}>
                {labels.balance}
              </Text>
              <Text style={[styles.totalValue, { fontWeight: "bold" }]}>
                {formatCurrency(data.balance, data.currency, locale)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {data.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>{labels.notes}</Text>
              <Text style={styles.notesText}>{data.notes}</Text>
            </View>
          )}

          {data.bankDetails && (
            <View style={styles.bankDetails}>
              <Text style={styles.notesTitle}>{labels.bankDetails}</Text>
              <Text style={styles.notesText}>{data.bankDetails}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

export { createStyles }
