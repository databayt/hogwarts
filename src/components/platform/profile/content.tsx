"use client";

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateProfile } from '@/components/platform/profile/actions'
import { SuccessToast, ErrorToast } from '@/components/atom/toast'
import { type Locale } from '@/components/internationalization/config'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export function ProfileContent({ dictionary, lang }: Props) {
  const [displayName, setDisplayName] = React.useState('')
  const [avatarUrl, setAvatarUrl] = React.useState('')
  const [locale, setLocale] = React.useState<'ar' | 'en'>('ar')
  const [submitting, setSubmitting] = React.useState(false)

  const onSubmit = async () => {
    setSubmitting(true)
    try {
      await updateProfile({ displayName, avatarUrl, locale })
      SuccessToast()
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 grid gap-2">
      <div className="text-sm font-medium">Profile</div>
      <Input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <Input placeholder="Avatar URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
      <Input placeholder="Locale (ar|en)" value={locale} onChange={(e) => setLocale(e.target.value as 'ar' | 'en')} />
      <Button size="sm" onClick={onSubmit} disabled={submitting || !displayName}>Save</Button>
    </div>
  )
}


