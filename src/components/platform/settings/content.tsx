"use client";

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { SuccessToast, ErrorToast } from '@/components/atom/toast'
import { useSchool } from '@/components/platform/context/school-context'
import { updateSchoolSettings } from '@/app/[lang]/s/[subdomain]/(platform)/settings/actions';

export function SettingsContent() {
  const { school } = useSchool()
  const [name, setName] = React.useState(school.name || '')
  const [timezone, setTimezone] = React.useState(school.timezone || 'Africa/Khartoum')
  const [locale, setLocale] = React.useState<'ar' | 'en'>('ar')
  const [logoUrl, setLogoUrl] = React.useState(school.logoUrl || '')
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








