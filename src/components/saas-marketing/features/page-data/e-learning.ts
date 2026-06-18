// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"

export const eLearningPageData: Record<string, FeaturePageData> = {
  "e-learning": {
    sections: [
      {
        type: "hero",
        heading: "E-Learning Platform",
        description:
          "Elevate the educational experience at your institution with our integrated E-Learning platform that offers seamless virtual instruction and content management.",
      },
      {
        type: "feature-cards",
        heading: "Key Features of E-Learning",
        cards: [
          {
            title: "Customizable Learning Paths",
            description:
              "Create personalized learning journeys for each student.",
          },
          {
            title: "Easy Course & Content Management",
            description:
              "Organize lessons, resources, and multimedia content with ease.",
          },
          {
            title: "Virtual Classroom Platform",
            description:
              "Integrated live video sessions with interactive collaborative tools.",
          },
          {
            title: "Gamification & Motivation",
            description:
              "Utilize badges, points, and leaderboards to keep students engaged.",
          },
        ],
      },
      {
        type: "benefits-grid",
        heading: "Benefits of E-Learning",
        items: [
          {
            title: "Centralized Learning Portal",
            description:
              "All academic materials, assignments, and sessions in one place.",
          },
          {
            title: "Enhanced Accessibility",
            description:
              "Learn from anywhere on any device with flexible scheduling.",
          },
          {
            title: "Progress & Engagement Analytics",
            description:
              "Detailed tracking of student performance and resource usage.",
          },
        ],
      },
    ],
    relatedFeatures: ["assignment", "qbank", "exam"],
  },

  qbank: {
    sections: [
      {
        type: "hero",
        heading: "Question Bank Management",
        description:
          "Build a comprehensive central repository of questions to simplify exam creation, homework generation, and randomized student testing.",
      },
      {
        type: "feature-cards",
        heading: "Maximize Assessment Efficiency",
        cards: [
          {
            title: "Rich Question Types",
            description:
              "Support for multiple-choice, fill-in-the-blanks, true/false, and descriptive questions.",
          },
          {
            title: "Categorization & Tagging",
            description:
              "Organize questions by subject, unit, difficulty level, and cognitive learning objectives.",
          },
          {
            title: "Auto-Generate Exams",
            description:
              "Instantly compile randomized, balanced exams based on custom specifications and criteria.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Benefits of a Centralized Question Bank",
        items: [
          { text: "Reduces exam preparation time for teachers" },
          { text: "Ensures test integrity with randomized questions" },
          { text: "Allows collaborative question building among faculty" },
          { text: "Maintains history of question performance and usage" },
        ],
      },
    ],
    relatedFeatures: ["e-learning", "exam", "assignment"],
  },
}
