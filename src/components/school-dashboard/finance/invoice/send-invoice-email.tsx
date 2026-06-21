// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import * as React from "react"
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components"

export interface InvoiceEmailItem {
  name: string
  quantity: number
  price: string
  total: string
}

export interface InvoiceEmailProps {
  lang?: "en" | "ar"
  schoolName: string
  logoUrl?: string | null
  recipientName: string
  invoiceNo: string
  dueDate: string
  items?: InvoiceEmailItem[]
  subtotal?: string
  discount?: string
  tax?: string
  total: string
  amountDue?: string
  invoiceURL: string
  signatureName?: string | null
  signatureImage?: string | null
}

// Self-contained en/ar labels — keeps the email fully localized + RTL-aware
// without threading the app dictionary into a Resend-rendered component (and
// without hardcoded English in the JSX, which the i18n ratchet forbids).
const LABELS = {
  en: {
    greeting: (n: string) => `Hello ${n},`,
    intro: "Your invoice is ready for review. Here are the details:",
    invoiceNo: "Invoice No",
    dueDate: "Due Date",
    item: "Item",
    qty: "Qty",
    price: "Price",
    lineTotal: "Total",
    subtotal: "Subtotal",
    discount: "Discount",
    tax: "Tax",
    total: "Total Amount",
    amountDue: "Amount Due",
    view: "View Invoice",
    questions:
      "If you have any questions, please don't hesitate to contact us.",
    preview: (no: string) => `Invoice ${no}`,
  },
  ar: {
    greeting: (n: string) => `مرحباً ${n}،`,
    intro: "فاتورتك جاهزة للمراجعة. وفيما يلي التفاصيل:",
    invoiceNo: "رقم الفاتورة",
    dueDate: "تاريخ الاستحقاق",
    item: "البند",
    qty: "الكمية",
    price: "السعر",
    lineTotal: "الإجمالي",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    tax: "الضريبة",
    total: "المبلغ الإجمالي",
    amountDue: "المبلغ المستحق",
    view: "عرض الفاتورة",
    questions: "إذا كان لديك أي أسئلة، فلا تتردد في التواصل معنا.",
    preview: (no: string) => `فاتورة ${no}`,
  },
} as const

export const SendInvoiceEmail = ({
  lang = "en",
  schoolName,
  logoUrl,
  recipientName,
  invoiceNo,
  dueDate,
  items = [],
  subtotal,
  discount,
  tax,
  total,
  amountDue,
  invoiceURL,
  signatureName,
  signatureImage,
}: InvoiceEmailProps) => {
  const isRTL = lang === "ar"
  const t = LABELS[isRTL ? "ar" : "en"]
  const align = isRTL ? "right" : "left"
  const endAlign = isRTL ? "left" : "right"
  const fontFamily = isRTL
    ? '"Rubik", Tahoma, Arial, sans-serif'
    : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'

  return (
    <Html lang={lang} dir={isRTL ? "rtl" : "ltr"}>
      <Head />
      <Preview>{t.preview(invoiceNo)}</Preview>
      <Body style={{ backgroundColor: "#f3f4f6", margin: 0, fontFamily }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "24px",
            direction: isRTL ? "rtl" : "ltr",
          }}
        >
          <Section
            style={{
              background: "#ffffff",
              borderRadius: "8px",
              padding: "40px",
            }}
          >
            {/* Branded header */}
            <Row>
              <Column style={{ textAlign: align }}>
                {logoUrl ? (
                  <Img
                    src={logoUrl}
                    alt={schoolName}
                    height={40}
                    style={{ maxHeight: "40px", objectFit: "contain" }}
                  />
                ) : (
                  <Heading
                    as="h2"
                    style={{ color: "#0f172a", fontSize: "20px", margin: 0 }}
                  >
                    {schoolName}
                  </Heading>
                )}
              </Column>
            </Row>

            <Heading
              as="h1"
              style={{
                color: "#111827",
                fontSize: "22px",
                marginTop: "24px",
                textAlign: align,
              }}
            >
              {t.greeting(recipientName)}
            </Heading>
            <Text
              style={{ color: "#4b5563", fontSize: "15px", textAlign: align }}
            >
              {t.intro}
            </Text>

            {/* Meta box */}
            <Section
              style={{
                background: "#f9fafb",
                borderRadius: "6px",
                padding: "16px",
                marginTop: "8px",
              }}
            >
              <Text style={{ margin: "0 0 6px", textAlign: align }}>
                <strong style={{ color: "#374151" }}>{t.invoiceNo}:</strong>{" "}
                <span style={{ color: "#6b7280" }}>{invoiceNo}</span>
              </Text>
              <Text style={{ margin: 0, textAlign: align }}>
                <strong style={{ color: "#374151" }}>{t.dueDate}:</strong>{" "}
                <span style={{ color: "#6b7280" }}>{dueDate}</span>
              </Text>
            </Section>

            {/* Itemized breakdown */}
            {items.length > 0 && (
              <Section style={{ marginTop: "20px" }}>
                <Row>
                  <Column style={{ textAlign: align, ...thStyle }}>
                    {t.item}
                  </Column>
                  <Column
                    style={{ textAlign: endAlign, ...thStyle, width: "60px" }}
                  >
                    {t.qty}
                  </Column>
                  <Column
                    style={{ textAlign: endAlign, ...thStyle, width: "90px" }}
                  >
                    {t.price}
                  </Column>
                  <Column
                    style={{ textAlign: endAlign, ...thStyle, width: "90px" }}
                  >
                    {t.lineTotal}
                  </Column>
                </Row>
                {items.map((it, i) => (
                  <Row key={i}>
                    <Column style={{ textAlign: align, ...tdStyle }}>
                      {it.name}
                    </Column>
                    <Column style={{ textAlign: endAlign, ...tdStyle }}>
                      {it.quantity}
                    </Column>
                    <Column style={{ textAlign: endAlign, ...tdStyle }}>
                      {it.price}
                    </Column>
                    <Column style={{ textAlign: endAlign, ...tdStyle }}>
                      {it.total}
                    </Column>
                  </Row>
                ))}
              </Section>
            )}

            {/* Totals */}
            <Section style={{ marginTop: "12px" }}>
              {subtotal && (
                <TotalRow
                  label={t.subtotal}
                  value={subtotal}
                  align={align}
                  endAlign={endAlign}
                />
              )}
              {discount && (
                <TotalRow
                  label={t.discount}
                  value={discount}
                  align={align}
                  endAlign={endAlign}
                />
              )}
              {tax && (
                <TotalRow
                  label={t.tax}
                  value={tax}
                  align={align}
                  endAlign={endAlign}
                />
              )}
              <TotalRow
                label={t.total}
                value={total}
                align={align}
                endAlign={endAlign}
                bold
              />
              {amountDue && (
                <TotalRow
                  label={t.amountDue}
                  value={amountDue}
                  align={align}
                  endAlign={endAlign}
                />
              )}
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: "center", marginTop: "28px" }}>
              <Button
                href={invoiceURL}
                style={{
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "6px",
                  fontSize: "15px",
                  textDecoration: "none",
                }}
              >
                {t.view}
              </Button>
            </Section>

            {/* Signature */}
            {(signatureImage || signatureName) && (
              <Section style={{ marginTop: "28px", textAlign: align }}>
                {signatureImage && (
                  <Img
                    src={signatureImage}
                    alt={signatureName ?? ""}
                    height={40}
                    style={{ maxHeight: "40px", objectFit: "contain" }}
                  />
                )}
                {signatureName && (
                  <Text
                    style={{
                      color: "#374151",
                      fontSize: "14px",
                      margin: "4px 0 0",
                    }}
                  >
                    {signatureName}
                  </Text>
                )}
              </Section>
            )}

            <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 16px" }} />
            <Text
              style={{
                color: "#6b7280",
                fontSize: "13px",
                textAlign: "center",
              }}
            >
              {t.questions}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const thStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: 600,
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "6px",
}
const tdStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "13px",
  borderBottom: "1px solid #f3f4f6",
  padding: "8px 0",
}

function TotalRow({
  label,
  value,
  align,
  endAlign,
  bold,
}: {
  label: string
  value: string
  align: "left" | "right"
  endAlign: "left" | "right"
  bold?: boolean
}) {
  return (
    <Row>
      <Column
        style={{
          textAlign: align,
          fontSize: "13px",
          color: "#4b5563",
          fontWeight: bold ? 700 : 400,
          padding: "4px 0",
        }}
      >
        {label}
      </Column>
      <Column
        style={{
          textAlign: endAlign,
          fontSize: "13px",
          color: "#111827",
          fontWeight: bold ? 700 : 500,
          padding: "4px 0",
        }}
      >
        {value}
      </Column>
    </Row>
  )
}
