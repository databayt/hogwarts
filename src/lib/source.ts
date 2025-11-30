import { docs, docsArabic } from "@/.source"
import { loader } from "fumadocs-core/source"

export const docsSource = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
})

export const docsArabicSource = loader({
  baseUrl: "/docs",
  source: docsArabic.toFumadocsSource(),
})

// Legacy export for backwards compatibility
export const source = docsSource
