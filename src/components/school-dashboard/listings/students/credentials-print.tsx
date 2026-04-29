"use client"

// Print-only credentials sheet. Renders directly under <body> via portal so
// the @media-print rule that hides every other body child can match it
// uniformly regardless of where the dialog itself was mounted in the tree.
//
// Lifecycle: parent flips `open` to true → portal mounts → window.print()
// fires after a tick → admin prints or cancels → afterprint fires →
// parent flips `open` back to false. Re-entrant (clicking Print twice).
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

export interface PrintLabels {
  printTitle: string
  printGenerated: string
  /** Template token: {studentName} */
  printInstructions: string
  username: string
  password: string
  loginUrl: string
}

interface CredentialsPrintProps {
  open: boolean
  onClose: () => void
  schoolName: string
  studentName: string
  username: string
  password: string
  loginUrl: string
  lang: string
  labels: PrintLabels
}

export function CredentialsPrint({
  open,
  onClose,
  schoolName,
  studentName,
  username,
  password,
  loginUrl,
  lang,
  labels,
}: CredentialsPrintProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open || !mounted) return

    // Wait one tick so the portal DOM is in the document before printing.
    const t = window.setTimeout(() => {
      window.print()
    }, 80)

    const handleAfterPrint = () => onClose()
    window.addEventListener("afterprint", handleAfterPrint)

    return () => {
      window.clearTimeout(t)
      window.removeEventListener("afterprint", handleAfterPrint)
    }
  }, [open, mounted, onClose])

  if (!open || !mounted) return null

  const isRtl = lang === "ar"
  const dateStr = new Intl.DateTimeFormat(lang, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date())
  const instructions = labels.printInstructions
    .split("{studentName}")
    .join(studentName)

  return createPortal(
    <>
      <style>{`
        @media print {
          body > *:not(#credentials-print-portal) { display: none !important; }
          #credentials-print-portal {
            display: block !important;
            background: white !important;
            color: black !important;
            font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
          }
          @page { margin: 1.8cm; }
        }
        @media screen { #credentials-print-portal { display: none; } }
      `}</style>
      <div id="credentials-print-portal" dir={isRtl ? "rtl" : "ltr"}>
        <div style={{ maxWidth: "100%" }}>
          <header
            style={{
              borderBlockEnd: "2px solid #111",
              paddingBlockEnd: "12px",
              marginBlockEnd: "28px",
            }}
          >
            <h1
              style={{
                fontSize: "22pt",
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {schoolName}
            </h1>
            <p style={{ fontSize: "11pt", margin: "6px 0 0 0", color: "#555" }}>
              {labels.printTitle}
            </p>
          </header>

          <section style={{ marginBlockEnd: "28px" }}>
            <h2
              style={{
                fontSize: "16pt",
                fontWeight: 600,
                marginBlockEnd: "18px",
              }}
            >
              {studentName}
            </h2>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13pt",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      paddingBlock: "10px",
                      paddingInlineEnd: "20px",
                      width: "30%",
                      color: "#555",
                      verticalAlign: "top",
                    }}
                  >
                    {labels.username}
                  </td>
                  <td
                    style={{
                      paddingBlock: "10px",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {username}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      paddingBlock: "10px",
                      paddingInlineEnd: "20px",
                      color: "#555",
                      verticalAlign: "top",
                    }}
                  >
                    {labels.password}
                  </td>
                  <td
                    style={{
                      paddingBlock: "10px",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {password}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      paddingBlock: "10px",
                      paddingInlineEnd: "20px",
                      color: "#555",
                      verticalAlign: "top",
                    }}
                  >
                    {labels.loginUrl}
                  </td>
                  <td
                    style={{
                      paddingBlock: "10px",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                      wordBreak: "break-all",
                    }}
                  >
                    {loginUrl}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section
            style={{
              marginBlockEnd: "24px",
              padding: "14px 18px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <p style={{ fontSize: "10pt", margin: 0, lineHeight: 1.55 }}>
              {instructions}
            </p>
          </section>

          <footer
            style={{
              fontSize: "9pt",
              color: "#888",
              borderBlockStart: "1px solid #ccc",
              paddingBlockStart: "10px",
            }}
          >
            {labels.printGenerated}: {dateStr}
          </footer>
        </div>
      </div>
    </>,
    document.body
  )
}
