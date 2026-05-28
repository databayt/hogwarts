// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Payment Receipt PDF Document
 *
 * Pure @react-pdf/renderer React tree — no client/server boundary so both
 * `receipt-pdf.tsx` (client download button) and the server endpoint at
 * `app/api/payment/[paymentId]/receipt/route.ts` can reuse it.
 *
 * Currency is rendered by the caller — pass the already-formatted `amount`
 * string. See `src/lib/payment/currency.ts:formatCurrency` for AED/SAR/KWD.
 */
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#111",
    paddingBottom: 15,
  },
  headerText: {
    flexDirection: "column",
  },
  // P2.4 — top-end school logo (Aldar brand mark). Sits opposite the title
  // so the receipt looks like the school issued it, not the platform.
  logo: {
    maxWidth: 90,
    maxHeight: 45,
    objectFit: "contain",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
  },
  // P2.4 — signature block bottom-end above the footer. Used by the
  // accounting officer's image so AE/SA schools can hand the receipt to a
  // regulator without re-printing.
  signatureBlock: {
    marginTop: 40,
    alignItems: "flex-end",
  },
  signatureImage: {
    maxWidth: 130,
    maxHeight: 50,
    marginBottom: 4,
    objectFit: "contain",
  },
  signatureLabel: {
    fontSize: 9,
    color: "#666",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 4,
    width: 140,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: {
    color: "#555",
    width: "40%",
  },
  value: {
    fontWeight: "bold",
    width: "60%",
    textAlign: "right",
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#111",
    marginTop: 6,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: "bold",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  statusBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "3 8",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
  },
})

export interface ReceiptData {
  paymentNumber: string
  receiptNumber: string
  amount: string
  paymentDate: string
  paymentMethod: string
  status: string
  transactionId?: string
  studentName: string
  feeStructureName: string
  academicYear: string
  schoolName?: string
  // P2.4 — Branding. Pass absolute HTTPS URLs (Cloudflare R2 / S3 / direct
  // upload paths). Logo renders top-end of the header; signature renders
  // bottom-end above the footer. Both gracefully no-op when missing so
  // schools without branding configured still get a valid receipt.
  schoolLogoUrl?: string
  schoolSignatureUrl?: string
  // Optional name printed under the signature (e.g. "Finance Officer").
  signatureLabel?: string
}

export function ReceiptDocument({
  data,
  t,
}: {
  data: ReceiptData
  t: Record<string, string>
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {t.paymentReceipt || "Payment Receipt"}
            </Text>
            <Text style={styles.subtitle}>
              {data.schoolName || "School"} — {data.receiptNumber}
            </Text>
          </View>
          {data.schoolLogoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
            <Image src={data.schoolLogoUrl} style={styles.logo} />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t.paymentDetails || "Payment Details"}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t.paymentNumber || "Payment Number"}
            </Text>
            <Text style={styles.value}>{data.paymentNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t.receiptNumber || "Receipt Number"}
            </Text>
            <Text style={styles.value}>{data.receiptNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.date || "Date"}</Text>
            <Text style={styles.value}>{data.paymentDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.method || "Method"}</Text>
            <Text style={styles.value}>
              {data.paymentMethod.replace(/_/g, " ")}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.status || "Status"}</Text>
            <Text style={styles.statusBadge}>{data.status}</Text>
          </View>
          {data.transactionId && (
            <View style={styles.row}>
              <Text style={styles.label}>
                {t.transactionId || "Transaction ID"}
              </Text>
              <Text style={styles.value}>{data.transactionId}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t.studentInformation || "Student Information"}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t.student || "Student"}</Text>
            <Text style={styles.value}>{data.studentName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t.feeStructure || "Fee Structure"}
            </Text>
            <Text style={styles.value}>{data.feeStructureName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t.academicYear || "Academic Year"}
            </Text>
            <Text style={styles.value}>{data.academicYear}</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>
            {t.amountPaid || "Amount Paid"}
          </Text>
          <Text style={styles.amountValue}>{data.amount}</Text>
        </View>

        {data.schoolSignatureUrl ? (
          <View style={styles.signatureBlock}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src={data.schoolSignatureUrl}
              style={styles.signatureImage}
            />
            <Text style={styles.signatureLabel}>
              {data.signatureLabel ||
                t.authorisedSignature ||
                "Authorised Signature"}
            </Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          {data.schoolSignatureUrl
            ? t.footerSigned || "Verified by the school's finance office."
            : t.footerNote ||
              "This is a computer-generated receipt. No signature required."}
        </Text>
      </Page>
    </Document>
  )
}
