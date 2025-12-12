/**
 * Unified File Block - Receipt Template
 * PDF template for payment receipts
 */

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ReceiptData, TemplateStyle } from "../types";

// ============================================================================
// Font Registration
// ============================================================================

Font.register({
  family: "Tajawal",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/tajawal/v9/Iurf6YBj_oCad4k1l4qjHrRpiYlJ.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/tajawal/v9/Iurf6YBj_oCad4k1l8qkHrRpiYlJ.ttf",
      fontWeight: "bold",
    },
  ],
});

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
});

// ============================================================================
// Styles
// ============================================================================

const createStyles = (locale: string = "en") => {
  const isRTL = locale === "ar";
  const fontFamily = isRTL ? "Tajawal" : "Inter";

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
      alignItems: "flex-start",
      marginBottom: 30,
      paddingBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: "#22c55e",
    },
    logoSection: {
      alignItems: "center",
    },
    logo: {
      width: 70,
      height: 70,
      marginBottom: 8,
    },
    schoolName: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#111827",
      textAlign: "center",
    },
    receiptSection: {
      alignItems: isRTL ? "flex-start" : "flex-end",
    },
    receiptTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#22c55e",
      marginBottom: 10,
    },
    receiptNumber: {
      fontSize: 11,
      color: "#374151",
      marginBottom: 3,
    },
    paidBadge: {
      backgroundColor: "#dcfce7",
      color: "#166534",
      paddingVertical: 5,
      paddingHorizontal: 15,
      borderRadius: 4,
      fontSize: 10,
      fontWeight: "bold",
      textTransform: "uppercase",
      marginTop: 8,
    },
    infoSection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    infoBlock: {
      width: "45%",
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#22c55e",
      textTransform: "uppercase",
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
    },
    label: {
      fontSize: 8,
      color: "#6b7280",
      marginBottom: 2,
    },
    value: {
      fontSize: 10,
      color: "#111827",
      marginBottom: 6,
    },
    valueBold: {
      fontSize: 11,
      color: "#111827",
      fontWeight: "bold",
      marginBottom: 6,
    },
    table: {
      marginBottom: 30,
    },
    tableHeader: {
      flexDirection: isRTL ? "row-reverse" : "row",
      backgroundColor: "#f0fdf4",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderTopWidth: 2,
      borderTopColor: "#22c55e",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
    },
    tableRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#f3f4f6",
    },
    colItem: {
      width: "60%",
      textAlign: isRTL ? "right" : "left",
    },
    colAmount: {
      width: "40%",
      textAlign: isRTL ? "left" : "right",
    },
    headerText: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#166534",
      textTransform: "uppercase",
    },
    cellText: {
      fontSize: 10,
      color: "#374151",
    },
    totalSection: {
      alignItems: isRTL ? "flex-start" : "flex-end",
      marginBottom: 30,
    },
    totalRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      width: 220,
      paddingVertical: 8,
      borderTopWidth: 2,
      borderTopColor: "#22c55e",
    },
    totalLabel: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#111827",
      flex: 1,
    },
    totalValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#22c55e",
    },
    paymentInfo: {
      backgroundColor: "#f9fafb",
      padding: 15,
      borderRadius: 6,
      marginBottom: 20,
    },
    paymentTitle: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#374151",
      marginBottom: 8,
    },
    paymentRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginBottom: 4,
    },
    paymentLabel: {
      fontSize: 9,
      color: "#6b7280",
      width: 100,
    },
    paymentValue: {
      fontSize: 9,
      color: "#111827",
    },
    notesSection: {
      marginTop: 20,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: "#e5e5e5",
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
      lineHeight: 1.4,
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: "#e5e5e5",
    },
    footerText: {
      fontSize: 8,
      color: "#9ca3af",
    },
    thankYou: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#22c55e",
      textAlign: "center",
    },
    signatureSection: {
      alignItems: isRTL ? "flex-start" : "flex-end",
    },
    signatureLine: {
      width: 120,
      borderBottomWidth: 1,
      borderBottomColor: "#374151",
      marginBottom: 4,
    },
    signatureLabel: {
      fontSize: 8,
      color: "#6b7280",
    },
  });
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatCurrency = (amount: number, currency: string, locale: string): string => {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const formatDate = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const formatPaymentMethod = (method: string, locale: string): string => {
  const methods: Record<string, { en: string; ar: string }> = {
    cash: { en: "Cash", ar: "نقدي" },
    card: { en: "Credit/Debit Card", ar: "بطاقة ائتمان" },
    bank_transfer: { en: "Bank Transfer", ar: "تحويل بنكي" },
    cheque: { en: "Cheque", ar: "شيك" },
    online: { en: "Online Payment", ar: "دفع إلكتروني" },
  };
  const m = methods[method] || { en: method, ar: method };
  return locale === "ar" ? m.ar : m.en;
};

// ============================================================================
// Receipt Template Component
// ============================================================================

interface ReceiptTemplateProps {
  data: ReceiptData;
  style?: TemplateStyle;
}

export function ReceiptTemplate({ data, style = "modern" }: ReceiptTemplateProps) {
  const locale = data.locale || "en";
  const styles = createStyles(locale);
  const isRTL = locale === "ar";

  const labels = {
    receipt: isRTL ? "إيصال دفع" : "PAYMENT RECEIPT",
    receiptNo: isRTL ? "رقم الإيصال" : "Receipt No",
    date: isRTL ? "التاريخ" : "Date",
    paid: isRTL ? "مدفوع" : "PAID",
    receivedFrom: isRTL ? "مستلم من" : "Received From",
    payerName: isRTL ? "الاسم" : "Name",
    email: isRTL ? "البريد" : "Email",
    student: isRTL ? "الطالب" : "Student",
    studentId: isRTL ? "رقم الطالب" : "Student ID",
    paymentDetails: isRTL ? "تفاصيل الدفع" : "Payment Details",
    item: isRTL ? "البند" : "Item",
    amount: isRTL ? "المبلغ" : "Amount",
    total: isRTL ? "المجموع" : "Total",
    paymentMethod: isRTL ? "طريقة الدفع" : "Payment Method",
    transactionId: isRTL ? "رقم العملية" : "Transaction ID",
    invoiceRef: isRTL ? "مرجع الفاتورة" : "Invoice Reference",
    notes: isRTL ? "ملاحظات" : "Notes",
    thankYou: isRTL ? "شكراً لك" : "Thank You",
    authorizedSignature: isRTL ? "التوقيع المعتمد" : "Authorized Signature",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {data.schoolLogo && (
              <Image src={data.schoolLogo} style={styles.logo} />
            )}
            <Text style={styles.schoolName}>
              {isRTL ? data.schoolNameAr || data.schoolName : data.schoolName}
            </Text>
          </View>

          <View style={styles.receiptSection}>
            <Text style={styles.receiptTitle}>{labels.receipt}</Text>
            <Text style={styles.receiptNumber}>
              {labels.receiptNo}: {data.receiptNumber}
            </Text>
            <Text style={styles.receiptNumber}>
              {labels.date}: {formatDate(data.paymentDate, locale)}
            </Text>
            <View style={styles.paidBadge}>
              <Text>{labels.paid}</Text>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.sectionTitle}>{labels.receivedFrom}</Text>
            <Text style={styles.label}>{labels.payerName}</Text>
            <Text style={styles.valueBold}>{data.payerName}</Text>
            {data.payerEmail && (
              <>
                <Text style={styles.label}>{labels.email}</Text>
                <Text style={styles.value}>{data.payerEmail}</Text>
              </>
            )}
          </View>

          <View style={styles.infoBlock}>
            {data.studentName && (
              <>
                <Text style={styles.sectionTitle}>{labels.student}</Text>
                <Text style={styles.label}>{labels.payerName}</Text>
                <Text style={styles.valueBold}>{data.studentName}</Text>
                {data.studentId && (
                  <>
                    <Text style={styles.label}>{labels.studentId}</Text>
                    <Text style={styles.value}>{data.studentId}</Text>
                  </>
                )}
              </>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colItem]}>{labels.item}</Text>
            <Text style={[styles.headerText, styles.colAmount]}>{labels.amount}</Text>
          </View>

          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.cellText, styles.colItem]}>{item.description}</Text>
              <Text style={[styles.cellText, styles.colAmount]}>
                {formatCurrency(item.amount, data.currency, locale)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{labels.total}</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(data.total, data.currency, locale)}
            </Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>{labels.paymentDetails}</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{labels.paymentMethod}:</Text>
            <Text style={styles.paymentValue}>
              {formatPaymentMethod(data.paymentMethod, locale)}
            </Text>
          </View>
          {data.transactionId && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{labels.transactionId}:</Text>
              <Text style={styles.paymentValue}>{data.transactionId}</Text>
            </View>
          )}
          {data.invoiceNumber && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{labels.invoiceRef}:</Text>
              <Text style={styles.paymentValue}>{data.invoiceNumber}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>{labels.notes}</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.thankYou}>{labels.thankYou}</Text>
            {data.schoolPhone && (
              <Text style={styles.footerText}>{data.schoolPhone}</Text>
            )}
            {data.schoolEmail && (
              <Text style={styles.footerText}>{data.schoolEmail}</Text>
            )}
          </View>

          <View style={styles.signatureSection}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{labels.authorizedSignature}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export { createStyles as createReceiptStyles };
