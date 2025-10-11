import { describe, it, expect, vi } from 'vitest'
import * as billing from '../actions'

vi.mock('@/lib/db', () => {
  return {
    db: {
      receipt: {
        create: vi.fn().mockResolvedValue({
          id: 'r1',
          schoolId: 's1',
          invoiceId: 'i1',
          filename: 'f.pdf',
          amount: 1000,
          status: 'pending'
        }),
        update: vi.fn().mockResolvedValue({
          id: 'r1',
          schoolId: 's1',
          invoiceId: 'i1',
          status: 'approved'
        })
      },
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'i1',
          schoolId: 's1'
        }),
        update: vi.fn().mockResolvedValue({
          id: 'i1',
          schoolId: 's1',
          status: 'paid'
        })
      },
      $transaction: vi.fn().mockImplementation((fn) => fn({
        receipt: {
          update: vi.fn().mockResolvedValue({
            id: 'r1',
            schoolId: 's1',
            invoiceId: 'i1',
            status: 'approved'
          })
        },
        invoice: {
          update: vi.fn().mockResolvedValue({
            id: 'i1',
            schoolId: 's1',
            status: 'paid'
          })
        }
      }))
    },
  }
})

vi.mock('@/components/operator/lib/operator-auth', () => ({
  requireOperator: vi.fn().mockResolvedValue({ userId: 'u1' }),
  requireNotImpersonating: vi.fn().mockResolvedValue(undefined),
  logOperatorAudit: vi.fn().mockResolvedValue(undefined),
}))

describe('billing/actions.ts', () => {
  it('receiptCreate creates a receipt', async () => {
    const result = await billing.receiptCreate({
      invoiceId: 'i1',
      schoolId: 's1',
      filename: 'f.pdf',
      amount: 1000
    })
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: 'r1',
        status: 'pending'
      })
    })
  })

  it('receiptReview reviews a receipt', async () => {
    const result = await billing.receiptReview({
      id: 'r1',
      decision: 'approved',
      reason: 'ok'
    })
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: 'r1',
        status: 'approved'
      })
    })
  })

  it('invoiceUpdateStatus updates invoice status', async () => {
    const result = await billing.invoiceUpdateStatus({
      id: 'i1',
      status: 'paid'
    })
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: 'i1',
        status: 'paid'
      })
    })
  })
})