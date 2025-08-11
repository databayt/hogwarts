"use client";

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateSchoolSettings } from '@/app/school/dashboard/settings/actions'
import { SuccessToast, ErrorToast } from '@/components/atom/toast'

export function SettingsContent() {
  const [name, setName] = React.useState('')
  const [timezone, setTimezone] = React.useState('Africa/Khartoum')
  const [locale, setLocale] = React.useState<'ar' | 'en'>('ar')
  const [logoUrl, setLogoUrl] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const onSubmit = async () => {
    setSubmitting(true)
    try {
      await updateSchoolSettings({ name, timezone, locale, logoUrl })
      SuccessToast()
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 grid gap-2">
      <div className="text-sm font-medium">School Settings</div>
      <Input placeholder="School name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
      <Input placeholder="Locale (ar|en)" value={locale} onChange={(e) => setLocale(e.target.value as 'ar' | 'en')} />
      <Input placeholder="Logo URL" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
      <Button size="sm" onClick={onSubmit} disabled={submitting || !name}>Save</Button>
    </div>
  )
}







