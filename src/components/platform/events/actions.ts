"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { eventCreateSchema, eventUpdateSchema, getEventsSchema } from "@/components/platform/events/validation";
import { type Prisma } from "@prisma/client";

export async function createEvent(input: z.infer<typeof eventCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = eventCreateSchema.parse(input);
  
  const row = await db.event.create({
    data: {
      schoolId,
      title: parsed.title,
      description: parsed.description || null,
      eventType: parsed.eventType,
      eventDate: parsed.eventDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      location: parsed.location || null,
      organizer: parsed.organizer || null,
      targetAudience: parsed.targetAudience || null,
      maxAttendees: parsed.maxAttendees || null,
      currentAttendees: 0,
      isPublic: parsed.isPublic,
      registrationRequired: parsed.registrationRequired,
      notes: parsed.notes || null,
      status: "PLANNED",
    },
  });
  revalidatePath("/lab/events");
  return { success: true as const, id: row.id as string };
}

export async function updateEvent(input: z.infer<typeof eventUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = eventUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};
  
  if (typeof rest.title !== "undefined") data.title = rest.title;
  if (typeof rest.description !== "undefined") data.description = rest.description || null;
  if (typeof rest.eventType !== "undefined") data.eventType = rest.eventType;
  if (typeof rest.eventDate !== "undefined") data.eventDate = rest.eventDate;
  if (typeof rest.startTime !== "undefined") data.startTime = rest.startTime;
  if (typeof rest.endTime !== "undefined") data.endTime = rest.endTime;
  if (typeof rest.location !== "undefined") data.location = rest.location || null;
  if (typeof rest.organizer !== "undefined") data.organizer = rest.organizer || null;
  if (typeof rest.targetAudience !== "undefined") data.targetAudience = rest.targetAudience || null;
  if (typeof rest.maxAttendees !== "undefined") data.maxAttendees = rest.maxAttendees || null;
  if (typeof rest.isPublic !== "undefined") data.isPublic = rest.isPublic;
  if (typeof rest.registrationRequired !== "undefined") data.registrationRequired = rest.registrationRequired;
  if (typeof rest.notes !== "undefined") data.notes = rest.notes || null;
  
  await db.event.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/lab/events");
  return { success: true as const };
}

export async function deleteEvent(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await db.event.deleteMany({ where: { id, schoolId } });
  revalidatePath("/lab/events");
  return { success: true as const };
}

// Reads
export async function getEvent(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const e = await db.event.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      title: true,
      description: true,
      eventType: true,
      eventDate: true,
      startTime: true,
      endTime: true,
      location: true,
      organizer: true,
      targetAudience: true,
      maxAttendees: true,
      currentAttendees: true,
      isPublic: true,
      registrationRequired: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { event: e as null | Record<string, unknown> };
}

export async function getEvents(input: Partial<z.infer<typeof getEventsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getEventsSchema.parse(input ?? {});
  const where: any = {
    schoolId,
    ...(sp.title
      ? { title: { contains: sp.title, mode: "insensitive" } }
      : {}),
    ...(sp.eventType
      ? { eventType: sp.eventType }
      : {}),
    ...(sp.status
      ? { status: sp.status }
      : {}),
    ...(sp.eventDate
      ? { eventDate: new Date(sp.eventDate) }
      : {}),
    ...(sp.location
      ? { location: { contains: sp.location, mode: "insensitive" } }
      : {}),
  };
  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy: Prisma.EventOrderByWithRelationInput[] = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" } as Prisma.EventOrderByWithRelationInput))
    : [{ eventDate: "desc" }, { startTime: "asc" }];
  const [rows, count] = await Promise.all([
    db.event.findMany({
      where,
      orderBy,
      skip,
      take,
    }),
    db.event.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((e) => ({
    id: e.id as string,
    title: e.title as string,
    eventType: e.eventType as string,
    eventDate: (e.eventDate as Date).toISOString(),
    startTime: e.startTime as string,
    endTime: e.endTime as string,
    location: e.location || "TBD",
    organizer: e.organizer || "TBD",
    targetAudience: e.targetAudience || "All",
    maxAttendees: e.maxAttendees as number | null,
    currentAttendees: e.currentAttendees as number,
    status: e.status as string,
    isPublic: e.isPublic as boolean,
    createdAt: (e.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}

/**
 * Export events to CSV format
 */
export async function getEventsCSV(input?: Partial<z.infer<typeof getEventsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const sp = getEventsSchema.parse(input ?? {});

  const where: any = {
    schoolId,
    ...(sp.title ? { title: { contains: sp.title, mode: "insensitive" } } : {}),
    ...(sp.eventType ? { eventType: sp.eventType } : {}),
    ...(sp.status ? { status: sp.status } : {}),
  };

  const events = await db.event.findMany({
    where,
    orderBy: [{ eventDate: "desc" }],
  });

  const headers = ["ID", "Title", "Type", "Date", "Start Time", "End Time", "Location", "Organizer", "Audience", "Max Attendees", "Current Attendees", "Status", "Public", "Created"];
  const csvRows = (events as Array<any>).map((e) =>
    [
      e.id,
      `"${(e.title || "").replace(/"/g, '""')}"`,
      e.eventType,
      new Date(e.eventDate).toISOString().split("T")[0],
      e.startTime,
      e.endTime,
      `"${(e.location || "").replace(/"/g, '""')}"`,
      `"${(e.organizer || "").replace(/"/g, '""')}"`,
      `"${(e.targetAudience || "").replace(/"/g, '""')}"`,
      e.maxAttendees || "",
      e.currentAttendees || 0,
      e.status,
      e.isPublic ? "Yes" : "No",
      new Date(e.createdAt).toISOString().split("T")[0],
    ].join(",")
  );

  return [headers.join(","), ...csvRows].join("\n");
}
