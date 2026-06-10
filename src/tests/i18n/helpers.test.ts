// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Unit tests for the i18n helper utilities
 * (src/components/internationalization/helpers/index.ts).
 *
 * These are pure functions backed by `Dictionary["messages"]`. We import the
 * REAL English messages.json so the fixtures are type-accurate and stay in sync
 * with the actual dictionary shape (top-level keys: validation/toast/errors).
 */
import { describe, expect, it } from "vitest"

import enMessages from "@/components/internationalization/dictionaries/en/messages.json"
import {
  createI18nHelpers,
  ErrorHelper,
  getErrorMessages,
  getToastMessages,
  getValidationMessages,
  interpolate,
  ToastHelper,
  useI18nMessages,
  ValidationHelper,
  type Messages,
} from "@/components/internationalization/helpers"

// The real messages.json IS the `Dictionary["messages"]` shape.
const messages = enMessages as Messages

// A minimal `Dictionary`-like object for the dictionary-level helpers. Only the
// `messages` key is read by useI18nMessages / get*Messages, so a partial cast
// is sufficient and keeps the fixture honest.
const dictionary = { messages } as unknown as Parameters<
  typeof useI18nMessages
>[0]

describe("interpolate", () => {
  it("replaces a single {param}", () => {
    expect(interpolate("Must be at least {min} characters", { min: 3 })).toBe(
      "Must be at least 3 characters"
    )
  })

  it("replaces multiple distinct params", () => {
    expect(
      interpolate("Score must be between {min} and {max}", { min: 0, max: 100 })
    ).toBe("Score must be between 0 and 100")
  })

  it("replaces every occurrence of a repeated param (global)", () => {
    expect(interpolate("{x} and {x} again", { x: "A" })).toBe("A and A again")
  })

  it("leaves an unknown placeholder untouched when its param is missing", () => {
    expect(interpolate("Hello {name}, you have {count}", { name: "Bob" })).toBe(
      "Hello Bob, you have {count}"
    )
  })

  it("returns the message unchanged when no params object is given", () => {
    expect(interpolate("plain message")).toBe("plain message")
  })

  it("returns the message unchanged with an empty params object", () => {
    expect(interpolate("no {token} here", {})).toBe("no {token} here")
  })

  it("coerces numeric values to strings", () => {
    expect(interpolate("{n} items", { n: 0 })).toBe("0 items")
  })
})

describe("ValidationHelper", () => {
  const v = new ValidationHelper(messages.validation)

  it("required() returns the required message", () => {
    expect(v.required()).toBe(messages.validation.required)
  })

  it("email() returns the email message", () => {
    expect(v.email()).toBe(messages.validation.email)
  })

  it("minLength(n) interpolates {min}", () => {
    expect(v.minLength(5)).toBe("Must be at least 5 characters")
  })

  it("maxLength(n) interpolates {max}", () => {
    expect(v.maxLength(63)).toBe("Must be no more than 63 characters")
  })

  it("min(n) interpolates {min}", () => {
    expect(v.min(1)).toBe("Must be at least 1")
  })

  it("max(n) interpolates {max}", () => {
    expect(v.max(99)).toBe("Must be no more than 99")
  })

  it("positive() returns the positive message", () => {
    expect(v.positive()).toBe(messages.validation.positive)
  })

  it("passwordMinLength() / passwordMismatch() return password messages", () => {
    expect(v.passwordMinLength()).toBe(messages.validation.passwordMinLength)
    expect(v.passwordMismatch()).toBe(messages.validation.passwordMismatch)
  })

  describe("nested groups", () => {
    it("title.required / tooShort / tooLong interpolate correctly", () => {
      expect(v.title.required()).toBe(messages.validation.titleRequired)
      expect(v.title.tooShort(3)).toBe("Title must be at least 3 characters")
      expect(v.title.tooLong(120)).toBe(
        "Title must be no more than 120 characters"
      )
    })

    it("subdomain group returns its messages", () => {
      expect(v.subdomain.required()).toBe(messages.validation.subdomainRequired)
      expect(v.subdomain.tooShort()).toBe(messages.validation.subdomainTooShort)
      expect(v.subdomain.invalidFormat()).toBe(
        messages.validation.subdomainInvalidFormat
      )
      expect(v.subdomain.alreadyTaken()).toBe(
        messages.validation.subdomainAlreadyTaken
      )
    })

    it("amount group returns its messages", () => {
      expect(v.amount.required()).toBe(messages.validation.amountRequired)
      expect(v.amount.positive()).toBe(messages.validation.amountPositive)
    })

    it("score.required / invalidRange interpolate {min} and {max}", () => {
      expect(v.score.required()).toBe(messages.validation.scoreRequired)
      expect(v.score.invalidRange(0, 100)).toBe(
        "Score must be between 0 and 100"
      )
    })
  })

  describe("generic get(key, params)", () => {
    it("returns a plain message by key", () => {
      expect(v.get("required")).toBe(messages.validation.required)
    })

    it("interpolates params for a templated key", () => {
      expect(v.get("minLength", { min: 8 })).toBe(
        "Must be at least 8 characters"
      )
    })

    it("leaves the template intact when params are omitted", () => {
      expect(v.get("minLength")).toBe(messages.validation.minLength)
    })

    it("falls back to String(undefined) for an unknown key", () => {
      // The real validation namespace has no such key; the helper coerces the
      // missing (undefined) value to a string rather than throwing.
      expect(
        v.get("__does_not_exist__" as keyof typeof messages.validation)
      ).toBe("undefined")
    })
  })
})

describe("ToastHelper", () => {
  const t = new ToastHelper(messages.toast)

  it("success.created/updated/deleted return success messages", () => {
    expect(t.success.created()).toBe(messages.toast.success.created)
    expect(t.success.updated()).toBe(messages.toast.success.updated)
    expect(t.success.deleted()).toBe(messages.toast.success.deleted)
  })

  it("success has saved/uploaded/sent", () => {
    expect(t.success.saved()).toBe(messages.toast.success.saved)
    expect(t.success.uploaded()).toBe(messages.toast.success.uploaded)
    expect(t.success.sent()).toBe(messages.toast.success.sent)
  })

  it("entity-specific success helpers map to flat keys", () => {
    expect(t.success.student.created()).toBe(
      messages.toast.success.studentCreated
    )
    expect(t.success.teacher.updated()).toBe(
      messages.toast.success.teacherUpdated
    )
    expect(t.success.class.deleted()).toBe(messages.toast.success.classDeleted)
    expect(t.success.invoice.created()).toBe(
      messages.toast.success.invoiceCreated
    )
    expect(t.success.announcement.updated()).toBe(
      messages.toast.success.announcementUpdated
    )
  })

  it("error.* generic helpers return error messages", () => {
    expect(t.error.generic()).toBe(messages.toast.error.generic)
    expect(t.error.createFailed()).toBe(messages.toast.error.createFailed)
    expect(t.error.updateFailed()).toBe(messages.toast.error.updateFailed)
    expect(t.error.deleteFailed()).toBe(messages.toast.error.deleteFailed)
    expect(t.error.saveFailed()).toBe(messages.toast.error.saveFailed)
    expect(t.error.uploadFailed()).toBe(messages.toast.error.uploadFailed)
  })

  it("entity-specific error helpers map to flat keys", () => {
    expect(t.error.student.createFailed()).toBe(
      messages.toast.error.studentCreateFailed
    )
    expect(t.error.invoice.deleteFailed()).toBe(
      messages.toast.error.invoiceDeleteFailed
    )
  })

  it("warning.* helpers return warning messages", () => {
    expect(t.warning.unsavedChanges()).toBe(
      messages.toast.warning.unsavedChanges
    )
    expect(t.warning.confirmDelete()).toBe(messages.toast.warning.confirmDelete)
    expect(t.warning.confirmCancel()).toBe(messages.toast.warning.confirmCancel)
    expect(t.warning.dataLoss()).toBe(messages.toast.warning.dataLoss)
    expect(t.warning.irreversible()).toBe(messages.toast.warning.irreversible)
  })

  it("info.* helpers return info messages", () => {
    expect(t.info.loading()).toBe(messages.toast.info.loading)
    expect(t.info.saving()).toBe(messages.toast.info.saving)
    expect(t.info.uploading()).toBe(messages.toast.info.uploading)
    expect(t.info.processing()).toBe(messages.toast.info.processing)
    expect(t.info.syncing()).toBe(messages.toast.info.syncing)
  })
})

describe("ErrorHelper", () => {
  const e = new ErrorHelper(messages.errors)

  it("server namespace returns server errors", () => {
    expect(e.server.internalError()).toBe(messages.errors.server.internalError)
    expect(e.server.databaseError()).toBe(messages.errors.server.databaseError)
    expect(e.server.connectionError()).toBe(
      messages.errors.server.connectionError
    )
    expect(e.server.serviceUnavailable()).toBe(
      messages.errors.server.serviceUnavailable
    )
  })

  it("auth namespace returns auth errors", () => {
    expect(e.auth.invalidCredentials()).toBe(
      messages.errors.auth.invalidCredentials
    )
    expect(e.auth.accountNotFound()).toBe(messages.errors.auth.accountNotFound)
    expect(e.auth.accountDisabled()).toBe(messages.errors.auth.accountDisabled)
    expect(e.auth.sessionExpired()).toBe(messages.errors.auth.sessionExpired)
    expect(e.auth.permissionDenied()).toBe(
      messages.errors.auth.permissionDenied
    )
    expect(e.auth.notAuthenticated()).toBe(
      messages.errors.auth.notAuthenticated
    )
  })

  it("tenant namespace returns tenant errors", () => {
    expect(e.tenant.missingSchoolContext()).toBe(
      messages.errors.tenant.missingSchoolContext
    )
    expect(e.tenant.schoolNotFound()).toBe(
      messages.errors.tenant.schoolNotFound
    )
    expect(e.tenant.subdomainTaken()).toBe(
      messages.errors.tenant.subdomainTaken
    )
  })

  it("resource namespace returns resource errors", () => {
    expect(e.resource.notFound()).toBe(messages.errors.resource.notFound)
    expect(e.resource.alreadyExists()).toBe(
      messages.errors.resource.alreadyExists
    )
    expect(e.resource.cannotDelete()).toBe(
      messages.errors.resource.cannotDelete
    )
    expect(e.resource.cannotModify()).toBe(
      messages.errors.resource.cannotModify
    )
  })

  it("file namespace returns file errors", () => {
    expect(e.file.uploadFailed()).toBe(messages.errors.file.uploadFailed)
    expect(e.file.fileTooLarge()).toBe(messages.errors.file.fileTooLarge)
    expect(e.file.invalidType()).toBe(messages.errors.file.invalidType)
    expect(e.file.notFound()).toBe(messages.errors.file.notFound)
  })

  it("payment namespace returns payment errors", () => {
    expect(e.payment.processingFailed()).toBe(
      messages.errors.payment.processingFailed
    )
    expect(e.payment.cardDeclined()).toBe(messages.errors.payment.cardDeclined)
    expect(e.payment.insufficientFunds()).toBe(
      messages.errors.payment.insufficientFunds
    )
  })
})

describe("factory + accessors", () => {
  it("createI18nHelpers wires {validation, toast, error}", () => {
    const h = createI18nHelpers(messages)
    expect(h.validation).toBeInstanceOf(ValidationHelper)
    expect(h.toast).toBeInstanceOf(ToastHelper)
    expect(h.error).toBeInstanceOf(ErrorHelper)
    expect(h.validation.required()).toBe(messages.validation.required)
    expect(h.toast.success.created()).toBe(messages.toast.success.created)
    expect(h.error.auth.notAuthenticated()).toBe(
      messages.errors.auth.notAuthenticated
    )
  })

  it("useI18nMessages delegates to createI18nHelpers via dictionary.messages", () => {
    const h = useI18nMessages(dictionary)
    expect(h.validation).toBeInstanceOf(ValidationHelper)
    expect(h.toast).toBeInstanceOf(ToastHelper)
    expect(h.error).toBeInstanceOf(ErrorHelper)
    expect(h.validation.minLength(2)).toBe("Must be at least 2 characters")
  })

  it("getValidationMessages returns a ValidationHelper", () => {
    const v = getValidationMessages(dictionary)
    expect(v).toBeInstanceOf(ValidationHelper)
    expect(v.email()).toBe(messages.validation.email)
  })

  it("getToastMessages returns a ToastHelper", () => {
    const t = getToastMessages(dictionary)
    expect(t).toBeInstanceOf(ToastHelper)
    expect(t.success.saved()).toBe(messages.toast.success.saved)
  })

  it("getErrorMessages returns an ErrorHelper", () => {
    const e = getErrorMessages(dictionary)
    expect(e).toBeInstanceOf(ErrorHelper)
    expect(e.server.internalError()).toBe(messages.errors.server.internalError)
  })
})
