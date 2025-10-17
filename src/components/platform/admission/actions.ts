"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  campaignSchema,
  applicationSchema,
  meritListSchema,
  bulkActionSchema,
  communicationSchema,
  entranceExamSchema,
  interviewScheduleSchema,
  type ApplicationFormData,
  type CampaignFormData,
  type MeritListFormData,
  type BulkActionFormData,
  type CommunicationFormData,
} from "./validation";

// Get session and schoolId helper
async function getSessionAndSchool() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;

  if (!session?.user?.id || !schoolId) {
    throw new Error("Unauthorized");
  }

  return { userId: session.user.id, schoolId, session };
}

// Generate unique application number
function generateApplicationNumber(campaignId: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `APP${year}${random}`;
}

// Campaign Actions
export async function createCampaign(data: CampaignFormData) {
  const { schoolId } = await getSessionAndSchool();

  const validated = campaignSchema.parse(data);

  const campaign = await db.admissionCampaign.create({
    data: {
      ...validated,
      schoolId,
      eligibilityCriteria: validated.eligibilityCriteria || [],
      requiredDocuments: validated.requiredDocuments || [],
      reservedSeats: validated.reservedSeats || [],
    },
  });

  revalidatePath("/admission/campaigns");
  return { success: true, campaign };
}

export async function updateCampaign(id: string, data: CampaignFormData) {
  const { schoolId } = await getSessionAndSchool();

  const validated = campaignSchema.parse(data);

  const campaign = await db.admissionCampaign.update({
    where: { id, schoolId },
    data: {
      ...validated,
      eligibilityCriteria: validated.eligibilityCriteria || [],
      requiredDocuments: validated.requiredDocuments || [],
      reservedSeats: validated.reservedSeats || [],
    },
  });

  revalidatePath("/admission/campaigns");
  return { success: true, campaign };
}

export async function deleteCampaign(id: string) {
  const { schoolId } = await getSessionAndSchool();

  await db.admissionCampaign.delete({
    where: { id, schoolId },
  });

  revalidatePath("/admission/campaigns");
  return { success: true };
}

export async function getCampaigns() {
  const { schoolId } = await getSessionAndSchool();

  const campaigns = await db.admissionCampaign.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
  });

  return campaigns;
}

// Application Actions
export async function submitApplication(data: ApplicationFormData) {
  const { schoolId } = await getSessionAndSchool();

  const validated = applicationSchema.parse(data);

  // Generate unique application number
  const applicationNumber = generateApplicationNumber(validated.campaignId);

  const application = await db.application.create({
    data: {
      ...validated,
      schoolId,
      applicationNumber,
      documents: validated.documents || [],
      submittedAt: validated.status === "SUBMITTED" ? new Date() : null,
    },
  });

  revalidatePath("/admission/applications");
  return { success: true, application, applicationNumber };
}

export async function updateApplication(id: string, data: Partial<ApplicationFormData>) {
  const { schoolId } = await getSessionAndSchool();

  const application = await db.application.update({
    where: { id, schoolId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/admission/applications");
  return { success: true, application };
}

export async function getApplications(filters?: any) {
  const { schoolId } = await getSessionAndSchool();

  const where: any = {
    schoolId,
    ...(filters?.campaignId && { campaignId: filters.campaignId }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.applyingForClass && { applyingForClass: filters.applyingForClass }),
    ...(filters?.category && { category: filters.category }),
    ...(filters?.search && {
      OR: [
        { applicationNumber: { contains: filters.search, mode: "insensitive" } },
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };

  const applications = await db.application.findMany({
    where,
    include: {
      campaign: {
        select: {
          name: true,
          academicYear: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return applications;
}

export async function getApplicationById(id: string) {
  const { schoolId } = await getSessionAndSchool();

  const application = await db.application.findUnique({
    where: { id, schoolId },
    include: {
      campaign: true,
      communications: {
        orderBy: { sentAt: "desc" },
      },
    },
  });

  return application;
}

// Merit List Actions
export async function generateMeritList(data: MeritListFormData) {
  const { schoolId } = await getSessionAndSchool();

  const validated = meritListSchema.parse(data);

  // Get all applications for the campaign
  const applications = await db.application.findMany({
    where: {
      schoolId,
      campaignId: validated.campaignId,
      status: { in: ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"] },
    },
  });

  // Calculate merit scores
  const applicationsWithScores = applications.map(app => {
    const academicScore = (app.previousPercentage?.toNumber() || 0) * (validated.criteria.academicWeight / 100);
    const entranceScore = (app.entranceScore?.toNumber() || 0) * (validated.criteria.entranceWeight / 100);
    const interviewScore = (app.interviewScore?.toNumber() || 0) * (validated.criteria.interviewWeight / 100);
    const extracurricularScore = 0; // TODO: Calculate based on achievements

    const totalScore = academicScore + entranceScore + interviewScore + extracurricularScore;

    return {
      ...app,
      meritScore: totalScore,
    };
  });

  // Sort by merit score
  applicationsWithScores.sort((a, b) => b.meritScore - a.meritScore);

  // Assign ranks
  const rankedApplications = applicationsWithScores.map((app, index) => ({
    ...app,
    meritRank: index + 1,
  }));

  // Update applications with merit scores and ranks
  await Promise.all(
    rankedApplications.map(app =>
      db.application.update({
        where: { id: app.id },
        data: {
          meritScore: app.meritScore,
          meritRank: app.meritRank,
          status: validated.cutoffScore && app.meritScore >= validated.cutoffScore
            ? "SELECTED"
            : "WAITLISTED",
        },
      })
    )
  );

  revalidatePath("/admission/merit-list");
  return { success: true, totalProcessed: rankedApplications.length };
}

// Bulk Actions
export async function performBulkAction(data: BulkActionFormData) {
  const { schoolId } = await getSessionAndSchool();

  const validated = bulkActionSchema.parse(data);

  switch (validated.action) {
    case "SHORTLIST":
      await db.application.updateMany({
        where: {
          id: { in: validated.applicationIds },
          schoolId,
        },
        data: {
          status: "SHORTLISTED",
          reviewedAt: new Date(),
        },
      });
      break;

    case "SELECT":
      await db.application.updateMany({
        where: {
          id: { in: validated.applicationIds },
          schoolId,
        },
        data: {
          status: "SELECTED",
          admissionOffered: true,
          offerDate: new Date(),
          offerExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
      break;

    case "REJECT":
      await db.application.updateMany({
        where: {
          id: { in: validated.applicationIds },
          schoolId,
        },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
        },
      });
      break;

    case "WAITLIST":
      await db.application.updateMany({
        where: {
          id: { in: validated.applicationIds },
          schoolId,
        },
        data: {
          status: "WAITLISTED",
        },
      });
      break;

    default:
      throw new Error("Invalid action");
  }

  revalidatePath("/admission/applications");
  return { success: true };
}

// Communication Actions
export async function sendCommunication(data: CommunicationFormData) {
  const { schoolId, userId } = await getSessionAndSchool();

  const validated = communicationSchema.parse(data);

  const communication = await db.communication.create({
    data: {
      ...validated,
      schoolId,
      sentBy: userId,
      sentAt: new Date(),
    },
  });

  // TODO: Actually send email/SMS based on type

  revalidatePath(`/admission/applications/${validated.applicationId}`);
  return { success: true, communication };
}

// Dashboard Stats
export async function getAdmissionStats(campaignId?: string) {
  const { schoolId } = await getSessionAndSchool();

  const where = {
    schoolId,
    ...(campaignId && { campaignId }),
  };

  const [
    total,
    submitted,
    underReview,
    selected,
    waitlisted,
    rejected,
    admitted,
    campaigns,
  ] = await Promise.all([
    db.application.count({ where }),
    db.application.count({ where: { ...where, status: "SUBMITTED" } }),
    db.application.count({ where: { ...where, status: "UNDER_REVIEW" } }),
    db.application.count({ where: { ...where, status: "SELECTED" } }),
    db.application.count({ where: { ...where, status: "WAITLISTED" } }),
    db.application.count({ where: { ...where, status: "REJECTED" } }),
    db.application.count({ where: { ...where, status: "ADMITTED" } }),
    db.admissionCampaign.findMany({
      where: { schoolId, ...(campaignId && { id: campaignId }) },
      select: { totalSeats: true },
    }),
  ]);

  const totalSeats = campaigns.reduce((sum, c) => sum + c.totalSeats, 0);

  return {
    totalApplications: total,
    submitted,
    underReview,
    selected,
    waitlisted,
    rejected,
    admitted,
    seatsFilled: admitted,
    seatsAvailable: totalSeats - admitted,
  };
}

// Schedule Entrance Exam
export async function scheduleEntranceExam(data: any) {
  const { schoolId } = await getSessionAndSchool();

  const validated = entranceExamSchema.parse(data);

  // Update all shortlisted applications
  await db.application.updateMany({
    where: {
      schoolId,
      campaignId: validated.campaignId,
      status: "SHORTLISTED",
    },
    data: {
      status: "ENTRANCE_SCHEDULED",
    },
  });

  // TODO: Send notification to applicants

  revalidatePath("/admission/applications");
  return { success: true };
}

// Schedule Interview
export async function scheduleInterview(data: any) {
  const { schoolId } = await getSessionAndSchool();

  const validated = interviewScheduleSchema.parse(data);

  await db.application.update({
    where: {
      id: validated.applicationId,
      schoolId,
    },
    data: {
      status: "INTERVIEW_SCHEDULED",
    },
  });

  // TODO: Send notification to applicant

  revalidatePath(`/admission/applications/${validated.applicationId}`);
  return { success: true };
}

// Confirm Admission
export async function confirmAdmission(applicationId: string) {
  const { schoolId } = await getSessionAndSchool();

  const application = await db.application.update({
    where: {
      id: applicationId,
      schoolId,
      status: "SELECTED",
    },
    data: {
      status: "ADMITTED",
      admissionConfirmed: true,
      confirmationDate: new Date(),
      enrollmentNumber: `ENR${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    },
  });

  // TODO: Create student record

  revalidatePath(`/admission/applications/${applicationId}`);
  return { success: true, enrollmentNumber: application.enrollmentNumber };
}