"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Public share links for invoices — the exact report-card share pattern
// (grades/actions/share.ts): opaque globally-unique token as the credential,
// idempotent enable, revoke keeps the token so re-enabling never rots
// already-distributed links. Powers the hosted invoice a parent can open and
// print from a WhatsApp link without an account.
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

import { isFinanceAuthError, requireFinanceActor } from "../guard"

// ============================================================================
// SHARE (admin/accountant action)
// ============================================================================

/**
 * Enable the public share link for an invoice.
 *
 * - Gated by invoice.edit (ADMIN/ACCOUNTANT/DEVELOPER or granular grant).
 * - Drafts (wizardStep != null) cannot be shared.
 * - Idempotent: an existing token is reused.
 * - shareExpiry stays null (no expiry by default; parity with report cards).
 */
export async function shareInvoice(
  invoiceId: string
): Promise<ActionResponse<{ token: string }>> {
  try {
    const ctx = await requireFinanceActor("invoice", "edit")
    if (isFinanceAuthError(ctx)) return ctx

    const invoice = await db.userInvoice.findFirst({
      where: { id: invoiceId, schoolId: ctx.schoolId },
      select: {
        id: true,
        wizardStep: true,
        shareToken: true,
        isPublic: true,
      },
    })

    if (!invoice) return actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)
    if (invoice.wizardStep !== null) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    if (invoice.shareToken && invoice.isPublic) {
      return { success: true, data: { token: invoice.shareToken } }
    }

    const token = invoice.shareToken ?? crypto.randomUUID().replace(/-/g, "")

    await db.userInvoice.update({
      where: { id: invoice.id },
      data: { shareToken: token, isPublic: true },
    })

    return { success: true, data: { token } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to share invoice",
    }
  }
}

// ============================================================================
// GET SHARED INVOICE (public — no auth; the token is the credential)
// ============================================================================

export interface SharedInvoiceParty {
  name: string
  email: string | null
  address1: string
  address2: string | null
  address3: string | null
}

export interface SharedInvoiceItem {
  id: string
  item_name: string
  quantity: number
  price: number
  total: number
}

export interface SharedInvoiceData {
  invoice_no: string
  invoice_date: Date
  due_date: Date
  currency: string
  status: string
  sub_total: number
  discount: number | null
  tax_percentage: number | null
  total: number
  amountPaid: number
  notes: string | null
  from: SharedInvoiceParty
  to: SharedInvoiceParty
  items: SharedInvoiceItem[]
  schoolName: string | null
  schoolLogo: string | null
  schoolEmail: string | null
}

/**
 * Public reader for a shared invoice — no session required.
 *
 * Cross-tenant leakage is impossible: the lookup keys on the globally-unique
 * shareToken column, and only the minimal display payload is returned.
 * Honors shareExpiry when set. Increments viewCount fire-and-forget.
 */
export async function getSharedInvoice(token: string): Promise<{
  valid: boolean
  data?: SharedInvoiceData
}> {
  try {
    if (!token || token.length < 16) return { valid: false }

    const invoice = await db.userInvoice.findFirst({
      where: { shareToken: token, isPublic: true },
      select: {
        id: true,
        schoolId: true,
        userId: true,
        invoice_no: true,
        invoice_date: true,
        due_date: true,
        currency: true,
        status: true,
        sub_total: true,
        discount: true,
        tax_percentage: true,
        total: true,
        amountPaid: true,
        notes: true,
        shareExpiry: true,
        from: {
          select: {
            name: true,
            email: true,
            address1: true,
            address2: true,
            address3: true,
          },
        },
        to: {
          select: {
            name: true,
            email: true,
            address1: true,
            address2: true,
            address3: true,
          },
        },
        items: {
          select: {
            id: true,
            item_name: true,
            quantity: true,
            price: true,
            total: true,
          },
        },
      },
    })

    if (!invoice) return { valid: false }
    if (invoice.shareExpiry && invoice.shareExpiry < new Date()) {
      return { valid: false }
    }

    // Branding: per-user invoice logo overrides the school logo (same rule as
    // the PDF + email paths).
    const [settings, school] = await Promise.all([
      db.userInvoiceSettings.findUnique({
        where: { userId: invoice.userId },
        select: { invoiceLogo: true },
      }),
      db.school.findUnique({
        where: { id: invoice.schoolId },
        select: { name: true, logoUrl: true, email: true },
      }),
    ])

    db.userInvoice
      .update({
        where: { id: invoice.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => undefined)

    const data: SharedInvoiceData = {
      invoice_no: invoice.invoice_no,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      currency: invoice.currency,
      status: invoice.status,
      sub_total: Number(invoice.sub_total),
      discount: invoice.discount != null ? Number(invoice.discount) : null,
      tax_percentage:
        invoice.tax_percentage != null ? Number(invoice.tax_percentage) : null,
      total: Number(invoice.total),
      amountPaid: Number(invoice.amountPaid ?? 0),
      notes: invoice.notes,
      from: invoice.from,
      to: invoice.to,
      items: invoice.items.map((item) => ({
        ...item,
        price: Number(item.price),
        total: Number(item.total),
      })),
      schoolName: school?.name ?? invoice.from?.name ?? null,
      schoolLogo: settings?.invoiceLogo ?? school?.logoUrl ?? null,
      schoolEmail: school?.email ?? invoice.from?.email ?? null,
    }

    return { valid: true, data }
  } catch {
    return { valid: false }
  }
}

// ============================================================================
// REVOKE (admin/accountant action)
// ============================================================================

/**
 * Revoke the public share link. Sets isPublic:false but PRESERVES the token —
 * re-enabling later restores the exact same URL (no link-rot for links already
 * sent over WhatsApp/email).
 */
export async function revokeInvoiceShare(
  invoiceId: string
): Promise<ActionResponse<void>> {
  try {
    const ctx = await requireFinanceActor("invoice", "edit")
    if (isFinanceAuthError(ctx)) return ctx

    const invoice = await db.userInvoice.findFirst({
      where: { id: invoiceId, schoolId: ctx.schoolId },
      select: { id: true },
    })

    if (!invoice) return actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)

    await db.userInvoice.update({
      where: { id: invoice.id },
      data: { isPublic: false },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to revoke invoice share",
    }
  }
}
