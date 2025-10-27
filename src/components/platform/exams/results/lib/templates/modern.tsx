// Modern PDF Template - Visual Design with Charts

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { PDFResultData } from "../../types";
import { formatPDFDate, formatPDFNumber } from "../pdf-generator";

interface ModernTemplateProps {
  data: PDFResultData;
}

// Modern, colorful styles
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#F9FAFB",
  },
  // Colored Header
  headerBanner: {
    backgroundColor: "#3B82F6",
    padding: 30,
    marginBottom: 0,
  },
  schoolRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  schoolLogo: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  schoolInfo: {
    fontSize: 8,
    color: "#DBEAFE",
  },
  // Title Banner
  titleBanner: {
    backgroundColor: "#1E40AF",
    padding: 15,
    marginBottom: 25,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  // Content Area
  content: {
    padding: 25,
  },
  // Card Style Sections
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    border: "1pt solid #E5E7EB",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 10,
    borderBottom: "2pt solid #3B82F6",
    paddingBottom: 5,
  },
  // Student Info in Grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoItem: {
    width: "48%",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 8,
    color: "#6B7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1F2937",
  },
  // Marks Display - Large and Visual
  marksDisplay: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
  },
  marksCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    border: "4pt solid #3B82F6",
  },
  marksValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E40AF",
  },
  marksLabel: {
    fontSize: 8,
    color: "#1E40AF",
    marginTop: 5,
  },
  // Grade Badge
  gradeBadge: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#10B981",
    borderRadius: 8,
  },
  gradeValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  gradeDescription: {
    fontSize: 12,
    color: "#FFFFFF",
    marginTop: 5,
  },
  // Progress Bar
  progressBar: {
    height: 20,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    marginVertical: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
  },
  progressText: {
    fontSize: 8,
    textAlign: "center",
    color: "#1F2937",
    marginTop: 3,
  },
  // Stats Row
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  statBox: {
    width: "23%",
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 7,
    color: "#6B7280",
    textAlign: "center",
  },
  // Question Breakdown - Modern Style
  questionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    borderLeft: "3pt solid #3B82F6",
  },
  questionNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  questionNumberText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  questionInfo: {
    flex: 1,
  },
  questionType: {
    fontSize: 9,
    color: "#1F2937",
    marginBottom: 2,
  },
  questionPoints: {
    fontSize: 8,
    color: "#6B7280",
  },
  questionScore: {
    width: 60,
    alignItems: "flex-end",
  },
  questionScoreValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F2937",
  },
  // Class Analytics
  analyticsCard: {
    backgroundColor: "#FEF3C7",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    border: "1pt solid #FDE047",
  },
  analyticsTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#92400E",
    marginBottom: 10,
  },
  analyticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  analyticsLabel: {
    fontSize: 9,
    color: "#78350F",
  },
  analyticsValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#78350F",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1F2937",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#D1D5DB",
  },
  footerBrand: {
    fontSize: 7,
    color: "#9CA3AF",
  },
});

export function ModernTemplate({ data }: ModernTemplateProps) {
  const { student, exam, school, analytics, metadata } = data;
  const passPercentage = (exam.passingMarks / exam.totalMarks) * 100;
  const isPassing = student.percentage >= passPercentage;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.schoolRow}>
            {school.logo && (
              <Image src={school.logo} style={styles.schoolLogo} />
            )}
            <View>
              <Text style={styles.schoolName}>{school.name}</Text>
              {school.address && (
                <Text style={styles.schoolInfo}>{school.address}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Title Banner */}
        <View style={styles.titleBanner}>
          <Text style={styles.title}>EXAMINATION RESULT</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Student & Exam Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Student Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Student Name</Text>
                <Text style={styles.infoValue}>{student.studentName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Student ID</Text>
                <Text style={styles.infoValue}>{student.studentId}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Class</Text>
                <Text style={styles.infoValue}>{exam.className}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Subject</Text>
                <Text style={styles.infoValue}>{exam.subjectName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Examination</Text>
                <Text style={styles.infoValue}>{exam.title}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Exam Date</Text>
                <Text style={styles.infoValue}>
                  {formatPDFDate(exam.date, "en")}
                </Text>
              </View>
            </View>
          </View>

          {/* Marks Display */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Performance</Text>
            <View style={styles.marksDisplay}>
              <View>
                <View style={styles.marksCircle}>
                  <Text style={styles.marksValue}>
                    {formatPDFNumber(student.marksObtained, "en")}
                  </Text>
                </View>
                <Text style={[styles.marksLabel, { textAlign: "center" }]}>
                  Marks Obtained
                </Text>
              </View>

              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 24, color: "#6B7280" }}>/</Text>
              </View>

              <View>
                <View style={styles.marksCircle}>
                  <Text style={styles.marksValue}>
                    {formatPDFNumber(student.totalMarks, "en")}
                  </Text>
                </View>
                <Text style={[styles.marksLabel, { textAlign: "center" }]}>
                  Total Marks
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(student.percentage, 100)}%`,
                    backgroundColor: isPassing ? "#10B981" : "#EF4444",
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {formatPDFNumber(student.percentage, "en")}% Achievement
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {student.grade || "N/A"}
              </Text>
              <Text style={styles.statLabel}>Grade</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {student.gpa ? formatPDFNumber(student.gpa, "en") : "N/A"}
              </Text>
              <Text style={styles.statLabel}>GPA</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: isPassing ? "#10B981" : "#EF4444" }]}>
                {isPassing ? "PASS" : "FAIL"}
              </Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>

            {analytics && (
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {student.rank}/{analytics.totalStudents}
                </Text>
                <Text style={styles.statLabel}>Class Rank</Text>
              </View>
            )}
          </View>

          {/* Class Analytics */}
          {analytics && (
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Class Performance</Text>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Class Average</Text>
                <Text style={styles.analyticsValue}>
                  {formatPDFNumber(analytics.classAverage, "en")}%
                </Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Your Performance</Text>
                <Text style={styles.analyticsValue}>
                  {student.percentage > analytics.classAverage
                    ? "Above Average"
                    : student.percentage === analytics.classAverage
                      ? "At Average"
                      : "Below Average"}
                </Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Total Students</Text>
                <Text style={styles.analyticsValue}>
                  {analytics.totalStudents}
                </Text>
              </View>
            </View>
          )}

          {/* Question Breakdown */}
          {student.questionBreakdown && student.questionBreakdown.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Question-wise Breakdown</Text>
              {student.questionBreakdown.slice(0, 8).map((q) => (
                <View key={q.questionNumber} style={styles.questionItem}>
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>
                      {q.questionNumber}
                    </Text>
                  </View>
                  <View style={styles.questionInfo}>
                    <Text style={styles.questionType}>{q.questionType}</Text>
                    <Text style={styles.questionPoints}>
                      Max: {formatPDFNumber(q.maxPoints, "en")} points
                    </Text>
                  </View>
                  <View style={styles.questionScore}>
                    <Text style={styles.questionScoreValue}>
                      {formatPDFNumber(q.pointsAwarded, "en")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated: {formatPDFDate(metadata.generatedAt, "en")}
          </Text>
          <Text style={styles.footerBrand}>
            {school.name} | Academic Year {metadata.academicYear}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
