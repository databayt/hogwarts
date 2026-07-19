// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Payslip PDF Document — pure @react-pdf/renderer tree (no client/server
 * boundary) so the API route at app/api/payroll/slip/[id]/route.ts renders it
 * server-side. Mirrors the on-screen PayslipBreakdown; money is formatted here
 * from the school's currency (via lib/payment/currency).
 */
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import { formatCurrency } from "@/lib/payment/currency"

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#111",
    paddingBottom: 15,
  },
  headerText: { flexDirection: "column" },
  logo: { maxWidth: 90, maxHeight: 45, objectFit: "contain" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666" },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metaItem: { flexDirection: "column" },
  metaLabel: { fontSize: 8, color: "#999" },
  metaValue: { fontSize: 10, fontWeight: "bold" },
  section: { marginTop: 12, marginBottom: 6 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  subRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  label: { color: "#555" },
  subLabel: { color: "#888", paddingLeft: 10 },
  value: { fontWeight: "bold" },
  subValue: { color: "#888" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#111",
    marginTop: 4,
  },
  totalLabel: { fontSize: 12, fontWeight: "bold" },
  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#111",
    marginTop: 16,
  },
  netLabel: { fontSize: 14, fontWeight: "bold" },
  netValue: { fontSize: 18, fontWeight: "bold" },
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
})

interface Line {
  name: string
  amount: number
}

export interface PayslipDocData {
  slipNumber: string
  employeeName: string
  payPeriod: string
  payDate: string
  status: string
  currency: string
  locale?: string
  baseSalary: number
  allowances: Line[]
  grossSalary: number
  taxAmount: number
  socialSecurityAmount: number
  otherDeductions: Line[]
  totalDeductions: number
  netSalary: number
  schoolName?: string
  schoolLogoUrl?: string
}

export function PayslipDocument({
  data,
  t,
}: {
  data: PayslipDocData
  t: Record<string, string>
}) {
  const money = (n: number) => formatCurrency(n, data.currency, data.locale)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t.payslip || "Payslip"}</Text>
            <Text style={styles.subtitle}>
              {data.schoolName || "School"} — {data.slipNumber}
            </Text>
          </View>
          {data.schoolLogoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image has no alt
            <Image src={data.schoolLogoUrl} style={styles.logo} />
          ) : null}
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t.employee || "Employee"}</Text>
            <Text style={styles.metaValue}>{data.employeeName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t.payPeriod || "Pay period"}</Text>
            <Text style={styles.metaValue}>{data.payPeriod}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t.payDate || "Pay date"}</Text>
            <Text style={styles.metaValue}>{data.payDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t.status || "Status"}</Text>
            <Text style={styles.metaValue}>{data.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.earnings || "Earnings"}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t.baseSalary || "Base salary"}</Text>
            <Text style={styles.value}>{money(data.baseSalary)}</Text>
          </View>
          {data.allowances.map((a, i) => (
            <View key={i} style={styles.subRow}>
              <Text style={styles.subLabel}>{a.name}</Text>
              <Text style={styles.subValue}>{money(a.amount)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.grossPay || "Gross pay"}</Text>
            <Text style={styles.value}>{money(data.grossSalary)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t.deductions || "Deductions"}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t.incomeTax || "Income tax"}</Text>
            <Text style={styles.value}>{money(data.taxAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t.socialSecurity || "Social security"}
            </Text>
            <Text style={styles.value}>{money(data.socialSecurityAmount)}</Text>
          </View>
          {data.otherDeductions.map((d, i) => (
            <View key={i} style={styles.subRow}>
              <Text style={styles.subLabel}>{d.name}</Text>
              <Text style={styles.subValue}>{money(d.amount)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {t.totalDeductions || "Total deductions"}
            </Text>
            <Text style={styles.value}>{money(data.totalDeductions)}</Text>
          </View>
        </View>

        <View style={styles.netRow}>
          <Text style={styles.netLabel}>{t.netPay || "Net pay"}</Text>
          <Text style={styles.netValue}>{money(data.netSalary)}</Text>
        </View>

        <Text style={styles.footer}>
          {t.footerNote ||
            "This is a computer-generated payslip. No signature required."}
        </Text>
      </Page>
    </Document>
  )
}
