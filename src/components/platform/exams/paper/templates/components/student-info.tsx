/**
 * Student Info Section
 * Name, ID, and class fields for students to fill in
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

interface StudentInfoProps {
  locale: "en" | "ar"
  fontFamily: string
}

const createStyles = (locale: "en" | "ar", fontFamily: string) => {
  const isRTL = locale === "ar"

  return StyleSheet.create({
    container: {
      marginBottom: 15,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 4,
      padding: 12,
      backgroundColor: "#FAFAFA",
    },
    row: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginBottom: 10,
    },
    lastRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginBottom: 0,
    },
    field: {
      flex: 1,
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      marginRight: isRTL ? 0 : 20,
      marginLeft: isRTL ? 20 : 0,
    },
    label: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#374151",
      width: 80,
      fontFamily,
      textAlign: isRTL ? "right" : "left",
    },
    inputLine: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomColor: "#9CA3AF",
      borderStyle: "dotted",
      height: 18,
      marginLeft: isRTL ? 0 : 5,
      marginRight: isRTL ? 5 : 0,
    },
    dateField: {
      flex: 0.5,
    },
  })
}

export function StudentInfo({ locale, fontFamily }: StudentInfoProps) {
  const styles = createStyles(locale, fontFamily)
  const isRTL = locale === "ar"

  const labels = {
    name: isRTL ? "الاسم:" : "Name:",
    id: isRTL ? "رقم الطالب:" : "Student ID:",
    class: isRTL ? "الفصل:" : "Class:",
    date: isRTL ? "التاريخ:" : "Date:",
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>{labels.name}</Text>
          <View style={styles.inputLine} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{labels.id}</Text>
          <View style={styles.inputLine} />
        </View>
      </View>
      <View style={styles.lastRow}>
        <View style={styles.field}>
          <Text style={styles.label}>{labels.class}</Text>
          <View style={styles.inputLine} />
        </View>
        <View style={[styles.field, styles.dateField]}>
          <Text style={styles.label}>{labels.date}</Text>
          <View style={styles.inputLine} />
        </View>
      </View>
    </View>
  )
}
