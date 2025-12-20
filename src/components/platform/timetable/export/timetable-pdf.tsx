"use client"

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

// Register fonts for Arabic support
Font.register({
  family: "Tajawal",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/tajawal/v9/Iura6YBj_oCad4k1nzGBC45I.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/tajawal/v9/Iurf6YBj_oCad4k1l_6gHrZpiYlJ.ttf",
      fontWeight: 700,
    },
  ],
})

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.ttf",
      fontWeight: 700,
    },
  ],
})

// Subject colors for visual distinction
const SUBJECT_COLORS: Record<string, string> = {
  Math: "#f3e8ff",
  Mathematics: "#f3e8ff",
  English: "#dcfce7",
  Science: "#fce7f3",
  Arabic: "#dbeafe",
  PE: "#fed7aa",
  "Physical Education": "#fed7aa",
  Music: "#fef3c7",
  Art: "#ffe4e6",
  History: "#fef3c7",
  Geography: "#ccfbf1",
  Islamic: "#d1fae5",
  "Islamic Studies": "#d1fae5",
  Computer: "#cffafe",
  "Computer Science": "#cffafe",
  Physics: "#e0e7ff",
  Chemistry: "#ede9fe",
  Biology: "#ecfccb",
  Social: "#e0f2fe",
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAY_LABELS_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
]

interface TimetableSlot {
  id: string
  dayOfWeek: number
  periodId: string
  periodName?: string
  subject?: string
  teacher?: string
  room?: string
  className?: string
}

interface Period {
  id: string
  name: string
  order: number
  startTime: Date | string
  endTime: Date | string
  isBreak: boolean
}

interface TimetablePDFProps {
  title: string
  subtitle: string
  termLabel: string
  schoolName: string
  slots: TimetableSlot[]
  periods: Period[]
  workingDays: number[]
  lunchAfterPeriod?: number | null
  isRTL?: boolean
  generatedAt?: Date
}

// Create styles
const createStyles = (isRTL: boolean) =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: isRTL ? "Tajawal" : "Inter",
      fontSize: 10,
      backgroundColor: "#ffffff",
    },
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      paddingBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: "#e5e5e5",
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      textAlign: isRTL ? "left" : "right",
    },
    schoolName: {
      fontSize: 16,
      fontWeight: 700,
      color: "#171717",
      marginBottom: 4,
    },
    title: {
      fontSize: 14,
      fontWeight: 700,
      color: "#404040",
    },
    subtitle: {
      fontSize: 11,
      color: "#737373",
      marginTop: 2,
    },
    termLabel: {
      fontSize: 10,
      color: "#525252",
      backgroundColor: "#f5f5f5",
      padding: "4 8",
      borderRadius: 4,
    },
    grid: {
      marginTop: 10,
    },
    gridHeader: {
      flexDirection: isRTL ? "row-reverse" : "row",
      backgroundColor: "#f5f5f5",
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: "#e5e5e5",
    },
    gridRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: "#e5e5e5",
    },
    periodCell: {
      width: 70,
      padding: 6,
      borderRightWidth: 1,
      borderColor: "#e5e5e5",
      backgroundColor: "#fafafa",
      justifyContent: "center",
    },
    periodText: {
      fontSize: 9,
      fontWeight: 700,
      color: "#525252",
      textAlign: "center",
    },
    periodTime: {
      fontSize: 7,
      color: "#737373",
      textAlign: "center",
      marginTop: 2,
    },
    dayHeaderCell: {
      flex: 1,
      padding: 8,
      borderRightWidth: 1,
      borderColor: "#e5e5e5",
      justifyContent: "center",
      alignItems: "center",
    },
    dayHeaderText: {
      fontSize: 10,
      fontWeight: 700,
      color: "#404040",
    },
    slotCell: {
      flex: 1,
      minHeight: 45,
      padding: 4,
      borderRightWidth: 1,
      borderColor: "#e5e5e5",
      justifyContent: "center",
      alignItems: "center",
    },
    slotSubject: {
      fontSize: 8,
      fontWeight: 700,
      color: "#171717",
      textAlign: "center",
    },
    slotTeacher: {
      fontSize: 7,
      color: "#525252",
      textAlign: "center",
      marginTop: 2,
    },
    slotRoom: {
      fontSize: 6,
      color: "#737373",
      textAlign: "center",
      marginTop: 1,
    },
    emptyCell: {
      backgroundColor: "#fafafa",
    },
    lunchRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      backgroundColor: "#f5f5f5",
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: "#e5e5e5",
    },
    lunchCell: {
      flex: 1,
      padding: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    lunchText: {
      fontSize: 9,
      fontWeight: 700,
      color: "#737373",
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: "#e5e5e5",
      paddingTop: 10,
    },
    footerText: {
      fontSize: 8,
      color: "#a3a3a3",
    },
  })

function getSubjectColor(subject: string): string {
  if (!subject) return "#fafafa"

  // Check direct mapping
  if (SUBJECT_COLORS[subject]) {
    return SUBJECT_COLORS[subject]
  }

  // Check partial matches
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) {
      return color
    }
  }

  // Fallback colors based on hash
  const colors = ["#fef3c7", "#dcfce7", "#dbeafe", "#f3e8ff", "#fce7f3"]
  const hash = subject
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function formatTime(date: Date | string): string {
  const d = new Date(date)
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`
}

export function TimetablePDF({
  title,
  subtitle,
  termLabel,
  schoolName,
  slots,
  periods,
  workingDays,
  lunchAfterPeriod,
  isRTL = false,
  generatedAt = new Date(),
}: TimetablePDFProps) {
  const styles = createStyles(isRTL)

  // Build slot lookup map
  const slotMap = new Map<string, TimetableSlot>()
  for (const slot of slots) {
    slotMap.set(`${slot.dayOfWeek}-${slot.periodId}`, slot)
  }

  // Filter teaching periods only
  const teachingPeriods = periods.filter((p) => !p.isBreak)

  // Sort days for RTL
  const sortedDays = isRTL ? [...workingDays].reverse() : workingDays

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.schoolName}>{schoolName}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.termLabel}>{termLabel}</Text>
          </View>
        </View>

        {/* Timetable Grid */}
        <View style={styles.grid}>
          {/* Header Row */}
          <View style={styles.gridHeader}>
            <View style={styles.periodCell}>
              <Text style={styles.periodText}>
                {isRTL ? "الحصة" : "Period"}
              </Text>
            </View>
            {sortedDays.map((day, dayIdx) => (
              <View
                key={day}
                style={
                  dayIdx === sortedDays.length - 1
                    ? { ...styles.dayHeaderCell, borderRightWidth: 0 }
                    : styles.dayHeaderCell
                }
              >
                <Text style={styles.dayHeaderText}>
                  {isRTL ? DAY_LABELS_AR[day] : DAY_LABELS[day]}
                </Text>
              </View>
            ))}
          </View>

          {/* Period Rows */}
          {teachingPeriods.map((period, periodIdx) => (
            <View key={period.id}>
              {/* Lunch Row (inserted after specified period) */}
              {lunchAfterPeriod && periodIdx + 1 === lunchAfterPeriod && (
                <View style={styles.lunchRow}>
                  <View style={styles.periodCell}>
                    <Text style={styles.lunchText}>
                      {isRTL ? "استراحة" : "Lunch"}
                    </Text>
                  </View>
                  <View style={styles.lunchCell}>
                    <Text style={styles.lunchText}>
                      {isRTL ? "استراحة الغداء" : "Lunch Break"}
                    </Text>
                  </View>
                </View>
              )}

              {/* Regular Period Row */}
              <View style={styles.gridRow}>
                <View style={styles.periodCell}>
                  <Text style={styles.periodText}>{period.name}</Text>
                  <Text style={styles.periodTime}>
                    {formatTime(period.startTime)}
                  </Text>
                </View>

                {sortedDays.map((day, dayIdx) => {
                  const slot = slotMap.get(`${day}-${period.id}`)
                  const bgColor = slot?.subject
                    ? getSubjectColor(slot.subject)
                    : "#fafafa"
                  const isLastCol = dayIdx === sortedDays.length - 1

                  return (
                    <View
                      key={`${day}-${period.id}`}
                      style={{
                        ...styles.slotCell,
                        backgroundColor: bgColor,
                        ...(isLastCol ? { borderRightWidth: 0 } : {}),
                      }}
                    >
                      {slot?.subject ? (
                        <>
                          <Text style={styles.slotSubject}>{slot.subject}</Text>
                          {slot.teacher && (
                            <Text style={styles.slotTeacher}>
                              {slot.teacher}
                            </Text>
                          )}
                          {slot.room && (
                            <Text style={styles.slotRoom}>{slot.room}</Text>
                          )}
                        </>
                      ) : (
                        <Text
                          style={[styles.slotTeacher, { color: "#d4d4d4" }]}
                        >
                          -
                        </Text>
                      )}
                    </View>
                  )
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isRTL ? "تم الإنشاء:" : "Generated:"}{" "}
            {generatedAt.toLocaleDateString()}
          </Text>
          <Text style={styles.footerText}>Powered by Hogwarts</Text>
        </View>
      </Page>
    </Document>
  )
}

export default TimetablePDF
