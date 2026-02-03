import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hogwarts School Management",
    short_name: "Hogwarts",
    description:
      "A comprehensive school automation school-dashboard that manages students, faculty, and academic processes with an intuitive interface. Features QR code attendance and geofence tracking.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["education", "productivity", "business"],
    lang: "en",
    dir: "auto",
    prefer_related_applications: false,
    shortcuts: [
      {
        name: "Mark Attendance",
        short_name: "Attendance",
        description: "Open attendance marking page",
        url: "/attendance",
        icons: [{ src: "/icon-attendance.png", sizes: "96x96" }],
      },
      {
        name: "Scan QR Code",
        short_name: "QR Scan",
        description: "Scan QR code for attendance",
        url: "/attendance/qr-code",
        icons: [{ src: "/icon-qr.png", sizes: "96x96" }],
      },
    ],
  }
}
