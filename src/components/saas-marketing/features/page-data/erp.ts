// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { FeaturePageData } from "../types"

export const erpPageData: Record<string, FeaturePageData> = {
  accounting: {
    sections: [
      {
        type: "hero",
        heading: "Accounting",
        description:
          "Manage financial activities like invoicing, receipt, payments, over dues and balances all using one single integrated system.",
      },
      {
        type: "checklist",
        heading: "Accounting Features",
        items: [
          { text: "Manage Bills & Expenses" },
          { text: "Easy Reconciliation" },
          { text: "Detailed Compliance Reports" },
          { text: "Balance Sheets, Profit & Loss & General Ledger" },
          { text: "Complete Invoicing" },
          { text: "Bank Synchronization" },
          { text: "Beautiful Dynamic Statements" },
        ],
      },
    ],
    relatedFeatures: ["advance-accounting", "financial", "expense"],
  },

  appraisals: {
    sections: [
      {
        type: "hero",
        heading: "Appraisals",
        description:
          "Manage employee evaluations and create appraisal with 360-degree feedback using periodical process.",
      },
      {
        type: "checklist",
        heading: "Appraisal Features",
        items: [
          { text: "Easy Follow-up" },
          { text: "Collect Insightful Information" },
          { text: "Automated Evaluation Process" },
          { text: "Periodical Employee Evaluation" },
        ],
      },
    ],
    relatedFeatures: ["faculty", "recruitment", "reporting"],
  },

  "assets-request": {
    sections: [
      {
        type: "hero",
        heading: "Assets Request",
        description:
          "Effectively track and manage the physical assets of the institution. Improve operational efficiency, reduce costs, and ensure assets are properly tracked.",
      },
      {
        type: "checklist",
        heading: "Asset Management Features",
        items: [
          { text: "Track Asset Request by Students and Faculties" },
          { text: "Track the Usability of School Equipment" },
          { text: "Track Inward/Outward Key Assets Such as Laptops" },
          { text: "Calendar to Highlight Available Assets" },
        ],
      },
    ],
    relatedFeatures: ["stock", "purchase", "campus"],
  },

  crm: {
    sections: [
      {
        type: "hero",
        heading: "CRM",
        description:
          "Automate lead and opportunity tracking with state of the art CRM system built-in giving an unparalleled competitive advantage.",
      },
      {
        type: "checklist",
        heading: "CRM Features",
        items: [
          { text: "True Customer Centric CRM" },
          { text: "Easy Lead Management" },
          { text: "Call and Meeting Logging" },
          { text: "Activity Planner" },
          { text: "Real Time Overview" },
          { text: "Integrated Communications" },
        ],
      },
    ],
    relatedFeatures: ["automated-marketing", "admission", "sales"],
  },

  "e-commerce": {
    sections: [
      {
        type: "hero",
        heading: "E-Commerce",
        description:
          "Collect fees online, sell products and artifacts using integrated e-commerce platform without need of any other tools.",
      },
      {
        type: "checklist",
        heading: "E-Commerce Features",
        items: [
          { text: "Create Modern Online Store" },
          { text: "200+ Themes" },
          { text: "50+ Payment Gateways" },
          { text: "Design In Minutes" },
          { text: "Fully Flexible" },
        ],
      },
    ],
    relatedFeatures: ["payment", "sales", "stock"],
  },

  "email-integration": {
    sections: [
      {
        type: "hero",
        heading: "E-mail Integration",
        description:
          "Integration with email enables increased customizability and better relations with colleagues.",
      },
      {
        type: "checklist",
        heading: "Email Integration Features",
        items: [
          { text: "Send Email From Any Record" },
          { text: "Automatic Updates" },
          { text: "SMTP / POP / IMAP Support" },
        ],
      },
    ],
    relatedFeatures: ["email-marketing", "automated-marketing", "crm"],
  },

  "email-marketing": {
    sections: [
      {
        type: "hero",
        heading: "E-mail Marketing",
        description:
          "Send mass emails to students, parents or future prospective students and keep them informed about your new offerings.",
      },
      {
        type: "checklist",
        heading: "Email Marketing Features",
        items: [
          { text: "Build Awesome Campaigns" },
          { text: "Segment Your Audience" },
          { text: "Click Tracking" },
          { text: "Open Rate Tracking" },
          { text: "Complete Link Tracking" },
        ],
      },
    ],
    relatedFeatures: ["automated-marketing", "email-integration", "crm"],
  },

  expense: {
    sections: [
      {
        type: "hero",
        heading: "Expense Management",
        description:
          "Day to day expense tracking and approvals is now just an easy to do thing using expense management system.",
      },
      {
        type: "checklist",
        heading: "Expense Features",
        items: [
          { text: "Better Reimbursement" },
          { text: "Easy Expense Reporting" },
          { text: "Department Wise Expense Reporting" },
          { text: "Quick and Easy Expense Management" },
        ],
      },
    ],
    relatedFeatures: ["accounting", "advance-accounting", "financial"],
  },

  payroll: {
    sections: [
      {
        type: "hero",
        heading: "Payroll Management",
        description:
          "Easily manage payroll for all types of employees with batch payslip creation integrated with daily attendance.",
      },
      {
        type: "checklist",
        heading: "Payroll Features",
        items: [
          { text: "Structured Contracts" },
          { text: "Allowances and Deductions" },
          { text: "Payslip Batches" },
          { text: "Complete Employee Management" },
          { text: "Employee Self Service Portal" },
          { text: "Contribution Register" },
          { text: "Detailed Reporting" },
        ],
      },
    ],
    relatedFeatures: ["timesheet", "attendance", "accounting"],
  },

  purchase: {
    sections: [
      {
        type: "hero",
        heading: "Purchase Management",
        description:
          "Create indents and manage all organization-wide purchases from a centralized procurement management system with ease.",
      },
      {
        type: "checklist",
        heading: "Purchase Features",
        items: [
          { text: "Purchase Authorization" },
          { text: "Purchase Tenders" },
          { text: "Automated Purchase Workflow" },
          { text: "In Depth Purchase Statistics" },
          { text: "Purchase Indent and Requisition" },
        ],
      },
    ],
    relatedFeatures: ["stock", "expense", "accounting"],
  },

  recruitment: {
    sections: [
      {
        type: "hero",
        heading: "Recruitment",
        description:
          "Recruit organizational staff with built-in recruitment portal providing all the insights into workforce needs.",
      },
      {
        type: "checklist",
        heading: "Recruitment Features",
        items: [
          { text: "Efficient Hiring Process" },
          { text: "Track Job Offers" },
          { text: "Customize Recruitment Process" },
          { text: "Integrated Surveys" },
          { text: "Simplify Application Management" },
        ],
      },
    ],
    relatedFeatures: ["faculty", "appraisals", "crm"],
  },

  sales: {
    sections: [
      {
        type: "hero",
        heading: "Sales Management",
        description:
          "Streamline sales process, including quote to invoicing activities to bring more productivity to the organization.",
      },
      {
        type: "checklist",
        heading: "Sales Features",
        items: [
          { text: "Clear Quoting Process" },
          { text: "Easy Product Pricing" },
          { text: "From Quote to Contract" },
        ],
      },
    ],
    relatedFeatures: ["crm", "e-commerce", "accounting"],
  },

  stock: {
    sections: [
      {
        type: "hero",
        heading: "Stock Management",
        description:
          "Keep track of all stockable items and articles with the barcode enabled inventory management.",
      },
      {
        type: "checklist",
        heading: "Stock Features",
        items: [
          { text: "Multi Location Support" },
          { text: "Barcode Enabled" },
          { text: "Double Entry Stock Management" },
          { text: "Assets and Depreciation" },
          { text: "Full Stock Traceability" },
          { text: "Clear and Complete Reporting" },
        ],
      },
    ],
    relatedFeatures: ["purchase", "assets-request", "canteen"],
  },
}
