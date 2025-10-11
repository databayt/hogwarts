"use server"

import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { addDays, addMonths, isBefore, differenceInDays, startOfYear, endOfYear } from "date-fns";

/**
 * Compliance Tracking System
 * Ensures school meets all regulatory requirements
 */

export type ComplianceStatus = "compliant" | "pending" | "expired" | "warning";
export type ComplianceCategory =
  | "academic"
  | "safety"
  | "health"
  | "financial"
  | "legal"
  | "accreditation"
  | "staff"
  | "facility";

export interface ComplianceItem {
  id: string;
  category: ComplianceCategory;
  name: string;
  description: string;
  status: ComplianceStatus;
  dueDate?: Date;
  lastChecked: Date;
  nextReview: Date;
  responsible: string;
  documents?: string[];
  notes?: string;
}

// ==================== GET COMPLIANCE STATUS ====================

export async function getComplianceStatus(): Promise<{
  overall: ComplianceStatus;
  items: ComplianceItem[];
  summary: Record<ComplianceCategory, ComplianceStatus>;
  alerts: Array<{ item: string; message: string; severity: "low" | "medium" | "high" }>;
}> {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const now = new Date();
  const items = await getComplianceItems();

  // Calculate summary by category
  const summary: Record<ComplianceCategory, ComplianceStatus> = {
    academic: "compliant",
    safety: "compliant",
    health: "compliant",
    financial: "compliant",
    legal: "compliant",
    accreditation: "compliant",
    staff: "compliant",
    facility: "compliant",
  };

  const alerts: Array<{ item: string; message: string; severity: "low" | "medium" | "high" }> = [];

  // Check each item and update summary
  for (const item of items) {
    // Update category status (worst status wins)
    if (item.status === "expired") {
      summary[item.category] = "expired";
      alerts.push({
        item: item.name,
        message: `${item.name} has expired and needs immediate attention`,
        severity: "high",
      });
    } else if (item.status === "warning" && summary[item.category] !== "expired") {
      summary[item.category] = "warning";
      const daysRemaining = item.dueDate ? differenceInDays(item.dueDate, now) : 0;
      alerts.push({
        item: item.name,
        message: `${item.name} expires in ${daysRemaining} days`,
        severity: daysRemaining < 7 ? "high" : "medium",
      });
    } else if (item.status === "pending" &&
      summary[item.category] !== "expired" &&
      summary[item.category] !== "warning") {
      summary[item.category] = "pending";
      alerts.push({
        item: item.name,
        message: `${item.name} review is pending`,
        severity: "low",
      });
    }
  }

  // Determine overall status
  const statuses = Object.values(summary);
  let overall: ComplianceStatus = "compliant";
  if (statuses.includes("expired")) {
    overall = "expired";
  } else if (statuses.includes("warning")) {
    overall = "warning";
  } else if (statuses.includes("pending")) {
    overall = "pending";
  }

  return { overall, items, summary, alerts };
}

// ==================== GET COMPLIANCE ITEMS ====================

async function getComplianceItems(): Promise<ComplianceItem[]> {
  const { schoolId } = await getTenantContext();
  if (!schoolId) return [];

  const now = new Date();

  // In production, these would come from a compliance tracking table
  // For now, return comprehensive mock data
  const items: ComplianceItem[] = [
    // Academic Compliance
    {
      id: "comp_001",
      category: "academic",
      name: "Curriculum Approval",
      description: "Annual curriculum review and approval by education board",
      status: "compliant",
      dueDate: addMonths(now, 6),
      lastChecked: addMonths(now, -6),
      nextReview: addMonths(now, 6),
      responsible: "Academic Director",
      documents: ["curriculum_2024.pdf"],
    },
    {
      id: "comp_002",
      category: "academic",
      name: "Examination Board Registration",
      description: "Registration with national examination board",
      status: "compliant",
      dueDate: addMonths(now, 3),
      lastChecked: addMonths(now, -9),
      nextReview: addMonths(now, 3),
      responsible: "Registrar",
    },

    // Safety Compliance
    {
      id: "comp_003",
      category: "safety",
      name: "Fire Safety Certificate",
      description: "Annual fire safety inspection and certification",
      status: "warning",
      dueDate: addDays(now, 15),
      lastChecked: addMonths(now, -11),
      nextReview: addDays(now, 15),
      responsible: "Facilities Manager",
      documents: ["fire_safety_2023.pdf"],
    },
    {
      id: "comp_004",
      category: "safety",
      name: "Emergency Evacuation Drill",
      description: "Quarterly emergency evacuation drills",
      status: "compliant",
      dueDate: addMonths(now, 1),
      lastChecked: addMonths(now, -2),
      nextReview: addMonths(now, 1),
      responsible: "Safety Officer",
    },

    // Health Compliance
    {
      id: "comp_005",
      category: "health",
      name: "Health & Sanitation Permit",
      description: "Annual health department inspection and permit",
      status: "compliant",
      dueDate: addMonths(now, 8),
      lastChecked: addMonths(now, -4),
      nextReview: addMonths(now, 8),
      responsible: "School Nurse",
      documents: ["health_permit_2024.pdf"],
    },
    {
      id: "comp_006",
      category: "health",
      name: "Kitchen Hygiene Certificate",
      description: "Food safety and kitchen hygiene certification",
      status: "warning",
      dueDate: addDays(now, 30),
      lastChecked: addMonths(now, -10),
      nextReview: addDays(now, 30),
      responsible: "Cafeteria Manager",
    },

    // Financial Compliance
    {
      id: "comp_007",
      category: "financial",
      name: "Annual Audit",
      description: "External financial audit by certified auditors",
      status: "pending",
      dueDate: addMonths(now, 2),
      lastChecked: addMonths(now, -10),
      nextReview: addMonths(now, 2),
      responsible: "Chief Financial Officer",
      documents: ["audit_report_2023.pdf"],
    },
    {
      id: "comp_008",
      category: "financial",
      name: "Tax Filing",
      description: "Annual tax returns and compliance",
      status: "compliant",
      dueDate: addMonths(now, 4),
      lastChecked: addMonths(now, -8),
      nextReview: addMonths(now, 4),
      responsible: "Accountant",
    },

    // Legal Compliance
    {
      id: "comp_009",
      category: "legal",
      name: "School Operating License",
      description: "Annual school operating license renewal",
      status: "compliant",
      dueDate: addMonths(now, 7),
      lastChecked: addMonths(now, -5),
      nextReview: addMonths(now, 7),
      responsible: "School Administrator",
      documents: ["operating_license_2024.pdf"],
    },
    {
      id: "comp_010",
      category: "legal",
      name: "Child Protection Policy",
      description: "Annual review of child protection policies",
      status: "compliant",
      dueDate: addMonths(now, 5),
      lastChecked: addMonths(now, -7),
      nextReview: addMonths(now, 5),
      responsible: "Legal Counsel",
    },

    // Accreditation
    {
      id: "comp_011",
      category: "accreditation",
      name: "School Accreditation",
      description: "International school accreditation renewal",
      status: "compliant",
      dueDate: addMonths(now, 18),
      lastChecked: addMonths(now, -6),
      nextReview: addMonths(now, 12),
      responsible: "Principal",
      documents: ["accreditation_cert.pdf"],
    },

    // Staff Compliance
    {
      id: "comp_012",
      category: "staff",
      name: "Teacher Certifications",
      description: "Verify all teacher certifications are current",
      status: "warning",
      dueDate: addDays(now, 20),
      lastChecked: addMonths(now, -3),
      nextReview: addDays(now, 20),
      responsible: "HR Director",
      notes: "3 teachers need certification renewal",
    },
    {
      id: "comp_013",
      category: "staff",
      name: "Background Checks",
      description: "Annual background checks for all staff",
      status: "compliant",
      dueDate: addMonths(now, 9),
      lastChecked: addMonths(now, -3),
      nextReview: addMonths(now, 9),
      responsible: "HR Director",
    },

    // Facility Compliance
    {
      id: "comp_014",
      category: "facility",
      name: "Building Safety Inspection",
      description: "Structural safety inspection of all buildings",
      status: "compliant",
      dueDate: addMonths(now, 10),
      lastChecked: addMonths(now, -2),
      nextReview: addMonths(now, 10),
      responsible: "Facilities Manager",
      documents: ["building_inspection_2024.pdf"],
    },
    {
      id: "comp_015",
      category: "facility",
      name: "Playground Safety Audit",
      description: "Safety audit of playground equipment",
      status: "pending",
      dueDate: addMonths(now, 1),
      lastChecked: addMonths(now, -11),
      nextReview: addMonths(now, 1),
      responsible: "Facilities Manager",
    },
  ];

  // Update status based on due dates
  return items.map(item => {
    if (item.dueDate) {
      const daysUntilDue = differenceInDays(item.dueDate, now);
      if (daysUntilDue < 0) {
        item.status = "expired";
      } else if (daysUntilDue < 30) {
        item.status = "warning";
      }
    }
    return item;
  });
}

// ==================== UPDATE COMPLIANCE ITEM ====================

export async function updateComplianceItem(
  itemId: string,
  data: {
    status?: ComplianceStatus;
    lastChecked?: Date;
    nextReview?: Date;
    documents?: string[];
    notes?: string;
  }
) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // In production, this would update the database
  // For now, return success response
  return {
    success: true,
    itemId,
    updatedAt: new Date(),
    ...data,
  };
}

// ==================== COMPLIANCE CALENDAR ====================

export async function getComplianceCalendar(
  startDate: Date = startOfYear(new Date()),
  endDate: Date = endOfYear(new Date())
) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const items = await getComplianceItems();

  // Filter items with due dates in the specified range
  const calendarItems = items
    .filter(item =>
      item.dueDate &&
      item.dueDate >= startDate &&
      item.dueDate <= endDate
    )
    .map(item => ({
      id: item.id,
      title: item.name,
      date: item.dueDate!,
      category: item.category,
      status: item.status,
      responsible: item.responsible,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return calendarItems;
}

// ==================== COMPLIANCE REPORT ====================

export async function generateComplianceReport(
  format: "summary" | "detailed" = "summary"
) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const { overall, items, summary, alerts } = await getComplianceStatus();
  const calendar = await getComplianceCalendar();

  const report = {
    generatedAt: new Date(),
    school: schoolId,
    overall,
    summary,
    statistics: {
      total: items.length,
      compliant: items.filter(i => i.status === "compliant").length,
      warning: items.filter(i => i.status === "warning").length,
      pending: items.filter(i => i.status === "pending").length,
      expired: items.filter(i => i.status === "expired").length,
    },
    upcomingDeadlines: calendar.slice(0, 10),
    criticalAlerts: alerts.filter(a => a.severity === "high"),
    recommendations: generateRecommendations(items, summary),
  };

  if (format === "detailed") {
    return {
      ...report,
      items,
      fullCalendar: calendar,
      allAlerts: alerts,
    };
  }

  return report;
}

// ==================== GENERATE RECOMMENDATIONS ====================

function generateRecommendations(
  items: ComplianceItem[],
  summary: Record<ComplianceCategory, ComplianceStatus>
): string[] {
  const recommendations: string[] = [];

  // Check for expired items
  const expiredItems = items.filter(i => i.status === "expired");
  if (expiredItems.length > 0) {
    recommendations.push(
      `URGENT: ${expiredItems.length} compliance items have expired and require immediate attention.`
    );
  }

  // Check for items expiring soon
  const warningItems = items.filter(i => i.status === "warning");
  if (warningItems.length > 0) {
    recommendations.push(
      `Schedule reviews for ${warningItems.length} items expiring within 30 days.`
    );
  }

  // Category-specific recommendations
  if (summary.safety !== "compliant") {
    recommendations.push(
      "Prioritize safety compliance to ensure student and staff wellbeing."
    );
  }

  if (summary.financial !== "compliant") {
    recommendations.push(
      "Complete financial compliance requirements to maintain operational status."
    );
  }

  if (summary.staff !== "compliant") {
    recommendations.push(
      "Review staff certifications and ensure all personnel meet requirements."
    );
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push(
      "All compliance items are in good standing. Schedule regular reviews to maintain status."
    );
  }

  recommendations.push(
    "Consider implementing automated reminder system for compliance deadlines.",
    "Maintain digital copies of all compliance documents for easy access during audits."
  );

  return recommendations;
}

// ==================== COMPLIANCE NOTIFICATIONS ====================

export async function scheduleComplianceNotifications() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const items = await getComplianceItems();
  const now = new Date();

  const notifications = [];

  for (const item of items) {
    if (item.dueDate) {
      const daysUntilDue = differenceInDays(item.dueDate, now);

      if (daysUntilDue === 30) {
        notifications.push({
          type: "30_day_warning",
          item: item.name,
          recipient: item.responsible,
          message: `${item.name} expires in 30 days. Please begin renewal process.`,
        });
      } else if (daysUntilDue === 7) {
        notifications.push({
          type: "7_day_warning",
          item: item.name,
          recipient: item.responsible,
          message: `URGENT: ${item.name} expires in 7 days. Immediate action required.`,
        });
      } else if (daysUntilDue === 1) {
        notifications.push({
          type: "1_day_critical",
          item: item.name,
          recipient: item.responsible,
          message: `CRITICAL: ${item.name} expires tomorrow. Take action immediately.`,
        });
      }
    }
  }

  // In production, these would be sent via email/SMS/push notifications
  return notifications;
}