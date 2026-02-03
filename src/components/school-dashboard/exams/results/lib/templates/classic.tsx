// Classic PDF Template - Traditional Report Card Style

import React from "react"
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import type { PDFResultData } from "../../types"
import { formatPDFDate, formatPDFNumber } from "../pdf-generator"

interface ClassicTemplateProps {
  data: PDFResultData
}

// Create styles for A4 page (595.28 x 841.89 points)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },
  // Header Section
  header: {
    marginBottom: 30,
    borderBottom: "2pt solid #1F2937",
    paddingBottom: 15,
  },
  schoolLogo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  schoolName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 5,
  },
  schoolInfo: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 2,
  },
  // Title Section
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1F2937",
    marginVertical: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  // Student Info Section
  studentSection: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    padding: 15,
  },
  studentRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  studentLabel: {
    width: "30%",
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
  },
  studentValue: {
    width: "70%",
    fontSize: 10,
    color: "#1F2937",
  },
  // Exam Info Section
  examSection: {
    marginBottom: 20,
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 4,
  },
  examRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  examLabel: {
    width: "40%",
    fontSize: 9,
    color: "#6B7280",
  },
  examValue: {
    width: "60%",
    fontSize: 9,
    fontWeight: "bold",
    color: "#1F2937",
  },
  // Marks Section
  marksSection: {
    marginBottom: 20,
    border: "2pt solid #1F2937",
    padding: 20,
    borderRadius: 4,
  },
  marksTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 15,
    textAlign: "center",
  },
  marksGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  marksItem: {
    width: "48%",
    padding: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  marksItemLabel: {
    fontSize: 8,
    color: "#6B7280",
    marginBottom: 4,
  },
  marksItemValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  // Grade Section
  gradeSection: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: "#DBEAFE",
    borderRadius: 4,
    alignItems: "center",
  },
  gradeLabel: {
    fontSize: 10,
    color: "#1E40AF",
    marginBottom: 5,
  },
  gradeValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1E40AF",
  },
  gradeDescription: {
    fontSize: 10,
    color: "#1E40AF",
    marginTop: 5,
  },
  // Question Breakdown Section
  questionSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  questionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 10,
    borderBottom: "1pt solid #E5E7EB",
    paddingBottom: 5,
  },
  questionTable: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
  },
  questionTableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    padding: 8,
  },
  questionTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    padding: 8,
  },
  questionTableCell: {
    fontSize: 8,
    color: "#1F2937",
  },
  questionTableCellHeader: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#374151",
  },
  // Footer Section
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: "1pt solid #E5E7EB",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#6B7280",
    textAlign: "center",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  signatureBox: {
    width: "45%",
  },
  signatureLabel: {
    fontSize: 8,
    color: "#6B7280",
    marginBottom: 20,
  },
  signatureLine: {
    borderTop: "1pt solid #1F2937",
    marginTop: 5,
  },
  // Remarks Section
  remarksSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#FFFBEB",
    borderRadius: 4,
    borderLeft: "3pt solid #F59E0B",
  },
  remarksTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#92400E",
    marginBottom: 5,
  },
  remarksText: {
    fontSize: 9,
    color: "#78350F",
    lineHeight: 1.5,
  },
})

export function ClassicTemplate({ data }: ClassicTemplateProps) {
  const { student, exam, school, analytics, metadata } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with School Info */}
        <View style={styles.header}>
          {school.logo && <Image src={school.logo} style={styles.schoolLogo} />}
          <Text style={styles.schoolName}>{school.name}</Text>
          {school.address && (
            <Text style={styles.schoolInfo}>{school.address}</Text>
          )}
          {school.phone && (
            <Text style={styles.schoolInfo}>Phone: {school.phone}</Text>
          )}
          {school.email && (
            <Text style={styles.schoolInfo}>Email: {school.email}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>Examination Result Card</Text>

        {/* Student Information */}
        <View style={styles.studentSection}>
          <View style={styles.studentRow}>
            <Text style={styles.studentLabel}>Student Name:</Text>
            <Text style={styles.studentValue}>{student.studentName}</Text>
          </View>
          <View style={styles.studentRow}>
            <Text style={styles.studentLabel}>Student ID:</Text>
            <Text style={styles.studentValue}>{student.studentId}</Text>
          </View>
          {analytics && (
            <View style={styles.studentRow}>
              <Text style={styles.studentLabel}>Class Rank:</Text>
              <Text style={styles.studentValue}>
                {student.rank} of {analytics.totalStudents}
              </Text>
            </View>
          )}
        </View>

        {/* Exam Information */}
        <View style={styles.examSection}>
          <View style={styles.examRow}>
            <Text style={styles.examLabel}>Examination:</Text>
            <Text style={styles.examValue}>{exam.title}</Text>
          </View>
          <View style={styles.examRow}>
            <Text style={styles.examLabel}>Subject:</Text>
            <Text style={styles.examValue}>{exam.subjectName}</Text>
          </View>
          <View style={styles.examRow}>
            <Text style={styles.examLabel}>Class:</Text>
            <Text style={styles.examValue}>{exam.className}</Text>
          </View>
          <View style={styles.examRow}>
            <Text style={styles.examLabel}>Date:</Text>
            <Text style={styles.examValue}>
              {formatPDFDate(exam.date, "en")}
            </Text>
          </View>
        </View>

        {/* Marks Information */}
        <View style={styles.marksSection}>
          <Text style={styles.marksTitle}>EXAMINATION MARKS</Text>

          <View style={styles.marksGrid}>
            <View style={styles.marksItem}>
              <Text style={styles.marksItemLabel}>Marks Obtained</Text>
              <Text style={styles.marksItemValue}>
                {formatPDFNumber(student.marksObtained, "en")}
              </Text>
            </View>

            <View style={styles.marksItem}>
              <Text style={styles.marksItemLabel}>Total Marks</Text>
              <Text style={styles.marksItemValue}>
                {formatPDFNumber(student.totalMarks, "en")}
              </Text>
            </View>
          </View>

          <View style={styles.marksGrid}>
            <View style={styles.marksItem}>
              <Text style={styles.marksItemLabel}>Percentage</Text>
              <Text style={styles.marksItemValue}>
                {formatPDFNumber(student.percentage, "en")}%
              </Text>
            </View>

            <View style={styles.marksItem}>
              <Text style={styles.marksItemLabel}>
                {student.gpa ? "GPA" : "Status"}
              </Text>
              <Text style={styles.marksItemValue}>
                {student.gpa
                  ? formatPDFNumber(student.gpa, "en")
                  : student.marksObtained >= exam.passingMarks
                    ? "PASS"
                    : "FAIL"}
              </Text>
            </View>
          </View>
        </View>

        {/* Grade Display */}
        {student.grade && (
          <View style={styles.gradeSection}>
            <Text style={styles.gradeLabel}>GRADE AWARDED</Text>
            <Text style={styles.gradeValue}>{student.grade}</Text>
            <Text style={styles.gradeDescription}>
              {getGradeDescription(student.grade)}
            </Text>
          </View>
        )}

        {/* Question Breakdown (if included) */}
        {student.questionBreakdown && student.questionBreakdown.length > 0 && (
          <View style={styles.questionSection}>
            <Text style={styles.questionTitle}>Question-wise Performance</Text>
            <View style={styles.questionTable}>
              <View style={styles.questionTableHeader}>
                <Text
                  style={[styles.questionTableCellHeader, { width: "10%" }]}
                >
                  Q.No
                </Text>
                <Text
                  style={[styles.questionTableCellHeader, { width: "50%" }]}
                >
                  Question Type
                </Text>
                <Text
                  style={[
                    styles.questionTableCellHeader,
                    { width: "20%", textAlign: "right" },
                  ]}
                >
                  Max Points
                </Text>
                <Text
                  style={[
                    styles.questionTableCellHeader,
                    { width: "20%", textAlign: "right" },
                  ]}
                >
                  Obtained
                </Text>
              </View>

              {student.questionBreakdown.map((q) => (
                <View key={q.questionNumber} style={styles.questionTableRow}>
                  <Text style={[styles.questionTableCell, { width: "10%" }]}>
                    {q.questionNumber}
                  </Text>
                  <Text style={[styles.questionTableCell, { width: "50%" }]}>
                    {q.questionType}
                  </Text>
                  <Text
                    style={[
                      styles.questionTableCell,
                      { width: "20%", textAlign: "right" },
                    ]}
                  >
                    {formatPDFNumber(q.maxPoints, "en")}
                  </Text>
                  <Text
                    style={[
                      styles.questionTableCell,
                      { width: "20%", textAlign: "right" },
                    ]}
                  >
                    {formatPDFNumber(q.pointsAwarded, "en")}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Remarks */}
        {student.remarks && (
          <View style={styles.remarksSection}>
            <Text style={styles.remarksTitle}>Teacher's Remarks:</Text>
            <Text style={styles.remarksText}>{student.remarks}</Text>
          </View>
        )}

        {/* Footer with Signatures */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {formatPDFDate(metadata.generatedAt, "en")} | Academic
            Year: {metadata.academicYear}
          </Text>

          <View style={styles.footerRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Teacher's Signature</Text>
              <View style={styles.signatureLine} />
            </View>

            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Principal's Signature</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// Helper function
function getGradeDescription(grade: string): string {
  const descriptions: Record<string, string> = {
    "A+": "Excellent",
    A: "Very Good",
    "B+": "Good",
    B: "Above Average",
    "C+": "Average",
    C: "Satisfactory",
    D: "Pass",
    F: "Fail",
  }

  return descriptions[grade] || ""
}
