"use client"

import * as XLSX from "xlsx"

interface ReportRecord {
  id: string
  date: string
  studentName: string
  className: string
  status: string
  method: string
  checkInTime?: string
  checkOutTime?: string
  notes?: string | null
}

interface Stats {
  total: number
  present: number
  absent: number
  late: number
  attendanceRate: number
}

interface ExcelExportOptions {
  records: ReportRecord[]
  stats: Stats | null
  dateRange: { from: Date; to: Date }
  schoolName?: string
  className?: string
  locale?: string
}

const formatDate = (dateStr: string, locale: string = "en") => {
  return new Date(dateStr).toLocaleDateString(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  )
}

const formatTime = (timeStr: string | undefined, locale: string = "en") => {
  if (!timeStr) return "-"
  return new Date(timeStr).toLocaleTimeString(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  )
}

export function generateAttendanceExcel({
  records,
  stats,
  dateRange,
  schoolName = "School",
  className,
  locale = "en",
}: ExcelExportOptions): Blob {
  const isArabic = locale === "ar"
  const workbook = XLSX.utils.book_new()

  // ============================================
  // Sheet 1: Summary
  // ============================================
  const summaryData: (string | number)[][] = [
    [isArabic ? "تقرير الحضور" : "Attendance Report"],
    [],
    [isArabic ? "المدرسة" : "School", schoolName],
    ...(className ? [[isArabic ? "الفصل" : "Class", className]] : []),
    [
      isArabic ? "الفترة" : "Period",
      `${formatDate(dateRange.from.toISOString(), locale)} - ${formatDate(dateRange.to.toISOString(), locale)}`,
    ],
    [
      isArabic ? "تاريخ التصدير" : "Generated",
      new Date().toLocaleString(locale === "ar" ? "ar-SA" : "en-US"),
    ],
    [],
    [isArabic ? "ملخص الإحصائيات" : "Statistics Summary"],
    [],
  ]

  if (stats) {
    summaryData.push(
      [isArabic ? "إجمالي السجلات" : "Total Records", stats.total],
      [isArabic ? "حاضر" : "Present", stats.present],
      [isArabic ? "متأخر" : "Late", stats.late],
      [isArabic ? "غائب" : "Absent", stats.absent],
      [isArabic ? "نسبة الحضور" : "Attendance Rate", `${stats.attendanceRate}%`]
    )
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)

  // Style the summary sheet
  summarySheet["!cols"] = [{ wch: 25 }, { wch: 35 }]
  summarySheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }] // Merge title

  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    isArabic ? "ملخص" : "Summary"
  )

  // ============================================
  // Sheet 2: Detailed Records
  // ============================================
  const headers = isArabic
    ? [
        "التاريخ",
        "الطالب",
        "الفصل",
        "الحالة",
        "الطريقة",
        "وقت الدخول",
        "وقت الخروج",
        "ملاحظات",
      ]
    : [
        "Date",
        "Student",
        "Class",
        "Status",
        "Method",
        "Check-in",
        "Check-out",
        "Notes",
      ]

  const detailData = [
    headers,
    ...records.map((record) => [
      formatDate(record.date, locale),
      record.studentName,
      record.className,
      record.status,
      record.method.replace("_", " "),
      formatTime(record.checkInTime, locale),
      formatTime(record.checkOutTime, locale),
      record.notes || "",
    ]),
  ]

  const detailSheet = XLSX.utils.aoa_to_sheet(detailData)

  // Set column widths
  detailSheet["!cols"] = [
    { wch: 12 }, // Date
    { wch: 25 }, // Student
    { wch: 20 }, // Class
    { wch: 10 }, // Status
    { wch: 12 }, // Method
    { wch: 10 }, // Check-in
    { wch: 10 }, // Check-out
    { wch: 30 }, // Notes
  ]

  // Add autofilter
  detailSheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: records.length, c: headers.length - 1 },
    }),
  }

  XLSX.utils.book_append_sheet(
    workbook,
    detailSheet,
    isArabic ? "السجلات" : "Records"
  )

  // ============================================
  // Sheet 3: Analytics by Status
  // ============================================
  const statusCounts = records.reduce(
    (acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const analyticsData = [
    [isArabic ? "تحليل الحضور حسب الحالة" : "Attendance Analysis by Status"],
    [],
    [
      isArabic ? "الحالة" : "Status",
      isArabic ? "العدد" : "Count",
      isArabic ? "النسبة" : "Percentage",
    ],
    ...Object.entries(statusCounts).map(([status, count]) => [
      status,
      count,
      `${((count / records.length) * 100).toFixed(1)}%`,
    ]),
  ]

  const analyticsSheet = XLSX.utils.aoa_to_sheet(analyticsData)
  analyticsSheet["!cols"] = [{ wch: 15 }, { wch: 10 }, { wch: 12 }]
  analyticsSheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]

  XLSX.utils.book_append_sheet(
    workbook,
    analyticsSheet,
    isArabic ? "التحليلات" : "Analytics"
  )

  // ============================================
  // Sheet 4: By Class Breakdown
  // ============================================
  const classCounts = records.reduce(
    (acc, record) => {
      if (!acc[record.className]) {
        acc[record.className] = { total: 0, present: 0, absent: 0, late: 0 }
      }
      acc[record.className].total++
      if (record.status === "PRESENT") acc[record.className].present++
      if (record.status === "ABSENT") acc[record.className].absent++
      if (record.status === "LATE") acc[record.className].late++
      return acc
    },
    {} as Record<
      string,
      { total: number; present: number; absent: number; late: number }
    >
  )

  const classBreakdownData = [
    [isArabic ? "تحليل حسب الفصل" : "Breakdown by Class"],
    [],
    [
      isArabic ? "الفصل" : "Class",
      isArabic ? "الإجمالي" : "Total",
      isArabic ? "حاضر" : "Present",
      isArabic ? "غائب" : "Absent",
      isArabic ? "متأخر" : "Late",
      isArabic ? "نسبة الحضور" : "Rate",
    ],
    ...Object.entries(classCounts).map(([className, counts]) => [
      className,
      counts.total,
      counts.present,
      counts.absent,
      counts.late,
      counts.total > 0
        ? `${(((counts.present + counts.late) / counts.total) * 100).toFixed(1)}%`
        : "0%",
    ]),
  ]

  const classSheet = XLSX.utils.aoa_to_sheet(classBreakdownData)
  classSheet["!cols"] = [
    { wch: 25 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
  ]
  classSheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]

  XLSX.utils.book_append_sheet(
    workbook,
    classSheet,
    isArabic ? "حسب الفصل" : "By Class"
  )

  // ============================================
  // Sheet 5: By Date Breakdown
  // ============================================
  const dateCounts = records.reduce(
    (acc, record) => {
      const dateKey = formatDate(record.date, locale)
      if (!acc[dateKey]) {
        acc[dateKey] = { total: 0, present: 0, absent: 0, late: 0 }
      }
      acc[dateKey].total++
      if (record.status === "PRESENT") acc[dateKey].present++
      if (record.status === "ABSENT") acc[dateKey].absent++
      if (record.status === "LATE") acc[dateKey].late++
      return acc
    },
    {} as Record<
      string,
      { total: number; present: number; absent: number; late: number }
    >
  )

  const dateBreakdownData = [
    [isArabic ? "تحليل حسب التاريخ" : "Breakdown by Date"],
    [],
    [
      isArabic ? "التاريخ" : "Date",
      isArabic ? "الإجمالي" : "Total",
      isArabic ? "حاضر" : "Present",
      isArabic ? "غائب" : "Absent",
      isArabic ? "متأخر" : "Late",
      isArabic ? "نسبة الحضور" : "Rate",
    ],
    ...Object.entries(dateCounts)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, counts]) => [
        date,
        counts.total,
        counts.present,
        counts.absent,
        counts.late,
        counts.total > 0
          ? `${(((counts.present + counts.late) / counts.total) * 100).toFixed(1)}%`
          : "0%",
      ]),
  ]

  const dateSheet = XLSX.utils.aoa_to_sheet(dateBreakdownData)
  dateSheet["!cols"] = [
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
  ]
  dateSheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]

  XLSX.utils.book_append_sheet(
    workbook,
    dateSheet,
    isArabic ? "حسب التاريخ" : "By Date"
  )

  // Generate the file
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  })

  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

export function downloadExcel(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
