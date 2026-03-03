"use client"

import React, { useState } from "react"

interface PDFViewerProps {
  isOpen: boolean
  onClose: () => void
  url: string | null | undefined
  title: string
  fileName?: string
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  isOpen,
  onClose,
  url,
  title,
  fileName = "document.pdf",
}) => {
  const [pdfScale, setPdfScale] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Function to handle zoom controls
  const zoomIn = () => {
    setPdfScale((prev) => Math.min(prev + 0.1, 2)) // Maximum zoom: 2x
  }

  const zoomOut = () => {
    setPdfScale((prev) => Math.max(prev - 0.1, 0.5)) // Minimum zoom: 0.5x
  }

  // Function to download file
  const downloadFile = async (url: string, filename: string) => {
    if (!url) return

    try {
      // Show some loading indication
      setIsLoading(true)

      // Fetch the file as a blob
      const response = await fetch(url)
      const blob = await response.blob()

      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob)

      // Create a temporary link element
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = filename // This is critical for downloading instead of opening
      link.style.display = "none"

      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
        setIsLoading(false)
      }, 100)
    } catch (error) {
      console.error("Error downloading file:", error)
      setIsLoading(false)

      // Alert the user about the error
      alert("حدث خطأ أثناء تنزيل الملف. يرجى المحاولة مرة أخرى.")
    }
  }

  // Function to create a Google Docs viewer URL
  const getGoogleDocsViewerUrl = (url: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
  }

  // Reset loading state when component mounts or URL changes
  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      document.body.style.overflow = "hidden"
      // Set loading to false after a short delay
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      document.body.style.overflow = ""
    }
  }, [isOpen, url])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-white" onClick={onClose} />

      <div
        className="fixed inset-0 top-0 z-[101] m-0 flex flex-col overflow-hidden bg-white p-0 shadow-xl"
        key="pdf-viewer-container"
        style={{ marginTop: 0 }}
      >
        <div
          className="border-muted/20 flex items-center justify-between border-b bg-neutral-200 p-4 pt-2"
          style={{ marginTop: 0 }}
        >
          <h3 className="text-xl font-semibold">{title}</h3>

          <div className="flex items-center gap-4">
            {/* Simple download button - icon only */}
            {url && (
              <button
                onClick={() => url && downloadFile(url, fileName)}
                className="hover:bg-muted/10 text-foreground rounded-full p-1"
                title="تحميل المستند"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={zoomOut}
                className="hover:bg-muted/10 rounded-full p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 12h-15"
                  />
                </svg>
              </button>

              <span className="text-sm">{Math.round(pdfScale * 100)}%</span>

              <button
                onClick={zoomIn}
                className="hover:bg-muted/10 rounded-full p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </button>
            </div>

            <button
              onClick={onClose}
              className="hover:bg-muted/10 rounded-full p-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white">
          <div className="h-full w-full overflow-hidden bg-white">
            <div
              style={{
                transform: `scale(${pdfScale})`,
                transformOrigin: "center",
                width: "100%",
                height: "100%",
              }}
            >
              {url ? (
                <div className="relative flex h-full w-full items-center justify-center">
                  {isLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white">
                      <div className="border-primary mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></div>
                      <p className="text-muted-foreground text-sm">
                        جاري تحميل المستند...
                      </p>
                    </div>
                  )}

                  <div className="h-full w-full">
                    <div
                      className="relative h-full w-full overflow-hidden bg-white"
                      style={{ backgroundColor: "white" }}
                    >
                      {/* Overlay to block PDF header interactions */}
                      <div className="absolute top-0 right-0 left-0 z-10 h-[36px] bg-transparent" />

                      <object
                        data={
                          url ? `${url}#toolbar=0&navpanes=0&scrollbar=0` : ""
                        }
                        type="application/pdf"
                        className="h-full w-full"
                        style={{
                          /* Hide PDF viewer's native header */
                          marginTop: "-36px",
                          height: "calc(100% + 36px)",
                          border: "none",
                          overflow: "hidden",
                          backgroundColor: "white",
                        }}
                      >
                        <div className="flex max-w-md flex-col items-center justify-center p-6 text-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="mb-4 h-16 w-16 text-orange-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                            />
                          </svg>

                          <h3 className="mb-3 text-xl font-medium">
                            تعذر عرض المستند مباشرة
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            متصفحك لا يدعم عرض ملفات PDF داخل الصفحة
                          </p>

                          <div className="mb-6 w-full space-y-3">
                            <div className="flex flex-col justify-center gap-2 sm:flex-row">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm text-white transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="h-4 w-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                                  />
                                </svg>
                                فتح المستند في نافذة جديدة
                              </a>
                            </div>
                          </div>
                        </div>
                      </object>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">لا يوجد مستند متاح</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PDFViewer
