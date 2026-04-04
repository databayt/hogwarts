// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useCallback, useState } from "react"
import {
  Document,
  Page,
  pdf,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"
import { Download, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#111",
    paddingBottom: 15,
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

interface ReceiptData {
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
}

function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment Receipt</Text>
          <Text style={styles.subtitle}>
            {data.schoolName || "School"} — {data.receiptNumber}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Number</Text>
            <Text style={styles.value}>{data.paymentNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Receipt Number</Text>
            <Text style={styles.value}>{data.receiptNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{data.paymentDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Method</Text>
            <Text style={styles.value}>
              {data.paymentMethod.replace(/_/g, " ")}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.statusBadge}>{data.status}</Text>
          </View>
          {data.transactionId && (
            <View style={styles.row}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.value}>{data.transactionId}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Student</Text>
            <Text style={styles.value}>{data.studentName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fee Structure</Text>
            <Text style={styles.value}>{data.feeStructureName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Academic Year</Text>
            <Text style={styles.value}>{data.academicYear}</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amountValue}>{data.amount}</Text>
        </View>

        <Text style={styles.footer}>
          This is a computer-generated receipt. No signature required.
        </Text>
      </Page>
    </Document>
  )
}

interface DownloadReceiptProps {
  data: ReceiptData
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function DownloadReceipt({
  data,
  variant = "outline",
  size = "sm",
}: DownloadReceiptProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = useCallback(async () => {
    setIsGenerating(true)
    try {
      const blob = await pdf(<ReceiptDocument data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `receipt-${data.receiptNumber}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to generate receipt PDF:", err)
    } finally {
      setIsGenerating(false)
    }
  }, [data])

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="me-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="me-2 h-4 w-4" />
      )}
      {isGenerating ? "Generating..." : "Download Receipt"}
    </Button>
  )
}
