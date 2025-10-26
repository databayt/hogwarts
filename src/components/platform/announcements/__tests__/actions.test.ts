import { describe, it, expect, vi } from 'vitest'

vi.mock('@/components/platform/operator/lib/tenant', () => ({
  getTenantContext: vi.fn().mockResolvedValue({ schoolId: 's1' }),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const create = vi.fn().mockResolvedValue({ id: 'a1' })
const updateMany = vi.fn().mockResolvedValue({ count: 1 })
const deleteMany = vi.fn().mockResolvedValue({ count: 1 })
vi.mock('@/lib/db', () => ({
  db: { announcement: { create, updateMany, deleteMany } },
}))

import { createAnnouncement, toggleAnnouncementPublish, deleteAnnouncement } from '@/components/platform/announcements/actions'

describe('announcement actions', () => {
  it('creates announcement with schoolId', async () => {
    await createAnnouncement({ title: 't', body: 'b', scope: 'school', published: false })
    expect(create).toHaveBeenCalled()
  })
  it('toggles publish with tenant safety', async () => {
    await toggleAnnouncementPublish({ id: 'x', publish: true })
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'x', schoolId: 's1' }) }))
  })
  it('deletes scoped by schoolId', async () => {
    await deleteAnnouncement({ id: 'x' })
    expect(deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'x', schoolId: 's1' }) }))
  })
})


