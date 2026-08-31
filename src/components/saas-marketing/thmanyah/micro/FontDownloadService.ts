"use client"

import JSZip from "jszip"

export interface DownloadFontOptions {
  email: string
  agreedToTerms: boolean
}

export async function downloadFontPackage(
  options: DownloadFontOptions
): Promise<boolean> {
  try {
    const zip = new JSZip()

    // Create folder structure in ZIP
    const webFontsFolder = zip.folder("WebFonts")
    const docsFolder = zip.folder("Documentation")

    // Add font files list
    const fontFiles = [
      "thmanyah-sans-light.woff2",
      "thmanyah-sans-regular.woff2",
      "thmanyah-sans-medium.woff2",
      "thmanyah-sans-bold.woff2",
      "thmanyah-sans-black.woff2",
      "thmanyah-serif-display-light.woff2",
      "thmanyah-serif-display-regular.woff2",
      "thmanyah-serif-display-medium.woff2",
      "thmanyah-serif-display-bold.woff2",
      "thmanyah-serif-display-black.woff2",
      "thmanyah-serif-text-light.woff2",
      "thmanyah-serif-text-regular.woff2",
      "thmanyah-serif-text-medium.woff2",
      "thmanyah-serif-text-bold.woff2",
      "thmanyah-serif-text-black.woff2",
    ]

    // Fetch and add fonts to zip
    const fontPromises = fontFiles.map(async (filename) => {
      try {
        const res = await fetch(`/fonts/${filename}`)
        if (res.ok) {
          const blob = await res.blob()
          webFontsFolder?.file(filename, blob)
        }
      } catch (err) {
        console.warn(`Could not fetch font ${filename} for zip:`, err)
      }
    })

    await Promise.all(fontPromises)

    // Add LICENSE & README
    const readmeContent = `
# خط ثمانية - Thmanyah Font Family
خط عربيٌّ رقمي، مرسومٌ وكأنكَ تكتبُ بيدك.

عائلة خطوط ثمانية تتضمن 3 عائلات خطية بـ 5 أوزان لكل منها:
1. خط ثمانية للعناوين (thmanyah Serif Display) - 5 أوزان (Light, Regular, Medium, Bold, Black)
2. خط ثمانية للنصوص (thmanyah Serif Text) - 5 أوزان (Light, Regular, Medium, Bold, Black)
3. خط ثمانية الرقمي (thmanyah Sans) - 5 أوزان (Light, Regular, Medium, Bold, Black)

## كيفية الاستخدام:
- ماك: افتح ملف الخط ثم اضغط «تثبيت الخط» في تطبيق «دفتر الخطوط».
- ويندوز: اضغط بزر الفأرة الأيمن على ملف الخط ثم اختر «تثبيت».
- الويب: قم بتضمين ملفات woff2 عبر @font-face في ملف CSS.

## الترخيص:
الخط متاح مجانًا للاستخدام الشخصي والتجاري وفق سياسة الترخيص المرفقة.
جميع الحقوق محفوظة لشركة ثمانية للنشر والتوزيع © 2026
https://font.thmanyah.com
`

    const licenseContent = `
THMANYAH FONT LICENSE AGREEMENT
===============================
This font software is licensed by Thmanyah Publishing and Distribution.
Free for personal and commercial projects.
Redistribution, reverse engineering, or resale without authorization is prohibited.
For full terms, visit: https://font.thmanyah.com/licenses
`

    docsFolder?.file("README.txt", readmeContent.trim())
    docsFolder?.file("LICENSE.txt", licenseContent.trim())

    // Generate zip blob and trigger download
    const zipBlob = await zip.generateAsync({ type: "blob" })
    const downloadUrl = URL.createObjectURL(zipBlob)
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = "Thmanyah-Font-Package.zip"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)

    return true
  } catch (error) {
    console.error("Error generating font zip:", error)
    return false
  }
}
