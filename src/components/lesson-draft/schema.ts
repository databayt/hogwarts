// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

/**
 * What the model hands back through the forced `submit_draft` tool. The
 * hand-written JSON schema (with its enums — the SDK's zodOutputFormat drops
 * them) and the zod schema that re-checks it in code, side by side.
 */

export const QUESTION_TYPES = ["MULTIPLE_CHOICE", "TRUE_FALSE"] as const
export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const
export const BLOOMS = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE"] as const

/** Questions the prompt asks for. */
export const ASKED_QUESTIONS = 6

export const optionSchema = z.object({
  text: z.string(),
  isCorrect: z.boolean(),
})

export const questionSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  text: z.string(),
  options: z.array(optionSchema),
  explanation: z.string(),
  difficulty: z.enum(DIFFICULTIES),
  bloom: z.enum(BLOOMS),
})

export const homeworkSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  points: z.number(),
  dueInDays: z.number(),
})

/**
 * The envelope. `questions` stays `unknown[]` so one malformed item is
 * dropped by the validator instead of failing the whole answer.
 */
export const draftEnvelopeSchema = z.object({
  lang: z.enum(["ar", "en"]).optional(),
  questions: z.array(z.unknown()).default([]),
  homework: homeworkSchema,
})

export const TOOL_NAME = "submit_draft"

/** The tool's input_schema. Enums are spelled out here on purpose. */
export function draftJsonSchema(opts: { homeworkOnly?: boolean } = {}) {
  const question = {
    type: "object",
    properties: {
      type: { type: "string", enum: [...QUESTION_TYPES] },
      text: { type: "string", description: "The question, in the lesson language." },
      options: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        description:
          "MULTIPLE_CHOICE: exactly 4 distinct options. TRUE_FALSE: exactly 2. Exactly one isCorrect.",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            isCorrect: { type: "boolean" },
          },
          required: ["text", "isCorrect"],
        },
      },
      explanation: {
        type: "string",
        description: "One short sentence: why the correct option is right.",
      },
      difficulty: { type: "string", enum: [...DIFFICULTIES] },
      bloom: { type: "string", enum: [...BLOOMS] },
    },
    required: ["type", "text", "options", "explanation", "difficulty", "bloom"],
  }
  const properties: Record<string, unknown> = {
    lang: { type: "string", enum: ["ar", "en"] },
    homework: {
      type: "object",
      properties: {
        title: { type: "string" },
        instructions: { type: "string" },
        points: { type: "integer", minimum: 1, maximum: 20 },
        dueInDays: { type: "integer", minimum: 1, maximum: 7 },
      },
      required: ["title", "instructions", "points", "dueInDays"],
    },
  }
  const required = ["lang", "homework"]
  if (!opts.homeworkOnly) {
    properties.questions = {
      type: "array",
      minItems: 4,
      maxItems: 10,
      items: question,
    }
    required.unshift("questions")
  }
  return { type: "object" as const, properties, required }
}
