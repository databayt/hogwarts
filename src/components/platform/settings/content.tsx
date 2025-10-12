"use client";

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

import { SuccessToast, ErrorToast } from '@/components/atom/toast'
import { useSchool } from '@/components/platform/context/school-context'
import { updateSchoolSettings } from '@/app/[lang]/s/[subdomain]/(platform)/settings/actions'
import {
  supportedTimezones,
  getTimezoneDisplayName,
  getCurrentTimeInTimezone,
  type SupportedTimezone
} from './validation';
import { type Locale } from '@/components/internationalization/config'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export function SettingsContent({ dictionary, lang }: Props) {
  const { school } = useSchool()
  const [name, setName] = React.useState(school.name || '')
  const [timezone, setTimezone] = React.useState<SupportedTimezone>(
    (school.timezone as SupportedTimezone) || 'Africa/Khartoum'
  )
  const [locale, setLocale] = React.useState<'ar' | 'en'>(
    (school.locale as 'ar' | 'en') || 'ar'
  )
  const [logoUrl, setLogoUrl] = React.useState(school.logoUrl || '')
  const [submitting, setSubmitting] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState('')

  // Update current time in selected timezone
  React.useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getCurrentTimeInTimezone(timezone))
    }

    updateTime() // Initial update
    const interval = setInterval(updateTime, 1000) // Update every second

    return () => clearInterval(interval)
  }, [timezone])

  const onSubmit = async () => {
    setSubmitting(true)
    try {
      await updateSchoolSettings({ name, timezone, locale, logoUrl })
      SuccessToast("Settings updated successfully")
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : 'Failed to update settings')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="mb-1">School Settings</h3>
        <p className="text-sm text-muted-foreground">Configure your school's basic information and preferences</p>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="school-name" className="text-sm font-medium">
            School Name
          </Label>
          <Input
            id="school-name"
            placeholder="Enter school name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone" className="text-sm font-medium">
            Timezone
          </Label>
          <Select value={timezone} onValueChange={(value) => setTimezone(value as SupportedTimezone)}>
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Select timezone">
                {getTimezoneDisplayName(timezone)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {supportedTimezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  <div className="flex flex-col items-start">
                    <span>{getTimezoneDisplayName(tz)}</span>
                    <span className="text-xs text-gray-500">
                      Current time: {getCurrentTimeInTimezone(tz)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentTime && (
            <p className="text-xs text-muted-foreground">
              Current time in {getTimezoneDisplayName(timezone)}: <span className="font-mono">{currentTime}</span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="locale" className="text-sm font-medium">
            Language
          </Label>
          <Select value={locale} onValueChange={(value) => setLocale(value as 'ar' | 'en')}>
            <SelectTrigger id="locale">
              <SelectValue>
                {locale === 'ar' ? 'العربية (Arabic)' : 'English'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">العربية (Arabic)</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo-url" className="text-sm font-medium">
            Logo URL (Optional)
          </Label>
          <Input
            id="logo-url"
            type="url"
            placeholder="https://example.com/logo.png"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
          {logoUrl && (
            <p className="text-xs text-muted-foreground">
              Preview: <a href={logoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {logoUrl}
              </a>
            </p>
          )}
        </div>

        <Button
          onClick={onSubmit}
          disabled={submitting || !name.trim()}
          className="w-fit"
        >
          {submitting ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}








