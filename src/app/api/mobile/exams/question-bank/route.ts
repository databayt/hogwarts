// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/exams/question-bank — browse question bank
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (
      auth.role !== "TEACHER" &&
      auth.role !== "ADMIN" &&
      auth.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get("subject") || undefined
    const difficulty = searchParams.get("difficulty") || undefined
    const questionType = searchParams.get("type") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "30")
    const skip = (page - 1) * perPage

    const where: Prisma.QuestionBankWhereInput = {
      schoolId: auth.schoolId,
      ...(subjectId ? { subjectId } : {}),
      ...(difficulty
        ? { difficulty: difficulty as Prisma.EnumDifficultyLevelFilter }
        : {}),
      ...(questionType
        ? { questionType: questionType as Prisma.EnumQuestionTypeFilter }
        : {}),
    }

    const [questions, total] = await Promise.all([
      db.questionBank.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
        select: {
          id: true,
          questionText: true,
          questionType: true,
          difficulty: true,
          bloomLevel: true,
          points: true,
          tags: true,
          options: true,
          subject: { select: { id: true, name: true } },
          createdAt: true,
        },
      }),
      db.questionBank.count({ where }),
    ])

    const data = questions.map((q) => ({
      id: q.id,
      text: q.questionText,
      type: q.questionType,
      difficulty: q.difficulty,
      bloom_level: q.bloomLevel,
      points: Number(q.points),
      tags: q.tags,
      options: q.options,
      subject_name: q.subject?.name || null,
      created_at: q.createdAt.toISOString(),
    }))

    return NextResponse.json({ data, total, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile question bank error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
