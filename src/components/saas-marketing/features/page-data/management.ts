// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"

export const managementPageData: Record<string, FeaturePageData> = {
  canteen: {
    sections: [
      {
        type: "hero",
        heading: "Canteen Management",
        description:
          "Barcode supported built-in point of sale system to enable the organization to manage cafeteria for students and faculties.",
      },
      {
        type: "checklist",
        heading: "Canteen Features",
        items: [
          { text: "Full Functional Point of Sale" },
          { text: "Barcode Support" },
          { text: "Kitchen Order Terminal Support" },
          { text: "Student Credit Payments" },
        ],
      },
    ],
    relatedFeatures: ["campus", "stock", "payment"],
  },

  campus: {
    sections: [
      {
        type: "hero",
        heading: "Campus Management",
        description:
          "Easy to use campus management system to manage, book and transact with various campus entities and amenities.",
      },
      {
        type: "checklist",
        heading: "Campus Features",
        items: [
          { text: "Full Assets Management" },
          { text: "Allocation Management" },
          { text: "In Sync With Organization Calendar" },
          { text: "Time Based Facility Allocation" },
        ],
      },
    ],
    relatedFeatures: ["canteen", "transportation", "assets-request"],
  },

  "parent-login": {
    sections: [
      {
        type: "hero",
        heading: "Parent Login",
        description:
          "Give better transparency to a parent about their child's academic activities and achievements by providing dedicated login.",
      },
      {
        type: "checklist",
        heading: "Parent Login Features",
        items: [
          { text: "Dedicated Parents Accounts" },
          { text: "All Children Under Single Login" },
          { text: "Monitor All Activities" },
          { text: "Alerts and Updates" },
          { text: "Parent to Faculty Communication" },
        ],
      },
    ],
    relatedFeatures: ["student", "attendance", "dashboard"],
  },

  placement: {
    sections: [
      {
        type: "hero",
        heading: "Placement Management",
        description:
          "Keep various recruitment activities like recruiters profile, jobs offered, selected students and much more.",
      },
      {
        type: "checklist",
        heading: "Placement Features",
        items: [
          { text: "Placement Detailing" },
          { text: "Easy Search Past Offers" },
          { text: "Status Tracking" },
          { text: "News and Announcements" },
          { text: "Statistical Reporting" },
          { text: "Complete Placement Activity Tracking" },
        ],
      },
    ],
    relatedFeatures: ["recruitment", "student", "crm"],
  },

  transportation: {
    sections: [
      {
        type: "hero",
        heading: "Transportation Management",
        description:
          "Manage transportation facility with predefined routes, fees, pick up and drop points with integrated financial management.",
      },
      {
        type: "checklist",
        heading: "Transportation Features",
        items: [
          { text: "Route and Driver Allocation" },
          { text: "Vehicle Assignment" },
          { text: "Transportation Fees Management" },
          { text: "Daily Route Tracking" },
          { text: "Pick Up & Drop Points" },
          { text: "Instant Notifications" },
        ],
      },
    ],
    relatedFeatures: ["campus", "student", "payment"],
  },
}
