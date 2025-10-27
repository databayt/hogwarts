// Minimal PDF Template - Clean and Simple Text-Based

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PDFResultData } from "../../types";
import { formatPDFDate, formatPDFNumber } from "../pdf-generator";

interface MinimalTemplateProps {
  data: PDFResultData;
}

// Clean, minimalist styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    lineHeight: 1.6,
  },
  // Header
  header: {
    marginBottom: 30,
    textAlign: "center",
  },
  schoolName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  headerInfo: {
    fontSize: 9,
    color: "#666666",
  },
  // Title
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000000",
    marginVertical: 20,
    textTransform: "uppercase",
    borderTop: "1pt solid #000000",
    borderBottom: "1pt solid #000000",
    paddingVertical: 8,
  },
  // Section
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  // Data Row
  dataRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  dataLabel: {
    width: "40%",
    fontSize: 10,
    color: "#000000",
  },
  dataValue: {
    width: "60%",
    fontSize: 10,
    color: "#000000",
    fontWeight: "bold",
  },
  // Divider
  divider: {
    borderBottom: "1pt solid #CCCCCC",
    marginVertical: 10,
  },
  // Marks Box
  marksBox: {
    border: "2pt solid #000000",
    padding: 15,
    marginVertical: 15,
  },
  marksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  marksLabel: {
    fontSize: 10,
    color: "#000000",
  },
  marksValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
  },
  // Large Grade Display
  gradeDisplay: {
    textAlign: "center",
    marginVertical: 15,
    padding: 15,
    border: "1pt solid #000000",
  },
  gradeLabel: {
    fontSize: 10,
    color: "#000000",
    marginBottom: 5,
  },
  gradeValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: 4,
  },
  // Question Table
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "2pt solid #000000",
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #CCCCCC",
    paddingVertical: 5,
  },
  tableCell: {
    fontSize: 9,
    color: "#000000",
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 40,
    left: 50,
    right: 50,
    borderTop: "1pt solid #000000",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#666666",
    textAlign: "center",
  },
  // Signature Section
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  signatureBox: {
    width: "45%",
  },
  signatureLabel: {
    fontSize: 9,
    color: "#000000",
    marginBottom: 20,
  },
  signatureLine: {
    borderTop: "1pt solid #000000",
  },
  // Remarks
  remarks: {
    marginTop: 15,
    padding: 10,
    border: "1pt solid #CCCCCC",
  },
  remarksTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  remarksText: {
    fontSize: 9,
    color: "#333333",
    lineHeight: 1.5,
  },
});

export function MinimalTemplate({ data }: MinimalTemplateProps) {
  const { student, exam, school, analytics, metadata } = data;
  const isPassing = student.marksObtained >= exam.passingMarks;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{school.name}</Text>
          {school.address && (
            <Text style={styles.headerInfo}>{school.address}</Text>
          )}
          {school.phone && (
            <Text style={styles.headerInfo}>Phone: {school.phone}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>Examination Result</Text>

        {/* Student Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Details</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Name:</Text>
            <Text style={styles.dataValue}>{student.studentName}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Student ID:</Text>
            <Text style={styles.dataValue}>{student.studentId}</Text>
          </View>
          {analytics && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Class Rank:</Text>
              <Text style={styles.dataValue}>
                {student.rank} out of {analytics.totalStudents}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Exam Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Examination Details</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Examination:</Text>
            <Text style={styles.dataValue}>{exam.title}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Subject:</Text>
            <Text style={styles.dataValue}>{exam.subjectName}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Class:</Text>
            <Text style={styles.dataValue}>{exam.className}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Date:</Text>
            <Text style={styles.dataValue}>
              {formatPDFDate(exam.date, "en")}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Marks Information */}
        <View style={styles.marksBox}>
          <View style={styles.marksRow}>
            <Text style={styles.marksLabel}>Marks Obtained:</Text>
            <Text style={styles.marksValue}>
              {formatPDFNumber(student.marksObtained, "en")}
            </Text>
          </View>
          <View style={styles.marksRow}>
            <Text style={styles.marksLabel}>Total Marks:</Text>
            <Text style={styles.marksValue}>
              {formatPDFNumber(student.totalMarks, "en")}
            </Text>
          </View>
          <View style={styles.marksRow}>
            <Text style={styles.marksLabel}>Percentage:</Text>
            <Text style={styles.marksValue}>
              {formatPDFNumber(student.percentage, "en")}%
            </Text>
          </View>
          <View style={styles.marksRow}>
            <Text style={styles.marksLabel}>Passing Marks:</Text>
            <Text style={styles.marksValue}>
              {formatPDFNumber(exam.passingMarks, "en")}
            </Text>
          </View>
          <View style={styles.marksRow}>
            <Text style={styles.marksLabel}>Result:</Text>
            <Text style={styles.marksValue}>{isPassing ? "PASS" : "FAIL"}</Text>
          </View>
          {student.gpa && (
            <View style={styles.marksRow}>
              <Text style={styles.marksLabel}>GPA:</Text>
              <Text style={styles.marksValue}>
                {formatPDFNumber(student.gpa, "en")}
              </Text>
            </View>
          )}
        </View>

        {/* Grade Display */}
        {student.grade && (
          <View style={styles.gradeDisplay}>
            <Text style={styles.gradeLabel}>GRADE AWARDED</Text>
            <Text style={styles.gradeValue}>{student.grade}</Text>
          </View>
        )}

        {/* Class Analytics */}
        {analytics && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Class Performance</Text>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Class Average:</Text>
                <Text style={styles.dataValue}>
                  {formatPDFNumber(analytics.classAverage, "en")}%
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Total Students:</Text>
                <Text style={styles.dataValue}>{analytics.totalStudents}</Text>
              </View>
            </View>
          </>
        )}

        {/* Question Breakdown */}
        {student.questionBreakdown && student.questionBreakdown.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Question-wise Performance</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCellHeader, { width: "15%" }]}>
                    Q.No
                  </Text>
                  <Text style={[styles.tableCellHeader, { width: "40%" }]}>
                    Type
                  </Text>
                  <Text
                    style={[
                      styles.tableCellHeader,
                      { width: "22.5%", textAlign: "right" },
                    ]}
                  >
                    Max
                  </Text>
                  <Text
                    style={[
                      styles.tableCellHeader,
                      { width: "22.5%", textAlign: "right" },
                    ]}
                  >
                    Obtained
                  </Text>
                </View>

                {student.questionBreakdown.map((q) => (
                  <View key={q.questionNumber} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: "15%" }]}>
                      {q.questionNumber}
                    </Text>
                    <Text style={[styles.tableCell, { width: "40%" }]}>
                      {q.questionType}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { width: "22.5%", textAlign: "right" },
                      ]}
                    >
                      {formatPDFNumber(q.maxPoints, "en")}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { width: "22.5%", textAlign: "right" },
                      ]}
                    >
                      {formatPDFNumber(q.pointsAwarded, "en")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Remarks */}
        {student.remarks && (
          <View style={styles.remarks}>
            <Text style={styles.remarksTitle}>Remarks:</Text>
            <Text style={styles.remarksText}>{student.remarks}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Teacher</Text>
            <View style={styles.signatureLine} />
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Principal</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {formatPDFDate(metadata.generatedAt, "en")} | Academic
            Year: {metadata.academicYear}
          </Text>
          <Text style={styles.footerText}>
            This is a system-generated document and does not require a signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
