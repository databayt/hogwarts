// Public Admission Portal Actions

// Application Actions
export {
  getActiveCampaigns,
  getCampaignById,
  saveApplicationSession,
  resumeApplicationSession,
  getDraftApplications,
  getDraftApplicationsByUser,
  submitApplication,
} from "./application"

// Status Tracker Actions
export {
  requestStatusOTP,
  verifyStatusOTP,
  getApplicationStatus,
  getApplicationByNumber,
} from "./status"

// Tour Booking Actions
export {
  getAvailableSlots,
  getSlotsByMonth,
  createTourBooking,
  getBookingDetails,
  cancelTourBooking,
  rescheduleTourBooking,
} from "./tour"

// Inquiry Actions
export { submitInquiry, isInquiryFormEnabled } from "./inquiry"
