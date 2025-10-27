// AI Question Generation using OpenAI
// Support for multiple question types and Bloom's taxonomy

import OpenAI from "openai";
import type {
  QuestionType,
  DifficultyLevel,
  BloomLevel,
  AIGeneratedQuestion,
  AIGradingResult,
  QuestionOption,
} from "../types";
import { aiSettings } from "../config";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// Question Generation
// ============================================

interface GenerateQuestionsParams {
  topic: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  count: number;
  bloomLevel?: BloomLevel;
  subjectId?: string;
}

export async function generateQuestions(
  params: GenerateQuestionsParams
): Promise<AIGeneratedQuestion[]> {
  const { topic, questionType, difficulty, count, bloomLevel } = params;

  const systemPrompt = buildSystemPrompt(questionType, difficulty, bloomLevel);
  const userPrompt = buildUserPrompt(topic, questionType, count);

  try {
    const response = await openai.chat.completions.create({
      model: aiSettings.model,
      temperature: aiSettings.temperature,
      max_tokens: aiSettings.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    const parsed = JSON.parse(content);
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions
      : [parsed];

    return questions.map((q: any) => ({
      questionText: q.question || q.questionText,
      questionType,
      difficulty,
      bloomLevel: bloomLevel || inferBloomLevel(q),
      options: formatOptions(q, questionType),
      correctAnswer: q.answer || q.correctAnswer,
      sampleAnswer: q.sampleAnswer,
      explanation: q.explanation,
      tags: q.tags || [topic],
    }));
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate questions with AI");
  }
}

// ============================================
// Answer Grading (for open-ended questions)
// ============================================

interface GradeAnswerParams {
  questionText: string;
  sampleAnswer: string;
  userAnswer: string;
  maxScore: number;
}

export async function gradeOpenEndedAnswer(
  params: GradeAnswerParams
): Promise<AIGradingResult> {
  const { questionText, sampleAnswer, userAnswer, maxScore } = params;

  const systemPrompt = `You are an expert educational grader. Evaluate student answers fairly and provide constructive feedback.
Score based on accuracy, completeness, and understanding. Return a JSON object with: score, percentage, feedback, suggestions, and isCorrect.`;

  const userPrompt = `Question: ${questionText}

Sample Answer: ${sampleAnswer}

Student Answer: ${userAnswer}

Please grade the student's answer out of ${maxScore} points and provide detailed feedback.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      temperature: 0.3, // Lower temperature for consistent grading
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in grading response");
    }

    const result = JSON.parse(content);
    return {
      score: Number(result.score) || 0,
      maxScore,
      percentage: (Number(result.score) / maxScore) * 100,
      feedback: result.feedback || "No feedback provided",
      suggestions: result.suggestions || [],
      isCorrect: result.isCorrect || Number(result.score) >= maxScore * 0.7,
    };
  } catch (error) {
    console.error("Error grading answer:", error);
    // Fallback: basic similarity check
    return fallbackGrading(sampleAnswer, userAnswer, maxScore);
  }
}

// ============================================
// Helper Functions
// ============================================

function buildSystemPrompt(
  questionType: QuestionType,
  difficulty: DifficultyLevel,
  bloomLevel?: BloomLevel
): string {
  let prompt = aiSettings.systemPrompt + "\n\n";

  // Add question type specific instructions
  switch (questionType) {
    case "MULTIPLE_CHOICE":
      prompt += `Generate multiple-choice questions with 4 options. Exactly one option must be correct. Include explanations for the correct answer.`;
      break;
    case "TRUE_FALSE":
      prompt += `Generate true/false questions. Provide clear, unambiguous statements that are definitively true or false.`;
      break;
    case "SHORT_ANSWER":
      prompt += `Generate short answer questions that can be answered in 1-2 sentences (max 15 words). Provide a sample answer.`;
      break;
    case "ESSAY":
      prompt += `Generate essay questions that require detailed, thoughtful responses. Provide a comprehensive sample answer and grading rubric.`;
      break;
    case "FILL_BLANK":
      prompt += `Generate fill-in-the-blank questions. Provide multiple acceptable answers and indicate if case-sensitive.`;
      break;
  }

  prompt += `\n\nDifficulty: ${difficulty}`;

  if (bloomLevel) {
    const bloomDescriptions = {
      REMEMBER: "Recall facts and basic concepts",
      UNDERSTAND: "Explain ideas and concepts",
      APPLY: "Use information in new situations",
      ANALYZE: "Draw connections and identify patterns",
      EVALUATE: "Justify decisions and make judgments",
      CREATE: "Produce new or original work",
    };
    prompt += `\nBloom's Taxonomy Level: ${bloomLevel} - ${bloomDescriptions[bloomLevel]}`;
  }

  prompt += `\n\nReturn a JSON object with a "questions" array containing the generated questions.`;

  return prompt;
}

function buildUserPrompt(
  topic: string,
  questionType: QuestionType,
  count: number
): string {
  return `Generate ${count} high-quality ${questionType.toLowerCase().replace("_", " ")} question(s) about: ${topic}

Each question should include:
- question: The question text
- answer: The correct answer
${questionType === "MULTIPLE_CHOICE" ? "- option1, option2, option3: Incorrect options" : ""}
- explanation: Why this is the correct answer
- tags: Relevant topic tags

Ensure questions are clear, accurate, and educationally valuable.`;
}

function formatOptions(
  questionData: any,
  questionType: QuestionType
): QuestionOption[] | undefined {
  if (questionType === "MULTIPLE_CHOICE") {
    const options: QuestionOption[] = [
      { text: questionData.answer, isCorrect: true },
      { text: questionData.option1, isCorrect: false },
      { text: questionData.option2, isCorrect: false },
      { text: questionData.option3, isCorrect: false },
    ];
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  }

  if (questionType === "TRUE_FALSE") {
    const isTrue = questionData.answer?.toLowerCase() === "true";
    return [
      { text: "True", isCorrect: isTrue },
      { text: "False", isCorrect: !isTrue },
    ];
  }

  return undefined;
}

function inferBloomLevel(questionData: any): BloomLevel {
  const question = questionData.question?.toLowerCase() || "";

  if (question.includes("create") || question.includes("design") || question.includes("develop")) {
    return "CREATE";
  }
  if (question.includes("evaluate") || question.includes("justify") || question.includes("assess")) {
    return "EVALUATE";
  }
  if (question.includes("analyze") || question.includes("compare") || question.includes("contrast")) {
    return "ANALYZE";
  }
  if (question.includes("apply") || question.includes("solve") || question.includes("use")) {
    return "APPLY";
  }
  if (question.includes("explain") || question.includes("describe") || question.includes("summarize")) {
    return "UNDERSTAND";
  }
  return "REMEMBER";
}

function fallbackGrading(
  sampleAnswer: string,
  userAnswer: string,
  maxScore: number
): AIGradingResult {
  const similarity = calculateSimilarity(
    sampleAnswer.toLowerCase(),
    userAnswer.toLowerCase()
  );
  const score = Math.round(similarity * maxScore);

  return {
    score,
    maxScore,
    percentage: similarity * 100,
    feedback: similarity >= 0.7
      ? "Good answer! Shows understanding of the topic."
      : "Your answer needs more detail or accuracy.",
    suggestions: similarity < 0.7
      ? ["Review the topic and try to include more key points"]
      : [],
    isCorrect: similarity >= 0.7,
  };
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}
