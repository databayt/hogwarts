/**
 * AI Generation Prompts for Question Bank Automation
 *
 * Structured prompts for generating high-quality educational questions
 * using Claude AI, tailored for different exam types and question formats.
 */

export interface GenerationPromptParams {
  context: string
  questionType: string
  difficulty: string
  bloomLevel: string
  examType: string
  subject?: string
}

/**
 * MRCP Part 1 Generation Prompts
 * Based on research from PassMedicine, Pastest, and BMJ OnExamination
 */
export const MRCP_PART_1_PROMPTS = {
  MULTIPLE_CHOICE: (
    params: GenerationPromptParams
  ) => `You are an expert medical educator creating MRCP Part 1 examination questions.

**Context (Source Material):**
${params.context}

**Task:** Generate 1 high-quality multiple-choice question (best-of-five format) following these requirements:

**1. QUESTION STEM:**
- Clinical scenario-based (NOT simple factual recall)
- 50-100 words in length
- Include relevant patient details (age, gender, presenting symptoms, examination findings, investigation results)
- Clear and unambiguous wording
- Follows MRCP Part 1 style (scenario → question)
- Subject: ${params.subject || "Medical Sciences"}

**2. OPTIONS (5 options total):**
- Exactly 1 clearly correct answer based on current medical guidelines
- 4 plausible distractors that represent:
  * Common misconceptions
  * Similar conditions with different management
  * Partially correct but not best answers
  * Red herrings based on superficial similarity
- All options should be of similar length (within 20%)
- Avoid "all of the above" or "none of the above"
- Use consistent grammatical structure across all options

**3. DIFFICULTY: ${params.difficulty}**
- EASY: Straightforward application of core knowledge, common presentations
- MEDIUM: Requires synthesis of multiple concepts or atypical presentations
- HARD: Complex cases requiring advanced reasoning, rare conditions, or subtle distinctions

**4. BLOOM'S TAXONOMY: ${params.bloomLevel}**
- REMEMBER: Recall specific facts, definitions, guidelines
- UNDERSTAND: Explain mechanisms, interpret findings
- APPLY: Use knowledge in clinical scenarios
- ANALYZE: Differentiate between similar conditions
- EVALUATE: Justify management decisions, critique approaches
- CREATE: Formulate diagnostic or treatment plans

**5. EXPLANATION (150-200 words):**
- Explain WHY the correct answer is right (pathophysiology, guidelines, evidence)
- Explain WHY each distractor is wrong (briefly for each)
- Reference authoritative sources when possible (NICE guidelines, medical textbooks, landmark studies)
- Include teaching points that reinforce learning

**6. METADATA:**
- Tags: Include relevant specialty, condition, investigation, treatment
- Estimated time: 90-120 seconds
- Points: 1 (standard for MRCP Part 1)

**QUALITY STANDARDS:**
- Clinically accurate and up-to-date with current guidelines
- No ambiguity in correct answer
- No clues that reveal the answer (e.g., option length, grammar inconsistencies)
- Appropriate for UK medical practice
- Free from cultural or gender bias

**OUTPUT FORMAT (JSON):**
\`\`\`json
{
  "questionText": "A 45-year-old man presents with...",
  "options": [
    {"text": "Option A", "isCorrect": false, "explanation": "Brief why wrong"},
    {"text": "Option B", "isCorrect": true, "explanation": "Why correct"},
    {"text": "Option C", "isCorrect": false, "explanation": "Brief why wrong"},
    {"text": "Option D", "isCorrect": false, "explanation": "Brief why wrong"},
    {"text": "Option E", "isCorrect": false, "explanation": "Brief why wrong"}
  ],
  "explanation": "Detailed explanation of the correct answer and teaching points...",
  "difficulty": "${params.difficulty}",
  "bloomLevel": "${params.bloomLevel}",
  "tags": ["cardiology", "heart-failure", "investigation"],
  "subject": "${params.subject || "Medical Sciences"}",
  "points": 1,
  "timeEstimate": 2
}
\`\`\`

Generate the question now.`,

  TRUE_FALSE: (
    params: GenerationPromptParams
  ) => `You are an expert medical educator creating MRCP Part 1 true/false questions.

**Context (Source Material):**
${params.context}

**Task:** Generate 1 high-quality true/false question following these requirements:

**1. STATEMENT:**
- Clear, specific medical statement
- 20-50 words
- Tests understanding of a specific concept, guideline, or fact
- Subject: ${params.subject || "Medical Sciences"}

**2. ANSWER:**
- Definitively true OR definitively false
- No ambiguity or edge cases
- Based on current medical evidence/guidelines

**3. DIFFICULTY: ${params.difficulty}**
- EASY: Common, well-established facts
- MEDIUM: Requires careful reading or synthesis
- HARD: Subtle distinctions or less common knowledge

**4. EXPLANATION (100-150 words):**
- Explain why the statement is true/false
- Provide context and teaching points
- Reference guidelines/evidence where relevant

**OUTPUT FORMAT (JSON):**
\`\`\`json
{
  "questionText": "In heart failure with reduced ejection fraction, ACE inhibitors reduce mortality.",
  "options": [
    {"text": "True", "isCorrect": true},
    {"text": "False", "isCorrect": false}
  ],
  "explanation": "Detailed explanation...",
  "difficulty": "${params.difficulty}",
  "bloomLevel": "${params.bloomLevel}",
  "tags": ["cardiology", "pharmacology"],
  "subject": "${params.subject || "Medical Sciences"}",
  "points": 1,
  "timeEstimate": 1
}
\`\`\`

Generate the question now.`,

  SHORT_ANSWER: (
    params: GenerationPromptParams
  ) => `You are an expert medical educator creating MRCP Part 1 short answer questions.

**Context (Source Material):**
${params.context}

**Task:** Generate 1 high-quality short answer question following these requirements:

**1. QUESTION:**
- Clinical scenario or direct question
- Requires 1-2 sentence answer
- 30-80 words
- Subject: ${params.subject || "Medical Sciences"}

**2. SAMPLE ANSWER:**
- Model answer (20-50 words)
- Clear and concise
- Includes key points expected

**3. GRADING RUBRIC:**
- List 3-5 key points to award marks
- Specify point allocation
- Define acceptable variations

**4. DIFFICULTY: ${params.difficulty}**

**OUTPUT FORMAT (JSON):**
\`\`\`json
{
  "questionText": "A patient presents with... What is the most likely diagnosis?",
  "sampleAnswer": "The most likely diagnosis is...",
  "gradingRubric": "Award 1 point each for: 1) Correct diagnosis (2 points), 2) Mention of key feature (1 point), 3) Differential considered (1 point). Total: 4 points.",
  "explanation": "Teaching points...",
  "difficulty": "${params.difficulty}",
  "bloomLevel": "${params.bloomLevel}",
  "tags": ["diagnosis", "clinical-reasoning"],
  "subject": "${params.subject || "Medical Sciences"}",
  "points": 4,
  "timeEstimate": 3
}
\`\`\`

Generate the question now.`,
}

/**
 * Generic prompt template generator
 * Can be extended for other exam types (USMLE, SAT, etc.)
 */
export function getGenerationPrompt(params: GenerationPromptParams): string {
  const { examType, questionType } = params

  // MRCP Part 1
  if (examType === "MRCP_PART_1") {
    const prompts = MRCP_PART_1_PROMPTS as any
    if (prompts[questionType]) {
      return prompts[questionType](params)
    }
  }

  // Fallback to generic prompt
  return generateGenericPrompt(params)
}

/**
 * Generic prompt for other exam types
 */
function generateGenericPrompt(params: GenerationPromptParams): string {
  return `Create a ${params.questionType} question for ${params.examType} exam.

Context: ${params.context}

Difficulty: ${params.difficulty}
Bloom's Level: ${params.bloomLevel}
Subject: ${params.subject}

Generate a high-quality educational question with appropriate difficulty and explanation.

Return as JSON with fields: questionText, options (if applicable), explanation, difficulty, bloomLevel, tags, subject, points, timeEstimate.`
}

/**
 * Validation prompt - used to fact-check generated questions
 */
export function getValidationPrompt(question: any): string {
  return `You are a medical fact-checker. Review this MRCP Part 1 question for accuracy.

**Question:**
${question.questionText}

**Options:**
${question.options?.map((o: any, i: number) => `${i + 1}. ${o.text} ${o.isCorrect ? "(CORRECT)" : ""}`).join("\n")}

**Explanation:**
${question.explanation}

**Task:** Validate the medical accuracy of this question. Check for:
1. Is the correct answer actually correct based on current medical guidelines?
2. Are the distractors actually incorrect?
3. Are there any factual errors in the explanation?
4. Is the clinical scenario realistic and appropriate?
5. Are there any ambiguities that could confuse students?

Respond in this format:
{
  "accurate": true/false,
  "issues": ["Issue 1 description", "Issue 2 description"],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "confidence": 0-100 (percentage confidence in assessment)
}

If accurate is true and there are no issues, return empty arrays for issues and suggestions.`
}
