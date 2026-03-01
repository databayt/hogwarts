// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"

export const advancePageData: Record<string, FeaturePageData> = {
  "advance-accounting": {
    sections: [
      {
        type: "hero",
        heading: "Quick, Accurate and Cost Effective Cloud-Based Accounting",
        description:
          "An easy-to-use accounting system with all good practices built-in. Create invoices, track expenses, accept payments and handle taxes with ease.",
      },
      {
        type: "feature-cards",
        heading: "Core Accounting Features",
        cards: [
          {
            title: "Tax Management",
            description:
              "Powerful tool for income tax calculation and preparation that creates invoices and derives preliminary tax data.",
          },
          {
            title: "Easily Scalable",
            description:
              "Scalable accounting software that adapts to the changing needs of your institution.",
          },
          {
            title: "Simplified Reporting",
            description:
              "Monitor and analyze critical business metrics in real-time instead of waiting months.",
          },
        ],
      },
      {
        type: "alternating-blocks",
        heading: "Faster Invoicing and Fees Reminders",
        blocks: [
          {
            heading: "Impressive Invoicing",
            description:
              "Create professional invoices and send them with one click. Set up automated follow-ups and reconcile multiple payments.",
          },
          {
            heading: "Multi-Currency and Global Payments",
            description:
              "Receive payments from international students in a wide variety of currencies with advanced payment processing.",
          },
          {
            heading: "Smart Vendor Payments",
            description:
              "Cloud-based solution to make payments to suppliers, process batch payments, and automate getting paid.",
          },
          {
            heading: "Legal Statements",
            description:
              "Automatically generated P&Ls, Cash Flow statements, General Ledger, country-specific tax reports, and balance sheets.",
          },
        ],
      },
      {
        type: "alternating-blocks",
        heading: "Complete Accounting Solution",
        blocks: [
          {
            heading: "Easy Reconciliation",
            description:
              "Eliminate manual accounting processes and tackle complex accounting tasks with an elegant user interface.",
          },
          {
            heading: "Smart Payables and Receivables",
            description:
              "Manage expenses with features like mileage tracking and expense reporting.",
          },
          {
            heading: "Built for Global and Local Leaders",
            description:
              "Single integrated solution to manage assets, transact, and record transactions in real time.",
          },
          {
            heading: "Schedule and Automate",
            description:
              "Track recurring payments, recurring expenses, and pay bills with just a few clicks.",
          },
        ],
      },
      {
        type: "feature-cards",
        heading: "Advanced Reporting and Analytics",
        cards: [
          {
            title: "Customizable Reports",
            description:
              "Easy-to-use dashboards for performance analysis with customizable KPIs and shareable annotated figures.",
          },
          {
            title: "Optimize Business Operations",
            description:
              "Analytics platform to analyze key metrics and optimize your business to improve revenues.",
          },
          {
            title: "Data-Driven Decisions",
            description:
              "Combine business intuition with insights to improve margins and reduce costs.",
          },
          {
            title: "Intelligent Reporting",
            description:
              "Fully-integrated solution to manage all business activities from a single dashboard.",
          },
        ],
      },
    ],
    relatedFeatures: ["accounting", "financial", "expense"],
  },

  "assignment-annotation": {
    sections: [
      {
        type: "hero",
        heading: "Assignment Annotation",
        description:
          "Assignment annotation enhances understanding, critical thinking, and work quality by enabling educators to add notes, comments, and markup digitally.",
      },
      {
        type: "feature-cards",
        heading: "Annotation Capabilities",
        cards: [
          {
            title: "Inline Annotation Tools",
            description:
              "Detailed feedback on submissions with highlighting and markup capabilities.",
          },
          {
            title: "Comment Threads",
            description:
              "Ongoing discussion on specific sections with revision history tracking.",
          },
          {
            title: "Batch Annotation",
            description:
              "Common feedback across multiple submissions with digital pen support.",
          },
        ],
      },
    ],
    relatedFeatures: ["assignment", "gradebook", "lms"],
  },

  "automated-marketing": {
    sections: [
      {
        type: "hero",
        heading: "The Ultimate Marketing Automation Platform",
        description:
          "Make your marketing campaigns smarter and more efficient. Integrate email marketing with CRM, leverage analytics to drive sales, and develop personalized communications across channels.",
      },
      {
        type: "alternating-blocks",
        heading: "Marketing Automation Features",
        blocks: [
          {
            heading: "Smart Email Marketing Tool",
            description:
              "Streamline lead nurturing and conversion processes. From email marketing to social media, create meaningful customer experiences.",
          },
          {
            heading: "Optimize Customer Journey",
            description:
              "Create personalized customer journeys for each target segment. Automate every aspect of the sales funnel.",
          },
          {
            heading: "Beautiful, Professional Emails",
            description:
              "Create marketing emails with powerful templates and rich content. Personalize with visual builder and targeted coupons.",
          },
          {
            heading: "Control Purchase Journey",
            description:
              "Create a compelling customer decision journey that rewards email responders and guides them through the sales funnel.",
          },
          {
            heading: "Advanced Analytics",
            description:
              "Analyze audience response, compare ad performance, and make improvements based on predictive analytics.",
          },
        ],
      },
    ],
    relatedFeatures: ["crm", "email-marketing", "social-media-marketing"],
  },

  biometric: {
    sections: [
      {
        type: "hero",
        heading: "Biometric Attendance Management System",
        description:
          "Seamlessly integrated with the online platform, offering a robust and efficient solution for maintaining accurate attendance records with support for 100+ biometric devices.",
      },
      {
        type: "stats-bar",
        items: [
          { value: "100+", label: "Biometric Devices Supported" },
          { value: "300K+", label: "Monthly Check-ins Globally" },
          { value: "99.9%", label: "Accuracy Rate" },
        ],
      },
      {
        type: "feature-cards",
        heading: "Key Capabilities",
        cards: [
          {
            title: "Real-Time Monitoring",
            description:
              "Real-time attendance monitoring for students and employees.",
          },
          {
            title: "Device Integration",
            description:
              "Integration with 100+ biometric devices and scanners.",
          },
          {
            title: "Web-Based Contingency",
            description: "Web-based check-in/out contingency options.",
          },
          {
            title: "Automated Sync",
            description:
              "Automated data synchronization to the central system.",
          },
          {
            title: "Error Elimination",
            description:
              "Elimination of manual entry errors and fraudulent records.",
          },
          {
            title: "Payroll Integration",
            description:
              "Streamlined payroll processing with precise hour calculations.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Why Choose Biometric Attendance?",
        items: [
          {
            text: "Prevent unauthorized access through biometric authentication",
          },
          { text: "Transparency for tracking overtime and late arrivals" },
          { text: "Cost savings by reducing manual attendance management" },
          { text: "Scalable solution for institutions of any size" },
          { text: "Secure prevention of buddy punching" },
        ],
      },
    ],
    relatedFeatures: ["attendance", "face-recognition", "payroll"],
  },

  dashboard: {
    sections: [
      {
        type: "hero",
        heading: "Dashboard",
        description:
          "All the important data on one single screen. Keep track of important KPIs and make well-informed decisions.",
      },
      {
        type: "feature-cards",
        heading: "Dashboard Features",
        cards: [
          {
            title: "All KPI At One Place",
            description:
              "Centralize important data for at-a-glance monitoring.",
          },
          {
            title: "User Based",
            description: "Role-specific views for each user type.",
          },
          {
            title: "Highly Customizable",
            description: "Custom widgets and configurable layouts.",
          },
          {
            title: "Easy To Configure",
            description: "Straightforward setup with intuitive tools.",
          },
          {
            title: "Well Structured",
            description:
              "Interactive charts with drill-down capability and trend analysis.",
          },
        ],
      },
    ],
    relatedFeatures: ["kpi-dashboard", "reporting", "accounting"],
  },

  "digital-library": {
    sections: [
      {
        type: "hero",
        heading: "Digital Library",
        description:
          "Digital libraries are the new phase of this digital era. Access online digital content, websites, ebooks, video resources, catalog, and inventory in multiple formats.",
      },
      {
        type: "feature-cards",
        heading: "Digital Library Capabilities",
        cards: [
          {
            title: "Multiple Simultaneous Access",
            description:
              "Published books and resources accessible by multiple users simultaneously.",
          },
          {
            title: "Real-Time Flipbook",
            description:
              "Experience mimicking traditional reading with digital flipbooks.",
          },
          {
            title: "Engagement Tracking",
            description:
              "User engagement tracking with time spent per page analytics.",
          },
          {
            title: "Detailed Material Pages",
            description:
              "Publisher, author, and category metadata for all resources.",
          },
          {
            title: "User Reviews",
            description:
              "Community-driven recommendations through review functionality.",
          },
          {
            title: "Multiple Formats",
            description: "Support for text, images, videos, and audio content.",
          },
        ],
      },
    ],
    relatedFeatures: ["library", "lms", "course"],
  },

  documents: {
    sections: [
      {
        type: "hero",
        heading: "Document Management System",
        description:
          "Get faculty and students to use the same platform for managing school documents and check compliance on an easy-to-use website.",
      },
      {
        type: "feature-cards",
        heading: "Document Management Features",
        cards: [
          {
            title: "Instant Document Access",
            description: "Access from browser with intuitive navigation.",
          },
          {
            title: "Streamlined Processes",
            description: "Automated workflows for document handling.",
          },
          {
            title: "Enhanced Security",
            description: "Centralized storage with access controls.",
          },
          {
            title: "Paperless Operations",
            description: "Digital storage enabling paperless workflows.",
          },
          {
            title: "Complete Audit Trails",
            description: "Transparency and accountability with full tracking.",
          },
          {
            title: "Collaborative Environment",
            description: "Sharing and simultaneous editing capabilities.",
          },
        ],
      },
    ],
    relatedFeatures: ["e-sign", "admission", "secure-transcript"],
  },

  events: {
    sections: [
      {
        type: "hero",
        heading: "Events Management",
        description:
          "Organize events, publish event information and images, send RSVP to attendees and keep the count of who joined in.",
      },
      {
        type: "checklist",
        heading: "Events Features",
        items: [
          { text: "Organize Events" },
          { text: "Sell Tickets" },
          { text: "Track Attendees" },
          { text: "Integrated Communication" },
          { text: "Publish on Social Media" },
          { text: "Create Tickets with Barcode" },
        ],
      },
    ],
    relatedFeatures: ["notice-board", "survey", "online-appointment"],
  },

  "e-sign": {
    sections: [
      {
        type: "hero",
        heading: "E-Sign for Education",
        description:
          "Streamline the documentation process by utilizing e-sign. Combine affordable tools with paperless processes to simplify document management.",
      },
      {
        type: "feature-cards",
        heading: "E-Sign Capabilities",
        cards: [
          {
            title: "Multiple Signing Options",
            description:
              "Self-signature, in-person, and remote signing requests.",
          },
          {
            title: "Configurable Workflows",
            description: "Define signing order and delivery methods.",
          },
          {
            title: "Real-Time Status Tracking",
            description: "Alerts for document signing progress.",
          },
          {
            title: "Bulk Send",
            description: "Send documents to multiple signers simultaneously.",
          },
        ],
      },
    ],
    relatedFeatures: ["documents", "admission", "secure-transcript"],
  },

  "face-recognition": {
    sections: [
      {
        type: "hero",
        heading: "Face Recognition Attendance",
        description:
          "Face recognition can be used to track the attendance of students. This information can be used to identify students who are frequently absent.",
      },
      {
        type: "feature-cards",
        heading: "Face Recognition Features",
        cards: [
          {
            title: "Contactless Attendance",
            description: "No physical contact required for check-in.",
          },
          {
            title: "Real-Time Recognition",
            description: "Instant identification and attendance marking.",
          },
          {
            title: "Anti-Spoofing",
            description: "Advanced liveness detection to prevent fraud.",
          },
          {
            title: "Integration Ready",
            description:
              "Seamless integration with attendance management system.",
          },
        ],
      },
    ],
    relatedFeatures: ["biometric", "attendance", "dashboard"],
  },

  "kpi-dashboard": {
    sections: [
      {
        type: "hero",
        heading: "KPI Dashboard",
        description:
          "Monitor all your departments from a real-time Dashboard. A comprehensive overview of the health of the business or organization.",
      },
      {
        type: "feature-cards",
        heading: "Dashboard Capabilities",
        cards: [
          {
            title: "Data Visualization",
            description:
              "Eight chart types: line, bar, pie, doughnut, area, polar area, and list views with target overlays.",
          },
          {
            title: "Track KPI Metrics",
            description:
              "Identify new opportunities and improve sales and marketing performance through KPI monitoring.",
          },
          {
            title: "Responsive Design",
            description: "Adapts to Desktop, Tablet, and Mobile Phones.",
          },
          {
            title: "Predefined Templates",
            description:
              "Multiple template styles with customizable color schemes.",
          },
          {
            title: "Export/Import",
            description:
              "Export charts to Excel, PDF, PNG and transfer data between databases.",
          },
          {
            title: "Automatic Refresh",
            description:
              "Data refreshes at configurable intervals with date filter options.",
          },
        ],
      },
    ],
    relatedFeatures: ["dashboard", "reporting", "advance-accounting"],
  },

  library: {
    sections: [
      {
        type: "hero",
        heading: "Library Management",
        description:
          "Easily manage books, articles, media, and other library materials in a centralized system with barcode support.",
      },
      {
        type: "feature-cards",
        heading: "Library Features",
        cards: [
          {
            title: "Barcode Management",
            description:
              "Track book availability and prevent theft with barcode scanning.",
          },
          {
            title: "Catalog Management",
            description:
              "Classify books by subject and maintain organized inventory.",
          },
          {
            title: "Issue and Return",
            description: "Streamlined book issue and return tracking system.",
          },
          {
            title: "Fine Management",
            description: "Automated fine calculation for late returns.",
          },
          {
            title: "Student Access",
            description: "Students can search and reserve books online.",
          },
          {
            title: "Reports",
            description: "Detailed reports on book usage and availability.",
          },
        ],
      },
    ],
    relatedFeatures: ["digital-library", "course", "student"],
  },

  "live-classroom": {
    sections: [
      {
        type: "hero",
        heading: "Live Classroom",
        description:
          "A Live classroom shares many functions of a regular classroom like taking attendance, proctored assignments, participation tracking, and virtual desk view.",
      },
      {
        type: "feature-cards",
        heading: "Live Classroom Features",
        cards: [
          {
            title: "Real-Time Video",
            description: "HD audio and video for live virtual classes.",
          },
          {
            title: "Attendance Tracking",
            description: "Automated attendance capture during live sessions.",
          },
          {
            title: "Screen Sharing",
            description: "Share presentations, documents, and applications.",
          },
          {
            title: "Whiteboard",
            description: "Built-in collaborative whiteboard for teaching.",
          },
          {
            title: "Recording",
            description: "Record sessions for later playback and review.",
          },
          {
            title: "Breakout Rooms",
            description: "Small group discussions within larger classes.",
          },
        ],
      },
    ],
    relatedFeatures: ["bigbluebutton", "zoom", "google-meet"],
  },

  "mobile-application": {
    sections: [
      {
        type: "hero",
        heading: "Mobile Application",
        description:
          "Let students easily access information about their assignments, classes, and events using dedicated mobile apps for students, parents, and faculty.",
      },
      {
        type: "feature-cards",
        heading: "Mobile Apps",
        cards: [
          {
            title: "Students App",
            description:
              "Access assignments, schedules, grades, and campus information on the go.",
          },
          {
            title: "Parents App",
            description:
              "Monitor child's progress, fees, attendance, and communicate with teachers.",
          },
          {
            title: "Faculty App",
            description:
              "Manage classes, take attendance, update grades, and communicate with students.",
          },
        ],
      },
    ],
    relatedFeatures: ["dashboard", "attendance", "payment"],
  },

  "multi-approvals": {
    sections: [
      {
        type: "hero",
        heading: "Multi Approvals",
        description:
          "Handle all educational institute requests in one place. Create different approval types based on defined models.",
      },
      {
        type: "feature-cards",
        heading: "Approval Management Features",
        cards: [
          {
            title: "Custom Approval Types",
            description: "Define approval workflows for any request type.",
          },
          {
            title: "Multi-Level Approvals",
            description: "Sequential and parallel approval chains.",
          },
          {
            title: "Automated Routing",
            description: "Requests automatically routed to the right approver.",
          },
          {
            title: "Status Tracking",
            description: "Real-time tracking of approval progress.",
          },
        ],
      },
    ],
    relatedFeatures: ["leave-request", "expense", "documents"],
  },

  "no-code-studio": {
    sections: [
      {
        type: "hero",
        heading: "No Code Studio",
        description:
          "Quickly get your models up and going and focus on the crucial parts of your application. Create custom views and modify existing ones without code.",
      },
      {
        type: "feature-cards",
        heading: "No Code Capabilities",
        cards: [
          {
            title: "Visual Builder",
            description:
              "Create and modify views with drag-and-drop interface.",
          },
          {
            title: "Custom Models",
            description: "Define data models without writing code.",
          },
          {
            title: "Workflow Automation",
            description: "Automate processes with visual workflow builder.",
          },
          {
            title: "Form Builder",
            description: "Create custom forms for any data collection need.",
          },
        ],
      },
    ],
    relatedFeatures: ["customizable", "modular", "reporting"],
  },

  omr: {
    sections: [
      {
        type: "hero",
        heading: "OMR - Optical Mark Recognition",
        description:
          "Makes it easy to conduct objective or MCQ exams with ease. Students can upload the OMR Answer Sheet from their mobile phone, PC, or tablet.",
      },
      {
        type: "feature-cards",
        heading: "OMR Features",
        cards: [
          {
            title: "Mobile Upload",
            description: "Students upload answer sheets from any device.",
          },
          {
            title: "Instant Grading",
            description: "Automated scanning and grading of answer sheets.",
          },
          {
            title: "Detailed Analytics",
            description: "Question-wise analysis and performance reports.",
          },
          {
            title: "Template Design",
            description: "Custom OMR sheet templates for different exams.",
          },
        ],
      },
    ],
    relatedFeatures: ["exam", "quiz", "gradebook"],
  },

  "quiz-anti-cheating": {
    sections: [
      {
        type: "hero",
        heading: "Quiz Anti Cheating",
        description:
          "Quiz Anti Cheating mode will keep the examination like a tough and tight invigilator. Whether students seriously participated or not can be detected.",
      },
      {
        type: "feature-cards",
        heading: "Anti-Cheating Features",
        cards: [
          {
            title: "Browser Lockdown",
            description:
              "Prevents switching tabs or opening new windows during exams.",
          },
          {
            title: "Activity Monitoring",
            description: "Tracks student behavior during the exam session.",
          },
          {
            title: "Time Tracking",
            description: "Monitors time spent on each question.",
          },
          {
            title: "Integrity Reports",
            description:
              "Detailed reports on student behavior during assessments.",
          },
        ],
      },
    ],
    relatedFeatures: ["quiz", "exam", "lms"],
  },

  reporting: {
    sections: [
      {
        type: "hero",
        heading: "Reporting",
        description:
          "Get insights on various departments and activities for the organization with the use of built-in reporting engine.",
      },
      {
        type: "checklist",
        heading: "Reporting Capabilities",
        items: [
          { text: "Advance Analysis" },
          { text: "Built-in Business Intelligence" },
          { text: "Seamlessly Powerful Reporting" },
          { text: "Self-Service Analytics" },
          { text: "Custom report creation" },
          { text: "Export to multiple formats" },
        ],
      },
    ],
    relatedFeatures: ["dashboard", "kpi-dashboard", "advance-accounting"],
  },

  thesis: {
    sections: [
      {
        type: "hero",
        heading: "Thesis Management",
        description:
          "Manage the entire thesis lifecycle from proposal to archiving while ensuring collaboration, compliance, and academic integrity.",
      },
      {
        type: "feature-cards",
        heading: "Thesis Management Features",
        cards: [
          {
            title: "Proposal Submission",
            description: "Structured proposal submission and review process.",
          },
          {
            title: "Advisor Assignment",
            description: "Match students with appropriate thesis advisors.",
          },
          {
            title: "Progress Tracking",
            description:
              "Monitor milestones and deadlines throughout the process.",
          },
          {
            title: "Defense Scheduling",
            description: "Coordinate defense dates with committee members.",
          },
          {
            title: "Plagiarism Check",
            description: "Integration with plagiarism detection tools.",
          },
          {
            title: "Archive Management",
            description: "Digital archiving of completed theses.",
          },
        ],
      },
    ],
    relatedFeatures: ["course", "gradebook", "documents"],
  },

  convocation: {
    sections: [
      {
        type: "hero",
        heading: "All-in-One Convocation Management for Modern Institutions",
        description:
          "Streamline your graduation ceremonies from planning to guest check-in with our complete cloud-based solution.",
      },
      {
        type: "checklist",
        heading: "Convocation Features",
        items: [
          { text: "Student Registration for convocation" },
          { text: "Fee Collection with integrated tracking" },
          { text: "Convocation Pass Generation with QR verification" },
          { text: "Deadline Scheduling & Notifications" },
          { text: "Multi-Language Support" },
        ],
      },
      {
        type: "benefits-grid",
        heading: "Benefits",
        items: [
          {
            title: "Efficiency",
            description: "Eliminate manual paperwork and repetitive tasks.",
          },
          {
            title: "Accuracy",
            description: "Minimize errors with automated data validation.",
          },
          {
            title: "Convenience",
            description: "Students register, pay, and access details online.",
          },
          {
            title: "Customization",
            description: "Tailor forms and settings to match traditions.",
          },
          {
            title: "Security",
            description: "Protect sensitive data with robust access controls.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Transform your convocation ceremonies -- deliver a seamless, organized, and memorable graduation experience!",
      },
    ],
    relatedFeatures: ["student", "documents", "events"],
  },
}
