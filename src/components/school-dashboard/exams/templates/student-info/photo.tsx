// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Photo Student Info — photo placeholder box on one side + standard fields on the other
 * Used when exam papers require student photo identification (formal exams, national tests).
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import { FieldLine } from "../atom"
import type { StudentInfoSectionProps } from "../types"

export interface PhotoStudentInfoProps extends StudentInfoSectionProps {
  photoSize?: number
}

export function PhotoStudentInfo({
  theme,
  showName = true,
  showId = true,
  showClass = true,
  showDate = true,
  showSeatNumber = false,
  photoSize = 60,
}: PhotoStudentInfoProps) {
  const styles = StyleSheet.create({
    container: {
      marginBottom: 15,
      borderWidth: 1,
      borderColor: theme.mutedColor,
      borderRadius: 4,
      padding: 12,
      backgroundColor: theme.backgroundColor,
      flexDirection: theme.isRTL ? "row-reverse" : "row",
    },
    photoSection: {
      width: photoSize + 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.isRTL ? 0 : 15,
      marginLeft: theme.isRTL ? 15 : 0,
    },
    photoBox: {
      width: photoSize,
      height: photoSize * 1.33,
      borderWidth: 1,
      borderColor: theme.secondaryColor,
      borderStyle: "dashed" as never,
      justifyContent: "center",
      alignItems: "center",
    },
    photoLabel: {
      fontSize: theme.fontSize.tiny,
      color: theme.mutedColor,
      textAlign: "center",
      fontFamily: theme.fontFamily,
    },
    fieldsSection: {
      flex: 1,
    },
    fieldRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginBottom: 10,
    },
    lastFieldRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      marginBottom: 0,
    },
    field: {
      flex: 1,
      marginRight: theme.isRTL ? 0 : 20,
      marginLeft: theme.isRTL ? 20 : 0,
    },
    fieldSmall: {
      flex: 0.5,
      marginRight: theme.isRTL ? 0 : 20,
      marginLeft: theme.isRTL ? 20 : 0,
    },
  })

  const labels = {
    name: theme.isRTL ? "الاسم:" : "Name:",
    id: theme.isRTL ? "رقم الطالب:" : "Student ID:",
    class: theme.isRTL ? "الفصل:" : "Class:",
    date: theme.isRTL ? "التاريخ:" : "Date:",
    seat: theme.isRTL ? "رقم المقعد:" : "Seat No:",
    photo: theme.isRTL ? "صورة\nالطالب" : "Student\nPhoto",
  }

  type FieldEntry = { label: string; style: (typeof styles)["field"] }

  const row1Fields = [
    showName && { label: labels.name, style: styles.field },
    showId && { label: labels.id, style: styles.field },
  ].filter(Boolean) as FieldEntry[]

  const row2Fields = [
    showClass && { label: labels.class, style: styles.field },
    showDate && { label: labels.date, style: styles.fieldSmall },
    showSeatNumber && { label: labels.seat, style: styles.fieldSmall },
  ].filter(Boolean) as FieldEntry[]

  return (
    <View style={styles.container}>
      {/* Photo placeholder */}
      <View style={styles.photoSection}>
        <View style={styles.photoBox}>
          <Text style={styles.photoLabel}>{labels.photo}</Text>
        </View>
      </View>

      {/* Fields */}
      <View style={styles.fieldsSection}>
        {row1Fields.length > 0 && (
          <View style={styles.fieldRow}>
            {row1Fields.map((f) => (
              <View key={f.label} style={f.style}>
                <FieldLine label={f.label} theme={theme} />
              </View>
            ))}
          </View>
        )}
        {row2Fields.length > 0 && (
          <View style={styles.lastFieldRow}>
            {row2Fields.map((f) => (
              <View key={f.label} style={f.style}>
                <FieldLine label={f.label} theme={theme} />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
