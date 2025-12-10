/**
 * Unified File Block - Transcript Template
 * PDF template for academic transcripts
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
import type { TranscriptData, TemplateStyle } from "../types";

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
      padding: 40,
      fontFamily,
      fontSize: 9,
      direction: isRTL ? "rtl" : "ltr",
      backgroundColor: "#ffffff",
    },
    header: {
      alignItems: "center",
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: "#1e3a5f",
    },
    logo: {
      width: 60,
      height: 60,
      marginBottom: 8,
    },
    schoolName: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#1e3a5f",
      marginBottom: 4,
      textAlign: "center",
    },
    documentTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#1e3a5f",
      textTransform: "uppercase",
      letterSpacing: 2,
      marginTop: 8,
    },
    officialText: {
      fontSize: 8,
      color: "#6b7280",
      marginTop: 4,
    },
    studentSection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      backgroundColor: "#f8fafc",
      padding: 15,
      marginBottom: 15,
      borderRadius: 4,
    },
    studentInfo: {
      flex: 1,
    },
    infoGrid: {
      flexDirection: isRTL ? "row-reverse" : "row",
      flexWrap: "wrap",
    },
    infoItem: {
      width: "50%",
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 7,
      color: "#6b7280",
      textTransform: "uppercase",
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 10,
      color: "#111827",
      fontWeight: "bold",
    },
    programSection: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#1e3a5f",
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
      textTransform: "uppercase",
    },
    coursesTable: {
      marginBottom: 15,
    },
    tableHeader: {
      flexDirection: isRTL ? "row-reverse" : "row",
      backgroundColor: "#1e3a5f",
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    termHeader: {
      flexDirection: isRTL ? "row-reverse" : "row",
      backgroundColor: "#f1f5f9",
      paddingVertical: 6,
      paddingHorizontal: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
    },
    termHeaderText: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#334155",
    },
    tableRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      paddingVertical: 6,
      paddingHorizontal: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#f1f5f9",
    },
    tableRowAlt: {
      backgroundColor: "#fafafa",
    },
    colCode: {
      width: "12%",
      textAlign: isRTL ? "right" : "left",
    },
    colName: {
      width: "40%",
      textAlign: isRTL ? "right" : "left",
    },
    colCredits: {
      width: "12%",
      textAlign: "center",
    },
    colGrade: {
      width: "12%",
      textAlign: "center",
    },
    colPoints: {
      width: "12%",
      textAlign: "center",
    },
    colTerm: {
      width: "12%",
      textAlign: "center",
    },
    headerText: {
      fontSize: 7,
      fontWeight: "bold",
      color: "#ffffff",
      textTransform: "uppercase",
    },
    cellText: {
      fontSize: 8,
      color: "#374151",
    },
    summarySection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginBottom: 20,
      paddingTop: 15,
      borderTopWidth: 2,
      borderTopColor: "#1e3a5f",
    },
    summaryBlock: {
      alignItems: "center",
      padding: 10,
      backgroundColor: "#f8fafc",
      borderRadius: 4,
      minWidth: 100,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#1e3a5f",
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: 7,
      color: "#6b7280",
      textTransform: "uppercase",
    },
    standingSection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      padding: 12,
      backgroundColor: "#f0fdf4",
      borderRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: "#22c55e",
    },
    standingText: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#166534",
    },
    degreeSection: {
      marginBottom: 20,
      padding: 15,
      backgroundColor: "#fefce8",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#fde047",
    },
    degreeTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#854d0e",
      marginBottom: 4,
    },
    degreeText: {
      fontSize: 10,
      color: "#713f12",
    },
    signatureSection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginTop: 30,
      paddingTop: 20,
    },
    signatureBlock: {
      alignItems: "center",
      width: 150,
    },
    sealPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: "#1e3a5f",
      marginBottom: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    sealText: {
      fontSize: 6,
      color: "#1e3a5f",
      textAlign: "center",
    },
    signatureLine: {
      width: 120,
      borderBottomWidth: 1,
      borderBottomColor: "#374151",
      marginBottom: 4,
    },
    signatureName: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#111827",
    },
    signatureTitle: {
      fontSize: 7,
      color: "#6b7280",
    },
    footer: {
      position: "absolute",
      bottom: 25,
      left: 40,
      right: 40,
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#e5e5e5",
    },
    footerText: {
      fontSize: 7,
      color: "#9ca3af",
    },
    documentNumber: {
      fontSize: 7,
      color: "#6b7280",
    },
    watermark: {
      position: "absolute",
      top: "40%",
      left: "25%",
      fontSize: 60,
      color: "#f3f4f6",
      transform: "rotate(-45deg)",
      opacity: 0.3,
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

// Group courses by term
const groupCoursesByTerm = (courses: TranscriptData["courses"]) => {
  const grouped = new Map<string, typeof courses>();
  courses.forEach((course) => {
    const key = `${course.year} - ${course.term}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(course);
  });
  return grouped;
};

// ============================================================================
// Transcript Template Component
// ============================================================================

interface TranscriptTemplateProps {
  data: TranscriptData;
  style?: TemplateStyle;
}

export function TranscriptTemplate({ data, style = "official" }: TranscriptTemplateProps) {
  const locale = data.locale || "en";
  const styles = createStyles(locale);
  const isRTL = locale === "ar";

  const labels = {
    transcript: isRTL ? "السجل الأكاديمي" : "OFFICIAL TRANSCRIPT",
    official: isRTL ? "وثيقة رسمية" : "Official Document",
    studentInfo: isRTL ? "معلومات الطالب" : "Student Information",
    name: isRTL ? "الاسم" : "Name",
    studentId: isRTL ? "الرقم الجامعي" : "Student ID",
    dateOfBirth: isRTL ? "تاريخ الميلاد" : "Date of Birth",
    enrollmentDate: isRTL ? "تاريخ التسجيل" : "Enrollment Date",
    program: isRTL ? "البرنامج" : "Program",
    major: isRTL ? "التخصص" : "Major",
    minor: isRTL ? "التخصص الفرعي" : "Minor",
    academicRecord: isRTL ? "السجل الأكاديمي" : "Academic Record",
    code: isRTL ? "الرمز" : "Code",
    courseName: isRTL ? "اسم المقرر" : "Course Name",
    credits: isRTL ? "الساعات" : "Credits",
    grade: isRTL ? "الدرجة" : "Grade",
    points: isRTL ? "النقاط" : "Points",
    term: isRTL ? "الفصل" : "Term",
    totalCredits: isRTL ? "إجمالي الساعات" : "Total Credits",
    earnedCredits: isRTL ? "الساعات المكتسبة" : "Earned Credits",
    cumulativeGpa: isRTL ? "المعدل التراكمي" : "Cumulative GPA",
    standing: isRTL ? "الحالة الأكاديمية" : "Academic Standing",
    degreeAwarded: isRTL ? "الدرجة العلمية الممنوحة" : "Degree Awarded",
    honors: isRTL ? "مرتبة الشرف" : "Honors",
    registrar: isRTL ? "مسجل الجامعة" : "Registrar",
    issuedTo: isRTL ? "صادر إلى" : "Issued To",
    purpose: isRTL ? "الغرض" : "Purpose",
    issueDate: isRTL ? "تاريخ الإصدار" : "Issue Date",
  };

  const coursesByTerm = groupCoursesByTerm(data.courses);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>OFFICIAL</Text>

        {/* Header */}
        <View style={styles.header}>
          {data.schoolLogo && (
            <Image src={data.schoolLogo} style={styles.logo} />
          )}
          <Text style={styles.schoolName}>
            {isRTL ? data.schoolNameAr || data.schoolName : data.schoolName}
          </Text>
          <Text style={styles.documentTitle}>{labels.transcript}</Text>
          <Text style={styles.officialText}>{labels.official}</Text>
        </View>

        {/* Student Information */}
        <View style={styles.studentSection}>
          <View style={styles.studentInfo}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{labels.name}</Text>
                <Text style={styles.infoValue}>
                  {isRTL ? data.studentNameAr || data.studentName : data.studentName}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{labels.studentId}</Text>
                <Text style={styles.infoValue}>{data.studentId}</Text>
              </View>
              {data.dateOfBirth && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{labels.dateOfBirth}</Text>
                  <Text style={styles.infoValue}>{formatDate(data.dateOfBirth, locale)}</Text>
                </View>
              )}
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{labels.enrollmentDate}</Text>
                <Text style={styles.infoValue}>{formatDate(data.enrollmentDate, locale)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Program Information */}
        <View style={styles.programSection}>
          <Text style={styles.sectionTitle}>{labels.program}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{labels.program}</Text>
              <Text style={styles.infoValue}>
                {isRTL ? data.programNameAr || data.programName : data.programName}
              </Text>
            </View>
            {data.major && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{labels.major}</Text>
                <Text style={styles.infoValue}>{data.major}</Text>
              </View>
            )}
            {data.minor && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{labels.minor}</Text>
                <Text style={styles.infoValue}>{data.minor}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Academic Record */}
        <View style={styles.coursesTable}>
          <Text style={styles.sectionTitle}>{labels.academicRecord}</Text>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colCode]}>{labels.code}</Text>
            <Text style={[styles.headerText, styles.colName]}>{labels.courseName}</Text>
            <Text style={[styles.headerText, styles.colCredits]}>{labels.credits}</Text>
            <Text style={[styles.headerText, styles.colGrade]}>{labels.grade}</Text>
            <Text style={[styles.headerText, styles.colPoints]}>{labels.points}</Text>
          </View>

          {/* Courses grouped by term */}
          {Array.from(coursesByTerm).map(([termKey, courses], termIdx) => (
            <View key={termIdx}>
              <View style={styles.termHeader}>
                <Text style={styles.termHeaderText}>{termKey}</Text>
              </View>
              {courses.map((course, idx) => (
                <View key={idx} style={[styles.tableRow, ...(idx % 2 === 1 ? [styles.tableRowAlt] : [])]}>
                  <Text style={[styles.cellText, styles.colCode]}>{course.code}</Text>
                  <Text style={[styles.cellText, styles.colName]}>
                    {isRTL ? course.nameAr || course.name : course.name}
                  </Text>
                  <Text style={[styles.cellText, styles.colCredits]}>{course.credits || "-"}</Text>
                  <Text style={[styles.cellText, styles.colGrade]}>{course.grade}</Text>
                  <Text style={[styles.cellText, styles.colPoints]}>
                    {course.gradePoints?.toFixed(2) || "-"}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          {data.totalCredits !== undefined && (
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryValue}>{data.totalCredits}</Text>
              <Text style={styles.summaryLabel}>{labels.totalCredits}</Text>
            </View>
          )}
          {data.earnedCredits !== undefined && (
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryValue}>{data.earnedCredits}</Text>
              <Text style={styles.summaryLabel}>{labels.earnedCredits}</Text>
            </View>
          )}
          {data.cumulativeGpa !== undefined && (
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryValue}>{data.cumulativeGpa.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>{labels.cumulativeGpa}</Text>
            </View>
          )}
        </View>

        {/* Academic Standing */}
        {data.standing && (
          <View style={styles.standingSection}>
            <Text style={styles.standingText}>
              {labels.standing}: {data.standing}
            </Text>
          </View>
        )}

        {/* Degree Awarded */}
        {data.degreeAwarded && (
          <View style={styles.degreeSection}>
            <Text style={styles.degreeTitle}>{labels.degreeAwarded}</Text>
            <Text style={styles.degreeText}>
              {data.degreeAwarded}
              {data.honors && ` - ${data.honors}`}
            </Text>
            {data.graduationDate && (
              <Text style={styles.degreeText}>
                {formatDate(data.graduationDate, locale)}
              </Text>
            )}
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureSection}>
          {/* Seal */}
          <View style={styles.signatureBlock}>
            {data.seal ? (
              <Image src={data.seal} style={{ width: 60, height: 60, marginBottom: 8 }} />
            ) : (
              <View style={styles.sealPlaceholder}>
                <Text style={styles.sealText}>OFFICIAL{"\n"}SEAL</Text>
              </View>
            )}
          </View>

          {/* Registrar Signature */}
          <View style={styles.signatureBlock}>
            {data.registrarSignature ? (
              <Image
                src={data.registrarSignature}
                style={{ width: 100, height: 30, marginBottom: 4 }}
              />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <Text style={styles.signatureName}>
              {data.registrarName || labels.registrar}
            </Text>
            <Text style={styles.signatureTitle}>{labels.registrar}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            {data.issuedTo && (
              <Text style={styles.footerText}>
                {labels.issuedTo}: {data.issuedTo}
              </Text>
            )}
            {data.purpose && (
              <Text style={styles.footerText}>
                {labels.purpose}: {data.purpose}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.documentNumber}>
              {data.documentNumber || data.studentId}
            </Text>
            <Text style={styles.footerText}>
              {labels.issueDate}: {formatDate(data.issueDate, locale)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export { createStyles as createTranscriptStyles };
