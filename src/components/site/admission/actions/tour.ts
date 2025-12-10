"use server";

import { db } from "@/lib/db";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { Resend } from "resend";
import { nanoid } from "nanoid";
import { createTourBookingSchema } from "../validation";
import type { ActionResult, TourSlot, TourBookingConfirmation, TourBookingData } from "../types";
import type { SlotType } from "@prisma/client";

// Initialize Resend for email
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ============================================
// Time Slot Actions
// ============================================

/**
 * Get available time slots for tours/interviews
 */
export async function getAvailableSlots(
  subdomain: string,
  slotType: SlotType = "TOUR",
  startDate?: Date,
  endDate?: Date,
  campaignId?: string
): Promise<ActionResult<TourSlot[]>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain);
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" };
    }

    const schoolId = schoolResult.data.id;

    // Default to next 30 days if no dates provided
    const start = startDate || new Date();
    const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const slots = await db.admissionTimeSlot.findMany({
      where: {
        schoolId,
        slotType,
        isActive: true,
        date: {
          gte: start,
          lte: end,
        },
        ...(campaignId && { campaignId }),
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    const availableSlots: TourSlot[] = slots
      .filter(slot => slot.currentBookings < slot.maxCapacity)
      .map(slot => ({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime.toISOString().split("T")[1].substring(0, 5),
        endTime: slot.endTime.toISOString().split("T")[1].substring(0, 5),
        slotType: slot.slotType,
        location: slot.location ?? undefined,
        availableSpots: slot.maxCapacity - slot.currentBookings,
        maxCapacity: slot.maxCapacity,
      }));

    return { success: true, data: availableSlots };
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return { success: false, error: "Failed to fetch available slots" };
  }
}

/**
 * Get slots grouped by date for calendar display
 */
export async function getSlotsByMonth(
  subdomain: string,
  year: number,
  month: number,
  slotType: SlotType = "TOUR"
): Promise<ActionResult<Record<string, TourSlot[]>>> {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const result = await getAvailableSlots(subdomain, slotType, startDate, endDate);

    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    // Group by date
    const groupedSlots: Record<string, TourSlot[]> = {};
    for (const slot of result.data) {
      const dateKey = slot.date.toISOString().split("T")[0];
      if (!groupedSlots[dateKey]) {
        groupedSlots[dateKey] = [];
      }
      groupedSlots[dateKey].push(slot);
    }

    return { success: true, data: groupedSlots };
  } catch (error) {
    console.error("Error fetching slots by month:", error);
    return { success: false, error: "Failed to fetch slots" };
  }
}

// ============================================
// Booking Actions
// ============================================

/**
 * Generate unique booking number
 */
function generateBookingNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = nanoid(6).toUpperCase();
  return `TOUR-${year}${month}-${random}`;
}

/**
 * Create a tour booking
 */
export async function createTourBooking(
  subdomain: string,
  data: TourBookingData
): Promise<ActionResult<TourBookingConfirmation>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain);
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" };
    }

    const schoolId = schoolResult.data.id;

    // Validate data
    const schema = createTourBookingSchema();
    const validated = schema.parse(data);

    // Check slot exists and has capacity
    const slot = await db.admissionTimeSlot.findFirst({
      where: {
        id: validated.slotId,
        schoolId,
        isActive: true,
      },
    });

    if (!slot) {
      return { success: false, error: "Time slot not found or no longer available" };
    }

    if (slot.currentBookings >= slot.maxCapacity) {
      return { success: false, error: "This time slot is fully booked. Please select another time." };
    }

    // Check if email already has a booking for this slot
    const existingBooking = await db.tourBooking.findFirst({
      where: {
        schoolId,
        slotId: validated.slotId,
        email: validated.email,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (existingBooking) {
      return { success: false, error: "You already have a booking for this time slot." };
    }

    // Generate booking number
    let bookingNumber: string;
    let attempts = 0;
    do {
      bookingNumber = generateBookingNumber();
      const exists = await db.tourBooking.findUnique({
        where: { bookingNumber },
      });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return { success: false, error: "Failed to generate booking number. Please try again." };
    }

    // Create booking and update slot count in a transaction
    const [booking] = await db.$transaction([
      db.tourBooking.create({
        data: {
          schoolId,
          slotId: validated.slotId,
          bookingNumber,
          parentName: validated.parentName,
          email: validated.email,
          phone: validated.phone || null,
          studentName: validated.studentName || null,
          interestedGrade: validated.interestedGrade || null,
          specialRequests: validated.specialRequests || null,
          numberOfAttendees: validated.numberOfAttendees,
          status: "CONFIRMED",
        },
      }),
      db.admissionTimeSlot.update({
        where: { id: validated.slotId },
        data: {
          currentBookings: { increment: 1 },
        },
      }),
    ]);

    // Send confirmation email
    if (resend) {
      try {
        const formattedDate = slot.date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const startTime = slot.startTime.toISOString().split("T")[1].substring(0, 5);
        const endTime = slot.endTime.toISOString().split("T")[1].substring(0, 5);

        await resend.emails.send({
          from: "noreply@databayt.org",
          to: validated.email,
          subject: `Tour Booking Confirmed - ${bookingNumber}`,
          html: `
            <h2>Tour Booking Confirmed!</h2>
            <p>Dear ${validated.parentName},</p>
            <p>Your campus tour has been confirmed. Here are the details:</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Booking Number</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${bookingNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Time</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${startTime} - ${endTime}</td>
              </tr>
              ${slot.location ? `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Location</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${slot.location}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Attendees</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${validated.numberOfAttendees}</td>
              </tr>
            </table>
            <p>If you need to reschedule or cancel, please visit:</p>
            <p><a href="https://${subdomain}.databayt.org/schedule-tour/${bookingNumber}">Manage Booking</a></p>
            <p>We look forward to meeting you!</p>
            <p>Best regards,<br>${schoolResult.data.name}</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send booking confirmation email:", emailError);
      }
    }

    const confirmation: TourBookingConfirmation = {
      bookingNumber,
      status: "CONFIRMED",
      slot: {
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime.toISOString().split("T")[1].substring(0, 5),
        endTime: slot.endTime.toISOString().split("T")[1].substring(0, 5),
        slotType: slot.slotType,
        location: slot.location ?? undefined,
        availableSpots: slot.maxCapacity - slot.currentBookings - 1,
        maxCapacity: slot.maxCapacity,
      },
      parentName: validated.parentName,
      email: validated.email,
      studentName: validated.studentName,
      numberOfAttendees: validated.numberOfAttendees,
    };

    return { success: true, data: confirmation };
  } catch (error) {
    console.error("Error creating booking:", error);
    return { success: false, error: "Failed to create booking. Please try again." };
  }
}

/**
 * Get booking details by booking number
 */
export async function getBookingDetails(
  bookingNumber: string
): Promise<ActionResult<TourBookingConfirmation>> {
  try {
    const booking = await db.tourBooking.findUnique({
      where: { bookingNumber },
      include: {
        slot: true,
        school: {
          select: { name: true, domain: true },
        },
      },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    const confirmation: TourBookingConfirmation = {
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      slot: {
        id: booking.slot.id,
        date: booking.slot.date,
        startTime: booking.slot.startTime.toISOString().split("T")[1].substring(0, 5),
        endTime: booking.slot.endTime.toISOString().split("T")[1].substring(0, 5),
        slotType: booking.slot.slotType,
        location: booking.slot.location ?? undefined,
        availableSpots: booking.slot.maxCapacity - booking.slot.currentBookings,
        maxCapacity: booking.slot.maxCapacity,
      },
      parentName: booking.parentName,
      email: booking.email,
      studentName: booking.studentName ?? undefined,
      numberOfAttendees: booking.numberOfAttendees,
    };

    return { success: true, data: confirmation };
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return { success: false, error: "Failed to fetch booking details" };
  }
}

/**
 * Cancel a booking
 */
export async function cancelTourBooking(
  bookingNumber: string,
  reason?: string
): Promise<ActionResult<{ message: string }>> {
  try {
    const booking = await db.tourBooking.findUnique({
      where: { bookingNumber },
      include: {
        slot: true,
        school: {
          select: { name: true, domain: true },
        },
      },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.status === "CANCELLED") {
      return { success: false, error: "Booking is already cancelled" };
    }

    if (booking.status === "COMPLETED") {
      return { success: false, error: "Cannot cancel a completed booking" };
    }

    // Cancel booking and decrement slot count
    await db.$transaction([
      db.tourBooking.update({
        where: { bookingNumber },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      }),
      db.admissionTimeSlot.update({
        where: { id: booking.slotId },
        data: {
          currentBookings: { decrement: 1 },
        },
      }),
    ]);

    // Send cancellation email
    if (resend) {
      try {
        await resend.emails.send({
          from: "noreply@databayt.org",
          to: booking.email,
          subject: `Tour Booking Cancelled - ${bookingNumber}`,
          html: `
            <h2>Tour Booking Cancelled</h2>
            <p>Dear ${booking.parentName},</p>
            <p>Your tour booking (${bookingNumber}) has been cancelled.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>If you'd like to schedule a new tour, please visit:</p>
            <p><a href="https://${booking.school.domain}.databayt.org/schedule-tour">Schedule Tour</a></p>
            <p>Best regards,<br>${booking.school.name}</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
      }
    }

    return { success: true, data: { message: "Booking cancelled successfully" } };
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return { success: false, error: "Failed to cancel booking" };
  }
}

/**
 * Reschedule a booking
 */
export async function rescheduleTourBooking(
  bookingNumber: string,
  newSlotId: string
): Promise<ActionResult<TourBookingConfirmation>> {
  try {
    const booking = await db.tourBooking.findUnique({
      where: { bookingNumber },
      include: {
        slot: true,
        school: {
          select: { name: true, domain: true },
        },
      },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
      return { success: false, error: "Cannot reschedule this booking" };
    }

    // Check new slot exists and has capacity
    const newSlot = await db.admissionTimeSlot.findFirst({
      where: {
        id: newSlotId,
        schoolId: booking.schoolId,
        isActive: true,
      },
    });

    if (!newSlot) {
      return { success: false, error: "Selected time slot is not available" };
    }

    if (newSlot.currentBookings >= newSlot.maxCapacity) {
      return { success: false, error: "Selected time slot is fully booked" };
    }

    // Update booking and slot counts in transaction
    await db.$transaction([
      // Decrement old slot
      db.admissionTimeSlot.update({
        where: { id: booking.slotId },
        data: { currentBookings: { decrement: 1 } },
      }),
      // Increment new slot
      db.admissionTimeSlot.update({
        where: { id: newSlotId },
        data: { currentBookings: { increment: 1 } },
      }),
      // Update booking
      db.tourBooking.update({
        where: { bookingNumber },
        data: {
          slotId: newSlotId,
          status: "RESCHEDULED",
        },
      }),
    ]);

    // Send reschedule email
    if (resend) {
      try {
        const formattedDate = newSlot.date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const startTime = newSlot.startTime.toISOString().split("T")[1].substring(0, 5);
        const endTime = newSlot.endTime.toISOString().split("T")[1].substring(0, 5);

        await resend.emails.send({
          from: "noreply@databayt.org",
          to: booking.email,
          subject: `Tour Rescheduled - ${bookingNumber}`,
          html: `
            <h2>Tour Booking Rescheduled</h2>
            <p>Dear ${booking.parentName},</p>
            <p>Your tour has been rescheduled. Here are the new details:</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Time</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${startTime} - ${endTime}</td>
              </tr>
            </table>
            <p>Best regards,<br>${booking.school.name}</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send reschedule email:", emailError);
      }
    }

    const confirmation: TourBookingConfirmation = {
      bookingNumber,
      status: "RESCHEDULED",
      slot: {
        id: newSlot.id,
        date: newSlot.date,
        startTime: newSlot.startTime.toISOString().split("T")[1].substring(0, 5),
        endTime: newSlot.endTime.toISOString().split("T")[1].substring(0, 5),
        slotType: newSlot.slotType,
        location: newSlot.location ?? undefined,
        availableSpots: newSlot.maxCapacity - newSlot.currentBookings - 1,
        maxCapacity: newSlot.maxCapacity,
      },
      parentName: booking.parentName,
      email: booking.email,
      studentName: booking.studentName ?? undefined,
      numberOfAttendees: booking.numberOfAttendees,
    };

    return { success: true, data: confirmation };
  } catch (error) {
    console.error("Error rescheduling booking:", error);
    return { success: false, error: "Failed to reschedule booking" };
  }
}
