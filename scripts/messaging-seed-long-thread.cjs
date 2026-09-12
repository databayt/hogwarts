// Local-only helper for the messaging perf pass: gives the demo admin ↔
// teacher direct thread 130 backdated messages so cursor paging (50 per
// page) has three pages to walk. Idempotent by content prefix.
//
//   NODE_PATH=./node_modules node scripts/messaging-seed-long-thread.cjs
//   NODE_PATH=./node_modules node scripts/messaging-seed-long-thread.cjs --remove
//
// `--remove` deletes only rows carrying the seed prefix and drops the thread
// when nothing else is left in it. Never run against production: the demo
// school there is a verbatim copy of localhost, so remove before deploying.
const { PrismaClient } = require("@prisma/client")

const db = new PrismaClient()
const PREFIX = "رسالة تحميل رقم "
const COUNT = 130

async function findThread(schoolId, adminId, teacherId) {
  return db.conversation.findFirst({
    where: {
      schoolId,
      type: "direct",
      AND: [
        { participants: { some: { userId: adminId } } },
        { participants: { some: { userId: teacherId } } },
      ],
    },
    select: { id: true, _count: { select: { messages: true } } },
  })
}

async function main() {
  const remove = process.argv.includes("--remove")
  const school = await db.school.findFirst({ where: { domain: "demo" }, select: { id: true } })
  const [admin, teacher] = await Promise.all([
    db.user.findFirst({ where: { email: "admin@balqalam.com" }, select: { id: true } }),
    db.user.findFirst({ where: { email: "teacher@balqalam.com" }, select: { id: true } }),
  ])
  if (!school || !admin || !teacher) throw new Error("demo school or accounts missing")

  let conv = await findThread(school.id, admin.id, teacher.id)

  if (remove) {
    if (!conv) return { removed: 0, conversationDeleted: false }
    const { count } = await db.message.deleteMany({
      where: { conversationId: conv.id, content: { startsWith: PREFIX } },
    })
    const left = await db.message.count({ where: { conversationId: conv.id } })
    if (left === 0) await db.conversation.delete({ where: { id: conv.id } })
    return { conversationId: conv.id, removed: count, conversationDeleted: left === 0 }
  }

  if (!conv) {
    conv = await db.conversation.create({
      data: {
        schoolId: school.id,
        type: "direct",
        directParticipant1Id: admin.id,
        directParticipant2Id: teacher.id,
        createdById: admin.id,
        participants: {
          create: [
            { userId: admin.id, role: "owner" },
            { userId: teacher.id, role: "member" },
          ],
        },
      },
      select: { id: true, _count: { select: { messages: true } } },
    })
  }
  const existing = await db.message.count({
    where: { conversationId: conv.id, content: { startsWith: PREFIX } },
  })
  if (existing >= COUNT) return { conversationId: conv.id, already: existing }

  const base = Date.now() - 3 * 24 * 3600 * 1000
  const rows = []
  for (let i = 1; i <= COUNT; i++) {
    rows.push({
      conversationId: conv.id,
      senderId: i % 3 === 0 ? admin.id : teacher.id,
      content: `${PREFIX}${i} — سطر للتحقق من التمرير والصفحات`,
      contentType: "text",
      status: "sent",
      createdAt: new Date(base + i * 20 * 60 * 1000),
    })
  }
  await db.message.createMany({ data: rows })
  const last = rows[rows.length - 1].createdAt
  await db.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: last } })
  // The admin has read up to message 100, so the list badge shows 30 unread
  // and the thread opens with a divider to scroll past.
  await db.conversationParticipant.updateMany({
    where: { conversationId: conv.id, userId: admin.id },
    data: { lastReadAt: new Date(base + 100 * 20 * 60 * 1000) },
  })
  return { conversationId: conv.id, seeded: rows.length }
}

main()
  .then((out) => console.log(JSON.stringify(out)))
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
