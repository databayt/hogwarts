// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"

export const essentialPageData: Record<string, FeaturePageData> = {
  application: {
    sections: [
      {
        type: "hero",
        heading: "Student Application Management",
        description:
          "Collect and process admission applications with an easier than ever process with everything at one place.",
      },
      {
        type: "checklist",
        heading: "Application Features",
        items: [
          { text: "Online Application" },
          { text: "Transparent Process" },
          { text: "Application To Admission Flow" },
          { text: "Paid or Free Application Options" },
          { text: "Course Based Applications" },
          { text: "Fully Customizable Application Form" },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Streamline Your Admission Process With Our All-in-One Application Solution.",
      },
    ],
    relatedFeatures: ["admission", "financial", "crm"],
  },

  assignment: {
    sections: [
      {
        type: "hero",
        heading: "Assignment Management System",
        description:
          "Streamline every aspect of assignment management, from creation to submission and grading. The platform serves both educators seeking efficient workflows and students needing organizational tools for task management.",
      },
      {
        type: "feature-cards",
        heading: "Key Features",
        cards: [
          {
            title: "Flexible Assignment Creation",
            description:
              "Quickly create diverse assignment types with customizable instructions and attachments.",
          },
          {
            title: "Streamlined Submission Process",
            description:
              "Simplify student submissions with a user-friendly interface and multi-format file uploads.",
          },
          {
            title: "Efficient Grading",
            description:
              "Easily grade and provide feedback using customizable rubrics and batch grading tools.",
          },
          {
            title: "Real-Time Progress Tracking",
            description:
              "Monitor assignment status and student performance with dashboards and reports.",
          },
          {
            title: "Collaborative Communication Tools",
            description:
              "Facilitate student-teacher interactions with discussion boards and private messaging.",
          },
          {
            title: "Mobile Access",
            description:
              "Easily manage assignments anytime, anywhere with a mobile-optimized interface.",
          },
          {
            title: "Real-Time Notifications",
            description:
              "Receive instant alerts to stay updated on assignments and deadlines, keeping you on track effortlessly.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Why Choose Our Assignment Management System?",
        items: [
          { text: "Comprehensive Solution" },
          { text: "User-Friendly Interface" },
          { text: "Customizable Features" },
          { text: "Mobile Accessibility" },
          { text: "Real-Time Updates" },
          { text: "Integrity and Security" },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Ready to transform your assignment management process? Contact us to learn more.",
      },
    ],
    relatedFeatures: ["gradebook", "classroom", "course"],
  },

  attendance: {
    sections: [
      {
        type: "hero",
        heading: "Transform Your Attendance Management",
        description:
          "Student Attendance Management System where managing student attendance is simplified and streamlined with efficiency, accuracy, and user-friendly features.",
      },
      {
        type: "section-heading",
        heading:
          "Simplify Student Attendance with Our Advanced Management System",
        description:
          "Real-time updates, automated notifications, and detailed reporting to transform your attendance tracking.",
      },
      {
        type: "feature-cards",
        heading: "Features",
        cards: [
          {
            title: "Real-Time Attendance Tracking",
            description: "Capture and update attendance instantly.",
          },
          {
            title: "Automated Notifications and Alerts",
            description: "Send absence alerts and reminders automatically.",
          },
          {
            title: "Comprehensive Reporting and Analytics",
            description: "Generate detailed attendance reports.",
          },
          {
            title: "Customizable Attendance Rules",
            description: "Set institution-specific attendance policies.",
          },
          {
            title: "Interactive Dashboards",
            description: "Easy navigation and quick metrics access.",
          },
          {
            title: "Role-Based Access Control",
            description: "Differentiated user access levels.",
          },
          {
            title: "Classroom Management",
            description: "Direct teacher attendance management.",
          },
          {
            title: "User-Friendly Interface",
            description: "Intuitive cross-device dashboard.",
          },
          {
            title: "Seamless Integration",
            description: "Synchronization with other modules.",
          },
          {
            title: "Biometric Integration",
            description: "Fingerprint and facial recognition support.",
          },
          {
            title: "RFID Integration",
            description: "Fast ID card-based tracking.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Why Choose Our Student Attendance Management System? Revolutionize your attendance management today!",
      },
    ],
    relatedFeatures: ["biometric", "face-recognition", "dashboard"],
  },

  classroom: {
    sections: [
      {
        type: "hero",
        heading: "Classroom Management System",
        description:
          "A classroom management system designed to help educators organize, administer, and streamline various aspects of classroom activities in an educational setting.",
      },
      {
        type: "feature-cards",
        heading: "Key Features",
        cards: [
          {
            title: "Attendance Management",
            description:
              "Easily take and track attendance with just a few clicks. Monitor patterns and generate reports.",
          },
          {
            title: "Gradebook",
            description:
              "Simplify grade management. Record grades, calculate averages, and share progress reports.",
          },
          {
            title: "Lesson Planning",
            description:
              "Create, organize, and share lesson plans. Collaborate with colleagues and align curriculum.",
          },
          {
            title: "Student Behavior Tracking",
            description:
              "Promote positive behavior and discipline. Record conduct and communicate with parents.",
          },
          {
            title: "Communication Hub",
            description:
              "Enhance communication between teachers, students, and parents with announcements and messaging.",
          },
          {
            title: "Resource Management",
            description:
              "Access a centralized repository of educational materials, documents, and multimedia content.",
          },
          {
            title: "Assessment and Testing",
            description:
              "Create, administer, and grade quizzes and tests electronically with result analysis.",
          },
          {
            title: "Classroom Monitoring",
            description:
              "Use screen monitoring to ensure students stay on task during computer-based activities.",
          },
          {
            title: "Reporting and Analytics",
            description:
              "Utilize data-driven insights for informed decisions on attendance, grades, and behavior.",
          },
          {
            title: "Parent Portal",
            description:
              "Provide parents dedicated access to monitor their child's progress and communicate with teachers.",
          },
          {
            title: "Class Scheduling",
            description:
              "Create, manage, and view class schedules. Notify students and teachers of changes.",
          },
          {
            title: "Assignment Submission",
            description:
              "Teachers post assignments and students submit online with teacher feedback.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Empower, Engage, And Excel: Streamline Your Classroom With Our Management Solutions!",
      },
    ],
    relatedFeatures: ["timetable", "attendance", "gradebook"],
  },

  gradebook: {
    sections: [
      {
        type: "hero",
        heading: "Gradebook Management System",
        description:
          "Accelerate the grading process with a user-friendly and adaptable web-based grading tool, accessible to teachers on any device and from anywhere.",
      },
      {
        type: "section-heading",
        heading:
          "Features Of Gradebook Management System For Educational Institute",
        description:
          "A wide range of features to help teachers, administrators, and students effectively manage grading and academic performance.",
      },
      {
        type: "feature-cards",
        heading:
          "Assessment Evolution: Navigating The World of Flexible Grading",
        cards: [
          {
            title: "Traditional Grading",
            description:
              "Conventional method using letter or number grades based on performance.",
          },
          {
            title: "Pass/Fail Grading",
            description:
              "Students marked as pass or fail based on minimum standards.",
          },
          {
            title: "Grade Bands",
            description:
              "Uses ranges (A, B, C, D) for general performance assessment.",
          },
          {
            title: "Gamification",
            description: "Game-like elements with points, badges, and rewards.",
          },
          {
            title: "Grade Entry and Calculation",
            description:
              "Input and calculate grades with customizable criteria.",
          },
          {
            title: "Real-Time Updates",
            description: "Access grades throughout the course in real-time.",
          },
          {
            title: "Report Generation",
            description:
              "Create progress reports, report cards, and transcripts.",
          },
          {
            title: "Analytics and Insights",
            description:
              "Data visualization tools for identifying performance trends.",
          },
          {
            title: "Student and Parent Portal",
            description:
              "Comprehensive reports on progress and activities accessible to all.",
          },
        ],
      },
      {
        type: "alternating-blocks",
        heading: "An Integrated Grading Management Software",
        blocks: [
          {
            heading: "Ease of Use",
            description:
              "Elevate your grading process with our comprehensive integrated grading management software.",
          },
          {
            heading: "Customizable",
            description:
              "Streamline grading with customizable scales and course-specific weighting.",
          },
          {
            heading: "Track Student Progress",
            description:
              "Monitor student progress with detailed tracking and trend visualization.",
          },
          {
            heading: "Keep Parents Updated",
            description:
              "Enhance communication and empower educators with transparent grade sharing.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Take control of your grades and academic success with our Gradebook Management System. Try it today!",
      },
    ],
    relatedFeatures: ["exam", "course", "reporting"],
  },

  "leave-request": {
    sections: [
      {
        type: "hero",
        heading: "Leave Request Management",
        description:
          "Enhance the overall user experience by providing options to send leave requests to different groups or sections of people.",
      },
      {
        type: "checklist",
        heading: "Leave Request Features",
        items: [
          { text: "Apply Various Leave types (Sick Leave, Holiday Leave)" },
          { text: "Manual Set The Description of Leave Request" },
          { text: "Admin & Faculties Can Approve Leave Request" },
          {
            text: "Multi-level approval workflows with configurable approvers",
          },
          { text: "Calendar integration showing leave schedules" },
          { text: "Automated notifications for request status updates" },
        ],
      },
      {
        type: "cta-banner",
        heading: "Streamline Leave Management For Your Entire Institution.",
      },
    ],
    relatedFeatures: ["faculty", "attendance", "timesheet"],
  },

  payment: {
    sections: [
      {
        type: "hero",
        heading: "Payment Management System",
        description:
          "Manage payments for student fees and course enrollment with a super efficient and integrated financial management suite.",
      },
      {
        type: "checklist",
        heading: "Payment Features",
        items: [
          { text: "Online Payment Collections" },
          { text: "50+ Payment Gateways" },
          { text: "Automated Payment Reconciliation" },
          { text: "Efficient Fees Collection" },
          { text: "Faster Invoice Processing" },
          { text: "Installment plan support with flexible scheduling" },
          { text: "Automated receipt generation and email delivery" },
          { text: "Real-time payment status tracking" },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Simplify Fee Collection With Our Integrated Payment Solution.",
      },
    ],
    relatedFeatures: ["financial", "accounting", "e-commerce"],
  },

  timetable: {
    sections: [
      {
        type: "hero",
        heading: "Timetable Management System",
        description:
          "Simplifies and automates the scheduling process, ensuring that your school's operations run smoothly and efficiently with easy session scheduling and instant notifications.",
      },
      {
        type: "feature-cards",
        heading: "Key Features",
        cards: [
          {
            title: "Easy Timetable Management",
            description:
              "Schedule and manage timetables effortlessly with intuitive tools and features.",
          },
          {
            title: "Pre-set Timetables",
            description:
              "Admins can quickly set timetables for all classes for any term, streamlining scheduling.",
          },
          {
            title: "Custom Class Timings",
            description:
              "Create various timing sets for different periods to match your institution's needs.",
          },
          {
            title: "Simple Subject Allocation",
            description:
              "Allocate subjects to teachers with ease, ensuring smooth class management.",
          },
          {
            title: "Teacher Access",
            description:
              "Teachers can view their timetables from their login to plan their schedules effectively.",
          },
          {
            title: "Student Timetable Access",
            description:
              "Students can check their weekly or daily schedules to stay organized and informed.",
          },
          {
            title: "Classroom Management",
            description:
              "Effortlessly manage classroom allocations to optimize space and resources.",
          },
          {
            title: "Institutional Reports",
            description:
              "Generate detailed timetable reports for analysis or display on notice boards.",
          },
          {
            title: "Instant Swap Notifications",
            description:
              "Automatically notify teachers instantly when timetable swaps are made.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Revolutionize your scheduling process. Contact us today to see how our solution can transform your institution.",
      },
    ],
    relatedFeatures: ["classroom", "timesheet", "course"],
  },

  timesheet: {
    sections: [
      {
        type: "hero",
        heading: "We Believe In Making Each Second Count, Every Single Day!",
        description:
          "A powerful timesheet tool to track time. Record attendance, productivity and other stats. Accessible from any device or location.",
      },
      {
        type: "alternating-blocks",
        heading: "Timesheet Features",
        blocks: [
          {
            heading: "Easily Track Your Time Wherever You Are",
            description:
              "Faculty and staff can update attendance and work hours through automated logging. Tag time entries effortlessly with no manual input required.",
          },
          {
            heading: "Generates Regular Reports",
            description:
              "Access detailed reports on project details, money earned and billable hours. Weekly timesheets allow you to assess your team's performance.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading: "See Our Timesheet System Live and In Action!",
      },
    ],
    relatedFeatures: ["attendance", "payroll", "reporting"],
  },
}
