# 🤖 QBank Automation System

## Overview

An **AI-powered question generation system** that automatically creates high-quality educational questions from source materials using Claude AI. Built for `community.databayt.org` to serve as a centralized question bank for multiple educational communities.

### Key Features

- ✅ **AI Question Generation** - Claude 3.5 Sonnet creates context-aware questions
- ✅ **PDF Processing** - Upload textbooks, study guides, and extract content
- ✅ **Semantic Chunking** - Intelligent text splitting with context preservation
- ✅ **Quality Validation** - Automated scoring system (0-100) with multi-factor checks
- ✅ **Scheduled Jobs** - Batch generation via Vercel cron jobs
- ✅ **Multi-Exam Support** - MRCP Part 1 (demo), extensible to USMLE, SAT, etc.
- ✅ **Review Workflow** - Manual review queue for quality assurance

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Source Materials                        │
│  PDFs → Parse → Chunk → Embed → Vector Database        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              AI Generation Engine                        │
│  Context Retrieval → Claude API → Quality Check        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Question Bank Database                      │
│  QuestionBank (with AI metadata) → Existing Exam System │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema

### New Models (in `prisma/models/qbank.prisma`)

1. **SourceMaterial** - Uploaded PDFs, textbooks, curricula
2. **SourceChunk** - Chunked content with embeddings for semantic search
3. **GenerationJob** - Batch generation job tracking
4. **QuestionReview** - Manual review queue for AI-generated questions

### Extended Models

- **QuestionBank** - Added AI generation fields:
  - `generationJobId` - Links to generation job
  - `sourceId` - Links to source material
  - `aiModel` - AI model used (claude-3-5-sonnet-20241022)
  - `validationScore` - Quality score (0-100)
  - `generatedAt` - Generation timestamp

---

## Engine Components

### 1. Generation Prompts (`engine/prompts.ts`)

Specialized prompts for different question types and exam formats:

- **MRCP Part 1**:
  - Multiple Choice (best-of-five format)
  - True/False
  - Short Answer
- **Extensible** to other exam types (USMLE, SAT, GRE, etc.)

**Features**:

- Clinical scenario-based questions
- Bloom's Taxonomy alignment
- Difficulty calibration
- Detailed explanations with teaching points

### 2. Question Generator (`engine/question-generator.ts`)

Claude AI integration for question generation:

```typescript
import { generateQuestion } from "./engine/question-generator"

const question = await generateQuestion({
  context: "...medical textbook excerpt...",
  questionType: "MULTIPLE_CHOICE",
  difficulty: "MEDIUM",
  bloomLevel: "APPLY",
  examType: "MRCP_PART_1",
  subject: "Cardiology",
})
```

**Features**:

- Batch generation support
- Rate limiting (500ms between requests)
- Cost estimation
- Error handling with retries

### 3. PDF Parser (`engine/pdf-parser.ts`)

Intelligent PDF processing:

```typescript
import { parsePDFAndChunk } from "./engine/pdf-parser"

const { parseResult, chunks } = await parsePDFAndChunk(buffer, {
  chunkSize: 1500, // ~375 words
  chunkOverlap: 300, // ~75 words for context
})
```

**Features**:

- Text extraction with metadata
- Semantic chunking (preserves paragraphs, sentences)
- Section title extraction
- PDF artifact cleaning

### 4. Quality Validator (`engine/quality-validator.ts`)

Automated quality scoring:

```typescript
import { validateQuestion } from "./engine/quality-validator"

const result = await validateQuestion(generatedQuestion)
// {
//   score: 85,
//   passed: true,
//   checks: [...],
//   issues: [],
//   suggestions: ['Add more tags']
// }
```

**Validation Checks**:

- ✅ Question text (length, clarity)
- ✅ Options (correctness, balance, duplicates)
- ✅ Explanation (depth, teaching language)
- ✅ Tags (quantity, quality)
- ✅ Grammar (capitalization, spacing, punctuation)
- ✅ Duplicate detection (semantic similarity)

**Scoring Weights**:

- Question Text: 25%
- Options: 25%
- Explanation: 20%
- Grammar: 15%
- Tags: 10%
- Option Balance: 5%

### 5. Embedding Service (`engine/embedding-service.ts`)

Semantic search with vector embeddings:

```typescript
import {
  findRelevantChunks,
  generateEmbedding,
} from "./engine/embedding-service"

// Generate embedding for text
const embedding = await generateEmbedding("heart failure pathophysiology")

// Find relevant source chunks
const chunks = await findRelevantChunks({
  query: "What are the symptoms of heart failure?",
  subject: "Cardiology",
  examType: "MRCP_PART_1",
  limit: 3,
  similarityThreshold: 0.7,
})
```

**Features**:

- OpenAI text-embedding-3-small (1536 dimensions, $0.02/1M tokens)
- Cosine similarity calculation
- Batch embedding generation
- Cost estimation

**Note**: Requires PostgreSQL pgvector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Installation & Setup

### 1. Environment Variables

Add to `.env`:

```bash
# AI Services
ANTHROPIC_API_KEY=sk-ant-...  # Claude AI (required)
OPENAI_API_KEY=sk-...          # OpenAI embeddings (required)

# Database
DATABASE_URL=postgresql://...  # Must support pgvector extension

# Cron Authentication
CRON_SECRET=your-random-secret # For Vercel cron jobs
```

### 2. Install Dependencies

```bash
pnpm install @anthropic-ai/sdk
pnpm install @langchain/openai @langchain/textsplitters
pnpm install pdf-parse
```

### 3. Database Migration

```bash
pnpm prisma generate
pnpm prisma migrate dev --name add-qbank-automation
```

### 4. Enable pgvector Extension

Connect to your PostgreSQL database and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 5. Create Community School

Run the seed script (to be created) to set up `community.databayt.org` school account.

---

## Usage Examples

### Example 1: Upload PDF and Generate Questions

```typescript
// 1. Upload PDF source material
const formData = new FormData()
formData.append("file", pdfFile)
formData.append("title", "Basic Medical Sciences for MRCP Part 1")
formData.append("subject", "Medical Sciences")
formData.append("examType", "MRCP_PART_1")
formData.append(
  "attribution",
  "Author: Philippa Easterbrook, Publisher: Oxford University Press"
)

await uploadSourceMaterial(formData)

// 2. Create generation job
const job = await createGenerationJob({
  targetCount: 50,
  examType: "MRCP_PART_1",
  subjects: ["Cardiology", "Respiratory", "Gastroenterology"],
  distribution: {
    MULTIPLE_CHOICE: { EASY: 15, MEDIUM: 20, HARD: 10 },
    TRUE_FALSE: { EASY: 5 },
  },
})

// 3. Execute job (runs automatically via cron or manual trigger)
await executeGenerationJob(job.id)
```

### Example 2: Manual Question Generation

```typescript
import { validateQuestion } from "./engine/quality-validator"
import { generateQuestion } from "./engine/question-generator"

// Generate a single question
const question = await generateQuestion({
  context: `
    Heart failure is a clinical syndrome characterized by...
    Common symptoms include dyspnea, fatigue, and peripheral edema...
  `,
  questionType: "MULTIPLE_CHOICE",
  difficulty: "MEDIUM",
  bloomLevel: "APPLY",
  examType: "MRCP_PART_1",
  subject: "Cardiology",
})

// Validate quality
const validation = await validateQuestion(question)

if (validation.passed) {
  // Save to database
  await db.questionBank.create({
    data: {
      schoolId: communitySchoolId,
      questionText: question.questionText,
      questionType: question.questionType,
      // ... other fields
      aiModel: question.aiModel,
      validationScore: validation.score,
    },
  })
}
```

### Example 3: Scheduled Daily Generation

```typescript
// app/api/cron/generate-questions/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = headers().get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // Trigger daily generation
  await createAndExecuteGenerationJob({
    targetCount: 100, // Generate 100 questions daily
    examType: "MRCP_PART_1",
    subjects: ["Cardiology", "Respiratory", "Gastroenterology", "Nephrology"],
    distribution: {
      MULTIPLE_CHOICE: { EASY: 30, MEDIUM: 40, HARD: 20 },
      TRUE_FALSE: { EASY: 10 },
    },
  })

  return NextResponse.json({ success: true })
}
```

**Vercel Cron Configuration** (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-questions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## Cost Estimation

### Question Generation

**Claude 3.5 Sonnet Pricing**:

- Input: $3/MTok
- Output: $15/MTok

**Per Question** (estimate):

- Input: ~2,000 tokens (context + prompt)
- Output: ~800 tokens (question + explanation)
- Cost: **~$0.018 per question**

**1,000 Questions**:

- Total Cost: ~$18
- Daily (100 questions): ~$1.80/day = ~$54/month

### Embeddings

**OpenAI text-embedding-3-small Pricing**:

- $0.02/1M tokens

**Per Source Material** (300-page textbook):

- ~75,000 words = ~100,000 tokens
- Chunks: ~100 chunks × 500 tokens = 50,000 tokens
- Cost: **~$0.001 per textbook**

### Total Monthly Cost (1,000 questions/month + 10 textbooks)

- Question Generation: ~$54
- Embeddings: ~$0.01
- **Total: ~$54/month**

_Cost-effective for high-quality automated content generation!_

---

## Quality Metrics

### Target Benchmarks

- ✅ **Validation Score**: ≥ 70/100 (auto-approve)
- ✅ **Success Rate**: 95%+ questions pass validation
- ✅ **Duplicate Rate**: < 5%
- ✅ **Manual Review**: 100% of questions with score < 70

### Quality Assurance Workflow

1. **Auto-Generation** → Claude creates question
2. **Auto-Validation** → Quality validator scores (0-100)
3. **Decision**:
   - Score ≥ 70: Auto-approve and publish
   - Score < 70: Send to manual review queue
4. **Manual Review** → Expert reviewer approves/rejects
5. **Feedback Loop** → Use review data to improve prompts

---

## Next Steps

### Phase 1: Core Implementation ✅ (Complete)

- [x] Database schema
- [x] AI generation engine
- [x] PDF parsing pipeline
- [x] Quality validation system
- [x] Embedding service

### Phase 2: UI & Workflows (Next)

- [ ] Source material upload UI
- [ ] Generation job dashboard
- [ ] Review queue interface
- [ ] Analytics dashboard

### Phase 3: Integration (Next)

- [ ] Vercel cron job setup
- [ ] Community school seed data
- [ ] Integration with existing QBank UI
- [ ] API endpoints for external access

### Phase 4: Optimization (Future)

- [ ] Implement pgvector semantic search
- [ ] Add GPT-4 cross-validation
- [ ] Duplicate detection with embeddings
- [ ] A/B testing different prompts
- [ ] Performance monitoring

---

## Architecture Decisions

### Why Claude 3.5 Sonnet?

- ✅ Superior medical knowledge and reasoning
- ✅ Excellent instruction following
- ✅ Cost-effective ($3/$15 per MTok vs GPT-4 Turbo $10/$30)
- ✅ 200K context window (fits large textbook chunks)
- ✅ Better at structured output (JSON)

### Why OpenAI Embeddings?

- ✅ Industry-standard quality
- ✅ Very cost-effective ($0.02/1M tokens)
- ✅ 1536 dimensions (good balance)
- ✅ Easy integration with LangChain

### Why PostgreSQL + pgvector?

- ✅ Already using PostgreSQL (Neon)
- ✅ pgvector is mature and performant
- ✅ No separate vector database needed
- ✅ ACID transactions for data integrity

---

## Troubleshooting

### Error: "Anthropic API Key not found"

**Solution**: Add `ANTHROPIC_API_KEY` to `.env`

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### Error: "pgvector extension not found"

**Solution**: Install pgvector in your PostgreSQL database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

For Neon (managed PostgreSQL):

```sql
-- pgvector is pre-installed, just enable it
CREATE EXTENSION IF NOT EXISTS vector;
```

### Error: "Rate limit exceeded"

**Solution**: Reduce batch size or increase delay between requests

```typescript
// In question-generator.ts
const delay = 1000 // Increase from 500ms to 1000ms
```

### PDF Parsing Issues

**Solution**: Ensure PDF is text-based (not scanned images). For scanned PDFs, use OCR (Tesseract) preprocessing.

---

## Contributing

### Adding New Exam Types

1. Create prompts in `engine/prompts.ts`:

```typescript
export const USMLE_STEP_1_PROMPTS = {
  MULTIPLE_CHOICE: (params) => `...`,
  // ...
}
```

2. Update `getGenerationPrompt()` to handle new exam type

3. Test generation with sample context

4. Add to seed data

### Improving Validation

Edit `engine/quality-validator.ts` to add new checks or adjust weights.

### Custom AI Models

Update `question-generator.ts` to support other models:

```typescript
const aiModel = "gpt-4-turbo-preview" // or custom model
```

---

## License

MIT License - Part of Hogwarts School Automation Platform

---

## Support

For issues or questions:

- GitHub Issues: [hogwarts/issues](https://github.com/your-repo/hogwarts/issues)
- Documentation: [Full docs](https://ed.databayt.org/docs/qbank-automation)
- Community: `community.databayt.org`

---

**Built with** ❤️ **using Claude AI**
