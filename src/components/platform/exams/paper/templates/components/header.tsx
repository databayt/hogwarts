/**
 * Exam Paper Header Component
 * School logo, name, and exam title
 */

import React from "react"
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import type { ExamWithDetails, SchoolForPaper } from "../../types"

interface HeaderProps {
  school: SchoolForPaper
  exam: ExamWithDetails
  showLogo: boolean
  showTitle: boolean
  locale: "en" | "ar"
  fontFamily: string
  versionCode?: string
}

const createStyles = (locale: "en" | "ar", fontFamily: string) => {
  const isRTL = locale === "ar"

  return StyleSheet.create({
    header: {
      marginBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: "#1F2937",
      paddingBottom: 15,
    },
    headerContent: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
    },
    logoContainer: {
      width: 70,
      marginRight: isRTL ? 0 : 15,
      marginLeft: isRTL ? 15 : 0,
    },
    logo: {
      width: 60,
      height: 60,
      objectFit: "contain",
    },
    schoolInfo: {
      flex: 1,
      alignItems: isRTL ? "flex-end" : "flex-start",
    },
    schoolName: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#1F2937",
      marginBottom: 3,
      fontFamily,
      textAlign: isRTL ? "right" : "left",
    },
    schoolDetails: {
      fontSize: 9,
      color: "#6B7280",
      marginBottom: 2,
      fontFamily,
      textAlign: isRTL ? "right" : "left",
    },
    titleSection: {
      marginTop: 15,
      alignItems: "center",
    },
    examTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#1F2937",
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontFamily,
    },
    examSubtitle: {
      fontSize: 12,
      color: "#374151",
      textAlign: "center",
      marginTop: 5,
      fontFamily,
    },
    versionBadge: {
      position: "absolute",
      top: 0,
      right: isRTL ? undefined : 0,
      left: isRTL ? 0 : undefined,
      backgroundColor: "#1F2937",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 3,
    },
    versionText: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#FFFFFF",
      fontFamily,
    },
  })
}

export function Header({
  school,
  exam,
  showLogo,
  showTitle,
  locale,
  fontFamily,
  versionCode,
}: HeaderProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  const schoolName = isRTL && school.nameAr ? school.nameAr : school.name
  const subjectName = exam.subject.subjectName
  const className = exam.class.name

  return (
    <View style={styles.header}>
      {/* Version Badge */}
      {versionCode && (
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>
            {isRTL ? `نسخة ${versionCode}` : `Version ${versionCode}`}
          </Text>
        </View>
      )}

      {/* School Header */}
      <View style={styles.headerContent}>
        {showLogo && school.logoUrl && (
          <View style={styles.logoContainer}>
            <Image src={school.logoUrl} style={styles.logo} />
          </View>
        )}

        <View style={styles.schoolInfo}>
          <Text style={styles.schoolName}>{schoolName}</Text>
          {school.address && (
            <Text style={styles.schoolDetails}>{school.address}</Text>
          )}
          {school.phoneNumber && (
            <Text style={styles.schoolDetails}>
              {isRTL
                ? `هاتف: ${school.phoneNumber}`
                : `Tel: ${school.phoneNumber}`}
            </Text>
          )}
          {school.email && (
            <Text style={styles.schoolDetails}>
              {isRTL ? `بريد: ${school.email}` : `Email: ${school.email}`}
            </Text>
          )}
        </View>
      </View>

      {/* Exam Title */}
      {showTitle && (
        <View style={styles.titleSection}>
          <Text style={styles.examTitle}>{exam.title}</Text>
          <Text style={styles.examSubtitle}>
            {isRTL
              ? `${subjectName} - ${className}`
              : `${subjectName} - ${className}`}
          </Text>
        </View>
      )}
    </View>
  )
}
