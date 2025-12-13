/**
 * Unified File Block - Certificate Template
 * PDF template for certificates
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
import type { CertificateData, TemplateStyle } from "./types";

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

const createStyles = (locale: string = "en", style: TemplateStyle = "elegant") => {
  const isRTL = locale === "ar";
  const fontFamily = isRTL ? "Tajawal" : "Inter";

  const baseStyles = StyleSheet.create({
    page: {
      padding: 50,
      fontFamily,
      fontSize: 12,
      direction: isRTL ? "rtl" : "ltr",
      backgroundColor: "#fffdf7",
    },
    border: {
      position: "absolute",
      top: 20,
      left: 20,
      right: 20,
      bottom: 20,
      borderWidth: 3,
      borderColor: "#c9a227",
      borderStyle: "solid",
    },
    innerBorder: {
      position: "absolute",
      top: 30,
      left: 30,
      right: 30,
      bottom: 30,
      borderWidth: 1,
      borderColor: "#c9a227",
      borderStyle: "solid",
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: 20,
    },
    schoolName: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#1a1a1a",
      marginBottom: 5,
      textAlign: "center",
    },
    title: {
      fontSize: 36,
      fontWeight: "bold",
      color: "#c9a227",
      marginTop: 30,
      marginBottom: 20,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 4,
    },
    subtitle: {
      fontSize: 14,
      color: "#666",
      marginBottom: 30,
      textAlign: "center",
    },
    recipientLabel: {
      fontSize: 14,
      color: "#666",
      marginBottom: 10,
      textAlign: "center",
    },
    recipientName: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#1a1a1a",
      marginBottom: 30,
      textAlign: "center",
      borderBottomWidth: 2,
      borderBottomColor: "#c9a227",
      paddingBottom: 10,
    },
    achievement: {
      fontSize: 14,
      color: "#333",
      textAlign: "center",
      maxWidth: 400,
      lineHeight: 1.6,
      marginBottom: 20,
    },
    courseName: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#1a1a1a",
      marginBottom: 30,
      textAlign: "center",
    },
    dateSection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "center",
      gap: 30,
      marginBottom: 40,
    },
    dateItem: {
      alignItems: "center",
    },
    dateLabel: {
      fontSize: 10,
      color: "#666",
      marginBottom: 5,
    },
    dateValue: {
      fontSize: 12,
      color: "#1a1a1a",
    },
    signaturesSection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-around",
      width: "100%",
      marginTop: 40,
    },
    signatureBlock: {
      alignItems: "center",
      width: 150,
    },
    signatureImage: {
      width: 100,
      height: 40,
      marginBottom: 5,
    },
    signatureLine: {
      width: 120,
      borderBottomWidth: 1,
      borderBottomColor: "#333",
      marginBottom: 5,
    },
    signatureName: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#1a1a1a",
    },
    signatureTitle: {
      fontSize: 9,
      color: "#666",
    },
    certificateNumber: {
      position: "absolute",
      bottom: 40,
      left: 50,
      fontSize: 9,
      color: "#999",
    },
    verificationQR: {
      position: "absolute",
      bottom: 30,
      right: 50,
      width: 60,
      height: 60,
    },
  });

  return baseStyles;
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
// Certificate Template Component
// ============================================================================

interface CertificateTemplateProps {
  data: CertificateData;
  style?: TemplateStyle;
}

export function CertificateTemplate({ data, style = "elegant" }: CertificateTemplateProps) {
  const locale = data.locale || "en";
  const styles = createStyles(locale, style);
  const isRTL = locale === "ar";

  const labels = {
    thisIsTo: isRTL ? "شهادة تقدير" : "This is to certify that",
    has: isRTL ? "قد" : "has",
    issuedOn: isRTL ? "تاريخ الإصدار" : "Issued On",
    validUntil: isRTL ? "صالحة حتى" : "Valid Until",
    certificateNo: isRTL ? "رقم الشهادة" : "Certificate No",
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Decorative borders */}
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        <View style={styles.content}>
          {/* Logo */}
          {data.schoolLogo && (
            <Image src={data.schoolLogo} style={styles.logo} />
          )}

          {/* School Name */}
          <Text style={styles.schoolName}>
            {isRTL ? data.schoolNameAr || data.schoolName : data.schoolName}
          </Text>

          {/* Certificate Title */}
          <Text style={styles.title}>
            {isRTL ? data.certificateTitleAr || data.certificateTitle : data.certificateTitle}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{labels.thisIsTo}</Text>

          {/* Recipient Name */}
          <Text style={styles.recipientName}>
            {isRTL ? data.recipientNameAr || data.recipientName : data.recipientName}
          </Text>

          {/* Achievement */}
          <Text style={styles.achievement}>
            {isRTL ? data.achievementAr || data.achievement : data.achievement}
          </Text>

          {/* Course Name */}
          {data.courseName && (
            <Text style={styles.courseName}>
              {isRTL ? data.courseNameAr || data.courseName : data.courseName}
            </Text>
          )}

          {/* Grade/Score */}
          {data.grade && (
            <Text style={styles.achievement}>
              {isRTL ? `الدرجة: ${data.grade}` : `Grade: ${data.grade}`}
              {data.score && ` (${data.score}%)`}
            </Text>
          )}

          {/* Dates */}
          <View style={styles.dateSection}>
            {data.completionDate && (
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>{labels.issuedOn}</Text>
                <Text style={styles.dateValue}>
                  {formatDate(data.completionDate, locale)}
                </Text>
              </View>
            )}
            {data.expiryDate && (
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>{labels.validUntil}</Text>
                <Text style={styles.dateValue}>
                  {formatDate(data.expiryDate, locale)}
                </Text>
              </View>
            )}
          </View>

          {/* Signatures */}
          <View style={styles.signaturesSection}>
            {data.signatures.map((sig, idx) => (
              <View key={idx} style={styles.signatureBlock}>
                {sig.signature ? (
                  <Image src={sig.signature} style={styles.signatureImage} />
                ) : (
                  <View style={styles.signatureLine} />
                )}
                <Text style={styles.signatureName}>{sig.name}</Text>
                <Text style={styles.signatureTitle}>{sig.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Certificate Number */}
        <Text style={styles.certificateNumber}>
          {labels.certificateNo}: {data.certificateNumber}
        </Text>

        {/* Verification QR Code */}
        {data.verificationUrl && (
          <View style={styles.verificationQR}>
            {/* QR code would be rendered here - needs qrcode library integration */}
          </View>
        )}
      </Page>
    </Document>
  );
}

export { createStyles as createCertificateStyles };
