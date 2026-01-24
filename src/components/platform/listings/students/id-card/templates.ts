import type { IDCardTemplate } from "./types"

export const idCardTemplates: IDCardTemplate[] = [
  {
    id: "modern",
    name: "Modern",
    orientation: "portrait",
    size: {
      width: 85.6,
      height: 54,
      unit: "mm",
    },
    design: "modern",
    includeBarcode: true,
    includeQRCode: false,
    primaryColor: "#1e40af",
    secondaryColor: "#3b82f6",
    fontFamily: "Inter",
  },
  {
    id: "classic",
    name: "Classic",
    orientation: "portrait",
    size: {
      width: 85.6,
      height: 54,
      unit: "mm",
    },
    design: "classic",
    includeBarcode: true,
    includeQRCode: false,
    primaryColor: "#0f172a",
    secondaryColor: "#475569",
    fontFamily: "Georgia",
  },
  {
    id: "minimal",
    name: "Minimal",
    orientation: "landscape",
    size: {
      width: 85.6,
      height: 54,
      unit: "mm",
    },
    design: "minimal",
    includeBarcode: false,
    includeQRCode: true,
    primaryColor: "#000000",
    secondaryColor: "#6b7280",
    fontFamily: "Helvetica",
  },
  {
    id: "colorful",
    name: "Colorful",
    orientation: "portrait",
    size: {
      width: 85.6,
      height: 54,
      unit: "mm",
    },
    design: "colorful",
    includeBarcode: true,
    includeQRCode: true,
    primaryColor: "#7c3aed",
    secondaryColor: "#a855f7",
    fontFamily: "Comic Sans MS",
  },
]

export const defaultTemplate = idCardTemplates[0]
