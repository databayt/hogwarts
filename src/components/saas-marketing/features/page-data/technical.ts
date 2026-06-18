// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"

export const technicalPageData: Record<string, FeaturePageData> = {
  customizable: {
    sections: [
      {
        type: "hero",
        heading: "Customizable",
        description:
          "Extend and customize the system as per your organizational flow to meet the processes of the system.",
      },
      {
        type: "feature-cards",
        heading: "Customization Capabilities",
        cards: [
          {
            title: "Custom Fields",
            description: "Add custom fields to any module without coding.",
          },
          {
            title: "Workflow Customization",
            description:
              "Adapt workflows to match your institutional processes.",
          },
          {
            title: "UI Customization",
            description: "Personalize the interface to match your branding.",
          },
        ],
      },
    ],
    relatedFeatures: ["no-code-studio", "web-service-enabled"],
  },

  "data-import-export": {
    sections: [
      {
        type: "hero",
        heading: "Data Import/Export",
        description:
          "Easily import or export existing data from the system in widely accepted formats like CSV and XLS.",
      },
      {
        type: "feature-cards",
        heading: "Import/Export Features",
        cards: [
          {
            title: "CSV Support",
            description: "Import and export data in CSV format.",
          },
          {
            title: "XLS Support",
            description: "Excel spreadsheet compatibility for data transfer.",
          },
          {
            title: "Bulk Operations",
            description: "Handle large volumes of data efficiently.",
          },
        ],
      },
    ],
    relatedFeatures: ["reporting", "web-service-enabled", "customizable"],
  },

  "full-web-based": {
    sections: [
      {
        type: "hero",
        heading: "Full Web Based",
        description:
          "Can be deployed either on the cloud or on-premise, depending on the organization's preference and requirements.",
      },
      {
        type: "feature-cards",
        heading: "Web-Based Advantages",
        cards: [
          {
            title: "Browser Access",
            description:
              "Access from any modern web browser without installation.",
          },
          {
            title: "Cross-Platform",
            description: "Works on Windows, Mac, Linux, and mobile devices.",
          },
          {
            title: "Always Updated",
            description: "Automatic updates without manual intervention.",
          },
        ],
      },
    ],
    relatedFeatures: ["on-cloud-on-premise", "mobile-application", "secure"],
  },

  "multi-currency": {
    sections: [
      {
        type: "hero",
        heading: "Multi Currency",
        description:
          "Out of box support for multiple currencies, making sure business transactions are always possible in multiple currencies.",
      },
      {
        type: "feature-cards",
        heading: "Multi-Currency Features",
        cards: [
          {
            title: "Currency Conversion",
            description: "Automatic exchange rate calculations.",
          },
          {
            title: "Multiple Payment Currencies",
            description: "Accept payments in different currencies.",
          },
          {
            title: "Financial Reporting",
            description: "Reports in base and foreign currencies.",
          },
        ],
      },
    ],
    relatedFeatures: ["financial", "payment", "accounting"],
  },

  "multi-lingual": {
    sections: [
      {
        type: "hero",
        heading: "Multi Lingual",
        description:
          "User Interface supports multiple languages to make sure more and more users can understand the system.",
      },
      {
        type: "feature-cards",
        heading: "Language Support",
        cards: [
          {
            title: "Multiple Languages",
            description: "Interface available in dozens of languages.",
          },
          {
            title: "RTL Support",
            description:
              "Full right-to-left language support for Arabic, Hebrew, and more.",
          },
          {
            title: "User Preference",
            description: "Each user can select their preferred language.",
          },
        ],
      },
    ],
    relatedFeatures: ["customizable", "full-web-based", "multi-organization"],
  },

  "multi-organization": {
    sections: [
      {
        type: "hero",
        heading: "Multi Organization",
        description:
          "Multiple campuses and multiple branch management, all from one system with ability to separate data from each other.",
      },
      {
        type: "feature-cards",
        heading: "Multi-Organization Features",
        cards: [
          {
            title: "Campus Management",
            description: "Manage multiple campuses from a single system.",
          },
          {
            title: "Data Separation",
            description: "Each organization's data is isolated and secure.",
          },
          {
            title: "Centralized Reporting",
            description: "Consolidated reports across all organizations.",
          },
        ],
      },
    ],
    relatedFeatures: ["campus", "secure", "reporting"],
  },

  "on-cloud-on-premise": {
    sections: [
      {
        type: "hero",
        heading: "On Cloud / On Premise",
        description:
          "Choose the best deployment strategy for your system, on the cloud or at local servers at your own premise.",
      },
      {
        type: "feature-cards",
        heading: "Deployment Options",
        cards: [
          {
            title: "Cloud Deployment",
            description: "Hosted on scalable cloud infrastructure.",
          },
          {
            title: "On-Premise",
            description: "Install on your own servers for full control.",
          },
          {
            title: "Hybrid",
            description:
              "Combine cloud and on-premise for optimal flexibility.",
          },
        ],
      },
    ],
    relatedFeatures: ["full-web-based", "secure"],
  },

  secure: {
    sections: [
      {
        type: "hero",
        heading: "Secure",
        description:
          "Incorporated with security features like granular level data access ensures that your data is secure from unauthorized access.",
      },
      {
        type: "feature-cards",
        heading: "Security Features",
        cards: [
          {
            title: "Granular Access Control",
            description: "Fine-grained permission system for data access.",
          },
          {
            title: "Data Encryption",
            description: "Encryption at rest and in transit for all data.",
          },
          {
            title: "Audit Logging",
            description: "Complete audit trail of all system activities.",
          },
        ],
      },
    ],
    relatedFeatures: ["multi-organization", "on-cloud-on-premise", "documents"],
  },

  "web-service-enabled": {
    sections: [
      {
        type: "hero",
        heading: "Web Service Enabled",
        description:
          "Push and Pull data from various other systems with built-in web services.",
      },
      {
        type: "feature-cards",
        heading: "Web Service Features",
        cards: [
          {
            title: "REST API",
            description: "RESTful API for integration with external systems.",
          },
          {
            title: "Data Sync",
            description: "Bi-directional data synchronization.",
          },
          {
            title: "Webhooks",
            description: "Event-driven notifications to external systems.",
          },
        ],
      },
    ],
    relatedFeatures: ["data-import-export"],
  },
}
