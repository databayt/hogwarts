"use client";

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createAnnouncement } from '@/app/school/dashboard/announcements/actions'
import { getClassesForSelection } from '@/components/school/dashboard/attendance/actions'
import { SuccessToast, ErrorToast } from '@/components/atom/toast'

export function AnnouncementsContent() {
  const [title, setTitle] = React.useState('')
  const [body, setBody] = React.useState('')
  const [scope, setScope] = React.useState<'school' | 'class' | 'role'>('school')
  const [classId, setClassId] = React.useState('')
  const [role, setRole] = React.useState('')
  const [classes, setClasses] = React.useState<Array<{ id: string; name: string }>>([])
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      const res = await getClassesForSelection()
      setClasses(res.classes)
    })()
  }, [])

  const onCreate = async () => {
    setSubmitting(true)
    try {
      await createAnnouncement({ title, body, scope, classId: scope === 'class' ? classId : undefined, role: scope === 'role' ? role : undefined })
      setTitle('')
      setBody('')
      setScope('school')
      setClassId('')
      setRole('')
      SuccessToast()
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-2 text-sm font-medium">New announcement</div>
        <div className="grid gap-2">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex items-center gap-2">
            <Select value={scope} onValueChange={(v) => setScope(v as any)}>
              <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Scope" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="class">Class</SelectItem>
                <SelectItem value="role">Role</SelectItem>
              </SelectContent>
            </Select>
            {scope === 'class' && (
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="h-8 w-56"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            )}
            {scope === 'role' && (
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="GUARDIAN">Guardian</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <Button size="sm" onClick={onCreate} disabled={submitting || !title || !body || (scope === 'class' && !classId) || (scope === 'role' && !role)}>Publish</Button>
        </div>
      </div>
    </div>
  )
}



