// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Unit tests for the Leads tab: queries, actions, permissions.
 * Covers: getInquiries, getTourBookings, updateInquiryStatus,
 * markInquiryConverted, updateTourBookingStatus, getTabsForRole,
 * getUIConfigForRole (ACCOUNTANT P1-9).
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getInquiries,
  getTourBookings,
  markInquiryConverted,
  updateInquiryStatus,
  updateTourBookingStatus,
} from "@/components/school-dashboard/admission/leads/leads-actions"
import {
  getInquiriesList,
  getTourBookingsList,
} from "@/components/school-dashboard/admission/leads/leads-queries"
import {
  getTabsForRole,
  getUIConfigForRole,
} from "@/components/school-dashboard/admission/permissions"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

vi.mock("@/lib/db", () => ({
  db: {
    admissionInquiry: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    tourBooking: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    admissionTimeSlot: {
      update: vi.fn(),
    },
    application: {
      findFirst: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-123"

function mockAdminSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role: "ADMIN", schoolId: SCHOOL_ID },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "demo",
  } as never)
}

function mockStaffSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-2", role: "STAFF", schoolId: SCHOOL_ID },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "demo",
  } as never)
}

function mockAccountantSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-3", role: "ACCOUNTANT", schoolId: SCHOOL_ID },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "demo",
  } as never)
}

function mockUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null as never)
}

// ---------------------------------------------------------------------------
// Permissions (P1-9 ACCOUNTANT)
// ---------------------------------------------------------------------------

describe("getTabsForRole", () => {
  it("returns empty array for STUDENT (no access)", () => {
    expect(getTabsForRole("STUDENT" as never, "en")).toEqual([])
  })

  it("returns empty array for null role", () => {
    expect(getTabsForRole(null, "en")).toEqual([])
  })

  it("ACCOUNTANT gets only applications + enrollment tabs", () => {
    const tabs = getTabsForRole("ACCOUNTANT", "en")
    expect(tabs).toHaveLength(2)
    expect(tabs[0].href).toContain("/admission/applications")
    expect(tabs[1].href).toContain("/admission/enrollment")
  })

  it("ACCOUNTANT does NOT get leads tab", () => {
    const tabs = getTabsForRole("ACCOUNTANT", "en")
    const hasLeads = tabs.some((t) => t.href.includes("/leads"))
    expect(hasLeads).toBe(false)
  })

  it("STAFF gets applications + merit + enrollment + leads", () => {
    const tabs = getTabsForRole("STAFF", "en")
    const hrefs = tabs.map((t) => t.href)
    expect(hrefs.some((h) => h.includes("/applications"))).toBe(true)
    expect(hrefs.some((h) => h.includes("/merit"))).toBe(true)
    expect(hrefs.some((h) => h.includes("/enrollment"))).toBe(true)
    expect(hrefs.some((h) => h.includes("/leads"))).toBe(true)
  })

  it("ADMIN gets campaigns + applications + merit + enrollment + leads + settings", () => {
    const tabs = getTabsForRole("ADMIN", "en")
    const hrefs = tabs.map((t) => t.href)
    // Campaigns points to base /admission
    expect(hrefs.some((h) => h.endsWith("/admission"))).toBe(true)
    expect(hrefs.some((h) => h.includes("/applications"))).toBe(true)
    expect(hrefs.some((h) => h.includes("/leads"))).toBe(true)
    expect(hrefs.some((h) => h.includes("/settings"))).toBe(true)
  })

  it("uses custom dictionary labels", () => {
    const d = { leads: "Prospekts", applications: "Bewerbungen" }
    const tabs = getTabsForRole("STAFF", "en", d)
    const leadsTab = tabs.find((t) => t.href.includes("/leads"))
    expect(leadsTab?.name).toBe("Prospekts")
  })
})

describe("getUIConfigForRole", () => {
  it("ADMIN gets full permissions", () => {
    const cfg = getUIConfigForRole("ADMIN")
    expect(cfg.showAddButton).toBe(true)
    expect(cfg.readOnlyMode).toBe(false)
  })

  it("STAFF has showDeleteAction=false", () => {
    const cfg = getUIConfigForRole("STAFF")
    expect(cfg.showDeleteAction).toBe(false)
    expect(cfg.showEditAction).toBe(true)
  })

  it("ACCOUNTANT (P1-9): gets NO_UI_PERMISSIONS (read-only posture)", () => {
    const cfg = getUIConfigForRole("ACCOUNTANT")
    expect(cfg.readOnlyMode).toBe(true)
    expect(cfg.showAddButton).toBe(false)
    expect(cfg.showDeleteAction).toBe(false)
    expect(cfg.showEditAction).toBe(false)
  })

  it("null role returns no permissions", () => {
    const cfg = getUIConfigForRole(null)
    expect(cfg.readOnlyMode).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getInquiries action
// ---------------------------------------------------------------------------

describe("getInquiries server action", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns NOT_AUTHENTICATED when no session", async () => {
    mockUnauthenticated()
    const result = await getInquiries({})
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toBe("NOT_AUTHENTICATED")
  })

  it("returns MISSING_SCHOOL_CONTEXT when no schoolId", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "ADMIN" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null,
      subdomain: "demo",
    } as never)
    const result = await getInquiries({})
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toBe("MISSING_SCHOOL_CONTEXT")
  })

  it("returns paginated inquiry rows on success", async () => {
    mockAdminSession()
    const fakeRow = {
      id: "inq-1",
      parentName: "Ahmed Ali",
      email: "ahmed@example.com",
      phone: null,
      studentName: "Fatima",
      interestedGrade: "Grade 3",
      source: "website",
      status: "NEW",
      followUpDate: null,
      assignedTo: null,
      notes: null,
      convertedToApplicationId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(db.admissionInquiry.findMany).mockResolvedValue([
      fakeRow,
    ] as never)
    vi.mocked(db.admissionInquiry.count).mockResolvedValue(1)

    const result = await getInquiries({ page: 1, perPage: 20 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.total).toBe(1)
      expect(result.data.rows).toHaveLength(1)
    }
  })

  it("ACCOUNTANT cannot call getInquiries (viewApplications permission check)", async () => {
    // ACCOUNTANT has viewApplications so this should succeed
    mockAccountantSession()
    vi.mocked(db.admissionInquiry.findMany).mockResolvedValue([] as never)
    vi.mocked(db.admissionInquiry.count).mockResolvedValue(0)

    const result = await getInquiries({})
    expect(result.success).toBe(true)
  })

  it("TEACHER is denied (no viewApplications)", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "t1", role: "TEACHER" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
      subdomain: "demo",
    } as never)
    const result = await getInquiries({})
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toBe("FORBIDDEN")
  })
})

// ---------------------------------------------------------------------------
// getTourBookings action
// ---------------------------------------------------------------------------

describe("getTourBookings server action", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns NOT_AUTHENTICATED when no session", async () => {
    mockUnauthenticated()
    const result = await getTourBookings({})
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toBe("NOT_AUTHENTICATED")
  })

  it("returns paginated tour booking rows on success", async () => {
    mockAdminSession()
    const fakeBooking = {
      id: "tb-1",
      bookingNumber: "TB-001",
      parentName: "Sara Hassan",
      email: "sara@example.com",
      phone: null,
      studentName: null,
      interestedGrade: null,
      status: "CONFIRMED",
      numberOfAttendees: 2,
      attendedAt: null,
      cancelledAt: null,
      cancelReason: null,
      specialRequests: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      slot: {
        id: "slot-1",
        date: new Date("2026-09-01"),
        startTime: new Date("1970-01-01T10:00:00Z"),
        endTime: new Date("1970-01-01T11:00:00Z"),
        slotType: "TOUR",
        location: "Main Gate",
      },
    }
    vi.mocked(db.tourBooking.findMany).mockResolvedValue([fakeBooking] as never)
    vi.mocked(db.tourBooking.count).mockResolvedValue(1)

    const result = await getTourBookings({ page: 1, perPage: 20 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.total).toBe(1)
      expect(result.data.rows).toHaveLength(1)
    }
  })
})

// ---------------------------------------------------------------------------
// updateInquiryStatus action
// ---------------------------------------------------------------------------

describe("updateInquiryStatus server action", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns NOT_AUTHENTICATED when no session", async () => {
    mockUnauthenticated()
    const result = await updateInquiryStatus({ id: "i1", status: "CONTACTED" })
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toBe("NOT_AUTHENTICATED")
  })

  it("returns INQUIRY_NOT_FOUND when inquiry not in school", async () => {
    mockAdminSession()
    vi.mocked(db.admissionInquiry.findFirst).mockResolvedValue(null)
    const result = await updateInquiryStatus({ id: "i1", status: "CONTACTED" })
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toBe("INQUIRY_NOT_FOUND")
  })

  it("updates status successfully for ADMIN", async () => {
    mockAdminSession()
    vi.mocked(db.admissionInquiry.findFirst).mockResolvedValue({
      id: "i1",
    } as never)
    vi.mocked(db.admissionInquiry.update).mockResolvedValue({} as never)

    const result = await updateInquiryStatus({
      id: "i1",
      status: "CONTACTED",
      notes: "Called, left voicemail",
      followUpDate: "2026-09-15",
    })
    expect(result.success).toBe(true)
    expect(db.admissionInquiry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "i1" },
        data: expect.objectContaining({ status: "CONTACTED" }),
      })
    )
  })

  it("updates status successfully for STAFF", async () => {
    mockStaffSession()
    vi.mocked(db.admissionInquiry.findFirst).mockResolvedValue({
      id: "i2",
    } as never)
    vi.mocked(db.admissionInquiry.update).mockResolvedValue({} as never)

    const result = await updateInquiryStatus({ id: "i2", status: "QUALIFIED" })
    expect(result.success).toBe(true)
  })

  it("ACCOUNTANT is denied updateStatus (no updateStatus permission)", async () => {
    mockAccountantSession()
    const result = await updateInquiryStatus({ id: "i1", status: "CONTACTED" })
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toBe("FORBIDDEN")
  })
})

// ---------------------------------------------------------------------------
// markInquiryConverted action
// ---------------------------------------------------------------------------

describe("markInquiryConverted server action", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns APPLICATION_NOT_FOUND when application not in school", async () => {
    mockAdminSession()
    vi.mocked(db.admissionInquiry.findFirst).mockResolvedValue({
      id: "i1",
    } as never)
    vi.mocked(db.application.findFirst).mockResolvedValue(null)

    const result = await markInquiryConverted({
      id: "i1",
      convertedToApplicationId: "app-999",
    })
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toBe("APPLICATION_NOT_FOUND")
  })

  it("marks inquiry as CONVERTED with applicationId on success", async () => {
    mockAdminSession()
    vi.mocked(db.admissionInquiry.findFirst).mockResolvedValue({
      id: "i1",
      convertedToApplicationId: null,
    } as never)
    vi.mocked(db.application.findFirst).mockResolvedValue({
      id: "app-1",
    } as never)
    vi.mocked(db.admissionInquiry.updateMany).mockResolvedValue({
      count: 1,
    } as never)

    const result = await markInquiryConverted({
      id: "i1",
      convertedToApplicationId: "app-1",
    })
    expect(result.success).toBe(true)
    expect(db.admissionInquiry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "i1",
          schoolId: SCHOOL_ID,
          convertedToApplicationId: null,
        },
        data: expect.objectContaining({
          status: "CONVERTED",
          convertedToApplicationId: "app-1",
        }),
      })
    )
  })

  it("never retargets an inquiry that is already converted", async () => {
    mockAdminSession()
    vi.mocked(db.admissionInquiry.findFirst).mockResolvedValue({
      id: "i1",
      convertedToApplicationId: "app-old",
    } as never)

    const result = await markInquiryConverted({
      id: "i1",
      convertedToApplicationId: "app-1",
    })
    expect(result).toEqual({
      success: false,
      error: "INQUIRY_ALREADY_CONVERTED",
    })
    expect(db.admissionInquiry.updateMany).not.toHaveBeenCalled()
  })

  it("rejects malformed ids", async () => {
    mockAdminSession()
    const result = await markInquiryConverted({
      id: "",
      convertedToApplicationId: "app-1",
    })
    expect(result).toEqual({ success: false, error: "VALIDATION_ERROR" })
  })
})

// ---------------------------------------------------------------------------
// updateTourBookingStatus action
// ---------------------------------------------------------------------------

describe("updateTourBookingStatus server action", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns BOOKING_NOT_FOUND when booking not in school", async () => {
    mockAdminSession()
    vi.mocked(db.tourBooking.findFirst).mockResolvedValue(null)

    const result = await updateTourBookingStatus({
      id: "tb-1",
      status: "CONFIRMED",
    })
    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toBe("BOOKING_NOT_FOUND")
  })

  it("confirms a tour booking successfully", async () => {
    mockAdminSession()
    vi.mocked(db.tourBooking.findFirst).mockResolvedValue({
      id: "tb-1",
      status: "PENDING",
      slotId: "slot-1",
      numberOfAttendees: 2,
    } as never)
    vi.mocked(db.tourBooking.updateMany).mockResolvedValue({
      count: 1,
    } as never)

    const result = await updateTourBookingStatus({
      id: "tb-1",
      status: "CONFIRMED",
    })
    expect(result.success).toBe(true)
    expect(db.tourBooking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "tb-1",
          schoolId: SCHOOL_ID,
          status: { not: "CANCELLED" },
        },
        data: expect.objectContaining({ status: "CONFIRMED" }),
      })
    )
  })

  it("refuses to revive a cancelled booking (its seats were released)", async () => {
    mockAdminSession()
    vi.mocked(db.tourBooking.findFirst).mockResolvedValue({
      id: "tb-1",
      status: "CANCELLED",
      slotId: "slot-1",
      numberOfAttendees: 2,
    } as never)
    vi.mocked(db.tourBooking.updateMany).mockResolvedValue({
      count: 0,
    } as never)

    const result = await updateTourBookingStatus({
      id: "tb-1",
      status: "CONFIRMED",
    })
    expect(result).toEqual({ success: false, error: "BOOKING_CANCELLED" })
  })

  it("rejects a status outside the allowed set", async () => {
    mockAdminSession()
    const result = await updateTourBookingStatus({
      id: "tb-1",
      status: "PENDING" as never,
    })
    expect(result).toEqual({ success: false, error: "VALIDATION_ERROR" })
  })

  it("cancels a booking via $transaction (decrements slot capacity)", async () => {
    mockAdminSession()
    vi.mocked(db.tourBooking.findFirst).mockResolvedValue({
      id: "tb-1",
      status: "CONFIRMED",
      slotId: "slot-1",
      numberOfAttendees: 3,
    } as never)
    vi.mocked(db.$transaction).mockImplementation((async (
      fn: (tx: typeof db) => unknown
    ) => fn(db)) as never)
    vi.mocked(db.tourBooking.updateMany).mockResolvedValue({
      count: 1,
    } as never)

    const result = await updateTourBookingStatus({
      id: "tb-1",
      status: "CANCELLED",
      cancelReason: "Conflicting schedule",
    })
    expect(result.success).toBe(true)
    expect(db.admissionTimeSlot.update).toHaveBeenCalledWith({
      where: { id: "slot-1" },
      data: { currentBookings: { decrement: 3 } },
    })
  })

  it("does not release seats twice when a concurrent cancel won", async () => {
    mockAdminSession()
    vi.mocked(db.tourBooking.findFirst).mockResolvedValue({
      id: "tb-1",
      status: "CONFIRMED", // read before the family's cancel landed
      slotId: "slot-1",
      numberOfAttendees: 3,
    } as never)
    vi.mocked(db.$transaction).mockImplementation((async (
      fn: (tx: typeof db) => unknown
    ) => fn(db)) as never)
    vi.mocked(db.tourBooking.updateMany).mockResolvedValue({
      count: 0,
    } as never)

    const result = await updateTourBookingStatus({
      id: "tb-1",
      status: "CANCELLED",
    })
    expect(result.success).toBe(true)
    expect(db.admissionTimeSlot.update).not.toHaveBeenCalled()
  })
})

describe("updateInquiryStatus validation", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects a status outside the enum", async () => {
    mockAdminSession()
    const result = await updateInquiryStatus({
      id: "inq-1",
      status: "HACKED" as never,
    })
    expect(result).toEqual({ success: false, error: "VALIDATION_ERROR" })
    expect(db.admissionInquiry.update).not.toHaveBeenCalled()
  })

  it("rejects an assignee who is not this school's user", async () => {
    mockAdminSession()
    vi.mocked(db.admissionInquiry.findFirst).mockResolvedValue({
      id: "inq-1",
    } as never)
    vi.mocked(db.user.findFirst).mockResolvedValue(null)

    const result = await updateInquiryStatus({
      id: "inq-1",
      status: "CONTACTED",
      assignedTo: "user-from-another-school",
    })
    expect(result).toEqual({ success: false, error: "VALIDATION_ERROR" })
    expect(db.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-from-another-school", schoolId: SCHOOL_ID },
      })
    )
    expect(db.admissionInquiry.update).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Tenant binding — a school role never follows the host to another school
// ---------------------------------------------------------------------------

describe("leads tenant binding", () => {
  beforeEach(() => vi.clearAllMocks())

  it("STAFF of school A calling on school B's host reads school A", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-2", role: "STAFF", schoolId: SCHOOL_ID },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: "school-other",
      subdomain: "other",
    } as never)
    vi.mocked(db.admissionInquiry.findMany).mockResolvedValue([])
    vi.mocked(db.admissionInquiry.count).mockResolvedValue(0)

    await getInquiries({})
    expect(db.admissionInquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL_ID }),
      })
    )
  })

  it("STAFF of school A cannot update school B's inquiry", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-2", role: "STAFF", schoolId: SCHOOL_ID },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: "school-other",
      subdomain: "other",
    } as never)
    vi.mocked(db.admissionInquiry.findFirst).mockResolvedValue(null)

    const result = await updateInquiryStatus({
      id: "inq-b",
      status: "CONTACTED",
    })
    expect(result.success).toBe(false)
    expect(db.admissionInquiry.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "inq-b", schoolId: SCHOOL_ID },
      })
    )
    expect(db.admissionInquiry.update).not.toHaveBeenCalled()
  })

  it("DEVELOPER follows the tenant context", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "dev", role: "DEVELOPER", schoolId: null },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: "school-other",
      subdomain: "other",
    } as never)
    vi.mocked(db.admissionInquiry.findMany).mockResolvedValue([])
    vi.mocked(db.admissionInquiry.count).mockResolvedValue(0)

    await getInquiries({})
    expect(db.admissionInquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: "school-other" }),
      })
    )
  })
})

// ---------------------------------------------------------------------------
// getInquiriesList query (unit)
// ---------------------------------------------------------------------------

describe("getInquiriesList query", () => {
  beforeEach(() => vi.clearAllMocks())

  it("always includes schoolId in where clause", async () => {
    vi.mocked(db.admissionInquiry.findMany).mockResolvedValue([])
    vi.mocked(db.admissionInquiry.count).mockResolvedValue(0)

    await getInquiriesList(SCHOOL_ID, { page: 1, perPage: 10 })

    expect(db.admissionInquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL_ID }),
      })
    )
  })

  it("applies status filter when provided", async () => {
    vi.mocked(db.admissionInquiry.findMany).mockResolvedValue([])
    vi.mocked(db.admissionInquiry.count).mockResolvedValue(0)

    await getInquiriesList(SCHOOL_ID, {
      page: 1,
      perPage: 10,
      status: "NEW",
    })

    expect(db.admissionInquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "NEW" }),
      })
    )
  })

  it("applies search filter across parentName/email/studentName", async () => {
    vi.mocked(db.admissionInquiry.findMany).mockResolvedValue([])
    vi.mocked(db.admissionInquiry.count).mockResolvedValue(0)

    await getInquiriesList(SCHOOL_ID, {
      page: 1,
      perPage: 10,
      search: "ali",
    })

    const callArgs = vi.mocked(db.admissionInquiry.findMany).mock.calls[0][0]
    expect(callArgs.where.OR).toHaveLength(3)
  })

  it("uses createdAt desc as default sort", async () => {
    vi.mocked(db.admissionInquiry.findMany).mockResolvedValue([])
    vi.mocked(db.admissionInquiry.count).mockResolvedValue(0)

    await getInquiriesList(SCHOOL_ID, { page: 1, perPage: 10 })

    expect(db.admissionInquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "desc" }],
      })
    )
  })
})

// ---------------------------------------------------------------------------
// getTourBookingsList query (unit)
// ---------------------------------------------------------------------------

describe("getTourBookingsList query", () => {
  beforeEach(() => vi.clearAllMocks())

  it("always includes schoolId in where clause", async () => {
    vi.mocked(db.tourBooking.findMany).mockResolvedValue([])
    vi.mocked(db.tourBooking.count).mockResolvedValue(0)

    await getTourBookingsList(SCHOOL_ID, { page: 1, perPage: 10 })

    expect(db.tourBooking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL_ID }),
      })
    )
  })

  it("applies status filter when provided", async () => {
    vi.mocked(db.tourBooking.findMany).mockResolvedValue([])
    vi.mocked(db.tourBooking.count).mockResolvedValue(0)

    await getTourBookingsList(SCHOOL_ID, {
      page: 1,
      perPage: 10,
      status: "PENDING",
    })

    expect(db.tourBooking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PENDING" }),
      })
    )
  })

  it("includes slot relation in select", async () => {
    vi.mocked(db.tourBooking.findMany).mockResolvedValue([])
    vi.mocked(db.tourBooking.count).mockResolvedValue(0)

    await getTourBookingsList(SCHOOL_ID, { page: 1, perPage: 10 })

    const callArgs = vi.mocked(db.tourBooking.findMany).mock.calls[0][0]
    expect(callArgs.select).toHaveProperty("slot")
  })
})
