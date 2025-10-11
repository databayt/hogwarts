"use server"

import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { subHours, subDays, isWithinInterval } from "date-fns";

/**
 * Emergency Alert System
 * Critical for school safety and rapid response
 */

export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertType =
  | "medical"
  | "security"
  | "weather"
  | "fire"
  | "lockdown"
  | "evacuation"
  | "attendance"
  | "academic"
  | "financial"
  | "system";

export interface EmergencyAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  affectedCount?: number;
  location?: string;
  actionRequired: string;
  expiresAt?: Date;
}

// ==================== GET ACTIVE ALERTS ====================

export async function getActiveAlerts(): Promise<EmergencyAlert[]> {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const now = new Date();

  // Check for real-time conditions that should trigger alerts
  const [attendanceRate, studentCount, recentAnnouncements] = await Promise.all([
    getAttendanceAlertStatus(),
    db.student.count({ where: { schoolId } }),
    db.announcement.count({
      where: {
        schoolId,
        priority: "urgent",
        published: true,
        createdAt: { gte: subHours(now, 24) }
      }
    })
  ]);

  const alerts: EmergencyAlert[] = [];

  // Attendance Alert
  if (attendanceRate < 70) {
    alerts.push({
      id: "alert_attendance_001",
      type: "attendance",
      severity: attendanceRate < 50 ? "high" : "medium",
      title: "Low Attendance Alert",
      message: `School attendance is critically low at ${attendanceRate.toFixed(1)}%. Investigation required.`,
      createdAt: now,
      acknowledged: false,
      affectedCount: Math.floor(studentCount * (1 - attendanceRate / 100)),
      actionRequired: "Review attendance records and contact absent students' parents",
    });
  }

  // Add mock critical alerts for demonstration
  // In production, these would be triggered by real events

  // Weather Alert (example)
  if (Math.random() > 0.7) { // 30% chance to show weather alert
    alerts.push({
      id: "alert_weather_001",
      type: "weather",
      severity: "medium",
      title: "Severe Weather Warning",
      message: "Heavy rainfall expected. Consider early dismissal or remote learning.",
      createdAt: subHours(now, 2),
      acknowledged: false,
      location: "All campuses",
      actionRequired: "Monitor weather updates and prepare contingency plans",
      expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000), // Expires in 6 hours
    });
  }

  // Security Alert (example)
  if (Math.random() > 0.9) { // 10% chance
    alerts.push({
      id: "alert_security_001",
      type: "security",
      severity: "high",
      title: "Unauthorized Access Attempt",
      message: "Multiple failed login attempts detected from unknown IP address.",
      createdAt: subHours(now, 1),
      acknowledged: false,
      actionRequired: "Review security logs and update access controls",
    });
  }

  // Financial Alert (based on mock data)
  alerts.push({
    id: "alert_financial_001",
    type: "financial",
    severity: "medium",
    title: "Fee Collection Below Target",
    message: "Current month fee collection at 65% of target with 5 days remaining.",
    createdAt: subDays(now, 1),
    acknowledged: false,
    actionRequired: "Send payment reminders to defaulters",
  });

  return alerts.filter(alert =>
    !alert.expiresAt || alert.expiresAt > now
  );
}

// ==================== ATTENDANCE ALERT STATUS ====================

async function getAttendanceAlertStatus(): Promise<number> {
  const { schoolId } = await getTenantContext();
  if (!schoolId) return 100;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalStudents, presentStudents] = await Promise.all([
    db.student.count({ where: { schoolId } }),
    db.attendance.count({
      where: {
        schoolId,
        date: today,
        status: { in: ["PRESENT", "LATE"] }
      }
    })
  ]);

  return totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 100;
}

// ==================== ACKNOWLEDGE ALERT ====================

export async function acknowledgeAlert(alertId: string, acknowledgedBy: string) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // In production, this would update the alert record in database
  // For now, return success response
  return {
    success: true,
    alertId,
    acknowledgedAt: new Date(),
    acknowledgedBy,
  };
}

// ==================== CREATE ALERT ====================

export async function createAlert(data: {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  location?: string;
  actionRequired: string;
  expiresInHours?: number;
}) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const alert: EmergencyAlert = {
    id: `alert_${data.type}_${Date.now()}`,
    type: data.type,
    severity: data.severity,
    title: data.title,
    message: data.message,
    createdAt: new Date(),
    acknowledged: false,
    location: data.location,
    actionRequired: data.actionRequired,
    expiresAt: data.expiresInHours
      ? new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000)
      : undefined,
  };

  // In production:
  // 1. Save to database
  // 2. Send push notifications
  // 3. Send SMS/Email to relevant parties
  // 4. Log for audit trail

  // Trigger notifications based on severity
  if (alert.severity === "critical") {
    await notifyCriticalAlert(alert);
  }

  return alert;
}

// ==================== NOTIFICATION SYSTEM ====================

async function notifyCriticalAlert(alert: EmergencyAlert) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) return;

  // In production, this would:
  // 1. Send push notifications to all admin users
  // 2. Send SMS to emergency contacts
  // 3. Send email notifications
  // 4. Trigger alarm systems if applicable

  console.log("Critical alert triggered:", alert);

  // Get admin users for notification
  const admins = await db.user.findMany({
    where: {
      schoolId,
      role: { in: ["ADMIN", "DEVELOPER"] }
    },
    select: {
      id: true,
      email: true,
      name: true,
    }
  });

  // Mock notification sending
  for (const admin of admins) {
    console.log(`Notifying admin ${admin.name} (${admin.email}) about critical alert: ${alert.title}`);
  }
}

// ==================== ALERT HISTORY ====================

export async function getAlertHistory(
  limit: number = 50,
  includeAcknowledged: boolean = true
) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  // Mock historical alerts
  const mockHistory: EmergencyAlert[] = [
    {
      id: "hist_001",
      type: "medical",
      severity: "high",
      title: "Medical Emergency - Student Injury",
      message: "Student injured during sports activity. Ambulance called.",
      createdAt: subDays(new Date(), 5),
      acknowledged: true,
      acknowledgedBy: "John Admin",
      acknowledgedAt: subDays(new Date(), 5),
      location: "Sports Field",
      actionRequired: "Provide first aid and notify parents",
    },
    {
      id: "hist_002",
      type: "fire",
      severity: "critical",
      title: "Fire Drill - Scheduled",
      message: "Scheduled fire drill completed successfully.",
      createdAt: subDays(new Date(), 10),
      acknowledged: true,
      acknowledgedBy: "Safety Officer",
      acknowledgedAt: subDays(new Date(), 10),
      location: "All buildings",
      actionRequired: "Evacuate all buildings as per protocol",
    },
    {
      id: "hist_003",
      type: "system",
      severity: "low",
      title: "System Maintenance",
      message: "Scheduled system maintenance completed.",
      createdAt: subDays(new Date(), 15),
      acknowledged: true,
      acknowledgedBy: "IT Admin",
      acknowledgedAt: subDays(new Date(), 15),
      actionRequired: "No action required",
    },
  ];

  return includeAcknowledged
    ? mockHistory
    : mockHistory.filter(alert => !alert.acknowledged);
}

// ==================== ALERT STATISTICS ====================

export async function getAlertStatistics() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const activeAlerts = await getActiveAlerts();
  const history = await getAlertHistory(100);

  const stats = {
    active: activeAlerts.length,
    critical: activeAlerts.filter(a => a.severity === "critical").length,
    high: activeAlerts.filter(a => a.severity === "high").length,
    medium: activeAlerts.filter(a => a.severity === "medium").length,
    low: activeAlerts.filter(a => a.severity === "low").length,
    unacknowledged: activeAlerts.filter(a => !a.acknowledged).length,
    last24Hours: history.filter(a =>
      isWithinInterval(a.createdAt, {
        start: subHours(new Date(), 24),
        end: new Date()
      })
    ).length,
    byType: {
      medical: history.filter(a => a.type === "medical").length,
      security: history.filter(a => a.type === "security").length,
      weather: history.filter(a => a.type === "weather").length,
      fire: history.filter(a => a.type === "fire").length,
      attendance: history.filter(a => a.type === "attendance").length,
      financial: history.filter(a => a.type === "financial").length,
    },
    averageResponseTime: "15 minutes", // Mock value
  };

  return stats;
}

// ==================== EMERGENCY PROTOCOLS ====================

export async function getEmergencyProtocols() {
  return {
    fire: {
      steps: [
        "Activate fire alarm",
        "Evacuate all buildings via designated routes",
        "Assembly at designated safe zones",
        "Roll call by class teachers",
        "Contact fire department if real emergency",
        "All clear signal before re-entry"
      ],
      contacts: [
        { name: "Fire Department", number: "911" },
        { name: "School Safety Officer", number: "+1234567890" }
      ]
    },
    medical: {
      steps: [
        "Assess the situation and ensure safety",
        "Provide first aid if trained",
        "Call school nurse/medical staff",
        "Contact emergency services if serious",
        "Notify parents/guardians",
        "Document incident"
      ],
      contacts: [
        { name: "Emergency Medical", number: "911" },
        { name: "School Nurse", number: "+1234567891" }
      ]
    },
    lockdown: {
      steps: [
        "Announce lockdown via PA system",
        "Lock all doors and windows",
        "Turn off lights and silence devices",
        "Move away from windows and doors",
        "Wait for all-clear from authorities",
        "Controlled release after verification"
      ],
      contacts: [
        { name: "Police Department", number: "911" },
        { name: "School Security", number: "+1234567892" }
      ]
    }
  };
}