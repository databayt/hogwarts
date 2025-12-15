// Grade Certificate PDF Template - Wall-Worthy Design
import React from "react"
import {
  Circle,
  Document,
  Image,
  Page,
  Path,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer"

import type { Locale } from "@/components/internationalization/config"

export interface CertificateData {
  // Student info
  studentName: string
  studentId?: string
  className?: string
  // Grade info
  title: string // Assignment/exam title
  type: "assignment" | "exam" | "grade"
  subject?: string
  score: number
  maxScore: number
  percentage: number
  grade: string
  // School info
  schoolName: string
  schoolLogo?: string
  // Dates
  date: Date
  gradedAt?: Date
  // Optional
  feedback?: string
  gradedBy?: string
}

export interface CertificateOptions {
  language: Locale
  template: "elegant" | "classic" | "modern"
  includeSignatures: boolean
  includeFeedback: boolean
}

// Decorative corner ornament component
const CornerOrnament = ({
  position,
}: {
  position: "tl" | "tr" | "bl" | "br"
}) => {
  const rotation =
    position === "tl"
      ? 0
      : position === "tr"
        ? 90
        : position === "bl"
          ? 270
          : 180
  const x = position === "tl" || position === "bl" ? 20 : 555
  const y = position === "tl" || position === "tr" ? 20 : 801

  return (
    <Svg
      width="60"
      height="60"
      style={{ position: "absolute", left: x, top: y }}
    >
      <Path
        d={`M 0 50 Q 0 0 50 0`}
        stroke="#C9A962"
        strokeWidth="2"
        fill="none"
        transform={`rotate(${rotation} 25 25)`}
      />
      <Circle cx="10" cy="10" r="3" fill="#C9A962" />
    </Svg>
  )
}

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: "#FFFEF5",
    position: "relative",
  },
  // Outer decorative border
  outerBorder: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    borderWidth: 3,
    borderColor: "#C9A962",
    borderStyle: "solid",
  },
  // Inner decorative border
  innerBorder: {
    position: "absolute",
    top: 25,
    left: 25,
    right: 25,
    bottom: 25,
    borderWidth: 1,
    borderColor: "#C9A962",
    borderStyle: "solid",
  },
  // Content container
  content: {
    padding: 50,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
  },
  // Header section
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  schoolLogo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  schoolName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1A365D",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 5,
  },
  // Title section
  titleSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  certificateOf: {
    fontSize: 12,
    fontFamily: "Helvetica",
    color: "#718096",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: "#1A365D",
    textTransform: "uppercase",
    letterSpacing: 6,
  },
  decorativeLine: {
    width: 200,
    height: 2,
    backgroundColor: "#C9A962",
    marginVertical: 15,
  },
  decorativeLineSmall: {
    width: 100,
    height: 1,
    backgroundColor: "#C9A962",
    marginVertical: 10,
  },
  // Recipient section
  recipientSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  presentedTo: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#718096",
    letterSpacing: 2,
    marginBottom: 10,
  },
  studentName: {
    fontSize: 32,
    fontFamily: "Helvetica-BoldOblique",
    color: "#2D3748",
    marginBottom: 5,
  },
  studentInfo: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#718096",
    marginTop: 5,
  },
  // Achievement section
  achievementSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  achievementText: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#4A5568",
    textAlign: "center",
    lineHeight: 1.6,
    maxWidth: 400,
    marginBottom: 15,
  },
  // Score display
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    marginVertical: 20,
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E2D9C8",
  },
  scoreItem: {
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#1A365D",
  },
  scoreLabel: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#718096",
    letterSpacing: 1,
    marginTop: 4,
    textTransform: "uppercase",
  },
  // Grade badge
  gradeBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A365D",
    alignItems: "center",
    justifyContent: "center",
  },
  gradeValue: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  gradeLabel: {
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#C9A962",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  // Subject/Assignment info
  infoSection: {
    alignItems: "center",
    marginVertical: 10,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#2D3748",
    marginBottom: 3,
  },
  infoSubtitle: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#718096",
  },
  // Feedback section
  feedbackSection: {
    backgroundColor: "#F7F5F0",
    padding: 15,
    borderRadius: 4,
    marginVertical: 15,
    maxWidth: 450,
  },
  feedbackTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#718096",
    letterSpacing: 1,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  feedbackText: {
    fontSize: 10,
    fontFamily: "Helvetica-Oblique",
    color: "#4A5568",
    lineHeight: 1.4,
  },
  // Footer section
  footer: {
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 20,
  },
  dateSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#718096",
    marginBottom: 3,
  },
  dateValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#2D3748",
  },
  // Signatures
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 400,
    marginTop: 30,
  },
  signatureBox: {
    alignItems: "center",
    width: 150,
  },
  signatureLine: {
    width: 120,
    height: 1,
    backgroundColor: "#2D3748",
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#718096",
  },
  // Seal/watermark
  seal: {
    position: "absolute",
    bottom: 80,
    right: 80,
    width: 100,
    height: 100,
    opacity: 0.15,
  },
  // Pass/Fail badge colors
  passBadge: {
    backgroundColor: "#276749",
  },
  failBadge: {
    backgroundColor: "#C53030",
  },
})

// Format date helper
function formatCertificateDate(date: Date, language: Locale): string {
  const locale = language === "ar" ? "ar-SA" : "en-US"
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

// Get grade description
function getGradeDescription(grade: string): string {
  const descriptions: Record<string, string> = {
    "A+": "Outstanding Achievement",
    A: "Excellent Performance",
    "A-": "Very Good Achievement",
    "B+": "Good Performance",
    B: "Above Average",
    "B-": "Satisfactory Plus",
    "C+": "Satisfactory",
    C: "Average Performance",
    "C-": "Below Average",
    "D+": "Needs Improvement",
    D: "Minimum Pass",
    "D-": "Marginal Pass",
    F: "Did Not Pass",
  }
  return descriptions[grade] || "Achievement"
}

export function GradeCertificate({
  data,
  options,
}: {
  data: CertificateData
  options: CertificateOptions
}) {
  const isPassing = data.percentage >= 50
  const isRTL = options.language === "ar"

  // Labels based on language
  const labels =
    options.language === "ar"
      ? {
          certificateOf: "شهادة",
          achievement: "إنجاز",
          presentedTo: "تُمنح إلى",
          forAchieving: "لتحقيقه نتيجة متميزة في",
          score: "الدرجة",
          percentage: "النسبة",
          grade: "التقدير",
          date: "التاريخ",
          teacher: "المعلم",
          principal: "مدير المدرسة",
          feedback: "ملاحظات المعلم",
          class: "الصف",
          subject: "المادة",
        }
      : {
          certificateOf: "Certificate of",
          achievement: "Achievement",
          presentedTo: "This is presented to",
          forAchieving: "for achieving excellent results in",
          score: "Score",
          percentage: "Percentage",
          grade: "Grade",
          date: "Date",
          teacher: "Teacher",
          principal: "Principal",
          feedback: "Teacher's Feedback",
          class: "Class",
          subject: "Subject",
        }

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        {/* Decorative borders */}
        <View style={styles.outerBorder} />
        <View style={styles.innerBorder} />

        {/* Content */}
        <View style={styles.content}>
          {/* Header with school info */}
          <View style={styles.header}>
            {data.schoolLogo && (
              <Image src={data.schoolLogo} style={styles.schoolLogo} />
            )}
            <Text style={styles.schoolName}>{data.schoolName}</Text>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.certificateOf}>{labels.certificateOf}</Text>
            <Text style={styles.mainTitle}>{labels.achievement}</Text>
            <View style={styles.decorativeLine} />
          </View>

          {/* Recipient */}
          <View style={styles.recipientSection}>
            <Text style={styles.presentedTo}>{labels.presentedTo}</Text>
            <Text style={styles.studentName}>{data.studentName}</Text>
            {data.className && (
              <Text style={styles.studentInfo}>
                {labels.class}: {data.className}
              </Text>
            )}
          </View>

          {/* Achievement text */}
          <View style={styles.achievementSection}>
            <Text style={styles.achievementText}>{labels.forAchieving}</Text>
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>{data.title}</Text>
              {data.subject && (
                <Text style={styles.infoSubtitle}>
                  {labels.subject}: {data.subject}
                </Text>
              )}
            </View>
          </View>

          {/* Score section */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreValue}>
                {data.score}/{data.maxScore}
              </Text>
              <Text style={styles.scoreLabel}>{labels.score}</Text>
            </View>

            <View
              style={[
                styles.gradeBadge,
                isPassing ? styles.passBadge : styles.failBadge,
              ]}
            >
              <Text style={styles.gradeValue}>{data.grade}</Text>
              <Text style={styles.gradeLabel}>{labels.grade}</Text>
            </View>

            <View style={styles.scoreItem}>
              <Text style={styles.scoreValue}>
                {data.percentage.toFixed(0)}%
              </Text>
              <Text style={styles.scoreLabel}>{labels.percentage}</Text>
            </View>
          </View>

          {/* Grade description */}
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Helvetica-Oblique",
              color: "#718096",
              marginTop: 10,
            }}
          >
            {getGradeDescription(data.grade)}
          </Text>

          {/* Feedback (optional) */}
          {options.includeFeedback && data.feedback && (
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>{labels.feedback}</Text>
              <Text style={styles.feedbackText}>{data.feedback}</Text>
            </View>
          )}

          {/* Footer with date and signatures */}
          <View style={styles.footer}>
            <View style={styles.dateSection}>
              <Text style={styles.dateLabel}>{labels.date}</Text>
              <Text style={styles.dateValue}>
                {formatCertificateDate(data.date, options.language)}
              </Text>
            </View>

            {options.includeSignatures && (
              <View style={styles.signaturesRow}>
                <View style={styles.signatureBox}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureLabel}>
                    {data.gradedBy || labels.teacher}
                  </Text>
                </View>
                <View style={styles.signatureBox}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureLabel}>{labels.principal}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}

// Print-optimized version (portrait, simpler design)
export function GradeCertificatePrint({
  data,
  options,
}: {
  data: CertificateData
  options: CertificateOptions
}) {
  const isPassing = data.percentage >= 50

  const labels =
    options.language === "ar"
      ? {
          gradeReport: "تقرير الدرجات",
          studentInfo: "معلومات الطالب",
          name: "الاسم",
          class: "الصف",
          studentId: "رقم الطالب",
          assessmentInfo: "معلومات التقييم",
          title: "العنوان",
          subject: "المادة",
          type: "النوع",
          date: "التاريخ",
          results: "النتائج",
          score: "الدرجة",
          percentage: "النسبة",
          grade: "التقدير",
          status: "الحالة",
          pass: "ناجح",
          fail: "راسب",
          feedback: "ملاحظات المعلم",
          gradedBy: "التصحيح بواسطة",
          gradedOn: "تاريخ التصحيح",
          generated: "تم إنشاء هذا التقرير في",
        }
      : {
          gradeReport: "Grade Report",
          studentInfo: "Student Information",
          name: "Name",
          class: "Class",
          studentId: "Student ID",
          assessmentInfo: "Assessment Information",
          title: "Title",
          subject: "Subject",
          type: "Type",
          date: "Date",
          results: "Results",
          score: "Score",
          percentage: "Percentage",
          grade: "Grade",
          status: "Status",
          pass: "Pass",
          fail: "Fail",
          feedback: "Teacher's Feedback",
          gradedBy: "Graded By",
          gradedOn: "Graded On",
          generated: "This report was generated on",
        }

  const printStyles = StyleSheet.create({
    page: {
      padding: 40,
      backgroundColor: "#FFFFFF",
      fontFamily: "Helvetica",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "#1A365D",
      paddingBottom: 15,
      marginBottom: 20,
    },
    schoolName: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: "#1A365D",
    },
    title: {
      fontSize: 20,
      fontFamily: "Helvetica-Bold",
      color: "#1A365D",
      textAlign: "center",
      marginBottom: 20,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: "#1A365D",
      backgroundColor: "#F0F4F8",
      padding: 8,
      marginBottom: 10,
    },
    row: {
      flexDirection: "row",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#E2E8F0",
    },
    label: {
      width: "35%",
      fontSize: 10,
      color: "#718096",
    },
    value: {
      width: "65%",
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#2D3748",
    },
    resultsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
    resultBox: {
      width: "23%",
      padding: 12,
      backgroundColor: "#F7FAFC",
      borderRadius: 4,
      alignItems: "center",
    },
    resultValue: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color: "#1A365D",
    },
    resultLabel: {
      fontSize: 8,
      color: "#718096",
      marginTop: 4,
      textTransform: "uppercase",
    },
    gradeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      marginTop: 10,
    },
    passBadge: {
      backgroundColor: "#C6F6D5",
    },
    failBadge: {
      backgroundColor: "#FED7D7",
    },
    badgeText: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
    },
    passText: {
      color: "#276749",
    },
    failText: {
      color: "#C53030",
    },
    feedbackBox: {
      backgroundColor: "#FFFBEB",
      padding: 12,
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: "#D69E2E",
    },
    feedbackText: {
      fontSize: 10,
      color: "#744210",
      fontFamily: "Helvetica-Oblique",
      lineHeight: 1.5,
    },
    footer: {
      marginTop: "auto",
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
    },
    footerText: {
      fontSize: 8,
      color: "#A0AEC0",
      textAlign: "center",
    },
    signatures: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 40,
      paddingTop: 20,
    },
    signatureBox: {
      width: "40%",
      alignItems: "center",
    },
    signatureLine: {
      width: "100%",
      height: 1,
      backgroundColor: "#2D3748",
      marginBottom: 8,
    },
    signatureLabel: {
      fontSize: 9,
      color: "#718096",
    },
  })

  return (
    <Document>
      <Page size="A4" style={printStyles.page}>
        {/* Header */}
        <View style={printStyles.header}>
          <Text style={printStyles.schoolName}>{data.schoolName}</Text>
          <Text style={{ fontSize: 10, color: "#718096" }}>
            {formatCertificateDate(new Date(), options.language)}
          </Text>
        </View>

        {/* Title */}
        <Text style={printStyles.title}>{labels.gradeReport}</Text>

        {/* Student Information */}
        <View style={printStyles.section}>
          <Text style={printStyles.sectionTitle}>{labels.studentInfo}</Text>
          <View style={printStyles.row}>
            <Text style={printStyles.label}>{labels.name}</Text>
            <Text style={printStyles.value}>{data.studentName}</Text>
          </View>
          {data.className && (
            <View style={printStyles.row}>
              <Text style={printStyles.label}>{labels.class}</Text>
              <Text style={printStyles.value}>{data.className}</Text>
            </View>
          )}
          {data.studentId && (
            <View style={printStyles.row}>
              <Text style={printStyles.label}>{labels.studentId}</Text>
              <Text style={printStyles.value}>{data.studentId}</Text>
            </View>
          )}
        </View>

        {/* Assessment Information */}
        <View style={printStyles.section}>
          <Text style={printStyles.sectionTitle}>{labels.assessmentInfo}</Text>
          <View style={printStyles.row}>
            <Text style={printStyles.label}>{labels.title}</Text>
            <Text style={printStyles.value}>{data.title}</Text>
          </View>
          {data.subject && (
            <View style={printStyles.row}>
              <Text style={printStyles.label}>{labels.subject}</Text>
              <Text style={printStyles.value}>{data.subject}</Text>
            </View>
          )}
          <View style={printStyles.row}>
            <Text style={printStyles.label}>{labels.type}</Text>
            <Text style={printStyles.value}>
              {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
            </Text>
          </View>
          <View style={printStyles.row}>
            <Text style={printStyles.label}>{labels.date}</Text>
            <Text style={printStyles.value}>
              {formatCertificateDate(data.date, options.language)}
            </Text>
          </View>
        </View>

        {/* Results */}
        <View style={printStyles.section}>
          <Text style={printStyles.sectionTitle}>{labels.results}</Text>
          <View style={printStyles.resultsGrid}>
            <View style={printStyles.resultBox}>
              <Text style={printStyles.resultValue}>
                {data.score}/{data.maxScore}
              </Text>
              <Text style={printStyles.resultLabel}>{labels.score}</Text>
            </View>
            <View style={printStyles.resultBox}>
              <Text style={printStyles.resultValue}>
                {data.percentage.toFixed(0)}%
              </Text>
              <Text style={printStyles.resultLabel}>{labels.percentage}</Text>
            </View>
            <View style={printStyles.resultBox}>
              <Text style={printStyles.resultValue}>{data.grade}</Text>
              <Text style={printStyles.resultLabel}>{labels.grade}</Text>
            </View>
            <View
              style={[
                printStyles.resultBox,
                isPassing ? printStyles.passBadge : printStyles.failBadge,
              ]}
            >
              <Text
                style={[
                  printStyles.resultValue,
                  { fontSize: 12 },
                  isPassing ? printStyles.passText : printStyles.failText,
                ]}
              >
                {isPassing ? labels.pass : labels.fail}
              </Text>
              <Text style={printStyles.resultLabel}>{labels.status}</Text>
            </View>
          </View>
        </View>

        {/* Feedback */}
        {data.feedback && (
          <View style={printStyles.section}>
            <Text style={printStyles.sectionTitle}>{labels.feedback}</Text>
            <View style={printStyles.feedbackBox}>
              <Text style={printStyles.feedbackText}>{data.feedback}</Text>
            </View>
            {data.gradedBy && (
              <View style={[printStyles.row, { marginTop: 10 }]}>
                <Text style={printStyles.label}>{labels.gradedBy}</Text>
                <Text style={printStyles.value}>{data.gradedBy}</Text>
              </View>
            )}
            {data.gradedAt && (
              <View style={printStyles.row}>
                <Text style={printStyles.label}>{labels.gradedOn}</Text>
                <Text style={printStyles.value}>
                  {formatCertificateDate(data.gradedAt, options.language)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Signatures */}
        {options.includeSignatures && (
          <View style={printStyles.signatures}>
            <View style={printStyles.signatureBox}>
              <View style={printStyles.signatureLine} />
              <Text style={printStyles.signatureLabel}>
                {options.language === "ar" ? "المعلم" : "Teacher"}
              </Text>
            </View>
            <View style={printStyles.signatureBox}>
              <View style={printStyles.signatureLine} />
              <Text style={printStyles.signatureLabel}>
                {options.language === "ar" ? "ولي الأمر" : "Parent/Guardian"}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={printStyles.footer}>
          <Text style={printStyles.footerText}>
            {labels.generated}{" "}
            {formatCertificateDate(new Date(), options.language)}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
