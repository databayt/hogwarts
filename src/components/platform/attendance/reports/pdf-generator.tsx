"use client";

import * as React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";

// Register fonts (optional - uses default sans-serif)
// Font.register({ family: 'Tajawal', src: '/fonts/Tajawal-Regular.ttf' })

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: "1 solid #333",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 3,
  },
  metadata: {
    fontSize: 9,
    color: "#888",
  },
  statsGrid: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statValueGreen: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#22c55e",
  },
  statValueRed: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
  },
  statValueYellow: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#eab308",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottom: "1 solid #ddd",
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5 solid #eee",
    paddingVertical: 6,
    paddingHorizontal: 5,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottom: "0.5 solid #eee",
    paddingVertical: 6,
    paddingHorizontal: 5,
    backgroundColor: "#fafafa",
  },
  colDate: { width: "12%", fontSize: 9 },
  colStudent: { width: "20%", fontSize: 9 },
  colClass: { width: "18%", fontSize: 9 },
  colStatus: { width: "12%", fontSize: 9 },
  colMethod: { width: "12%", fontSize: 9 },
  colCheckIn: { width: "10%", fontSize: 9 },
  colCheckOut: { width: "10%", fontSize: 9 },
  colNotes: { width: "6%", fontSize: 8, overflow: "hidden" },
  headerCell: {
    fontWeight: "bold",
    fontSize: 9,
  },
  statusPresent: {
    color: "#22c55e",
    fontWeight: "bold",
  },
  statusAbsent: {
    color: "#ef4444",
    fontWeight: "bold",
  },
  statusLate: {
    color: "#eab308",
    fontWeight: "bold",
  },
  statusExcused: {
    color: "#3b82f6",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
    borderTop: "0.5 solid #ddd",
    paddingTop: 10,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 30,
    fontSize: 9,
    color: "#666",
  },
});

interface ReportRecord {
  id: string;
  date: string;
  studentName: string;
  className: string;
  status: string;
  method: string;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string | null;
}

interface Stats {
  total: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

interface AttendancePDFProps {
  records: ReportRecord[];
  stats: Stats | null;
  dateRange: { from: Date; to: Date };
  schoolName?: string;
  className?: string;
  locale?: string;
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case "PRESENT":
      return styles.statusPresent;
    case "ABSENT":
      return styles.statusAbsent;
    case "LATE":
      return styles.statusLate;
    case "EXCUSED":
      return styles.statusExcused;
    default:
      return {};
  }
};

const formatDate = (dateStr: string, locale: string = "en") => {
  return new Date(dateStr).toLocaleDateString(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
};

const formatTime = (timeStr: string | undefined, locale: string = "en") => {
  if (!timeStr) return "-";
  return new Date(timeStr).toLocaleTimeString(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

function AttendanceReportDocument({
  records,
  stats,
  dateRange,
  schoolName = "School",
  className,
  locale = "en",
}: AttendancePDFProps) {
  const isArabic = locale === "ar";
  const itemsPerPage = 25;
  const pages = [];

  for (let i = 0; i < records.length; i += itemsPerPage) {
    pages.push(records.slice(i, i + itemsPerPage));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  return (
    <Document>
      {pages.map((pageRecords, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page} orientation="landscape">
          {/* Header - only on first page */}
          {pageIndex === 0 && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {isArabic ? "تقرير الحضور" : "Attendance Report"}
                </Text>
                <Text style={styles.subtitle}>{schoolName}</Text>
                {className && (
                  <Text style={styles.subtitle}>
                    {isArabic ? "الفصل" : "Class"}: {className}
                  </Text>
                )}
                <Text style={styles.metadata}>
                  {isArabic ? "الفترة" : "Period"}:{" "}
                  {formatDate(dateRange.from.toISOString(), locale)} -{" "}
                  {formatDate(dateRange.to.toISOString(), locale)}
                </Text>
                <Text style={styles.metadata}>
                  {isArabic ? "تاريخ التصدير" : "Generated"}:{" "}
                  {new Date().toLocaleDateString(
                    locale === "ar" ? "ar-SA" : "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </Text>
              </View>

              {/* Stats Summary */}
              {stats && (
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>
                      {isArabic ? "إجمالي السجلات" : "Total Records"}
                    </Text>
                    <Text style={styles.statValue}>{stats.total}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>
                      {isArabic ? "حاضر" : "Present"}
                    </Text>
                    <Text style={styles.statValueGreen}>{stats.present}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>
                      {isArabic ? "متأخر" : "Late"}
                    </Text>
                    <Text style={styles.statValueYellow}>{stats.late}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>
                      {isArabic ? "غائب" : "Absent"}
                    </Text>
                    <Text style={styles.statValueRed}>{stats.absent}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>
                      {isArabic ? "نسبة الحضور" : "Attendance Rate"}
                    </Text>
                    <Text style={styles.statValue}>{stats.attendanceRate}%</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDate, styles.headerCell]}>
                {isArabic ? "التاريخ" : "Date"}
              </Text>
              <Text style={[styles.colStudent, styles.headerCell]}>
                {isArabic ? "الطالب" : "Student"}
              </Text>
              <Text style={[styles.colClass, styles.headerCell]}>
                {isArabic ? "الفصل" : "Class"}
              </Text>
              <Text style={[styles.colStatus, styles.headerCell]}>
                {isArabic ? "الحالة" : "Status"}
              </Text>
              <Text style={[styles.colMethod, styles.headerCell]}>
                {isArabic ? "الطريقة" : "Method"}
              </Text>
              <Text style={[styles.colCheckIn, styles.headerCell]}>
                {isArabic ? "دخول" : "In"}
              </Text>
              <Text style={[styles.colCheckOut, styles.headerCell]}>
                {isArabic ? "خروج" : "Out"}
              </Text>
              <Text style={[styles.colNotes, styles.headerCell]}>
                {isArabic ? "ملاحظات" : "Notes"}
              </Text>
            </View>

            {pageRecords.map((record, index) => (
              <View
                key={record.id}
                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={styles.colDate}>
                  {formatDate(record.date, locale)}
                </Text>
                <Text style={styles.colStudent}>{record.studentName}</Text>
                <Text style={styles.colClass}>{record.className}</Text>
                <Text style={[styles.colStatus, getStatusStyle(record.status)]}>
                  {record.status}
                </Text>
                <Text style={styles.colMethod}>
                  {record.method.replace("_", " ")}
                </Text>
                <Text style={styles.colCheckIn}>
                  {formatTime(record.checkInTime, locale)}
                </Text>
                <Text style={styles.colCheckOut}>
                  {formatTime(record.checkOutTime, locale)}
                </Text>
                <Text style={styles.colNotes}>{record.notes || "-"}</Text>
              </View>
            ))}

            {pageRecords.length === 0 && (
              <View style={styles.tableRow}>
                <Text style={{ textAlign: "center", width: "100%" }}>
                  {isArabic ? "لا توجد سجلات" : "No records found"}
                </Text>
              </View>
            )}
          </View>

          {/* Page Number */}
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
            fixed
          />

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text>
              {isArabic
                ? "تم إنشاء هذا التقرير بواسطة نظام إدارة المدرسة"
                : "Generated by School Management System"}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}

export async function generateAttendancePDF(
  props: AttendancePDFProps
): Promise<Blob> {
  const doc = <AttendanceReportDocument {...props} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
