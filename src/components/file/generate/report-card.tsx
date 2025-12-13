/**
 * Unified File Block - Report Card Template
 * PDF template for student report cards
 */

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ReportCardData, TemplateStyle } from "./types";

// ============================================================================
// Font Registration
// ============================================================================

Font.register({
  family: "Tajawal",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/tajawal/v9/Iurf6YBj_oCad4k1l4qjHrRpiYlJ.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/tajawal/v9/Iurf6YBj_oCad4k1l8qkHrRpiYlJ.ttf",
      fontWeight: "bold",
    },
  ],
});

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2",
      fontWeight: "bold",
    },
  ],
});

// ============================================================================
// Styles
// ============================================================================

const createStyles = (locale: string = "en") => {
  const isRTL = locale === "ar";
  const fontFamily = isRTL ? "Tajawal" : "Inter";

  return StyleSheet.create({
    page: {
      padding: 30,
      fontFamily,
      fontSize: 10,
      direction: isRTL ? "rtl" : "ltr",
      backgroundColor: "#ffffff",
    },
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: "#1e3a5f",
    },
    logo: {
      width: 60,
      height: 60,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 20,
    },
    schoolName: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#1e3a5f",
      marginBottom: 3,
      textAlign: "center",
    },
    reportTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#333",
      textAlign: "center",
    },
    termInfo: {
      fontSize: 11,
      color: "#666",
      textAlign: "center",
    },
    studentPhoto: {
      width: 60,
      height: 70,
      objectFit: "cover",
    },
    studentInfoSection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginBottom: 20,
      backgroundColor: "#f8f9fa",
      padding: 15,
      borderRadius: 4,
    },
    infoColumn: {
      flex: 1,
    },
    infoRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginBottom: 5,
    },
    infoLabel: {
      fontSize: 9,
      color: "#666",
      width: 80,
      textAlign: isRTL ? "right" : "left",
    },
    infoValue: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#1a1a1a",
      flex: 1,
    },
    gradesTable: {
      marginBottom: 20,
    },
    tableTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#1e3a5f",
      marginBottom: 10,
    },
    tableHeader: {
      flexDirection: isRTL ? "row-reverse" : "row",
      backgroundColor: "#1e3a5f",
      paddingVertical: 8,
      paddingHorizontal: 5,
    },
    tableRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      paddingVertical: 6,
      paddingHorizontal: 5,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
    },
    evenRow: {
      backgroundColor: "#f8f9fa",
    },
    headerCell: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#ffffff",
      textAlign: "center",
    },
    cell: {
      fontSize: 10,
      color: "#333",
      textAlign: "center",
    },
    subjectCol: {
      width: "30%",
      textAlign: isRTL ? "right" : "left",
    },
    gradeCol: {
      width: "12%",
    },
    scoreCol: {
      width: "15%",
    },
    percentCol: {
      width: "13%",
    },
    teacherCol: {
      width: "15%",
    },
    commentCol: {
      width: "15%",
    },
    summarySection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginBottom: 20,
    },
    summaryBox: {
      flex: 1,
      backgroundColor: "#f8f9fa",
      padding: 15,
      marginHorizontal: 5,
      borderRadius: 4,
      alignItems: "center",
    },
    summaryLabel: {
      fontSize: 9,
      color: "#666",
      marginBottom: 5,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#1e3a5f",
    },
    summarySubtext: {
      fontSize: 8,
      color: "#999",
    },
    attendanceSection: {
      marginBottom: 20,
    },
    attendanceGrid: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
    },
    attendanceItem: {
      alignItems: "center",
      padding: 10,
      backgroundColor: "#f8f9fa",
      borderRadius: 4,
      width: "23%",
    },
    attendanceValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#1e3a5f",
    },
    attendanceLabel: {
      fontSize: 8,
      color: "#666",
      marginTop: 3,
    },
    commentsSection: {
      marginBottom: 20,
    },
    commentBox: {
      backgroundColor: "#f8f9fa",
      padding: 15,
      borderRadius: 4,
      marginBottom: 10,
    },
    commentTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#1e3a5f",
      marginBottom: 5,
    },
    commentText: {
      fontSize: 10,
      color: "#333",
      lineHeight: 1.5,
    },
    signaturesSection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginTop: 30,
    },
    signatureBlock: {
      alignItems: "center",
      width: "30%",
    },
    signatureLine: {
      width: 100,
      borderBottomWidth: 1,
      borderBottomColor: "#333",
      marginBottom: 5,
    },
    signatureImage: {
      width: 80,
      height: 30,
      marginBottom: 5,
    },
    signatureLabel: {
      fontSize: 9,
      color: "#666",
    },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 30,
      right: 30,
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      fontSize: 8,
      color: "#999",
    },
  });
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

// ============================================================================
// Report Card Template Component
// ============================================================================

interface ReportCardTemplateProps {
  data: ReportCardData;
  style?: TemplateStyle;
}

export function ReportCardTemplate({ data, style = "standard" }: ReportCardTemplateProps) {
  const locale = data.locale || "en";
  const styles = createStyles(locale);
  const isRTL = locale === "ar";

  const labels = {
    reportCard: isRTL ? "بطاقة التقرير" : "Report Card",
    term: isRTL ? "الفصل الدراسي" : "Term",
    academicYear: isRTL ? "العام الدراسي" : "Academic Year",
    studentName: isRTL ? "اسم الطالب" : "Student Name",
    studentId: isRTL ? "رقم الطالب" : "Student ID",
    class: isRTL ? "الفصل" : "Class",
    yearLevel: isRTL ? "المرحلة" : "Year Level",
    subject: isRTL ? "المادة" : "Subject",
    grade: isRTL ? "التقدير" : "Grade",
    score: isRTL ? "الدرجة" : "Score",
    percentage: isRTL ? "النسبة" : "%",
    teacher: isRTL ? "المعلم" : "Teacher",
    comments: isRTL ? "ملاحظات" : "Comments",
    overallGrade: isRTL ? "التقدير العام" : "Overall Grade",
    overallPercentage: isRTL ? "النسبة الكلية" : "Overall %",
    rank: isRTL ? "الترتيب" : "Rank",
    gpa: isRTL ? "المعدل" : "GPA",
    attendance: isRTL ? "الحضور" : "Attendance",
    totalDays: isRTL ? "إجمالي الأيام" : "Total Days",
    present: isRTL ? "حاضر" : "Present",
    absent: isRTL ? "غائب" : "Absent",
    late: isRTL ? "متأخر" : "Late",
    teacherComments: isRTL ? "ملاحظات المعلم" : "Teacher Comments",
    principalComments: isRTL ? "ملاحظات المدير" : "Principal Comments",
    classTeacher: isRTL ? "معلم الفصل" : "Class Teacher",
    principal: isRTL ? "المدير" : "Principal",
    parentSignature: isRTL ? "توقيع ولي الأمر" : "Parent Signature",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.schoolLogo && <Image src={data.schoolLogo} style={styles.logo} />}
          <View style={styles.headerCenter}>
            <Text style={styles.schoolName}>
              {isRTL ? data.schoolNameAr || data.schoolName : data.schoolName}
            </Text>
            <Text style={styles.reportTitle}>{labels.reportCard}</Text>
            <Text style={styles.termInfo}>
              {labels.term}: {isRTL ? data.termNameAr || data.termName : data.termName} | {labels.academicYear}: {data.academicYear}
            </Text>
          </View>
          {data.studentPhoto && <Image src={data.studentPhoto} style={styles.studentPhoto} />}
        </View>

        {/* Student Info */}
        <View style={styles.studentInfoSection}>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{labels.studentName}:</Text>
              <Text style={styles.infoValue}>
                {isRTL ? data.studentNameAr || data.studentName : data.studentName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{labels.studentId}:</Text>
              <Text style={styles.infoValue}>{data.studentId}</Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{labels.class}:</Text>
              <Text style={styles.infoValue}>
                {isRTL ? data.classNameAr || data.className : data.className}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{labels.yearLevel}:</Text>
              <Text style={styles.infoValue}>{data.yearLevel}</Text>
            </View>
          </View>
        </View>

        {/* Grades Table */}
        <View style={styles.gradesTable}>
          <Text style={styles.tableTitle}>{labels.subject}</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.subjectCol]}>{labels.subject}</Text>
            <Text style={[styles.headerCell, styles.gradeCol]}>{labels.grade}</Text>
            <Text style={[styles.headerCell, styles.scoreCol]}>{labels.score}</Text>
            <Text style={[styles.headerCell, styles.percentCol]}>{labels.percentage}</Text>
            <Text style={[styles.headerCell, styles.teacherCol]}>{labels.teacher}</Text>
          </View>

          {data.subjects.map((subject, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 0 ? styles.evenRow : {}]}
            >
              <Text style={[styles.cell, styles.subjectCol]}>
                {isRTL ? subject.nameAr || subject.name : subject.name}
              </Text>
              <Text style={[styles.cell, styles.gradeCol]}>{subject.grade}</Text>
              <Text style={[styles.cell, styles.scoreCol]}>
                {subject.score !== undefined ? `${subject.score}/${subject.maxScore || 100}` : "-"}
              </Text>
              <Text style={[styles.cell, styles.percentCol]}>
                {subject.percentage !== undefined ? `${subject.percentage}%` : "-"}
              </Text>
              <Text style={[styles.cell, styles.teacherCol]}>{subject.teacherName || "-"}</Text>
            </View>
          ))}
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          {data.overallGrade && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>{labels.overallGrade}</Text>
              <Text style={styles.summaryValue}>{data.overallGrade}</Text>
            </View>
          )}
          {data.overallPercentage !== undefined && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>{labels.overallPercentage}</Text>
              <Text style={styles.summaryValue}>{data.overallPercentage}%</Text>
            </View>
          )}
          {data.rank !== undefined && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>{labels.rank}</Text>
              <Text style={styles.summaryValue}>{data.rank}</Text>
              <Text style={styles.summarySubtext}>/ {data.totalStudents}</Text>
            </View>
          )}
          {data.gpa !== undefined && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>{labels.gpa}</Text>
              <Text style={styles.summaryValue}>{data.gpa.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Attendance Section */}
        {data.totalDays !== undefined && (
          <View style={styles.attendanceSection}>
            <Text style={styles.tableTitle}>{labels.attendance}</Text>
            <View style={styles.attendanceGrid}>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceValue}>{data.totalDays}</Text>
                <Text style={styles.attendanceLabel}>{labels.totalDays}</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceValue}>{data.presentDays || 0}</Text>
                <Text style={styles.attendanceLabel}>{labels.present}</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceValue}>{data.absentDays || 0}</Text>
                <Text style={styles.attendanceLabel}>{labels.absent}</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceValue}>{data.attendancePercentage || 0}%</Text>
                <Text style={styles.attendanceLabel}>{labels.attendance}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          {data.teacherComments && (
            <View style={styles.commentBox}>
              <Text style={styles.commentTitle}>{labels.teacherComments}</Text>
              <Text style={styles.commentText}>
                {isRTL ? data.teacherCommentsAr || data.teacherComments : data.teacherComments}
              </Text>
            </View>
          )}
          {data.principalComments && (
            <View style={styles.commentBox}>
              <Text style={styles.commentTitle}>{labels.principalComments}</Text>
              <Text style={styles.commentText}>
                {isRTL ? data.principalCommentsAr || data.principalComments : data.principalComments}
              </Text>
            </View>
          )}
        </View>

        {/* Signatures */}
        <View style={styles.signaturesSection}>
          <View style={styles.signatureBlock}>
            {data.classTeacherSignature ? (
              <Image src={data.classTeacherSignature} style={styles.signatureImage} />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <Text style={styles.signatureLabel}>{labels.classTeacher}</Text>
          </View>
          <View style={styles.signatureBlock}>
            {data.principalSignature ? (
              <Image src={data.principalSignature} style={styles.signatureImage} />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <Text style={styles.signatureLabel}>{labels.principal}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{labels.parentSignature}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{isRTL ? `تاريخ الإصدار: ${formatDate(data.issueDate, locale)}` : `Issue Date: ${formatDate(data.issueDate, locale)}`}</Text>
          {data.nextTermStart && (
            <Text>
              {isRTL ? `بداية الفصل القادم: ${formatDate(data.nextTermStart, locale)}` : `Next Term Starts: ${formatDate(data.nextTermStart, locale)}`}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
}

export { createStyles as createReportCardStyles };
