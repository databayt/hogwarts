import * as React from "react"

interface EmailTemplateProps {
  firstName: string
  invoiceNo: string
  dueDate: string
  total: string
  invoiceURL: string
}

export const SendInvoiceEmail = ({
  firstName,
  invoiceNo,
  dueDate,
  total,
  invoiceURL,
}: EmailTemplateProps) => (
  <div
    style={{
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      maxWidth: "600px",
      margin: "0 auto",
      padding: "20px",
    }}
  >
    <div
      style={{
        background: "#ffffff",
        borderRadius: "8px",
        padding: "40px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h1
        style={{
          color: "#333",
          fontSize: "24px",
          marginBottom: "24px",
        }}
      >
        Hello {firstName},
      </h1>

      <p
        style={{
          color: "#666",
          fontSize: "16px",
          lineHeight: "24px",
          marginBottom: "24px",
        }}
      >
        Your invoice is ready for review. Here are the details:
      </p>

      <div
        style={{
          background: "#f9fafb",
          borderRadius: "4px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ marginBottom: "12px" }}>
          <strong style={{ color: "#374151" }}>Invoice No:</strong>
          <span style={{ color: "#6b7280", marginLeft: "8px" }}>
            {invoiceNo}
          </span>
        </div>
        <div style={{ marginBottom: "12px" }}>
          <strong style={{ color: "#374151" }}>Due Date:</strong>
          <span style={{ color: "#6b7280", marginLeft: "8px" }}>{dueDate}</span>
        </div>
        <div>
          <strong style={{ color: "#374151" }}>Total Amount:</strong>
          <span style={{ color: "#6b7280", marginLeft: "8px" }}>{total}</span>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "32px" }}>
        <a
          href={invoiceURL}
          style={{
            backgroundColor: "#0f172a",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "6px",
            textDecoration: "none",
            display: "inline-block",
            fontSize: "16px",
          }}
        >
          View Invoice
        </a>
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          borderTop: "1px solid #e5e7eb",
          color: "#6b7280",
          fontSize: "14px",
          textAlign: "center",
        }}
      >
        <p>If you have any questions, please don't hesitate to contact us.</p>
      </div>
    </div>
  </div>
)
