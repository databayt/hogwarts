/**
 * Unified File Block - ID Card Template
 * PDF template for student, teacher, staff, and parent ID cards
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
import type { IdCardData, TemplateStyle } from "../types";

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

const createStyles = (locale: string = "en", cardType: string = "student") => {
  const isRTL = locale === "ar";
  const fontFamily = isRTL ? "Tajawal" : "Inter";

  // Color scheme based on card type
  const colorSchemes: Record<string, { primary: string; secondary: string }> = {
    student: { primary: "#1e40af", secondary: "#3b82f6" },
    teacher: { primary: "#166534", secondary: "#22c55e" },
    staff: { primary: "#9333ea", secondary: "#a855f7" },
    parent: { primary: "#0891b2", secondary: "#22d3ee" },
  };

  const colors = colorSchemes[cardType] || colorSchemes.student;

  return StyleSheet.create({
    // Front of card
    cardPage: {
      width: 323, // ~85.6mm in points (standard ID card size)
      height: 204, // ~54mm in points
      padding: 0,
      fontFamily,
      fontSize: 8,
      direction: isRTL ? "rtl" : "ltr",
      backgroundColor: "#ffffff",
    },
    frontCard: {
      flex: 1,
      backgroundColor: "#ffffff",
      position: "relative",
    },
    // Header with school branding
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    logoSmall: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
    },
    schoolNameHeader: {
      flex: 1,
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "bold",
      textAlign: isRTL ? "right" : "left",
    },
    cardTypeBadge: {
      backgroundColor: colors.secondary,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 3,
    },
    cardTypeText: {
      color: "#ffffff",
      fontSize: 7,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    // Main content
    mainContent: {
      flex: 1,
      flexDirection: isRTL ? "row-reverse" : "row",
      padding: 10,
      gap: 10,
    },
    photoSection: {
      alignItems: "center",
    },
    photo: {
      width: 55,
      height: 70,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: "#f3f4f6",
    },
    infoSection: {
      flex: 1,
    },
    fullName: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#111827",
      marginBottom: 4,
      textAlign: isRTL ? "right" : "left",
    },
    idNumber: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: "bold",
      marginBottom: 8,
      textAlign: isRTL ? "right" : "left",
    },
    infoRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      marginBottom: 3,
    },
    infoLabel: {
      fontSize: 7,
      color: "#6b7280",
      width: 45,
      textAlign: isRTL ? "right" : "left",
    },
    infoValue: {
      fontSize: 7,
      color: "#111827",
      flex: 1,
      textAlign: isRTL ? "right" : "left",
    },
    // Footer with validity
    footer: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#f3f4f6",
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    validityText: {
      fontSize: 6,
      color: "#6b7280",
    },
    validityDate: {
      fontSize: 7,
      fontWeight: "bold",
      color: "#111827",
    },
    // Back of card
    backCard: {
      flex: 1,
      backgroundColor: "#ffffff",
      padding: 10,
    },
    barcodeSection: {
      alignItems: "center",
      marginBottom: 10,
    },
    barcodePlaceholder: {
      width: 180,
      height: 40,
      backgroundColor: "#f3f4f6",
      alignItems: "center",
      justifyContent: "center",
    },
    barcodeText: {
      fontSize: 8,
      color: "#374151",
      marginTop: 3,
    },
    emergencySection: {
      backgroundColor: "#fef2f2",
      padding: 8,
      borderRadius: 4,
      marginBottom: 10,
    },
    emergencyTitle: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#991b1b",
      marginBottom: 4,
      textAlign: isRTL ? "right" : "left",
    },
    emergencyContact: {
      fontSize: 7,
      color: "#111827",
      textAlign: isRTL ? "right" : "left",
    },
    addressSection: {
      marginBottom: 10,
    },
    addressLabel: {
      fontSize: 7,
      color: "#6b7280",
      marginBottom: 2,
      textAlign: isRTL ? "right" : "left",
    },
    addressText: {
      fontSize: 7,
      color: "#111827",
      textAlign: isRTL ? "right" : "left",
    },
    qrSection: {
      position: "absolute",
      bottom: 10,
      right: isRTL ? undefined : 10,
      left: isRTL ? 10 : undefined,
      alignItems: "center",
    },
    qrPlaceholder: {
      width: 50,
      height: 50,
      backgroundColor: "#f3f4f6",
      alignItems: "center",
      justifyContent: "center",
    },
    schoolContact: {
      position: "absolute",
      bottom: 10,
      left: isRTL ? undefined : 10,
      right: isRTL ? 10 : undefined,
    },
    contactText: {
      fontSize: 6,
      color: "#6b7280",
      textAlign: isRTL ? "right" : "left",
    },
  });
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

// ============================================================================
// ID Card Template Component
// ============================================================================

interface IdCardTemplateProps {
  data: IdCardData;
  style?: TemplateStyle;
}

export function IdCardTemplate({ data, style = "photo-id" }: IdCardTemplateProps) {
  const locale = data.locale || "en";
  const styles = createStyles(locale, data.cardType);
  const isRTL = locale === "ar";

  const labels = {
    student: isRTL ? "طالب" : "Student",
    teacher: isRTL ? "معلم" : "Teacher",
    staff: isRTL ? "موظف" : "Staff",
    parent: isRTL ? "ولي أمر" : "Parent",
    id: isRTL ? "الرقم" : "ID",
    class: isRTL ? "الفصل" : "Class",
    department: isRTL ? "القسم" : "Department",
    designation: isRTL ? "المسمى" : "Designation",
    children: isRTL ? "الأبناء" : "Children",
    bloodGroup: isRTL ? "فصيلة الدم" : "Blood Group",
    validUntil: isRTL ? "صالحة حتى" : "Valid Until",
    emergencyContact: isRTL ? "جهة الاتصال للطوارئ" : "Emergency Contact",
    address: isRTL ? "العنوان" : "Address",
    ifFound: isRTL ? "في حالة العثور على البطاقة" : "If found, please return to",
  };

  const cardTypeLabel = labels[data.cardType];

  return (
    <Document>
      {/* Front of Card */}
      <Page size={{ width: 323, height: 204 }} style={styles.cardPage}>
        <View style={styles.frontCard}>
          {/* Header */}
          <View style={styles.header}>
            {data.schoolLogo && (
              <Image src={data.schoolLogo} style={styles.logoSmall} />
            )}
            <Text style={styles.schoolNameHeader}>
              {isRTL ? data.schoolNameAr || data.schoolName : data.schoolName}
            </Text>
            <View style={styles.cardTypeBadge}>
              <Text style={styles.cardTypeText}>{cardTypeLabel}</Text>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Photo */}
            <View style={styles.photoSection}>
              {data.photo ? (
                <Image src={data.photo} style={styles.photo} />
              ) : (
                <View style={styles.photo} />
              )}
            </View>

            {/* Info */}
            <View style={styles.infoSection}>
              <Text style={styles.fullName}>
                {isRTL ? data.fullNameAr || data.fullName : data.fullName}
              </Text>
              <Text style={styles.idNumber}>{data.idNumber}</Text>

              {/* Role-specific info */}
              {data.cardType === "student" && data.className && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{labels.class}:</Text>
                  <Text style={styles.infoValue}>{data.className}</Text>
                </View>
              )}

              {(data.cardType === "teacher" || data.cardType === "staff") && data.department && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{labels.department}:</Text>
                  <Text style={styles.infoValue}>{data.department}</Text>
                </View>
              )}

              {data.cardType === "staff" && data.designation && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{labels.designation}:</Text>
                  <Text style={styles.infoValue}>{data.designation}</Text>
                </View>
              )}

              {data.cardType === "parent" && data.childNames && data.childNames.length > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{labels.children}:</Text>
                  <Text style={styles.infoValue}>{data.childNames.join(", ")}</Text>
                </View>
              )}

              {data.bloodGroup && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{labels.bloodGroup}:</Text>
                  <Text style={styles.infoValue}>{data.bloodGroup}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.validityText}>{labels.validUntil}</Text>
              <Text style={styles.validityDate}>
                {data.validUntil ? formatDate(data.validUntil, locale) : "-"}
              </Text>
            </View>
            <Text style={styles.validityText}>
              {data.documentNumber || data.idNumber}
            </Text>
          </View>
        </View>
      </Page>

      {/* Back of Card */}
      <Page size={{ width: 323, height: 204 }} style={styles.cardPage}>
        <View style={styles.backCard}>
          {/* Barcode */}
          <View style={styles.barcodeSection}>
            <View style={styles.barcodePlaceholder}>
              <Text style={{ fontSize: 8, color: "#9ca3af" }}>BARCODE</Text>
            </View>
            <Text style={styles.barcodeText}>{data.barcodeData}</Text>
          </View>

          {/* Emergency Contact */}
          {data.emergencyContact && (
            <View style={styles.emergencySection}>
              <Text style={styles.emergencyTitle}>{labels.emergencyContact}</Text>
              <Text style={styles.emergencyContact}>{data.emergencyContact}</Text>
            </View>
          )}

          {/* Address */}
          {data.address && (
            <View style={styles.addressSection}>
              <Text style={styles.addressLabel}>{labels.address}</Text>
              <Text style={styles.addressText}>{data.address}</Text>
            </View>
          )}

          {/* QR Code */}
          {data.qrCodeData && (
            <View style={styles.qrSection}>
              <View style={styles.qrPlaceholder}>
                <Text style={{ fontSize: 6, color: "#9ca3af" }}>QR</Text>
              </View>
            </View>
          )}

          {/* School Contact */}
          <View style={styles.schoolContact}>
            <Text style={styles.contactText}>{labels.ifFound}:</Text>
            <Text style={styles.contactText}>
              {isRTL ? data.schoolNameAr || data.schoolName : data.schoolName}
            </Text>
            {data.schoolPhone && (
              <Text style={styles.contactText}>{data.schoolPhone}</Text>
            )}
            {data.schoolAddress && (
              <Text style={styles.contactText}>{data.schoolAddress}</Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export { createStyles as createIdCardStyles };
