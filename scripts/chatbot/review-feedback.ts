// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * What the assistant failed at, for the people who write the guides: every
 * answer marked "not helpful", and every answer that named no guide, in the
 * last N days — with the question that led to it, grouped by guide. Terminal
 * only; the questions stay in the database.
 *
 *   npx tsx -r dotenv/config -r ./scripts/_server-only-shim.cjs \
 *     scripts/chatbot/review-feedback.ts [--days 30]
 */
import { db } from "@/lib/db"

const i = process.argv.indexOf("--days")
const days = i === -1 ? 30 : Number(process.argv[i + 1])

async function main() {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  // Cross-school on purpose: a system review, read-only.
  const answers = await db.chatbotMessage.findMany({
    where: {
      schoolId: { not: "" },
      role: "ASSISTANT",
      createdAt: { gte: since },
      OR: [{ feedback: -1 }, { topicSlugs: { isEmpty: true }, content: { not: "" } }],
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      threadId: true,
      createdAt: true,
      feedback: true,
      topicSlugs: true,
      provider: true,
      thread: { select: { mode: true, lang: true } },
    },
  })
  const groups = new Map<string, string[]>()
  for (const a of answers) {
    const question = await db.chatbotMessage.findFirst({
      where: {
        schoolId: { not: "" },
        threadId: a.threadId,
        role: "USER",
        createdAt: { lt: a.createdAt },
      },
      orderBy: { createdAt: "desc" },
      select: { content: true },
    })
    const key = a.feedback === -1 ? `not helpful · ${a.topicSlugs[0] ?? "no guide"}` : "no guide"
    const line = `[${a.thread.mode} ${a.thread.lang} ${a.provider ?? "?"}] ${question?.content.slice(0, 140) ?? "?"}`
    groups.set(key, [...(groups.get(key) ?? []), line])
  }
  if (!groups.size) console.log(`Nothing to review in the last ${days} days.`)
  for (const [key, lines] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n${key} (${lines.length})`)
    for (const line of lines.slice(0, 20)) console.log(`  ${line}`)
  }
  await db.$disconnect()
}

void main()
