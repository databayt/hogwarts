// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Mock Factories Index
 *
 * Central export point for all onboarding test factories.
 */

// School factories
export {
  createMockSchool,
  createMinimalSchool,
  createDraftSchool,
  createMockSchools,
  createTitleStepData,
  createDescriptionStepData,
  createLocationStepData,
  createCapacityStepData,
  createPriceStepData,
  createBrandingStepData,
  createLegalStepData,
  createInvalidSchoolData,
  createEdgeCaseSchoolData,
} from "./school"

// User/Auth factories
export {
  createMockAuthContext,
  createAdminAuthContext,
  createDeveloperAuthContext,
  createTeacherAuthContext,
  createStudentAuthContext,
  createUnauthenticatedContext,
  createMockSessionUser,
  createMockSession,
  createAdminSession,
  createDeveloperSession,
  createExpiredSession,
  createUnverifiedSession,
  createAuthMock,
  createAuthMockFactory,
  setupAuthMock,
  setupUnauthenticatedMock,
  createTestUsers,
  createTestSessions,
} from "./user"
export type {
  UserRole,
  MockAuthContext,
  MockSessionUser,
  MockSession,
} from "./user"

// Dictionary factories
export {
  createMockDictionary,
  createMockDictionaryWithOverrides,
  createMinimalDictionary,
  createArabicDictionary,
  mockValidationMessages,
  mockToastMessages,
  mockErrorMessages,
} from "./dictionary"
