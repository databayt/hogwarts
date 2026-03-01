// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  Feature,
  FeatureCategoryInfo,
  FeatureDetail,
  ImpactMetric,
} from "./types"

/**
 * 10 feature categories — mirrors OpenEduCat module groups
 */
export const CATEGORIES: FeatureCategoryInfo[] = [
  {
    id: "core",
    label: "Core",
    description: "Essential school management foundations",
    icon: "Shield",
    color: "text-blue-600",
  },
  {
    id: "essential",
    label: "Essential",
    description: "Key academic and operational modules",
    icon: "BookOpen",
    color: "text-purple-600",
  },
  {
    id: "advance",
    label: "Advance",
    description: "Advanced tools and integrations",
    icon: "Layers",
    color: "text-pink-600",
  },
  {
    id: "erp",
    label: "ERP",
    description: "Enterprise resource planning modules",
    icon: "Receipt",
    color: "text-amber-600",
  },
  {
    id: "management",
    label: "Management",
    description: "Campus and facilities management",
    icon: "Building2",
    color: "text-emerald-600",
  },
  {
    id: "communication",
    label: "Communication",
    description: "Messaging, forums, and collaboration",
    icon: "MessageSquare",
    color: "text-orange-600",
  },
  {
    id: "lms",
    label: "LMS",
    description: "Learning management system",
    icon: "Monitor",
    color: "text-violet-600",
  },
  {
    id: "technical",
    label: "Technical",
    description: "Platform capabilities and deployment",
    icon: "Settings",
    color: "text-slate-600",
  },
  {
    id: "integration",
    label: "Integration",
    description: "Third-party service integrations",
    icon: "Puzzle",
    color: "text-teal-600",
  },
  {
    id: "ai",
    label: "AI",
    description: "Artificial intelligence powered features",
    icon: "Sparkles",
    color: "text-cyan-600",
  },
]

/**
 * 85 features — mirrors OpenEduCat feature set
 */
export const FEATURES: Feature[] = [
  // ─── Core (6) ───
  {
    id: "admission",
    title: "Admission",
    description:
      "Quick, transparent registration for easy and streamlined enrollment.",
    icon: "UserPlus",
    category: "core",
  },
  {
    id: "course",
    title: "Course",
    description:
      "Manage courses, subjects, and all academic sessions institution-wide.",
    icon: "BookOpen",
    category: "core",
  },
  {
    id: "exam",
    title: "Exam",
    description:
      "Schedule and manage exams using CCE, CPA, and standard grading systems.",
    icon: "FileText",
    category: "core",
  },
  {
    id: "faculty",
    title: "Faculty",
    description:
      "Automate the full faculty lifecycle from onboarding through workload.",
    icon: "Users",
    category: "core",
  },
  {
    id: "financial",
    title: "Financial",
    description:
      "Fee reminders, expense tracking, income reports, and reconciliation.",
    icon: "Wallet",
    category: "core",
  },
  {
    id: "student",
    title: "Student",
    description:
      "Centralized student records for quick access and data-driven decisions.",
    icon: "GraduationCap",
    category: "core",
  },

  // ─── Essential (9) ───
  {
    id: "application",
    title: "Application",
    description:
      "Collect and process all admission applications from a single platform.",
    icon: "ClipboardList",
    category: "essential",
  },
  {
    id: "assignment",
    title: "Assignment",
    description:
      "Assign and track work for individual students, groups, or full batches.",
    icon: "ClipboardCheck",
    category: "essential",
  },
  {
    id: "attendance",
    title: "Attendance",
    description:
      "Eliminate manual input errors and track attendance across every course.",
    icon: "CheckSquare",
    category: "essential",
  },
  {
    id: "classroom",
    title: "Classroom",
    description:
      "Manage classroom equipment, seating, daily scheduling, and resources.",
    icon: "DoorOpen",
    category: "essential",
  },
  {
    id: "gradebook",
    title: "Gradebook",
    description:
      "Track all student grades and academic progress from one central view.",
    icon: "BookMarked",
    category: "essential",
  },
  {
    id: "leave-request",
    title: "Leave Request",
    description:
      "Submit and approve leave requests across all groups, roles, and staff.",
    icon: "CalendarOff",
    category: "essential",
  },
  {
    id: "payment",
    title: "Payment",
    description:
      "Integrated payment processing for all fees, tuition, and enrollment.",
    icon: "CreditCard",
    category: "essential",
  },
  {
    id: "timetable",
    title: "Timetable",
    description:
      "Schedule sessions across all courses and batches with notifications.",
    icon: "CalendarDays",
    category: "essential",
  },
  {
    id: "timesheet",
    title: "Timesheet",
    description:
      "Track time, attendance, and all productivity metrics via timesheets.",
    icon: "Clock",
    category: "essential",
  },

  // ─── Advance (21) ───
  {
    id: "advance-accounting",
    title: "Advance Accounting",
    description:
      "Cloud-based accounting software built for schools and higher education.",
    icon: "Calculator",
    category: "advance",
  },
  {
    id: "assignment-annotation",
    title: "Assignment Annotation",
    description:
      "Add digital notes and comments on student assignments to boost learning.",
    icon: "PenLine",
    category: "advance",
  },
  {
    id: "automated-marketing",
    title: "Automated Marketing",
    description:
      "Integrate email campaigns with CRM analytics to grow enrollment rates.",
    icon: "Megaphone",
    category: "advance",
  },
  {
    id: "biometric",
    title: "Biometric",
    description:
      "Accurate student attendance tracking via integrated biometric hardware.",
    icon: "Fingerprint",
    category: "advance",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description:
      "View all KPIs in one place with customizable dashboards and reports.",
    icon: "LayoutDashboard",
    category: "advance",
  },
  {
    id: "digital-library",
    title: "Digital Library",
    description:
      "Access ebooks, videos, and all digital teaching resources in one hub.",
    icon: "BookOpen",
    category: "advance",
  },
  {
    id: "documents",
    title: "Documents",
    description:
      "Share and manage all school documents with built-in compliance tools.",
    icon: "FileText",
    category: "advance",
  },
  {
    id: "events",
    title: "Events",
    description:
      "Organize school events, sell tickets, track and manage all attendees.",
    icon: "Calendar",
    category: "advance",
  },
  {
    id: "e-sign",
    title: "E-sign",
    description:
      "Reduce paperwork using e-signatures and streamlined document approvals.",
    icon: "PenTool",
    category: "advance",
  },
  {
    id: "face-recognition",
    title: "Face Recognition",
    description:
      "Track student attendance via facial recognition and flag absence trends.",
    icon: "ScanFace",
    category: "advance",
  },
  {
    id: "kpi-dashboard",
    title: "KPI Dashboard",
    description:
      "Monitor all departmental metrics in real time with a health overview.",
    icon: "BarChart3",
    category: "advance",
  },
  {
    id: "library",
    title: "Library",
    description:
      "Manage all books, articles, and media materials from one central hub.",
    icon: "Library",
    category: "advance",
  },
  {
    id: "live-classroom",
    title: "Live Classroom",
    description:
      "Virtual classes with live attendance tracking and proctored assignments.",
    icon: "Video",
    category: "advance",
  },
  {
    id: "mobile-application",
    title: "Mobile Application",
    description:
      "Mobile access to classes, assignments, and events for every user role.",
    icon: "Smartphone",
    category: "advance",
  },
  {
    id: "multi-approvals",
    title: "Multi Approvals",
    description:
      "Route all institutional requests through multi-step approval workflows.",
    icon: "CheckCircle",
    category: "advance",
  },
  {
    id: "no-code-studio",
    title: "No Code Studio",
    description:
      "Build and modify custom views and user interfaces without writing code.",
    icon: "Blocks",
    category: "advance",
  },
  {
    id: "omr",
    title: "OMR",
    description:
      "Conduct MCQ exams with OMR answer sheets from mobile, PC, or tablet.",
    icon: "ScanLine",
    category: "advance",
  },
  {
    id: "quiz-anti-cheating",
    title: "Quiz Anti Cheating",
    description:
      "Automated proctoring detects any suspicious quiz behavior in real time.",
    icon: "ShieldAlert",
    category: "advance",
  },
  {
    id: "reporting",
    title: "Reporting",
    description:
      "Generate insightful reports across every department and school activity.",
    icon: "LineChart",
    category: "advance",
  },
  {
    id: "thesis",
    title: "Thesis",
    description:
      "Complete thesis lifecycle management from proposal through archiving.",
    icon: "ScrollText",
    category: "advance",
  },
  {
    id: "convocation",
    title: "Convocation",
    description:
      "Simplify ceremonies with automated registration and pass distribution.",
    icon: "Award",
    category: "advance",
  },

  // ─── ERP (13) ───
  {
    id: "accounting",
    title: "Accounting",
    description:
      "Handle invoicing, receipts, payments, and all balances in one system.",
    icon: "Receipt",
    category: "erp",
  },
  {
    id: "appraisals",
    title: "Appraisals",
    description:
      "Run periodic staff evaluations with actionable performance insights.",
    icon: "Star",
    category: "erp",
  },
  {
    id: "assets-request",
    title: "Assets Request",
    description:
      "Track all institutional assets to reduce costs and boost efficiency.",
    icon: "Package",
    category: "erp",
  },
  {
    id: "crm",
    title: "CRM",
    description:
      "Automate all lead and opportunity tracking with the built-in CRM tools.",
    icon: "Contact",
    category: "erp",
  },
  {
    id: "e-commerce",
    title: "E-Commerce",
    description:
      "Online store for students and parents featuring smart recommendations.",
    icon: "ShoppingCart",
    category: "erp",
  },
  {
    id: "email-integration",
    title: "E-mail Integration",
    description:
      "Track emails, schedule messages, and view your complete send history.",
    icon: "Mail",
    category: "erp",
  },
  {
    id: "email-marketing",
    title: "E-mail Marketing",
    description:
      "Send targeted bulk emails to students, parents, and future prospects.",
    icon: "MailPlus",
    category: "erp",
  },
  {
    id: "expense",
    title: "Expense",
    description:
      "Reduce errors and optimize budgets through improved expense reporting.",
    icon: "TrendingDown",
    category: "erp",
  },
  {
    id: "payroll",
    title: "Payroll",
    description:
      "Batch payslip generation for every staff member linked to attendance.",
    icon: "Banknote",
    category: "erp",
  },
  {
    id: "purchase",
    title: "Purchase",
    description:
      "Centralized procurement system for managing organization-wide purchases.",
    icon: "ShoppingBag",
    category: "erp",
  },
  {
    id: "recruitment",
    title: "Recruitment",
    description:
      "Recruitment portal with workforce planning insights and job tracking.",
    icon: "UserPlus",
    category: "erp",
  },
  {
    id: "sales",
    title: "Sales",
    description:
      "Streamline sales workflows, cut manual errors, and boost productivity.",
    icon: "TrendingUp",
    category: "erp",
  },
  {
    id: "stock",
    title: "Stock",
    description:
      "Accurate inventory levels to prevent both stockouts and overstocking.",
    icon: "Warehouse",
    category: "erp",
  },

  // ─── Management (5) ───
  {
    id: "canteen",
    title: "Canteen",
    description:
      "Built-in point-of-sale with barcode scanning for student cafeterias.",
    icon: "UtensilsCrossed",
    category: "management",
  },
  {
    id: "campus",
    title: "Campus",
    description:
      "Manage campus facilities, book amenities, and process all transactions.",
    icon: "Building2",
    category: "management",
  },
  {
    id: "parent-login",
    title: "Parent Login",
    description:
      "Parent portal for tracking all academic activities and achievements.",
    icon: "House",
    category: "management",
  },
  {
    id: "placement",
    title: "Placement",
    description:
      "Track all recruiters, job offers, interviews, and student placements.",
    icon: "Briefcase",
    category: "management",
  },
  {
    id: "transportation",
    title: "Transportation",
    description:
      "Manage routes, vehicles, and student safety for all school transport.",
    icon: "Bus",
    category: "management",
  },

  // ─── Communication (11) ───
  {
    id: "blog",
    title: "Blog",
    description:
      "Publish well-designed blog posts authored by students and all faculty.",
    icon: "PenSquare",
    category: "communication",
  },
  {
    id: "discussion",
    title: "Discussion",
    description:
      "Open discussion channels for coordinating and debating any school topic.",
    icon: "MessageSquare",
    category: "communication",
  },
  {
    id: "forum",
    title: "Forum",
    description:
      "Open Q&A forums enabling collaborative student and faculty discussions.",
    icon: "MessagesSquare",
    category: "communication",
  },
  {
    id: "grievance",
    title: "Grievance",
    description:
      "Resolve grievances from students, staff, and parents in a timely way.",
    icon: "AlertCircle",
    category: "communication",
  },
  {
    id: "helpdesk",
    title: "Helpdesk",
    description:
      "Centralized ticketing for all stakeholder issues and support requests.",
    icon: "Headphones",
    category: "communication",
  },
  {
    id: "news-portal",
    title: "News Portal",
    description:
      "Publish news and organizational updates across the school community.",
    icon: "Newspaper",
    category: "communication",
  },
  {
    id: "notice-board",
    title: "Notice Board",
    description:
      "Post test schedules, deadlines, and notices well ahead of due dates.",
    icon: "StickyNote",
    category: "communication",
  },
  {
    id: "online-appointment",
    title: "Online Appointment",
    description:
      "Students book and manage all tutor appointments with live schedules.",
    icon: "CalendarCheck",
    category: "communication",
  },
  {
    id: "poll",
    title: "Poll",
    description:
      "Enable students, staff, and parents to vote through structured polls.",
    icon: "Vote",
    category: "communication",
  },
  {
    id: "secure-transcript",
    title: "Secure Transcript",
    description:
      "Verifiable student transcripts and marksheets with QR code validation.",
    icon: "ShieldCheck",
    category: "communication",
  },
  {
    id: "survey",
    title: "Survey",
    description:
      "Collect instant feedback on all school activities via built-in surveys.",
    icon: "ClipboardList",
    category: "communication",
  },

  // ─── LMS (2) ───
  {
    id: "lms",
    title: "LMS",
    description:
      "Unified learning portal for students and faculty with full course tools.",
    icon: "MonitorPlay",
    category: "lms",
  },
  {
    id: "quiz",
    title: "Quiz",
    description:
      "Foster student practice and test preparation with engaging quiz tools.",
    icon: "HelpCircle",
    category: "lms",
  },

  // ─── Technical (11) ───
  {
    id: "customizable",
    title: "Customizable",
    description:
      "Tailor the platform to fit your institution's unique workflow needs.",
    icon: "Settings",
    category: "technical",
  },
  {
    id: "data-import-export",
    title: "Data Import/Export",
    description:
      "Import and export data in widely used formats including CSV and XLS.",
    icon: "ArrowUpDown",
    category: "technical",
  },
  {
    id: "full-web-based",
    title: "Full Web Based",
    description:
      "Deploy on the cloud or on-premise based on your organization's needs.",
    icon: "Globe",
    category: "technical",
  },
  {
    id: "modular",
    title: "Modular",
    description:
      "Add new feature modules on the fly with zero downtime or disruptions.",
    icon: "Blocks",
    category: "technical",
  },
  {
    id: "multi-currency",
    title: "Multi Currency",
    description:
      "Built-in multi-currency support for all international fee transactions.",
    icon: "Coins",
    category: "technical",
  },
  {
    id: "multi-lingual",
    title: "Multi Lingual",
    description:
      "Multi-language interface for broader user accessibility and adoption.",
    icon: "Languages",
    category: "technical",
  },
  {
    id: "multi-organization",
    title: "Multi Organization",
    description:
      "Manage multiple campuses and branches with full data isolation per site.",
    icon: "Network",
    category: "technical",
  },
  {
    id: "on-cloud-on-premise",
    title: "On Cloud On Premise",
    description:
      "Flexible deployment: cloud-hosted or self-hosted on your own servers.",
    icon: "Cloud",
    category: "technical",
  },
  {
    id: "open-source",
    title: "Open Source",
    description:
      "Open source license: full freedom to inspect, modify, and extend code.",
    icon: "Code",
    category: "technical",
  },
  {
    id: "secure",
    title: "Secure",
    description:
      "Granular access controls and role-based permissions safeguard all data.",
    icon: "Lock",
    category: "technical",
  },
  {
    id: "web-service-enabled",
    title: "Web Service Enabled",
    description:
      "Push and pull data to any external system via built-in web services.",
    icon: "Plug",
    category: "technical",
  },

  // ─── Integration (6) ───
  {
    id: "bigbluebutton",
    title: "BigBlueButton",
    description:
      "Live virtual classes with real-time audio, video, and screen sharing.",
    icon: "Video",
    category: "integration",
  },
  {
    id: "google-meet",
    title: "Google Meet",
    description:
      "Host virtual classes with screen sharing, whiteboards, and breakouts.",
    icon: "Video",
    category: "integration",
  },
  {
    id: "microsoft-teams",
    title: "Microsoft Teams",
    description:
      "Chat, call, and collaborate from a unified platform for daily learning.",
    icon: "MessageSquare",
    category: "integration",
  },
  {
    id: "zoom",
    title: "Zoom",
    description:
      "Whiteboard and annotation tools help educators deliver digital lessons.",
    icon: "Video",
    category: "integration",
  },
  {
    id: "whatsapp-integration",
    title: "WhatsApp Integration",
    description:
      "Real-time messaging with parents and students for key announcements.",
    icon: "Phone",
    category: "integration",
  },
  {
    id: "social-media-marketing",
    title: "Social Media Marketing",
    description:
      "Amplify institutional reach through targeted social media campaigns.",
    icon: "Share2",
    category: "integration",
  },

  // ─── AI (1) ───
  {
    id: "ai-powered",
    title: "AI Powered",
    description:
      "Personalized learning paths, automated grading, and smart AI insights.",
    icon: "Sparkles",
    category: "ai",
  },
]

/**
 * Extended feature details for individual feature pages
 */
export const FEATURE_DETAILS: Record<
  string,
  Omit<FeatureDetail, keyof Feature>
> = {
  // ─── Core (6) ───
  admission: {
    longDescription:
      "Admission management software streamlines the admissions process, reducing queues and simplifying enrollment for students and parents. From online applications and document uploads to merit list generation and fee payment, the entire workflow is automated and accessible from anywhere.",
    benefits: [
      "Automated online admission system streamlining all institute processes",
      "Eliminate stressful submission procedures with convenient application forms",
      "Geographical flexibility enabling remote admission and fee payment",
      "Elimination of lengthy queues for clarifications and payments",
      "Labor cost reduction by automating crowd management and procedures",
      "Paperwork reduction through fully automated workflows",
      "Boosted productivity by freeing staff for other activities",
      "Adaptive and user-friendly interface for students, teachers, and parents",
      "Real-time reports in desired formats for all admission data",
    ],
    useCases: [
      "Annual admissions cycle with online applications and merit-based selection",
      "Mid-year transfer applications processed through structured review workflows",
      "Scholarship applicant evaluation with automated scoring and ranking",
    ],
    relatedFeatures: ["application", "financial", "crm"],
  },
  course: {
    longDescription:
      "Course management system software connects educators and learners, enriching the educational journey and aiding institutions in the digital age. Create, deliver, and manage courses with rich interactive content, assessments, and analytics — all from a centralized platform that fosters a dynamic learning environment.",
    benefits: [
      "Online course creation with rich, interactive content accessible from anywhere",
      "Assessment and progress tracking with quizzes, tests, and assignment tools",
      "Centralized course delivery with all materials in one unified platform",
      "Streamlined communication via discussion forums and messaging systems",
      "Efficient assessment and grading with automated feedback distribution",
      "Analytics and reporting for learner engagement and course effectiveness",
      "Resource management for lecture notes, presentations, and videos",
      "Increased engagement through collaborative tools and discussions",
      "Security and privacy protection for sensitive educational data",
      "Scalability accommodating small and large educational institutions",
      "Syllabus management for simplified lesson planning",
      "Enhanced accessibility for students from anywhere with internet",
    ],
    useCases: [
      "Designing and delivering semester-long courses with multimedia content",
      "Tracking student performance across multiple assessments and assignments",
      "Collaborative curriculum planning with shared resource libraries",
    ],
    relatedFeatures: ["timetable", "assignment", "gradebook"],
  },
  exam: {
    longDescription:
      "A unified platform that manages the entire examination process, from conducting and proctoring exams to evaluating them, using an end-to-end automated Examination Management System. Schedule exams using CCE, CPA, and more with just a few clicks while maintaining security and accuracy throughout.",
    benefits: [
      "Streamlined examination scheduling simplifying management of exams and documents",
      "Swift and precise results processing with automated report generation",
      "Improved security protecting exam data against unauthorized access",
      "Reduced workload through automated timetable, hall ticket, and grading tasks",
      "Enhanced communication keeping students, teachers, and admins informed",
      "Online exam system for remote completion and distance learning",
      "Cost-effective with reduced reliance on paper-based processes",
      "User-friendly design for administrators, teachers, and students",
      "Advanced notifications with automatic alerts at each exam stage",
    ],
    useCases: [
      "End-of-term exam scheduling with automated hall ticket generation",
      "Continuous assessment with weekly online quizzes and instant grading",
      "National exam preparation with mock tests and performance analytics",
    ],
    relatedFeatures: ["gradebook", "omr", "quiz"],
  },
  faculty: {
    longDescription:
      "An end-to-end faculty information system that automates every step of the faculty lifecycle from onboarding and recruitment to workload management. Track qualifications, manage schedules, evaluate performance, and balance teaching loads — all from a centralized platform that supports professional development and retention.",
    benefits: [
      "Qualification and certification tracking with expiry alerts",
      "Workload balancing across subjects and classes",
      "Professional development hour tracking and planning",
      "Contract management with renewal reminders",
      "Performance evaluation with customizable rubrics and 360-degree feedback",
      "Substitution preferences and availability tracking",
      "Streamlined onboarding process for new faculty members",
      "Bidirectional communication channels with students and families",
    ],
    useCases: [
      "Annual performance review cycles with structured evaluation forms",
      "Accreditation preparation with staff qualification and compliance reports",
      "Substitute teacher assignment during planned and unplanned absences",
    ],
    relatedFeatures: ["appraisals", "timetable", "leave-request"],
  },
  financial: {
    longDescription:
      "Transform your institution's financial processes with a smarter way to manage finances, enhance transparency, and achieve financial sustainability. From flexible fee structures and online collection to automated reminders and multi-currency support, every aspect of educational financial management is covered.",
    benefits: [
      "Flexible fee structures with tuition, examination, and custom fee types",
      "Student accounting with individual financial records and transaction tracking",
      "Online fee collection through integrated payment gateways",
      "Accounts payable management with invoice processing and approvals",
      "Bank management for deposits, withdrawals, and reconciliation",
      "Fixed asset management tracking depreciation and replacement planning",
      "User-friendly interface reducing the learning curve for staff",
      "Automated reminders notifying students and parents of pending fees",
      "Multi-currency support for international operations",
      "Expense tracking and categorization across operational areas",
      "Financial reporting with detailed statements for decision-making",
      "Cloud-based accessibility from anywhere with internet connection",
    ],
    useCases: [
      "Term-start fee collection with installment plans and automated reminders",
      "Scholarship and financial aid application processing and award management",
      "Overdue payment follow-up with SMS and email escalation workflows",
    ],
    relatedFeatures: ["payment", "accounting", "expense"],
  },
  student: {
    longDescription:
      "Collect and oversee all student-related information in a single location, including personal details, attendance records, disciplinary incidents, accomplishments both in and outside of school, and much more. Administrators, educators, students, and parents each get tailored views with the data most relevant to their role.",
    benefits: [
      "Centralized student data management with personal details and academic progress",
      "Streamlined admission procedures with customizable enrollment forms",
      "Library management with barcode tracking and inventory classification",
      "Attendance tracking with biometric and RFID automation plus parental alerts",
      "Customizable report generation for attendance, fees, and exam results",
      "Automated fee processing with pending balance notifications",
      "Examination administration with scheduling and result distribution",
      "Transportation oversight with real-time GPS vehicle tracking",
      "Alumni networking for student-alumni mentorship connections",
      "Residential services for room assignment and hostel operations",
      "Integrated messaging system via SMS and email for all stakeholders",
      "Mobile access providing complete feature availability from any location",
    ],
    useCases: [
      "New student registration with complete document collection and verification",
      "Class transfers and grade promotions with academic history continuity",
      "Parent meetings with instant access to comprehensive student profiles",
    ],
    relatedFeatures: ["parent-login", "attendance", "gradebook"],
  },

  // ─── Essential (9) ───
  application: {
    longDescription:
      "Streamline your admission process with this all-in-one solution. Collect, process, and complete applications in an easier and more efficient manner — from initial inquiry to final enrollment. Custom forms, document management, and automated status notifications ensure a smooth experience for applicants and staff alike.",
    benefits: [
      "Online application forms with customizable fields and sections",
      "Document upload and verification with checklist tracking",
      "Application scoring and ranking with weighted criteria",
      "Automated status notifications keeping applicants informed at every stage",
      "Batch processing for high-volume admission periods",
      "Integration with enrollment and fee collection systems",
      "Duplicate detection to prevent multiple applications",
      "Application analytics with conversion funnel tracking",
    ],
    useCases: [
      "Annual admissions cycle with thousands of online applications",
      "Mid-year transfer application processing with document review",
      "Scholarship selection with automated scoring and committee review",
    ],
    relatedFeatures: ["admission", "financial", "crm"],
  },
  assignment: {
    longDescription:
      "Streamline every aspect of assignment management, from creation to submission and grading. The platform serves both educators seeking efficient assignment workflows and students needing organizational tools for task management, with real-time tracking and collaborative communication throughout.",
    benefits: [
      "Flexible assignment creation with customizable instructions and file attachments",
      "Streamlined submission process supporting multi-format file uploads",
      "Efficient grading with customizable rubrics and batch grading capabilities",
      "Real-time progress tracking with dashboards and performance reports",
      "Collaborative communication tools including discussion boards and messaging",
      "Mobile access for managing assignments on the go",
      "Real-time notifications for new assignments and approaching deadlines",
      "Integrity and security features protecting academic work",
    ],
    useCases: [
      "Weekly homework distribution with automatic deadline reminders",
      "Group project management with team collaboration and individual grading",
      "Portfolio-based assessment with cumulative assignment submissions",
    ],
    relatedFeatures: ["gradebook", "classroom", "course"],
  },
  attendance: {
    longDescription:
      "Transform your attendance management with a system designed to simplify tracking and reporting with efficiency, accuracy, and user-friendly features. From real-time capture with biometric and RFID integration to automated parent notifications and comprehensive analytics, every aspect of attendance is covered.",
    benefits: [
      "Real-time attendance tracking with instant capture and accurate records",
      "Automated notifications and alerts for absences sent to parents",
      "Comprehensive reporting and analytics identifying attendance trends",
      "Customizable attendance rules tailored to institutional policies",
      "Interactive dashboards for easy navigation and quick access to metrics",
      "Role-based access control ensuring appropriate data security",
      "Classroom management enabling teachers to mark attendance directly",
      "User-friendly interface accessible from any device",
      "Seamless integration with other modules and data synchronization",
      "Biometric integration using fingerprint or facial recognition",
      "RFID integration for fast and accurate tracking with ID cards",
    ],
    useCases: [
      "Morning check-in via biometric kiosk at school entrance",
      "Period-by-period attendance tracking for secondary school classes",
      "Early warning system for chronic absenteeism and intervention planning",
    ],
    relatedFeatures: ["biometric", "face-recognition", "dashboard"],
  },
  classroom: {
    longDescription:
      "A classroom management system designed to help educators organize, administer, and streamline various aspects of classroom activities. From attendance and gradebook management to lesson planning, behavior tracking, and parent communication, everything needed to run effective classrooms is in one place.",
    benefits: [
      "Integrated attendance management with simplified tracking and reporting",
      "Gradebook for recording grades, calculating averages, and sharing progress",
      "Lesson planning tools with curriculum alignment and colleague collaboration",
      "Student behavior tracking with parent and administrator communication",
      "Communication hub for direct messaging, announcements, and newsletters",
      "Centralized resource management for educational materials and documents",
      "Assessment and testing with electronic quizzes and result analysis",
      "Classroom monitoring for screen oversight during computer activities",
      "Reporting and analytics on attendance, grades, and behavioral metrics",
      "Parent portal for dedicated access to progress and teacher communication",
      "Class scheduling with update notifications for all stakeholders",
      "Online assignment submission and collection with teacher feedback",
    ],
    useCases: [
      "Daily classroom management with attendance, lessons, and behavior logs",
      "Parent-teacher communication through the integrated portal",
      "Resource sharing and collaborative lesson planning across departments",
    ],
    relatedFeatures: ["timetable", "attendance", "gradebook"],
  },
  gradebook: {
    longDescription:
      "Accelerate the grading process with a user-friendly and adaptable web-based grading tool, accessible to teachers on any device and from anywhere. Manage grades, track online progress, and generate comprehensive reports — all from a centralized location that supports multiple grading methodologies.",
    benefits: [
      "Grade entry and calculation for assignments, exams, quizzes, and assessments",
      "Real-time access to grades and academic progress for all stakeholders",
      "Report generation including progress reports, report cards, and transcripts",
      "Grade history maintenance and complete record tracking",
      "Student and parent portal access for transparent grade viewing",
      "Homework assignment and collection management",
      "Analytics and performance insights with trend visualization",
      "Support for traditional, pass/fail, grade bands, and gamification grading",
      "Customizable grading scales with course-specific weighting",
    ],
    useCases: [
      "Term-end report card generation with weighted grade calculations",
      "Continuous assessment tracking with real-time parent visibility",
      "Custom grading rubrics for project-based and portfolio assessments",
    ],
    relatedFeatures: ["exam", "course", "reporting"],
  },
  "leave-request": {
    longDescription:
      "Enhance the overall user experience by providing options to send leave requests to different groups or sections of people. Students, faculty, and staff can submit, track, and manage leave requests through a structured approval workflow with automated notifications and calendar integration.",
    benefits: [
      "Online leave request submission with reason and date selection",
      "Multi-level approval workflows with configurable approvers",
      "Calendar integration showing leave schedules and availability",
      "Automated notifications for request status updates",
      "Leave balance tracking with policy-based accrual",
      "Reporting and analytics on leave patterns and utilization",
    ],
    useCases: [
      "Student leave request for family events with parent authorization",
      "Faculty leave planning with automatic substitution assignment",
      "Staff medical leave with document upload and HR approval",
    ],
    relatedFeatures: ["faculty", "attendance", "timesheet"],
  },
  payment: {
    longDescription:
      "An efficient and integrated financial management suite that helps manage payments for student fees and course enrollment quickly and easily. Multiple payment gateways, installment plans, and automated receipts ensure a smooth payment experience for parents while giving administrators real-time collection visibility.",
    benefits: [
      "Multiple payment gateway integration for online transactions",
      "Installment plan support with flexible scheduling",
      "Automated receipt generation and email delivery",
      "Real-time payment status tracking and reconciliation",
      "Partial payment handling with balance carry-forward",
      "Payment history and transaction logs for auditing",
      "Parent-friendly interface for quick and secure payments",
      "Integration with accounting for automatic ledger entries",
    ],
    useCases: [
      "Online tuition payment via credit card or bank transfer",
      "Installment setup for families needing flexible payment schedules",
      "Bulk fee collection during enrollment season with real-time tracking",
    ],
    relatedFeatures: ["financial", "accounting", "e-commerce"],
  },
  timetable: {
    longDescription:
      "Managing timetables can be a complex and time-consuming task for educational institutions. Our Timetable Management System simplifies and automates the scheduling process, ensuring that your school's operations run smoothly and efficiently with easy session scheduling and instant notifications.",
    benefits: [
      "Easy timetable management with intuitive scheduling tools",
      "Pre-set timetables for quick configuration across all classes",
      "Custom class timings with various timing sets for different periods",
      "Simple subject allocation linking subjects to teachers effortlessly",
      "Teacher access to personal schedules from their login",
      "Student timetable access for weekly or daily schedule viewing",
      "Classroom management optimizing room allocations and resources",
      "Institutional reports with detailed timetable analysis",
      "Instant swap notifications automatically alerting teachers of changes",
    ],
    useCases: [
      "Beginning-of-year timetable creation across all grades and sections",
      "Mid-year schedule adjustments when new sections or teachers are added",
      "Daily substitution management with automatic teacher notification",
    ],
    relatedFeatures: ["classroom", "timesheet", "course"],
  },
  timesheet: {
    longDescription:
      "A powerful timesheet tool designed for teachers, mentors, tutors, faculty, and staff to record attendance, productivity, and work hours from any device or location. Track time, manage resources, and generate comprehensive reports on billable hours and team performance.",
    benefits: [
      "Time logging with easy check-in/check-out from any location",
      "Student attendance monitoring and class participation tracking",
      "Work hours tracking with automatic recording for faculty and staff",
      "Resource management identifying where time is spent for optimization",
      "Automated records eliminating manual data entry with auto-tagging",
      "Billable hours reporting with detailed cost analysis",
      "Performance analytics with weekly timesheet assessments",
      "Project reporting with comprehensive details on activities and earnings",
    ],
    useCases: [
      "Faculty work hours tracking for payroll integration",
      "Student time-on-task monitoring for blended learning programs",
      "Department resource allocation analysis based on time data",
    ],
    relatedFeatures: ["attendance", "payroll", "reporting"],
  },

  // ─── Advance (21) ───
  "advance-accounting": {
    longDescription:
      "Quick, accurate, and cost-effective cloud-based accounting software designed for schools, universities, and educational institutes. With built-in best practices for managing invoices, expenses, payments, and taxes, it provides a comprehensive financial management solution accessible from anywhere.",
    benefits: [
      "Powerful income tax calculation and preparation tools",
      "Automated invoice creation with professional templates",
      "Automated follow-ups and payment reminders for overdue fees",
      "Multiple invoice reconciliation and payment terms support",
      "Auto-generated draft invoices for recurring charges",
      "Customizable dashboards for financial performance analysis",
      "Key performance indicators with custom formula support",
      "Fully-integrated financial statements including P&L and balance sheets",
      "Cash flow statements and general ledger management",
      "Country-specific tax report generation",
      "Data-driven decision-making through intelligent analytics",
    ],
    useCases: [
      "End-of-month financial closing with automated report generation",
      "Tax preparation with country-specific compliance reports",
      "Budget planning with real-time expense tracking and forecasting",
    ],
    relatedFeatures: ["accounting", "financial", "expense"],
  },
  "assignment-annotation": {
    longDescription:
      "Assignment annotation enhances understanding, critical thinking, and work quality by enabling educators to add notes, comments, and markup digitally. Teachers can provide detailed inline feedback on student submissions, highlight areas for improvement, and track revision history.",
    benefits: [
      "Inline annotation tools for detailed feedback on submissions",
      "Highlight and markup capabilities for visual feedback",
      "Comment threads for ongoing discussion on specific sections",
      "Revision history tracking showing improvement over time",
      "Digital pen support for handwriting-style annotations",
      "Batch annotation for common feedback across multiple submissions",
    ],
    useCases: [
      "Essay grading with inline comments and margin notes",
      "Code review for programming assignments with line-level feedback",
      "Art and design project critique with visual markup tools",
    ],
    relatedFeatures: ["assignment", "gradebook", "lms"],
  },
  "automated-marketing": {
    longDescription:
      "Make your marketing campaigns smarter and more efficient by integrating email marketing with CRM and leveraging analytics to drive enrollment. Automate follow-ups, segment audiences, and track campaign performance from a single platform that connects marketing efforts to admissions outcomes.",
    benefits: [
      "Automated email campaigns with scheduling and triggers",
      "CRM integration for lead tracking and nurturing",
      "Audience segmentation for targeted messaging",
      "Campaign analytics with open rates and conversion tracking",
      "Landing page creation for enrollment campaigns",
      "A/B testing for optimizing campaign performance",
      "Social media integration for multi-channel marketing",
      "ROI tracking connecting marketing spend to enrollment outcomes",
    ],
    useCases: [
      "Admission season email campaign targeting prospective parents",
      "Automated drip campaign nurturing leads from inquiry to enrollment",
      "Event promotion with targeted invitations and RSVP tracking",
    ],
    relatedFeatures: ["crm", "email-marketing", "social-media-marketing"],
  },
  biometric: {
    longDescription:
      "The Biometric Attendance Management System, seamlessly integrated with the online platform, offers a robust and efficient solution for maintaining accurate attendance records. With support for 100+ biometric devices and real-time monitoring, it eliminates manual errors and prevents fraudulent attendance.",
    benefits: [
      "Real-time attendance monitoring for students and employees",
      "Integration with 100+ biometric devices and scanners",
      "Web-based check-in/out contingency options",
      "Automated data synchronization to the central system",
      "Elimination of manual entry errors and fraudulent records",
      "Streamlined payroll processing with precise hour calculations",
      "Transparency for tracking overtime and late arrivals",
      "Cost savings by reducing manual attendance management time",
      "Secure prevention of unauthorized access through biometric authentication",
      "Scalable solution serving 300K+ monthly check-ins globally",
    ],
    useCases: [
      "School entrance check-in with fingerprint scanners",
      "Faculty time tracking integrated with payroll calculations",
      "Exam hall verification ensuring only registered students enter",
    ],
    relatedFeatures: ["attendance", "face-recognition", "payroll"],
  },
  dashboard: {
    longDescription:
      "Role-specific dashboards that surface the most relevant data for each user type. Principals see school-wide KPIs, teachers see class performance, accountants see financial summaries, and parents see their children's progress. Interactive charts, trend analysis, and drill-down capabilities make data accessible and actionable.",
    benefits: [
      "Role-specific views for principals, teachers, accountants, and parents",
      "Interactive charts with drill-down capability",
      "Trend analysis with year-over-year comparisons",
      "Custom dashboard widgets and configurable layouts",
      "Real-time data refresh for live monitoring",
      "Export data to PDF and spreadsheet formats",
      "Mobile-responsive design for on-the-go access",
      "Quick action shortcuts for common tasks",
    ],
    useCases: [
      "Principal reviewing school-wide performance and enrollment metrics",
      "Accountant monitoring fee collection progress and outstanding balances",
      "Teacher tracking class assignment completion rates and grade distributions",
    ],
    relatedFeatures: ["kpi-dashboard", "reporting", "accounting"],
  },
  "digital-library": {
    longDescription:
      "Digital libraries are the new phase of this digital era. Students can access the library to manage online digital content, websites, ebooks, video resources, catalog, and inventory in multiple formats including text, images, videos, and audio — all with real-time flipbook experiences and detailed material metadata.",
    benefits: [
      "Multiple simultaneous access to published books and resources",
      "Real-time flipbook experience mimicking traditional reading",
      "User engagement tracking with time spent per page analytics",
      "Detailed material pages with publisher, author, and category metadata",
      "User review functionality for community-driven recommendations",
      "Support for multiple formats: text, images, videos, and audio",
      "Centralized catalog and inventory management",
      "Teacher resource library for curriculum materials",
    ],
    useCases: [
      "Student research using searchable digital book collections",
      "Teacher resource sharing across departments and campuses",
      "Remote learning support with 24/7 digital library access",
    ],
    relatedFeatures: ["library", "lms", "course"],
  },
  documents: {
    longDescription:
      "Get faculty and students to use the same platform for managing school documents and check compliance on an easy-to-use website. With digital storage, automated workflows, and complete audit trails, transition toward paperless operations while maintaining security and collaboration.",
    benefits: [
      "Instant document access from browser with intuitive navigation",
      "Streamlined document processes with automated workflows",
      "Enhanced security with centralized document storage",
      "Digital document storage enabling paperless operations",
      "Customizable document management workflows and access levels",
      "Complete audit trails for transparency and accountability",
      "Collaborative environment for sharing and simultaneous editing",
      "Integration with all apps for creating, moving, and sharing files",
    ],
    useCases: [
      "Student enrollment document collection and compliance verification",
      "Faculty contract management with version tracking and e-signatures",
      "Accreditation document preparation with organized evidence portfolios",
    ],
    relatedFeatures: ["e-sign", "admission", "secure-transcript"],
  },
  events: {
    longDescription:
      "Easily organize events, sell tickets, track attendees, and communicate with them before, during, and after the event. From academic ceremonies and sports days to parent meetings and cultural programs, manage every aspect of school events with automated planning and real-time coordination.",
    benefits: [
      "Event creation with customizable details and scheduling",
      "Ticket sales and registration management",
      "Attendee tracking with check-in and capacity monitoring",
      "Automated communications before, during, and after events",
      "Calendar integration with school-wide event scheduling",
      "Photo and media management for event documentation",
      "Budget tracking for event expenses and revenue",
      "Post-event surveys and feedback collection",
    ],
    useCases: [
      "Annual day celebration with online ticket sales and attendee management",
      "Parent-teacher conference scheduling with automated reminders",
      "Sports day organization with team registration and results tracking",
    ],
    relatedFeatures: ["notice-board", "survey", "online-appointment"],
  },
  "e-sign": {
    longDescription:
      "Streamline the documentation process of educational institutions by utilizing e-sign. Combine affordable tools with paperless processes to simplify document management through digital signatures, configurable workflows, and bulk sending capabilities for maximum efficiency.",
    benefits: [
      "Multiple signing options: self-signature, in-person, and remote requests",
      "Configurable workflows defining signing order and delivery methods",
      "Real-time status tracking with alerts for document signing progress",
      "Bulk send capability for documents to multiple signers simultaneously",
      "Reusable templates for frequently used document types",
      "Secure digital signatures with legal compliance",
      "Audit trail for all signature activities and document history",
      "Mobile-friendly signing for approvals on the go",
    ],
    useCases: [
      "Admission form processing with parent digital signatures",
      "Faculty contract execution with multi-party approval workflows",
      "Permission slips and field trip consent forms sent in bulk to parents",
    ],
    relatedFeatures: ["documents", "multi-approvals", "admission"],
  },
  "face-recognition": {
    longDescription:
      "The biometric face recognition system digitizes attendance management, reducing the chances of manual errors or proxy attendance. Automatically mark attendance through contactless biometric integration that works on mobile devices, tablets, and touchless kiosks without requiring complicated hardware.",
    benefits: [
      "Mobile and tablet-based access on Android or iOS platforms",
      "Automated attendance tracking with corresponding report generation",
      "Centralized controls viewing all attendance data from one location",
      "Advanced recognition working regardless of expressions or masks",
      "Touchless kiosk mode for hygienic contactless attendance",
      "Elimination of manual entry errors and proxy attendance fraud",
      "Reduced administrative burden on teaching staff",
      "Accurate recognition technology with centralized data visibility",
    ],
    useCases: [
      "Contactless morning check-in via face recognition kiosk",
      "Exam hall identity verification ensuring registered students only",
      "Campus security with face-based access control at entry points",
    ],
    relatedFeatures: ["biometric", "attendance", "secure"],
  },
  "kpi-dashboard": {
    longDescription:
      "Monitor all your departments from a real-time dashboard. A simple yet attractive and effective tool that allows users a comprehensive overview of the health of the business or organization with 8 types of graphical displays, customizable templates, and flexible export options.",
    benefits: [
      "Eight types of graphical displays: line, bar, pie, doughnut, area, and more",
      "Configurable target lines and bars within visualizations",
      "Various template styles with customizable colors and layouts",
      "Export to Excel, PDF, and PNG formats",
      "Auto-refresh at configurable intervals for live monitoring",
      "Date filtering with 7-day, 30-day, 90-day, and custom ranges",
      "Responsive design optimized for desktop, tablet, and mobile",
      "Custom KPI formulas for department-specific metrics",
    ],
    useCases: [
      "Principal monitoring school-wide KPIs with auto-refreshing dashboards",
      "Finance department tracking revenue and expense trends with visual charts",
      "Board presentation with exported PDF reports and visualizations",
    ],
    relatedFeatures: ["dashboard", "reporting", "advance-accounting"],
  },
  library: {
    longDescription:
      "Easily manage your school's library with a comprehensive Library Management System. Streamline book tracking, cataloging, and lending processes to keep your library organized and accessible to students, teachers, and faculty with barcode integration and real-time inventory updates.",
    benefits: [
      "Automated cataloging of books, journals, and digital resources",
      "Efficient borrowing and returning with barcode scanning",
      "Advanced search capabilities with powerful filters and sorting",
      "Real-time inventory management with alerts for overdue items",
      "Member management with borrowing history and rule enforcement",
      "Barcode integration speeding up circulation and reducing errors",
      "Automatic fine management with overdue calculations and reminders",
      "Mobile access for librarians to perform functions from any device",
      "Reports and analytics on borrowing trends and popular titles",
    ],
    useCases: [
      "Student book checkout and return with barcode scanning at the desk",
      "Librarian inventory audit with real-time stock level tracking",
      "Overdue book management with automated fine calculation and parent notification",
    ],
    relatedFeatures: ["digital-library", "student", "reporting"],
  },
  "live-classroom": {
    longDescription:
      "A dynamic set of teaching and learning tools designed to simulate a physical classroom learning environment. From real-time attendance and proctored assignments to participation tracking and virtual desk views, everything needed for effective online instruction is built in.",
    benefits: [
      "Fast and accurate attendance management via class roster",
      "Proctored assignments with real-time assessment delivery",
      "Full monitor view with side-by-side student display",
      "Graded results integrated directly into the online gradebook",
      "Participation tracking with automatic engagement-level sorting",
      "Student talking time recording for balanced discussion",
      "Virtual desk view with real-time graphical seating chart",
      "Class dashboard with comprehensive analytics and progress tracking",
    ],
    useCases: [
      "Remote class delivery with live attendance and participation tracking",
      "Proctored online exams with real-time monitoring and anti-cheating",
      "Hybrid learning sessions combining in-person and remote students",
    ],
    relatedFeatures: ["zoom", "google-meet", "lms"],
  },
  "mobile-application": {
    longDescription:
      "Provide students, parents, and faculty with an efficient and convenient way to access information about classes, assignments, and events from their mobile devices. A fully responsive mobile experience ensures that every feature of the platform is accessible on the go.",
    benefits: [
      "Full platform access from iOS and Android devices",
      "Push notifications for assignments, grades, and announcements",
      "Offline access for viewing downloaded content and schedules",
      "Mobile attendance marking for teachers in the classroom",
      "Parent portal access for grades, attendance, and fee payments",
      "Camera integration for document scanning and uploads",
      "Location-based features for campus navigation and events",
      "Secure biometric login for quick and safe access",
    ],
    useCases: [
      "Parent checking child's grades and attendance during commute",
      "Teacher marking attendance on tablet during class",
      "Student receiving push notifications for upcoming assignment deadlines",
    ],
    relatedFeatures: ["parent-login", "attendance", "dashboard"],
  },
  "multi-approvals": {
    longDescription:
      "Handle all educational institution requests in one centralized platform with the option to create different approval types based on defined models. From new custom approval workflows to pre-configured business document approvals, streamline every request through a clear four-step process.",
    benefits: [
      "New model approvals with customizable fields matching specific requirements",
      "Pre-configured approvals for sale orders, purchase orders, and invoices",
      "Four-step workflow: Employee → Request → Manager → Approved",
      "Flexible approver assignment with manager or line manager options",
      "HR extension packages for leave and recruitment approvals",
      "Complete audit trail for all approval activities",
      "Mobile-friendly approval for on-the-go decision making",
      "Integration with all business processes and documents",
    ],
    useCases: [
      "Purchase request approval with department head and finance review",
      "Leave request routing through direct manager to HR for processing",
      "Student scholarship application with multi-committee review stages",
    ],
    relatedFeatures: ["e-sign", "purchase", "leave-request"],
  },
  "no-code-studio": {
    longDescription:
      "Focus on development without coding. Build and launch full-fledged applications with a no-code platform featuring screen designers for forms, lists, and calendars, plus powerful automation for emails, updates, and custom logic — all through drag-and-drop interfaces.",
    benefits: [
      "Feature-rich form builder with notebooks and integrated statistics",
      "Spreadsheet-style lists with read-only and read-write modes",
      "Calendar views linked to document schedules",
      "Menu editor with drag-and-drop organization",
      "Advanced search with access rights, filters, and group categorization",
      "Conditional field properties for dynamic form behavior",
      "Automated email generation based on actions and conditions",
      "Python code integration for advanced custom automation",
      "Automated value updates based on predefined conditions",
    ],
    useCases: [
      "Custom student registration form with conditional fields by grade level",
      "Automated email notifications triggered by assignment submission",
      "Department-specific dashboards built without developer involvement",
    ],
    relatedFeatures: ["customizable", "dashboard", "reporting"],
  },
  omr: {
    longDescription:
      "OMR sheet checking and uploading made easy. Simply the best OMR sheet processing solution for educational institutions — conduct objective or MCQ exams with ease, and students can upload answer sheets from mobile phones, PCs, or tablets without any external hardware requirements.",
    benefits: [
      "No external hardware required — compatible with any ADF scanner",
      "Speed and accuracy processing 1000s of sheets in minutes with zero errors",
      "User-friendly interface following international standards",
      "Advanced analytics and reporting for comprehensive exam analysis",
      "Pre-designed sheets ready for instant classroom use",
      "Versatile applications for exams, surveys, and recruitment assessments",
      "Tilted or skewed sheet processing without manual correction",
      "Mobile upload support for student convenience",
    ],
    useCases: [
      "Large-scale objective exam grading with instant result processing",
      "Competitive exam preparation with practice OMR sheets",
      "Survey data collection using pre-designed OMR answer forms",
    ],
    relatedFeatures: ["exam", "quiz", "reporting"],
  },
  "quiz-anti-cheating": {
    longDescription:
      "Quiz Anti-Cheating mode acts as a strict invigilator during online examinations, detecting whether students are seriously participating or attempting to cheat. Monitor tab switches, screen activity, and engagement levels to ensure assessment integrity in remote and hybrid learning environments.",
    benefits: [
      "Tab-switch detection alerting when students leave the exam window",
      "Screen activity monitoring for suspicious behavior patterns",
      "Engagement-level tracking measuring active participation",
      "Automated flagging of potential cheating incidents for review",
      "Configurable strictness levels for different exam types",
      "Post-exam integrity reports for instructor review",
      "Browser lockdown mode preventing access to other applications",
      "Webcam proctoring integration for visual verification",
    ],
    useCases: [
      "High-stakes final exams with full anti-cheating mode enabled",
      "Remote quiz administration with browser lockdown for integrity",
      "Post-exam review of flagged incidents for academic honesty decisions",
    ],
    relatedFeatures: ["quiz", "exam", "live-classroom"],
  },
  reporting: {
    longDescription:
      "Easily analyze your data, gain insights, and generate reports on various departments and activities in your organization. From attendance and academic performance to financial summaries and operational metrics, comprehensive reporting tools transform raw data into actionable intelligence.",
    benefits: [
      "Customizable report templates for different departments",
      "Automated report scheduling and email distribution",
      "Drag-and-drop report builder for custom analytics",
      "Multi-format export to PDF, Excel, and CSV",
      "Real-time data visualization with interactive charts",
      "Cross-module reporting combining data from multiple sources",
      "Drill-down capabilities for detailed data exploration",
      "Role-based report access ensuring data security",
    ],
    useCases: [
      "Board meeting preparation with comprehensive school performance reports",
      "Accreditation reporting with pre-built compliance templates",
      "Monthly financial summary generation for school administration",
    ],
    relatedFeatures: ["dashboard", "kpi-dashboard", "advance-accounting"],
  },
  thesis: {
    longDescription:
      "Streamline thesis management for a smarter research journey by digitizing every step — from proposal submission through final approval. Students, supervisors, and administrators can collaborate efficiently with centralized document management, progress tracking, and plagiarism detection integration.",
    benefits: [
      "Online proposal submission with real-time status tracking",
      "Automated supervisor assignment based on research interests and availability",
      "Centralized document management for all thesis-related files",
      "Online review with annotation tools for detailed feedback",
      "Progress tracking dashboard with milestone monitoring and reminders",
      "Plagiarism detection integration ensuring research originality",
      "Electronic final submission with secure long-term archiving",
      "Insightful reporting on submission rates and completion timelines",
    ],
    useCases: [
      "Graduate thesis lifecycle from proposal to defense and archiving",
      "Supervisor workload management with automated student matching",
      "Plagiarism screening before final thesis submission and approval",
    ],
    relatedFeatures: ["documents", "assignment", "lms"],
  },
  convocation: {
    longDescription:
      "All-in-one convocation management for modern institutions. Streamline graduation ceremonies from planning through guest check-in via a complete cloud-based solution with online registration, automated fee collection, QR-verified pass generation, and multi-language support.",
    benefits: [
      "Online student registration through a dedicated portal",
      "Streamlined fee collection with integrated receipts and financial tracking",
      "Automatic convocation pass generation with QR code verification",
      "Deadline scheduling with automated reminder notifications",
      "Multi-language support for registration forms and communications",
      "Elimination of manual paperwork through automation",
      "Real-time data syncing reducing errors across the platform",
      "Customizable forms and event settings matching institutional traditions",
    ],
    useCases: [
      "Annual graduation ceremony management with online registration",
      "Convocation pass distribution with QR code verification at entry",
      "Multi-campus convocation coordination with centralized planning",
    ],
    relatedFeatures: ["events", "secure-transcript", "payment"],
  },

  // ─── ERP (13) ───
  accounting: {
    longDescription:
      "Manage financial activities like invoicing, receipts, payments, overdues, and balances all using one single integrated system. From bill management and reconciliation to compliance reports and financial statements, every aspect of institutional accounting is covered.",
    benefits: [
      "Integrated invoicing with receipt and payment management",
      "Bill management with automated reconciliation",
      "Overdue tracking with automated reminder workflows",
      "Compliance report generation for regulatory requirements",
      "Financial statement preparation including balance sheets",
      "Multi-department budget tracking and allocation",
      "Vendor payment management with approval workflows",
      "Real-time financial dashboard with key metrics",
    ],
    useCases: [
      "Monthly fee invoice generation and payment reconciliation",
      "Year-end financial statement preparation for auditing",
      "Vendor payment processing with multi-level approval workflows",
    ],
    relatedFeatures: ["advance-accounting", "financial", "expense"],
  },
  appraisals: {
    longDescription:
      "Streamline the evaluation process, gain insightful information, and implement periodical employee evaluations with 360-degree feedback. Automated workflows, customizable rubrics, and structured review cycles ensure consistent and fair performance assessments across the organization.",
    benefits: [
      "360-degree feedback from peers, supervisors, and students",
      "Automated evaluation workflows with periodic scheduling",
      "Customizable appraisal forms and evaluation criteria",
      "Goal setting and tracking integrated with reviews",
      "Performance trend analysis across review periods",
      "Self-assessment capabilities for employee reflection",
      "Automated notification reminders for pending evaluations",
      "Comprehensive reporting on department and individual performance",
    ],
    useCases: [
      "Annual teacher performance review with multi-source feedback",
      "Probation period evaluation with milestone-based assessments",
      "Department-wide performance benchmarking and comparison",
    ],
    relatedFeatures: ["faculty", "recruitment", "reporting"],
  },
  "assets-request": {
    longDescription:
      "Effectively track and manage the physical assets of the institution. From equipment requests and usability monitoring to inward/outward movement tracking of key assets like laptops, improve operational efficiency, reduce costs, and ensure assets are properly maintained and accounted for.",
    benefits: [
      "Equipment request workflow for students and faculty",
      "Asset usability monitoring and condition tracking",
      "Inward/outward movement tracking with calendar highlights",
      "Depreciation tracking and replacement planning",
      "Barcode and QR code asset identification",
      "Maintenance scheduling with automated reminders",
      "Asset allocation reports by department and user",
      "Integration with procurement for new asset requests",
    ],
    useCases: [
      "Student laptop checkout and return with condition tracking",
      "Lab equipment maintenance scheduling and replacement planning",
      "Department asset inventory audit with barcode scanning",
    ],
    relatedFeatures: ["purchase", "stock", "accounting"],
  },
  crm: {
    longDescription:
      "Automate lead and opportunity tracking with a state-of-the-art CRM system built in, giving an unparalleled competitive advantage. From lead management and activity planning to integrated communications, track every prospective student from initial inquiry through enrollment.",
    benefits: [
      "Lead management with automated capture and scoring",
      "Opportunity tracking through the enrollment pipeline",
      "Activity planning with task scheduling and follow-ups",
      "Integrated communications via email, phone, and messaging",
      "Campaign tracking connecting marketing to enrollment outcomes",
      "Contact management with complete interaction history",
      "Pipeline visualization with customizable stages",
      "Automated reports on conversion rates and source effectiveness",
    ],
    useCases: [
      "Prospective parent inquiry management with automated follow-up sequences",
      "Enrollment pipeline tracking from open house to registration",
      "Marketing campaign effectiveness analysis by lead source",
    ],
    relatedFeatures: ["admission", "automated-marketing", "email-marketing"],
  },
  "e-commerce": {
    longDescription:
      "Collect fees online, sell products and artifacts using an integrated e-commerce platform without the need for any other tools. With 200+ themes and 50+ payment gateway integrations, create a user-friendly shopping experience with personalized features like recommendations, wish lists, and promotions.",
    benefits: [
      "Integrated online fee collection through the store platform",
      "200+ customizable themes for institutional branding",
      "50+ payment gateway integrations for global transactions",
      "Product catalog for uniforms, books, and merchandise",
      "Wish list and recommendation features for personalized shopping",
      "Promotional tools with discount codes and seasonal sales",
      "Order tracking and fulfillment management",
      "Mobile-responsive storefront accessible from any device",
    ],
    useCases: [
      "Online uniform and supply store for parents to order before school starts",
      "School merchandise shop with branded items and promotional pricing",
      "Digital content store for supplementary learning materials and guides",
    ],
    relatedFeatures: ["payment", "stock", "financial"],
  },
  "email-integration": {
    longDescription:
      "Integrated emailing for tracking emails sent, the ability to schedule emails, and the ability to see a history of all emails sent. Send emails from any system record with automatic updates, supporting SMTP, POP, and IMAP protocols for enhanced customizability.",
    benefits: [
      "Send emails directly from any system record or module",
      "Email scheduling for timed delivery of communications",
      "Complete email history and tracking for all contacts",
      "SMTP, POP, and IMAP protocol support",
      "Automatic email updates triggered by system events",
      "Template management for consistent communications",
      "Email open and click tracking for engagement metrics",
      "Integration with all modules for contextual messaging",
    ],
    useCases: [
      "Automated admission status update emails to applicants",
      "Scheduled fee reminder emails sent before due dates",
      "Event invitation emails with RSVP tracking from the events module",
    ],
    relatedFeatures: ["email-marketing", "discussion", "notice-board"],
  },
  "email-marketing": {
    longDescription:
      "Send mass emails to students, parents, or future prospective students and keep them informed about your new offerings. Build campaigns, segment audiences, and track engagement metrics to maximize the impact of every communication sent.",
    benefits: [
      "Mass email campaigns with professional templates",
      "Audience segmentation for targeted messaging by role or group",
      "Campaign builder with drag-and-drop email designer",
      "Engagement tracking with open rates and click-through metrics",
      "A/B testing for subject lines and content optimization",
      "Automated drip campaigns for nurturing prospective students",
      "Unsubscribe management for compliance with regulations",
      "Performance reporting with campaign comparison analytics",
    ],
    useCases: [
      "Admission season outreach to prospective parents with school highlights",
      "Newsletter distribution to current families with school updates",
      "Alumni engagement campaigns for fundraising and events",
    ],
    relatedFeatures: ["automated-marketing", "crm", "email-integration"],
  },
  expense: {
    longDescription:
      "Manage expenses more efficiently, reduce the risk of errors, optimize budget utilization, and improve financial reporting and decision-making. Streamline daily expense tracking and approvals with department-wise reporting and reimbursement management.",
    benefits: [
      "Daily expense tracking with receipt capture and categorization",
      "Multi-level approval workflows for expense authorization",
      "Department-wise reporting for budget monitoring",
      "Reimbursement management with automated processing",
      "Policy enforcement with spending limits and rules",
      "Integration with accounting for automatic ledger entries",
      "Mobile expense submission with photo receipt upload",
      "Trend analysis for cost optimization and forecasting",
    ],
    useCases: [
      "Teacher reimbursement for classroom supplies with receipt upload",
      "Department budget tracking with real-time spending visibility",
      "Field trip expense management with advance request and settlement",
    ],
    relatedFeatures: ["accounting", "advance-accounting", "financial"],
  },
  payroll: {
    longDescription:
      "Easily manage payroll for all types of employees with batch payslip creation integrated with daily attendance. From contracts and allowances to self-service portals, automate the entire payroll process while maintaining accuracy and compliance.",
    benefits: [
      "Batch payslip creation for efficient mass processing",
      "Attendance integration for accurate hour calculations",
      "Contract management with allowances and deductions",
      "Self-service portal for employees to view payslips",
      "Tax calculation and statutory compliance automation",
      "Multiple pay structure support for different employee types",
      "Bank file generation for direct deposit processing",
      "Payroll reporting with department-wise cost analysis",
    ],
    useCases: [
      "Monthly payroll processing with automated attendance-based calculations",
      "New hire onboarding with contract setup and salary configuration",
      "Year-end tax report generation for all employees",
    ],
    relatedFeatures: ["timesheet", "accounting", "biometric"],
  },
  purchase: {
    longDescription:
      "Create indents and manage all organization-wide purchases from a centralized procurement management system with ease. From purchase authorization and tender management to vendor coordination and order tracking, streamline every step of the procurement cycle.",
    benefits: [
      "Centralized indent creation and management",
      "Purchase authorization with multi-level approval workflows",
      "Tender management for competitive procurement",
      "Vendor management with performance tracking",
      "Purchase order generation and tracking",
      "Budget validation before purchase approval",
      "Delivery tracking with receipt confirmation",
      "Procurement analytics and spending reports",
    ],
    useCases: [
      "Annual supply procurement with vendor comparison and tender evaluation",
      "Department purchase requests with budget validation and approval routing",
      "Lab equipment procurement with specification matching and vendor selection",
    ],
    relatedFeatures: ["assets-request", "stock", "expense"],
  },
  recruitment: {
    longDescription:
      "Recruit organizational staff with a built-in recruitment portal providing all the insights into workforce needs. Streamline hiring with customizable processes, application management, and comprehensive candidate evaluation tools.",
    benefits: [
      "Built-in recruitment portal with job posting capabilities",
      "Application management with resume parsing and tracking",
      "Customizable hiring workflows with stage-based processing",
      "Candidate evaluation with interview scheduling",
      "Workforce planning insights for staffing needs analysis",
      "Offer letter generation and onboarding integration",
      "Applicant communication with automated status updates",
      "Recruitment analytics with time-to-hire and source tracking",
    ],
    useCases: [
      "Teaching position posting with qualification screening and interview scheduling",
      "Administrative staff hiring with multi-round evaluation process",
      "Seasonal recruitment drive for substitute teachers and support staff",
    ],
    relatedFeatures: ["faculty", "appraisals", "payroll"],
  },
  sales: {
    longDescription:
      "Streamline the sales process, including quote to invoicing activities to bring more productivity to the organization. From quotation management and order processing to invoice generation, manage the entire sales cycle efficiently.",
    benefits: [
      "Quotation management with customizable templates",
      "Order processing with automated workflow stages",
      "Invoice generation integrated with accounting",
      "Customer relationship tracking with interaction history",
      "Sales pipeline visualization with conversion analytics",
      "Discount and promotion management for fee structures",
      "Multi-channel sales tracking and reporting",
      "Revenue forecasting based on pipeline and historical data",
    ],
    useCases: [
      "Course enrollment quotation and fee structure presentation",
      "Institutional merchandise and uniform sales management",
      "Partnership and sponsorship deal tracking with invoicing",
    ],
    relatedFeatures: ["e-commerce", "accounting", "crm"],
  },
  stock: {
    longDescription:
      "Keep track of all stockable items and articles with barcode-enabled inventory management. Ensure accurate and up-to-date inventory levels with multi-location operations and full traceability, reducing the risk of stockouts and overstocking.",
    benefits: [
      "Barcode-enabled inventory tracking and management",
      "Multi-location stock management across campuses",
      "Real-time inventory levels with low-stock alerts",
      "Full traceability from receipt to consumption",
      "Batch and serial number tracking for asset items",
      "Stock movement reports and consumption analytics",
      "Automated reorder points for replenishment planning",
      "Integration with purchase orders for seamless procurement",
    ],
    useCases: [
      "School supply inventory management with automated reorder alerts",
      "Lab consumable tracking with batch-level traceability",
      "Multi-campus stock transfer and inter-location management",
    ],
    relatedFeatures: ["purchase", "assets-request", "accounting"],
  },

  // ─── Management (5) ───
  canteen: {
    longDescription:
      "Barcode-supported built-in point-of-sale system enabling the organization to manage the cafeteria for students and faculty. With full POS functionality, kitchen order support, and student credit payments, streamline canteen operations while providing convenient meal management.",
    benefits: [
      "Full-functional point-of-sale system for cafeteria operations",
      "Barcode support for quick item scanning and checkout",
      "Kitchen order terminal support for efficient meal preparation",
      "Student credit payment system linked to accounts",
      "Menu management with daily and weekly rotation planning",
      "Nutritional information tracking and dietary compliance",
      "Sales reporting with item popularity and revenue analytics",
      "Integration with financial system for revenue reconciliation",
    ],
    useCases: [
      "Daily cafeteria operations with barcode-based meal purchases",
      "Student meal plan management with prepaid credit system",
      "Menu planning and nutritional compliance tracking for school meals",
    ],
    relatedFeatures: ["payment", "financial", "stock"],
  },
  campus: {
    longDescription:
      "Easy-to-use campus management system to manage, book, and transact with various campus entities and amenities. From full asset management and allocation to calendar-synchronized facility booking, optimize campus resource utilization across all locations.",
    benefits: [
      "Full assets management across all campus facilities",
      "Allocation management for rooms, labs, and shared spaces",
      "Calendar-synchronized facility scheduling and booking",
      "Time-based facility allocation for optimal utilization",
      "Multi-campus management from a single platform",
      "Maintenance request tracking and resolution",
      "Capacity planning with utilization analytics",
      "Visitor management with check-in and badge printing",
    ],
    useCases: [
      "Auditorium booking for school events with calendar conflict prevention",
      "Lab schedule management with equipment allocation tracking",
      "Campus facility utilization reporting for optimization planning",
    ],
    relatedFeatures: ["classroom", "events", "assets-request"],
  },
  "parent-login": {
    longDescription:
      "Give better transparency to parents about their child's academic activities and achievements by providing a dedicated login. With access to all children under a single account, parents can monitor activities, receive alerts, and communicate directly with faculty.",
    benefits: [
      "Dedicated parent accounts with secure authentication",
      "All children accessible under a single parent login",
      "Comprehensive activity monitoring across academics and extracurriculars",
      "Real-time alerts and updates for grades, attendance, and events",
      "Direct parent-to-faculty communication channel",
      "Fee payment and receipt access from the parent portal",
      "Event RSVP and school calendar integration",
      "Mobile-responsive design for on-the-go access",
    ],
    useCases: [
      "Daily check on child's attendance and homework completion",
      "Parent-teacher conference scheduling through the portal",
      "Online fee payment and receipt download during enrollment season",
    ],
    relatedFeatures: ["discussion", "financial", "attendance"],
  },
  placement: {
    longDescription:
      "Keep track of various recruitment activities like recruiter profiles, jobs offered, and selected students. From placement detailing and status tracking to statistical reporting, manage the complete placement lifecycle with comprehensive activity tracking.",
    benefits: [
      "Placement detailing with comprehensive activity records",
      "Easy search of past offers and placement history",
      "Status tracking through each stage of the placement process",
      "News and announcements for upcoming placement drives",
      "Statistical reporting on placement rates and outcomes",
      "Complete placement activity tracking from drive to offer",
      "Recruiter profile management with interaction history",
      "Student resume and portfolio management for applications",
    ],
    useCases: [
      "Campus placement drive coordination with recruiter scheduling",
      "Student placement history tracking for accreditation reporting",
      "Alumni employment tracking for institutional outcome metrics",
    ],
    relatedFeatures: ["recruitment", "student", "reporting"],
  },
  transportation: {
    longDescription:
      "Ensure the safety, efficiency, and effectiveness of transportation facilities in educational institutions. Manage predefined routes, driver allocations, vehicle assignments, and transportation fees — all integrated with financial systems and real-time notifications.",
    benefits: [
      "Route and driver allocation with optimized scheduling",
      "Vehicle assignment and maintenance tracking",
      "Transportation fees management integrated with finance",
      "Daily route tracking with pickup and drop point management",
      "Instant notifications for schedule changes and delays",
      "GPS integration for real-time vehicle location monitoring",
      "Student transport enrollment and route assignment",
      "Safety compliance tracking with driver certification management",
    ],
    useCases: [
      "Bus route planning with pickup points and student assignments",
      "Transportation fee collection integrated with school billing",
      "Parent notification system for bus arrival times and delays",
    ],
    relatedFeatures: ["parent-login", "financial", "mobile-application"],
  },

  // ─── Communication (11) ───
  blog: {
    longDescription:
      "Deliver and share knowledge with everyone by creating well-informed and designed blogs by students or faculty. Share on social media, create an informative environment, and communicate effectively through a platform that encourages knowledge sharing and community building.",
    benefits: [
      "Easy blog creation with rich text editor and media embedding",
      "Social media sharing integration for wider reach",
      "Category and tag organization for content discovery",
      "Comment and discussion features for reader engagement",
      "Author profiles showcasing student and faculty contributors",
      "SEO-friendly publishing for search engine visibility",
      "Draft and scheduling features for content planning",
      "Analytics tracking readership and engagement metrics",
    ],
    useCases: [
      "Student blog showcasing research projects and academic achievements",
      "Faculty thought leadership articles on educational innovation",
      "School news and event coverage by student journalism club",
    ],
    relatedFeatures: ["news-portal", "forum", "discussion"],
  },
  discussion: {
    longDescription:
      "Coordinate and discuss topics of interest in an open environment with easy-to-use built-in conversation channels. Multiple discussion rooms with hashtag support and user tagging make it simple to organize conversations and keep stakeholders connected.",
    benefits: [
      "Multiple discussion rooms organized by topic or department",
      "Hashtag support for topic categorization and discovery",
      "User tagging for directed communication and mentions",
      "Real-time messaging with read receipts and notifications",
      "File and media sharing within conversations",
      "Searchable conversation history and archival",
      "Role-based access control for private discussions",
      "Mobile access for conversations on the go",
    ],
    useCases: [
      "Department-wide discussion on curriculum changes and updates",
      "Student study groups with topic-specific channels and file sharing",
      "Parent community forum for school event planning and coordination",
    ],
    relatedFeatures: ["forum", "notice-board", "helpdesk"],
  },
  forum: {
    longDescription:
      "Provide students and faculty with an environment where communication is open and collaborative with an open Q&A forum. Post moderation, gamification with badges, and structured question-and-answer threads encourage quality contributions and knowledge sharing.",
    benefits: [
      "Open Q&A environment for transparent collaboration",
      "Post moderation for maintaining content quality",
      "Gamification with badges and reputation points",
      "Structured question and answer threads",
      "Category-based organization for easy navigation",
      "Upvoting and best-answer marking for quality content",
      "User profile reputation tracking and leaderboards",
      "Search functionality for finding existing answers",
    ],
    useCases: [
      "Student academic Q&A forum for peer learning and support",
      "Faculty professional development discussions with expert responses",
      "School-wide feedback forum for policy and improvement suggestions",
    ],
    relatedFeatures: ["discussion", "blog", "lms"],
  },
  grievance: {
    longDescription:
      "A helping hand to students, staff, and parents by acknowledging and solving their problems. Through a structured grievance process, complaints are filed, tracked, investigated, and resolved with confirmation from the complainant, ensuring transparency and accountability.",
    benefits: [
      "Structured grievance filing for students, parents, and staff",
      "Better administration and discipline through organized complaint handling",
      "Actions confirmed and closed by the complainant ensuring satisfaction",
      "Detailed reporting with data extraction for analysis",
      "Anonymous submission options for sensitive complaints",
      "Escalation workflows for unresolved issues",
      "Resolution timeline tracking with SLA management",
      "Category-based routing to appropriate departments",
    ],
    useCases: [
      "Student complaint about classroom facilities with tracked resolution",
      "Parent grievance regarding academic policies with formal response process",
      "Staff workplace concern handling with confidential investigation workflow",
    ],
    relatedFeatures: ["helpdesk", "survey", "multi-approvals"],
  },
  helpdesk: {
    longDescription:
      "World-class student success services for educational institutes. Intuitive and effective support software that helps thousands of schools connect with students and resolve queries effortlessly through centralized multi-channel issue resolution with smart prioritization and deep analytics.",
    benefits: [
      "Centralized multi-channel support via live chat, email, and social media",
      "Smart assignment prioritizing urgent issues for quick resolution",
      "Customizable workflows for ticket assignment and prioritization",
      "Granular-level control with multiple support teams and tags",
      "Advanced analytical reports identifying support inefficiencies",
      "Automated non-productive tasks for increased efficiency",
      "Knowledge base creation for self-service FAQ access",
      "Student satisfaction tracking through surveys and metrics",
      "Response time and resolution monitoring for quality assurance",
    ],
    useCases: [
      "Student IT support tickets with automated routing and priority assignment",
      "Parent inquiry management with multi-channel response tracking",
      "Staff operational support with knowledge base and ticket escalation",
    ],
    relatedFeatures: ["grievance", "discussion", "online-appointment"],
  },
  "news-portal": {
    longDescription:
      "Publish all new happenings of the organization using a news portal to keep everyone well informed. With managed publishing and editor/publisher access controls, share news articles, announcements, and updates with targeted audiences across the institution.",
    benefits: [
      "Managed publishing with editorial workflow and approvals",
      "Editor and publisher role-based access controls",
      "Rich media support for images, videos, and embedded content",
      "Category-based organization for different news types",
      "Targeted distribution to specific groups or the entire school",
      "Archive management for historical news access",
      "Social media integration for wider news distribution",
      "Mobile-friendly news feed accessible from any device",
    ],
    useCases: [
      "Weekly school newsletter publishing with photos and event highlights",
      "Breaking news announcements for schedule changes or emergencies",
      "Student achievement spotlights shared across the school community",
    ],
    relatedFeatures: ["blog", "notice-board", "discussion"],
  },
  "notice-board": {
    longDescription:
      "Students can get information regarding upcoming tests and assignments from teachers and administration before the due date. Share circulars, advance notifications, and event announcements via email and SMS to ensure everyone stays informed.",
    benefits: [
      "Circular sharing with students and parents via digital board",
      "Advance notification of tests, exams, and assignment deadlines",
      "Event notifications delivered through email and SMS",
      "Category-based notices for organized information display",
      "Priority flagging for urgent and important notices",
      "Acknowledgment tracking to confirm notice receipt",
      "Archive of past notices for reference",
      "Targeted notices by grade, class, or department",
    ],
    useCases: [
      "Exam schedule notification sent to students and parents two weeks ahead",
      "Emergency school closure announcement with instant SMS and email delivery",
      "Daily administrative notices for staff with acknowledgment tracking",
    ],
    relatedFeatures: ["news-portal", "discussion", "email-integration"],
  },
  "online-appointment": {
    longDescription:
      "The first online appointment scheduling platform dedicated to education, revolutionizing how students and educators connect. Book, reschedule, and cancel appointments online with automated confirmations, reminders, and calendar synchronization.",
    benefits: [
      "Online booking without physical visits or phone calls",
      "Rescheduling at user convenience with real-time availability",
      "Confirmation notifications via email or phone",
      "Automated alerts and reminders reducing no-shows",
      "Interview coordination across time zones for admissions",
      "Group event scheduling for campus tours and orientations",
      "Calendar synchronization with automated appointment management",
      "Time-saving automation replacing manual scheduling processes",
    ],
    useCases: [
      "Student-tutor appointment scheduling with online booking and reminders",
      "Admission interview coordination across different time zones",
      "Campus tour scheduling for prospective families with group management",
    ],
    relatedFeatures: ["events", "parent-login", "discussion"],
  },
  poll: {
    longDescription:
      "Make inclusive decisions by enabling organizational users to give a voice to their opinions using their vote in the poll. Simple reporting, mass emailing for poll distribution, and easy administration make it effortless to gather collective input on important decisions.",
    benefits: [
      "Simple poll creation with multiple question types",
      "Mass email distribution for wide poll reach",
      "Easy administration with one-click poll management",
      "Real-time results visualization with charts and percentages",
      "Anonymous voting options for honest feedback",
      "Scheduled polls with automatic opening and closing",
      "Role-based poll targeting for specific groups",
      "Export results for detailed analysis and reporting",
    ],
    useCases: [
      "Student council election with anonymous voting and real-time results",
      "Policy feedback poll distributed to all parents via email",
      "Staff satisfaction survey with department-wise result analysis",
    ],
    relatedFeatures: ["survey", "discussion", "notice-board"],
  },
  "secure-transcript": {
    longDescription:
      "Get secure and tamper-proof results and transcripts with instantly verifiable QR codes. Create custom digital certificates and IDs, share verified credentials, and access information-rich reports — all with low maintenance, cost-effective solutions that build trust and prevent counterfeiting.",
    benefits: [
      "Instant verification of transcripts via real-time QR code scanning",
      "Time and effort savings eliminating manual verification processes",
      "Enhanced institutional reputation with online credential verification",
      "Custom QR code and digital certificate creation",
      "Shareable credentials for credibility and employment verification",
      "Low maintenance and cost-effective anti-counterfeiting solution",
      "User-friendly platform with imprinted QR codes for simple scanning",
      "Track and trace capability for credential validation",
    ],
    useCases: [
      "Graduation transcript issuance with QR-verified authenticity",
      "Employer credential verification with instant online scanning",
      "Digital certificate distribution for course completions and awards",
    ],
    relatedFeatures: ["convocation", "gradebook", "documents"],
  },
  survey: {
    longDescription:
      "Get instant feedback on various activities of the organization with quick-to-go surveys using the built-in survey system. Create, share, collect, and analyze survey responses with an intuitive interface that makes gathering organizational insights simple and efficient.",
    benefits: [
      "Easy survey creation with multiple question types",
      "Share and collect responses across all stakeholders",
      "Built-in analytics for response analysis and visualization",
      "Simple and intuitive interface for both creators and respondents",
      "Anonymous response options for honest feedback collection",
      "Scheduled surveys with automated distribution and reminders",
      "Export capabilities for detailed data analysis",
      "Template library for common survey types",
    ],
    useCases: [
      "End-of-term course evaluation surveys distributed to all students",
      "Parent satisfaction surveys after school events and activities",
      "Faculty feedback collection on administrative policies and changes",
    ],
    relatedFeatures: ["poll", "grievance", "reporting"],
  },

  // ─── LMS (2) ───
  lms: {
    longDescription:
      "Elevate the educational experience at your institution with an LMS that offers seamless integration and limitless possibilities. From customizable learning paths and easy course management to virtual classrooms and gamification, built-in tools help students, faculty, and IT departments alike.",
    benefits: [
      "Customizable learning paths tailored for diverse learners",
      "Easy course management with interactive creation tools",
      "Advanced reporting with customization based on student performance",
      "Virtual classroom platform with web-conferencing and whiteboards",
      "Social learning encouraging constructive discussions and collaboration",
      "Gamification with points and badges to boost student motivation",
      "Mobile learning support for convenience and engagement",
      "Centralized learning management organizing all educational resources",
      "Enhanced accessibility with anytime, anywhere access",
      "Parent engagement portal for tracking student progress",
    ],
    useCases: [
      "Blended learning program combining classroom instruction with online modules",
      "Self-paced summer courses for credit recovery with progress tracking",
      "Professional development course library for teacher continuing education",
    ],
    relatedFeatures: ["quiz", "live-classroom", "digital-library"],
  },
  quiz: {
    longDescription:
      "Engaging classroom quiz activities for fun and collaboration. Offers enhancements for practice and test preparation with a focus on equity, standards-based reports, data-driven instruction, and universal access across campuses — supporting 8 different question types for diverse assessment needs.",
    benefits: [
      "Assessment and practice tools with equity-focused design",
      "Data-driven insights through standards-based reporting",
      "Universal access ensuring alignment for teachers across campuses",
      "Fill in the blank questions for recall assessment",
      "Optional and descriptive question types for varied evaluation",
      "Drag into text and match following for interactive assessment",
      "Numeric and sort-the-paragraphs for analytical testing",
      "Match the images for visual learning assessment",
      "Anti-cheating mode for secure online examination",
    ],
    useCases: [
      "Weekly class quizzes with instant grading and performance analytics",
      "Standardized test preparation with timed practice sessions",
      "Interactive study review sessions with gamified quiz activities",
    ],
    relatedFeatures: ["exam", "quiz-anti-cheating", "lms"],
  },

  // ─── Technical (11) ───
  customizable: {
    longDescription:
      "Extend and customize the system as per your organizational flow to meet the processes of the system. With customizable development feasibility, institutions can tailor every aspect of the platform to their specific needs without replacing the core system.",
    benefits: [
      "Customizable fields and forms for institution-specific data",
      "Configurable workflows matching organizational processes",
      "Custom report templates for specific reporting needs",
      "Role and permission customization for access control",
      "Branding and theme customization matching institutional identity",
      "Custom dashboard widgets for relevant data display",
      "Extension marketplace for additional functionality",
      "API access for custom integrations and modifications",
    ],
    useCases: [
      "Custom enrollment form with institution-specific fields and validations",
      "Tailored approval workflows matching administrative processes",
      "Custom dashboard creation for department-specific KPI monitoring",
    ],
    relatedFeatures: ["no-code-studio", "modular", "web-service-enabled"],
  },
  "data-import-export": {
    longDescription:
      "Easily import or export existing data from the system in widely accepted formats like CSV and XLS. Seamless data migration facilitates integration with existing systems, making it simple to get started and maintain data portability across platforms.",
    benefits: [
      "CSV and XLS format support for universal compatibility",
      "Bulk data import for quick system population",
      "Scheduled export for automated backup and reporting",
      "Field mapping for flexible data structure alignment",
      "Data validation during import with error reporting",
      "Template downloads for correctly formatted imports",
      "Selective export with filter and column selection",
      "Migration tools for moving from other systems",
    ],
    useCases: [
      "Initial data migration from legacy systems during implementation",
      "Monthly student data export for government reporting requirements",
      "Bulk student enrollment import from application spreadsheets",
    ],
    relatedFeatures: ["reporting", "customizable", "web-service-enabled"],
  },
  "full-web-based": {
    longDescription:
      "Deployed either on the cloud or on-premise, depending on the organization's preference and requirements. Being entirely web-based eliminates installation requirements, enabling access from any device with internet connectivity for all stakeholders.",
    benefits: [
      "Zero installation required on client devices",
      "Access from any device with a web browser",
      "Automatic updates without manual intervention",
      "Cross-platform compatibility across OS and devices",
      "Responsive design for desktop, tablet, and mobile",
      "Centralized data with real-time synchronization",
      "Reduced IT infrastructure and maintenance costs",
      "Secure HTTPS connections for data protection",
    ],
    useCases: [
      "Remote learning access from student home computers and tablets",
      "Teacher gradebook access from personal devices during commute",
      "Administrator platform access from any location during school events",
    ],
    relatedFeatures: ["on-cloud-on-premise", "mobile-application", "secure"],
  },
  modular: {
    longDescription:
      "A flexible modular-based system making it easy to add new features on the fly without having downtime. Implement specific components based on requirements rather than adopting the entire system at once, allowing gradual expansion as needs grow.",
    benefits: [
      "Pick-and-choose module selection based on current needs",
      "Add new modules without system downtime",
      "Independent module updates and maintenance",
      "Reduced initial investment with phased implementation",
      "Inter-module integration for seamless data flow",
      "Module-level configuration without affecting others",
      "Scalable architecture growing with institutional needs",
      "Simplified training by introducing modules progressively",
    ],
    useCases: [
      "Starting with core modules and adding advanced features over time",
      "Enabling specific modules for different campus locations",
      "Pilot testing new modules with select departments before full rollout",
    ],
    relatedFeatures: ["customizable", "on-cloud-on-premise", "open-source"],
  },
  "multi-currency": {
    longDescription:
      "Out-of-the-box support for multiple currencies, making sure business transactions are always possible in multiple currencies. Ideal for international institutions with students and operations spanning different countries and economic zones.",
    benefits: [
      "Automatic currency conversion with real-time exchange rates",
      "Multi-currency invoicing for international students",
      "Currency-specific financial reporting and analytics",
      "Support for global payment gateway integrations",
      "Base currency configuration with conversion tracking",
      "Historical exchange rate records for audit compliance",
      "Multi-currency reconciliation for cross-border transactions",
      "Student fee display in preferred currency",
    ],
    useCases: [
      "International student fee collection in their home currency",
      "Multi-campus financial consolidation across different countries",
      "Vendor payments in local currency for international suppliers",
    ],
    relatedFeatures: ["financial", "accounting", "e-commerce"],
  },
  "multi-lingual": {
    longDescription:
      "User interface supports multiple languages to make sure more and more users can understand the system. Enable global accessibility by allowing users to interact with the platform in their preferred language across all modules and features.",
    benefits: [
      "Multiple language interface support out of the box",
      "User-selectable language preferences per account",
      "RTL and LTR layout support for all languages",
      "Translatable content fields for bilingual institutions",
      "Language-specific notification and email templates",
      "Community-driven translation contributions",
      "Consistent UI/UX across all supported languages",
      "Admin interface for managing translations and additions",
    ],
    useCases: [
      "Arabic-English bilingual school with full RTL/LTR support",
      "International school serving families speaking different languages",
      "Multi-campus system with different primary languages per campus",
    ],
    relatedFeatures: ["customizable", "multi-organization", "full-web-based"],
  },
  "multi-organization": {
    longDescription:
      "Multiple campuses and multiple branch management, all from one system with the ability to separate data from each other. Manage distinct institutions with isolated data while maintaining centralized administration and cross-organization reporting.",
    benefits: [
      "Multi-campus management from a single platform",
      "Data isolation between organizations for security and privacy",
      "Centralized administration with delegated management",
      "Cross-organization reporting for consolidated analytics",
      "Shared resource configuration across campuses",
      "Organization-specific branding and customization",
      "Inter-campus student and staff transfer management",
      "Unified user authentication across all organizations",
    ],
    useCases: [
      "School group managing multiple branches with centralized oversight",
      "University with multiple campuses sharing consolidated reporting",
      "Education trust operating diverse institutions under one platform",
    ],
    relatedFeatures: ["campus", "secure", "reporting"],
  },
  "on-cloud-on-premise": {
    longDescription:
      "Choose the best deployment strategy for your system — on the cloud or at local servers on your own premises. Flexible deployment options ensure institutions can meet their infrastructure preferences, compliance requirements, and data sovereignty needs.",
    benefits: [
      "Cloud deployment for zero infrastructure management",
      "On-premise option for complete data control",
      "Hybrid deployment combining cloud and local resources",
      "Automatic cloud backups and disaster recovery",
      "Compliance with local data residency regulations",
      "Scalable cloud resources matching demand fluctuations",
      "On-premise security for sensitive data requirements",
      "Migration support between deployment models",
    ],
    useCases: [
      "Cloud deployment for quick setup with minimal IT infrastructure",
      "On-premise installation for government schools with data sovereignty rules",
      "Hybrid setup with sensitive data on-premise and applications in the cloud",
    ],
    relatedFeatures: ["full-web-based", "secure", "multi-organization"],
  },
  "open-source": {
    longDescription:
      "The source code available under the most adaptable open-source license gives the freedom to modify the system as you like. Well-structured and technically robust, the open-source nature ensures transparency, community support, and unlimited customization potential.",
    benefits: [
      "Full source code access for complete transparency",
      "Freedom to modify and extend functionality",
      "Active community contributing improvements and plugins",
      "No vendor lock-in with portable data and code",
      "Cost-effective with no per-user licensing fees",
      "Security through transparency with community code review",
      "Integration flexibility with any third-party system",
      "Self-hosted option for complete infrastructure control",
    ],
    useCases: [
      "Custom module development for institution-specific requirements",
      "Community contribution to shared features benefiting all users",
      "Internal IT team maintaining and extending the platform independently",
    ],
    relatedFeatures: ["customizable", "modular", "web-service-enabled"],
  },
  secure: {
    longDescription:
      "Incorporated with security features like granular-level data access ensuring that your data is secure from unauthorized access. Comprehensive security measures protect institutional and student information with role-based permissions, encryption, and audit logging.",
    benefits: [
      "Granular-level data access control with fine-grained permissions",
      "Role-based security ensuring appropriate access per user type",
      "Data encryption at rest and in transit",
      "Audit logging for all system activities and changes",
      "Two-factor authentication for enhanced login security",
      "Session management with automatic timeout",
      "IP restriction capabilities for controlled access",
      "Regular security updates and vulnerability patching",
    ],
    useCases: [
      "Student data privacy compliance with role-based access restrictions",
      "Financial data protection with encryption and audit trail logging",
      "Administrator activity monitoring for security incident investigation",
    ],
    relatedFeatures: [
      "multi-organization",
      "customizable",
      "on-cloud-on-premise",
    ],
  },
  "web-service-enabled": {
    longDescription:
      "Push and pull data from various other systems with built-in web services. API capabilities enable third-party integrations and data exchange with external applications, making the platform a connected hub in the institutional technology ecosystem.",
    benefits: [
      "RESTful API access for third-party integrations",
      "Webhook support for real-time event notifications",
      "OAuth authentication for secure API access",
      "Comprehensive API documentation for developers",
      "Batch API operations for bulk data processing",
      "Rate limiting and API usage monitoring",
      "Sandbox environment for integration testing",
      "Pre-built connectors for common educational tools",
    ],
    useCases: [
      "Student information sync with government education databases",
      "Integration with third-party payment gateways for fee collection",
      "Custom mobile app development using platform APIs",
    ],
    relatedFeatures: ["data-import-export", "customizable", "open-source"],
  },

  // ─── Integration (6) ───
  bigbluebutton: {
    longDescription:
      "An open-source web conferencing system for online learning, enabling real-time sharing of audio, video, and screen. Provides remote students with a top-notch virtual learning experience with complete privacy control and cost-effective deployment.",
    benefits: [
      "Open-source platform with no per-user licensing costs",
      "Real-time audio, video, and screen sharing",
      "Complete privacy control for secure sessions",
      "Cost-effective deployment and scaling",
      "Whiteboard and annotation tools for interactive teaching",
      "Recording capabilities for session replay",
      "Breakout rooms for small group activities",
      "Integration with LMS for seamless class management",
    ],
    useCases: [
      "Daily virtual classes with screen sharing and interactive whiteboard",
      "Recorded lectures available for student review and catch-up",
      "Small group breakout sessions for collaborative projects",
    ],
    relatedFeatures: ["live-classroom", "google-meet", "zoom"],
  },
  "google-meet": {
    longDescription:
      "Conduct virtual classes with screen sharing, white-boarding, and breakout rooms for group work and collaboration. With support for up to 100 participants, attendance tracking, and interactive tools like polling and Q&A, deliver engaging online lessons securely.",
    benefits: [
      "Closed captioning in multiple languages for accessibility",
      "Raise hand feature for organized participation",
      "7x7 tile view showing up to 49 students simultaneously",
      "Attendance tracking with automatic participant recording",
      "Breakout rooms for small group collaborative work",
      "Q&A tool for structured question management",
      "Polling tool for real-time student input and engagement",
      "Secure infrastructure with privacy-first design",
    ],
    useCases: [
      "Live class sessions with attendance tracking and participation tools",
      "Group project work using breakout rooms with teacher monitoring",
      "Class polls and Q&A sessions for interactive lesson engagement",
    ],
    relatedFeatures: ["live-classroom", "microsoft-teams", "zoom"],
  },
  "microsoft-teams": {
    longDescription:
      "Stay connected and organized with Chat, Meet, Call, and Collaborate. Microsoft Teams simplifies the ways of learning with video conferencing, screen sharing, file sharing, and secure communication tools designed for educational environments.",
    benefits: [
      "Video conferencing with HD quality for virtual classes",
      "Screen sharing for presentations and demonstrations",
      "Custom backgrounds and Together Mode for engagement",
      "File sharing and collaborative document editing",
      "Chat and messaging for ongoing class communication",
      "Meeting scheduling with calendar integration",
      "Privacy and security with enterprise-grade protection",
      "Integration with Microsoft 365 tools and services",
    ],
    useCases: [
      "Daily virtual classes with screen sharing and collaborative documents",
      "Staff meetings with file sharing and action item tracking",
      "Student group projects with shared channels and document collaboration",
    ],
    relatedFeatures: ["live-classroom", "google-meet", "zoom"],
  },
  zoom: {
    longDescription:
      "HD audio and video-enabled live classes with up to 100 participants, featuring easy screen sharing and built-in whiteboards. Integrated annotation features make it simple for educators to design and conduct engaging digital classes with recording and moderation capabilities.",
    benefits: [
      "HD audio and video for crystal-clear virtual classes",
      "Easy screen sharing for presentations and demonstrations",
      "Built-in whiteboards for interactive visual teaching",
      "Annotation tools for collaborative marking and highlighting",
      "Moderator-enabled passwords for secure session access",
      "Recording options for session archival and review",
      "One-click communication with all attendees",
      "Breakout rooms for small group activities and discussions",
    ],
    useCases: [
      "Live lecture delivery with whiteboard annotations and recording",
      "Virtual office hours for student-teacher consultations",
      "Webinar hosting for parent information sessions and open houses",
    ],
    relatedFeatures: ["live-classroom", "google-meet", "microsoft-teams"],
  },
  "whatsapp-integration": {
    longDescription:
      "WhatsApp integration provides a powerful communication tool for educational purposes. Educators can communicate with students and parents in a convenient and real-time manner, sharing materials, announcements, and reminders while enabling virtual discussions and collaborative projects.",
    benefits: [
      "Direct teacher-student and peer-to-peer messaging via WhatsApp",
      "Resource sharing for class materials, assignments, and videos",
      "Increased collaboration enabling student idea-sharing",
      "Student onboarding with guided information completion",
      "Automated exam results distribution and test reports",
      "Class reminders with scheduled updates and notifications",
      "Real-time Q&A and student engagement support",
      "Organization tools for sharing schedules and assignments",
      "Personalized feedback through individual student communication",
    ],
    useCases: [
      "Automated assignment reminders sent via WhatsApp before deadlines",
      "Exam result distribution directly to parent WhatsApp accounts",
      "New student onboarding with step-by-step WhatsApp guided setup",
    ],
    relatedFeatures: ["discussion", "notice-board", "email-integration"],
  },
  "social-media-marketing": {
    longDescription:
      "Social media marketing in education connects globally, amplifying your institution's marketing goals daily. Plan and publish content across multiple social channels from a single dashboard with team collaboration, approval workflows, and comprehensive analytics.",
    benefits: [
      "Draft posts with team feedback and collaborative refinement",
      "Approval workflows for quality and brand consistency before publishing",
      "Synchronized posting across channels on preset schedules",
      "Account management with shared access for social accounts",
      "Effortless digital content curation from multiple networks",
      "Customizable embedded social media feeds with pre-designed styles",
      "Total control over content moderation and filtering",
      "Budget-friendly plans for diverse marketing requirements",
    ],
    useCases: [
      "School event promotion across Facebook, Instagram, and Twitter simultaneously",
      "Student achievement showcasing on social media with approved content",
      "Enrollment campaign management with cross-platform analytics and tracking",
    ],
    relatedFeatures: ["automated-marketing", "email-marketing", "blog"],
  },

  // ─── AI (1) ───
  "ai-powered": {
    longDescription:
      "Harness the power of artificial intelligence to revolutionize education. AI-powered tools assist educators, students, and content creators in developing engaging educational content effortlessly with smart recommendations, adaptive learning, predictive analytics, and automated assessment capabilities.",
    benefits: [
      "Smart content recommendation based on student interests and interactions",
      "Adaptive learning content adjusting in real-time to learner progress",
      "Predictive analytics identifying at-risk students for early intervention",
      "Intelligent course scheduling optimizing teacher and resource allocation",
      "Automated quiz creation tailored to curriculum and student levels",
      "Intelligent timetable scheduling minimizing conflicts",
      "Automated grading and assessment streamlining evaluation",
      "Personalized learning experiences for individual student needs",
      "Virtual assistants providing 24/7 student support",
      "Data-driven institutional decision-making with AI insights",
    ],
    useCases: [
      "Personalized learning paths automatically adjusted to each student's pace",
      "Early warning system identifying struggling students through predictive analytics",
      "Automated quiz generation from uploaded curriculum materials and textbooks",
    ],
    relatedFeatures: ["lms", "quiz", "dashboard"],
  },
}

/**
 * Impact metrics for the features page
 */
export const IMPACT_METRICS: ImpactMetric[] = [
  {
    value: "80%",
    label: "Time Saved",
    description: "Reduction in administrative tasks through automation",
  },
  {
    value: "60%",
    label: "Cost Reduction",
    description: "Lower operational costs with paperless workflows",
  },
  {
    value: "25%",
    label: "Enrollment Boost",
    description: "Increase in enrollment with online admissions",
  },
  {
    value: "99.9%",
    label: "Uptime",
    description: "Reliable cloud infrastructure for uninterrupted access",
  },
]
