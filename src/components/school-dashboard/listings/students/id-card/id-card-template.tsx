"use client"

import { forwardRef, useEffect, useRef } from "react"
import { format } from "date-fns"
import JsBarcode from "jsbarcode"
import { QRCodeSVG } from "qrcode.react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import type { IDCardData, IDCardTemplate } from "./types"

interface IDCardTemplateProps {
  data: IDCardData
  template: IDCardTemplate
  side?: "front" | "back"
}

export const IDCardTemplateComponent = forwardRef<
  HTMLDivElement,
  IDCardTemplateProps
>(({ data, template, side = "front" }, ref) => {
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (barcodeRef.current && data.grNumber && template.includeBarcode) {
      JsBarcode(barcodeRef.current, data.grNumber, {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: true,
        fontSize: 12,
        margin: 0,
      })
    }
  }, [data.grNumber, template.includeBarcode])

  const getInitials = (name: string) => {
    const parts = name.split(" ")
    return `${parts[0]?.[0] || ""}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase()
  }

  const cardStyle: React.CSSProperties = {
    width: template.orientation === "portrait" ? "54mm" : "85.6mm",
    height: template.orientation === "portrait" ? "85.6mm" : "54mm",
    backgroundColor: "white",
    borderRadius: "4mm",
    padding: "4mm",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    fontFamily: template.fontFamily || "Inter",
    position: "relative",
    overflow: "hidden",
  }

  if (side === "front") {
    return (
      <div ref={ref} style={cardStyle} className="id-card-front">
        {/* Header with school branding */}
        <div
          style={{
            background: `linear-gradient(135deg, ${template.primaryColor}, ${template.secondaryColor})`,
            margin: "-4mm -4mm 3mm -4mm",
            padding: "3mm 4mm",
            color: "white",
            textAlign: "center",
          }}
        >
          <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: 0 }}>
            {data.schoolName}
          </h3>
          {data.schoolAddress && (
            <p style={{ fontSize: "8px", margin: "2px 0 0 0", opacity: 0.9 }}>
              {data.schoolAddress}
            </p>
          )}
        </div>

        {/* Student Photo and Basic Info */}
        <div style={{ display: "flex", gap: "3mm", alignItems: "flex-start" }}>
          <Avatar
            style={{ width: "20mm", height: "25mm", borderRadius: "2mm" }}
          >
            <AvatarImage
              src={data.profilePhotoUrl}
              alt={data.studentName}
              style={{ objectFit: "cover" }}
            />
            <AvatarFallback
              style={{
                fontSize: "16px",
                backgroundColor: template.primaryColor + "20",
                color: template.primaryColor,
              }}
            >
              {getInitials(data.studentName)}
            </AvatarFallback>
          </Avatar>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "2mm" }}>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: template.primaryColor,
                  margin: 0,
                }}
              >
                {data.studentName}
              </p>
              <p style={{ fontSize: "10px", color: "#666", margin: "1mm 0" }}>
                {data.grNumber}
              </p>
            </div>

            <div style={{ fontSize: "9px", color: "#444", lineHeight: 1.4 }}>
              <p style={{ margin: "1mm 0" }}>
                <strong>Class:</strong> {data.class}{" "}
                {data.section && `- ${data.section}`}
              </p>
              <p style={{ margin: "1mm 0" }}>
                <strong>DOB:</strong>{" "}
                {format(new Date(data.dateOfBirth), "dd/MM/yyyy")}
              </p>
              {data.bloodGroup && (
                <p style={{ margin: "1mm 0" }}>
                  <strong>Blood:</strong> {data.bloodGroup}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Academic Year */}
        <div
          style={{
            marginTop: "3mm",
            padding: "2mm",
            backgroundColor: template.secondaryColor + "10",
            borderRadius: "2mm",
            textAlign: "center",
            fontSize: "10px",
          }}
        >
          <strong>Academic Year:</strong> {data.academicYear}
        </div>

        {/* Barcode */}
        {template.includeBarcode && data.grNumber && (
          <div style={{ textAlign: "center", marginTop: "3mm" }}>
            <svg ref={barcodeRef}></svg>
          </div>
        )}

        {/* QR Code */}
        {template.includeQRCode && (
          <div style={{ position: "absolute", bottom: "3mm", right: "3mm" }}>
            <QRCodeSVG
              value={JSON.stringify({
                id: data.studentId,
                gr: data.grNumber,
                name: data.studentName,
              })}
              size={48}
            />
          </div>
        )}

        {/* Issue Date */}
        <div
          style={{
            position: "absolute",
            bottom: "2mm",
            left: "4mm",
            fontSize: "7px",
            color: "#999",
          }}
        >
          Issued: {format(new Date(data.issueDate), "MMM yyyy")}
        </div>
      </div>
    )
  } else {
    // Back side of the card
    return (
      <div ref={ref} style={cardStyle} className="id-card-back">
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${template.primaryColor}, ${template.secondaryColor})`,
            margin: "-4mm -4mm 3mm -4mm",
            padding: "3mm 4mm",
            color: "white",
            textAlign: "center",
          }}
        >
          <h4 style={{ fontSize: "12px", fontWeight: "bold", margin: 0 }}>
            STUDENT ID CARD
          </h4>
        </div>

        {/* Contact Information */}
        <div style={{ fontSize: "9px", color: "#444", lineHeight: 1.6 }}>
          <h5
            style={{
              fontSize: "10px",
              fontWeight: "bold",
              color: template.primaryColor,
              marginBottom: "2mm",
              marginTop: 0,
            }}
          >
            Contact Information
          </h5>
          {data.mobileNumber && (
            <p style={{ margin: "1mm 0" }}>
              <strong>Mobile:</strong> {data.mobileNumber}
            </p>
          )}
          {data.emergencyContact && (
            <p style={{ margin: "1mm 0" }}>
              <strong>Emergency:</strong> {data.emergencyContact}
            </p>
          )}
        </div>

        {/* School Contact */}
        <div
          style={{
            marginTop: "4mm",
            padding: "2mm",
            backgroundColor: "#f8f8f8",
            borderRadius: "2mm",
            fontSize: "8px",
          }}
        >
          <h5
            style={{
              fontSize: "9px",
              fontWeight: "bold",
              color: template.primaryColor,
              margin: "0 0 2mm 0",
            }}
          >
            School Contact
          </h5>
          {data.schoolPhone && (
            <p style={{ margin: "1mm 0" }}>Tel: {data.schoolPhone}</p>
          )}
          {data.schoolWebsite && (
            <p style={{ margin: "1mm 0" }}>Web: {data.schoolWebsite}</p>
          )}
        </div>

        {/* Instructions */}
        <div
          style={{
            marginTop: "4mm",
            padding: "2mm",
            border: "1px solid #ddd",
            borderRadius: "2mm",
            fontSize: "7px",
            color: "#666",
          }}
        >
          <p style={{ margin: "1mm 0", fontStyle: "italic" }}>
            • This card must be carried at all times
          </p>
          <p style={{ margin: "1mm 0", fontStyle: "italic" }}>
            • If found, please return to school
          </p>
          <p style={{ margin: "1mm 0", fontStyle: "italic" }}>
            • Valid until: {format(new Date(data.validUntil), "MMM yyyy")}
          </p>
        </div>

        {/* Signature Line */}
        <div
          style={{
            position: "absolute",
            bottom: "4mm",
            right: "4mm",
            fontSize: "8px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              borderTop: "1px solid #999",
              width: "25mm",
              paddingTop: "1mm",
            }}
          >
            Principal Signature
          </div>
        </div>

        {/* Card Number */}
        {data.cardNumber && (
          <div
            style={{
              position: "absolute",
              bottom: "2mm",
              left: "4mm",
              fontSize: "7px",
              color: "#999",
            }}
          >
            Card #{data.cardNumber}
          </div>
        )}
      </div>
    )
  }
})

IDCardTemplateComponent.displayName = "IDCardTemplate"
