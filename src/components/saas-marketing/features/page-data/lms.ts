// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"

export const lmsPageData: Record<string, FeaturePageData> = {
  lms: {
    sections: [
      {
        type: "hero",
        heading: "Learning Management System",
        description:
          "Elevate the educational experience at your institution with our LMS that offers seamless integration and limitless possibilities.",
      },
      {
        type: "feature-cards",
        heading: "Key Features of LMS In Educational Institutes",
        cards: [
          {
            title: "Customizable Learning Path",
            description:
              "Create personalized learning journeys for each student.",
          },
          {
            title: "Easy Course Management",
            description: "Manage courses, modules, and content with ease.",
          },
          {
            title: "Advanced Reporting",
            description:
              "Detailed analytics on student progress and engagement.",
          },
          {
            title: "Virtual Classroom Platform",
            description: "Integrated live sessions with interactive tools.",
          },
          {
            title: "Social Learning",
            description: "Peer-to-peer collaboration and discussion forums.",
          },
          {
            title: "Gamification",
            description:
              "Badges, points, and leaderboards to motivate students.",
          },
          {
            title: "Mobile Learning",
            description: "Access learning content from any device, anywhere.",
          },
        ],
      },
      {
        type: "benefits-grid",
        heading: "Benefits of LMS In Educational Institutes",
        items: [
          {
            title: "Centralized Learning Management",
            description: "All courses and content in one place.",
          },
          {
            title: "Enhanced Accessibility",
            description: "Learn from anywhere with internet access.",
          },
          {
            title: "Interactive Experience",
            description: "Engaging content formats and collaboration tools.",
          },
          {
            title: "Progress Tracking",
            description: "Monitor student performance with detailed analytics.",
          },
          {
            title: "Time and Resource Management",
            description: "Optimize teaching time and resource allocation.",
          },
          {
            title: "Parent Engagement",
            description: "Keep parents informed about their child's progress.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading: "Experience The Future of Education With Our LMS Platform.",
      },
    ],
    relatedFeatures: ["quiz", "course", "assignment"],
  },

  quiz: {
    sections: [
      {
        type: "hero",
        heading: "Engaging Classroom Quiz Activities",
        description:
          "Offers enhancements aimed at fostering practice and test preparation, in addition to student engagement features highly valued by educators.",
      },
      {
        type: "feature-cards",
        heading: "Maximize The Benefits For Your School",
        cards: [
          {
            title: "Assessment & Practice",
            description:
              "Enhancing assessment and practice with a focus on equity.",
          },
          {
            title: "Data-Driven Insights",
            description:
              "Insights through standards-based reports and data-driven instruction.",
          },
          {
            title: "Alignment & Access",
            description:
              "Ensuring alignment and universal access for teachers across campuses.",
          },
        ],
      },
      {
        type: "feature-cards",
        heading: "Types of Quiz Questions",
        description:
          "Quiz questions vary in format and complexity to suit specific objectives.",
        cards: [
          {
            title: "Fill in the Blank",
            description: "Text-based completion questions.",
          },
          {
            title: "Optional Questions",
            description: "Multiple choice and selection questions.",
          },
          {
            title: "Descriptive",
            description: "Free-form written response questions.",
          },
          {
            title: "Drag into Text",
            description: "Interactive drag-and-drop completion.",
          },
          {
            title: "Match Following",
            description: "Match items from two columns.",
          },
          {
            title: "Numeric",
            description: "Number-based answer questions.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Explore A New Education Dimension. Enroll Today For A Transformative Learning Journey.",
      },
    ],
    relatedFeatures: ["lms", "exam", "quiz-anti-cheating"],
  },
}
