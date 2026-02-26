// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  Feature,
  FeatureCategoryInfo,
  FeatureDetail,
  ImpactMetric,
} from "./types"

/**
 * 14 feature categories for school management
 */
export const CATEGORIES: FeatureCategoryInfo[] = [
  {
    id: "core",
    label: "Core",
    description: "Essential school management foundations",
    icon: "LayoutDashboard",
    color: "text-blue-600",
  },
  {
    id: "academic",
    label: "Academic",
    description: "Teaching, learning, and assessment tools",
    icon: "BookOpen",
    color: "text-purple-600",
  },
  {
    id: "scheduling",
    label: "Scheduling",
    description: "Timetable and calendar management",
    icon: "CalendarDays",
    color: "text-pink-600",
  },
  {
    id: "finance",
    label: "Finance",
    description: "Billing, fees, and financial management",
    icon: "Wallet",
    color: "text-amber-600",
  },
  {
    id: "facilities",
    label: "Facilities",
    description: "Campus and resource management",
    icon: "Building2",
    color: "text-emerald-600",
  },
  {
    id: "hr",
    label: "HR",
    description: "Staff and human resource management",
    icon: "Users",
    color: "text-indigo-600",
  },
  {
    id: "operations",
    label: "Operations",
    description: "Day-to-day school operations",
    icon: "Settings",
    color: "text-slate-600",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Data insights and reporting",
    icon: "BarChart3",
    color: "text-cyan-600",
  },
  {
    id: "communication",
    label: "Communication",
    description: "Messaging and notifications",
    icon: "MessageSquare",
    color: "text-orange-600",
  },
  {
    id: "enrollment",
    label: "Enrollment",
    description: "Admissions and registration",
    icon: "UserPlus",
    color: "text-teal-600",
  },
  {
    id: "community",
    label: "Community",
    description: "Parent, alumni, and community engagement",
    icon: "Heart",
    color: "text-rose-600",
  },
  {
    id: "welfare",
    label: "Welfare",
    description: "Student health and wellbeing",
    icon: "HeartPulse",
    color: "text-red-600",
  },
  {
    id: "e-learning",
    label: "E-Learning",
    description: "Online learning and digital content",
    icon: "MonitorPlay",
    color: "text-violet-600",
  },
  {
    id: "documents",
    label: "Documents",
    description: "Document generation and management",
    icon: "FileText",
    color: "text-stone-600",
  },
]

/**
 * 48 school management features
 */
export const FEATURES: Feature[] = [
  // Core (4)
  {
    id: "student-management",
    title: "Student Management",
    description: "Profiles, records, and enrollment in one place.",
    icon: "Users",
    category: "core",
  },
  {
    id: "teacher-management",
    title: "Teacher Management",
    description: "Qualifications, schedules, and evaluations.",
    icon: "UserCheck",
    category: "core",
  },
  {
    id: "parent-portal",
    title: "Parent Portal",
    description: "Grades, attendance, and updates for parents.",
    icon: "House",
    category: "core",
  },
  {
    id: "role-based-access",
    title: "Role-Based Access",
    description: "Eight roles with granular permissions.",
    icon: "Shield",
    category: "core",
  },

  // Academic (6)
  {
    id: "attendance-tracking",
    title: "Attendance Tracking",
    description: "QR, barcode, and kiosk-based check-in.",
    icon: "ClipboardCheck",
    category: "academic",
    isNew: true,
  },
  {
    id: "exam-management",
    title: "Exam Management",
    description: "Create, schedule, and grade exams easily.",
    icon: "FileText",
    category: "academic",
  },
  {
    id: "question-banks",
    title: "Question Banks",
    description: "Reusable banks with tagging and auto-gen.",
    icon: "Database",
    category: "academic",
  },
  {
    id: "gradebook",
    title: "Gradebook",
    description: "Weighted grading and GPA calculations.",
    icon: "BookMarked",
    category: "academic",
  },
  {
    id: "assignments",
    title: "Assignments",
    description: "Distribute and collect with tracking.",
    icon: "ClipboardList",
    category: "academic",
  },
  {
    id: "subject-catalog",
    title: "Subject Catalog",
    description: "Curriculum with topics and prerequisites.",
    icon: "BookOpen",
    category: "academic",
  },

  // Scheduling (4)
  {
    id: "timetable",
    title: "Timetable",
    description: "Auto-generate with conflict detection.",
    icon: "CalendarDays",
    category: "scheduling",
  },
  {
    id: "event-calendar",
    title: "Event Calendar",
    description: "Plan events with RSVP and reminders.",
    icon: "Calendar",
    category: "scheduling",
  },
  {
    id: "substitution-management",
    title: "Substitution Management",
    description: "Auto-assign substitutes for absences.",
    icon: "RefreshCw",
    category: "scheduling",
  },
  {
    id: "period-management",
    title: "Period Management",
    description: "Bell schedules, timings, and breaks.",
    icon: "Clock",
    category: "scheduling",
  },

  // Finance (5)
  {
    id: "fee-management",
    title: "Fee Management",
    description: "Collect fees with installment plans.",
    icon: "Wallet",
    category: "finance",
  },
  {
    id: "invoicing",
    title: "Invoicing",
    description: "Professional invoices with online pay.",
    icon: "Receipt",
    category: "finance",
  },
  {
    id: "payroll",
    title: "Payroll",
    description: "Salary calculations and payslips.",
    icon: "Banknote",
    category: "finance",
  },
  {
    id: "expense-tracking",
    title: "Expense Tracking",
    description: "Categorize expenditures with approvals.",
    icon: "TrendingDown",
    category: "finance",
  },
  {
    id: "financial-reports",
    title: "Financial Reports",
    description: "Statements, balance sheets, and budgets.",
    icon: "PieChart",
    category: "finance",
  },

  // Facilities (3)
  {
    id: "classroom-management",
    title: "Classroom Management",
    description: "Room allocation, capacity, and equipment.",
    icon: "DoorOpen",
    category: "facilities",
  },
  {
    id: "library-management",
    title: "Library Management",
    description: "Catalog, issue/return, and fines.",
    icon: "Library",
    category: "facilities",
  },
  {
    id: "transport-management",
    title: "Transport Management",
    description: "Routes, vehicle tracking, and assignments.",
    icon: "Bus",
    category: "facilities",
    isPremium: true,
  },

  // HR (3)
  {
    id: "staff-directory",
    title: "Staff Directory",
    description: "Contact info, departments, and org chart.",
    icon: "Contact",
    category: "hr",
  },
  {
    id: "leave-management",
    title: "Leave Management",
    description: "Apply, approve, and track leave balances.",
    icon: "CalendarOff",
    category: "hr",
  },
  {
    id: "teacher-performance",
    title: "Teacher Performance",
    description: "Observations, reviews, and development.",
    icon: "Award",
    category: "hr",
  },

  // Operations (3)
  {
    id: "announcements",
    title: "Announcements",
    description: "Broadcast with targeting and read receipts.",
    icon: "Megaphone",
    category: "operations",
  },
  {
    id: "hall-pass",
    title: "Hall Pass",
    description: "Digital passes with time and location.",
    icon: "Ticket",
    category: "operations",
    isNew: true,
  },
  {
    id: "inventory-management",
    title: "Inventory Management",
    description: "Supplies, equipment, and asset tracking.",
    icon: "Package",
    category: "operations",
  },

  // Analytics (3)
  {
    id: "dashboard-analytics",
    title: "Dashboard Analytics",
    description: "Role-specific KPIs, trends, and insights.",
    icon: "BarChart3",
    category: "analytics",
  },
  {
    id: "attendance-analytics",
    title: "Attendance Analytics",
    description: "Absence patterns and early warnings.",
    icon: "LineChart",
    category: "analytics",
  },
  {
    id: "academic-reports",
    title: "Academic Reports",
    description: "Progress reports and class comparisons.",
    icon: "TrendingUp",
    category: "analytics",
  },

  // Communication (3)
  {
    id: "messaging",
    title: "Messaging",
    description: "Real-time chat for teachers and parents.",
    icon: "MessageSquare",
    category: "communication",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Push, email, and SMS for all events.",
    icon: "Bell",
    category: "communication",
  },
  {
    id: "parent-communication",
    title: "Parent Communication",
    description: "Parent-teacher channels and scheduling.",
    icon: "MessageCircle",
    category: "communication",
  },

  // Enrollment (3)
  {
    id: "online-admissions",
    title: "Online Admissions",
    description: "Digital forms with document upload.",
    icon: "UserPlus",
    category: "enrollment",
  },
  {
    id: "merit-lists",
    title: "Merit Lists",
    description: "Automated ranking with custom criteria.",
    icon: "ListOrdered",
    category: "enrollment",
  },
  {
    id: "enrollment-workflow",
    title: "Enrollment Workflow",
    description: "Multi-step with payment and verification.",
    icon: "GitBranch",
    category: "enrollment",
  },

  // Community (3)
  {
    id: "alumni-network",
    title: "Alumni Network",
    description: "Connect graduates and organize reunions.",
    icon: "GraduationCap",
    category: "community",
    isPremium: true,
  },
  {
    id: "school-website",
    title: "School Website",
    description: "Custom site with admissions and news.",
    icon: "Globe",
    category: "community",
  },
  {
    id: "visitor-management",
    title: "Visitor Management",
    description: "Check-in/out with badges and scheduling.",
    icon: "DoorClosed",
    category: "community",
  },

  // Welfare (3)
  {
    id: "health-records",
    title: "Health Records",
    description: "Health profiles, vaccines, and alerts.",
    icon: "HeartPulse",
    category: "welfare",
  },
  {
    id: "counseling",
    title: "Counseling",
    description: "Sessions, referrals, and wellbeing reports.",
    icon: "HandHeart",
    category: "welfare",
  },
  {
    id: "early-warning",
    title: "Early Warning System",
    description: "AI detection of at-risk students.",
    icon: "AlertTriangle",
    category: "welfare",
    isNew: true,
  },

  // E-Learning (4)
  {
    id: "lms",
    title: "Learning Management",
    description: "Courses, content, and progress tracking.",
    icon: "MonitorPlay",
    category: "e-learning",
  },
  {
    id: "video-lessons",
    title: "Video Lessons",
    description: "Stream with chapters and progress.",
    icon: "PlayCircle",
    category: "e-learning",
  },
  {
    id: "online-quizzes",
    title: "Online Quizzes",
    description: "Auto-graded with instant feedback.",
    icon: "HelpCircle",
    category: "e-learning",
  },
  {
    id: "digital-resources",
    title: "Digital Resources",
    description: "Textbooks, worksheets, and materials.",
    icon: "FolderOpen",
    category: "e-learning",
  },

  // Documents (3)
  {
    id: "id-cards",
    title: "ID Cards",
    description: "Photo IDs with barcodes and QR codes.",
    icon: "IdCard",
    category: "documents",
  },
  {
    id: "certificates",
    title: "Certificates",
    description: "Design and print for any achievement.",
    icon: "ScrollText",
    category: "documents",
  },
  {
    id: "report-cards",
    title: "Report Cards",
    description: "Custom templates with auto data fill.",
    icon: "FileSpreadsheet",
    category: "documents",
  },
]

/**
 * Extended feature details for individual feature pages
 */
export const FEATURE_DETAILS: Record<
  string,
  Omit<FeatureDetail, keyof Feature>
> = {
  "student-management": {
    longDescription:
      "A comprehensive student information system that centralizes all student data. From enrollment and demographic information to academic records and behavioral notes, everything is accessible from a single profile. Track student progress across years, manage transfers between classes, and generate detailed reports for parents and administrators.",
    benefits: [
      "Centralized student records accessible to authorized staff",
      "Complete enrollment history with document management",
      "Academic transcript generation with GPA tracking",
      "Behavioral incident tracking and parent notifications",
      "Bulk import/export for easy data migration",
      "Custom fields for school-specific data requirements",
    ],
    useCases: [
      "New student registration with document collection",
      "Class transfers and grade promotions at year-end",
      "Parent meetings with instant access to student history",
    ],
    relatedFeatures: ["parent-portal", "attendance-tracking", "gradebook"],
  },
  "teacher-management": {
    longDescription:
      "Manage your entire teaching staff from qualifications and certifications to schedule assignments and workload balancing. Track professional development hours, manage contract renewals, and evaluate performance through structured observation forms and peer reviews.",
    benefits: [
      "Qualification and certification tracking with expiry alerts",
      "Workload balancing across subjects and classes",
      "Professional development hour tracking",
      "Contract management with renewal reminders",
      "Performance evaluation with customizable rubrics",
      "Substitution preferences and availability tracking",
    ],
    useCases: [
      "Annual performance review cycles",
      "Accreditation preparation with staff qualification reports",
      "Substitute teacher assignment during absences",
    ],
    relatedFeatures: ["teacher-performance", "timetable", "leave-management"],
  },
  "attendance-tracking": {
    longDescription:
      "A multi-modal attendance system supporting QR codes, barcodes, kiosk check-in, and manual entry. Real-time dashboards show attendance patterns across the school, while automated notifications alert parents of absences. The early warning system identifies students with concerning attendance patterns before they become critical.",
    benefits: [
      "Multiple check-in methods: QR, barcode, kiosk, manual",
      "Real-time attendance dashboards by class and grade",
      "Automated parent notifications for absences",
      "Period-by-period tracking for secondary schools",
      "Excuse management with approval workflows",
      "Integration with early warning intervention system",
    ],
    useCases: [
      "Morning check-in via kiosk at school entrance",
      "Period attendance for secondary school classes",
      "Tracking chronic absenteeism for intervention",
    ],
    relatedFeatures: [
      "early-warning",
      "parent-communication",
      "attendance-analytics",
    ],
  },
  "exam-management": {
    longDescription:
      "End-to-end exam lifecycle management from creation and scheduling to grading and result publication. Design exams with varied question types, assign seating arrangements, manage invigilation duties, and publish results with detailed analytics showing class performance and question-level difficulty analysis.",
    benefits: [
      "Multiple exam types: midterm, final, quiz, practical",
      "Automated scheduling with room and invigilator assignment",
      "Mark entry with validation and moderation workflows",
      "Result analytics with class averages and distributions",
      "Re-exam and improvement test management",
      "Integration with gradebook for cumulative scoring",
    ],
    useCases: [
      "End-of-term exam creation and scheduling",
      "Continuous assessment with weekly quizzes",
      "National exam preparation with mock tests",
    ],
    relatedFeatures: ["question-banks", "gradebook", "certificates"],
  },
  timetable: {
    longDescription:
      "Intelligent timetable generation that respects teacher availability, room capacity, subject requirements, and pedagogical constraints. Handle multi-section classes, lab rotations, and elective scheduling with conflict detection. When teachers are absent, the substitution engine automatically suggests qualified replacements.",
    benefits: [
      "Automated generation with constraint satisfaction",
      "Conflict detection for rooms, teachers, and students",
      "Substitution management with teacher availability",
      "Support for rotating and block schedules",
      "Student and teacher personalized timetable views",
      "Export to calendar apps and printable formats",
    ],
    useCases: [
      "Beginning-of-year timetable creation",
      "Mid-year schedule adjustments for new sections",
      "Daily substitution management for absent teachers",
    ],
    relatedFeatures: [
      "substitution-management",
      "classroom-management",
      "period-management",
    ],
  },
  "fee-management": {
    longDescription:
      "Comprehensive fee management covering tuition, transport, activities, and custom fee types. Set up installment plans, apply discounts and scholarships, send automated reminders for overdue payments, and accept online payments through multiple gateways. Financial dashboards show collection rates and outstanding balances in real-time.",
    benefits: [
      "Flexible fee structures with custom fee types",
      "Installment plans with automated reminders",
      "Scholarship and discount management",
      "Online payment through multiple gateways",
      "Real-time collection tracking dashboards",
      "Automated receipt and statement generation",
    ],
    useCases: [
      "Term-start fee collection with installment options",
      "Scholarship application and award management",
      "Overdue payment follow-up with escalation",
    ],
    relatedFeatures: ["invoicing", "financial-reports", "parent-portal"],
  },
  "parent-portal": {
    longDescription:
      "A dedicated portal giving parents real-time visibility into their children's education. View attendance records, exam results, upcoming assignments, and school announcements. Communicate directly with teachers, schedule meetings, and make fee payments -- all from a single dashboard accessible on any device.",
    benefits: [
      "Real-time access to grades and attendance",
      "Direct messaging with teachers and administrators",
      "Fee payment and receipt download",
      "Event RSVP and school calendar access",
      "Multiple children management from one account",
      "Mobile-responsive design for on-the-go access",
    ],
    useCases: [
      "Daily check on child's attendance and homework",
      "Parent-teacher conference scheduling",
      "Online fee payment during enrollment season",
    ],
    relatedFeatures: ["messaging", "fee-management", "attendance-tracking"],
  },
  lms: {
    longDescription:
      "A full-featured learning management system enabling teachers to create courses, upload content, and track student progress. Support for video lessons, interactive quizzes, assignments, and discussion forums. Students can learn at their own pace with progress tracking and completion certificates.",
    benefits: [
      "Course creation with multimedia content support",
      "Student progress tracking with completion rates",
      "Interactive assessments with instant feedback",
      "Discussion forums for collaborative learning",
      "Certificates of completion for finished courses",
      "Mobile-friendly for learning anywhere",
    ],
    useCases: [
      "Blended learning with in-class and online components",
      "Summer school courses for credit recovery",
      "Professional development courses for teachers",
    ],
    relatedFeatures: ["video-lessons", "online-quizzes", "digital-resources"],
  },
  "online-admissions": {
    longDescription:
      "Digitize your entire admissions process from application to enrollment. Parents submit applications online with document uploads, while admissions staff review, score, and process applications through a structured workflow. Automated communications keep applicants informed of their status at every stage.",
    benefits: [
      "Online application forms with custom fields",
      "Document upload and verification workflow",
      "Application scoring and ranking system",
      "Automated status notifications to applicants",
      "Batch processing for high-volume admissions",
      "Integration with enrollment and fee collection",
    ],
    useCases: [
      "Annual admissions cycle management",
      "Mid-year transfer applications processing",
      "Scholarship applicant evaluation and selection",
    ],
    relatedFeatures: ["merit-lists", "enrollment-workflow", "fee-management"],
  },
  messaging: {
    longDescription:
      "Secure, real-time messaging platform designed for the school environment. Teachers, parents, and administrators can communicate through direct messages, group conversations, and broadcast channels. Message translation support ensures language is never a barrier, while read receipts and priority flags keep important conversations on track.",
    benefits: [
      "Real-time messaging with read receipts",
      "Group conversations by class, department, or custom groups",
      "File and image sharing within conversations",
      "Auto-translation between Arabic and English",
      "Message search and conversation archival",
      "Priority flags for urgent communications",
    ],
    useCases: [
      "Teacher-parent communication about student progress",
      "Department-wide coordination for events",
      "Emergency broadcast to all parents",
    ],
    relatedFeatures: ["notifications", "parent-communication", "announcements"],
  },
  "dashboard-analytics": {
    longDescription:
      "Role-specific dashboards that surface the most relevant data for each user type. Principals see school-wide KPIs, teachers see class performance, accountants see financial summaries, and parents see their children's progress. Interactive charts, trend analysis, and drill-down capabilities make data accessible and actionable.",
    benefits: [
      "Role-specific views for 8 user roles",
      "Interactive charts with drill-down capability",
      "Trend analysis with year-over-year comparisons",
      "Custom dashboard widgets and layouts",
      "Real-time data refresh for live monitoring",
      "Export data to PDF and spreadsheet formats",
    ],
    useCases: [
      "Principal reviewing school-wide performance metrics",
      "Accountant monitoring fee collection progress",
      "Teacher tracking class assignment completion rates",
    ],
    relatedFeatures: [
      "academic-reports",
      "attendance-analytics",
      "financial-reports",
    ],
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
