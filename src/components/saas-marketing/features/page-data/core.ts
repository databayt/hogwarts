// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"

export const corePageData: Record<string, FeaturePageData> = {
  // Rewritten 2026-11-09 in the deck voice (concrete, checkable, hours saved,
  // no superlatives). Every claim maps to school-dashboard/admission: the
  // public application wizard (documents, fee estimate), the one review queue
  // and its status machine (shortlist/interview/waitlist), merit scores,
  // campaigns with seats, acceptance → student record, and the status emails.
  // There is no online application-fee payment (that leg was retired) — don't
  // claim one.
  admission: {
    sections: [
      {
        type: "hero",
        heading: "Admission",
        description:
          "Families apply from their phone; your team reviews, ranks and enrolls from one queue.",
      },
      {
        type: "role-cards",
        heading: "Who it's for",
        cards: [
          {
            title: "Families",
            description:
              "Apply from a phone in Arabic or English, attach documents once, and see the fee estimate before submitting.",
          },
          {
            title: "Admissions team",
            description:
              "Every application lands in one queue with its documents and guardians — shortlist, interview, waitlist or accept in a click.",
          },
          {
            title: "School leaders",
            description:
              "Applications against seats for every intake, at a glance — know where enrollment stands before term starts.",
          },
        ],
      },
      {
        type: "benefits-grid",
        heading: "Why schools switch",
        items: [
          {
            title: "No queues at the gate",
            description:
              "Applications and documents arrive online, at any hour, from anywhere.",
          },
          {
            title: "No paper to chase",
            description:
              "Birth certificates, report cards and photos stay attached to the application, not filed in a cabinet.",
          },
          {
            title: "Fair merit lists",
            description:
              "Score every applicant on the same criteria; the ranking updates as the marks go in.",
          },
          {
            title: "Seats under control",
            description:
              "Each intake is a campaign with its own dates and seats, and applications are counted as they arrive.",
          },
          {
            title: "Accepted means enrolled",
            description:
              "An accepted applicant becomes a student with an enrollment number — nothing is typed twice.",
          },
          {
            title: "Families kept informed",
            description:
              "Shortlisted, waitlisted or accepted — the family hears by email the moment the status changes.",
          },
        ],
      },
    ],
    sectionsAr: [
      {
        type: "hero",
        heading: "القبول",
        description:
          "تتقدّم الأسر من هواتفها، ويراجع فريقك الطلبات ويرتّبها ويقبلها من قائمة واحدة.",
      },
      {
        type: "role-cards",
        heading: "لمن صُمّم",
        cards: [
          {
            title: "الأسر",
            description:
              "التقديم من الهاتف بالعربية أو الإنجليزية، وإرفاق المستندات مرة واحدة، ومعرفة تقدير الرسوم قبل الإرسال.",
          },
          {
            title: "فريق القبول",
            description:
              "كل طلب يصل إلى قائمة واحدة مع مستنداته وبيانات أولياء الأمور — قائمة مختصرة أو مقابلة أو انتظار أو قبول بنقرة.",
          },
          {
            title: "إدارة المدرسة",
            description:
              "الطلبات مقابل المقاعد لكل دفعة قبول في لمحة — اعرف أين يقف التسجيل قبل بدء الفصل.",
          },
        ],
      },
      {
        type: "benefits-grid",
        heading: "لماذا تنتقل المدارس إليه",
        items: [
          {
            title: "لا طوابير عند البوابة",
            description:
              "تصل الطلبات والمستندات إلكترونيًا، في أي وقت ومن أي مكان.",
          },
          {
            title: "لا أوراق تُلاحَق",
            description:
              "شهادات الميلاد والتقارير المدرسية والصور تبقى مرفقة بالطلب، لا في الخزانة.",
          },
          {
            title: "قوائم مفاضلة عادلة",
            description:
              "قيّم كل متقدّم بالمعايير نفسها، ويتحدّث الترتيب مع كل درجة تُدخلها.",
          },
          {
            title: "المقاعد تحت السيطرة",
            description:
              "كل دفعة قبول حملة لها مواعيدها ومقاعدها، وتُحصى الطلبات لحظة وصولها.",
          },
          {
            title: "القبول يعني التسجيل",
            description:
              "يصبح المتقدّم المقبول طالبًا برقم قيد — دون إعادة إدخال أي بيانات.",
          },
          {
            title: "الأسرة على اطلاع",
            description:
              "قائمة مختصرة أو انتظار أو قبول — تعلم الأسرة بالبريد فور تغيّر حالة الطلب.",
          },
        ],
      },
    ],
    relatedFeatures: ["application", "financial", "crm"],
  },

  exam: {
    sections: [
      {
        type: "hero",
        heading: "Exam Management System",
        description:
          "A unified platform that manages the entire examination process from conducting and proctoring exams to evaluating them, automating exam-related tasks including creating timetables, generating hall tickets, grading papers, and processing results.",
      },
      {
        type: "benefits-grid",
        heading: "Benefits Of Using Examination Management Software",
        description:
          "Implementing examination management software leads to improved efficiency, cost savings, enhanced security, and better communication across all educational institutions.",
        items: [
          {
            title: "Streamlined Examination Scheduling",
            description:
              "Enables administrators to effortlessly generate exam schedules, simplifying the management of exams, tests papers, and essential documents.",
          },
          {
            title: "Swift and Precise Results Processing",
            description:
              "Efficiently processes results with speed and accuracy, simplifying the generation of reports, grade sheets, and other necessary documents.",
          },
          {
            title: "Improved Security",
            description:
              "A secure environment for institutions to store and manage exam-related data, guaranteeing protection against unauthorized access.",
          },
          {
            title: "Reduced Workload",
            description:
              "Automates several exam-related tasks, including creating timetables, generating hall tickets, grading papers, and processing results.",
          },
          {
            title: "Enhanced Communication",
            description:
              "Facilitates easy communication among students, teachers, and administrators, ensuring everyone stays informed.",
          },
          {
            title: "Online Exam System",
            description:
              "Online examination system allowing students to remotely complete their exams, particularly beneficial for distance learning programs.",
          },
          {
            title: "Cost-Effective",
            description:
              "Reduces the need for paper-based processes, thus reducing the cost of printing and storing exam-related documents.",
          },
          {
            title: "User Friendly",
            description:
              "Designed to be user-friendly, making it easy for school, college, and university administrators to manage examinations.",
          },
          {
            title: "Advanced Notifications",
            description:
              "Triggers automatic alerts and notifications to keep students and invigilators informed at every stage of the examination process.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Experience The Future Of Education With Our Examination Management Software -- Unlock Efficiency and Excellence Today!",
      },
    ],
    relatedFeatures: ["gradebook", "omr"],
  },

  faculty: {
    sections: [
      {
        type: "hero",
        heading: "Faculty Management System",
        description:
          "A comprehensive Faculty Management System designed for mobile compatibility, streamlining all facets of the faculty lifecycle from onboarding and recruitment to workload management and performance tracking.",
      },
      {
        type: "section-heading",
        heading:
          "Faculty Management Software - Designed For The Faculty In You",
        description:
          "Step into a World Where Technology Meets Pedagogy, Creating the Perfect Ecosystem for Inspirational Educators.",
      },
      {
        type: "feature-cards",
        heading: "Key Capabilities",
        cards: [
          {
            title: "Onboarding Process for Faculty and Staff",
            description:
              "Simplify faculty hiring with an integrated platform, streamlining recruitment, onboarding, and improving top-tier faculty acquisition.",
          },
          {
            title: "Faculty Lifecycle Management",
            description:
              "Proactively oversee faculty paths with a comprehensive directory containing appointments, contract terms, workload, and career milestones.",
          },
          {
            title: "Advanced Faculty Search",
            description:
              "Enable hiring committees to attract top-tier candidates and create a positive image for your department, institution, or university.",
          },
          {
            title: "Advancement & Long-term Service",
            description:
              "Streamline cross-disciplinary faculty reviews by responsible committees, offering candidates a transparent and consistent process for growth.",
          },
          {
            title: "Extensive Data Solutions",
            description:
              "Data quality and coverage of faculty activity reporting offer higher education a fresh approach to accurate and dependable faculty information.",
          },
          {
            title: "Faculty Portal",
            description:
              "Applicants can easily access the portal to handle documents, monitor application status, view job openings, positions, and reports.",
          },
          {
            title: "Academic Staff List",
            description:
              "A comprehensive and precise list of full-time and part-time educators, sortable by key categories such as department and rank.",
          },
          {
            title: "Efficient Communication",
            description:
              "Utilize communication tools to generate and archive email exchanges with colleagues and management regarding professional development.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Harness The Power of Efficient Faculty Management. Dive Into Seamless Management Today!",
      },
    ],
    relatedFeatures: ["appraisals", "timetable", "leave-request"],
  },

  financial: {
    sections: [
      {
        type: "hero",
        heading: "Financial Management System",
        description:
          "Transform your institution's financial processes and discover a smarter way to manage your finances, enhance transparency, and achieve financial sustainability.",
      },
      {
        type: "benefits-grid",
        heading:
          "Benefits of Financial Management System For Educational Institute",
        description:
          "Implementing a Financial Management System streamlines financial operations, improves accuracy, and enhances overall efficiency.",
        items: [
          {
            title: "Flexible Fees Structure",
            description:
              "Tracking and management of student fees and tuition payments. Handle various fee structures, payment plans, and late fee calculations.",
          },
          {
            title: "Student Accounting",
            description:
              "Maintain financial records for individual students including tuition payments, scholarships, and other financial interactions.",
          },
          {
            title: "Online Fees Collection",
            description:
              "Collect any type of online fees such as annual, examination, and tuition fees from students and parents.",
          },
          {
            title: "Accounts Payable",
            description:
              "Managing and tracking payments to vendors, suppliers, and service providers with invoice processing and payment approvals.",
          },
          {
            title: "Bank Management",
            description:
              "Manage bank accounts efficiently including tracking deposits, withdrawals, reconciling accounts, and handling electronic fund transfers.",
          },
          {
            title: "Fixed Asset Management",
            description:
              "Track and manage physical assets such as equipment and facilities to understand depreciation and plan for replacements.",
          },
          {
            title: "User-Friendly Interface",
            description:
              "An intuitive and user-friendly interface ensures that staff can easily navigate and use the software.",
          },
          {
            title: "Automated Reminders",
            description:
              "Check fee reports and notify students and parents of pending fees via SMS and email automatically.",
          },
          {
            title: "Multi-Currency Support",
            description:
              "For institutions with international operations, support multiple currencies and provide currency conversion capabilities.",
          },
          {
            title: "Expense Tracking",
            description:
              "Monitor and categorize expenses across various areas such as salaries, facilities, supplies, and more.",
          },
          {
            title: "Financial Reporting",
            description:
              "Generate detailed financial reports and statements providing insights into an institution's financial health.",
          },
          {
            title: "Cloud-Based Accessibility",
            description:
              "Cloud-based services allowing authorized personnel to access financial data from anywhere with an internet connection.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Empowers Educational Institutions To Efficiently Manage Finances -- Unlocking The Path To Financial Success.",
      },
    ],
    relatedFeatures: ["payment", "accounting", "expense"],
  },

  student: {
    sections: [
      {
        type: "hero",
        heading: "Student",
        description:
          "One record per student, from first application to alumni — profiles, guardians, attendance and fees in one searchable directory.",
      },
      {
        type: "role-cards",
        heading: "Who gets their time back",
        cards: [
          {
            title: "Admins",
            description:
              "Enrollment, transfers and records handled from one directory — the filing cabinet retires and the audit trail writes itself.",
          },
          {
            title: "Teachers",
            description:
              "Class lists, profiles and guardian contacts always current — walk into any lesson or parent meeting already briefed.",
          },
          {
            title: "Students",
            description:
              "Timetable, results and announcements on their own login — no more photographing the noticeboard.",
          },
          {
            title: "Parents",
            description:
              "Fees, attendance and progress for every child from one portal, in Arabic or English — without calling the office.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Import your students from a spreadsheet and go live this week.",
      },
      {
        type: "feature-cards",
        heading: "Everything the record connects to",
        description:
          "The student record isn't a page — it's the spine of the school. Every module below reads and writes the same record.",
        cards: [
          {
            title: "Admission",
            description:
              "Applications become student records on acceptance — nothing is retyped, documents carry over.",
          },
          {
            title: "Attendance",
            description:
              "Digital registers per period write straight to the record — streaks and patterns surface on the overview.",
          },
          {
            title: "Gradebook",
            description:
              "Exam and assignment results accumulate per term — report cards and transcripts generate from the same marks.",
          },
          {
            title: "Timetable",
            description:
              "Each student's week follows their section — changes propagate the moment the grid changes.",
          },
          {
            title: "Fees & invoices",
            description:
              "Enrollment provisions the invoices; payments on any local rail reconcile to the student's account.",
          },
          {
            title: "Parent portal",
            description:
              "Guardians link once and see fees, attendance and results for each of their children.",
          },
          {
            title: "Transport",
            description:
              "Route and bus assignments per student, boarding tracked per trip.",
          },
          {
            title: "Library",
            description:
              "Borrowing history tied to the student — returns chase themselves.",
          },
          {
            title: "Stream LMS",
            description:
              "Course enrollment and progress live on the same record as everything else.",
          },
          {
            title: "Documents",
            description:
              "Report cards, transcripts and letters generated from live data — bilingual templates included.",
          },
          {
            title: "Announcements",
            description:
              "School, grade or class-targeted — students and guardians see what concerns them.",
          },
          {
            title: "Arabic-first",
            description:
              "Every screen designed right-to-left first — English is the translation, not the other way around.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Why schools pick this student system",
        items: [
          { text: "Your first month free" },
          { text: "Arabic-first, RTL-native interface" },
          { text: "Import from a spreadsheet in minutes" },
          { text: "Export everything to CSV or JSON, anytime" },
          { text: "Role-based access for 8 school roles" },
          { text: "Local payment rails, one ledger" },
          { text: "Works on any device — no app install required" },
          { text: "Bilingual report cards and transcripts" },
        ],
      },
    ],
    relatedFeatures: ["parent-login", "attendance", "gradebook"],
  },
}
