/**
 * PDF Parsing Service
 *
 * Handles PDF upload, text extraction, and content chunking
 * for AI-powered question generation.
 */

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { PDFParse } from "pdf-parse"

export interface PDFParseResult {
  text: string
  pages: number
  metadata: {
    title?: string
    author?: string
    subject?: string
    creator?: string
    producer?: string
    creationDate?: Date
    modDate?: Date
  }
}

export interface ContentChunk {
  content: string
  pageNumber?: number
  sectionTitle?: string
  chunkIndex: number
  tokenCount: number
}

/**
 * Parse PDF from buffer
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  try {
    // Use new pdf-parse v2.x API
    const parser = new PDFParse({ data: buffer })
    const textResult = await parser.getText()
    const infoResult = await parser.getInfo()
    await parser.destroy()

    return {
      text: textResult.text,
      pages: textResult.pages.length,
      metadata: {
        title: infoResult.info?.title,
        author: infoResult.info?.author,
        subject: infoResult.info?.subject,
        creator: infoResult.info?.creator,
        producer: infoResult.info?.producer,
        creationDate: infoResult.info?.creationDate
          ? new Date(infoResult.info.creationDate)
          : undefined,
        modDate: infoResult.info?.modDate
          ? new Date(infoResult.info.modDate)
          : undefined,
      },
    }
  } catch (error) {
    console.error("Error parsing PDF:", error)
    throw new Error(
      `Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/**
 * Chunk text content for better semantic processing
 *
 * Uses RecursiveCharacterTextSplitter for intelligent chunking that:
 * - Preserves paragraph boundaries
 * - Maintains context with overlap
 * - Respects sentence boundaries
 */
export async function chunkContent(
  text: string,
  options: {
    chunkSize?: number
    chunkOverlap?: number
    separators?: string[]
  } = {}
): Promise<ContentChunk[]> {
  const {
    chunkSize = 1500, // ~375 words
    chunkOverlap = 300, // ~75 words overlap for context
    separators = ["\n\n", "\n", ". ", " ", ""],
  } = options

  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators,
    })

    const docs = await splitter.createDocuments([text])

    return docs.map((doc, index) => ({
      content: doc.pageContent,
      chunkIndex: index,
      tokenCount: estimateTokenCount(doc.pageContent),
      // Additional metadata could be extracted from PDF page structure
      pageNumber: undefined,
      sectionTitle: undefined,
    }))
  } catch (error) {
    console.error("Error chunking content:", error)
    throw new Error(
      `Failed to chunk content: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/**
 * Extract text from PDF and chunk it in one operation
 */
export async function parsePDFAndChunk(
  buffer: Buffer,
  chunkOptions?: Parameters<typeof chunkContent>[1]
): Promise<{
  parseResult: PDFParseResult
  chunks: ContentChunk[]
}> {
  const parseResult = await parsePDF(buffer)
  const chunks = await chunkContent(parseResult.text, chunkOptions)

  return {
    parseResult,
    chunks,
  }
}

/**
 * Estimate token count (rough approximation)
 * 1 token ≈ 4 characters for English text
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Clean extracted PDF text
 * Removes common PDF artifacts and normalizes whitespace
 */
export function cleanPDFText(text: string): string {
  return (
    text
      // Remove page numbers (common patterns)
      .replace(/^\s*\d+\s*$/gm, "")
      // Remove excessive whitespace
      .replace(/\n{3,}/g, "\n\n")
      // Remove leading/trailing whitespace per line
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      // Remove non-breaking spaces and other unicode weirdness
      .replace(/\u00A0/g, " ")
      .replace(/\uFEFF/g, "")
      // Normalize quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Final cleanup
      .trim()
  )
}

/**
 * Extract section titles from text (heuristic-based)
 * Useful for adding context to chunks
 */
export function extractSectionTitles(text: string): Array<{
  title: string
  startIndex: number
}> {
  const titles: Array<{ title: string; startIndex: number }> = []

  // Common patterns for section titles in academic PDFs:
  // - ALL CAPS lines
  // - Lines ending with numbers (e.g., "1. Introduction")
  // - Lines with specific keywords

  const lines = text.split("\n")
  let currentIndex = 0

  for (const line of lines) {
    const trimmed = line.trim()

    // Check if line is a section title
    const isAllCaps = /^[A-Z\s\d.:]+$/.test(trimmed) && trimmed.length > 3
    const isNumbered = /^\d+\.\s+[A-Z]/.test(trimmed)
    const isKeyword =
      /^(CHAPTER|SECTION|PART|INTRODUCTION|CONCLUSION|REFERENCES)/i.test(
        trimmed
      )

    if ((isAllCaps || isNumbered || isKeyword) && trimmed.length < 100) {
      titles.push({
        title: trimmed,
        startIndex: currentIndex,
      })
    }

    currentIndex += line.length + 1 // +1 for newline
  }

  return titles
}

/**
 * Associate chunks with section titles
 */
export function associateChunksWithSections(
  chunks: ContentChunk[],
  sections: Array<{ title: string; startIndex: number }>,
  fullText: string
): ContentChunk[] {
  return chunks.map((chunk) => {
    // Find the chunk's position in the full text
    const chunkPosition = fullText.indexOf(chunk.content.substring(0, 100))

    // Find the most recent section title before this chunk
    let sectionTitle: string | undefined

    for (let i = sections.length - 1; i >= 0; i--) {
      if (sections[i].startIndex <= chunkPosition) {
        sectionTitle = sections[i].title
        break
      }
    }

    return {
      ...chunk,
      sectionTitle,
    }
  })
}
