// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"

export const aiPageData: Record<string, FeaturePageData> = {
  "ai-powered": {
    sections: [
      {
        type: "hero",
        heading: "Power of Artificial Intelligence to Revolutionize Education",
        description:
          "AI-powered platform designed to assist educators, students, and content creators in crafting engaging and impactful learning experiences effortlessly.",
      },
      {
        type: "section-heading",
        heading: "Unleash Educational Innovation: Explore AI Powered Platform",
        description:
          "Leverage artificial intelligence to enhance teaching, streamline administration, and personalize learning for more engaging and effective education.",
      },
      {
        type: "feature-cards",
        heading: "AI Features",
        cards: [
          {
            title: "Smart Content Recommendation",
            description:
              "AI algorithms recommend articles, videos, and textbooks based on student interests.",
          },
          {
            title: "Adaptive Learning Content",
            description:
              "Dynamic content adjusts in real-time to each student's learning progress.",
          },
          {
            title: "Student Performance Analytics",
            description:
              "Predicts student performance trends to identify at-risk students early.",
          },
          {
            title: "Intelligent Course Scheduling",
            description:
              "Optimizes schedules considering teacher availability, student preferences, and resources.",
          },
          {
            title: "Automated Quiz Creation",
            description:
              "AI generates curriculum-tailored quizzes for specific student needs.",
          },
          {
            title: "Intelligent Timetable Scheduling",
            description:
              "Optimizes class schedules by considering multiple factors simultaneously.",
          },
          {
            title: "Automated Grading",
            description:
              "Streamline the grading process with AI that automatically evaluates assignments.",
          },
        ],
      },
      {
        type: "benefits-grid",
        heading: "Benefits of AI in Education",
        items: [
          {
            title: "Personalized Learning",
            description: "Experiences tailored to each student's needs.",
          },
          {
            title: "Automated Tasks",
            description:
              "Free up educator time with automated administrative tasks.",
          },
          {
            title: "Enhanced Engagement",
            description: "Virtual assistants and interactive content.",
          },
          {
            title: "Data-Driven Decisions",
            description: "Make informed decisions backed by AI analytics.",
          },
          {
            title: "Efficient Resources",
            description: "Optimize resource allocation across the institution.",
          },
          {
            title: "Early Identification",
            description: "Identify at-risk students before they fall behind.",
          },
        ],
      },
      {
        type: "cta-banner",
        heading:
          "Ready to experience the transformative power of AI in education?",
      },
    ],
    relatedFeatures: ["dashboard", "reporting", "lms"],
  },
}
