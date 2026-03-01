// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"

export const integrationPageData: Record<string, FeaturePageData> = {
  bigbluebutton: {
    sections: [
      {
        type: "hero",
        heading: "BigBlueButton Integration",
        description:
          "Harness the power of true open source web conferencing for online learning. Enables remote students to have a high-quality online learning experience with real-time audio, video, and screen sharing.",
      },
      {
        type: "feature-cards",
        heading: "BigBlueButton Features",
        cards: [
          {
            title: "Open Source",
            description:
              "Run on your own server for complete privacy and cost control.",
          },
          {
            title: "Real-Time Sharing",
            description: "Audio, video, and screen sharing for live classes.",
          },
          {
            title: "Whiteboard",
            description: "Built-in collaborative whiteboard for teaching.",
          },
          {
            title: "Recording",
            description: "Record sessions for later playback.",
          },
        ],
      },
    ],
    relatedFeatures: ["live-classroom", "zoom", "google-meet"],
  },

  "google-meet": {
    sections: [
      {
        type: "hero",
        heading: "Google Meet Integration",
        description:
          "Organize online classrooms or live meetings with Google Meet. Reliable infrastructure for video conferencing for up to 100 participants.",
      },
      {
        type: "checklist",
        heading: "Google Meet Features",
        items: [
          { text: "Closed Caption in Additional Language" },
          { text: "Raise Hand to Signal Sharing" },
          { text: "7x7 Tile View to See Up to 49 Students" },
          { text: "Track Attendance with Participants Record" },
          { text: "Break Out Room for Small Group Works" },
          { text: "Q&A That's Less Obtrusive to Class Flow" },
          { text: "Polling Tool to Let Students Share Their Voice" },
        ],
      },
    ],
    relatedFeatures: ["live-classroom", "microsoft-teams", "zoom"],
  },

  "microsoft-teams": {
    sections: [
      {
        type: "hero",
        heading: "Microsoft Teams Integration",
        description:
          "Stay connected and organized with Chat, Meet, Call & Collaborate. Whether teaching remotely, in a live classroom, or a combination, Teams simplifies learning.",
      },
      {
        type: "checklist",
        heading: "Microsoft Teams Features",
        items: [
          { text: "Video Conferencing" },
          { text: "Screen Sharing" },
          { text: "Custom Background" },
          { text: "Together Mode" },
          { text: "File Sharing" },
          { text: "Chat" },
          { text: "Meetings" },
          { text: "Privacy and Security" },
        ],
      },
    ],
    relatedFeatures: ["live-classroom", "google-meet", "zoom"],
  },

  zoom: {
    sections: [
      {
        type: "hero",
        heading: "Zoom Integration",
        description:
          "HD audio and video-enabled live classes with up to 100 participants at affordable cost, with easy screen sharing, built-in whiteboards and annotations.",
      },
      {
        type: "checklist",
        heading: "Zoom Features",
        items: [
          { text: "HD Audio and Video Conferencing" },
          { text: "Up to 100 Simultaneous Participants" },
          { text: "Screen Sharing" },
          { text: "Built-in Whiteboard Tools" },
          { text: "Annotation Capabilities" },
          { text: "Moderator-Enabled Passwords" },
          { text: "Recording Options" },
          { text: "One-Click Attendee Communication" },
        ],
      },
    ],
    relatedFeatures: ["live-classroom", "google-meet", "bigbluebutton"],
  },

  "whatsapp-integration": {
    sections: [
      {
        type: "hero",
        heading: "WhatsApp Integration As a Communication Tool",
        description:
          "Communicate with students and parents in a convenient and real-time manner. Share materials, announcements, and reminders.",
      },
      {
        type: "stats-bar",
        items: [
          { value: "60%", label: "Improvement in Student Retention" },
          { value: "45%", label: "Increase in Student Engagement" },
          { value: "70%", label: "Increase in Automated Admission" },
        ],
      },
      {
        type: "feature-cards",
        heading: "Communication & Collaboration",
        cards: [
          {
            title: "Improved Communication",
            description: "Easy way for teachers and students to interact.",
          },
          {
            title: "Convenient Resource Sharing",
            description:
              "Direct sharing of materials, assignments, and videos.",
          },
          {
            title: "Increased Collaboration",
            description:
              "Students exchange ideas for better learning outcomes.",
          },
          {
            title: "Student Onboarding",
            description: "Streamlined onboarding through WhatsApp.",
          },
          {
            title: "Best Reminders",
            description: "Schedule updates sent directly to students.",
          },
          {
            title: "Personalized Feedback",
            description:
              "Enhanced educational experience through targeted responses.",
          },
        ],
      },
    ],
    relatedFeatures: ["email-integration", "notice-board", "helpdesk"],
  },

  "social-media-marketing": {
    sections: [
      {
        type: "hero",
        heading: "Social Media Marketing Tool For Educational Institutions",
        description:
          "Social media marketing in education connects globally, amplifying your institution's marketing goals daily.",
      },
      {
        type: "alternating-blocks",
        heading: "Social Media Marketing Features",
        blocks: [
          {
            heading: "Craft The Perfect Post",
            description:
              "Publishing content on all channels in one simple-to-use dashboard. Draft posts, get feedback, and refine content as a team.",
          },
          {
            heading: "Approvals",
            description:
              "Review posts for quality and brand before hitting publish. Stay in sync with preset schedules.",
          },
          {
            heading: "Account Management",
            description:
              "Easily share and manage access to each social account with centralized control.",
          },
        ],
      },
      {
        type: "benefits-grid",
        heading: "Benefits of Social Media Marketing Tools",
        items: [
          {
            title: "Digital Content Curation",
            description: "Effortless curation of engaging content.",
          },
          {
            title: "Customizable Feeds",
            description: "Tailor embedded social media feeds to your brand.",
          },
          {
            title: "Moderation and Filtering",
            description: "Total control over social media content.",
          },
          {
            title: "Budget-Friendly",
            description: "Cost-effective embedded social media solutions.",
          },
          {
            title: "Time Efficiency",
            description: "Save time with centralized management.",
          },
          {
            title: "Content Aggregation",
            description: "Aggregate content from multiple platforms.",
          },
        ],
      },
    ],
    relatedFeatures: ["automated-marketing", "email-marketing", "blog"],
  },
}
