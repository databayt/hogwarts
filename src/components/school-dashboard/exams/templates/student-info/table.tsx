// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Table Student Info — bordered table layout with cells instead of field lines
 * More structured look, suitable for formal exams requiring clear data entry cells.
 */

import React from "react"
import { StyleSheet, Text, View } from "@react-pdf/renderer"

import type { StudentInfoSectionProps } from "../types"

export function TableStudentInfo({
  theme,
  showName = true,
  showId = true,
  showClass = true,
  showDate = true,
  showSeatNumber = false,
}: StudentInfoSectionProps) {
  const styles = StyleSheet.create({
    container: {
      marginBottom: 15,
    },
    table: {
      borderWidth: 1,
      borderColor: theme.primaryColor,
      borderRadius: 4,
    },
    row: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      borderBottomWidth: 1,
      borderBottomColor: theme.mutedColor,
    },
    lastRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
    },
    labelCell: {
      width: 100,
      backgroundColor: theme.backgroundColor,
      padding: 8,
      borderRightWidth: theme.isRTL ? 0 : 1,
      borderLeftWidth: theme.isRTL ? 1 : 0,
      borderRightColor: theme.mutedColor,
      borderLeftColor: theme.mutedColor,
      justifyContent: "center",
    },
    valueCell: {
      flex: 1,
      padding: 8,
      minHeight: 28,
      justifyContent: "center",
    },
    labelText: {
      fontSize: theme.fontSize.small,
      fontWeight: "bold",
      color: theme.primaryColor,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    valueText: {
      fontSize: theme.fontSize.small,
      color: theme.secondaryColor,
      textAlign: theme.isRTL ? "right" : "left",
      fontFamily: theme.fontFamily,
    },
    halfRow: {
      flexDirection: theme.isRTL ? "row-reverse" : "row",
      borderBottomWidth: 1,
      borderBottomColor: theme.mutedColor,
    },
    halfCell: {
      flex: 1,
      flexDirection: theme.isRTL ? "row-reverse" : "row",
    },
    halfLabelCell: {
      width: 100,
      backgroundColor: theme.backgroundColor,
      padding: 8,
      borderRightWidth: theme.isRTL ? 0 : 1,
      borderLeftWidth: theme.isRTL ? 1 : 0,
      borderRightColor: theme.mutedColor,
      borderLeftColor: theme.mutedColor,
      justifyContent: "center",
    },
    halfValueCell: {
      flex: 1,
      padding: 8,
      minHeight: 28,
      justifyContent: "center",
      borderRightWidth: theme.isRTL ? 0 : 1,
      borderLeftWidth: theme.isRTL ? 1 : 0,
      borderRightColor: theme.mutedColor,
      borderLeftColor: theme.mutedColor,
    },
  })

  const labels = {
    name: theme.isRTL ? "الاسم" : "Name",
    id: theme.isRTL ? "رقم الطالب" : "Student ID",
    class: theme.isRTL ? "الفصل" : "Class",
    date: theme.isRTL ? "التاريخ" : "Date",
    seat: theme.isRTL ? "رقم المقعد" : "Seat No.",
  }

  type FieldEntry = { label: string; key: string }

  const fullWidthFields: FieldEntry[] = [
    ...(showName ? [{ label: labels.name, key: "name" }] : []),
  ]

  const halfWidthFields: FieldEntry[] = [
    ...(showId ? [{ label: labels.id, key: "id" }] : []),
    ...(showClass ? [{ label: labels.class, key: "class" }] : []),
    ...(showDate ? [{ label: labels.date, key: "date" }] : []),
    ...(showSeatNumber ? [{ label: labels.seat, key: "seat" }] : []),
  ]

  // Group half-width fields into pairs
  const halfWidthPairs: FieldEntry[][] = []
  for (let i = 0; i < halfWidthFields.length; i += 2) {
    halfWidthPairs.push(halfWidthFields.slice(i, i + 2))
  }

  return (
    <View style={styles.container}>
      <View style={styles.table}>
        {/* Full-width rows (e.g., Name) */}
        {fullWidthFields.map((field, idx) => (
          <View
            key={field.key}
            style={
              idx < fullWidthFields.length - 1 || halfWidthPairs.length > 0
                ? styles.row
                : styles.lastRow
            }
          >
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>{field.label}</Text>
            </View>
            <View style={styles.valueCell}>
              <Text style={styles.valueText}> </Text>
            </View>
          </View>
        ))}

        {/* Half-width paired rows */}
        {halfWidthPairs.map((pair, idx) => (
          <View
            key={pair[0].key}
            style={
              idx < halfWidthPairs.length - 1 ? styles.halfRow : styles.lastRow
            }
          >
            {pair.map((field, fieldIdx) => (
              <View
                key={field.key}
                style={[
                  styles.halfCell,
                  fieldIdx === 0 && pair.length > 1
                    ? {
                        borderRightWidth: theme.isRTL ? 0 : 1,
                        borderLeftWidth: theme.isRTL ? 1 : 0,
                        borderRightColor: theme.primaryColor,
                        borderLeftColor: theme.primaryColor,
                      }
                    : {},
                ]}
              >
                <View style={styles.halfLabelCell}>
                  <Text style={styles.labelText}>{field.label}</Text>
                </View>
                <View style={styles.halfValueCell}>
                  <Text style={styles.valueText}> </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}
