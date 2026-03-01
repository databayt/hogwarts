// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"

export const communicationPageData: Record<string, FeaturePageData> = {
  blog: {
    sections: [
      {
        type: "hero",
        heading: "Blog",
        description:
          "Deliver and share knowledge with everyone by creating well-informed and designed blogs by students or faculties.",
      },
      {
        type: "checklist",
        heading: "Blog Features",
        items: [
          { text: "Share on Social Media" },
          { text: "Create Informative Environment" },
          { text: "Communicate Effectively" },
        ],
      },
    ],
    relatedFeatures: ["news-portal", "forum", "discussion"],
  },

  discussion: {
    sections: [
      {
        type: "hero",
        heading: "Discussion",
        description:
          "Coordinate and discuss on topics of interest in the open for all environment with easy to use built-in conversation channels.",
      },
      {
        type: "checklist",
        heading: "Discussion Features",
        items: [
          { text: "Multiple Discussion Rooms" },
          { text: "#hashtags" },
          { text: "User Tagging" },
        ],
      },
    ],
    relatedFeatures: ["forum", "blog", "notice-board"],
  },

  forum: {
    sections: [
      {
        type: "hero",
        heading: "Forum",
        description:
          "Provide students and faculties with an environment where communication is open and collaborative with open Q&A forum.",
      },
      {
        type: "checklist",
        heading: "Forum Features",
        items: [
          { text: "Post Moderation" },
          { text: "Question and Answers" },
          { text: "Badges" },
          { text: "Gamification" },
        ],
      },
    ],
    relatedFeatures: ["discussion", "blog", "lms"],
  },

  grievance: {
    sections: [
      {
        type: "hero",
        heading: "Grievance Management",
        description:
          "A helping hand to students, staff, and parents by acknowledging and solving their problems.",
      },
      {
        type: "checklist",
        heading: "Grievance Features",
        items: [
          { text: "Grievances from students, parents and staff" },
          { text: "Helps in better administration and discipline" },
          { text: "Actions are confirmed and closed by the complainant" },
          { text: "Details can be extracted using various reports" },
        ],
      },
    ],
    relatedFeatures: ["helpdesk", "survey", "notice-board"],
  },

  helpdesk: {
    sections: [
      {
        type: "hero",
        heading: "World-Class Student Success Services",
        description:
          "Intuitive and effective student support software that helps thousands of schools across the world connect with students, answer queries, and resolve issues.",
      },
      {
        type: "feature-cards",
        heading: "Helpdesk Capabilities",
        cards: [
          {
            title: "Powerful and Effective",
            description:
              "Connect with students, answer queries, and resolve issues with advanced helpdesk capabilities.",
          },
          {
            title: "Ensure 100% Satisfaction",
            description:
              "Smart assignment prioritizes tickets to resolve emergency issues quickly.",
          },
          {
            title: "Deep Analysis and Reporting",
            description:
              "Insights into support team performance, customer satisfaction, and organizational bottlenecks.",
          },
        ],
      },
      {
        type: "alternating-blocks",
        heading: "A Super-Efficient System",
        blocks: [
          {
            heading: "Centralized Issue Resolution",
            description:
              "A single point of connection between students and faculty for speedy resolution via chat, email, and social media.",
          },
          {
            heading: "Customizable Workflows",
            description:
              "Customizable workflows for assignment and prioritization with granular control.",
          },
          {
            heading: "Track Satisfaction",
            description:
              "Create knowledge bases, configure satisfaction surveys, and track response times.",
          },
        ],
      },
    ],
    relatedFeatures: ["grievance", "online-appointment", "survey"],
  },

  "news-portal": {
    sections: [
      {
        type: "hero",
        heading: "News Portal",
        description:
          "Publish all new happenings of the organization using a news portal to keep everyone well informed.",
      },
      {
        type: "checklist",
        heading: "News Portal Features",
        items: [
          { text: "Manage Publishing" },
          { text: "Editor and Publisher Access" },
        ],
      },
    ],
    relatedFeatures: ["blog", "notice-board", "events"],
  },

  "notice-board": {
    sections: [
      {
        type: "hero",
        heading: "Notice Board",
        description:
          "Students can get information regarding upcoming tests and assignments from the teachers and administration before the due date.",
      },
      {
        type: "checklist",
        heading: "Notice Board Features",
        items: [
          { text: "Share Circular with Students & Parents" },
          { text: "Inform Students in Advance for Tests & Exams" },
          { text: "Students Will Get Easily Notified about Events" },
          { text: "Easily Send Notice to Parents Regarding Meetings" },
          { text: "Students & Parents Get Notice via Email & SMS" },
        ],
      },
    ],
    relatedFeatures: ["news-portal", "blog", "events"],
  },

  "online-appointment": {
    sections: [
      {
        type: "hero",
        heading: "Online Appointment Management Software",
        description:
          "The first online appointment scheduling platform dedicated to Education, revolutionizing how students and educators connect.",
      },
      {
        type: "alternating-blocks",
        heading: "Appointment Features",
        blocks: [
          {
            heading: "Online Booking",
            description:
              "Book appointments via online mode. No need to go physical. Reschedule bookings at your convenience.",
          },
          {
            heading: "Confirmation",
            description:
              "Get confirmation through registered email or contact number. Rescheduling and changes communicated automatically.",
          },
          {
            heading: "Alerts & Notifications",
            description:
              "Notifications for appointment-related updates sent via email, including reminders for scheduling.",
          },
          {
            heading: "Calendar Synchronized",
            description:
              "All appointments can be managed with reminders on each scheduling. Tasks done automatically.",
          },
        ],
      },
    ],
    relatedFeatures: ["helpdesk", "events", "notice-board"],
  },

  poll: {
    sections: [
      {
        type: "hero",
        heading: "Poll",
        description:
          "Make inclusive decisions by enabling organizational users to give a voice to their opinions using their vote in the poll.",
      },
      {
        type: "checklist",
        heading: "Poll Features",
        items: [
          { text: "Simple Reporting" },
          { text: "Mass Emailing" },
          { text: "Easy to Administer" },
        ],
      },
    ],
    relatedFeatures: ["survey", "discussion", "forum"],
  },

  "secure-transcript": {
    sections: [
      {
        type: "hero",
        heading: "Get Your Digital Credentials Verified",
        description:
          "Get secure and tamper-proof results and transcript with real-time verification QR code.",
      },
      {
        type: "feature-cards",
        heading: "Transcript Features",
        cards: [
          {
            title: "Get Verified Quickly",
            description:
              "Instantly verifiable student transcript with real-time verification QR code.",
          },
          {
            title: "Save Time and Effort",
            description:
              "Save time in the manual verification and validation process.",
          },
          {
            title: "Enhance Reputation",
            description:
              "Schools and employers can verify online degrees, diplomas and other credentials.",
          },
        ],
      },
      {
        type: "alternating-blocks",
        heading: "Why Use Secure Transcripts?",
        blocks: [
          {
            heading: "Low Maintenance and Cost-Effective",
            description:
              "Prevents counterfeiting with user-friendly, low-maintenance solution.",
          },
          {
            heading: "Easy to Use",
            description: "QR code-based verification accessible via scanning.",
          },
          {
            heading: "Building Trust",
            description:
              "Certificate security framework addressing counterfeiting concerns.",
          },
          {
            heading: "Track and Trace",
            description: "Platform for validating and credentialing education.",
          },
        ],
      },
    ],
    relatedFeatures: ["documents", "e-sign", "gradebook"],
  },

  survey: {
    sections: [
      {
        type: "hero",
        heading: "Survey",
        description:
          "Get instant feedback on various activities of the organization with quick to go surveys using built-in survey system.",
      },
      {
        type: "checklist",
        heading: "Survey Features",
        items: [
          { text: "Share and Collect" },
          { text: "Analyze" },
          { text: "Simple and Intuitive" },
        ],
      },
    ],
    relatedFeatures: ["poll", "grievance", "forum"],
  },
}
