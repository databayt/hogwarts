// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"

export const corePageData: Record<string, FeaturePageData> = {
  admission: {
    sections: [
      {
        type: "hero",
        heading: "Admission Management System",
        description:
          "Admission management software streamlines the admissions process, reducing queues and simplifying enrollment for students and parents through an automated online system.",
      },
      {
        type: "section-heading",
        heading:
          "Online Admission Management System Designed To Meet The Requirements Of All Users",
        description:
          "Effortlessly bridge the gap between applicants and institutions with a system engineered for inclusivity and ease.",
      },
      {
        type: "role-cards",
        heading: "Who Benefits?",
        cards: [
          {
            title: "Candidate",
            description:
              "Replace extensive lines with a self-service prospective student portal. Benefit from continuous support throughout the admissions cycle through thoughtfully crafted communication strategies and reminders.",
          },
          {
            title: "Enrollment Coordinator",
            description:
              "Establish the highest standards in recruitment practices and significantly enhance your recruitment team's efficiency through paperless admission automation.",
          },
          {
            title: "Admissions Director",
            description:
              "Enhance operational efficiency by obtaining a comprehensive overview of your applicants, minimizing time-consuming document searches, and improving real-time progress tracking.",
          },
        ],
      },
      {
        type: "benefits-grid",
        heading: "Benefits Of Online Admission Management System",
        description:
          "Online Admission Management System significantly enhances the efficiency, accessibility, and overall quality of the admission process for both educational institutions and applicants.",
        items: [
          {
            title: "Automated Online Software System",
            description:
              "Streamlines all institute processes and operations with comprehensive integrated solutions.",
          },
          {
            title: "Eliminate Stressful Submission Procedures",
            description:
              "Enables candidates to complete application forms at their own convenience in a comfortable setting.",
          },
          {
            title: "Geographical Flexibility",
            description:
              "Facilitates remote admission, fee payment, merit list generation, and removes geographical limitations.",
          },
          {
            title: "Elimination of Lengthy Lines",
            description:
              "Candidates are not required to wait in extended queues to seek clarifications, make payments, or verify their names on merit lists.",
          },
          {
            title: "Labor Cost Reduction",
            description:
              "Institutions are not compelled to allocate extra security personnel to handle large crowds or monotonous procedures.",
          },
          {
            title: "Paperwork Reduction",
            description:
              "As the workflow becomes more streamlined and fully automated, the amount of paperwork is significantly reduced.",
          },
          {
            title: "Boost Productivity",
            description:
              "As a result of the online admission process, institutes can utilize their resources in other activities.",
          },
          {
            title: "Adaptive and User-Friendly",
            description:
              "The complete process is adaptive, and the software is user-friendly and intuitive for students, teachers, and parents.",
          },
          {
            title: "Real-Time Reports",
            description:
              "The system produces real-time, online, and tailor-made reports in the desired formats for all the data.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Step into a Hassle-Free Admission Journey -- Your Gateway to Simplified Enrollments!",
      },
      {
        type: "checklist",
        heading: "Why Use Our Online Admission System?",
        items: [
          { text: "Efficiency" },
          { text: "Accuracy" },
          { text: "Accessibility" },
          { text: "Customization" },
          { text: "Integration" },
          { text: "Data Security" },
          { text: "Reporting and Analytics" },
          { text: "Cost Savings" },
          { text: "User-Friendly Interface" },
          { text: "Streamlined Review" },
        ],
      },
    ],
    relatedFeatures: ["application", "financial", "crm"],
  },

  course: {
    sections: [
      {
        type: "hero",
        heading: "Course Management System",
        description:
          "Course management system software connects educators and learners, enriching the educational journey, aiding institutions in the digital age, and fostering a dynamic learning environment for modern world success.",
      },
      {
        type: "benefits-grid",
        heading: "Benefits Of Course Management System In Education",
        description:
          "Essential tools for managing the complexity of modern classrooms. They enhance the learning experience and improve the efficiency of course management.",
        items: [
          {
            title: "Online Course Creation",
            description:
              "Facilitate the creation of online courses with ease. Instructors can design courses with rich, interactive content accessible from anywhere.",
          },
          {
            title: "Assessment and Progress Tracking",
            description:
              "Incorporate assessment tools for quizzes, tests, and assignments. Track student progress and performance with detailed insights.",
          },
          {
            title: "Centralized Course Delivery",
            description:
              "All course materials, assignments, assessments, and resources are stored in one centralized platform for easy access.",
          },
          {
            title: "Streamlined Communication",
            description:
              "Discussion forums, messaging systems, and email notifications make it simple for instructors and students to communicate and collaborate.",
          },
          {
            title: "Efficient Assessment and Grading",
            description:
              "Create and administer quizzes and assignments within the system. Automated grading and feedback distribution saves time for educators.",
          },
          {
            title: "Analytics and Reporting",
            description:
              "Leverage analytics tools to gain insights into learner engagement and course effectiveness for data-driven decisions.",
          },
          {
            title: "Resource Management",
            description:
              "Organize, store, and share digital resources such as lecture notes, presentations, videos, and readings in a structured manner.",
          },
          {
            title: "Increased Engagement",
            description:
              "Online discussion forums, chat rooms, and collaborative tools encourage student interaction and engagement.",
          },
          {
            title: "Security and Privacy",
            description:
              "Prioritize security and privacy to protect sensitive educational data and user information with strong security measures.",
          },
          {
            title: "Scalability",
            description:
              "Easily scalable, accommodating the needs of both small and large educational institutions.",
          },
          {
            title: "Syllabus Management",
            description:
              "Organize and structure course content, making it easy for instructors to plan their lessons.",
          },
          {
            title: "Enhanced Accessibility",
            description:
              "Students can access course materials and resources from anywhere with an internet connection.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Are You Ready To Embrace The Future Of Education And Training? Get Started On The Journey To Educational Excellence.",
      },
    ],
    relatedFeatures: ["timetable", "assignment", "gradebook"],
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
              "Enables administrators to effortlessly generate exam schedules, simplifying the management of exams, test papers, and essential documents.",
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
    relatedFeatures: ["gradebook", "omr", "quiz"],
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
        heading: "Student Information System",
        description:
          "Collect and oversee all student-related information in a single location, including personal details, attendance records, disciplinary incidents, accomplishments both in and outside of school, and much more.",
      },
      {
        type: "role-cards",
        heading: "What Are The Benefits Of The Student Management System?",
        cards: [
          {
            title: "For Admins",
            description:
              "Simplified admission process, efficient day-to-day operations, centralized data storage facility, and advanced data security measures.",
          },
          {
            title: "For Teachers",
            description:
              "Communication with students and parents, data-driven reports on student progress, centralized grade management, and comprehensive student records.",
          },
          {
            title: "For Students",
            description:
              "Efficient communication with educators, performance monitoring, access to attendance, timetable, and examination schedules, and immediate alerts for crucial events.",
          },
          {
            title: "For Parents",
            description:
              "Monitor and trace students' progress, convenient fee payment, improved communication with instructors, and increased participation in creative programs.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Elevate Your Education Journey: Get Started with Our Student Information System Today!",
      },
      {
        type: "feature-cards",
        heading: "Student Information Management System Capabilities",
        description:
          "Explore the robust capabilities from streamlined data handling to insightful analytics that transform education administration.",
        cards: [
          {
            title: "Student Data Management",
            description:
              "Store and organize all student data, including personal details, academic progress, documents, and attendance.",
          },
          {
            title: "Admission Management",
            description:
              "Automate admissions to reduce errors, manage student and parent info, customize forms, and streamline document handling.",
          },
          {
            title: "Library Management",
            description:
              "Use barcode scanning to track book availability, prevent theft, identify books, and classify books by subject.",
          },
          {
            title: "Attendance Management",
            description:
              "Automate attendance tracking with biometric or RFID, mark attendance by subject or day, and send instant alerts to parents.",
          },
          {
            title: "Report Generation",
            description:
              "Provides diverse reports like attendance, fee pending, and exam results. Easily customize fields to match your institute's unique requirements.",
          },
          {
            title: "Online Fees Payment",
            description:
              "Automate fee submissions, send instant alerts on pending fees to parents and students, and apply taxes and discounts.",
          },
          {
            title: "Examination Management",
            description:
              "Automate the entire examination process, from scheduling exams to sending notifications and sharing results.",
          },
          {
            title: "Transport Management",
            description:
              "Track vehicles and stops in real time with GPS integration, manage transportation fees, and ensure student safety.",
          },
          {
            title: "Alumni Management",
            description:
              "Facilitate student-alumni connections via SMS or email, enabling alumni to mentor students for future challenges.",
          },
          {
            title: "Hostel Management",
            description:
              "Streamline room allocation, fees, and security, and offer a comprehensive view of campus hostels.",
          },
          {
            title: "Communication System",
            description:
              "Improve communication between parents, teachers, and students by integrating SMS and email with customizable messages.",
          },
          {
            title: "Mobile App",
            description:
              "Access all features from anywhere, anytime. View timetable, mark attendance, check exam results, and interact with teachers.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Why Choose Our Student Information Management System?",
        items: [
          { text: "Open Source" },
          { text: "Comprehensive Feature Set" },
          { text: "User-Friendly Interface" },
          { text: "Customization" },
          { text: "Data Security" },
          { text: "Cost-Effective" },
          { text: "Mobile Accessibility" },
          { text: "Community Building" },
        ],
      },
    ],
    relatedFeatures: ["parent-login", "attendance", "gradebook"],
  },
}
