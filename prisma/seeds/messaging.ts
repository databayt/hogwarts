/**
 * Messaging Seed Module
 * Creates parent-teacher communication data
 * - Direct conversations between guardians and teachers
 * - Realistic message threads on common topics
 * - Mix of read/unread states
 *
 * Uses findFirst + create pattern - safe to run multiple times (no deletes)
 */

import type { SeedPrisma } from "./types";
import {
  ConversationType,
  MessageStatus,
  ParticipantRole,
} from "@prisma/client";

// Bilingual message templates for parent-teacher conversations
const MESSAGE_TEMPLATES = {
  // Attendance concerns
  attendance: {
    parent: [
      {
        en: "Hello teacher, my child {name} will be absent tomorrow due to a medical appointment.",
        ar: "السلام عليكم، ابني {name} سيكون غائباً غداً بسبب موعد طبي.",
      },
      {
        en: "Good morning, {name} was late today because of traffic. It won't happen again.",
        ar: "صباح الخير، {name} تأخر اليوم بسبب الازدحام المروري. لن يتكرر هذا الأمر.",
      },
      {
        en: "My child has been sick for the past two days. When can they make up the missed work?",
        ar: "طفلي كان مريضاً خلال اليومين الماضيين. متى يمكنه تعويض الدروس الفائتة؟",
      },
    ],
    teacher: [
      {
        en: "Thank you for informing me. I hope {name} feels better soon. I'll prepare the missed assignments.",
        ar: "شكراً لإعلامي. أتمنى ل{name} الشفاء العاجل. سأحضّر الواجبات الفائتة.",
      },
      {
        en: "No problem. Please ensure {name} arrives on time in the future. Punctuality is important.",
        ar: "لا مشكلة. يرجى التأكد من وصول {name} في الوقت المحدد مستقبلاً. الالتزام بالمواعيد مهم.",
      },
      {
        en: "I understand. {name} can come to my office during break to collect the notes.",
        ar: "أفهم ذلك. يمكن ل{name} القدوم إلى مكتبي خلال الاستراحة لاستلام الملاحظات.",
      },
    ],
  },
  // Grade discussions
  grades: {
    parent: [
      {
        en: "I noticed {name}'s math grade dropped this term. What can we do to help?",
        ar: "لاحظت أن درجة {name} في الرياضيات انخفضت هذا الفصل. ماذا يمكننا فعله للمساعدة؟",
      },
      {
        en: "Can you explain how the grading system works? I want to understand {name}'s report better.",
        ar: "هل يمكنك شرح نظام التقييم؟ أريد فهم تقرير {name} بشكل أفضل.",
      },
      {
        en: "I'm concerned about {name}'s performance in science. Is there extra tutoring available?",
        ar: "أنا قلق بشأن أداء {name} في العلوم. هل يوجد دروس تقوية متاحة؟",
      },
    ],
    teacher: [
      {
        en: "I recommend {name} focuses on practice problems at home. I can provide extra worksheets.",
        ar: "أنصح بأن يركز {name} على حل المسائل في المنزل. يمكنني توفير أوراق عمل إضافية.",
      },
      {
        en: "The grading is based on assignments (40%), exams (40%), and class participation (20%).",
        ar: "التقييم يعتمد على الواجبات (40%)، الامتحانات (40%)، والمشاركة الصفية (20%).",
      },
      {
        en: "Yes, we have after-school tutoring on Tuesdays and Thursdays. I'll add {name} to the list.",
        ar: "نعم، لدينا دروس تقوية بعد المدرسة يومي الثلاثاء والخميس. سأضيف {name} للقائمة.",
      },
    ],
  },
  // Behavior updates
  behavior: {
    parent: [
      {
        en: "Has {name} been behaving well in class? I want to make sure they're focused.",
        ar: "هل كان سلوك {name} جيداً في الصف؟ أريد التأكد من تركيزه.",
      },
      {
        en: "I heard there was an incident today. Can you tell me what happened?",
        ar: "سمعت أن هناك حادثة اليوم. هل يمكنك إخباري ما حدث؟",
      },
    ],
    teacher: [
      {
        en: "{name} has been very attentive and participates actively in class discussions.",
        ar: "{name} كان منتبهاً جداً ويشارك بنشاط في النقاشات الصفية.",
      },
      {
        en: "There was a minor disagreement with a classmate, but it was resolved. Nothing serious.",
        ar: "كان هناك خلاف بسيط مع زميل، لكنه حُلّ. لا شيء خطير.",
      },
      {
        en: "I've noticed {name} has been distracted lately. Is everything okay at home?",
        ar: "لاحظت أن {name} كان مشتتاً مؤخراً. هل كل شيء على ما يرام في المنزل؟",
      },
    ],
  },
  // Homework and assignments
  homework: {
    parent: [
      {
        en: "What is the homework for this week? {name} says they don't have any.",
        ar: "ما هو الواجب لهذا الأسبوع؟ {name} يقول أنه ليس لديه واجبات.",
      },
      {
        en: "Is the project due date extended? {name} needs more time to complete it.",
        ar: "هل تم تمديد موعد تسليم المشروع؟ {name} يحتاج وقتاً أكثر لإكماله.",
      },
    ],
    teacher: [
      {
        en: "The homework is posted on the school portal. This week: math problems 1-20, Arabic essay.",
        ar: "الواجبات منشورة على بوابة المدرسة. هذا الأسبوع: مسائل رياضيات 1-20، موضوع عربي.",
      },
      {
        en: "I can extend the deadline by two days. Please ensure {name} submits by Wednesday.",
        ar: "يمكنني تمديد الموعد النهائي يومين. يرجى التأكد من تسليم {name} بحلول الأربعاء.",
      },
    ],
  },
  // General communication
  general: {
    parent: [
      {
        en: "Thank you for all your hard work with the students. We appreciate it.",
        ar: "شكراً لكل جهودك مع الطلاب. نحن نقدر ذلك.",
      },
      {
        en: "When is the next parent-teacher meeting?",
        ar: "متى الاجتماع القادم لأولياء الأمور مع المعلمين؟",
      },
    ],
    teacher: [
      {
        en: "Thank you for your kind words! It's a pleasure teaching {name}.",
        ar: "شكراً لكلماتك الطيبة! إنه لمن دواعي سروري تدريس {name}.",
      },
      {
        en: "The next parent-teacher meeting is scheduled for next month. You'll receive an invitation soon.",
        ar: "الاجتماع القادم مقرر الشهر المقبل. ستتلقون دعوة قريباً.",
      },
    ],
  },
};

export async function seedMessaging(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  console.log("💬 Creating parent-teacher conversations...");

  // Check for existing conversations
  const existingCount = await prisma.conversation.count({
    where: { schoolId },
  });

  if (existingCount >= 20) {
    console.log(`   ✅ Conversations already exist (${existingCount}), skipping\n`);
    return;
  }

  // Get teachers and guardians with user accounts
  const teachers = await prisma.teacher.findMany({
    where: { schoolId, userId: { not: null } },
    select: { id: true, userId: true, givenName: true, surname: true },
    take: 20,
  });

  const guardians = await prisma.guardian.findMany({
    where: { schoolId, userId: { not: null } },
    include: {
      studentGuardians: {
        include: {
          student: {
            select: { id: true, givenName: true, surname: true },
          },
        },
        take: 1,
      },
    },
    take: 100,
  });

  if (teachers.length === 0 || guardians.length === 0) {
    console.log("   ⚠️  No teachers or guardians found, skipping messaging\n");
    return;
  }

  let conversationCount = 0;
  let messageCount = 0;
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Create 50 direct conversations between parents and teachers
  const topics = Object.keys(MESSAGE_TEMPLATES) as Array<keyof typeof MESSAGE_TEMPLATES>;

  for (let i = 0; i < 50 && i < guardians.length; i++) {
    const guardian = guardians[i];
    const teacher = teachers[i % teachers.length];
    const studentName = guardian.studentGuardians[0]?.student?.givenName || "Student";

    if (!guardian.userId || !teacher.userId) continue;

    // Random topic
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const templates = MESSAGE_TEMPLATES[topic];

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        schoolId,
        type: ConversationType.direct,
        createdById: guardian.userId,
        directParticipant1Id: guardian.userId,
        directParticipant2Id: teacher.userId,
        lastMessageAt: new Date(
          threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime())
        ),
      },
    });

    // Create participants
    await prisma.conversationParticipant.createMany({
      data: [
        {
          conversationId: conversation.id,
          userId: guardian.userId,
          role: ParticipantRole.owner,
          lastReadAt: Math.random() > 0.3 ? now : null,
          unreadCount: Math.random() > 0.3 ? 0 : Math.floor(Math.random() * 3),
        },
        {
          conversationId: conversation.id,
          userId: teacher.userId,
          role: ParticipantRole.member,
          lastReadAt: Math.random() > 0.2 ? now : null,
          unreadCount: Math.random() > 0.2 ? 0 : Math.floor(Math.random() * 2),
        },
      ],
      skipDuplicates: true,
    });

    conversationCount++;

    // Create 3-8 messages per conversation
    const messageCountForConv = 3 + Math.floor(Math.random() * 6);
    const baseTime = new Date(conversation.lastMessageAt || now);

    for (let j = 0; j < messageCountForConv; j++) {
      const isParent = j % 2 === 0;
      const senderId = isParent ? guardian.userId : teacher.userId;
      const msgTemplates = isParent ? templates.parent : templates.teacher;
      const template = msgTemplates[Math.floor(Math.random() * msgTemplates.length)];

      // Use English or Arabic based on random selection
      const useArabic = Math.random() > 0.5;
      let content = useArabic ? template.ar : template.en;
      content = content.replace(/{name}/g, studentName);

      // Calculate message time (earlier messages first)
      const messageTime = new Date(
        baseTime.getTime() - (messageCountForConv - j) * 60 * 60 * 1000 * Math.random() * 24
      );

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId,
          content,
          contentType: "text",
          status: MessageStatus.delivered,
          createdAt: messageTime,
          updatedAt: messageTime,
        },
      });

      messageCount++;
    }

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: baseTime },
    });
  }

  console.log(`   ✅ Created ${conversationCount} conversations with ${messageCount} messages`);
  console.log(`      - Topics: attendance, grades, behavior, homework, general`);
  console.log(`      - Languages: Arabic and English (mixed)\n`);
}
