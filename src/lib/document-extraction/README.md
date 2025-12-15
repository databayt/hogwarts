# Document Extraction Service

AI-powered document extraction for onboarding auto-fill using Claude Vision API.

## Overview

This service extracts structured data from uploaded documents (images, PDFs, Word, Excel, CSV) and maps them to onboarding form fields using Claude 3.5 Sonnet.

## Features

- **Multi-format Support**: Images (JPG, PNG, WebP), PDF, Word (DOC/DOCX), Excel (XLS/XLSX), CSV
- **AI-Powered Extraction**: Uses Claude Vision API for intelligent data extraction
- **Step-Specific Schemas**: Tailored extraction schemas for each onboarding step
- **Confidence Scoring**: Provides confidence levels for extracted fields
- **Type Safety**: Full TypeScript support with Zod validation
- **Error Handling**: Comprehensive error handling and logging

## Architecture

```
src/lib/document-extraction/
├── index.ts              # Main service entry point
├── types.ts              # TypeScript type definitions
├── schemas.ts            # Zod schemas for each step
├── prompts.ts            # AI prompts for each step
├── claude-extractor.ts   # Claude Vision API integration
├── file-handlers.ts      # File parsing utilities
└── README.md            # This file
```

## Supported Onboarding Steps

| Step          | Extracted Data                              |
| ------------- | ------------------------------------------- |
| `title`       | School name, subdomain, tagline             |
| `description` | Mission, vision, values, description        |
| `location`    | Country, state, city, address, contact info |
| `capacity`    | Student/teacher/class counts, facilities    |
| `price`       | Currency, tuition, registration, other fees |
| `branding`    | Colors, design guidelines                   |
| `import`      | Bulk data (students, teachers, classes)     |
| `legal`       | Terms, privacy policy, licenses             |

## Usage

### Client-Side (React Component)

```typescript
import { useState } from 'react'

export function DocumentUpload() {
  const [loading, setLoading] = useState(false)

  async function handleUpload(file: File, stepId: string) {
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('stepId', stepId)

    try {
      const response = await fetch('/api/onboarding/extract', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Auto-fill form with extracted data
        result.data.fields.forEach(field => {
          setValue(field.key, field.value)
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    // Your upload UI
  )
}
```

### Server-Side (Direct Usage)

```typescript
import { extractFromDocument } from "@/lib/document-extraction"

const result = await extractFromDocument(file, "location", {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/jpeg", "application/pdf"],
})

if (result.success) {
  console.log("Extracted fields:", result.data.fields)
  console.log("Confidence:", result.data.confidence)
}
```

### API Route

```
POST /api/onboarding/extract
Content-Type: multipart/form-data

Fields:
  - file: File (required)
  - stepId: string (required)

Response:
{
  "success": true,
  "data": {
    "fields": [
      {
        "key": "schoolName",
        "value": "Example High School",
        "confidence": "high",
        "source": "pdf"
      }
    ],
    "confidence": 0.95,
    "documentType": "pdf"
  },
  "processingTime": 1234
}
```

## File Type Handling

### Images (JPG, PNG, WebP)

- Direct upload to Claude Vision API
- Best for scanned documents, brochures, flyers

### PDF

- Text extraction using `pdf-parse`
- First page converted to image for Vision API
- Best for forms, official documents

### Word (DOC/DOCX)

- Text extraction using `mammoth`
- Structured data extraction from formatted text
- Best for mission statements, descriptions

### Excel (XLS/XLSX)

- Sheet parsing using `xlsx`
- Converts to readable text format
- Best for capacity data, fee schedules

### CSV

- Parsing using `papaparse`
- Converts to structured text
- Best for bulk import data

## Confidence Levels

| Level    | Score | Criteria                                 |
| -------- | ----- | ---------------------------------------- |
| `high`   | 1.0   | Value found in raw text, structured data |
| `medium` | 0.6   | Derived from context, long text          |
| `low`    | 0.3   | Low certainty, missing context           |

## Validation

All extracted data is validated using Zod schemas:

```typescript
// Example: Location extraction schema
export const locationExtractionSchema = z.object({
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
})
```

## Error Handling

```typescript
const result = await extractFromDocument(file, stepId)

if (!result.success) {
  console.error("Extraction failed:", result.error)
  // Handle error (show user message, retry, etc.)
}
```

## Rate Limiting

The API route is protected by authentication. Consider implementing rate limiting for production:

```typescript
import { Ratelimit } from "@upstash/ratelimit"

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 requests per hour
})
```

## Performance

- **Average processing time**: 2-5 seconds
- **Max file size**: 10MB (configurable)
- **Concurrent requests**: Limited by Anthropic API quota

## Cost Estimation

Using Claude 3.5 Sonnet:

- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

Typical extraction:

- Input tokens: ~500-1000 (image + prompt)
- Output tokens: ~100-200 (structured data)
- Cost per extraction: ~$0.005-0.01

## Environment Variables

Required:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Optional:

```bash
NEXT_PUBLIC_MAX_UPLOAD_SIZE=10485760  # 10MB
```

## Dependencies

```json
{
  "dependencies": {
    "@ai-sdk/anthropic": "^2.0.37",
    "ai": "^5.0.80",
    "mammoth": "^1.11.0",
    "papaparse": "^5.5.3",
    "pdf-parse": "^2.4.5",
    "xlsx": "^0.18.5",
    "zod": "^4.0.14"
  },
  "devDependencies": {
    "@types/papaparse": "^5.5.2"
  }
}
```

## Testing

```typescript
// Example test
describe("Document Extraction", () => {
  it("should extract school name from PDF", async () => {
    const file = new File([pdfBuffer], "school.pdf", {
      type: "application/pdf",
    })

    const result = await extractFromDocument(file, "title")

    expect(result.success).toBe(true)
    expect(result.data?.fields).toContainEqual({
      key: "schoolName",
      value: expect.any(String),
      confidence: "high",
    })
  })
})
```

## Security

- ✅ Authentication required (session check)
- ✅ File validation (type, size)
- ✅ Input sanitization (Zod schemas)
- ✅ Error logging (without sensitive data)
- ⚠️ Rate limiting (recommended for production)

## Future Enhancements

- [ ] Multi-language support
- [ ] Batch extraction (multiple files)
- [ ] Custom extraction schemas
- [ ] Extraction history/cache
- [ ] Fallback to alternative AI models
- [ ] Real-time progress updates (WebSocket)

## References

- [Anthropic Claude API](https://docs.anthropic.com/claude/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Pattern: Receipt Extraction](/src/components/platform/finance/receipt/ai/extract-receipt-data.ts)
- [Pattern: Import Parser](/src/lib/import-parser.ts)

## Support

For issues or questions, refer to:

- [CLAUDE.md](/CLAUDE.md) - Project documentation
- [Onboarding Implementation](</src/app/[lang]/s/[subdomain]/(onboarding)>)
