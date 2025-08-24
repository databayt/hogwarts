import { describe, it, expect, vi } from 'vitest'
import * as create from '@/app/(platform)/operator/actions/billing/receipts/create'

vi.mock('@/lib/db', () => {
  return {
    db: {
      receipt: { create: vi.fn().mockResolvedValue({ id: 'r1' }) },
      invoice: { findUnique: vi.fn().mockResolvedValue({ id: 'i1', schoolId: 's1' }) },
    },
  }
})

vi.mock('@/components/platform/operator/lib/auth', () => ({
  getOperatorContext: vi.fn().mockResolvedValue({ operator: { userId: 'u1' } }),
}))

vi.mock('@/components/platform/operator/lib/audit', () => ({
  logOperatorAudit: vi.fn().mockResolvedValue(undefined),
}))

describe('billing receipt create', () => {
  it('returns success', async () => {
    const res = await create.createReceipt({ invoiceId: 'i1', schoolId: 's1', filename: 'f.pdf', amount: 1000 } as any)
    expect(res).toEqual({ success: true })
  })
})

import { describe, it, expect, vi } from 'vitest'
import * as receiptsCreate from '@/app/(platform)/operator/actions/billing/receipts/create'
import * as receiptsReview from '@/app/(platform)/operator/actions/billing/receipts/review'
import * as invoicesUpdate from '@/app/(platform)/operator/actions/billing/invoices/update-status'
import * as billing from '../actions'

describe('billing/actions.ts', () => {
  it('billingCreateReceipt validates and delegates', async () => {
    const spy = vi.spyOn(receiptsCreate, 'createReceipt').mockResolvedValue('r1' as any)
    await expect(billing.billingCreateReceipt({ invoiceId: 'i1', schoolId: 's1', filename: 'f.pdf', amount: 1000 })).resolves.toEqual({ success: true, id: 'r1' })
    expect(spy).toHaveBeenCalled()
  })

  it('billingReviewReceipt validates and delegates', async () => {
    const spy = vi.spyOn(receiptsReview, 'reviewReceipt').mockResolvedValue(undefined as any)
    await expect(billing.billingReviewReceipt({ id: 'r1', decision: 'approved', reason: 'ok' })).resolves.toEqual({ success: true })
    expect(spy).toHaveBeenCalled()
  })

  it('billingUpdateInvoiceStatus validates and delegates', async () => {
    const spy = vi.spyOn(invoicesUpdate, 'updateInvoiceStatus').mockResolvedValue(undefined as any)
    await expect(billing.billingUpdateInvoiceStatus({ id: 'i1', status: 'paid' })).resolves.toEqual({ success: true })
    expect(spy).toHaveBeenCalled()
  })
})



